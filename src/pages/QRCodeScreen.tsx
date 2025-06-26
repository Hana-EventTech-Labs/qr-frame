import { useEffect, useRef, useState, CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

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

// 완성된 프레임 이미지 데이터
const COMPLETED_FRAMES = [
  { id: 'completed1', name: '뀨뀨', image: './completed_frames/frame1_complete.jpg' },
  { id: 'completed2', name: '또또', image: './completed_frames/frame2_complete.jpg' },
  { id: 'completed3', name: '묭묭', image: './completed_frames/frame3_complete.jpg' },
  { id: 'completed4', name: '사랑이', image: './completed_frames/frame4_complete.jpg' },
  { id: 'completed5', name: '토깽이', image: './completed_frames/frame5_complete.jpg' },
  { id: 'completed6', name: '효니', image: './completed_frames/frame6_complete.jpg' },
]

const QRCodeScreen = () => {
  const navigate = useNavigate()
  const socketRef = useRef<WebSocket | null>(null)

  const [eventId, setEventId] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null)
  const [showFrameModal, setShowFrameModal] = useState(false)
  const [backgroundLoaded, setBackgroundLoaded] = useState(false)

  useEffect(() => {
    // 이미지 프리로딩
    const initializeImages = async () => {
      if (!window.imagesPreloaded) {
        console.log('🖼️ 이미지 프리로딩 시작...')
        await preloadAllImages()
        window.imagesPreloaded = true
      }
      setBackgroundLoaded(true)
    }

    initializeImages()

    const createSession = async () => {
      try {
        const res = await fetch(
          'https://port-0-kiosk-builder-m47pn82w3295ead8.sel4.cloudtype.app/api/events/register?event_name=parents_day',
          {
            method: 'POST',
          }
        )
        const data = await res.json()
        setEventId(data.event_id)
        setQrUrl(data.qr_url)

        // WebSocket 연결
        const ws = new WebSocket(
          `wss://port-0-kiosk-builder-m47pn82w3295ead8.sel4.cloudtype.app/ws/kiosk/${data.event_id}`
        )
        socketRef.current = ws

        ws.onopen = () => console.log('📡 WebSocket 연결됨')
        ws.onclose = () => console.log('❌ WebSocket 종료됨')
        ws.onerror = (e) => console.error('WebSocket 오류:', e)
        ws.onmessage = async (msg) => {
          const data = JSON.parse(msg.data)
          console.log('📥 WebSocket 메시지:', data)

          if (data.type === 'image_uploaded') {
            const imageUrl = `https://port-0-kiosk-builder-m47pn82w3295ead8.sel4.cloudtype.app${data.image_url}`

            try {
              const enhancedImageUrl = await enhanceImageQuality(imageUrl)
              setUploadedImage(enhancedImageUrl)
              setSelectedFrame(null)
            } catch (err) {
              console.error('이미지 화질 개선 실패:', err)
              setUploadedImage(imageUrl)
              setSelectedFrame(null)
            }
          }
        }
      } catch (err) {
        console.error('세션 생성 실패:', err)
      }
    }

    createSession()

    return () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.close()
      }
    }
  }, [])

  // 이미지 화질 개선 함수
  const enhanceImageQuality = (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          console.error('Canvas context를 가져올 수 없습니다.')
          resolve(imageUrl)
          return
        }

        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        const enhancedImageUrl = canvas.toDataURL('image/jpeg', 0.95)
        resolve(enhancedImageUrl)
      }

      img.onerror = (err) => {
        console.error('이미지 로드 실패:', err)
        resolve(imageUrl)
      }

      img.src = imageUrl
    })
  }

  // 이미지를 로컬에 저장하는 함수
  const saveImageToLocal = async (url: string, filename = 'photo.png') => {
    try {
      console.log('이미지 저장 시작', url)

      if (window.fileApi) {
        console.log('Electron fileApi 사용')
        const result = await window.fileApi.saveImageFromUrl(url, filename)

        if (!result.success) {
          throw new Error(result.error)
        }

        console.log('이미지 저장 성공:', result.filePath)
        return result.filePath
      } else {
        console.log('일반 브라우저 다운로드 사용')

        if (url.startsWith('data:')) {
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          a.click()
          console.log('Data URL 이미지 다운로드 시작')
        } else {
          const response = await fetch(url)
          const blob = await response.blob()
          const objectUrl = URL.createObjectURL(blob)

          const a = document.createElement('a')
          a.href = objectUrl
          a.download = filename
          a.click()

          URL.revokeObjectURL(objectUrl)
        }

        console.log('다운로드 다이얼로그 표시됨')
      }
    } catch (err) {
      console.error('이미지 저장 실패:', err)
    }
  }

  // 프레임 선택 핸들러
  const handleFrameSelect = (frameId: string) => {
    const frame = COMPLETED_FRAMES.find(f => f.id === frameId)
    if (frame) {
      setSelectedFrame(frame.image)
      setUploadedImage(null)
      setShowFrameModal(false)
      console.log('🖼️ 완성된 프레임 선택됨:', frame.name)
    }
  }

  // 다음으로 버튼 핸들러
  const handleNext = async () => {
    const imageToUse = uploadedImage || selectedFrame

    if (imageToUse) {
      await saveImageToLocal(imageToUse)
    }

    // WebSocket 정리 & 서버 삭제 요청
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.close()
    }

    if (eventId) {
      try {
        await fetch(
          `https://port-0-kiosk-builder-m47pn82w3295ead8.sel4.cloudtype.app/api/events/${eventId}`,
          {
            method: 'DELETE',
          }
        )
      } catch (err) {
        console.error('세션 삭제 실패:', err)
      }
    }

    setTimeout(() => {
      if (uploadedImage) {
        navigate('/frame', {
          state: {
            uploadedImage: imageToUse,
            imageType: 'photo'
          }
        })
      } else if (selectedFrame) {
        navigate('/payment', {
          state: {
            uploadedImage: imageToUse,
            imageType: 'frame',
            selectedFrame: null
          }
        })
      }
    }, 100)
  }

  const handleReset = async () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.close()
    }

    if (eventId) {
      try {
        await fetch(
          `https://port-0-kiosk-builder-m47pn82w3295ead8.sel4.cloudtype.app/api/events/${eventId}`,
          {
            method: 'DELETE',
          }
        )
      } catch (err) {
        console.error('세션 삭제 실패:', err)
      }
    }

    navigate('/')
  }

  // 앱 종료 함수

  // 프레임 이미지 렌더링 함수
  const renderFrameImage = (frame: typeof COMPLETED_FRAMES[0]) => {
    return (
      <img
        src={frame.image}
        alt={frame.name}
        style={{
          width: '140px',
          height: '110px',
          objectFit: 'cover',
          borderRadius: '12px',
          marginBottom: '8px',
          border: '2px solid #d4af37',
        }}
        onError={(e) => {
          console.error('프레임 이미지 로드 실패:', frame.image);
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            const placeholder = document.createElement('div');
            placeholder.style.width = '140px';
            placeholder.style.height = '110px';
            placeholder.style.backgroundColor = '#f5f1e8';
            placeholder.style.borderRadius = '12px';
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            placeholder.style.color = '#8b6914';
            placeholder.style.fontSize = '12px';
            placeholder.style.marginBottom = '8px';
            placeholder.style.border = '2px solid #d4af37';
            placeholder.textContent = frame.name;
            parent.insertBefore(placeholder, target);
          }
        }}
      />
    );
  };

  // 스타일 정의
  const containerStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Noto Serif KR', serif",
  }

  const backgroundStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: 'url(./qrscreen.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: backgroundLoaded ? 1 : 0,
    transition: backgroundLoaded ? 'opacity 0.3s ease-in-out' : 'none',
  }

  // 빈티지 편지지 스타일에 맞는 컨텐츠 영역
  const contentAreaStyle: CSSProperties = {
    position: 'absolute',
    top: '120px',
    left: '80px',
    right: '80px',
    bottom: '200px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  }

  // 빈티지 스타일 제목
  const titleStyle: CSSProperties = {
    fontSize: '48px',
    fontWeight: '600',
    color: '#8b4513',
    textAlign: 'center',
    marginBottom: '40px',
    fontFamily: "'Noto Serif KR', serif",
    textShadow: '2px 2px 4px rgba(139, 69, 19, 0.3)',
    letterSpacing: '2px',
  }

  // 설명 텍스트 스타일
  const descriptionStyle: CSSProperties = {
    fontSize: '24px',
    color: '#654321',
    textAlign: 'center',
    marginBottom: '50px',
    lineHeight: '1.6',
    fontFamily: "'Noto Serif KR', serif",
    maxWidth: '600px',
    padding: '20px',
    backgroundColor: 'rgba(245, 241, 232, 0.8)',
    borderRadius: '15px',
    border: '2px solid rgba(212, 175, 55, 0.3)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  }

  // QR 코드 또는 이미지 컨테이너
  const mediaContainerStyle: CSSProperties = {
    position: 'relative',
    marginBottom: '40px',
    padding: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '20px',
    border: '3px solid #d4af37',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
  }

  // 빈티지 스타일 버튼
  const vintageButtonStyle: CSSProperties = {
    padding: '16px 32px',
    backgroundColor: '#8b4513',
    color: '#f5f1e8',
    border: '3px solid #d4af37',
    borderRadius: '12px',
    fontSize: '20px',
    fontWeight: '600',
    fontFamily: "'Noto Serif KR', serif",
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(139, 69, 19, 0.3)',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
    margin: '0 15px',
    minWidth: '160px',
  }

  // 액션 버튼들 컨테이너
  const actionsStyle: CSSProperties = {
    display: 'flex',
    gap: '30px',
    alignItems: 'center',
    marginTop: '30px',
  }

  // 갤러리 버튼 (편지지 오른쪽 상단 모서리에 위치)
  const galleryButtonStyle: CSSProperties = {
    position: 'absolute',
    top: '40px',
    right: '80px',
    padding: '12px 20px',
    backgroundColor: '#d4af37',
    border: '4px solid #8b4513',
    borderRadius: '25px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: '600',
    color: '#8b4513',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.8)',
    transition: 'all 0.3s ease',
    zIndex: 20,
    backdropFilter: 'blur(5px)',
    fontFamily: "'Noto Serif KR', serif",
    gap: '8px',
    minWidth: '180px',
  }

  // 모달 스타일 (빈티지 편지지 테마)
  const modalOverlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  }

  const modalContentStyle: CSSProperties = {
    backgroundColor: '#f5f1e8',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '900px',
    width: '90%',
    maxHeight: '80%',
    overflow: 'auto',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    border: '3px solid #d4af37',
    fontFamily: "'Noto Serif KR', serif",
  }

  const frameGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '25px',
    marginTop: '30px',
  }

  const frameItemStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: '2px solid #d4af37',
    borderRadius: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  }

  return (
    <div style={containerStyle}>
      {/* CSS 애니메이션 */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&display=swap');
          
          @keyframes vintage-glow {
            0%, 100% { 
              box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.8);
            }
            50% { 
              box-shadow: 0 12px 30px rgba(212, 175, 55, 0.6), 0 0 0 3px rgba(255, 255, 255, 1), 0 0 20px rgba(212, 175, 55, 0.4);
            }
          }
          
          @keyframes gentle-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
          }
          
          .vintage-hover:hover {
            background-color: #a0522d !important;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(139, 69, 19, 0.4) !important;
          }
          
          .gallery-hover:hover {
            transform: scale(1.05) translateY(-2px) !important;
            background-color: #f4d03f !important;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4), 0 0 0 3px rgba(255, 255, 255, 1) !important;
            animation: vintage-glow 1.5s infinite;
          }
          
          .media-container {
            animation: gentle-float 3s infinite ease-in-out;
          }
        `}
      </style>

      {/* 배경 이미지 */}
      <div style={backgroundStyle} />

      {/* 로딩 인디케이터 */}
      {!backgroundLoaded && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#f5f1e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8b4513',
            fontSize: '32px',
            fontWeight: '600',
            fontFamily: "'Noto Serif KR', serif",
          }}
        >
          편지지 준비 중...
        </div>
      )}

      {/* 갤러리 버튼 (편지지 오른쪽 상단) */}
      <button
        onClick={() => setShowFrameModal(true)}
        style={galleryButtonStyle}
        className="gallery-hover"
        title="캐릭터로 출력하기"
      >
        🖼️ 캐릭터로 출력하기
      </button>

      {/* 메인 컨텐츠 영역 */}
      <div style={contentAreaStyle}>
        {/* 제목 */}
        <h1 style={titleStyle}>
          {selectedFrame ? '선택된 캐릭터' : uploadedImage ? '업로드된 사진' : '내 사진으로 만들기'}
        </h1>

        {/* 설명 */}
        {!uploadedImage && !selectedFrame && (
          <div style={descriptionStyle}>
            스마트폰으로 QR코드를 스캔하여<br />
            소중한 사진을 업로드해주세요<br />
            <span style={{ color: '#d4af37', fontWeight: '600' }}>
              ※ 가로 4:3 비율 권장
            </span>
          </div>
        )}

        {/* QR 코드 또는 선택된 이미지 */}
        <div style={mediaContainerStyle} className="media-container">
          {selectedFrame ? (
            <img
              src={selectedFrame}
              alt="Selected Frame"
              style={{
                width: '400px',
                height: '400px',
                objectFit: 'contain',
                borderRadius: '12px',
              }}
            />
          ) : uploadedImage ? (
            <img
              src={uploadedImage}
              alt="Uploaded Photo"
              style={{
                width: '400px',
                height: '400px',
                objectFit: 'contain',
                borderRadius: '12px',
              }}
            />
          ) : qrUrl ? (
            <QRCodeSVG
              value={qrUrl}
              size={400}
              level="H"
              includeMargin
              style={{
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '12px',
              }}
            />
          ) : (
            <div style={{
              width: '400px',
              height: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8b4513',
              fontSize: '24px',
              fontFamily: "'Noto Serif KR', serif",
            }}>
              QR 코드 생성 중...
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div style={actionsStyle}>
          <button
            onClick={handleReset}
            style={{
              ...vintageButtonStyle,
              backgroundColor: '#6b4423',
            }}
            className="vintage-hover"
          >
            처음으로
          </button>
          
          <button
            onClick={handleNext}
            style={{
              ...vintageButtonStyle,
              backgroundColor: (uploadedImage || selectedFrame) ? '#8b4513' : '#a0a0a0',
              cursor: (uploadedImage || selectedFrame) ? 'pointer' : 'not-allowed',
              opacity: (uploadedImage || selectedFrame) ? 1 : 0.6,
            }}
            className={uploadedImage || selectedFrame ? "vintage-hover" : ""}
            disabled={!uploadedImage && !selectedFrame}
          >
            다음으로
          </button>
        </div>
      </div>

      {/* 프레임 갤러리 모달 */}
      {showFrameModal && (
        <div style={modalOverlayStyle} onClick={() => setShowFrameModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: '20px',
              color: '#8b4513',
              fontFamily: "'Noto Serif KR', serif",
              textShadow: '2px 2px 4px rgba(139, 69, 19, 0.3)',
            }}>
              캐릭터 선택하기 🖼️
            </h2>

            <div style={frameGridStyle}>
              {COMPLETED_FRAMES.map((frame) => (
                <div
                  key={frame.id}
                  style={frameItemStyle}
                  onClick={() => handleFrameSelect(frame.id)}
                  onMouseOver={(e) => {
                    const target = e.target as HTMLDivElement
                    target.style.borderColor = '#8b4513'
                    target.style.backgroundColor = 'rgba(255, 255, 255, 1)'
                    target.style.transform = 'scale(1.05)'
                    target.style.boxShadow = '0 8px 20px rgba(139, 69, 19, 0.3)'
                  }}
                  onMouseOut={(e) => {
                    const target = e.target as HTMLDivElement
                    target.style.borderColor = '#d4af37'
                    target.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
                    target.style.transform = 'scale(1)'
                    target.style.boxShadow = 'none'
                  }}
                >
                  {renderFrameImage(frame)}
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#8b4513',
                    textAlign: 'center',
                    fontFamily: "'Noto Serif KR', serif",
                  }}>
                    {frame.name}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '40px'
            }}>
              <button
                onClick={() => setShowFrameModal(false)}
                style={{
                  ...vintageButtonStyle,
                  backgroundColor: '#6b4423',
                }}
                className="vintage-hover"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// window 타입 확장
declare global {
  interface Window {
    fileApi?: {
      saveImageFromUrl: (url: string, filename: string) => Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
      }>;
    };
    imagesPreloaded?: boolean;
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

export default QRCodeScreen