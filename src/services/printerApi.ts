// printerApi.ts - 렌더러 프로세스에서 프린터 API 사용

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
  
  // 전역 Window 타입 확장
  declare global {
    interface Window {
      printerApi: {
        getDeviceList: () => Promise<{ success: boolean, devices?: PrinterDevice[], error?: string }>;
        openDevice: (deviceId: string) => Promise<{ success: boolean, error?: string }>;
        drawImage: (options: DrawImageOptions) => Promise<{ success: boolean, error?: string }>;
        drawText: (options: DrawTextOptions) => Promise<{ success: boolean, error?: string }>;
        print: () => Promise<{ success: boolean, error?: string }>;
        closeDevice: () => Promise<{ success: boolean, error?: string }>;
        getPreviewImage: () => Promise<{ success: boolean, imageData?: string, error?: string }>;
      };
    }
  }
  
  // API 함수 모음
  export const printerApi = {
    // 프린터 목록 조회
    getDeviceList: async () => {
      return window.printerApi.getDeviceList();
    },
    
    // 프린터 연결
    openDevice: async (deviceId: string) => {
      return window.printerApi.openDevice(deviceId);
    },
    
    // 이미지 출력
    drawImage: async (options: DrawImageOptions) => {
      return window.printerApi.drawImage(options);
    },
    
    // 텍스트 출력
    drawText: async (options: DrawTextOptions) => {
      return window.printerApi.drawText(options);
    },
    
    // 인쇄 명령 실행
    print: async () => {
      return window.printerApi.print();
    },
    
    // 프린터 연결 해제
    closeDevice: async () => {
      return window.printerApi.closeDevice();
    },
    
    // 미리보기 이미지 가져오기
    getPreviewImage: async () => {
      return window.printerApi.getPreviewImage();
    }
  };