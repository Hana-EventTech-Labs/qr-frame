import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// import { kioskValidationService } from '../services/kioskValidationService'
// import { globalState } from '../services/globalState'

// 타입 선언 (사용하지 않지만 유지)
declare global {
  interface Window {
    electron?: {
      showMessageBox: (options: {
        type: 'error' | 'warning' | 'info' | 'question';
        title: string;
        message: string;
        buttons: string[];
      }) => Promise<any>;
    };
  }
}

const MainScreen = () => {
  const navigate = useNavigate()
  const [showContent, setShowContent] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    // 1초 후 컨텐츠 표시
    const contentTimer = setTimeout(() => {
      setShowContent(true)
    }, 1000)

    // 키오스크 검증 로직 주석 처리
    // validateKioskOnStart()

    return () => {
      clearTimeout(contentTimer)
    }
  }, [])

  // 키오스크 검증 함수들 주석 처리
  /*
  const validateKioskOnStart = async () => {
    try {
      console.log('🚀 키오스크 유효성 검증 시작...')
      // ... 검증 로직 ...
    } catch (error) {
      console.error('키오스크 검증 중 오류:', error)
    }
  }
  */

  const handleStartClick = () => {
    console.log('🎯 스플래시 화면에서 업로드 화면으로 이동')
    navigate('/upload')
  }

  // 이미지 로드 후 클릭으로 시작 가능
  useEffect(() => {
    if (imageLoaded && showContent) {
      const handleClickAnywhere = () => {
        navigate('/upload')
      }

      window.addEventListener('click', handleClickAnywhere)
      window.addEventListener('touchstart', handleClickAnywhere)

      return () => {
        window.removeEventListener('click', handleClickAnywhere)
        window.removeEventListener('touchstart', handleClickAnywhere)
      }
    }
  }, [navigate, imageLoaded, showContent])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: (imageLoaded && showContent) ? 'pointer' : 'default',
      }}
    >
      {/* 전체 화면 배경 이미지 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url(./splash.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: showContent ? 1 : 0,
          transition: 'opacity 1s ease-in-out',
        }}
        onLoad={() => setImageLoaded(true)}
      />

      {/* 백업 이미지 (splash.png가 없을 경우) */}
      <img
        src="./splash.png"
        alt="Splash Screen"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0,
          pointerEvents: 'none',
        }}
        onLoad={() => setImageLoaded(true)}
        onError={(e) => {
          // splash.png가 없으면 festival_logo.png 사용
          const target = e.target as HTMLImageElement;
          target.src = './festival_logo.png';
          console.log('splash.png를 찾을 수 없어 festival_logo.png를 사용합니다.');
          
          // festival_logo.png도 실패하면 기본 배경색 사용
          target.onerror = () => {
            const parent = target.parentElement;
            if (parent) {
              const fallbackDiv = document.createElement('div');
              fallbackDiv.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 48px;
                font-weight: bold;
                text-shadow: 0 4px 8px rgba(0,0,0,0.3);
              `;
              fallbackDiv.textContent = '포토카드 키오스크';
              parent.appendChild(fallbackDiv);
              setImageLoaded(true);
            }
          };
        }}
      />

      {/* 로딩 인디케이터 (이미지 로드 전까지 표시) */}
      {!imageLoaded && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: '32px',
            fontWeight: '600',
          }}
        >
          <div style={{
            animation: 'pulse 2s ease-in-out infinite',
            marginBottom: '20px',
          }}>
            🖼️
          </div>
          <div>이미지 로딩 중...</div>
        </div>
      )}



      {/* CSS 애니메이션 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.05); }
            100% { opacity: 1; transform: scale(1); }
          }
        `
      }} />
    </div>
  )
}

export default MainScreen