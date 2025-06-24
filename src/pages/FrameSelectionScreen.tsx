// 로컬 프레임 템플릿 데이터 (public/frames/ 폴더 사용)
const FRAME_TEMPLATES = [
    { id: 'frame1', name: '클래식 화이트', preview: './frames/frame1.jpg' },
    { id: 'frame2', name: '로즈 골드', preview: './frames/frame2.jpg' },
    { id: 'frame3', name: '빈티지 브라운', preview: './frames/frame3.jpg' },
    { id: 'frame4', name: '모던 블랙', preview: './frames/frame4.jpg' },
    { id: 'frame5', name: '파스텔 핑크', preview: './frames/frame5.jpg' },
    { id: 'frame6', name: '엘레간트 블루', preview: './frames/frame6.jpg' },
]

import { useState, useEffect, CSSProperties } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const FrameSelectionScreen = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [uploadedImage, setUploadedImage] = useState<string | null>(null)
    const [imageType, setImageType] = useState<'photo' | 'character'>('photo')
    const [selectedFrame, setSelectedFrame] = useState<string | null>(null)
    const [isNavigating, setIsNavigating] = useState(false)
    const [backgroundLoaded, setBackgroundLoaded] = useState(false)

    useEffect(() => {
        // navigate state에서 이미지와 타입 가져오기
        const stateImage = location.state?.uploadedImage
        const stateImageType = location.state?.imageType || 'photo'

        if (stateImage) {
            setUploadedImage(stateImage)
            setImageType(stateImageType)
            console.log('🖼️ 이미지 로드 성공:', stateImageType, stateImage.substring(0, 50) + '...')
        } else {
            // 이미지가 없으면 QR 화면으로 돌아가기
            console.log('❌ 업로드된 이미지를 찾을 수 없습니다.')
            navigate('/upload')
        }

        // 배경 즉시 로딩 완료로 설정
        setBackgroundLoaded(true)
    }, [navigate, location.state])

    const handleFrameSelect = (frameId: string) => {
        setSelectedFrame(frameId)
        console.log('🖼️ 프레임 선택됨:', frameId)
    }

    // 결제 화면으로 이동
    const handleNext = async () => {
        if (!selectedFrame || isNavigating) return
        setIsNavigating(true)

        console.log('💳 결제 화면으로 이동:', {
            hasImage: !!uploadedImage,
            imageType,
            selectedFrame
        })

        setTimeout(() => {
            navigate('/payment', {
                state: {
                    uploadedImage: uploadedImage,
                    imageType: imageType,
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

    // 미리보기 이미지 렌더링 함수 (리사이징 적용)
    const renderPreviewImage = () => {
        if (!uploadedImage) return null

        return (
            <img
                src={uploadedImage}
                alt={imageType === 'character' ? 'Selected Character' : 'Uploaded Photo'}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover', // contain → cover로 변경 (설정된 크기에 맞춰서 늘어남)
                    borderRadius: '4px',
                }}
                onError={(e) => {
                    console.error('이미지 로드 실패:', uploadedImage);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                }}
            />
        )
    }

    // 프레임 미리보기 이미지 렌더링 함수
    const renderFramePreview = (frame: typeof FRAME_TEMPLATES[0]) => {
        return (
            <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius: '8px',
                overflow: 'hidden',
            }}>
                {/* 프레임 배경 이미지 */}
                <img
                    src={frame.preview}
                    alt={frame.name}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain', // 프레임은 전체가 보이도록 유지
                        backgroundColor: '#f9fafb',
                    }}
                    onError={(e) => {
                        console.error('프레임 이미지 로드 실패:', frame.preview);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                            parent.style.backgroundColor = '#f3f4f6';
                            parent.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280; font-size: 14px; text-align: center;">${frame.name}</div>`;
                        }
                    }}
                />
                
                {/* 프레임 중앙에 미리보기 이미지 (크기 조정) */}
                <div style={{
                    position: 'absolute',
                    top: '50%',           
                    left: '20%',
                    transform: 'translate(-50%, -50%)',
                    width: '35%',        
                    height: '48%',      
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '2px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {uploadedImage ? (
                        renderPreviewImage()
                    ) : (
                        <div style={{
                            color: '#9ca3af',
                            fontSize: '14px',
                            textAlign: 'center',
                            padding: '4px',
                        }}>
                            {imageType === 'character' ? '캐릭터' : '사진'}
                        </div>
                    )}
                </div>

                {/* 선택 표시 */}
                {selectedFrame === frame.id && (
                    <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '30px',
                        height: '30px',
                        backgroundColor: '#ef4444',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                    }}>
                        ✓
                    </div>
                )}
            </div>
        );
    };

    // 스타일 정의
    const containerStyle: CSSProperties = {
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#fefbf7',
    }

    const backgroundStyle: CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #fefbf7 0%, #fef3e2 50%, #fef7ed 100%)',
        opacity: backgroundLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
    }

    const contentWrapperStyle: CSSProperties = {
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        zIndex: 1,
    }

    const titleStyle: CSSProperties = {
        fontSize: '36px',
        fontWeight: 'bold',
        color: '#92400e',
        textAlign: 'center',
        marginBottom: '20px',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
        fontFamily: '"Times New Roman", serif',
    }

    const imageTypeIndicatorStyle: CSSProperties = {
        fontSize: '18px',
        fontWeight: '600',
        color: '#92400e',
        marginBottom: '30px',
        padding: '12px 24px',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '25px',
        border: '2px solid #f59e0b',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    }

    const frameGridStyle: CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '30px',
        maxWidth: '700px',
        width: '100%',
        marginBottom: '40px',
        justifyContent: 'center',
        margin: '0 auto 40px auto',
    }

    const frameItemStyle: CSSProperties = {
        width: '320px',
        height: '200px',
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
        border: '3px solid transparent',
        overflow: 'hidden',
        position: 'relative',
    }

    const selectedFrameStyle: CSSProperties = {
        ...frameItemStyle,
        border: '4px solid #ef4444',
        transform: 'scale(1.05)',
        boxShadow: '0 12px 24px rgba(239, 68, 68, 0.3)',
    }

    const frameContentStyle: CSSProperties = {
        width: '100%',
        height: '100%',
        position: 'relative',
    }

    const buttonContainerStyle: CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        gap: '40px',
        marginTop: '30px',
    }

    const buttonStyle: CSSProperties = {
        padding: '18px 36px',
        borderRadius: '25px',
        fontSize: '22px',
        fontWeight: 'bold',
        minWidth: '180px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
        border: 'none',
    }

    const backButtonStyle: CSSProperties = {
        ...buttonStyle,
        backgroundColor: '#f3f4f6',
        color: '#374151',
        border: '2px solid #d1d5db',
    }

    const nextButtonStyle: CSSProperties = {
        ...buttonStyle,
        backgroundColor: selectedFrame ? '#ef4444' : '#9ca3af',
        color: 'white',
        cursor: selectedFrame ? 'pointer' : 'not-allowed',
        opacity: selectedFrame ? 1 : 0.7,
    }

    return (
        <div style={containerStyle}>
            {/* 배경 */}
            <div style={backgroundStyle} />

            {/* 메인 컨텐츠 */}
            <div style={contentWrapperStyle}>
                {/* 제목 */}
                <h1 style={titleStyle}>
                    💌 프레임을 선택해주세요 💌
                </h1>

                {/* 이미지 타입 표시 */}
                <div style={imageTypeIndicatorStyle}>
                    {imageType === 'character' ? '🎭 선택한 캐릭터' : '📷 업로드한 사진'}
                </div>

                {/* 프레임 그리드 */}
                <div style={frameGridStyle}>
                    {FRAME_TEMPLATES.map((frame) => (
                        <div
                            key={frame.id}
                            style={selectedFrame === frame.id ? selectedFrameStyle : frameItemStyle}
                            onClick={() => handleFrameSelect(frame.id)}
                            onMouseEnter={(e) => {
                                if (selectedFrame !== frame.id) {
                                    e.currentTarget.style.transform = 'scale(1.02)';
                                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.15)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedFrame !== frame.id) {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                                }
                            }}
                        >
                            <div style={frameContentStyle}>
                                {renderFramePreview(frame)}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 버튼 영역 */}
                <div style={buttonContainerStyle}>
                    <button
                        onClick={handleGoBack}
                        style={backButtonStyle}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e5e7eb';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        이전으로
                    </button>
                    <button
                        onClick={handleNext}
                        style={nextButtonStyle}
                        disabled={!selectedFrame}
                        onMouseEnter={(e) => {
                            if (selectedFrame) {
                                e.currentTarget.style.backgroundColor = '#dc2626';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (selectedFrame) {
                                e.currentTarget.style.backgroundColor = '#ef4444';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        결제하기
                    </button>
                </div>
            </div>

            {/* 로딩 인디케이터 */}
            {!backgroundLoaded && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#fefbf7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: '#92400e',
                    zIndex: 10,
                }}>
                    프레임 로딩 중...
                </div>
            )}
        </div>
    )
}

export default FrameSelectionScreen