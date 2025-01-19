import React from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'

export default function ImageTools() {
  const navigate = useNavigate()

  return (
    <>
      <div className="page-container">
        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          ← 返回主页
        </button>
        
        <h2>图片处理工具</h2>
        <div className="tool-content">
          {/* 这里添加图片处理的具体功能 */}
        </div>
      </div>
      <Footer />
    </>
  )
} 