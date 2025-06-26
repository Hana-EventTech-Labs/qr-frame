// src/components/KioskInitializer.tsx
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
  const [details, setDetails] = useState<string>('');
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    initializeKiosk();
  }, []);

  const initializeKiosk = async () => {
    try {
      setIsLoading(true);
      setShowRetry(false);
      setProgress(5);
      setStatus('설정 로드 중...');

      // 환경변수에서 설정 가져오기
      const eventName = import.meta.env.VITE_EVENT_NAME;
      const kioskId = import.meta.env.VITE_KIOSK_ID;
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

      console.log('🔧 환경변수 확인:', { eventName, kioskId, apiBaseUrl });

      if (!eventName || !kioskId || !apiBaseUrl) {
        throw new Error('환경변수 설정이 누락되었습니다.\n.env 파일을 확인해주세요.');
      }

      setDetails(`행사: ${eventName}\n키오스크: ${kioskId}`);
      setProgress(15);

      // 기존 검증 정보 확인
      if (globalStateService.isKioskValidated()) {
        const kioskInfo = globalStateService.getKioskInfo();
        setStatus(`기존 검증 정보 확인 중...`);
        setProgress(30);
        
        const validUntil = new Date(kioskInfo.validUntil || '');
        setStatus('기존 검증 정보 사용');
        setDetails(`행사: ${kioskInfo.eventName}\n키오스크: ${kioskInfo.kioskId}\n유효기간: ${validUntil.toLocaleDateString('ko-KR')}`);
        setProgress(100);
        
        setTimeout(() => {
          onInitComplete();
        }, 300);
        return;
      }

      setProgress(40);
      setStatus('서버 연결 및 검증 중...');
      setDetails('서버에 키오스크 등록 정보를 확인하고 있습니다...');

      // 키오스크 검증 실행
      const validation = await globalStateService.validateKiosk(eventName, kioskId);
      setProgress(70);

      if (validation.success) {
        setStatus('검증 완료! 키오스크 시작 중...');
        const validUntil = new Date(validation.data.validInfo.expired_at);
        setDetails(`검증 성공!\n행사: ${validation.data.event_name}\n키오스크: ${validation.data.kiosk_id}\n유효기간: ${validUntil.toLocaleDateString('ko-KR')}`);
        
        console.log('✅ 키오스크 초기화 성공:', validation.data);

        setProgress(100);
        
        setTimeout(() => {
          onInitComplete();
        }, 500);
      } else {
        console.error('❌ 키오스크 검증 실패:', validation.error);
        
        // 구체적인 에러 메시지 처리
        let errorMessage = validation.error || '키오스크 검증에 실패했습니다.';
        
        if (validation.error?.includes('등록되지 않은')) {
          errorMessage = `등록되지 않은 키오스크입니다.\n\n행사명: ${eventName}\n키오스크 ID: ${kioskId}\n\n관리자에게 문의하세요.`;
        } else if (validation.error?.includes('만료')) {
          errorMessage = `사용 기간이 만료되었습니다.\n관리자에게 문의하세요.`;
        } else if (validation.error?.includes('비활성')) {
          errorMessage = `비활성화된 키오스크입니다.\n관리자에게 문의하세요.`;
        } else if (validation.error?.includes('연결할 수 없습니다')) {
          errorMessage = `서버에 연결할 수 없습니다.\n\n네트워크 연결을 확인해주세요.\n서버 주소: ${apiBaseUrl}`;
        }
        
        setStatus('검증 실패');
        setDetails(errorMessage);
        setShowRetry(true);
        onInitError(errorMessage);
      }

    } catch (error) {
      console.error('❌ 키오스크 초기화 중 예상치 못한 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '키오스크 초기화 중 오류가 발생했습니다.';
      setStatus('초기화 오류');
      setDetails(errorMessage);
      setShowRetry(true);
      onInitError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 재시도 함수
  const handleRetry = () => {
    setStatus('재시도 중...');
    setDetails('');
    setProgress(0);
    setIsLoading(true);
    setShowRetry(false);
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
    minWidth: '500px',
    maxWidth: '700px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    border: progress === 100 ? '3px solid #10b981' : showRetry ? '3px solid #dc2626' : '3px solid #2563eb'
  };

  const titleStyle: CSSProperties = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: progress === 100 ? '#10b981' : showRetry ? '#dc2626' : '#2563eb',
    marginBottom: '20px'
  };

  const statusStyle: CSSProperties = {
    fontSize: '18px',
    color: '#374151',
    marginBottom: '20px',
    minHeight: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const detailsStyle: CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '20px',
    minHeight: '60px',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.4',
    backgroundColor: '#f9fafb',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  };

  const progressBarStyle: CSSProperties = {
    width: '100%',
    height: '12px',
    backgroundColor: '#e5e7eb',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '20px'
  };

  const progressFillStyle: CSSProperties = {
    height: '100%',
    backgroundColor: progress === 100 ? '#10b981' : showRetry ? '#dc2626' : '#2563eb',
    width: `${progress}%`,
    transition: 'width 0.3s ease, background-color 0.3s ease'
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
    marginTop: '20px',
    transition: 'background-color 0.2s ease'
  };

  return (
    <div style={overlayStyle}>
      <div style={contentStyle}>
        <h1 style={titleStyle}>
          {progress === 100 ? '🎉 키오스크 준비 완료' : showRetry ? '❌ 초기화 실패' : '🏪 키오스크 초기화'}
        </h1>
        
        {isLoading && (
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
        )}
        
        <div style={statusStyle}>
          {status}
        </div>
        
        <div style={detailsStyle}>
          {details}
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
        
        {showRetry && (
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
        
        {showRetry && (
          <div style={{
            marginTop: '20px',
            fontSize: '12px',
            color: '#9ca3af',
            lineHeight: '1.4'
          }}>
            문제가 지속되면 관리자에게 문의하세요.<br/>
            네트워크 연결 및 .env 설정을 확인해주세요.
          </div>
        )}
      </div>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default KioskInitializer;