// src/App.tsx
import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import MainScreen from './pages/MainScreen'
import QRCodeScreen from './pages/QRCodeScreen'
import FrameSelectionScreen from './pages/FrameSelectionScreen'
import PaymentScreen from './pages/PaymentScreen'
import PrintingScreen from './pages/PrintingScreen'
import CompleteScreen from './pages/CompleteScreen'
import AdminExitButton from './components/AdminExitButton'
import KioskInitializer from './components/KioskInitializer'

function App() {
  const [isKioskReady, setIsKioskReady] = useState(false)
  const [, setKioskError] = useState<string | null>(null)

  const handleInitComplete = () => {
    console.log('✅ 키오스크 초기화 완료 - 메인 앱 시작')
    setIsKioskReady(true)
    setKioskError(null)
  }

  const handleInitError = (error: string) => {
    console.error('❌ 키오스크 초기화 실패:', error)
    setKioskError(error)
    setIsKioskReady(false)
  }

  // 키오스크 검증 완료 전에는 초기화 화면만 표시
  if (!isKioskReady) {
    return (
      <div className="app-container" style={{
        position: 'relative',
        overflow: 'hidden',
        width: '1080px',
        height: '1920px',
        maxWidth: '100%',
        maxHeight: '100%',
      }}>
        <KioskInitializer 
          onInitComplete={handleInitComplete}
          onInitError={handleInitError}
        />
        <AdminExitButton />
      </div>
    )
  }

  // 키오스크 검증 완료 후 메인 앱 표시
  return (
    <div className="app-container" style={{
      position: 'relative',
      overflow: 'hidden',
      width: '1080px',
      height: '1920px',
      maxWidth: '100%',
      maxHeight: '100%',
    }}>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/upload" element={<QRCodeScreen />} />
        <Route path="/frame" element={<FrameSelectionScreen />} />
        <Route path="/payment" element={<PaymentScreen />} />
        <Route path="/printing" element={<PrintingScreen />} />
        <Route path="/complete" element={<CompleteScreen />} />
      </Routes>
      
      <AdminExitButton />
    </div>
  )
}

export default App