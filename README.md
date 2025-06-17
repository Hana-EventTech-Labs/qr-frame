```md
# Parents Day 키오스크 앱

부모님날 행사에서 사용하는 사진 업로드 및 출력용 키오스크 앱입니다.  
QR 코드를 통해 이미지를 업로드하고, 키오스크에서 확인 및 인쇄가 가능합니다.

---

## 🔧 기능 요약

- QR 코드 생성 (각 세션별 개별 이벤트 ID로 발급됨)
- WebSocket 실시간 이미지 수신
- 이미지 확인 후 다음 화면으로 이동
- `handleNext` 또는 `handleReset` 시 서버의 세션 및 이미지 삭제
- 업로드된 이미지는 keyboard 페이지로 넘어갈 때 **자동 로컬 다운로드**
- 키오스크 여러 대가 동시에 사용 가능 (세션 분리됨)

---

## 🖥 개발 환경

- React + TypeScript
- React Router DOM
- Tailwind CSS
- WebSocket
- qrcode.react

---

## 🧠 시스템 흐름

1. 컴포넌트가 mount 되면 `/api/events/register`로 새로운 세션 요청
2. 응답으로 받은 `event_id`와 `qr_url` 저장
3. WebSocket을 통해 실시간 이미지 수신
4. 이미지 수신 시 QR 코드 대신 이미지 표시
5. 사용자가 '다음으로'를 누르면:
   - WebSocket 닫기
   - 서버에 이벤트 삭제 요청 (`DELETE /api/events/:event_id`)
   - 업로드된 이미지가 있을 경우 로컬에 자동 저장 (`photo.png`)
   - `/keyboard` 페이지로 이동

---

## 🧾 다운로드 관련 안내

브라우저는 기본적으로 다운로드 시 `저장 위치 묻기` 설정이 켜져 있을 수 있습니다.  
**자동 다운로드를 위해 다음 설정을 적용해주세요.**

### ✅ 크롬 설정

1. 주소창에 입력: `chrome://settings/downloads`
2. 아래 옵션 비활성화:
   - ✅ "다운 전에 각 파일의 저장 위치 확인" → **꺼야 함**
3. 이후 다운로드는 자동으로 다운로드 폴더(`~/Downloads`)에 저장됩니다.

---

## 🖨 향후 작업 예정

- 업로드된 이미지를 자동으로 인쇄
- Electron 또는 Node 환경으로 포팅 (파일 시스템 직접 제어)
- 키오스크 앱 패키징 및 자동 실행 모드

---

## 📁 코드 참고

### 이미지 다운로드 함수

```ts
const downloadImageToLocal = async (url: string, filename = 'photo.png') => {
  const response = await fetch(url)
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  a.click()

  URL.revokeObjectURL(objectUrl)
}
```

### handleNext 함수 흐름

```ts
const handleNext = async () => {
  if (uploadedImage) {
    await downloadImageToLocal(uploadedImage)
  }

  if (socketRef.current?.readyState === WebSocket.OPEN) {
    socketRef.current.close()
  }

  if (eventId) {
    await fetch(`/api/events/${eventId}`, { method: 'DELETE' })
  }

  navigate('/keyboard')
}
```

---

## 🛠 기타 참고

- 행사명은 `parents_day`로 고정되어 있지만, **서버는 매 요청마다 `event_id`를 고유하게 생성**하므로 여러 기기가 동시에 사용해도 충돌 없음.
- WebSocket 경로는 `/ws/kiosk/:event_id` 형태로 세션 별 분리되어 있음.

---