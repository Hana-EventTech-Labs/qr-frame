import { useEffect, useState, CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'

const CompleteScreen = () => {
  const navigate = useNavigate()
  const [backgroundLoaded, setBackgroundLoaded] = useState(false)

  useEffect(() => {
    // 프리로딩된 이미지가 있으면 즉시 표시
    if (window.imagesPreloaded) {
      setBackgroundLoaded(true)
    } else {
      // 프리로딩이 안된 경우 직접 로드
      const img = new Image()
      img.onload = () => setBackgroundLoaded(true)
      img.onerror = () => setBackgroundLoaded(true) // 실패해도 진행
      img.src = './complete.png'
    }

    const timer = setTimeout(() => {
      navigate('/')
    }, 3000) // 3초 후 메인으로

    return () => clearTimeout(timer)
  }, [navigate])

  // 스타일 정의
  const containerStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  }

  const backgroundStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: 'url(./complete.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: backgroundLoaded ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
  }






  return (
    <div style={containerStyle}>
      {/* 애니메이션 CSS */}
      <style>
        {`
          @keyframes pop-in {
            0% { opacity: 0; transform: scale(0.8); }
            70% { transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
          }
          
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.9; transform: scale(1.03); }
            100% { opacity: 1; transform: scale(1); }
          }
          
          @keyframes fade-in {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      {/* 배경 이미지 */}
      <div style={backgroundStyle} />

      {/* 로딩 인디케이터 */}
      {!backgroundLoaded && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#059669',
            fontSize: '32px',
            fontWeight: '600',
            zIndex: 1000,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✨</div>
            화면 준비 중...
          </div>
        </div>
      )}

      {/* 메인 컨텐츠는 배경만 표시 */}
    </div>
  )
}

export default CompleteScreen