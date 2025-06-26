import { useEffect, useState, useRef, CSSProperties } from 'react';
import { useLocation } from 'react-router-dom';
import { printerApi } from '../services/printerApi';
import { printLogService } from '../services/printLogService';
import { globalStateService } from '../services/globalState';

declare global {
  interface Window {
    envApi: {
      cwd: () => string;
      env: {
        cwd: () => string;
        downloadPath: () => string;
        resourcesPath: () => string;
        isDev: () => boolean;
      };
    };
    imagesPreloaded?: boolean;
    fs: {
      writeFileSync: (path: string, data: Uint8Array) => void;
    };
    fileApi?: {
      saveImageFromUrl: (
        dataUrl: string,
        fileName: string
      ) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    };
  }
}

// ✅ 전역 이동 함수
const goToMainScreen = () => {
  window.location.hash = '#/';
};

const PrintingScreen = () => {
  const location = useLocation();
  const [, setDots] = useState('...');
  const [, setProgress] = useState(0);
  const [, setStatus] = useState<string>('준비 중...');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (window.imagesPreloaded) {
      setBackgroundLoaded(true);
    } else {
      const img = new Image();
      img.onload = () => setBackgroundLoaded(true);
      img.onerror = () => setBackgroundLoaded(true);
      img.src = './process.png';
    }

    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    console.log('[PrintingScreen] 렌더 완료됨 — 인쇄 대기 중');
    console.log('전달받은 데이터:', location.state);

    queueMicrotask(() => {
      console.log('[queueMicrotask] doPrint 실행');
      doPrint();
    });

    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 1, 95));
    }, 250);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(progressInterval);
      printerApi.closeDevice().catch(console.error);
    };
  }, []);

  const doPrint = async () => {
    try {
      const { uploadedImage, selectedFrame } = location.state || {};
      console.log('업로드된 이미지:', uploadedImage ? '있음' : '없음');
      console.log('선택된 프레임:', selectedFrame);

      setStatus('프린터 연결 중...');
      setProgress(10);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const listResult = await printerApi.getDeviceList();
      if (!listResult.success || !listResult.devices || listResult.devices.length === 0) {
        throw new Error('연결된 프린터가 없습니다.');
      }

      const selectedDevice = listResult.devices[0];
      setProgress(30);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const openResult = await printerApi.openDevice(selectedDevice.id);
      if (!openResult.success) {
        throw new Error('프린터 연결에 실패했습니다.');
      }

      setProgress(40);
      setStatus('이미지 처리 중...');
      await new Promise((resolve) => setTimeout(resolve, 100));

      let finalImagePath: string;

      if (selectedFrame && selectedFrame !== 'completed') {
        // 📌 직접 프레임 선택: 합성 필요
        finalImagePath = await compositeFrameAndPhoto(selectedFrame, uploadedImage);
      } else if (location.state?.imageType === 'frame' || selectedFrame === 'completed') {
        // 📌 완성본 선택: 저장 후 경로 사용
        const saved = await window.fileApi!.saveImageFromUrl(
          uploadedImage,
          'completed_frame.png'
        );
        if (!saved.success || !saved.filePath) {
          throw new Error(saved.error || '완성본 이미지 저장 실패');
        }
        finalImagePath = saved.filePath;
      } else {
        // 📌 원본만: 리사이즈 필요
        finalImagePath = await resizeImageForCard(uploadedImage);
      }

      setProgress(60);
      setStatus('이미지 인쇄 중...');
      await new Promise((resolve) => setTimeout(resolve, 100));

      const drawResult = await printerApi.drawImage({
        page: 0,
        panel: 1,
        x: 0,
        y: 0,
        width: 1010, // ✅ 가로형 카드에 맞게 수정
        height: 635,
        imagePath: finalImagePath,
      });

      if (!drawResult.success) {
        throw new Error('이미지 인쇄에 실패했습니다: ' + drawResult.error);
      }

      setProgress(80);
      setStatus('인쇄 중...');
      await new Promise((resolve) => setTimeout(resolve, 100));

      const printResult = await printerApi.print();
      if (!printResult.success) {
        throw new Error('인쇄에 실패했습니다: ' + printResult.error);
      }

      setProgress(90);
      setStatus('로그 저장 중...');
      await new Promise((resolve) => setTimeout(resolve, 100));

      try {
        const printLogData = globalStateService.getPrintLogData();
        console.log('📝 인쇄 로그 데이터:', printLogData);

        const logResult = await printLogService.savePrintLog(printLogData);

        if (!logResult.success) {
          console.error('⚠️ 인쇄 로그 저장 실패:', logResult.error);
        } else {
          console.log('✅ 인쇄 로그 저장 성공');
        }
      } catch (logError) {
        console.error('⚠️ 인쇄 로그 저장 중 예외 발생:', logError);
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

  const compositeFrameAndPhoto = async (
    frameId: string,
    photoDataUrl: string
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context를 생성할 수 없습니다.'));
        return;
      }

      // ✅ 가로형 카드 캔버스
      canvas.width = 1010;
      canvas.height = 635;

      const frameImg = new Image();
      frameImg.onload = () => {
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

        const photoImg = new Image();
        photoImg.onload = async () => {
          // ✅ 가로/세로 판별
          const isLandscape = photoImg.width > photoImg.height;

          let targetX: number, targetY: number, targetWidth: number, targetHeight: number;

          if (isLandscape) {
            // 기준 높이
            const baseHeight = canvas.height * 0.33;

            // 👉 가로 크기는 이 높이로 aspect ratio 계산
            const aspectRatio = photoImg.width / photoImg.height;
            targetWidth = baseHeight * aspectRatio;

            // 👉 높이는 별도 고정 (예: baseHeight + 30)
            targetHeight = baseHeight + 150;

            // 좌표
            targetX = 65;
            targetY = (canvas.height - targetHeight) / 2;

            console.log('📐 가로형:', { targetX, targetY, targetWidth, targetHeight });
          } else {
            // 📐 세로형 설정
            const targetHeightPortrait = canvas.height * 0.59;
            const aspectRatio = photoImg.width / photoImg.height;
            targetWidth = targetHeightPortrait * aspectRatio;

            targetX = 65; // 세로형 X 시작
            targetY = (canvas.height - targetHeightPortrait) / 2;

            targetHeight = targetHeightPortrait;

            console.log('📐 세로형:', { targetX, targetY, targetWidth, targetHeight });
          }

          // ✅ 최종 이미지 그리기
          ctx.drawImage(photoImg, targetX, targetY, targetWidth, targetHeight);

          const dataUrl = canvas.toDataURL('image/png');

          // ✅ 저장
          const result = await window.fileApi!.saveImageFromUrl(dataUrl, 'final_composite.png');
          if (result.success && result.filePath) {
            resolve(result.filePath);
          } else {
            reject(new Error(result.error || '파일 저장 실패'));
          }
        };

        photoImg.onerror = () => reject(new Error('사진 이미지 로드 실패'));
        photoImg.src = photoDataUrl;
      };

      frameImg.onerror = () => reject(new Error('프레임 이미지 로드 실패'));
      frameImg.src = `./frames/${frameId}.jpg`;
    });
  };



  const resizeImageForCard = async (imageDataUrl: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context를 생성할 수 없습니다.'));
        return;
      }

      canvas.width = 1010;
      canvas.height = 635;

      const img = new Image();
      img.onload = async () => {
        ctx.drawImage(img, 0, 0, 1010, 635);

        const dataUrl = canvas.toDataURL('image/png');

        try {
          const result = await window.fileApi!.saveImageFromUrl(
            dataUrl,
            'resized_image.png'
          );
          if (result.success && result.filePath) {
            console.log('✅ 리사이즈 이미지 저장 완료:', result.filePath);
            resolve(result.filePath);
          } else {
            reject(new Error(result.error || '파일 저장 실패'));
          }
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = imageDataUrl;
    });
  };

  const containerStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  };

  const backgroundStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: 'url(./process.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: backgroundLoaded ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
  };

  const contentWrapperStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  };

  const printingBoxStyle: CSSProperties = {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '24px',
    padding: '60px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
    border: '3px solid #f59e0b',
    maxWidth: '600px',
    width: '90%',
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
  };

  const errorDetailsStyle: CSSProperties = {
    fontSize: '18px',
    color: '#dc2626',
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    textAlign: 'left',
  };

  const buttonStyle: CSSProperties = {
    padding: '15px 30px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '20px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '20px',
    boxShadow: '0 6px 12px rgba(239, 68, 68, 0.3)',
    transition: 'all 0.3s ease',
  };

  return (
    <div style={containerStyle}>
      <div style={backgroundStyle} />

      {!backgroundLoaded && (
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
            화면 준비 중...
          </div>
        </div>
      )}

      {errorDetails && (
        <div style={contentWrapperStyle}>
          <div style={printingBoxStyle}>
            <div style={errorDetailsStyle}>{errorDetails}</div>
            <button
              style={buttonStyle}
              onClick={goToMainScreen}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ef4444';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              메인 화면으로 돌아가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintingScreen;
