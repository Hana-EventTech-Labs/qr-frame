// src/services/printLogService.ts

interface PrintLogData {
    event_number: number;
    kiosk_id: string;
  }
  
  class PrintLogService {
    private readonly API_BASE_URL = 'https://kiosk-proxy-server.onrender.com';
  
    /**
     * 인쇄 완료 로그를 서버에 전송
     */
    async savePrintLog(logData: PrintLogData): Promise<{ success: boolean; error?: string }> {
      try {
        console.log('📝 인쇄 완료 로그 저장 시작:', logData);
        
        const response = await fetch(`${this.API_BASE_URL}/api/print/log`, {
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
        console.log('📊 인쇄 로그 저장 응답:', result);
        
        if (!result.success) {
          return {
            success: false,
            error: result.message || '인쇄 로그 저장에 실패했습니다.',
          };
        }
  
        console.log('✅ 인쇄 로그 저장 성공');
        return {
          success: true,
        };
      } catch (error) {
        console.error('❌ 인쇄 로그 저장 실패:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : '네트워크 연결을 확인해주세요.',
        };
      }
    }
  
    /**
     * 인쇄 통계 조회 (선택사항)
     */
    async getPrintStats(eventNumber: number, kioskId?: string): Promise<{ success: boolean; data?: any; error?: string }> {
      try {
        const url = kioskId 
          ? `${this.API_BASE_URL}/api/print/stats/${eventNumber}?kiosk_id=${kioskId}`
          : `${this.API_BASE_URL}/api/print/stats/${eventNumber}`;
  
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
  
        const result = await response.json();
        
        if (!result.success) {
          return {
            success: false,
            error: result.message || '통계 조회에 실패했습니다.',
          };
        }
  
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error('❌ 인쇄 통계 조회 실패:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : '네트워크 연결을 확인해주세요.',
        };
      }
    }
  }
  
  export const printLogService = new PrintLogService();
  export type { PrintLogData };