// 타입 정의
export interface PrinterDevice {
  name: string;
  id: string;
  device: string;
  description: string;
  pid: number;
}

export interface DrawImageOptions {
  page?: number;
  panel?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  imagePath: string;
}

export interface DrawTextOptions {
  page?: number;
  panel?: number;
  text: string;
  x: number;
  y: number;
  fontName: string;
  fontSize: number;
  fontStyle: number;
}

declare global {
  interface Window {
    printerApi: {
      getDeviceList: () => Promise<{ success: boolean, devices?: PrinterDevice[], error?: string }>;
      openDevice: (deviceId: string, orientation?: number) => Promise<{ success: boolean, error?: string }>;
      drawImage: (options: DrawImageOptions) => Promise<{ success: boolean, error?: string }>;
      drawText: (options: DrawTextOptions) => Promise<{ success: boolean, error?: string }>;
      print: () => Promise<{ success: boolean, error?: string }>;
      closeDevice: () => Promise<{ success: boolean, error?: string }>;
      getPreviewImage: () => Promise<{ success: boolean, imageData?: string, error?: string }>;
    };
  }
}

// ✅ 함수 모음
export const printerApi = {
  getDeviceList: async () => {
    return window.printerApi.getDeviceList();
  },

  // ✅ orientation 파라미터 추가됨!
  openDevice: async (deviceId: string, orientation = 1) => {
    return window.printerApi.openDevice(deviceId, orientation);
  },

  drawImage: async (options: DrawImageOptions) => {
    return window.printerApi.drawImage(options);
  },

  drawText: async (options: DrawTextOptions) => {
    return window.printerApi.drawText(options);
  },

  print: async () => {
    return window.printerApi.print();
  },

  closeDevice: async () => {
    return window.printerApi.closeDevice();
  },

  getPreviewImage: async () => {
    return window.printerApi.getPreviewImage();
  }
};
