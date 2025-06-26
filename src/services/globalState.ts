// src/services/globalState.ts
class GlobalStateService {
  private kioskInfo: {
    eventNumber?: number;
    eventName?: string;
    kioskId?: string;
    isValidated?: boolean;
    validUntil?: string;
    validatedAt?: string;
  } = {};

  // 키오스크 검증 정보 설정
  setKioskInfo(eventNumber: number, eventName: string, kioskId: string, validUntil: string) {
    this.kioskInfo = {
      eventNumber,
      eventName,
      kioskId,
      isValidated: true,
      validUntil,
      validatedAt: new Date().toISOString()
    };
    
    // localStorage 안전 저장
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('kioskInfo', JSON.stringify(this.kioskInfo));
      }
    } catch (error) {
      console.warn('localStorage 저장 실패:', error);
    }
    
    console.log('✅ 키오스크 정보 저장:', this.kioskInfo);
  }

  // 키오스크 정보 가져오기
  getKioskInfo() {
    if (Object.keys(this.kioskInfo).length === 0) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const stored = localStorage.getItem('kioskInfo');
          if (stored) {
            this.kioskInfo = JSON.parse(stored);
          }
        }
      } catch (error) {
        console.error('키오스크 정보 파싱 오류:', error);
        this.kioskInfo = {};
      }
    }
    return this.kioskInfo;
  }

  // 키오스크 검증 상태 확인
  isKioskValidated(): boolean {
    const info = this.getKioskInfo();
    
    if (!info.isValidated || !info.validUntil) {
      return false;
    }
    
    // 유효기간 확인
    const now = new Date();
    const validUntil = new Date(info.validUntil);
    
    if (now > validUntil) {
      console.log('⚠️ 키오스크 유효기간 만료, 재검증 필요');
      this.clearKioskInfo();
      return false;
    }
    
    return true;
  }

  // 🔥 핵심: 키오스크 검증 API 호출
  async validateKiosk(eventName: string, kioskId: string): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      
      if (!API_BASE_URL) {
        throw new Error('VITE_API_BASE_URL 환경변수가 설정되지 않았습니다.');
      }
      
      console.log('🔍 키오스크 검증 요청:', { eventName, kioskId, API_BASE_URL });
      
      // 1단계: 이벤트 확인
      const eventResponse = await fetch(`${API_BASE_URL}/api/event/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_name: eventName,
          kiosk_id: kioskId
        })
      });

      if (!eventResponse.ok) {
        throw new Error(`HTTP ${eventResponse.status}: ${eventResponse.statusText}`);
      }

      const eventResult = await eventResponse.json();
      
      if (!eventResult.success) {
        console.error('❌ 행사 정보 확인 실패:', eventResult.error);
        return { success: false, error: eventResult.error };
      }

      console.log('✅ 행사 정보 확인 성공:', eventResult.data);
      
      // 2단계: 유효기간 확인
      const validResponse = await fetch(`${API_BASE_URL}/api/valid/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_number: eventResult.data.no,
          kiosk_id: kioskId
        })
      });

      if (!validResponse.ok) {
        throw new Error(`HTTP ${validResponse.status}: ${validResponse.statusText}`);
      }

      const validResult = await validResponse.json();
      
      if (!validResult.success) {
        console.error('❌ 유효기간 확인 실패:', validResult.error);
        return { success: false, error: validResult.error };
      }

      console.log('✅ 유효기간 확인 성공:', validResult.data);
      
      // 키오스크 정보 저장
      this.setKioskInfo(
        eventResult.data.no,
        eventResult.data.event_name,
        eventResult.data.kiosk_id,
        validResult.data.expired_at
      );
      
      return { 
        success: true, 
        data: { 
          ...eventResult.data, 
          validInfo: validResult.data 
        } 
      };
      
    } catch (error) {
      console.error('❌ 키오스크 검증 오류:', error);
      
      let errorMessage = '키오스크 검증 중 오류가 발생했습니다.';
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  }

  // 인쇄 로그 데이터 가져오기
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

  // 키오스크 정보 초기화
  clearKioskInfo() {
    this.kioskInfo = {};
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('kioskInfo');
      }
    } catch (error) {
      console.warn('localStorage 삭제 실패:', error);
    }
    console.log('🗑️ 키오스크 정보 초기화');
  }
}

export const globalStateService = new GlobalStateService();