import { useState, useEffect, CSSProperties } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

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
  } catch (error) {
    console.warn('⚠️ 일부 이미지 프리로딩 실패:', error)
  }
}

// Window 인터페이스를 명시적으로 확장
declare global {
  interface Window {
    electronAPI?: {
      closeApp?: () => void;
      sendPaymentRequest?: (data: any) => Promise<any>;
      showMessageBox?: (options: {
        type: 'error' | 'warning' | 'info' | 'question';
        title: string;
        message: string;
        buttons: string[];
      }) => Promise<any>;
    };
    imagesPreloaded?: boolean;
  }
}

const PaymentScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()

  type PaymentStatus = 'preparing' | 'processing' | 'success' | 'failed'
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('preparing')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [imagesReady, setImagesReady] = useState(false)

  const FIXED_AMOUNT = 5000 // 고정 금액

  useEffect(() => {
    // 전달받은 데이터 확인
    if (!location.state?.uploadedImage) {
      console.error('❌ 결제 화면: 필요한 데이터가 없습니다.')
      navigate('/upload')
    }

    // 이미지 프리로딩 (전역에서 한 번만 실행)
    const initializeImages = async () => {
      if (!window.imagesPreloaded) {
        console.log('🖼️ 이미지 프리로딩 시작...')
        await preloadAllImages()
        window.imagesPreloaded = true
      }
      setImagesReady(true) // 프리로딩 완료되면 즉시 표시
    }

    initializeImages()
  }, [location.state, navigate])

  // 이미지 로딩 완료 후 바로 결제 시작
  useEffect(() => {
    if (!imagesReady) return

    // 약간의 딜레이 후 바로 결제 시작 (UI 안정화를 위해)
    const timer = setTimeout(() => {
      handleAutoPayment()
    }, 500)

    return () => clearTimeout(timer)
  }, [imagesReady])

  // KS_NET 결제 요청 메시지 생성
  const buildPaymentRequest = () => {
    // 실제 KSCAT 설정 정보 사용
    const reqMessage = "AP0452IC010200NAT0416478A    000000000000                                                                                                                                                       00000000005000000000000000000000000091000000000913000000000000                                                                                                                                                                                                       X"
    return reqMessage
  }

  const handleAutoPayment = async () => {
    setPaymentStatus('processing')
    setErrorMessage(null)

    try {
      // ✅ 개발 모드에서는 실제 결제 대신 가상 처리
      if (process.env.NODE_ENV === 'development') {
        console.log('💻 [DEV] 개발 모드: 가상 결제 성공 처리')
        setPaymentStatus('success')
        setTimeout(() => {
          if (!isNavigating) {
            setIsNavigating(true)
            navigate('/printing', {
              state: {
                uploadedImage: location.state.uploadedImage,
                imageType: location.state.imageType,
                selectedFrame: location.state.selectedFrame,
                paymentCompleted: true,
                paymentResult: { RES: '0000', MSG: '가상 결제 성공' },
              },
            })
          }
        }, 2000)
        return // 실제 결제 로직 실행 안 함
      }

      console.log('💳 KS_NET 결제 요청 시작...')
      const requestData = { REQ: buildPaymentRequest() }
      console.log('💳 요청 데이터:', requestData)

      const electronAPI = window.electronAPI
      if (!electronAPI?.sendPaymentRequest) {
        throw new Error('Electron API를 사용할 수 없습니다.')
      }

      const result = await electronAPI.sendPaymentRequest(requestData)

      console.log('💳 결제 응답 전체:', result)

      if (result?.RES) {
        const responseCode = result.RES
        console.log('💳 응답 코드:', responseCode)

        if (responseCode === '0000' || responseCode === '00') {
          console.log('✅ 결제 성공 - 응답코드:', responseCode)
          setPaymentStatus('success')

          setTimeout(() => {
            if (!isNavigating) {
              setIsNavigating(true)
              navigate('/printing', {
                state: {
                  uploadedImage: location.state.uploadedImage,
                  imageType: location.state.imageType,
                  selectedFrame: location.state.selectedFrame,
                  paymentCompleted: true,
                  paymentResult: result,
                },
              })
            }
          }, 2000)
        } else {
          const errorMsg = result.MSG || `결제 실패 (코드: ${responseCode})`
          console.error('❌ 결제 실패 - 응답코드:', responseCode, '메시지:', errorMsg)
          throw new Error(errorMsg)
        }
      } else if (result?.error) {
        console.error('💳 통신 오류:', result.error)
        throw new Error(`통신 오류: ${result.error}`)
      } else {
        console.error('💳 예상치 못한 응답:', result)
        throw new Error('예상치 못한 응답 형태입니다.')
      }
    } catch (error) {
      console.error('❌ 결제 실패:', error)
      setPaymentStatus('failed')
      const errorMsg = error instanceof Error ? error.message : '결제 중 오류가 발생했습니다.'
      setErrorMessage(errorMsg)
    }
  }

  // 이전으로 돌아가기
  const handleGoBack = () => {
    if (isNavigating) return
    setIsNavigating(true)

    // imageType이 'frame'이면 QR 화면으로, 'photo'면 프레임 선택 화면으로
    if (location.state?.imageType === 'frame') {
      navigate('/upload') // 완성된 프레임 선택한 경우 QR 화면으로
    } else {
      navigate('/frame', { state: location.state }) // 사진 업로드한 경우 프레임 선택 화면으로
    }
  }

  // 처음으로 돌아가기
  const handleGoToMain = () => {
    if (isNavigating) return
    setIsNavigating(true)
    navigate('/')
  }

  // 다시 시도
  const handleRetry = () => {
    setPaymentStatus('preparing')
    setErrorMessage(null)
  }

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
    backgroundImage: 'url(./payment.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: imagesReady ? 1 : 0,
    transition: imagesReady ? 'opacity 0.3s ease-in-out' : 'none',
  }

  // 반투명 오버레이
  const overlayStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(2px)',
    zIndex: 1,
  }

  const contentWrapperStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  }

  const paymentBoxStyle: CSSProperties = {
    backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
    borderRadius: '32px',
    padding: '80px 60px',
    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    border: '3px solid rgba(245, 158, 11, 0.3)',
    maxWidth: '700px',
    width: '90%',
    textAlign: 'center',
    backdropFilter: 'blur(20px)',
    position: 'relative',
  }

  const amountStyle: CSSProperties = {
    fontSize: '84px',
    fontWeight: 'bold',
    marginBottom: '30px',
    backgroundImage: 'linear-gradient(135deg, #f59e0b, #d97706)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    textShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    letterSpacing: '-2px',
  }

  const instructionStyle: CSSProperties = {
    fontSize: '36px',
    marginBottom: '50px',
    lineHeight: '1.5',
    color: '#374151',
    fontWeight: '600',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  }

  const statusIconStyle: CSSProperties = {
    fontSize: '120px',
    marginBottom: '30px',
    filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2))',
  }

  const buttonStyle: CSSProperties = {
    padding: '24px 48px',
    borderRadius: '20px',
    fontSize: '26px',
    fontWeight: 'bold',
    border: 'none',
    minWidth: '220px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    margin: '0 20px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
    position: 'relative',
    overflow: 'hidden',
  }

  const backButtonStyle: CSSProperties = {
    ...buttonStyle,
    backgroundImage: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
    color: '#374151',
    border: '2px solid #d1d5db',
  }

  const retryButtonStyle: CSSProperties = {
    ...buttonStyle,
    backgroundImage: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: 'white',
    border: '2px solid #ef4444',
  }

  const countdownStyle: CSSProperties = {
    fontSize: '28px',
    fontWeight: '600',
    color: '#6b7280',
    marginTop: '20px',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  }

  // 상태별 렌더링
  const renderPaymentContent = () => {
    switch (paymentStatus) {
      case 'preparing':
        return (
          <>
            <div style={statusIconStyle}>💳</div>
            <div style={amountStyle}>₩{FIXED_AMOUNT.toLocaleString()}</div>
            <div style={instructionStyle}>
              결제를 진행합니다.<br />
              카드를 단말기에 삽입하거나 접촉해 주세요.
            </div>
            <div style={countdownStyle}>
              잠시만 기다려주세요...
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '40px' }}>
              <button
                onClick={handleGoBack}
                style={backButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                이전으로
              </button>
            </div>
          </>
        )

      case 'processing':
        return (
          <>
            <div style={{ ...statusIconStyle, animation: 'spin 2s linear infinite' }}>⏳</div>
            <div style={amountStyle}>₩{FIXED_AMOUNT.toLocaleString()}</div>
            <div style={instructionStyle}>
              결제 진행 중입니다...<br />
              카드를 단말기에서 제거하지 마세요.
            </div>
          </>
        )

      case 'success':
        return (
          <>
            <div style={statusIconStyle}>✅</div>
            <div style={{ ...amountStyle, backgroundImage: 'linear-gradient(135deg, #10b981, #059669)' }}>
              결제 완료!
            </div>
            <div style={instructionStyle}>
              결제가 성공적으로 완료되었습니다.<br />
              포토카드 인쇄를 진행합니다.
            </div>
          </>
        )

      case 'failed':
        return (
          <>
            <div style={statusIconStyle}>❌</div>
            <div style={{ ...amountStyle, backgroundImage: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
              결제 실패
            </div>
            <div style={instructionStyle}>
              {errorMessage || '결제 중 오류가 발생했습니다.'}<br />
              다시 시도해 주세요.
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '40px' }}>
              <button
                onClick={handleGoToMain}
                style={backButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                처음으로
              </button>
              <button
                onClick={handleRetry}
                style={retryButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(239, 68, 68, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                다시 시도
              </button>
            </div>
          </>
        )
    }
  }

  return (
    <div style={containerStyle}>
      {/* 애니메이션 CSS */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.9; transform: scale(1.05); }
          }
          
          @keyframes shimmer {
            0% { background-position: -200px 0; }
            100% { background-position: 200px 0; }
          }
          
          .shimmer-effect {
            backgroundImage: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            backgroundSize: 200px 100%;
            animation: shimmer 2s infinite;
          }
        `}
      </style>

      {/* 배경 이미지 */}
      <div style={backgroundStyle} />
      
      {/* 반투명 오버레이 */}
      <div style={overlayStyle} />

      {/* 로딩 인디케이터 */}
      {!imagesReady && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'linear-gradient(135deg, #fefbf7 0%, #fef3e2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#92400e',
            fontSize: '32px',
            fontWeight: '600',
            zIndex: 1000,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px', animation: 'pulse 2s infinite' }}>⏳</div>
            화면 준비 중...
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div style={contentWrapperStyle}>
        <div style={paymentBoxStyle} className="shimmer-effect">
          {/* 장식 요소 */}
          <div style={{
            position: 'absolute',
            top: '-10px',
            left: '-10px',
            right: '-10px',
            bottom: '-10px',
            backgroundImage: 'linear-gradient(45deg, #f59e0b, #d97706, #f59e0b)',
            borderRadius: '36px',
            zIndex: -1,
            opacity: 0.1,
          }} />
          
          {renderPaymentContent()}
        </div>
      </div>
    </div>
  )
}

export default PaymentScreen