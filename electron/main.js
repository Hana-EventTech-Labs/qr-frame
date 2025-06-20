const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fetch = require('node-fetch'); // 추가
const iconv = require('iconv-lite'); // 추가

let win;

function createWindow() {
  win = new BrowserWindow({
    width: isDev ? 1280 : 1080,
    height: isDev ? 800 : 1920,
    kiosk: !isDev,
    fullscreen: !isDev,
    frame: isDev,
    alwaysOnTop: !isDev,
    resizable: isDev,
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: [isDev ? '--dev' : '--prod'],
    },
  });

  win.loadURL(
    isDev
      ? 'http://localhost:5173'
      : `file://${path.join(__dirname, '../dist/index.html')}`
  );

  if (isDev) {
    win.webContents.openDevTools();
  }
}

// 🔥 KS_NET 결제 요청 메시지 빌드 함수
function buildReqMessage() {
  // 실제 KS_NET 프로토콜에 맞게 구성해야 합니다
  // 이 예시는 기존 코드를 그대로 사용
  let reqMsg = "";
  reqMsg = "AP0452IC010200NDPT0TEST03    000000000000                                                                                                                                                       00000000001004000000000000000000000091000000000913000000000000                                                                                                                                                                                                       X";
  return reqMsg;
}

// 🔥 KS_NET 결제 요청 핸들러 추가
ipcMain.handle("send-payment-request", async (event, requestData) => {
  try {
    console.log('💳 KS_NET 결제 요청 시작...');
    
    const reqMessage = buildReqMessage();

    // URLSearchParams를 사용해 요청 데이터를 구성 (URL 인코딩)
    const params = new URLSearchParams();
    params.append('REQ', reqMessage);
    // 서버가 JSONP 방식을 기대하므로 callback 파라미터를 추가
    params.append('callback', 'jsonp1234567898123123');

    const encodedParams = params.toString();
    const url = 'http://127.0.0.1:27098'; // KS_NET 결제 단말기 URL

    console.log('💳 결제 요청 URL:', url);
    console.log('💳 결제 요청 데이터:', encodedParams);

    // fetch 요청 (POST 방식, euc-kr 인코딩)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=euc-kr"
      },
      body: encodedParams
    });

    // 응답 데이터는 euc-kr 인코딩으로 수신될 수 있으므로 Buffer로 받고 디코딩
    const buffer = await response.buffer();
    const text = iconv.decode(buffer, 'euc-kr');

    console.log('💳 결제 응답 (raw):', text);

    // JSONP 응답 처리: 응답이 "jsonp1234567898123123({...})" 형식이라면
    const callbackName = 'jsonp1234567898123123(';
    const suffix = ')';
    const startIdx = text.indexOf(callbackName);
    const endIdx = text.lastIndexOf(suffix);
    let jsonData;

    if (startIdx > -1 && endIdx > startIdx) {
      const jsonString = text.substring(startIdx + callbackName.length, endIdx);
      jsonData = JSON.parse(jsonString);
      console.log('💳 결제 응답 (parsed):', jsonData);
    } else {
      console.log("⚠️ 정상적인 JSONP 형식이 아님:", text);
      // JSONP가 아닌 경우 직접 JSON 파싱 시도
      try {
        jsonData = JSON.parse(text);
      } catch (parseError) {
        console.error("❌ JSON 파싱 실패:", parseError);
        jsonData = { 
          error: "응답 파싱 실패", 
          rawResponse: text.substring(0, 500) // 처음 500자만 로그에 기록
        };
      }
    }

    return jsonData;
  } catch (error) {
    console.error("❌ 결제 요청 실패:", error);
    return { 
      error: "결제 요청 실패", 
      details: error.message 
    };
  }
});

app.whenReady().then(() => {
  createWindow();

  // F12 키로 개발자 도구 열기
  globalShortcut.register('F12', () => {
    if (win) {
      win.webContents.toggleDevTools();
    }
  });

  // 종료 이벤트 처리
  ipcMain.on('app:quit', () => {
    console.log('앱 종료 요청 수신됨');
    app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 앱 종료 시 단축키 해제
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});