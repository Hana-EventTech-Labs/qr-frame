// services/globalState.ts
class GlobalStateService {
  private kioskInfo: {
    eventNumber?: number;
    eventName?: string;
    kioskId?: string;
    isValidated?: boolean;
    validUntil?: string;
  } = {};

  // 키오스크 검증 정보 설정
  setKioskInfo(eventNumber: number, eventName: string, kioskId: string, validUntil: string) {
    this.kioskInfo = {
      eventNumber,
      eventName,
      kioskId,
      isValidated: true,
      validUntil
    };
    localStorage.setItem('kioskInfo', JSON.stringify(this.kioskInfo));
    console.log('✅ 키오스크 정보 저장:', this.kioskInfo);
  }

  // 키오스크 정보 가져오기
  getKioskInfo() {
    if (Object.keys(this.kioskInfo).length === 0) {
      const stored = localStorage.getItem('kioskInfo');
      if (stored) {
        try {
          this.kioskInfo = JSON.parse(stored);
        } catch (error) {
          console.error('키오스크 정보 파싱 오류:', error);
          this.kioskInfo = {};
        }
      }
    }
    return this.kioskInfo;
  }

  // 키오스크 검증 상태 확인
  isKioskValidated(): boolean {
    const info = this.getKioskInfo();
    if (!info.isValidated) return false;
    
    // 유효기간도 함께 확인
    if (info.validUntil) {
      const now = new Date();
      const validUntil = new Date(info.validUntil);
      return now <= validUntil;
    }
    
    return false;
  }

  // 키오스크 검증 API 호출
  async validateKiosk(eventName: string, kioskId: string): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      
      console.log('🔍 키오스크 검증 요청:', { eventName, kioskId });
      
      const response = await fetch(`${API_BASE_URL}/api/event/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_name: eventName,
          kiosk_id: kioskId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 행사 정보 확인 성공:', result.data);
        
        // 유효기간도 함께 확인
        const validCheck = await this.checkValidPeriod(result.data.no, kioskId);
        if (validCheck.success) {
          console.log('✅ 유효기간 확인 성공:', validCheck.data);
          
          // 키오스크 정보 저장
          this.setKioskInfo(
            result.data.no,
            result.data.event_name,
            result.data.kiosk_id,
            validCheck.data.expired_at
          );
          
          return { 
            success: true, 
            data: { 
              ...result.data, 
              validInfo: validCheck.data 
            } 
          };
        } else {
          console.error('❌ 유효기간 확인 실패:', validCheck.error);
          return validCheck;
        }
      } else {
        console.error('❌ 행사 정보 확인 실패:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('❌ 키오스크 검증 오류:', error);
      return { 
        success: false, 
        error: '키오스크 검증 중 네트워크 오류가 발생했습니다.' 
      };
    }
  }

  // 유효기간 확인
  async checkValidPeriod(eventNumber: number, kioskId: string): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_BASE_URL}/api/valid/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_number: eventNumber,
          kiosk_id: kioskId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // 만료일 검증
        const now = new Date();
        const expiredAt = new Date(result.data.expired_at);
        
        if (now > expiredAt) {
          return { 
            success: false, 
            error: `사용 기간이 만료되었습니다. (만료일: ${expiredAt.toLocaleDateString()})` 
          };
        }

        if (result.data.state !== 1) {
          return { 
            success: false, 
            error: '키오스크가 비활성 상태입니다.' 
          };
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ 유효기간 확인 오류:', error);
      return { 
        success: false, 
        error: '유효기간 확인 중 네트워크 오류가 발생했습니다.' 
      };
    }
  }

  // 인쇄 로그 데이터 가져오기 (기존 메서드 수정)
  getPrintLogData() {
    const kioskInfo = this.getKioskInfo();
    
    if (!kioskInfo.isValidated || !kioskInfo.eventNumber || !kioskInfo.kioskId) {
      throw new Error('키오스크 검증 정보가 없습니다.');
    }

    return {
      event_number: kioskInfo.eventNumber,
      kiosk_id: kioskInfo.kioskId,
      event_name: kioskInfo.eventName,
      timestamp: new Date().toISOString()
    };
  }

  // 키오스크 정보 초기화 (로그아웃 시 사용)
  clearKioskInfo() {
    this.kioskInfo = {};
    localStorage.removeItem('kioskInfo');
    console.log('🗑️ 키오스크 정보 초기화');
  }
}

export const globalStateService = new GlobalStateService();