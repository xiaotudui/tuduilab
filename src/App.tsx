import { useState } from 'react'
import UpdateElectron from '@/components/update'
import Footer from './components/Footer'
import Header from './components/Header'
import logoVite from './assets/logo2.svg'
import logoElectron from './assets/logo-electron.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  return (
    <>
      <Header />
      <div className='App'>
        <h1>土堆实验室</h1>
        <p className='read-the-docs'>
          提供更多有用的工具来简化一些处理。
        </p>
        <div className='card'>
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            Edit <code>src/App.tsx</code> and save to test HMR
          </p>
        </div>
        <p className='read-the-docs'>
          Click on the Electron + Vite logo to learn more
        </p>
        <div className='flex-center'>
          Place static files into the<code>/public</code> folder <img style={{ width: '5em' }} src='./node.svg' alt='Node logo' />
        </div>
        <UpdateElectron />
      </div>
    </>
  )
}

export default App