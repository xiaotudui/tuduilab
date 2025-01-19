import React from 'react'
import logoVite from '../assets/logo2.svg'

export default function Header() {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <img src={logoVite} className="header-logo" alt="Logo" />
          <span className="header-title">土堆实验室</span>
        </div>
        
        <nav className="header-nav">
          <a href="/" className="nav-link">首页</a>
          <a href="/tools" className="nav-link">工具</a>
          <a href="/docs" className="nav-link">文档</a>
          <a href="/about" className="nav-link">关于</a>
        </nav>
      </div>
    </header>
  )
} 