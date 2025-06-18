# Photo Frame Kiosk 📸

포토프레임 키오스크 시스템은 사용자가 QR 코드를 통해 모바일에서 사진을 업로드하고, 키오스크에서 프레임을 선택하여 즉석에서 인쇄할 수 있는 통합 솔루션입니다.

## 🚀 주요 기능

### 📱 모바일 웹 (QR 코드 접속)
- QR 코드 스캔을 통한 간편 접속
- 실시간 이미지 업로드
- WebSocket 기반 실시간 연결
- 자동 재연결 및 상태 복구
- HEIF/HEIC 포맷 지원

### 🖥️ 키오스크 애플리케이션
- Electron 기반 데스크톱 앱
- 키오스크 자동 검증 및 유효기간 관리
- 실시간 이미지 수신 및 프리뷰
- 다양한 프레임 선택 기능
- 자동 인쇄 및 로그 기록

### 🌐 서버 (FastAPI)
- WebSocket 기반 실시간 통신
- 이미지 처리 및 저장
- 키오스크 인증 및 유효성 검증
- 사용 로그 및 통계 관리

## 🛠️ 기술 스택

### Frontend (Kiosk)
- **React 18** + **TypeScript**
- **Vite** (빌드 도구)
- **Electron** (데스크톱 앱)
- **Tailwind CSS** (스타일링)

### Backend
- **FastAPI** (Python 웹 프레임워크)
- **WebSocket** (실시간 통신)
- **PIL/Pillow** (이미지 처리)
- **PyMySQL** (데이터베이스)

### Database
- **MySQL** (메인 데이터베이스)
- `sk_builder` - 사용자 인증 및 로그
- `hanalabs-event` - 이벤트 및 키오스크 관리

## 📁 프로젝트 구조

```
photo-frame-kiosk/
├── src/
│   ├── pages/
│   │   ├── MainScreen.tsx       # 메인 화면 (키오스크 검증)
│   │   ├── UploadScreen.tsx     # 업로드 대기 화면
│   │   ├── FrameSelectionScreen.tsx # 프레임 선택 화면
│   │   ├── PrintingScreen.tsx   # 인쇄 진행 화면
│   │   └── CompleteScreen.tsx   # 완료 화면
│   ├── services/
│   │   ├── kioskValidationService.ts  # 키오스크 검증
│   │   ├── printLogService.ts         # 인쇄 로그 관리
│   │   ├── printerApi.ts             # 프린터 제어
│   │   ├── websocketService.ts       # WebSocket 통신
│   │   └── globalState.ts            # 전역 상태 관리
│   ├── config/
│   │   └── kiosk.config.json    # 키오스크 설정
│   └── App.tsx
├── public/
│   ├── festival_logo.png
│   ├── logo.png
│   └── frames/                  # 프레임 이미지들
├── electron/
│   └── main.js                  # Electron 메인 프로세스
└── server/                      # FastAPI 서버 (별도 저장소)
```

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/photo-frame-kiosk.git
cd photo-frame-kiosk
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 다음과 같이 설정:

```env
VITE_API_BASE_URL=https://your-server-domain.com
VITE_WS_BASE_URL=wss://your-server-domain.com
```

### 4. 키오스크 설정

`src/config/kiosk.config.json` 파일을 수정:

```json
{
  "eventName": "2024 어버이날 행사",
  "kioskId": "KIOSK_001",
  "serverUrl": "https://your-server-domain.com"
}
```

### 5. 개발 서버 실행

```bash
# 웹 개발 서버
npm run dev

# Electron 개발 모드
npm run electron:dev
```

### 6. 빌드

```bash
# 웹 빌드
npm run build

# Electron 앱 빌드
npm run electron:build
```

## 📋 사전 요구사항

### 하드웨어
- **프린터**: IDP Smart 시리즈 (ID 카드 프린터)
- **터치스크린**: 키오스크용 터치 디스플레이
- **네트워크**: 안정적인 인터넷 연결

### 소프트웨어
- **Node.js** 18+ 
- **npm** 또는 **yarn**
- **IDP Smart Printer Driver** (프린터 제어용)

## 🔧 설정 가이드

### 키오스크 등록

1. **서버 관리자**에게 키오스크 등록 요청
2. 받은 `kioskId`와 `eventName`을 설정 파일에 입력
3. 서버에서 유효기간 설정 확인

### 프린터 설정

1. IDP Smart 프린터 드라이버 설치
2. 프린터 USB 연결 확인
3. 키오스크 앱에서 프린터 연결 테스트

### 프레임 추가

```bash
# public/frames/ 폴더에 프레임 이미지 추가
public/frames/
├── frame1.png
├── frame2.png
└── frame3.png
```

## 📊 사용 플로우

1. **키오스크 시작** → 자동 검증 및 유효기간 확인
2. **QR 코드 표시** → 사용자가 모바일로 스캔
3. **모바일에서 사진 업로드** → WebSocket으로 실시간 전송
4. **키오스크에서 프레임 선택** → 사용자가 터치로 선택
5. **자동 인쇄** → 프린터로 출력 후 로그 저장
6. **완료 화면** → 메인으로 돌아가기

## 🔌 API 엔드포인트

### 키오스크 검증
```
POST /api/event/find          # 이벤트 정보 조회
POST /api/valid/check         # 유효기간 확인
```

### 이미지 업로드
```
POST /api/images/upload/{event_id}/{client_id}  # 이미지 업로드
```

### 로그 관리
```
POST /api/print/log           # 인쇄 완료 로그 저장
GET  /api/print/stats/{event_number}  # 인쇄 통계 조회
```

### WebSocket
```
/ws/kiosk/{event_id}          # 키오스크 연결
/ws/mobile/{client_id}/{event_id}  # 모바일 연결
```

## 🐛 문제 해결

### 자주 발생하는 문제

**1. 프린터 연결 실패**
```bash
# 프린터 드라이버 확인
# USB 케이블 재연결
# 키오스크 앱 재시작
```

**2. WebSocket 연결 끊김**
```bash
# 네트워크 연결 확인
# 서버 상태 확인
# 방화벽 설정 확인
```

**3. 키오스크 검증 실패**
```bash
# kiosk.config.json 설정 확인
# 서버 URL 및 키오스크 ID 확인
# 유효기간 만료 여부 확인
```

### 로그 확인

**개발자 도구 콘솔**
```javascript
// 브라우저 개발자 도구에서 확인 가능한 로그들
console.log('[WebSocket] 연결 상태')
console.log('[Printer] 프린터 상태')
console.log('[Kiosk] 검증 결과')
```

## 📈 모니터링

### 사용 통계
- 일별/월별 인쇄 횟수
- 키오스크별 사용량
- 오류 발생 빈도

### 로그 분석
```sql
-- 인쇄 통계 조회
SELECT DATE(created_at) as date, COUNT(*) as count 
FROM `hanalabs-event`.logs 
WHERE event_number = ? 
GROUP BY DATE(created_at);

---

**Photo Frame Kiosk** - 만든 사람들과 함께하는 순간을 더욱 특별하게 ✨