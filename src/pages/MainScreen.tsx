import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// 이미지 캐시 맵
const imageCache = new Map<string, HTMLImageElement>();

// 이미지 프리로딩 함수 (개선됨)
const preloadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    // 캐시에 이미 있으면 즉시 반환
    if (imageCache.has(src)) {
      resolve(imageCache.get(src)!);
      return;
    }

    const img = new Image();
    
    // 고품질 렌더링 설정
    img.style.imageRendering = 'high-quality';
    img.decoding = 'async';
    
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${src}`));
    };
    
    img.src = src;
  });
};

// 병렬 이미지 로딩 (우선순위별)
const preloadCriticalImages = async (): Promise<void> => {
  // 1순위: 스플래시 이미지
  const criticalImages = ['./splash.png', './festival_logo.png'];
  
  try {
    await Promise.allSettled(criticalImages.map(src => preloadImage(src)));
    console.log('✅ 중요 이미지 프리로딩 완료');
  } catch (error) {
    console.warn('⚠️ 중요 이미지 일부 로딩 실패:', error);
  }
};

const preloadSecondaryImages = async (): Promise<void> => {
  // 2순위: 다른 화면 이미지들
  const secondaryImages = [
    './payment.png',
    './qrscreen.png',
    './process.png',
    './complete.png'
  ];
  
  try {
    await Promise.allSettled(secondaryImages.map(src => preloadImage(src)));
    console.log('✅ 보조 이미지 프리로딩 완료');
  } catch (error) {
    console.warn('⚠️ 보조 이미지 일부 로딩 실패:', error);
  }
};

const preloadFrameImages = async (): Promise<void> => {
  // 3순위: 프레임 이미지들
  const frameImages = [
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
  ];
  
  try {
    await Promise.allSettled(frameImages.map(src => preloadImage(src)));
    console.log('✅ 프레임 이미지 프리로딩 완료');
  } catch (error) {
    console.warn('⚠️ 프레임 이미지 일부 로딩 실패:', error);
  }
};

const MainScreen = () => {
  const navigate = useNavigate();
  const [loadingStage, setLoadingStage] = useState<'initial' | 'critical' | 'secondary' | 'complete'>('initial');
  const [splashImageUrl, setSplashImageUrl] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [canInteract, setCanInteract] = useState(false);

  // 즉시 상호작용 가능한 최소 준비 완료 체크
  const enableInteraction = useCallback(() => {
    setCanInteract(true);
    console.log('🎯 사용자 상호작용 활성화');
  }, []);

  // 우선순위별 로딩 처리
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 앱 초기화 시작');
      
      // 즉시 로딩 표시
      setLoadingStage('initial');
      
      try {
        // 1단계: 중요 이미지만 먼저 로드 (빠른 표시용)
        setLoadingStage('critical');
        await preloadCriticalImages();
        
        // 스플래시 이미지 확인 및 설정
        if (imageCache.has('./splash.png')) {
          setSplashImageUrl('./splash.png');
        } else if (imageCache.has('./festival_logo.png')) {
          setSplashImageUrl('./festival_logo.png');
        } else {
          setShowFallback(true);
        }
        
        // 최소 준비 완료 - 사용자 상호작용 허용
        enableInteraction();
        
        // 2단계: 보조 이미지 백그라운드 로딩
        setLoadingStage('secondary');
        preloadSecondaryImages(); // await 없이 백그라운드 실행
        
        // 3단계: 프레임 이미지 백그라운드 로딩
        preloadFrameImages(); // await 없이 백그라운드 실행
        
        // 로딩 완료 표시
        setTimeout(() => {
          setLoadingStage('complete');
          console.log('🎉 앱 초기화 완료');
        }, 500);
        
      } catch (error) {
        console.error('앱 초기화 중 오류:', error);
        setShowFallback(true);
        enableInteraction(); // 오류가 있어도 상호작용 허용
      }
    };

    initializeApp();
  }, [enableInteraction]);

  // 클릭 이벤트 처리 (빠른 응답)
  useEffect(() => {
    if (!canInteract) return;

    const handleClickAnywhere = () => {
      console.log('🖱️ 화면 클릭 감지');
      navigate('/upload');
    };

    // 이벤트 리스너 등록
    const options = { passive: true, capture: true };
    window.addEventListener('click', handleClickAnywhere, options);
    window.addEventListener('touchstart', handleClickAnywhere, options);

    return () => {
      window.removeEventListener('click', handleClickAnywhere, options);
      window.removeEventListener('touchstart', handleClickAnywhere, options);
    };
  }, [navigate, canInteract]);

  // 로딩 상태별 표시 내용
  const getLoadingMessage = () => {
    switch (loadingStage) {
      case 'initial':
        return '시작 중...';
      case 'critical':
        return '화면 준비 중...';
      case 'secondary':
        return
      case 'complete':
        return '준비 완료!';
      default:
        return '로딩 중...';
    }
  };

  const getLoadingProgress = () => {
    switch (loadingStage) {
      case 'initial':
        return 10;
      case 'critical':
        return 40;
      case 'secondary':
        return 70;
      case 'complete':
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: canInteract ? 'pointer' : 'default',
        transition: 'cursor 0.3s ease',
      }}
    >
      {/* 메인 배경 이미지 */}
      {splashImageUrl && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${splashImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: loadingStage === 'complete' ? 1 : 0.8,
            transition: 'opacity 0.5s ease-in-out',
          }}
        />
      )}

      {/* 폴백 배경 (이미지 로드 실패시) */}
      {showFallback && !splashImageUrl && (
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
          }}
        >
          Be-My-Friends 키오스크
        </div>
      )}

      {/* 로딩 오버레이 (초기 로딩시에만 표시) */}
      {loadingStage !== 'complete' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '32px',
            fontWeight: '600',
            zIndex: 1000,
            backdropFilter: 'blur(2px)',
          }}
        >
          {/* 로딩 아이콘 */}
          <div
            style={{
              fontSize: '64px',
              marginBottom: '20px',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            📸
          </div>
          
          {/* 로딩 메시지 */}
          <div style={{ marginBottom: '30px' }}>
            {getLoadingMessage()}
          </div>
          
          {/* 프로그레스 바 */}
          <div
            style={{
              width: '300px',
              height: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                width: `${getLoadingProgress()}%`,
                height: '100%',
                backgroundColor: '#4ade80',
                borderRadius: '4px',
                transition: 'width 0.5s ease-out',
                boxShadow: '0 0 10px rgba(74, 222, 128, 0.5)',
              }}
            />
          </div>
          
          {/* 진행 퍼센트 */}
          <div style={{ fontSize: '18px', opacity: 0.8 }}>
            {getLoadingProgress()}%
          </div>
        </div>
      )}
    </div>
  );
};

export default MainScreen;