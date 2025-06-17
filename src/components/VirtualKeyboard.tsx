import { useRef, useState, CSSProperties } from 'react'
import { HangulComposer } from '../logic/hangulComposer'

interface VirtualKeyboardProps {
    onChange: (text: string) => void
    onPrint?: () => void;
    onGoToMain?: () => void;
}

const VirtualKeyboard = ({ onChange, onPrint, onGoToMain }: VirtualKeyboardProps) => {
    const composerRef = useRef(new HangulComposer())
    const [text, setText] = useState('')
    const [composing, setComposing] = useState('')
    const [isKorean, setIsKorean] = useState(true)
    const [isShiftActive, setIsShiftActive] = useState(false)

    // handleKeyClick 함수를 수정합니다.
    // 숫자 키가 입력되도록 수정합니다.

    const handleKeyClick = (key: string) => {
        // 숫자 키 처리 추가
        if (/^[0-9]$/.test(key)) {
            const newText = text + key;
            setText(newText);
            setComposing('');
            onChange(newText);
            return;
        }

        if (!isKorean) {
            let keyToAdd = key;
            if (isShiftActive) {
                keyToAdd = key.toUpperCase();
                setIsShiftActive(false);
            } else {
                keyToAdd = key.toLowerCase();
            }

            const newText = text + keyToAdd;
            setText(newText);
            setComposing('');
            onChange(newText);
            return;
        }

        const [committed, current] = composerRef.current.addJamo(key);
        let newText = text;
        if (committed) newText += committed;

        setText(newText);
        setComposing(current);
        onChange(newText + current);
    };

    const handleBackspace = () => {
        if (!isKorean || composing === '') {
            const newText = (text + composing).slice(0, -1)
            setText(newText)
            setComposing('')
            onChange(newText)
            return
        }

        const [current, changed] = composerRef.current.backspace()
        if (changed) {
            setComposing(current)
            onChange(text + current)
        } else if (text.length > 0) {
            const newText = text.slice(0, -1)
            setText(newText)
            onChange(newText)
        }
    }

    const handleSpace = () => {
        composerRef.current.reset()
        const newText = text + composing + ' '
        setText(newText)
        setComposing('')
        onChange(newText)
    }

    const handleEnter = () => {
        composerRef.current.reset()
        const newText = text + composing + '\n'
        setText(newText)
        setComposing('')
        onChange(newText)
    }

    const toggleLanguage = () => {
        setIsKorean(!isKorean)
        composerRef.current.reset()
        setComposing('')
    }

    const toggleShift = () => {
        setIsShiftActive(!isShiftActive)
    }

    // 공통 키 스타일 - 처음부터 color 속성 포함
    const commonKeyStyle: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        transition: 'all 0.3s',
        fontFamily: 'sans-serif',
        background: 'white',
        color: 'black', // 기본 텍스트 색상 추가
        width: '80px',
        height: '90px',
        fontSize: '28px',
        marginRight: '12px',
        marginBottom: '12px',
        cursor: 'pointer',
    };
    

    // 특수 키 스타일 (backspace, enter 등)
    const specialKeyStyle: CSSProperties = {
        ...commonKeyStyle,
        width: '112px',
        height: '80px',
        fontSize: '22px',
        fontWeight: 'bold',  // 글자 굵게
    };

    // 인쇄하기 버튼 스타일
    const printKeyStyle: CSSProperties = {
        ...specialKeyStyle,
        width: '200px',      // 너비 증가
        fontSize: '28px',    // 폰트 크기 증가
        fontWeight: 'bold',  // 글자 굵게
        background: '#dcfce7', // 연한 초록색 배경
        color: '#16a34a',    // 진한 초록색 글자
    };

    // 스페이스바 스타일
    const spaceKeyStyle: CSSProperties = {
        ...commonKeyStyle,
        width: '320px',
        height: '80px',
        fontSize: '14px',
    };

    // 행 컨테이너 스타일
    const rowStyle: CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        marginBottom: '12px',
    };

    // 키보드 컨테이너 스타일
    const keyboardContainerStyle: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
        backgroundColor: '#e5e7eb',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        border: '1px solid #d1d5db',
        width: '100%',
    };

    // 표시 영역 스타일
    const displayAreaStyle: CSSProperties = {
        width: '100%',
        minHeight: '100px',
        maxHeight: '248px',
        padding: '24px',
        marginBottom: '16px',
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 px 3px rgba(247, 70, 70, 0.12), 0 1px 2px rgba(77, 41, 41, 0.24)',
        overflow: 'auto',
    };

    const displayTextStyle: CSSProperties = {
        fontSize: '80px',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
        textAlign: 'center',
    };

    const cursorStyle: CSSProperties = {
        animation: 'blink 1s step-end infinite',
    };

    const composingTextStyle: CSSProperties = {
        color: '#3b82f6',
    };

    // 메인으로 버튼 스타일
    const mainKeyStyle: CSSProperties = {
        ...specialKeyStyle,
        width: '150px',      // 너비 설정
        fontSize: '23px',    // 폰트 크기 설정 수정
        fontWeight: 'bold',  // 글자 굵게
        background: '#fef3c7', // 연한 노란색 배경
        color: '#d97706',    // 진한 주황색 글자
        height: '90px',      // 일반 키와 같은 높이로 설정
    };

    // Korean keyboard layout
    const koreanKeyboard = [
        [
            { label: 'ㅂ', key: 'ㅂ', shiftLabel: 'ㅃ', shiftKey: 'ㅃ' },
            { label: 'ㅈ', key: 'ㅈ', shiftLabel: 'ㅉ', shiftKey: 'ㅉ' },
            { label: 'ㄷ', key: 'ㄷ', shiftLabel: 'ㄸ', shiftKey: 'ㄸ' },
            { label: 'ㄱ', key: 'ㄱ', shiftLabel: 'ㄲ', shiftKey: 'ㄲ' },
            { label: 'ㅅ', key: 'ㅅ', shiftLabel: 'ㅆ', shiftKey: 'ㅆ' },
            { label: 'ㅛ', key: 'ㅛ' },
            { label: 'ㅕ', key: 'ㅕ' },
            { label: 'ㅑ', key: 'ㅑ' },
            { label: 'ㅐ', key: 'ㅐ', shiftLabel: 'ㅒ', shiftKey: 'ㅒ' },
            { label: 'ㅔ', key: 'ㅔ', shiftLabel: 'ㅖ', shiftKey: 'ㅖ' },
            { label: '⌫', key: 'Backspace', isSpecial: true },
        ],
        [
            { label: 'ㅁ', key: 'ㅁ' },
            { label: 'ㄴ', key: 'ㄴ' },
            { label: 'ㅇ', key: 'ㅇ' },
            { label: 'ㄹ', key: 'ㄹ' },
            { label: 'ㅎ', key: 'ㅎ' },
            { label: 'ㅗ', key: 'ㅗ' },
            { label: 'ㅓ', key: 'ㅓ' },
            { label: 'ㅏ', key: 'ㅏ' },
            { label: 'ㅣ', key: 'ㅣ' },
            { label: '처음으로', key: 'Main', isSpecial: true },
        ],
        [
            { label: '⇧', key: 'Shift', isSpecial: true, isShift: true },
            { label: 'ㅋ', key: 'ㅋ' },
            { label: 'ㅌ', key: 'ㅌ' },
            { label: 'ㅊ', key: 'ㅊ' },
            { label: 'ㅍ', key: 'ㅍ' },
            { label: 'ㅠ', key: 'ㅠ' },
            { label: 'ㅜ', key: 'ㅜ' },
            { label: 'ㅡ', key: 'ㅡ' },
            //   { label: '⏎', key: 'Enter', isSpecial: true }
        ],
        [
            { label: '한/영', key: 'Lang', isSpecial: true },
            { label: ' ', key: 'Space', isWide: true },
            { label: '인쇄하기', key: 'Print', isSpecial: true },
        ]
    ];

    // English keyboard layout
    const englishKeyboard = [
        [
            { label: '1', key: '1' },
            { label: '2', key: '2' },
            { label: '3', key: '3' },
            { label: '4', key: '4' },
            { label: '5', key: '5' },
            { label: '6', key: '6' },
            { label: '7', key: '7' },
            { label: '8', key: '8' },
            { label: '9', key: '9' },
            { label: '0', key: '0' },
            { label: '⌫', key: 'Backspace', isSpecial: true },
        ],
        [
            { label: 'q', key: 'q', shiftLabel: 'Q', shiftKey: 'Q' },
            { label: 'w', key: 'w', shiftLabel: 'W', shiftKey: 'W' },
            { label: 'e', key: 'e', shiftLabel: 'E', shiftKey: 'E' },
            { label: 'r', key: 'r', shiftLabel: 'R', shiftKey: 'R' },
            { label: 't', key: 't', shiftLabel: 'T', shiftKey: 'T' },
            { label: 'y', key: 'y', shiftLabel: 'Y', shiftKey: 'Y' },
            { label: 'u', key: 'u', shiftLabel: 'U', shiftKey: 'U' },
            { label: 'i', key: 'i', shiftLabel: 'I', shiftKey: 'I' },
            { label: 'o', key: 'o', shiftLabel: 'O', shiftKey: 'O' },
            { label: 'p', key: 'p', shiftLabel: 'P', shiftKey: 'P' },
            { label: '처음으로', key: 'Main', isSpecial: true },
        ],
        [
            { label: 'a', key: 'a', shiftLabel: 'A', shiftKey: 'A' },
            { label: 's', key: 's', shiftLabel: 'S', shiftKey: 'S' },
            { label: 'd', key: 'd', shiftLabel: 'D', shiftKey: 'D' },
            { label: 'f', key: 'f', shiftLabel: 'F', shiftKey: 'F' },
            { label: 'g', key: 'g', shiftLabel: 'G', shiftKey: 'G' },
            { label: 'h', key: 'h', shiftLabel: 'H', shiftKey: 'H' },
            { label: 'j', key: 'j', shiftLabel: 'J', shiftKey: 'J' },
            { label: 'k', key: 'k', shiftLabel: 'K', shiftKey: 'K' },
            { label: 'l', key: 'l', shiftLabel: 'L', shiftKey: 'L' },
        ],
        [
            { label: '⇧', key: 'Shift', isSpecial: true, isShift: true },
            { label: 'z', key: 'z', shiftLabel: 'Z', shiftKey: 'Z' },
            { label: 'x', key: 'x', shiftLabel: 'X', shiftKey: 'X' },
            { label: 'c', key: 'c', shiftLabel: 'C', shiftKey: 'C' },
            { label: 'v', key: 'v', shiftLabel: 'V', shiftKey: 'V' },
            { label: 'b', key: 'b', shiftLabel: 'B', shiftKey: 'B' },
            { label: 'n', key: 'n', shiftLabel: 'N', shiftKey: 'N' },
            { label: 'm', key: 'm', shiftLabel: 'M', shiftKey: 'M' },
            //   { label: '⏎', key: 'Enter', isSpecial: true }
        ],
        [
            { label: '한/영', key: 'Lang', isSpecial: true },
            { label: ' ', key: 'Space', isWide: true },
            { label: '인쇄하기', key: 'Print', isSpecial: true },
        ]
    ];

    // 현재 키보드 레이아웃 선택
    const currentKeyboard = isKorean ? koreanKeyboard : englishKeyboard;

// renderKey 함수 수정 - 메인으로 버튼 특별 처리 추가
const renderKey = (keyObj: any, index: number) => {
    // Determine what to display based on shift state
    let displayLabel = keyObj.label;
    let keyToUse = keyObj.key;

    if (isShiftActive && keyObj.shiftLabel) {
        displayLabel = keyObj.shiftLabel;
        keyToUse = keyObj.shiftKey;
    }

    // 키 버튼 스타일 선택
    let keyStyle: CSSProperties = { ...commonKeyStyle };

    if (keyObj.isWide) {
        keyStyle = { ...spaceKeyStyle };
    } else if (keyObj.key === 'Print') {
        keyStyle = { ...printKeyStyle }; // 인쇄하기 버튼에 특별 스타일 적용
        // 텍스트가 비어있을 경우 버튼 비활성화 스타일 추가
        if (text.trim() === '' && composing === '') {
            keyStyle.opacity = 0.5;
            keyStyle.cursor = 'not-allowed';
        }
    } else if (keyObj.key === 'Main') {
        keyStyle = { ...mainKeyStyle }; // 메인으로 버튼에 특별 스타일 적용
    } else if (keyObj.isSpecial) {
        keyStyle = { ...specialKeyStyle };
    }

    // 특수 키 배경 및 텍스트 색 설정
    if (keyObj.isSpecial && keyObj.key !== 'Print' && keyObj.key !== 'Main') { // Print와 Main 키가 아닌 경우에만 기본 특수 키 스타일 적용
        if (keyObj.key === 'Backspace') {
            keyStyle.background = '#fee2e2';
            keyStyle.color = '#dc2626';
        } else if (keyObj.key === 'Enter') {
            keyStyle.background = '#dbeafe';
            keyStyle.color = '#2563eb';
        } else if (keyObj.key === 'Lang') {
            keyStyle.background = '#f3e8ff';
            keyStyle.color = '#7e22ce';
        } else {
            keyStyle.background = '#e5e7eb';
        }
    }

    // shift 키 활성화 상태 표시
    if (keyObj.isShift && isShiftActive) {
        keyStyle.background = '#3b82f6';
        keyStyle.color = 'white';
    }

    return (
        <button
            key={index}
            style={keyStyle}
            onClick={() => {
                if (keyObj.key === 'Space') handleSpace();
                else if (keyObj.key === 'Backspace') handleBackspace();
                else if (keyObj.key === 'Lang') toggleLanguage();
                else if (keyObj.key === 'Shift') toggleShift();
                else if (keyObj.key === 'Enter') handleEnter();
                else if (keyObj.key === 'Print' && onPrint) {
                    // 텍스트가 비어있지 않은 경우에만 인쇄 기능 실행
                    if (text.trim() !== '' || composing !== '') {
                        onPrint();
                    }
                }
                else if (keyObj.key === 'Main' && onGoToMain) onGoToMain();
                else handleKeyClick(keyToUse);
            }}
        >
            {displayLabel}
        </button>
    );
};


    const containerStyle: CSSProperties = {
        width: '100%',
        height: '80%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-end'
    };

    return (
        <div style={containerStyle}>
            {/* 표시 영역 */}
            <div style={displayAreaStyle}>
                <div style={displayTextStyle}>
                    {text}
                    <span style={composingTextStyle}>{composing}</span>
                    <span style={cursorStyle}>|</span>
                </div>
            </div>

            {/* 키보드 */}
            <div style={keyboardContainerStyle}>
                {currentKeyboard.map((row, rowIdx) => (
                    <div key={rowIdx} style={rowStyle}>
                        {row.map((keyObj, idx) => renderKey(keyObj, idx))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VirtualKeyboard;