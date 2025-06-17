import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { kioskValidationService } from '../services/kioskValidationService'

// 타입 선언
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
  const [isValidating, setIsValidating] = useState(true)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [kioskInfo, setKioskInfo] = useState<any>(null)
  const [validInfo, setValidInfo] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<string>('검증 준비 중...')

  useEffect(() => {
    validateKioskOnStart()
  }, [])

  const validateKioskOnStart = async () => {
    try {
      console.log('🚀 키오스크 유효성 검증 시작...')
      setIsValidating(true)
      setValidationError(null)
      setConnectionStatus('서버 연결 테스트 중...')

      // 1단계: 서버 연결 테스트
      const isConnected = await kioskValidationService.testConnection()
      if (!isConnected) {
        throw new Error('서버에 연결할 수 없습니다.')
      }
      setConnectionStatus('서버 연결 성공, 키오스크 검증 중...')

      // 2단계: 키오스크 검증
      const result = await kioskValidationService.validateKiosk()
      
      if (result.success) {
        console.log('✅ 키오스크 검증 성공:', result)
        setKioskInfo(result)
        
        // 유효기간 정보 포맷팅
        const formatted = kioskValidationService.formatValidInfo(result.validInfo)
        setValidInfo(formatted)
        
        setConnectionStatus(`검증 완료 - ${formatted?.daysLeft}일 남음`)
        setIsValidating(false)
      } else {
        console.error('❌ 키오스크 검증 실패:', result.error)
        setValidationError(result.error || '알 수 없는 오류')
        setConnectionStatus('검증 실패')
        setIsValidating(false)
        
        // 만료되거나 비활성화된 경우 메시지박스 표시
        if (result.isExpired || result.isInactive) {
          const title = result.isExpired ? '🕐 사용 기간 만료' : '🚫 키오스크 비활성화'
          const message = result.error || '사용할 수 없는 상태입니다.'
          
          setTimeout(() => {
            // 타입 안전한 방식으로 electron 접근
            const electronAPI = (window as any).electron;
            if (electronAPI?.showMessageBox) {
              // Electron 환경
              electronAPI.showMessageBox({
                type: 'error',
                title: title,
                message: message,
                buttons: ['확인']
              });
            } else {
              // 브라우저 환경
              alert(`${title}\n\n${message}`);
            }
          }, 500)
        }
      }
    } catch (error) {
      console.error('키오스크 검증 중 오류:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      setValidationError(errorMessage)
      setConnectionStatus('오류 발생')
      setIsValidating(false)
    }
  }

  const handleStartClick = () => {
    if (validationError) {
      // 오류가 있으면 재검증 시도
      console.log('🔄 재검증 시도')
      validateKioskOnStart()
      return
    }
    
    if (kioskInfo?.success) {
      console.log('🎯 메인 화면에서 업로드 화면으로 이동')
      navigate('/upload')
    }
  }

  useEffect(() => {
    if (!isValidating && !validationError && kioskInfo?.success) {
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
  }, [navigate, isValidating, validationError, kioskInfo])

  const config = kioskValidationService.getKioskConfig()

  return (
    <div
      className="flex items-center justify-center overflow-hidden"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          color: '#333333',
        }}
      >
        <h1 style={{
          fontSize: '80px',
          fontWeight: 'bold',
          marginBottom: '40px',
          color: isValidating ? '#6b7280' : validationError ? '#ef4444' : '#2563eb',
        }}>
          Photo Frame Kiosk
        </h1>
        
        {/* 키오스크 정보 표시 */}
        <div style={{
          fontSize: '24px',
          color: '#666666',
          marginBottom: '20px',
        }}>
          행사: {config.eventName} | 키오스크: {config.kioskId}
        </div>

        {/* 연결 상태 표시 */}
        <div style={{
          fontSize: '18px',
          color: '#9ca3af',
          marginBottom: '20px',
        }}>
          {connectionStatus}
        </div>

        {/* 유효기간 정보 표시 */}
        {validInfo && (
          <div style={{
            fontSize: '20px',
            color: validInfo.daysLeft <= 7 ? '#ef4444' : '#10b981',
            marginBottom: '20px',
          }}>
            📅 유효기간: {validInfo.expiredAt} ({validInfo.daysLeft >= 0 ? `${validInfo.daysLeft}일 남음` : '만료됨'})
          </div>
        )}

        {/* 상태별 메시지 */}
        {isValidating && (
          <div>
            <p style={{
              fontSize: '32px',
              color: '#6b7280',
            }}>
              🔍 키오스크 검증 중...
            </p>
            <div style={{
              width: '300px',
              height: '4px',
              backgroundColor: '#e5e7eb',
              borderRadius: '2px',
              margin: '20px auto',
              overflow: 'hidden',
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#3b82f6',
                animation: 'loadingBar 2s ease-in-out infinite',
              }}></div>
            </div>
          </div>
        )}
        
        {validationError && (
          <div>
            <p style={{
              fontSize: '28px',
              color: '#ef4444',
              marginBottom: '20px',
              whiteSpace: 'pre-line',
              lineHeight: 1.4,
            }}>
              ⚠️ {validationError}
            </p>
            <button
              onClick={handleStartClick}
              style={{
                fontSize: '24px',
                padding: '12px 24px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.backgroundColor = '#dc2626';
              }}
              onMouseOut={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.backgroundColor = '#ef4444';
              }}
            >
              🔄 다시 시도
            </button>
          </div>
        )}
        
        {!isValidating && !validationError && kioskInfo?.success && (
          <p style={{
            fontSize: '32px',
            color: '#666666',
          }}>
            ✨ 화면을 터치하여 시작하세요
          </p>
        )}

        {/* 디버그 정보 (개발용) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            fontSize: '14px',
            color: '#9ca3af',
            textAlign: 'left',
            backgroundColor: 'rgba(0,0,0,0.1)',
            padding: '15px',
            borderRadius: '8px',
            fontFamily: 'monospace',
          }}>
            <div><strong>🐛 Debug Info:</strong></div>
            <div>Server: {config.serverUrl}</div>
            {kioskInfo && (
              <>
                <div>Event No: {kioskInfo.eventInfo?.no}</div>
                <div>Valid No: {kioskInfo.validInfo?.no}</div>
                <div>Expired At: {kioskInfo.validInfo?.expired_at}</div>
                <div>State: {kioskInfo.validInfo?.state === 1 ? '활성' : '비활성'}</div>
              </>
            )}
          </div>
        )}
      </div>

      {/* CSS 애니메이션을 head에 추가 */}
      {isValidating && (
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes loadingBar {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(0%); }
              100% { transform: translateX(100%); }
            }
          `
        }} />
      )}
    </div>
  )
}

export default MainScreen