import { useEffect, useRef, useState, CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

// 캐릭터 이미지 데이터 (public/characters/ 폴더에 이미지 저장)
const CHARACTER_IMAGES = [
  { id: 'char1', name: '귀여운 곰', image: './characters/bear.png' },
  { id: 'char2', name: '사랑스러운 고양이', image: './characters/cat.png' },
  { id: 'char3', name: '친근한 강아지', image: './characters/dog.png' },
  { id: 'char4', name: '고양이', image: './characters/cat.png' },
  { id: 'char5', name: '꽃', image: './characters/flower.png' },
  { id: 'char6', name: '하트', image: './characters/heart.png' },
]

const QRCodeScreen = () => {
  const navigate = useNavigate()
  const socketRef = useRef<WebSocket | null>(null)

  const [eventId, setEventId] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
  const [showCharacterModal, setShowCharacterModal] = useState(false)
  const [backgroundLoaded, setBackgroundLoaded] = useState(false)

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
              const enhancedImageUrl = await enhanceImageQuality(imageUrl)
              setUploadedImage(enhancedImageUrl)
              setSelectedCharacter(null)
            } catch (err) {
              console.error('이미지 화질 개선 실패:', err)
              setUploadedImage(imageUrl)
              setSelectedCharacter(null)
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

  // 캐릭터 선택 핸들러
  const handleCharacterSelect = (characterId: string) => {
    const character = CHARACTER_IMAGES.find(char => char.id === characterId)
    if (character) {
      setSelectedCharacter(character.image)
      setUploadedImage(null)
      setShowCharacterModal(false)
      console.log('🎭 캐릭터 선택됨:', character.name)
    }
  }

  // 다음으로 버튼 핸들러
  const handleNext = async () => {
    const imageToUse = uploadedImage || selectedCharacter

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
      navigate('/frame', {
        state: {
          uploadedImage: imageToUse,
          imageType: uploadedImage ? 'photo' : 'character'
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

  // 캐릭터 이미지 렌더링 함수
  const renderCharacterImage = (character: typeof CHARACTER_IMAGES[0]) => {
    return (
      <img
        src={character.image}
        alt={character.name}
        style={{
          width: '150px',
          height: '120px',
          objectFit: 'cover',
          borderRadius: '8px',
          marginBottom: '10px',
        }}
        onError={(e) => {
          console.error('캐릭터 이미지 로드 실패:', character.image);
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            const placeholder = document.createElement('div');
            placeholder.style.width = '150px';
            placeholder.style.height = '120px';
            placeholder.style.backgroundColor = '#e5e7eb';
            placeholder.style.borderRadius = '8px';
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            placeholder.style.color = '#6b7280';
            placeholder.style.fontSize = '14px';
            placeholder.style.marginBottom = '10px';
            placeholder.textContent = character.name;
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
    transition: 'opacity 1s ease-in-out',
  }

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

  const characterButtonStyle: CSSProperties = {
    padding: '16px 32px',
    borderRadius: '12px',
    fontSize: '20px',
    fontWeight: 'bold',
    border: '3px solid #8b5cf6',
    backgroundColor: '#f3e8ff',
    color: '#7c3aed',
    cursor: 'pointer',
    boxShadow: '0px 4px 10px rgba(0,0,0,0.15)',
    transition: 'all 0.3s ease',
    marginBottom: '20px',
    position: 'absolute',
    top: '150px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
  }

  const selectedImageDisplayStyle: CSSProperties = {
    width: '400px',
    height: '300px',
    border: '3px solid #8b5cf6',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3e8ff',
    position: 'absolute',
    top: '250px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
  }

  const qrContainerStyle: CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 10,
  }

  const buttonContainerStyle: CSSProperties = {
    position: 'absolute',
    bottom: '250px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '40px',
    zIndex: 10,
  }

  const buttonStyle: CSSProperties = {
    padding: '24px 48px',
    borderRadius: '16px',
    fontSize: '24px',
    fontWeight: 'bold',
    minWidth: '200px',
    boxShadow: '0px 4px 10px rgba(0,0,0,0.15)',
    cursor: 'pointer',
  }

  const resetButtonStyle: CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#e5e7eb',
    color: '#1f2937',
    border: '3px solid #d1d5db',
  }

  const nextButtonStyle: CSSProperties = {
    ...buttonStyle,
    backgroundColor: (uploadedImage || selectedCharacter) ? '#ef4444' : '#cccccc',
    color: 'white',
    border: (uploadedImage || selectedCharacter) ? '3px solid #ef4444' : '3px solid #cccccc',
    cursor: (uploadedImage || selectedCharacter) ? 'pointer' : 'not-allowed',
  }

  // 모달 스타일
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
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '80%',
    overflow: 'auto',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
  }

  const characterGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginTop: '20px',
  }

  const characterItemStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: '#f9fafb',
  }

  return (
    <div style={containerStyle}>
      {/* 배경 이미지 */}
      <div style={backgroundStyle} />

      {/* 백업 이미지 로드 체크 */}
      <img
        src="./qrscreen.png"
        alt="QR Screen Background"
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
        }}
        onLoad={() => setBackgroundLoaded(true)}
        onError={() => {
          console.log('qrscreen.png를 찾을 수 없습니다.');
          setBackgroundLoaded(true); // 에러여도 진행
        }}
      />

      {/* 로딩 인디케이터 */}
      {!backgroundLoaded && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: '32px',
            fontWeight: '600',
          }}
        >
          배경 로딩 중...
        </div>
      )}

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

      {/* 캐릭터 선택 버튼 */}
      <button
        onClick={() => setShowCharacterModal(true)}
        style={characterButtonStyle}
        onMouseOver={(e) => {
          const target = e.target as HTMLButtonElement
          target.style.backgroundColor = '#e9d5ff'
          target.style.transform = 'translateX(-50%) scale(1.05)'
        }}
        onMouseOut={(e) => {
          const target = e.target as HTMLButtonElement
          target.style.backgroundColor = '#f3e8ff'
          target.style.transform = 'translateX(-50%) scale(1)'
        }}
      >
        🎭 귀여운 캐릭터 선택하기
      </button>

      {/* 선택된 캐릭터 표시 */}
      {selectedCharacter && (
        <div style={selectedImageDisplayStyle}>
          <img
            src={selectedCharacter}
            alt="Selected Character"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '8px',
            }}
            onError={(e) => {
              console.error('선택된 캐릭터 이미지 로드 실패:', selectedCharacter);
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.style.backgroundColor = '#e5e7eb';
                parent.innerHTML = '<span style="color: #6b7280; font-size: 16px;">이미지를 불러올 수 없습니다</span>';
              }
            }}
          />
        </div>
      )}

      {/* QR 코드 or 업로드된 이미지 */}
      {!selectedCharacter && (
        <div style={qrContainerStyle}>
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
              }}
            />
          ) : qrUrl ? (
            <QRCodeSVG
              value={qrUrl}
              size={600}
              level="H"
              includeMargin
            />
          ) : (
            <p style={{ color: '#6b7280', fontSize: '24px' }}>QR 코드를 불러오는 중...</p>
          )}
        </div>
      )}

      {/* 버튼 영역 */}
      <div style={buttonContainerStyle}>
        <button
          onClick={handleReset}
          style={resetButtonStyle}
        >
          처음으로
        </button>
        <button
          onClick={handleNext}
          style={nextButtonStyle}
          disabled={!uploadedImage && !selectedCharacter}
        >
          다음으로
        </button>
      </div>

      {/* 캐릭터 선택 모달 */}
      {showCharacterModal && (
        <div style={modalOverlayStyle} onClick={() => setShowCharacterModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '20px',
              color: '#1f2937'
            }}>
              귀여운 캐릭터를 선택하세요 🎭
            </h2>
            
            <div style={characterGridStyle}>
              {CHARACTER_IMAGES.map((character) => (
                <div
                  key={character.id}
                  style={characterItemStyle}
                  onClick={() => handleCharacterSelect(character.id)}
                  onMouseOver={(e) => {
                    const target = e.target as HTMLDivElement
                    target.style.borderColor = '#8b5cf6'
                    target.style.backgroundColor = '#f3e8ff'
                    target.style.transform = 'scale(1.05)'
                  }}
                  onMouseOut={(e) => {
                    const target = e.target as HTMLDivElement
                    target.style.borderColor = '#e5e7eb'
                    target.style.backgroundColor = '#f9fafb'
                    target.style.transform = 'scale(1)'
                  }}
                >
                  {renderCharacterImage(character)}
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#374151',
                    textAlign: 'center'
                  }}>
                    {character.name}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '30px'
            }}>
              <button
                onClick={() => setShowCharacterModal(false)}
                style={{
                  padding: '12px 30px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
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
  }
}

export default QRCodeScreen