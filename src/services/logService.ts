// services/logService.ts
import { globalStateService } from './globalState';

class LogService {
  private readonly API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

  // 인쇄 완료 로그 기록
  async createPrintLog(): Promise<{success: boolean, message?: string, error?: string}> {
    try {
      console.log('📝 인쇄 로그 기록 시작...');
      
      const printLogData = globalStateService.getPrintLogData();
      console.log('📊 인쇄 로그 데이터:', printLogData);
      
      const response = await fetch(`${this.API_BASE_URL}/api/print/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_number: printLogData.event_number,
          kiosk_id: printLogData.kiosk_id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 인쇄 로그 기록 성공:', {
          event_number: printLogData.event_number,
          kiosk_id: printLogData.kiosk_id,
          event_name: printLogData.event_name,
          timestamp: printLogData.timestamp
        });
      } else {
        console.error('❌ 인쇄 로그 기록 실패:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('❌ 인쇄 로그 기록 중 예외 발생:', error);
      return { 
        success: false, 
        error: '인쇄 로그 기록 중 네트워크 오류가 발생했습니다.' 
      };
    }
  }

  // 인쇄 통계 조회
  async getPrintStats(): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      const kioskInfo = globalStateService.getKioskInfo();
      
      if (!kioskInfo.eventNumber || !kioskInfo.kioskId) {
        return { 
          success: false, 
          error: '키오스크 정보가 없습니다. 프로그램을 재시작해주세요.' 
        };
      }

      const url = `${this.API_BASE_URL}/api/print/stats/${kioskInfo.eventNumber}?kiosk_id=${kioskInfo.kioskId}`;
      console.log('📈 인쇄 통계 조회:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('📊 인쇄 통계:', result.data);
      }
      
      return result;
    } catch (error) {
      console.error('❌ 인쇄 통계 조회 오류:', error);
      return { 
        success: false, 
        error: '인쇄 통계 조회 중 네트워크 오류가 발생했습니다.' 
      };
    }
  }

  // 전체 행사 인쇄 통계 조회 (관리자용)
  async getAllPrintStats(): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      const kioskInfo = globalStateService.getKioskInfo();
      
      if (!kioskInfo.eventNumber) {
        return { 
          success: false, 
          error: '행사 정보가 없습니다.' 
        };
      }

      const url = `${this.API_BASE_URL}/api/print/stats/${kioskInfo.eventNumber}`;
      console.log('📈 전체 인쇄 통계 조회:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('📊 전체 인쇄 통계:', result.data);
      }
      
      return result;
    } catch (error) {
      console.error('❌ 전체 인쇄 통계 조회 오류:', error);
      return { 
        success: false, 
        error: '전체 인쇄 통계 조회 중 네트워크 오류가 발생했습니다.' 
      };
    }
  }
}

export const logService = new LogService();