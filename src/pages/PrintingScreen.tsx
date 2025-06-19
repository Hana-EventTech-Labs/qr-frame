import { useEffect, useState, useRef, CSSProperties } from 'react';
import { useLocation } from 'react-router-dom';
import { printerApi } from '../services/printerApi';
import { printLogService } from '../services/printLogService';
import { globalState } from '../services/globalState';

declare global {
  interface Window {
    envApi: {
      cwd: () => string;
    };
    env: {
      cwd: () => string;
      downloadPath: () => string;
    };
  }
}

const PrintingScreen = () => {
  const location = useLocation();
  const [dots, setDots] = useState('...');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('준비 중...');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    console.log('[PrintingScreen] 렌더 완료됨 — 인쇄 대기 중');
    console.log('전달받은 데이터:', location.state);

    queueMicrotask(() => {
      console.log('[queueMicrotask] doPrint 실행');
      doPrint();
    });

    const dotsInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1, 95));
    }, 250);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(progressInterval);
      printerApi.closeDevice().catch(console.error);
    };
  }, []);

  const doPrint = async () => {
    try {
      // 전달받은 데이터 확인
      const { uploadedImage, selectedFrame } = location.state || {};
      console.log('업로드된 이미지:', uploadedImage ? '있음' : '없음');
      console.log('선택된 프레임:', selectedFrame);

      setStatus('프린터 연결 중...');
      setProgress(10);

      await new Promise(resolve => setTimeout(resolve, 100));

      const listResult = await printerApi.getDeviceList();
      if (!listResult.success || !listResult.devices || listResult.devices.length === 0) {
        throw new Error('연결된 프린터가 없습니다.');
      }

      const selectedDevice = listResult.devices[0];
      setProgress(30);
      await new Promise(resolve => setTimeout(resolve, 100));

      const openResult = await printerApi.openDevice(selectedDevice.id);
      if (!openResult.success) {
        throw new Error('프린터 연결에 실패했습니다.');
      }

      setProgress(40);
      setStatus('이미지 처리 중...');
      await new Promise(resolve => setTimeout(resolve, 100));

      // 🔥 프레임 먼저 그리기 (배경)
      if (selectedFrame) {
        console.log(`🖼️ 프레임 ${selectedFrame} 그리기 시작...`);
        
        // 현재 작업 디렉토리 기준으로 프레임 경로 생성
        const cwd = window.env.cwd();
        const framePath = `${cwd}\\public\\frames\\${selectedFrame}.png`;
        console.log('프레임 경로:', framePath);
        
        const frameResult = await printerApi.drawImage({
          page: 0,     // 페이지 번호
          panel: 1,    // 패널 번호 (프론트)
          x: 0,        // 전체 카드 크기로 프레임 그리기
          y: 0,
          width: 635,  // 카드 전체 너비
          height: 1010, // 카드 전체 높이
          imagePath: framePath,
        });

        if (!frameResult.success) {
          console.warn('⚠️ 프레임 그리기 실패, 계속 진행:', frameResult.error);
          // 프레임 실패해도 사진은 인쇄하도록 계속 진행
        } else {
          console.log('✅ 프레임 그리기 성공');
        }
      }

      setProgress(60);
      setStatus('사진 인쇄 준비 중...');
      await new Promise(resolve => setTimeout(resolve, 100));

      // 🔥 사진 이미지 그리기 (프레임 위에)
      const photoPath = `${window.env.downloadPath()}\\photo.png`;
      console.log('사진 경로:', photoPath);

      const photoImgResult = await printerApi.drawImage({
        page: 0,
        panel: 1,
        x: 46,        // 사진 영역 X 좌표
        y: 90,        // 사진 영역 Y 좌표  
        width: 543,   // 사진 영역 너비
        height: 442,  // 사진 영역 높이
        imagePath: photoPath,
      });

      if (!photoImgResult.success) {
        throw new Error('사진 이미지 그리기에 실패했습니다: ' + photoImgResult.error);
      }

      setProgress(80);
      setStatus('인쇄 중...');
      await new Promise(resolve => setTimeout(resolve, 100));

      const printResult = await printerApi.print();
      if (!printResult.success) {
        throw new Error('인쇄에 실패했습니다: ' + printResult.error);
      }

      setProgress(90);
      setStatus('로그 저장 중...');
      await new Promise(resolve => setTimeout(resolve, 100));

      // 🔥 인쇄 완료 후 logs 테이블에 기록 저장
      try {
        const printLogData = globalState.getPrintLogData();
        console.log('📝 인쇄 로그 데이터:', printLogData);
        
        const logResult = await printLogService.savePrintLog(printLogData);
        
        if (!logResult.success) {
          console.error('⚠️ 인쇄 로그 저장 실패:', logResult.error);
          // 인쇄는 성공했으므로 로그 실패해도 계속 진행
          // 사용자에게는 성공으로 표시하되, 콘솔에만 오류 기록
        } else {
          console.log('✅ 인쇄 로그 저장 성공');
        }
      } catch (logError) {
        console.error('⚠️ 인쇄 로그 저장 중 예외 발생:', logError);
        // 인쇄는 성공했으므로 로그 실패해도 계속 진행
      }

      setProgress(100);
      setStatus('인쇄 완료!');
      await printerApi.closeDevice();

      setTimeout(() => {
        window.location.hash = '#/complete';
      }, 1000);

    } catch (error) {
      console.error('❌ 인쇄 과정 오류:', error);
      setStatus('오류 발생');
      setErrorDetails(error instanceof Error ? error.message : '알 수 없는 오류');
    }
  };

  // 메인 화면으로 돌아가기 함수
  const goToMainScreen = () => {
    window.location.hash = '#/';
  };

  // 스타일 정의
  const containerStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  };

  const topLogoContainerStyle: CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '48px',
    paddingBottom: '24px',
    minHeight: '220px',
  };

  const contentStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    textAlign: 'center',
    marginTop: '20px',
    marginBottom: '20px',
    position: 'relative',
    zIndex: 1,
  };

  const mainTextStyle: CSSProperties = {
    fontSize: '72px',
    fontWeight: 'bold',
    color: '#e75480',
    marginBottom: '30px',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
  };

  const errorDetailsStyle: CSSProperties = {
    fontSize: '18px',
    color: '#555',
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#f8f8f8',
    borderRadius: '5px',
    maxWidth: '80%',
    textAlign: 'left',
  };

  const progressContainerStyle: CSSProperties = {
    width: '60%',
    height: '25px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    overflow: 'hidden',
    marginTop: '30px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e0e0e0',
  };

  const progressBarStyle: CSSProperties = {
    height: '100%',
    width: `${progress}%`,
    background: errorDetails
      ? 'linear-gradient(90deg, #e74c3c 0%, #c0392b 100%)'
      : 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)',
    borderRadius: '12px',
    transition: 'width 0.3s ease',
  };

  const iconContainerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px',
    position: 'relative',
  };

  const printerIconStyle: CSSProperties = {
    fontSize: '100px',
    filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))',
  };

  const carnationStyle: CSSProperties = {
    fontSize: '44px',
    position: 'absolute',
    zIndex: 2,
  };

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
  };

  const verticalDecorStyle: CSSProperties = {
    position: 'absolute',
    height: '80%',
    width: '10px',
    top: '10%',
    background: 'linear-gradient(to bottom, rgba(231, 84, 128, 0.1), rgba(76, 175, 80, 0.1))',
    borderRadius: '5px',
    zIndex: 0,
  };

  const buttonStyle: CSSProperties = {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
  };

  return (
    <div style={containerStyle} className="relative">
      <style>
        {`
          @keyframes bounce {
            0% { transform: translateY(0); }
            100% { transform: translateY(-10px); }
          }
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.9; transform: scale(1.03); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes gentle-float {
            0% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(3deg); }
            100% { transform: translateY(0) rotate(0deg); }
          }
          .printer-icon { animation: bounce 1.5s infinite alternate; }
          .message-text { animation: pulse 2.5s infinite; }
          .carnation { animation: gentle-float 3s infinite; }
          .decor-left { left: 30px; animation: pulse 4s infinite; }
          .decor-right { right: 30px; animation: pulse 4s infinite 1s; }
        `}
      </style>

      <div style={verticalDecorStyle} className="decor-left"></div>
      <div style={verticalDecorStyle} className="decor-right"></div>

      <div style={topLogoContainerStyle}>
        <img
          src="./festival_logo.png"
          alt="Festival Logo"
          className="max-h-[220px]"
          style={{ display: 'block', margin: '0 auto', maxWidth: '80%' }}
        />
      </div>

      <div style={contentStyle}>
        <div style={iconContainerStyle}>
          <div style={printerIconStyle} className="printer-icon">
            <span role="img" aria-label="printer">🖨️</span>
          </div>
          <div style={{ ...carnationStyle, top: '-20px', left: '135px' }} className="carnation">
            <span role="img" aria-label="carnation">🌸</span>
          </div>
          <div style={{ ...carnationStyle, bottom: '-15px', right: '135px' }} className="carnation">
            <span role="img" aria-label="carnation">🌸</span>
          </div>
        </div>

        <div style={mainTextStyle} className="message-text">
          {status}{dots}
        </div>

        {errorDetails && <div style={errorDetailsStyle}>{errorDetails}</div>}

        {errorDetails && (
          <button
            style={buttonStyle}
            onClick={goToMainScreen}
            onMouseOver={(e: { currentTarget: { style: { backgroundColor: string; transform: string; }; }; }) => {
              e.currentTarget.style.backgroundColor = '#45a049';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.backgroundColor = '#4CAF50';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            메인 화면으로 돌아가기
          </button>
        )}

        <div style={progressContainerStyle}>
          <div style={progressBarStyle}></div>
        </div>
      </div>

      <div style={bottomLogoContainerStyle}>
        <img
          src="./logo.png"
          alt="Bottom Logo"
          className="w-1/3 max-w-[300px] object-contain"
          style={{ display: 'block', margin: '0 auto', maxWidth: '40%' }}
        />
      </div>
    </div>
  );
};

export default PrintingScreen;