const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron'); // globalShortcut 추가, ipcMain 추가
const path = require('path');
const isDev = require('electron-is-dev'); // 개발/배포 구분

let win; // win을 전역에서 접근 가능하게 선언

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

app.whenReady().then(() => {
  createWindow();

  // ✅ F12 키로 개발자 도구 열기
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
