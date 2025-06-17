// src/services/kioskValidationService.ts

interface EventInfo {
    no: number;
    event_name: string;
    kiosk_id: string;
    created_at: string;
  }
  
  interface ValidInfo {
    no: number;
    event_number: number;
    kiosk_id: string;
    expired_at: string;
    state: number;
  }
  
  interface ValidationResult {
    success: boolean;
    eventInfo?: EventInfo;
    validInfo?: ValidInfo;
    error?: string;
    isExpired?: boolean;
    isInactive?: boolean;
  }
  
  class KioskValidationService {
    private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://port-0-kiosk-builder-m47pn82w3295ead8.sel4.cloudtype.app';
    private readonly EVENT_NAME = import.meta.env.VITE_EVENT_NAME || '볼즈엔컴';
    private readonly KIOSK_ID = import.meta.env.VITE_KIOSK_ID || '001';
  
    /**
     * 1단계: event 테이블에서 no 값 가져오기
     */
    async getEventNo(): Promise<{ success: boolean; eventInfo?: EventInfo; error?: string }> {
      try {
        console.log(`🔍 Event 조회 시작 - 행사: ${this.EVENT_NAME}, 키오스크: ${this.KIOSK_ID}`);
        
        const response = await fetch(`${this.API_BASE_URL}/api/event/find`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_name: this.EVENT_NAME,
            kiosk_id: this.KIOSK_ID,
          }),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
  
        const result = await response.json();
        console.log('📊 Event 조회 응답:', result);
        
        if (!result.success) {
          return {
            success: false,
            error: result.error || '등록되지 않은 키오스크입니다.',
          };
        }
  
        console.log(`✅ Event 정보 조회 성공 - No: ${result.data.no}`);
        return {
          success: true,
          eventInfo: result.data,
        };
      } catch (error) {
        console.error('❌ Event No 조회 실패:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : '네트워크 연결을 확인해주세요.',
        };
      }
    }
  
    /**
     * 2단계: valid 테이블에서 유효기간 확인
     */
    async checkValidPeriod(eventNumber: number): Promise<{ success: boolean; validInfo?: ValidInfo; error?: string; isExpired?: boolean; isInactive?: boolean }> {
      try {
        console.log(`🔍 Valid 조회 시작 - Event Number: ${eventNumber}, 키오스크: ${this.KIOSK_ID}`);
        
        const response = await fetch(`${this.API_BASE_URL}/api/valid/check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_number: eventNumber,
            kiosk_id: this.KIOSK_ID,
          }),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
  
        const result = await response.json();
        console.log('📊 Valid 조회 응답:', result);
        
        if (!result.success) {
          return {
            success: false,
            error: result.error || '유효기간 정보를 찾을 수 없습니다.',
          };
        }
  
        const validInfo = result.data;
        
        // 상태 확인 (0: 비활성, 1: 활성)
        if (validInfo.state === 0) {
          console.log('❌ 비활성화된 키오스크');
          return {
            success: false,
            validInfo,
            isInactive: true,
            error: '비활성화된 키오스크입니다.',
          };
        }
  
        // 유효기간 검증
        const now = new Date();
        const expiredAt = new Date(validInfo.expired_at);
        console.log(`⏰ 현재 시간: ${now.toLocaleString('ko-KR')}`);
        console.log(`⏰ 만료 시간: ${expiredAt.toLocaleString('ko-KR')}`);
  
        if (now > expiredAt) {
          console.log('❌ 사용 기간 만료');
          return {
            success: false,
            validInfo,
            isExpired: true,
            error: `사용 기간이 만료되었습니다.\n만료일: ${expiredAt.toLocaleDateString('ko-KR')} ${expiredAt.toLocaleTimeString('ko-KR')}`,
          };
        }
  
        console.log(`✅ 유효기간 검증 성공 - 만료일: ${validInfo.expired_at}`);
        return {
          success: true,
          validInfo,
        };
      } catch (error) {
        console.error('❌ 유효기간 확인 실패:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : '네트워크 연결을 확인해주세요.',
        };
      }
    }
  
    /**
     * 전체 검증 프로세스
     */
    async validateKiosk(): Promise<ValidationResult> {
      console.log('🚀 키오스크 검증 시작');
      console.log(`📋 설정 - 행사: ${this.EVENT_NAME}, 키오스크: ${this.KIOSK_ID}, 서버: ${this.API_BASE_URL}`);
      
      // 1단계: Event No 가져오기
      const eventResult = await this.getEventNo();
      if (!eventResult.success || !eventResult.eventInfo) {
        console.log('❌ Event 조회 실패:', eventResult.error);
        return {
          success: false,
          error: eventResult.error,
        };
      }
  
      // 2단계: 유효기간 확인
      const validResult = await this.checkValidPeriod(eventResult.eventInfo.no);
      if (!validResult.success) {
        console.log('❌ Valid 검증 실패:', validResult.error);
        return {
          success: false,
          eventInfo: eventResult.eventInfo,
          validInfo: validResult.validInfo,
          isExpired: validResult.isExpired,
          isInactive: validResult.isInactive,
          error: validResult.error,
        };
      }
  
      console.log('🎉 키오스크 검증 완료!');
      return {
        success: true,
        eventInfo: eventResult.eventInfo,
        validInfo: validResult.validInfo,
      };
    }
  
    /**
     * 키오스크 정보 표시용
     */
    getKioskConfig() {
      return {
        eventName: this.EVENT_NAME,
        kioskId: this.KIOSK_ID,
        serverUrl: this.API_BASE_URL,
      };
    }
  
    /**
     * 유효기간 정보를 읽기 쉬운 형태로 변환
     */
    formatValidInfo(validInfo?: ValidInfo) {
      if (!validInfo) return null;
      
      const expiredAt = new Date(validInfo.expired_at);
      const now = new Date();
      const diffTime = expiredAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        expiredAt: expiredAt.toLocaleDateString('ko-KR'),
        expiredTime: expiredAt.toLocaleString('ko-KR'),
        daysLeft: diffDays,
        state: validInfo.state === 1 ? '활성' : '비활성',
      };
    }
  
    /**
     * API 연결 테스트
     */
    async testConnection(): Promise<boolean> {
      try {
        const response = await fetch(`${this.API_BASE_URL}/api/event/find`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_name: 'test',
            kiosk_id: 'test',
          }),
        });
        
        // 404는 정상 (테스트 데이터가 없는 것)
        return response.status === 200 || response.status === 404;
      } catch (error) {
        console.error('API 연결 테스트 실패:', error);
        return false;
      }
    }
  }
  
  export const kioskValidationService = new KioskValidationService();
  export type { ValidationResult, EventInfo, ValidInfo };