import { useState } from 'react'
import UpdateElectron from '@/components/update'
import Footer from './components/Footer'
import Header from './components/Header'
import logoVite from './assets/logo2.svg'
import logoElectron from './assets/logo-electron.svg'
import './App.css'

// 定义工具卡片的类型
interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
}

// 工具列表数据
const tools: Tool[] = [
  {
    id: 'json-formatter',
    title: 'JSON 格式化',
    description: '在线 JSON 格式化工具，支持压缩和美化',
    icon: '🔧',
    path: '/tools/json'
  },
  {
    id: 'image-converter',
    title: '图片转换器',
    description: '支持多种格式图片转换，压缩优化',
    icon: '🖼️',
    path: '/tools/image'
  },
  {
    id: 'markdown-editor',
    title: 'Markdown 编辑器',
    description: '在线 Markdown 编辑预览工具',
    icon: '📝',
    path: '/tools/markdown'
  },
  {
    id: 'code-formatter',
    title: '代码格式化',
    description: '支持多种语言的代码格式化工具',
    icon: '💻',
    path: '/tools/code'
  },
  // 可以继续添加更多工具...
];

function App() {
  const [count, setCount] = useState(0)
  return (
    <>
      <Header />
      <div className='app-container'>
        <h1 className='text-3xl font-bold text-center mb-8'>土堆工具箱</h1>
        <div className='tools-grid'>
          {tools.map((tool) => (
            <a 
              key={tool.id}
              href={tool.path}
              className='tool-card'
            >
              <div className='tool-icon'>{tool.icon}</div>
              <h2 className='tool-title'>{tool.title}</h2>
              <p className='tool-description'>{tool.description}</p>
            </a>
          ))}
        </div>
      </div>
    </>
  )
}

export default App