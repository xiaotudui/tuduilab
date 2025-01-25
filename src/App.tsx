import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Voc2Yolo from './pages/Voc2Yolo';
import Coco2Yolo from './pages/Coco2Yolo';
import UpdateElectron from '@/components/update'
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
    id: 'voc2yolo',
    title: 'VOC转YOLO格式转换器',
    description: '提供VOC标注格式转YOLO标注格式工具',
    icon: '🔧',
    path: '/Voc2Yolo'
  },
  {
    id: 'coco2yolo',
    title: 'COCO转YOLO格式转换器',
    description: '提供COCO标注格式转YOLO标注格式工具',
    icon: '🔧',
    path: '/coco2yolo'
  },
  // 可以继续添加更多工具...
];

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home tools={tools} />} />
        <Route path="/voc2yolo" element={<Voc2Yolo />} />
        <Route path="/coco2yolo" element={<Coco2Yolo />} />
        {/* 添加其他工具路由 */}
      </Routes>
    </Router>
  );
}

export default App;