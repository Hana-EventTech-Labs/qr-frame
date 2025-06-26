const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fetch = require('cross-fetch');
const iconv = require('iconv-lite');

let win;
let splashWindow;

// 앱 이름 설정
app.setName('Be-My-Friends');

// 스플래시 윈도우 생성
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 450,
    height: 350,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    title: 'Be-My-Friends 시작 중',
    icon: path.join(__dirname, '../public/icon.ico'), // 아이콘 설정
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false
  });

  // 스플래시 HTML 내용 (Be-My-Friends 테마)
  const splashHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Be-My-Friends</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-family: 'Malgun Gothic', '맑은 고딕', 'Arial', sans-serif;
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .logo {
          font-size: 56px;
          margin-bottom: 15px;
          animation: float 3s ease-in-out infinite;
        }
        .title {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
          letter-spacing: 1px;
        }
        .subtitle {
          font-size: 18px;
          opacity: 0.9;
          margin-bottom: 10px;
          font-weight: 300;
        }
        .korean-title {
          font-size: 16px;
          opacity: 0.8;
          margin-bottom: 20px;
        }
        .version {
          font-size: 12px;
          opacity: 0.7;
          margin-bottom: 20px;
        }
        .loading {
          margin-top: 20px;
          width: 250px;
          height: 6px;
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
          overflow: hidden;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
        }
        .loading-bar {
          height: 100%;
          background: linear-gradient(90deg, #fff, #f0f0f0, #fff);
          background-size: 200% 100%;
          animation: loading 2s infinite;
          border-radius: 3px;
        }
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          33% { 
            transform: translateY(-8px) rotate(-2deg); 
          }
          66% { 
            transform: translateY(-4px) rotate(2deg); 
          }
        }
        @keyframes loading {
          0% { 
            background-position: -200% 0; 
          }
          100% { 
            background-position: 200% 0; 
          }
        }
        .emoji-friends {
          font-size: 24px;
          margin-top: 10px;
          opacity: 0.8;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      </style>
    </head>
    <body>
      <div class="logo">🤝</div>
      <div class="title">Be-My-Friends</div>
      <div class="subtitle">Photo Kiosk System</div>
      <div class="korean-title">포토카드 키오스크</div>
      <div class="version">v1.0.0</div>
      <div class="emoji-friends">👫 📸 💕</div>
      <div class="loading">
        <div class="loading-bar"></div>
      </div>
    </body>
    </html>
  `;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`);
  
  // 스플래시 윈도우가 준비되면 표시
  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: isDev ? 1280 : 1080,
    height: isDev ? 800 : 1920,
    title: 'Be-My-Friends', // 윈도우 타이틀 설정
    icon: path.join(__dirname, '../public/icon.ico'), // 아이콘 설정
    kiosk: !isDev,
    fullscreen: !isDev,
    frame: isDev,
    alwaysOnTop: !isDev,
    resizable: isDev,
    show: false, // 처음에는 숨김
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
      enableRemoteModule: false,
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

  // 웹 컨텐츠가 로드된 후 타이틀 재설정 (React 앱이 타이틀을 변경할 수 있으므로)
  win.webContents.on('page-title-updated', (event) => {
    event.preventDefault(); // React에서 타이틀 변경 방지
  });

  // 메인 윈도우가 완전히 로드되면 스플래시 제거하고 메인 윈도우 표시
  win.webContents.once('did-finish-load', () => {
    // 추가 지연 시간을 두어 React 앱이 완전히 준비되도록 함
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
      }
      win.show();
      
      // 포커스 설정
      if (!isDev) {
        win.focus();
        win.setAlwaysOnTop(true, 'screen-saver');
      }
    }, 1500); // 1.5초로 조금 늘림 (스플래시를 좀 더 보여주기 위해)
  });

  // 메인 윈도우가 닫히면 앱 종료
  win.on('closed', () => {
    win = null;
  });
}

// 🔥 KS_NET 결제 요청 메시지 빌드 함수
function buildReqMessage() {
  let reqMsg = "";
  reqMsg = "AP0452IC010200NAT0416478A    000000000000                                                                                                                                                       00000000005000000000000000000000000091000000000913000000000000                                                                                                                                                                                                       X";
  return reqMsg;
}

// 🔥 KS_NET 결제 요청 핸들러 추가
ipcMain.handle("send-payment-request", async (event, requestData) => {
  try {
    console.log('💳 KS_NET 결제 요청 시작...');

    const reqMessage = buildReqMessage();
    
    const params = new URLSearchParams();
    params.append('REQ', reqMessage);
    params.append('callback', 'jsonp1234567898123123');

    const encodedParams = params.toString();
    const url = 'http://127.0.0.1:27098';

    console.log('💳 결제 요청 URL:', url);
    console.log('💳 결제 요청 데이터:', encodedParams);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=euc-kr"
      },
      body: encodedParams
    });

    const buffer = await response.buffer();
    const text = iconv.decode(buffer, 'euc-kr');

    console.log('💳 결제 응답 (raw):', text);

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
      try {
        jsonData = JSON.parse(text);
      } catch (parseError) {
        console.error("❌ JSON 파싱 실패:", parseError);
        jsonData = {
          error: "응답 파싱 실패",
          rawResponse: text.substring(0, 500)
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
  // 스플래시 윈도우를 먼저 생성하고 표시
  createSplashWindow();
  
  // 메인 윈도우 생성 (숨김 상태)
  createWindow();

  // F12 키로 개발자 도구 열기
  globalShortcut.register('F12', () => {
    if (win) {
      win.webContents.toggleDevTools();
    }
  });

  // 종료 이벤트 처리
  ipcMain.on('app:quit', () => {
    console.log('Be-My-Friends 앱 종료 요청 수신됨');
    app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSplashWindow();
      createWindow();
    }
  });
});

// 앱 종료 시 단축키 해제
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});