/// <reference types="vite/client" />
interface FileApi {
    saveImageFromUrl: (url: string, filename: string) => Promise<{ success: boolean; filePath?: string; error?: string }>
  }
  
  interface Window {
    fileApi?: FileApi;
  }
  