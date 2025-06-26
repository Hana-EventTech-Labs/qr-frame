import { Routes, Route } from 'react-router-dom'
import MainScreen from './pages/MainScreen'
import QRCodeScreen from './pages/QRCodeScreen'
import FrameSelectionScreen from './pages/FrameSelectionScreen'
import PaymentScreen from './pages/PaymentScreen' // 🔥 결제 화면 추가
import PrintingScreen from './pages/PrintingScreen'
import CompleteScreen from './pages/CompleteScreen'
import AdminExitButton from './components/AdminExitButton' // 🔐 관리자 종료 버튼 추가

function App() {
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
        <Route path="/payment" element={<PaymentScreen />} /> {/* 🔥 결제 라우트 추가 */}
        <Route path="/printing" element={<PrintingScreen />} />
        <Route path="/complete" element={<CompleteScreen />} />
      </Routes>
      
      {/* 🔐 모든 화면에서 사용 가능한 관리자 종료 버튼 */}
      <AdminExitButton />
    </div>
  )
}

export default App