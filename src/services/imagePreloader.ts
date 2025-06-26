// src/services/improvedImagePreloader.ts

interface ImageCacheEntry {
    url: string;
    element: HTMLImageElement;
    loaded: boolean;
    error: boolean;
    priority: number;
    loadTime: number;
  }
  
  type LoadingPriority = 'critical' | 'high' | 'medium' | 'low';
  
  class ImprovedImagePreloaderService {
    private cache = new Map<string, ImageCacheEntry>();
    private loadingQueue = new Map<string, Promise<HTMLImageElement>>();
    private maxConcurrentLoads = 6; // 동시 로딩 제한
    private currentLoads = 0;
  
    // 우선순위별 이미지 분류
    private imagePriorities: Record<LoadingPriority, string[]> = {
      critical: [
        './splash.png',
        './festival_logo.png'
      ],
      high: [
        './qrscreen.png',
        './payment.png'
      ],
      medium: [
        './process.png',
        './complete.png'
      ],
      low: [
        './frames/frame1.jpg',
        './frames/frame2.jpg',
        './frames/frame3.jpg',
        './frames/frame4.jpg',
        './frames/frame5.jpg',
        './frames/frame6.jpg',
        './completed_frames/frame1_complete.jpg',
        './completed_frames/frame2_complete.jpg',
        './completed_frames/frame3_complete.jpg',
        './completed_frames/frame4_complete.jpg',
        './completed_frames/frame5_complete.jpg',
        './completed_frames/frame6_complete.jpg',
      ]
    };
  
    /**
     * 단일 이미지 프리로드 (동시 로딩 제한 적용)
     */
    async preloadImage(url: string, priority: number = 3): Promise<HTMLImageElement> {
      // 캐시에 이미 있고 로드 완료된 경우
      const cached = this.cache.get(url);
      if (cached && cached.loaded && !cached.error) {
        return cached.element;
      }
  
      // 이미 로딩 중인 경우
      if (this.loadingQueue.has(url)) {
        return this.loadingQueue.get(url)!;
      }
  
      // 동시 로딩 제한 체크
      if (this.currentLoads >= this.maxConcurrentLoads) {
        await this.waitForSlot();
      }
  
      const promise = this.createLoadPromise(url, priority);
      this.loadingQueue.set(url, promise);
      
      return promise;
    }
  
    /**
     * 이미지 로드 Promise 생성
     */
    private createLoadPromise(url: string, priority: number): Promise<HTMLImageElement> {
      return new Promise((resolve, reject) => {
        this.currentLoads++;
        const startTime = performance.now();
        
        const img = new Image();
        
        // 최적화 설정
        img.decoding = 'async';
        img.loading = 'eager';
        img.style.imageRendering = 'high-quality';
        
        const cacheEntry: ImageCacheEntry = {
          url,
          element: img,
          loaded: false,
          error: false,
          priority,
          loadTime: 0
        };
  
        img.onload = () => {
          const loadTime = performance.now() - startTime;
          cacheEntry.loaded = true;
          cacheEntry.loadTime = loadTime;
          
          this.cache.set(url, cacheEntry);
          this.loadingQueue.delete(url);
          this.currentLoads--;
          
          console.log(`✅ 이미지 로드 완료: ${url} (${loadTime.toFixed(2)}ms)`);
          resolve(img);
        };
  
        img.onerror = (error) => {
          cacheEntry.error = true;
          this.cache.set(url, cacheEntry);
          this.loadingQueue.delete(url);
          this.currentLoads--;
          
          console.error(`❌ 이미지 로드 실패: ${url}`, error);
          reject(new Error(`이미지 로드 실패: ${url}`));
        };
  
        // 크로스 오리진 설정
        img.crossOrigin = 'anonymous';
        
        // 캐시 등록
        this.cache.set(url, cacheEntry);
        
        // 로딩 시작
        img.src = url;
      });
    }
  
    /**
     * 로딩 슬롯 대기
     */
    private async waitForSlot(): Promise<void> {
      return new Promise((resolve) => {
        const checkSlot = () => {
          if (this.currentLoads < this.maxConcurrentLoads) {
            resolve();
          } else {
            setTimeout(checkSlot, 10);
          }
        };
        checkSlot();
      });
    }
  
    /**
     * 우선순위별 순차 로딩
     */
    async preloadByPriority(priorityLevel: LoadingPriority): Promise<HTMLImageElement[]> {
      const urls = this.imagePriorities[priorityLevel];
      const priority = this.getPriorityValue(priorityLevel);
      
      console.log(`🔄 ${priorityLevel} 우선순위 이미지 로딩 시작 (${urls.length}개)`);
      
      try {
        const promises = urls.map(url => this.preloadImage(url, priority));
        const results = await Promise.allSettled(promises);
        
        const successful = results
          .filter((result): result is PromiseFulfilledResult<HTMLImageElement> => 
            result.status === 'fulfilled'
          )
          .map(result => result.value);
        
        console.log(`✅ ${priorityLevel} 이미지 로딩 완료: ${successful.length}/${urls.length}`);
        return successful;
      } catch (error) {
        console.error(`❌ ${priorityLevel} 이미지 로딩 중 오류:`, error);
        throw error;
      }
    }
  
    /**
     * 우선순위 값 반환
     */
    private getPriorityValue(priority: LoadingPriority): number {
      const priorityMap = { critical: 1, high: 2, medium: 3, low: 4 };
      return priorityMap[priority];
    }
  
    /**
     * 모든 우선순위 순차 로딩
     */
    async preloadAllByPriority(): Promise<void> {
      console.log('🚀 순차적 이미지 프리로딩 시작');
      
      try {
        // Critical 먼저 (블로킹)
        await this.preloadByPriority('critical');
        
        // High 우선순위 (블로킹)
        await this.preloadByPriority('high');
        
        // Medium, Low는 백그라운드에서 병렬 실행
        Promise.all([
          this.preloadByPriority('medium'),
          this.preloadByPriority('low')
        ]).then(() => {
          console.log('🎉 모든 이미지 프리로딩 완료');
        }).catch(error => {
          console.warn('⚠️ 일부 이미지 프리로딩 실패:', error);
        });
        
      } catch (error) {
        console.error('❌ 이미지 프리로딩 중 오류:', error);
        throw error;
      }
    }
  
    /**
     * 즉시 사용 가능한 중요 이미지만 로드
     */
    async preloadCriticalOnly(): Promise<HTMLImageElement[]> {
      return this.preloadByPriority('critical');
    }
  
    /**
     * 캐시된 이미지 가져오기
     */
    getCachedImage(url: string): HTMLImageElement | null {
      const cached = this.cache.get(url);
      if (cached && cached.loaded && !cached.error) {
        return cached.element;
      }
      return null;
    }
  
    /**
     * 이미지 로드 상태 확인
     */
    isImageLoaded(url: string): boolean {
      const cached = this.cache.get(url);
      return cached ? cached.loaded && !cached.error : false;
    }
  
    /**
     * 로딩 진행률 계산
     */
    getLoadingProgress(): { loaded: number; total: number; percentage: number } {
      const allUrls = Object.values(this.imagePriorities).flat();
      const loaded = allUrls.filter(url => this.isImageLoaded(url)).length;
      
      return {
        loaded,
        total: allUrls.length,
        percentage: Math.round((loaded / allUrls.length) * 100)
      };
    }
  
    /**
     * 캐시 통계
     */
    getCacheStats(): {
      count: number;
      loadedCount: number;
      errorCount: number;
      averageLoadTime: number;
      totalSize: number;
    } {
      const entries = Array.from(this.cache.values());
      const loadedEntries = entries.filter(e => e.loaded && !e.error);
      
      const averageLoadTime = loadedEntries.length > 0
        ? loadedEntries.reduce((sum, e) => sum + e.loadTime, 0) / loadedEntries.length
        : 0;
      
      return {
        count: entries.length,
        loadedCount: loadedEntries.length,
        errorCount: entries.filter(e => e.error).length,
        averageLoadTime: Math.round(averageLoadTime * 100) / 100,
        totalSize: entries.length
      };
    }
  
    /**
     * 특정 우선순위 이미지 추가
     */
    addImageToPriority(url: string, priority: LoadingPriority): void {
      if (!this.imagePriorities[priority].includes(url)) {
        this.imagePriorities[priority].push(url);
        console.log(`➕ 이미지 추가: ${url} (${priority})`);
      }
    }
  
    /**
     * 캐시 클리어
     */
    clearCache(): void {
      this.cache.clear();
      this.loadingQueue.clear();
      this.currentLoads = 0;
      console.log('🗑️ 이미지 캐시 클리어됨');
    }
  
    /**
     * 메모리 정리 (오래된 캐시 제거)
     */
    cleanupCache(maxAge: number = 300000): void { // 5분
      const now = Date.now();
      const toDelete: string[] = [];
      
      this.cache.forEach((entry, url) => {
        if (now - entry.loadTime > maxAge) {
          toDelete.push(url);
        }
      });
      
      toDelete.forEach(url => this.cache.delete(url));
      
      if (toDelete.length > 0) {
        console.log(`🧹 오래된 캐시 ${toDelete.length}개 정리됨`);
      }
    }
  
    /**
     * Base64 이미지를 캐시에 직접 추가
     */
    addBase64ToCache(url: string, base64Data: string): void {
      const img = new Image();
      img.src = base64Data;
      
      const cacheEntry: ImageCacheEntry = {
        url,
        element: img,
        loaded: true,
        error: false,
        priority: 1,
        loadTime: 0
      };
      
      this.cache.set(url, cacheEntry);
      console.log(`💾 Base64 이미지 캐시 추가: ${url}`);
    }
  
    /**
     * 이미지 사이즈 최적화 (리사이징)
     */
    async optimizeImage(url: string, maxWidth: number = 1920, maxHeight: number = 1080): Promise<string> {
      const cachedImg = this.getCachedImage(url);
      if (!cachedImg) {
        throw new Error('이미지가 캐시에 없습니다.');
      }
  
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(url); // 최적화 실패시 원본 반환
          return;
        }
  
        // 비율 유지하면서 리사이징
        const ratio = Math.min(maxWidth / cachedImg.width, maxHeight / cachedImg.height);
        canvas.width = cachedImg.width * ratio;
        canvas.height = cachedImg.height * ratio;
  
        // 고품질 렌더링
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(cachedImg, 0, 0, canvas.width, canvas.height);
        
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(optimizedDataUrl);
      });
    }
  
    /**
     * 프리페치 힌트 추가 (브라우저 네이티브 프리로딩)
     */
    addPrefetchHints(): void {
      const allUrls = Object.values(this.imagePriorities).flat();
      
      allUrls.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = 'image';
        document.head.appendChild(link);
      });
      
      console.log(`🔗 ${allUrls.length}개 이미지에 prefetch 힌트 추가됨`);
    }
  }
  
  // 전역 인스턴스 생성
  export const improvedImagePreloader = new ImprovedImagePreloaderService();
  
  // React Hook
  import { useState, useEffect } from 'react';
  
  export const useOptimizedImage = (url: string | null) => {
    const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      if (!url) {
        setImageElement(null);
        setLoading(false);
        setError(null);
        return;
      }
  
      // 캐시에서 먼저 확인
      const cached = improvedImagePreloader.getCachedImage(url);
      if (cached) {
        setImageElement(cached);
        setLoading(false);
        setError(null);
        return;
      }
  
      // 로딩 시작
      setLoading(true);
      setError(null);
  
      improvedImagePreloader.preloadImage(url, 2)
        .then((img) => {
          setImageElement(img);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
          setImageElement(null);
        });
    }, [url]);
  
    return { imageElement, loading, error };
  };