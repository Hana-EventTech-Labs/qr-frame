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
    electronAPI: ElectronAPI;
    imagesPreloaded?: boolean;
  }
}

const PaymentScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()

  type PaymentStatus = 'waiting' | 'processing' | 'success' | 'failed'
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('waiting')
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

  // KS_NET 결제 요청 메시지 생성
  const buildPaymentRequest = () => {
    // 실제 KSCAT 설정 정보 사용
    const reqMessage = "AP0452IC010200NAT0416478A    000000000000                                                                                                                                                       00000000005000000000000000000000000091000000000913000000000000                                                                                                                                                                                                       X"
    return reqMessage
  }

  const handlePayment = async () => {
    if (isProcessing) return;

    setPaymentStatus('processing');
    setErrorMessage(null);

    try {
      // ✅ 개발 모드에서는 실제 결제 대신 가상 처리
      if (process.env.NODE_ENV === 'development') {
        console.log('💻 [DEV] 개발 모드: 가상 결제 성공 처리');
        setPaymentStatus('success');
        setTimeout(() => {
          if (!isNavigating) {
            setIsNavigating(true);
            navigate('/printing', {
              state: {
                uploadedImage: location.state.uploadedImage,
                imageType: location.state.imageType,
                selectedFrame: location.state.selectedFrame,
                paymentCompleted: true,
                paymentResult: { RES: '0000', MSG: '가상 결제 성공' },
              },
            });
          }
        }, 2000);
        return; // 실제 결제 로직 실행 안 함
      }

      console.log('💳 KS_NET 결제 요청 시작...');
      const requestData = { REQ: buildPaymentRequest() };
      console.log('💳 요청 데이터:', requestData);

      const electronAPI = window.electronAPI;
      if (!electronAPI) {
        throw new Error('Electron API를 사용할 수 없습니다.');
      }

      const result = await electronAPI.sendPaymentRequest(requestData);

      console.log('💳 결제 응답 전체:', result);

      if (result?.RES) {
        const responseCode = result.RES;
        console.log('💳 응답 코드:', responseCode);

        if (responseCode === '0000' || responseCode === '00') {
          console.log('✅ 결제 성공 - 응답코드:', responseCode);
          setPaymentStatus('success');

          setTimeout(() => {
            if (!isNavigating) {
              setIsNavigating(true);
              navigate('/printing', {
                state: {
                  uploadedImage: location.state.uploadedImage,
                  imageType: location.state.imageType,
                  selectedFrame: location.state.selectedFrame,
                  paymentCompleted: true,
                  paymentResult: result,
                },
              });
            }
          }, 2000);
        } else {
          const errorMsg = result.MSG || `결제 실패 (코드: ${responseCode})`;
          console.error('❌ 결제 실패 - 응답코드:', responseCode, '메시지:', errorMsg);
          throw new Error(errorMsg);
        }
      } else if (result?.error) {
        console.error('💳 통신 오류:', result.error);
        throw new Error(`통신 오류: ${result.error}`);
      } else {
        console.error('💳 예상치 못한 응답:', result);
        throw new Error('예상치 못한 응답 형태입니다.');
      }
    } catch (error) {
      console.error('❌ 결제 실패:', error);
      setPaymentStatus('failed');
      const errorMsg = error instanceof Error ? error.message : '결제 중 오류가 발생했습니다.';
      setErrorMessage(errorMsg);
    }
  };


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
    transition: imagesReady ? 'opacity 0.3s ease-in-out' : 'none', // 프리로딩 완료 시 빠른 전환
  }

  const contentWrapperStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  }

  const paymentBoxStyle: CSSProperties = {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '24px',
    padding: '60px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
    border: '3px solid #f59e0b',
    maxWidth: '600px',
    width: '90%',
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
  }

  const amountStyle: CSSProperties = {
    fontSize: '72px',
    fontWeight: 'bold',
    marginBottom: '30px',
    color: '#92400e',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
  }

  const instructionStyle: CSSProperties = {
    fontSize: '32px',
    marginBottom: '40px',
    lineHeight: '1.4',
    color: '#92400e',
    fontWeight: '600',
  }

  const buttonStyle: CSSProperties = {
    padding: '20px 40px',
    borderRadius: '16px',
    fontSize: '24px',
    fontWeight: 'bold',
    border: 'none',
    minWidth: '200px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    margin: '0 20px',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
  }

  const isProcessing = paymentStatus === 'processing'
  const isWaiting = paymentStatus === 'waiting'

  const paymentButtonStyle: CSSProperties = {
    ...buttonStyle,
    backgroundColor: isProcessing ? '#cccccc' : '#ef4444',
    color: 'white',
    cursor: isProcessing ? 'not-allowed' : 'pointer',
    border: `3px solid ${isProcessing ? '#cccccc' : '#ef4444'}`,
  }

  const backButtonStyle: CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '3px solid #d1d5db',
  }

  const statusIconStyle: CSSProperties = {
    fontSize: '80px',
    marginBottom: '20px',
  }

  // 상태별 렌더링
  const renderPaymentContent = () => {
    switch (paymentStatus) {
      case 'waiting':
        return (
          <>
            <div style={statusIconStyle}>💳</div>
            <div style={amountStyle}>₩{FIXED_AMOUNT.toLocaleString()}</div>
            <div style={instructionStyle}>
              결제를 진행하시겠습니까?<br />
              카드를 단말기에 삽입하거나<br />
              접촉해 주세요.
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <button
                onClick={handleGoBack}
                style={backButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                이전으로
              </button>
              <button
                onClick={handlePayment}
                style={paymentButtonStyle}
                disabled={isProcessing}
                onMouseEnter={(e) => {
                  if (isWaiting) {
                    e.currentTarget.style.backgroundColor = '#dc2626'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (isWaiting) {
                    e.currentTarget.style.backgroundColor = '#ef4444'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                결제하기
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
              잠시만 기다려 주세요.
            </div>
          </>
        )

      case 'success':
        return (
          <>
            <div style={statusIconStyle}>✅</div>
            <div style={amountStyle}>결제 완료!</div>
            <div style={instructionStyle}>
              결제가 성공적으로 완료되었습니다.<br />
              인쇄를 진행합니다.
            </div>
          </>
        )

      case 'failed':
        return (
          <>
            <div style={statusIconStyle}>❌</div>
            <div style={amountStyle}>결제 실패</div>
            <div style={instructionStyle}>
              {errorMessage || '결제 중 오류가 발생했습니다.'}<br />
              다시 시도해 주세요.
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <button
                onClick={handleGoToMain}
                style={backButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                처음으로
              </button>
              <button
                onClick={() => {
                  setPaymentStatus('waiting')
                  setErrorMessage(null)
                }}
                style={paymentButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444'
                  e.currentTarget.style.transform = 'translateY(0)'
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
        `}
      </style>

      {/* 배경 이미지 */}
      <div style={backgroundStyle} />

      {/* 백업 이미지 로드 체크 제거 - 프리로딩으로 대체 */}

      {/* 로딩 인디케이터 */}
      {!imagesReady && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #fefbf7 0%, #fef3e2 100%)',
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
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            이미지 준비 중...
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div style={contentWrapperStyle}>
        <div style={paymentBoxStyle}>
          {renderPaymentContent()}
        </div>
      </div>
    </div>
  )
}

export default PaymentScreen