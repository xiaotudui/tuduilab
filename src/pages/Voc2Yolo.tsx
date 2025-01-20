import { useState } from 'react';

interface LogEntry {
  time: string;
  message: string;
  type?: 'success' | 'error' | 'warning';
}

// 默认VOC类别
const DEFAULT_VOC_CLASSES = [
  'aeroplane', 'bicycle', 'bird', 'boat', 'bottle',
  'bus', 'car', 'cat', 'chair', 'cow',
  'diningtable', 'dog', 'horse', 'motorbike', 'person',
  'pottedplant', 'sheep', 'sofa', 'train', 'tvmonitor'
];

export default function Voc2Yolo() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [vocPath, setVocPath] = useState<string>('');
  const [outputPath, setOutputPath] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [classes, setClasses] = useState<string[]>(DEFAULT_VOC_CLASSES);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [editingClass, setEditingClass] = useState<{index: number, value: string} | null>(null);
  const [useDefaultClasses, setUseDefaultClasses] = useState(true);

  const addLog = (message: string, type?: 'success' | 'error' | 'warning') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, message, type }]);
  };

  // 选择VOC数据集文件夹
  const handleFileSelect = async () => {
    addLog('正在选择VOC数据集文件夹...');
    try {
      const result = await window.electron.ipcRenderer.invoke('select-folder');
      if (result.success) {
        setVocPath(result.path);
        addLog(`已选择数据集文件夹: ${result.path}`, 'success');
        if (!useDefaultClasses) {
          await loadVOCClasses(result.path);
        }
      } else {
        addLog('文件夹选择已取消', 'warning');
      }
    } catch (error: any) {
      addLog(`选择文件夹时出错: ${error.message}`, 'error');
    }
  };

  // 选择输出目录
  const handleOutputDir = async () => {
    addLog('正在选择输出文件夹...');
    try {
      const result = await window.electron.ipcRenderer.invoke('select-folder');
      if (result.success) {
        setOutputPath(result.path);
        addLog(`已选择输出文件夹: ${result.path}`, 'success');
      } else {
        addLog('输出文件夹选择已取消', 'warning');
      }
    } catch (error: any) {
      addLog(`选择输出文件夹时出错: ${error.message}`, 'error');
    }
  };

  // 加载VOC类别
  const loadVOCClasses = async (path: string) => {
    setIsLoadingClasses(true);
    addLog('正在解析数据集类别...');
    try {
      const result = await window.electron.ipcRenderer.invoke('get-voc-classes', { vocPath: path });
      if (result.success) {
        setClasses(result.classes);
        addLog(`成功读取到 ${result.classes.length} 个类别`, 'success');
      } else {
        addLog(`解析类别失败：${result.error}`, 'error');
      }
    } catch (error: any) {
      addLog(`解析类别出错: ${error.message}`, 'error');
    } finally {
      setIsLoadingClasses(false);
    }
  };

  // 开始转换
  const handleConvert = async () => {
    if (!vocPath || !outputPath) {
      addLog('请先选择输入和输出文件夹', 'error');
      return;
    }

    setIsConverting(true);
    addLog('开始转换为YOLO格式...');
    try {
      const result = await window.electron.ipcRenderer.invoke('convert-voc-to-yolo', {
        vocPath,
        outputPath,
        classes
      });

      if (result.success) {
        addLog('转换成功！', 'success');
        addLog(`共处理 ${result.stats.total} 个文件`, 'success');
        addLog(`成功: ${result.stats.success} 个`, 'success');
        if (result.stats.failed > 0) {
          addLog(`失败: ${result.stats.failed} 个`, 'warning');
        }
      } else {
        addLog(`转换失败：${result.error}`, 'error');
      }
    } catch (error: any) {
      addLog(`转换过程出错: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsConverting(false);
    }
  };

  // 类别管理功能
  const handleClassEdit = (index: number, value: string) => {
    setEditingClass({ index, value });
  };

  const handleClassSave = (index: number, newValue: string) => {
    if (newValue.trim()) {
      const newClasses = [...classes];
      newClasses[index] = newValue.trim();
      setClasses(newClasses);
    }
    setEditingClass(null);
  };

  const handleAddClass = () => {
    setClasses([...classes, `class_${classes.length}`]);
    addLog('已添加新类别', 'success');
  };

  const handleDeleteClass = (index: number) => {
    const newClasses = classes.filter((_, i) => i !== index);
    setClasses(newClasses);
    addLog(`已删除类别: ${classes[index]}`, 'success');
  };

  const handleResetClasses = () => {
    setClasses(DEFAULT_VOC_CLASSES);
    addLog('已重置为默认VOC类别', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">VOC转YOLO格式转换器</h2>
        <p className="text-gray-600 dark:text-gray-400">将VOC格式的数据集转换为YOLO格式</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="mb-6">
          <div className="mb-2">
            <span className="font-medium">输入目录: </span>
            <span className="font-mono text-gray-600 dark:text-gray-400">{vocPath || '未选择'}</span>
          </div>
          <div>
            <span className="font-medium">输出目录: </span>
            <span className="font-mono text-gray-600 dark:text-gray-400">{outputPath || '未选择'}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleFileSelect}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
            disabled={isConverting}
          >
            <span>📁</span>
            选择VOC数据集
          </button>
          <button
            onClick={handleOutputDir}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
            disabled={isConverting}
          >
            <span>💾</span>
            选择输出目录
          </button>
          <button
            onClick={handleConvert}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            disabled={isConverting || !vocPath || !outputPath}
          >
            <span>🔄</span>
            {isConverting ? '转换中...' : '开始转换'}
          </button>
        </div>
      </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">数据集类别</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setUseDefaultClasses(!useDefaultClasses)}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                disabled={isConverting}
              >
                {useDefaultClasses ? '使用数据集类别' : '使用默认类别'}
              </button>
              <button
                onClick={handleResetClasses}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                disabled={isConverting}
              >
                重置类别
              </button>
              <button
                onClick={handleAddClass}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                disabled={isConverting}
              >
                添加类别
              </button>
            </div>
          </div>

          {isLoadingClasses ? (
            <div className="text-center py-4">正在加载类别...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {classes.map((cls, index) => (
                <div key={index} className="flex items-center bg-gray-50 dark:bg-gray-900 rounded-md p-2 gap-2">
                  <span className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm">{index}</span>
                  {editingClass?.index === index ? (
                    <input
                      type="text"
                      value={editingClass.value}
                      onChange={(e) => setEditingClass({ index, value: e.target.value })}
                      onBlur={() => handleClassSave(index, editingClass.value)}
                      className="flex-1 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-300 dark:border-gray-600"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="flex-1 cursor-pointer"
                      onClick={() => handleClassEdit(index, cls)}
                    >
                      {cls}
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteClass(index)}
                    className="text-red-500 hover:text-red-600 disabled:opacity-50"
                    disabled={isConverting}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">转换日志</h3>
        <div className="bg-gray-900 rounded-lg p-4 h-[300px] overflow-y-auto font-mono">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-4">等待操作...</div>
          ) : (
            logs.map((log, index) => (
              <div 
                key={index} 
                className={`mb-2 ${
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'warning' ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                <span className="text-gray-500">[{log.time}]</span>{' '}
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 