import { useState, useRef, CSSProperties } from 'react'

// Window 타입 확장
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
  }
}

const AdminExitButton = () => {
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const clickCountRef = useRef(0)
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null)

  const CORRECT_PASSWORD = '0000'

  // 4번 연속 클릭 감지
  const handleSecretClick = () => {
    clickCountRef.current += 1

    // 첫 번째 클릭이면 타이머 시작 (3초 내에 4번 클릭해야 함)
    if (clickCountRef.current === 1) {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0 // 시간 초과시 카운트 리셋
      }, 3000)
    }

    // 4번 클릭 완료
    if (clickCountRef.current >= 4) {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
      }
      clickCountRef.current = 0
      setShowPasswordModal(true)
      console.log('🔐 관리자 모드 진입')
    }
  }

  // 비밀번호 입력
  const handleNumberClick = (num: string) => {
    if (password.length < 4) {
      const newPassword = password + num
      setPassword(newPassword)
      setError('')

      // 4자리 입력 완료 시 자동 검증
      if (newPassword.length === 4) {
        setTimeout(() => {
          checkPassword(newPassword)
        }, 100)
      }
    }
  }

  // 비밀번호 검증
  const checkPassword = (inputPassword: string) => {
    if (inputPassword === CORRECT_PASSWORD) {
      console.log('✅ 관리자 인증 성공 - 프로그램 종료')
      
      // Electron 환경에서 앱 종료
      if (window.electronAPI?.closeApp) {
        window.electronAPI.closeApp()
      } else {
        // 웹 환경에서는 창 닫기
        window.close()
      }
    } else {
      setError('비밀번호가 틀렸습니다')
      setPassword('')
    }
  }

  // 비밀번호 삭제
  const handleBackspace = () => {
    setPassword(prev => prev.slice(0, -1))
    setError('')
  }

  // 모달 닫기
  const handleCloseModal = () => {
    setShowPasswordModal(false)
    setPassword('')
    setError('')
  }

  // 스타일 정의
  const secretButtonStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '100px',
    height: '100px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'default',
    zIndex: 9999,
    opacity: 0, // 완전히 투명
  }

  const modalOverlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  }

  const modalContentStyle: CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    border: '3px solid #dc2626',
    textAlign: 'center',
    minWidth: '400px',
  }

  const titleStyle: CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: '20px',
  }

  const passwordDisplayStyle: CSSProperties = {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: '20px',
    letterSpacing: '10px',
    minHeight: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: '10px',
    border: '2px solid #d1d5db',
  }

  const errorStyle: CSSProperties = {
    color: '#dc2626',
    fontSize: '16px',
    marginBottom: '20px',
    minHeight: '20px',
  }

  const keypadContainerStyle: CSSProperties = {
    display: 'inline-block',
    marginBottom: '20px',
  }

  const keypadGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '12px',
  }

  const numberButtonStyle: CSSProperties = {
    width: '70px',
    height: '70px',
    fontSize: '28px',
    fontWeight: 'bold',
    backgroundColor: '#f8fafc',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const zeroButtonStyle: CSSProperties = {
    ...numberButtonStyle,
    gridColumn: '2 / 3', // 가운데 정렬
  }

  const actionButtonStyle: CSSProperties = {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    margin: '0 8px',
    transition: 'all 0.2s ease',
    minWidth: '100px',
  }

  const closeButtonStyle: CSSProperties = {
    ...actionButtonStyle,
    backgroundColor: '#64748b',
    color: 'white',
  }

  const backspaceButtonStyle: CSSProperties = {
    ...actionButtonStyle,
    backgroundColor: '#ef4444',
    color: 'white',
  }

  // 비밀번호 표시 (마스킹)
  const getPasswordDisplay = () => {
    return '●'.repeat(password.length) + '○'.repeat(4 - password.length)
  }

  // 키패드 레이아웃 (전화기 스타일: 1-2-3, 4-5-6, 7-8-9, 0)
  const keypadNumbers = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ]

  return (
    <>
      {/* 투명한 비밀 버튼 */}
      <button
        style={secretButtonStyle}
        onClick={handleSecretClick}
        aria-label="관리자 모드"
      />

      {/* 비밀번호 입력 모달 */}
      {showPasswordModal && (
        <div style={modalOverlayStyle} onClick={handleCloseModal}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={titleStyle}>🔐 관리자 인증</h2>
            
            {/* 비밀번호 표시 */}
            <div style={passwordDisplayStyle}>
              {getPasswordDisplay()}
            </div>

            {/* 에러 메시지 */}
            <div style={errorStyle}>
              {error}
            </div>

            {/* 숫자 키패드 */}
            <div style={keypadContainerStyle}>
              {/* 1-9 숫자 버튼들 */}
              {keypadNumbers.map((row, rowIndex) => (
                <div key={rowIndex} style={keypadGridStyle}>
                  {row.map((num) => (
                    <button
                      key={num}
                      style={numberButtonStyle}
                      onClick={() => handleNumberClick(num.toString())}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e2e8f0'
                        e.currentTarget.style.transform = 'scale(1.05)'
                        e.currentTarget.style.borderColor = '#cbd5e1'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc'
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.borderColor = '#e2e8f0'
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              ))}
              
              {/* 0 버튼 (마지막 행, 가운데) */}
              <div style={keypadGridStyle}>
                <div></div> {/* 빈 공간 */}
                <button
                  style={zeroButtonStyle}
                  onClick={() => handleNumberClick('0')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e2e8f0'
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.borderColor = '#cbd5e1'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc'
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                  }}
                >
                  0
                </button>
                <div></div> {/* 빈 공간 */}
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div style={{ marginTop: '20px' }}>
              <button
                style={closeButtonStyle}
                onClick={handleCloseModal}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#475569'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#64748b'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                취소
              </button>
              
              <button
                style={backspaceButtonStyle}
                onClick={handleBackspace}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                ⌫ 삭제
              </button>
            </div>

            <div style={{
              marginTop: '20px',
              fontSize: '14px',
              color: '#64748b',
            }}>
              오른쪽 상단을 4번 연속 터치하여 진입
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AdminExitButton