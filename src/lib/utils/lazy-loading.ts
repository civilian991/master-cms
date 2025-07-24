'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * Lazy loading utilities for mobile performance optimization
 */

export interface LazyLoadingOptions {
  threshold: number;
  rootMargin: string;
  triggerOnce: boolean;
}

const DEFAULT_LAZY_OPTIONS: LazyLoadingOptions = {
  threshold: 0.1,
  rootMargin: '50px',
  triggerOnce: true,
};

/**
 * Intersection Observer hook for lazy loading
 */
export const useIntersectionObserver = (
  options: Partial<LazyLoadingOptions> = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  const config = { ...DEFAULT_LAZY_OPTIONS, ...options };

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (isVisible && config.triggerOnce && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: config.threshold,
        rootMargin: config.rootMargin,
      }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [config.threshold, config.rootMargin, config.triggerOnce, hasIntersected]);

  return {
    targetRef,
    isIntersecting: config.triggerOnce ? hasIntersected || isIntersecting : isIntersecting,
    hasIntersected,
  };
};

/**
 * Lazy load images with progressive enhancement
 */
export interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
  });

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate optimized image URLs for different sizes
  const generateSrcSet = (baseSrc: string) => {
    const sizes = [320, 640, 768, 1024, 1280, 1920];
    return sizes
      .map(size => `${baseSrc}?w=${size}&q=${quality} ${size}w`)
      .join(', ');
  };

  if (hasError) {
    return React.createElement('div', {
      ref: targetRef,
      className: `bg-gray-200 flex items-center justify-center ${className}`,
      style: { width, height }
    }, React.createElement('span', {
      className: 'text-gray-500 text-sm'
    }, 'Image unavailable'));
  }

  return React.createElement('div', {
    ref: targetRef,
    className: `relative ${className}`
  }, [
    // Placeholder
    !isLoaded && React.createElement('div', {
      key: 'placeholder',
      className: 'absolute inset-0 bg-gray-200 animate-pulse',
      style: { width, height }
    }),
    
    // Actual image
    (priority || isIntersecting) && React.createElement('img', {
      key: 'image',
      src: src,
      alt: alt,
      width: width,
      height: height,
      sizes: sizes,
      srcSet: generateSrcSet(src),
      loading: priority ? 'eager' : 'lazy',
      decoding: 'async',
      className: `transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`,
      onLoad: handleLoad,
      onError: handleError
    })
  ].filter(Boolean));
};

/**
 * Network-aware loading strategies
 */
export const useNetworkStatus = () => {
  const [networkInfo, setNetworkInfo] = useState({
    effectiveType: '4g',
    downlink: 10,
    saveData: false,
  });

  useEffect(() => {
    const updateNetworkInfo = () => {
      const nav = navigator as any;
      if (nav.connection) {
        setNetworkInfo({
          effectiveType: nav.connection.effectiveType || '4g',
          downlink: nav.connection.downlink || 10,
          saveData: nav.connection.saveData || false,
        });
      }
    };

    updateNetworkInfo();
    
    const nav = navigator as any;
    if (nav.connection) {
      nav.connection.addEventListener('change', updateNetworkInfo);
      return () => nav.connection.removeEventListener('change', updateNetworkInfo);
    }
  }, []);

  return {
    ...networkInfo,
    isSlowConnection: networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g',
    isFastConnection: networkInfo.effectiveType === '4g',
    shouldReduceData: networkInfo.saveData || networkInfo.downlink < 2,
  };
};

/**
 * Adaptive loading based on device capabilities
 */
export const useAdaptiveLoading = () => {
  const networkStatus = useNetworkStatus();
  const [deviceInfo, setDeviceInfo] = useState({
    memory: 4,
    cores: 4,
    isLowEnd: false,
  });

  useEffect(() => {
    const nav = navigator as any;
    const memory = nav.deviceMemory || 4;
    const cores = nav.hardwareConcurrency || 4;
    
    setDeviceInfo({
      memory,
      cores,
      isLowEnd: memory <= 2 || cores <= 2,
    });
  }, []);

  const getLoadingStrategy = () => {
    if (networkStatus.isSlowConnection || deviceInfo.isLowEnd || networkStatus.shouldReduceData) {
      return 'conservative'; // Load only critical content
    } else if (networkStatus.isFastConnection && !deviceInfo.isLowEnd) {
      return 'aggressive'; // Preload additional content
    } else {
      return 'balanced'; // Standard loading
    }
  };

  return {
    strategy: getLoadingStrategy(),
    shouldPreload: getLoadingStrategy() === 'aggressive',
    shouldDefer: getLoadingStrategy() === 'conservative',
    networkStatus,
    deviceInfo,
  };
};

/**
 * Image quality optimization based on network and device
 */
export const getOptimalImageQuality = (
  networkStatus: ReturnType<typeof useNetworkStatus>,
  deviceInfo: { isLowEnd: boolean }
): number => {
  if (networkStatus.shouldReduceData || deviceInfo.isLowEnd) {
    return 60; // Lower quality for slow connections
  } else if (networkStatus.isFastConnection) {
    return 90; // High quality for fast connections
  } else {
    return 75; // Balanced quality
  }
};

/**
 * Preload critical resources
 */
export const preloadResource = (href: string, as: string, type?: string) => {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  
  document.head.appendChild(link);
};

/**
 * Performance utilities
 */
export const performanceUtils = {
  /**
   * Measure and log performance metrics
   */
  measurePerformance: (name: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
  },

  /**
   * Defer execution until idle
   */
  defer: (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback);
    } else {
      setTimeout(callback, 1);
    }
  },

  /**
   * Optimize heavy operations
   */
  throttle: <T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return function(this: any, ...args: Parameters<T>) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Debounce function for performance
   */
  debounce: <T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return function(this: any, ...args: Parameters<T>) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },
}; 