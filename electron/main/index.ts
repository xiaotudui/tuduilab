import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { update } from './update'
import fs from 'node:fs'
import { promisify } from 'node:util'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

// Add these utility functions
const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)

// Add XML parsing function
function parseVOCXML(xmlContent: string) {
  const getNodeText = (xml: string, tag: string): string => {
    const regex = new RegExp(`<${tag}>([^<]+)</${tag}>`);
    const match = xml.match(regex);
    return match ? match[1] : '';
  };

  const width = getNodeText(xmlContent, 'width');
  const height = getNodeText(xmlContent, 'height');
  const objects: any[] = [];
  const objectRegex = /<object>([\s\S]*?)<\/object>/g;
  let match;

  while ((match = objectRegex.exec(xmlContent)) !== null) {
    const objectXml = match[1];
    const name = getNodeText(objectXml, 'name');
    const bndboxRegex = /<bndbox>([\s\S]*?)<\/bndbox>/;
    const bndboxMatch = objectXml.match(bndboxRegex);

    if (name && bndboxMatch) {
      const bndboxXml = bndboxMatch[1];
      objects.push({
        name,
        bndbox: {
          xmin: getNodeText(bndboxXml, 'xmin'),
          ymin: getNodeText(bndboxXml, 'ymin'),
          xmax: getNodeText(bndboxXml, 'xmax'),
          ymax: getNodeText(bndboxXml, 'ymax'),
        }
      });
    }
  }

  return { size: { width, height }, objects };
}

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Auto update
  update(win)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

// 添加 IPC 处理器
ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    return {
      success: !result.canceled,
      path: result.filePaths[0]
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Unknown error'
    };
  }
});

ipcMain.handle('get-voc-classes', async (event, { vocPath }) => {
  try {
    // 这里添加获取VOC类别的逻辑
    return {
      success: true,
      classes: [] // 返回解析到的类别
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Update the convert-voc-to-yolo handler
ipcMain.handle('convert-voc-to-yolo', async (event, { vocPath, outputPath, classes }) => {
  try {
    const stats = {
      total: 0,
      success: 0,
      failed: 0
    };

    // Create output directory
    await mkdir(outputPath, { recursive: true });

    // Get XML files list
    const files = await readdir(vocPath);
    const xmlFiles = files.filter(file => file.endsWith('.xml'));
    stats.total = xmlFiles.length;

    // Process each XML file
    for (const xmlFile of xmlFiles) {
      try {
        const baseName = path.basename(xmlFile, '.xml');
        const xmlPath = path.join(vocPath, xmlFile);
        const xmlContent = await readFile(xmlPath, 'utf-8');
        const result = parseVOCXML(xmlContent);

        const imageWidth = parseFloat(result.size.width);
        const imageHeight = parseFloat(result.size.height);
        const yoloAnnotations: string[] = [];

        result.objects.forEach(obj => {
          const classIndex = classes.indexOf(obj.name);
          if (classIndex !== -1) {
            const bbox = obj.bndbox;
            const xmin = parseFloat(bbox.xmin);
            const ymin = parseFloat(bbox.ymin);
            const xmax = parseFloat(bbox.xmax);
            const ymax = parseFloat(bbox.ymax);

            // Convert to YOLO format (x_center, y_center, width, height)
            const x_center = (xmin + xmax) / (2.0 * imageWidth);
            const y_center = (ymin + ymax) / (2.0 * imageHeight);
            const width = (xmax - xmin) / imageWidth;
            const height = (ymax - ymin) / imageHeight;

            yoloAnnotations.push(
              `${classIndex} ${x_center.toFixed(6)} ${y_center.toFixed(6)} ${width.toFixed(6)} ${height.toFixed(6)}`
            );
          }
        });

        if (yoloAnnotations.length > 0) {
          await writeFile(
            path.join(outputPath, `${baseName}.txt`),
            yoloAnnotations.join('\n'),
            'utf-8'
          );
          stats.success++;
        }
      } catch (error) {
        stats.failed++;
        console.error(`Error processing ${xmlFile}:`, error);
      }
    }

    return { success: true, stats };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Unknown error'
    };
  }
});

// 添加新的IPC处理函数
ipcMain.handle('select-json-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'JSON Files', extensions: ['json'] }
    ]
  });

  return {
    success: !result.canceled,
    path: result.filePaths[0]
  };
});

ipcMain.handle('get-coco-classes', async (event, { cocoPath }) => {
  try {
    const cocoData = JSON.parse(await fs.readFile(cocoPath, 'utf8'));
    if (!cocoData.categories || !Array.isArray(cocoData.categories)) {
      return { 
        success: false, 
        error: 'COCO文件中未找到有效的类别信息' 
      };
    }
    
    // 按id排序类别
    const sortedCategories = [...cocoData.categories].sort((a, b) => a.id - b.id);
    const classes = sortedCategories.map(cat => cat.name);
    
    return { 
      success: true, 
      classes,
      categoryIds: sortedCategories.map(cat => cat.id) // 保存原始id便于后续转换
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message 
    };
  }
});

ipcMain.handle('convert-coco-to-yolo', async (event, { cocoPath, outputPath, classes }) => {
  try {
    const cocoData = JSON.parse(await fs.readFile(cocoPath, 'utf8'));
    let success = 0;
    let failed = 0;
    
    // 创建输出目录
    await fs.mkdir(outputPath, { recursive: true });
    
    // 创建classes.txt
    await fs.writeFile(path.join(outputPath, 'classes.txt'), classes.join('\n'));
    
    // 处理每个图片的标注
    for (const image of cocoData.images) {
      const annotations = cocoData.annotations.filter((ann: any) => ann.image_id === image.id);
      const labelPath = path.join(outputPath, path.basename(image.file_name).replace(/\.[^/.]+$/, '.txt'));
      
      try {
        const labels = annotations.map((ann: any) => {
          const categoryId = classes.indexOf(cocoData.categories.find((cat: any) => cat.id === ann.category_id).name);
          const [x, y, w, h] = ann.bbox;
          // 转换为YOLO格式（归一化坐标）
          const x_center = (x + w/2) / image.width;
          const y_center = (y + h/2) / image.height;
          const width = w / image.width;
          const height = h / image.height;
          return `${categoryId} ${x_center} ${y_center} ${width} ${height}`;
        });
        
        await fs.writeFile(labelPath, labels.join('\n'));
        success++;
      } catch (err) {
        failed++;
      }
    }
    
    return {
      success: true,
      stats: {
        total: cocoData.images.length,
        success,
        failed
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
