import { useEffect, useRef, useState, CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

const QRCodeScreen = () => {
  const navigate = useNavigate()
  const socketRef = useRef<WebSocket | null>(null)

  const [eventId, setEventId] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  useEffect(() => {
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
              // 이미지 화질 개선
              const enhancedImageUrl = await enhanceImageQuality(imageUrl)
              setUploadedImage(enhancedImageUrl)
            } catch (err) {
              console.error('이미지 화질 개선 실패:', err)
              setUploadedImage(imageUrl) // 실패시 원본 이미지 사용
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
      img.crossOrigin = 'anonymous' // CORS 문제 해결

      img.onload = () => {
        // 캔버스 생성
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          console.error('Canvas context를 가져올 수 없습니다.')
          resolve(imageUrl) // 원본 이미지 URL 반환
          return
        }

        // 원본 이미지 크기 유지
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight

        // 고품질 이미지 렌더링 설정
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // 고품질 이미지 데이터 URL 생성 (품질 0.95로 설정)
        const enhancedImageUrl = canvas.toDataURL('image/jpeg', 0.95)
        resolve(enhancedImageUrl)
      }

      img.onerror = (err) => {
        console.error('이미지 로드 실패:', err)
        resolve(imageUrl) // 실패 시 원본 URL 반환
      }

      img.src = imageUrl
    })
  }

  // 이미지를 로컬에 저장하는 함수
  const saveImageToLocal = async (url: string, filename = 'photo.png') => {
    try {
      console.log('이미지 저장 시작', url)

      // fileApi가 있는지 확인 (Electron 환경)
      if (window.fileApi) {
        console.log('Electron fileApi 사용')
        const result = await window.fileApi.saveImageFromUrl(url, filename)

        if (!result.success) {
          throw new Error(result.error)
        }

        console.log('이미지 저장 성공:', result.filePath)
        return result.filePath
      } else {
        // 일반 브라우저 환경에서는 다운로드 대화상자 사용
        console.log('일반 브라우저 다운로드 사용')

        // Data URL인 경우 바로 다운로드
        if (url.startsWith('data:')) {
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          a.click()
          console.log('Data URL 이미지 다운로드 시작')
        } else {
          // URL인 경우 fetch로 다운로드
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

  // QRCodeScreen.tsx에서 수정할 부분만 표시
  // QRCodeScreen.tsx의 handleNext 함수 완전 수정

  const handleNext = async () => {
    // localStorage 완전히 사용하지 않고, navigate state로 이미지 전달
    if (uploadedImage) {
      // 다운로드는 그대로 진행
      await saveImageToLocal(uploadedImage)
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

    // navigate state로 이미지 URL 전달
    setTimeout(() => {
      navigate('/frame', {
        state: {
          uploadedImage: uploadedImage
        }
      })
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
  const handleCloseApp = () => {
    if (window.electronAPI) {
      window.electronAPI.closeApp()
    } else {
      console.log('Electron API를 찾을 수 없습니다. 브라우저 환경에서는 앱을 종료할 수 없습니다.')
    }
  }

  // 컨테이너 스타일 추가
  const containerStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative', // 절대 위치 지정을 위한 상대 위치 설정
    backgroundColor: '#ffffff',
    overflow: 'hidden', // 스크롤 방지
  }

  // 상단 로고 스타일
  const topLogoContainerStyle: CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '48px',
    paddingBottom: '12px', // 비율 안내 메시지를 위해 패딩 감소
  }

  // 비율 안내 메시지 스타일
  const ratioGuideStyle: CSSProperties = {
    width: '100%',
    textAlign: 'center',
    fontSize: '22px',
    color: '#1f2937', // 더 진한 색상
    marginBottom: '16px',
    lineHeight: '1.6',
    fontWeight: '600',
    background: 'linear-gradient(to right, #f0f4f8, #e6f2ff)',
    padding: '12px 20px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: '1px solid #e0e7ff',
    maxWidth: '700px',
    margin: '0 auto',
  }

  // 중앙 컨텐츠 스타일
  const contentContainerStyle: CSSProperties = {
    flex: '1',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: '20px',
    marginBottom: '150px',
  }

  // 하단 로고 스타일 - 절대 위치로 고정
  const bottomLogoContainerStyle: CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: '30px', // 화면 하단에서 30px 위에 배치
    left: 0,
    paddingBottom: '20px',
  }

  // 상단 우측 종료 버튼 스타일
  const closeButtonStyle: CSSProperties = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '100px',
    height: '100px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    zIndex: 100,
  }

  return (
    <div style={containerStyle}>
      {/* 앱 종료 버튼 */}
      <button
        onClick={handleCloseApp}
        style={closeButtonStyle}
        title="앱 종료"
      >
        <span style={{
          fontSize: '24px',
          color: 'transparent',
          fontWeight: 'bold'
        }}>종료</span>
      </button>

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

      {/* 비율 안내 메시지 */}
      <div style={ratioGuideStyle}>
        QR코드를 카메라로 인식 한 후,<br />
        반드시 가로형 4:3 비율의 사진을 업로드해주세요.<br />
        <span style={{ color: 'Red', fontWeight: '600' }}>
          ※ 가로가 아니거나 비율이 다르면 이미지가 변형되어 인쇄됩니다
        </span>
      </div>

      {/* 중앙 QR 코드 + 버튼 */}
      <div style={contentContainerStyle}>
        <div className="w-full max-w-[600px] flex flex-col items-center gap-12">
          {/* QR 코드 or 이미지 */}
          <div className="flex justify-center items-center w-full">
            {uploadedImage ? (
              <img
                src={uploadedImage}
                alt="Uploaded"
                style={{
                  width: '500px',
                  height: '500px',
                  objectFit: 'contain',
                  borderRadius: '16px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  display: 'block',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              />
            ) : qrUrl ? (
              <QRCodeSVG
                value={qrUrl}
                size={600}
                level="H"
                includeMargin
                style={{
                  display: 'block',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              />
            ) : (
              <p className="text-xl text-gray-500">QR 코드를 불러오는 중...</p>
            )}
          </div>

          {/* 버튼 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '40px',
              marginTop: '68px',
              marginBottom: '120px',
            }}
          >
            <button
              onClick={handleReset}
              style={{
                backgroundColor: '#e5e7eb',
                color: '#1f2937',
                padding: '24px 48px',
                borderRadius: '16px',
                fontSize: '24px',
                fontWeight: 'bold',
                border: '3px solid #d1d5db',
                minWidth: '200px',
                boxShadow: '0px 4px 10px rgba(0,0,0,0.15)',
              }}
            >
              처음으로
            </button>
            <button
              onClick={handleNext}
              style={{
                backgroundColor: uploadedImage ? '#ef4444' : '#cccccc',
                color: 'white',
                padding: '24px 48px',
                borderRadius: '16px',
                fontSize: '24px',
                fontWeight: 'bold',
                border: uploadedImage ? '3px solid #ef4444' : '3px solid #cccccc',
                minWidth: '200px',
                boxShadow: '0px 4px 10px rgba(0,0,0,0.15)',
                cursor: uploadedImage ? 'pointer' : 'not-allowed',
              }}
              disabled={!uploadedImage}
            >
              다음으로
            </button>
          </div>
        </div>
      </div>

      {/* 하단 로고 - 절대 위치로 고정 */}
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

// window 타입에 fileApi 추가
declare global {
  interface Window {
    fileApi?: {
      saveImageFromUrl: (url: string, filename: string) => Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
      }>;
    };
    electronAPI?: {
      closeApp: () => void;
    };
  }
}

export default QRCodeScreen