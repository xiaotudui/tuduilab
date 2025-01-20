import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import JsonFormatter from './pages/JsonFormatter';
import ImageConverter from './pages/ImageConverter';
import Home from './pages/Home'; // 我们需要创建这个组件
import UpdateElectron from '@/components/update'
import Footer from './components/Footer'
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
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home tools={tools} />} />
        <Route path="/tools/json" element={<JsonFormatter />} />
        <Route path="/tools/image" element={<ImageConverter />} />
        {/* 添加其他工具路由 */}
      </Routes>
    </Router>
  );
}

export default App;