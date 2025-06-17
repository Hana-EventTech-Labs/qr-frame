
// 임시 프레임 템플릿 데이터 (나중에 실제 이미지로 교체)
// const FRAME_TEMPLATES = [
//   { id: 'frame1', name: '클래식 화이트', preview: './frames/frame1.png' },
//   { id: 'frame2', name: '로즈 골드', preview: './frames/frame2.png' },
//   { id: 'frame3', name: '빈티지 브라운', preview: './frames/frame3.png' },
//   { id: 'frame4', name: '모던 블랙', preview: './frames/frame4.png' },
//   { id: 'frame5', name: '파스텔 핑크', preview: './frames/frame5.png' },
//   { id: 'frame6', name: '네이처 그린', preview: './frames/frame6.png' },
//   { id: 'frame7', name: '엘레간트 퍼플', preview: './frames/frame7.png' },
//   { id: 'frame8', name: '심플 그레이', preview: './frames/frame8.png' },
// ]
// 임시 프레임 템플릿 데이터 (온라인 플레이스홀더 이미지 사용)
const FRAME_TEMPLATES = [
    { id: 'frame1', name: '클래식 화이트', preview: 'https://via.placeholder.com/120x120/ffffff/000000?text=Frame1' },
    { id: 'frame2', name: '로즈 골드', preview: 'https://via.placeholder.com/120x120/ffc0cb/000000?text=Frame2' },
    { id: 'frame3', name: '빈티지 브라운', preview: 'https://via.placeholder.com/120x120/8b4513/ffffff?text=Frame3' },
    { id: 'frame4', name: '모던 블랙', preview: 'https://via.placeholder.com/120x120/000000/ffffff?text=Frame4' },
    { id: 'frame5', name: '파스텔 핑크', preview: 'https://via.placeholder.com/120x120/ffb6c1/000000?text=Frame5' },
    { id: 'frame6', name: '네이처 그린', preview: 'https://via.placeholder.com/120x120/90ee90/000000?text=Frame6' },
    { id: 'frame7', name: '엘레간트 퍼플', preview: 'https://via.placeholder.com/120x120/dda0dd/000000?text=Frame7' },
    { id: 'frame8', name: '심플 그레이', preview: 'https://via.placeholder.com/120x120/808080/ffffff?text=Frame8' },
]

// FrameSelectionScreen.tsx의 상단 import와 useEffect 수정

import { useState, useEffect, CSSProperties } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'


const FrameSelectionScreen = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [uploadedImage, setUploadedImage] = useState<string | null>(null)
    const [selectedFrame, setSelectedFrame] = useState<string | null>(null)
    const [isNavigating, setIsNavigating] = useState(false)

    useEffect(() => {
        // navigate state에서 이미지 가져오기
        const stateImage = location.state?.uploadedImage

        if (stateImage) {
            setUploadedImage(stateImage)
            console.log('이미지 로드 성공:', stateImage.substring(0, 50) + '...')
        } else {
            // 이미지가 없으면 QR 화면으로 돌아가기
            console.log('업로드된 이미지를 찾을 수 없습니다.')
            navigate('/upload')
        }
    }, [navigate, location.state])

    const handleFrameSelect = (frameId: string) => {
        setSelectedFrame(frameId)
    }

    const handlePrint = async () => {
        if (!selectedFrame || isNavigating) return
        setIsNavigating(true)

        // 선택된 프레임과 이미지 정보를 navigate state로 전달
        setTimeout(() => {
            navigate('/printing', {
                state: {
                    uploadedImage: uploadedImage,
                    selectedFrame: selectedFrame
                }
            })
        }, 100)
    }

    const handleGoBack = () => {
        if (isNavigating) return
        setIsNavigating(true)
        navigate('/upload')
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
        paddingBottom: '12px',
    }

    const instructionStyle: CSSProperties = {
        width: '100%',
        textAlign: 'center',
        fontSize: '28px',
        color: '#1f2937',
        marginBottom: '24px',
        lineHeight: '1.5',
        fontWeight: '600',
        background: 'linear-gradient(135deg, #e6f2ff, #d1e7ff)',
        padding: '20px 24px',
        borderRadius: '16px',
        boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
        border: '2px solid #3b82f6',
        maxWidth: '800px',
        margin: '0 auto 24px',
    }

    const contentStyle: CSSProperties = {
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '20px',
        marginBottom: '200px',
    }

    const frameGridStyle: CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '24px',
        maxWidth: '900px',
        width: '100%',
        padding: '0 40px',
        marginBottom: '40px',
    }

    const frameItemStyle: CSSProperties = {
        width: '180px',
        height: '200px',
        border: '3px solid #e5e7eb',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        backgroundColor: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    }

    const selectedFrameStyle: CSSProperties = {
        ...frameItemStyle,
        border: '4px solid #ef4444',
        backgroundColor: '#fef2f2',
        transform: 'scale(1.05)',
        boxShadow: '0 8px 16px rgba(239, 68, 68, 0.3)',
    }

    const framePreviewStyle: CSSProperties = {
        width: '120px',
        height: '120px',
        backgroundColor: '#e5e7eb',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '8px',
        overflow: 'hidden',
        position: 'relative',
    }

    const frameNameStyle: CSSProperties = {
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
    }

    const buttonContainerStyle: CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        gap: '40px',
        marginTop: '20px',
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
    }

    const backButtonStyle: CSSProperties = {
        ...buttonStyle,
        backgroundColor: '#e5e7eb',
        color: '#1f2937',
        border: '3px solid #d1d5db',
    }

    const printButtonStyle: CSSProperties = {
        ...buttonStyle,
        backgroundColor: selectedFrame ? '#ef4444' : '#cccccc',
        color: 'white',
        border: selectedFrame ? '3px solid #ef4444' : '3px solid #cccccc',
        cursor: selectedFrame ? 'pointer' : 'not-allowed',
        opacity: selectedFrame ? 1 : 0.6,
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
    }

    return (
        <div style={containerStyle}>
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

            {/* 안내 메시지 */}
            <div style={instructionStyle}>
                원하는 프레임을 선택해주세요
            </div>

            {/* 메인 컨텐츠 */}
            <div style={contentStyle}>
                {/* 프레임 그리드 */}
                <div style={frameGridStyle}>
                    {FRAME_TEMPLATES.map((frame) => (
                        <div
                            key={frame.id}
                            style={selectedFrame === frame.id ? selectedFrameStyle : frameItemStyle}
                            onClick={() => handleFrameSelect(frame.id)}
                        >
                            <div style={framePreviewStyle}>
                                {/* 임시 미리보기 - 나중에 실제 프레임 이미지와 사용자 이미지 합성 */}
                                <div style={{
                                    width: '80px',
                                    height: '60px',
                                    backgroundColor: '#d1d5db',
                                    border: '2px solid #9ca3af',
                                    borderRadius: '4px',
                                    position: 'relative',
                                }}>
                                    {uploadedImage && (
                                        <img
                                            src={uploadedImage}
                                            alt="User"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                borderRadius: '2px',
                                            }}
                                        />
                                    )}
                                </div>
                                {selectedFrame === frame.id && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        color: '#ef4444',
                                        fontSize: '20px',
                                    }}>
                                        ✓
                                    </div>
                                )}
                            </div>
                            <div style={frameNameStyle}>
                                {frame.name}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 버튼 영역 */}
                <div style={buttonContainerStyle}>
                    <button
                        onClick={handleGoBack}
                        style={backButtonStyle}
                    >
                        이전으로
                    </button>
                    <button
                        onClick={handlePrint}
                        style={printButtonStyle}
                        disabled={!selectedFrame}
                    >
                        인쇄하기
                    </button>
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

export default FrameSelectionScreen