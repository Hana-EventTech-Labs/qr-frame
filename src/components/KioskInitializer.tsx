// components/KioskInitializer.tsx
import React, { useState, useEffect, CSSProperties } from 'react';
import { globalStateService } from '../services/globalState';

interface KioskInitializerProps {
  onInitComplete: () => void;
  onInitError: (error: string) => void;
}

export const KioskInitializer: React.FC<KioskInitializerProps> = ({
  onInitComplete,
  onInitError
}) => {
  const [status, setStatus] = useState('키오스크 초기화 중...');
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    initializeKiosk();
  }, []);

  const initializeKiosk = async () => {
    try {
      setIsLoading(true);
      setProgress(10);

      // 이미 검증된 상태인지 확인
      if (globalStateService.isKioskValidated()) {
        const kioskInfo = globalStateService.getKioskInfo();
        setStatus(`기존 검증 정보 확인 중... (${kioskInfo.eventName})`);
        setProgress(50);
        
        // 유효기간 재확인
        const now = new Date();
        const validUntil = new Date(kioskInfo.validUntil || '');
        
        if (now <= validUntil) {
          setStatus('기존 검증 정보 사용');
          setProgress(100);
          
          setTimeout(() => {
            onInitComplete();
          }, 1000);
          return;
        } else {
          setStatus('유효기간 만료, 재검증 필요');
          globalStateService.clearKioskInfo();
        }
      }

      setProgress(20);

      // 환경변수에서 키오스크 정보 가져오기
      const eventName = process.env.REACT_APP_EVENT_NAME || '비마이프렌즈';
      const kioskId = process.env.REACT_APP_KIOSK_ID || '001';

      console.log('🔧 키오스크 설정:', { eventName, kioskId });

      setStatus(`행사: ${eventName} | 키오스크: ${kioskId}`);
      setProgress(30);

      // 키오스크 검증 실행
      setStatus('서버 연결 및 검증 중...');
      setProgress(50);

      const validation = await globalStateService.validateKiosk(eventName, kioskId);
      
      if (validation.success) {
        setStatus('검증 완료! 키오스크 시작 중...');
        setProgress(90);
        
        // 성공 정보 로깅
        console.log('✅ 키오스크 초기화 성공:', {
          eventName: validation.data.event_name,
          kioskId: validation.data.kiosk_id,
          eventNumber: validation.data.no,
          validUntil: validation.data.validInfo.expired_at
        });

        setProgress(100);
        
        setTimeout(() => {
          onInitComplete();
        }, 1500);
      } else {
        console.error('❌ 키오스크 검증 실패:', validation.error);
        setStatus('검증 실패');
        onInitError(validation.error || '키오스크 검증에 실패했습니다.');
      }

    } catch (error) {
      console.error('❌ 키오스크 초기화 중 예상치 못한 오류:', error);
      setStatus('초기화 오류');
      onInitError('키오스크 초기화 중 예상치 못한 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 재시도 함수
  const handleRetry = () => {
    setStatus('재시도 중...');
    setProgress(0);
    setIsLoading(true);
    globalStateService.clearKioskInfo();
    setTimeout(() => {
      initializeKiosk();
    }, 1000);
  };

  // 스타일 정의
  const overlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    fontFamily: 'Arial, sans-serif'
  };

  const contentStyle: CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
    minWidth: '450px',
    maxWidth: '600px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    border: '3px solid #2563eb'
  };

  const titleStyle: CSSProperties = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: '20px'
  };

  const statusStyle: CSSProperties = {
    fontSize: '18px',
    color: '#374151',
    marginBottom: '30px',
    minHeight: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const progressBarStyle: CSSProperties = {
    width: '100%',
    height: '10px',
    backgroundColor: '#e5e7eb',
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: '20px'
  };

  const progressFillStyle: CSSProperties = {
    height: '100%',
    backgroundColor: '#2563eb',
    width: `${progress}%`,
    transition: 'width 0.3s ease'
  };

  const spinnerStyle: CSSProperties = {
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #2563eb',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px'
  };

  const retryButtonStyle: CSSProperties = {
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '20px'
  };

  return (
    <div style={overlayStyle}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <div style={contentStyle}>
        <h1 style={titleStyle}>🏪 키오스크 초기화</h1>
        
        {isLoading && (
          <div style={spinnerStyle}></div>
        )}
        
        <div style={statusStyle}>
          {status}
        </div>
        
        <div style={progressBarStyle}>
          <div style={progressFillStyle}></div>
        </div>
        
        <div style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '10px'
        }}>
          진행률: {progress}%
        </div>
        
        {!isLoading && progress < 100 && (
          <button 
            style={retryButtonStyle}
            onClick={handleRetry}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }}
          >
            🔄 재시도
          </button>
        )}
        
        <div style={{
          marginTop: '20px',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          키오스크 검증 및 초기화 진행 중입니다...
        </div>
      </div>
    </div>
  );
};

export default KioskInitializer;