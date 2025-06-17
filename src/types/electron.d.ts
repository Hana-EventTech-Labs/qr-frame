// src/types/electron.d.ts

interface ElectronAPI {
    showMessageBox: (options: {
      type: 'error' | 'warning' | 'info' | 'question';
      title: string;
      message: string;
      buttons: string[];
    }) => Promise<any>;
    
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
  }
  
  declare global {
    interface Window {
      electron?: ElectronAPI;
      env?: WindowEnv;
      printerApi?: any;
    }
  }