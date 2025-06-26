import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// 이미지 프리로딩 함수
const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

// 모든 이미지를 미리 로드하는 함수
const preloadAllImages = async () => {
  const images = [
    './splash.png',
    './payment.png',
    './qrscreen.png',
    './frames/frame1.jpg',
    './frames/frame2.jpg',
    './frames/frame3.jpg',
    './frames/frame4.jpg',
    './frames/frame5.jpg',
    './frames/frame6.jpg',
    './completed_frames/frame1_complete.jpg',
    './completed_frames/frame2_complete.jpg',
    './completed_frames/frame3_complete.jpg',
    './completed_frames/frame4_complete.jpg',
    './completed_frames/frame5_complete.jpg',
    './completed_frames/frame6_complete.jpg',
  ]

  try {
    await Promise.all(images.map(src => preloadImage(src)))
    console.log('✅ 모든 이미지 프리로딩 완료')
    return true
  } catch (error) {
    console.warn('⚠️ 일부 이미지 프리로딩 실패:', error)
    return true // 실패해도 진행
  }
}

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
    imagesPreloaded?: boolean;
  }
}

const MainScreen = () => {
  const navigate = useNavigate()
  const [showContent, setShowContent] = useState(false)
  const [imagesReady, setImagesReady] = useState(false)
  const [splashImageExists, setSplashImageExists] = useState(true)

  useEffect(() => {
    // 이미지 프리로딩 및 초기화
    const initializeApp = async () => {
      try {
        // 전역에서 한 번만 프리로딩 실행
        if (!window.imagesPreloaded) {
          console.log('🖼️ 앱 시작 - 모든 이미지 프리로딩 시작...')
          await preloadAllImages()
          window.imagesPreloaded = true
        }
        
        // 이미지 준비 완료
        setImagesReady(true)
        
        // 0.5초 후 컨텐츠 표시 (프리로딩 후 빠른 표시)
        setTimeout(() => {
          setShowContent(true)
        }, 500)
        
      } catch (error) {
        console.error('앱 초기화 중 오류:', error)
        // 에러가 있어도 진행
        setImagesReady(true)
        setShowContent(true)
      }
    }

    initializeApp()

    // 키오스크 검증 로직 주석 처리
    // validateKioskOnStart()
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

  // 이미지 준비 후 클릭으로 시작 가능
  useEffect(() => {
    if (imagesReady && showContent) {
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
  }, [navigate, imagesReady, showContent])

  // splash.png 존재 여부 확인
  useEffect(() => {
    const checkSplashImage = async () => {
      try {
        await preloadImage('./splash.png')
        setSplashImageExists(true)
      } catch {
        console.log('splash.png를 찾을 수 없어 festival_logo.png를 사용합니다.')
        setSplashImageExists(false)
      }
    }
    
    if (!window.imagesPreloaded) {
      checkSplashImage()
    }
  }, [])

  // 배경 이미지 결정
  const getBackgroundImage = () => {
    if (splashImageExists) {
      return 'url(./splash.png)'
    } else {
      return 'url(./festival_logo.png)'
    }
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: (imagesReady && showContent) ? 'pointer' : 'default',
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
          backgroundImage: imagesReady ? getBackgroundImage() : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: (imagesReady && showContent) ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out',
        }}
      />

      {/* splash.png와 festival_logo.png 모두 실패할 경우 폴백 */}
      {!splashImageExists && imagesReady && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '48px',
            fontWeight: 'bold',
            textShadow: '0 4px 8px rgba(0,0,0,0.3)',
            opacity: showContent ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
          }}
        >
          포토카드 키오스크
        </div>
      )}

      {/* 로딩 인디케이터 (이미지 준비 전까지 표시) */}
      {!imagesReady && (
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
            zIndex: 1000,
          }}
        >
          <div style={{
            animation: 'pulse 2s ease-in-out infinite',
            marginBottom: '20px',
          }}>
            🖼️
          </div>
          <div>앱 준비 중...</div>
        </div>
      )}
    </div>
  )
}

export default MainScreen