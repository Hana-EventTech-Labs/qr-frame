// src/services/logService.ts

interface LogData {
    event_number: number;
    kiosk_id: string;
  }
  
  class LogService {
    private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://port-0-kiosk-builder-m47pn82w3295ead8.sel4.cloudtype.app';
  
    /**
     * 인쇄 로그를 logs 테이블에 저장
     */
    async savePrintLog(logData: LogData): Promise<{ success: boolean; error?: string }> {
      try {
        console.log('📝 인쇄 로그 저장 시작:', logData);
        
        const response = await fetch(`${this.API_BASE_URL}/api/logs/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_number: logData.event_number,
            kiosk_id: logData.kiosk_id,
          }),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
  
        const result = await response.json();
        console.log('📊 로그 저장 응답:', result);
        
        if (!result.success) {
          return {
            success: false,
            error: result.error || '로그 저장에 실패했습니다.',
          };
        }
  
        console.log('✅ 인쇄 로그 저장 성공');
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ 로그 저장 실패:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : '네트워크 연결을 확인해주세요.',
        };
      }
    }
  }
  
  export const logService = new LogService();
  export type { LogData };