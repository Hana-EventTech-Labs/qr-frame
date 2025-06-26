// src/services/imagePreloader.ts

import React from "react";

interface ImageCacheEntry {
    url: string;
    element: HTMLImageElement;
    loaded: boolean;
    error: boolean;
  }
  
  class ImagePreloaderService {
    private cache = new Map<string, ImageCacheEntry>();
    private preloadPromises = new Map<string, Promise<HTMLImageElement>>();
  
    /**
     * 이미지 프리로드 (즉시 시작)
     */
    preloadImage(url: string): Promise<HTMLImageElement> {
      // 이미 프리로드 중이면 기존 Promise 반환
      if (this.preloadPromises.has(url)) {
        return this.preloadPromises.get(url)!;
      }
  
      // 캐시에 있고 로드 완료됐으면 바로 반환
      const cached = this.cache.get(url);
      if (cached && cached.loaded && !cached.error) {
        return Promise.resolve(cached.element);
      }
  
      const promise = new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        
        // 고품질 렌더링 설정
        img.style.imageRendering = 'high-quality';
        
        const cacheEntry: ImageCacheEntry = {
          url,
          element: img,
          loaded: false,
          error: false
        };
  
        img.onload = () => {
          cacheEntry.loaded = true;
          this.cache.set(url, cacheEntry);
          this.preloadPromises.delete(url);
          
          console.log(`✅ 이미지 프리로드 완료: ${url}`);
          resolve(img);
        };
  
        img.onerror = (error) => {
          cacheEntry.error = true;
          this.cache.set(url, cacheEntry);
          this.preloadPromises.delete(url);
          
          console.error(`❌ 이미지 프리로드 실패: ${url}`, error);
          reject(new Error(`이미지 로드 실패: ${url}`));
        };
  
        // 크로스 오리진 설정
        img.crossOrigin = 'anonymous';
        
        // 캐시 설정
        this.cache.set(url, cacheEntry);
        
        // 이미지 로드 시작
        img.src = url;
      });
  
      this.preloadPromises.set(url, promise);
      return promise;
    }
  
    /**
     * 여러 이미지 한번에 프리로드
     */
    async preloadImages(urls: string[]): Promise<HTMLImageElement[]> {
      console.log(`🔄 ${urls.length}개 이미지 프리로드 시작`);
      
      const promises = urls.map(url => this.preloadImage(url));
      
      try {
        const results = await Promise.allSettled(promises);
        const successful = results
          .filter((result): result is PromiseFulfilledResult<HTMLImageElement> => 
            result.status === 'fulfilled'
          )
          .map(result => result.value);
        
        console.log(`✅ ${successful.length}/${urls.length} 이미지 프리로드 완료`);
        return successful;
      } catch (error) {
        console.error('이미지 프리로드 중 오류:', error);
        throw error;
      }
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
     * 이미지가 로드되었는지 확인
     */
    isImageLoaded(url: string): boolean {
      const cached = this.cache.get(url);
      return cached ? cached.loaded && !cached.error : false;
    }
  
    /**
     * 캐시 클리어
     */
    clearCache(): void {
      this.cache.clear();
      this.preloadPromises.clear();
      console.log('🗑️ 이미지 캐시 클리어됨');
    }
  
    /**
     * 앱 시작시 필수 이미지들 프리로드
     */
    async preloadEssentialImages(): Promise<void> {
      const essentialImages = [
        './splash.png',
        './payment.png',
        './qrscreen.png',
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
      ];
  
      console.log('🚀 필수 이미지 프리로드 시작...');
      
      try {
        await this.preloadImages(essentialImages);
        console.log('🎉 필수 이미지 프리로드 완료!');
      } catch (error) {
        console.warn('⚠️ 일부 필수 이미지 프리로드 실패:', error);
        // 필수 이미지 로드 실패해도 앱은 계속 진행
      }
    }
  
    /**
     * 메모리 사용량 모니터링
     */
    getCacheStats(): { count: number; loadedCount: number; errorCount: number } {
      const entries = Array.from(this.cache.values());
      return {
        count: entries.length,
        loadedCount: entries.filter(e => e.loaded).length,
        errorCount: entries.filter(e => e.error).length
      };
    }
  }
  
  export const imagePreloader = new ImagePreloaderService();
  
  // React Hook으로 이미지 프리로딩 사용
  export const useImagePreloader = (url: string | null) => {
    const [imageElement, setImageElement] = React.useState<HTMLImageElement | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
  
    React.useEffect(() => {
      if (!url) {
        setImageElement(null);
        setLoading(false);
        setError(null);
        return;
      }
  
      // 캐시에서 먼저 확인
      const cached = imagePreloader.getCachedImage(url);
      if (cached) {
        setImageElement(cached);
        setLoading(false);
        setError(null);
        return;
      }
  
      // 프리로드 시작
      setLoading(true);
      setError(null);
  
      imagePreloader.preloadImage(url)
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