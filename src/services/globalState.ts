// src/services/globalState.ts

interface KioskState {
    eventNumber: number | null;
    kioskId: string | null;
    isValidated: boolean;
  }
  
  class GlobalStateService {
    private state: KioskState = {
      eventNumber: null,
      kioskId: null,
      isValidated: false,
    };
  
    /**
     * 키오스크 검증 정보 저장
     */
    setKioskInfo(eventNumber: number, kioskId: string) {
      this.state.eventNumber = eventNumber;
      this.state.kioskId = kioskId;
      this.state.isValidated = true;
      console.log('🗄️ 키오스크 정보 저장됨:', this.state);
    }
  
    /**
     * 저장된 키오스크 정보 가져오기
     */
    getKioskInfo(): KioskState {
      return { ...this.state };
    }
  
    /**
     * 인쇄 로그 저장용 데이터 반환
     */
    getPrintLogData() {
      if (!this.state.isValidated || !this.state.eventNumber || !this.state.kioskId) {
        throw new Error('키오스크 검증 정보가 없습니다.');
      }
      
      return {
        event_number: this.state.eventNumber,
        kiosk_id: this.state.kioskId,
      };
    }
  
    /**
     * 상태 초기화
     */
    reset() {
      this.state = {
        eventNumber: null,
        kioskId: null,
        isValidated: false,
      };
      console.log('🗄️ 키오스크 상태 초기화됨');
    }
  }
  
  export const globalState = new GlobalStateService();
  export type { KioskState };