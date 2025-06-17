import { useState, CSSProperties, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VirtualKeyboard from '../components/VirtualKeyboard';

const KeyboardScreen = () => {
  const [input, setInput] = useState('')
  const [isNavigating, setIsNavigating] = useState(false);

  const navigate = useNavigate();

  // input이 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (input) {
      localStorage.setItem('userInputText', input);
    }
  }, [input]);

  const handlePrint = () => {
    if (isNavigating) return; // 중복 방지
    setIsNavigating(true);

    // DOM 업데이트 시간을 조금 주고 navigate
    setTimeout(() => {
      navigate('/printing');
    }, 100); // 100ms 정도 주면 충분
  };

  // 메인 페이지로 이동하는 함수
  const handleGoToMain = () => {
    if (isNavigating) return; // 중복 방지
    setIsNavigating(true);


    navigate('/');

  };

  // 메인 컨테이너 스타일
  const containerStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
    gap: '16px', // 섹션 사이 간격 추가
  };

  // 상단 로고 스타일
  const topLogoContainerStyle: CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '48px',
    paddingBottom: '8px',
  };

  // 키보드 컨테이너 스타일
  const keyboardContainerStyle: CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '-20px',
    marginBottom: 'auto',
    paddingBottom: '400px',
  };

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
  };

  // 비율 안내 메시지 스타일
  const ratioGuideStyle: CSSProperties = {
    width: '100%',
    textAlign: 'center',
    fontSize: '22px', // 폰트 크기 증가
    color: '#1f2937', // 더 진한 색상
    marginBottom: '50px', // 아래 마진 증가
    lineHeight: '1.5',
    fontWeight: '600', // 폰트 굵기 증가
    background: 'linear-gradient(135deg, #e6f2ff, #d1e7ff)', // 더 선명한 그라데이션
    padding: '20px 24px', // 패딩 증가
    borderRadius: '16px', // 모서리 라운딩 증가
    boxShadow: '0 6px 12px rgba(0,0,0,0.1)', // 그림자 강조
    border: '2px solid #3b82f6', // 테두리 색상과 굵기 추가
    maxWidth: '800px', // 최대 너비 증가
    margin: '0 auto 24px', // 가운데 정렬 및 아래 마진 추가
    position: 'relative', // 추가 효과를 위한 포지셔닝
    transform: 'perspective(500px) rotateX(2deg)', // 미묘한 3D 효과
    transition: 'all 0.3s ease', // 부드러운 전환 효과
  };

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

      {/* 비율 안내 메시지 */}
      <div style={ratioGuideStyle}>
        <span style={{ color: 'Black', fontWeight: '600' }}>
          부모님의 성함을 직접 입력해주세요.<br />
          이름은 최대 7자까지 입력할 수 있습니다.<br /><br />
          ※ 문구 내용과 자연스럽게 연결되도록 <br />
          성함 뒤에 "아버지" 또는 "어머니" <span style={{ color: 'Red', fontWeight: '600' }}>호칭을 꼭 붙여주세요.<br /></span>
          <span style={{ color: 'Black', fontSize: '1.2em' , fontWeight: '600'}}>
            예: "홍길동 아버지" 
          </span>
        </span>
      </div>

      {/* 키보드 영역 */}
      <div style={keyboardContainerStyle}>
        <VirtualKeyboard onChange={setInput} onPrint={handlePrint} onGoToMain={handleGoToMain} />
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
  );
};

export default KeyboardScreen;