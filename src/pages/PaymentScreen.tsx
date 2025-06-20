import { useState, useEffect, CSSProperties } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'


// Window 인터페이스를 명시적으로 확장
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

const PaymentScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [paymentStatus, setPaymentStatus] = useState<'waiting' | 'processing' | 'success' | 'failed'>('waiting')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  
  const FIXED_AMOUNT = 5000 // 고정 금액

  useEffect(() => {
    // 전달받은 데이터 확인
    if (!location.state?.uploadedImage || !location.state?.selectedFrame) {
      console.error('❌ 결제 화면: 필요한 데이터가 없습니다.')
      navigate('/upload')
    }
  }, [location.state, navigate])

  // KS_NET 결제 요청 메시지 생성
  const buildPaymentRequest = () => {
    // 기존 코드의 buildReqMessage() 로직 적용
    const reqMessage = "AP0452IC010200NDPT0TEST03    000000000000                                                                                                                                                       00000000001004000000000000000000000091000000000913000000000000                                                                                                                                                                                                       X"
    return reqMessage
  }

  // 결제 요청 처리
  const handlePayment = async () => {
    if (paymentStatus === 'processing') return
    
    setPaymentStatus('processing')
    setErrorMessage(null)

    try {
      console.log('💳 KS_NET 결제 요청 시작...')
      
      const requestData = {
        REQ: buildPaymentRequest()
      }

      // Electron의 결제 API 호출 - 타입 안전성 확보
      const electronAPI = window.electronAPI
      if (!electronAPI) {
        throw new Error('Electron API를 사용할 수 없습니다.')
      }

      const result = await electronAPI.sendPaymentRequest(requestData)
      
      console.log('💳 결제 응답:', result)

      if (result?.error) {
        throw new Error(result.error)
      }

      // 결제 성공 처리 (실제 응답에 따라 조건 수정 필요)
      if (result) {
        console.log('✅ 결제 성공')
        setPaymentStatus('success')
        
        // 2초 후 인쇄 화면으로 이동
        setTimeout(() => {
          if (!isNavigating) {
            setIsNavigating(true)
            navigate('/printing', {
              state: {
                uploadedImage: location.state.uploadedImage,
                imageType: location.state.imageType,
                selectedFrame: location.state.selectedFrame,
                paymentCompleted: true
              }
            })
          }
        }, 2000)
      } else {
        throw new Error('결제 응답이 올바르지 않습니다.')
      }

    } catch (error) {
      console.error('❌ 결제 실패:', error)
      setPaymentStatus('failed')
      setErrorMessage(error instanceof Error ? error.message : '결제 중 오류가 발생했습니다.')
    }
  }

  // 이전으로 돌아가기
  const handleGoBack = () => {
    if (isNavigating) return
    setIsNavigating(true)
    navigate('/frame', { state: location.state })
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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  }

  const topLogoContainerStyle: CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '48px',
    paddingBottom: '24px',
    minHeight: '220px',
  }

  const contentStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '250px',
    position: 'relative',
    zIndex: 1,
  }

  const paymentBoxStyle: CSSProperties = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '24px',
    padding: '60px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
    color: 'white',
    maxWidth: '600px',
    width: '90%',
  }

  const amountStyle: CSSProperties = {
    fontSize: '72px',
    fontWeight: 'bold',
    marginBottom: '30px',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
  }

  const instructionStyle: CSSProperties = {
    fontSize: '32px',
    marginBottom: '40px',
    lineHeight: '1.4',
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
  }

  const paymentButtonStyle: CSSProperties = {
    ...buttonStyle,
    backgroundColor: paymentStatus === 'processing' ? '#cccccc' : '#4CAF50',
    color: 'white',
    cursor: paymentStatus === 'processing' ? 'not-allowed' : 'pointer',
  }

  const backButtonStyle: CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#e5e7eb',
    color: '#1f2937',
    border: '3px solid #d1d5db',
  }

  const statusIconStyle: CSSProperties = {
    fontSize: '80px',
    marginBottom: '20px',
  }

  const bottomLogoContainerStyle: CSSProperties = {
    position: 'absolute',
    bottom: '30px',
    left: 0,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '20px',
    zIndex: 1,
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
              <button onClick={handleGoBack} style={backButtonStyle}>
                이전으로
              </button>
              <button onClick={handlePayment} style={paymentButtonStyle}>
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
              <button onClick={handleGoToMain} style={backButtonStyle}>
                처음으로
              </button>
              <button 
                onClick={() => {
                  setPaymentStatus('waiting')
                  setErrorMessage(null)
                }} 
                style={paymentButtonStyle}
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

      {/* 상단 로고 */}
      <div style={topLogoContainerStyle}>
        <img
          src="./festival_logo.png"
          alt="Festival Logo"
          className="max-h-[220px]"
          style={{
            display: 'block',
            margin: '0 auto',
            maxWidth: '80%',
          }}
        />
      </div>

      {/* 결제 내용 */}
      <div style={contentStyle}>
        <div style={paymentBoxStyle}>
          {renderPaymentContent()}
        </div>
      </div>

      {/* 하단 로고 */}
      <div style={bottomLogoContainerStyle}>
        <img
          src="./logo.png"
          alt="Bottom Logo"
          className="w-1/3 max-w-[300px] object-contain"
          style={{
            display: 'block',
            margin: '0 auto',
            maxWidth: '40%',
          }}
        />
      </div>
    </div>
  )
}

export default PaymentScreen