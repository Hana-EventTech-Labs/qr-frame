import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom' // BrowserRouter 대신 HashRouter 사용
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter> {/* BrowserRouter 대신 HashRouter 사용 */}
      <App />
    </HashRouter>
  </React.StrictMode>,
)