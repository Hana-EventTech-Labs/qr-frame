// src/types/electron.d.ts

interface ElectronAPI {
  showMessageBox: (options: {
    type: 'error' | 'warning' | 'info' | 'question';
    title: string;
    message: string;
    buttons: string[];
  }) => Promise<any>;

  sendPaymentRequest: (requestData: any) => Promise<any>;
  closeApp: () => void;

  mysql?: {
    query: (config: {
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
      query: string;
      params?: any[];
    }) => Promise<any>;
  };
}

interface WindowEnv {
  downloadPath: () => string;
  cwd: () => string;
  resourcesPath: () => string;
  isDev: () => boolean;
}

interface FileApi {
  saveImageFromUrl: (url: string, filename: string) => Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }>;
}

interface PrinterDevice {
  name: string;
  id: string;
  device: string;
  description: string;
  pid: number;
}

interface PrinterApi {
  getDeviceList: () => Promise<{ success: boolean, devices?: PrinterDevice[], error?: string }>;
  openDevice: (deviceId: string) => Promise<{ success: boolean, error?: string }>;
  drawImage: (options: any) => Promise<{ success: boolean, error?: string }>;
  drawText: (options: any) => Promise<{ success: boolean, error?: string }>;
  print: () => Promise<{ success: boolean, error?: string }>;
  closeDevice: () => Promise<{ success: boolean, error?: string }>;
  getPreviewImage: () => Promise<{ success: boolean, imageData?: string, error?: string }>;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
    electronAPI?: ElectronAPI; // 다시 옵셔널로 변경 (런타임 안전성)
    env?: WindowEnv;
    fileApi?: FileApi;
    printerApi?: PrinterApi;
  }
}