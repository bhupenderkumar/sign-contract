import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Google Analytics configuration
const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID;

// Google Analytics gtag function
declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void;
  }
}

// Initialize Google Analytics
export const initGA = () => {
  if (!GA_TRACKING_ID || typeof window === 'undefined') return;

  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.gtag = window.gtag || function() {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_TRACKING_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
};

// Track page views
export const trackPageView = (path: string) => {
  if (!GA_TRACKING_ID || typeof window === 'undefined') return;

  window.gtag('config', GA_TRACKING_ID, {
    page_path: path,
    page_title: document.title,
    page_location: window.location.href,
  });
};

// Track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (!GA_TRACKING_ID || typeof window === 'undefined') return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Track contract events
export const trackContractEvent = (action: 'create' | 'sign' | 'view' | 'download', contractId?: string) => {
  trackEvent(action, 'contract', contractId);
};

// Track wallet events
export const trackWalletEvent = (action: 'connect' | 'disconnect' | 'switch') => {
  trackEvent(action, 'wallet');
};

// Track user engagement
export const trackEngagement = (action: string, details?: any) => {
  trackEvent(action, 'engagement', JSON.stringify(details));
};

// Component to handle route tracking
export const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize GA on first load
    initGA();
  }, []);

  useEffect(() => {
    // Track page views on route changes
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
};

// Performance monitoring
export const trackPerformance = () => {
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        const navigationEntry = entry as PerformanceNavigationTiming;
        
        // Track page load time
        trackEvent('page_load_time', 'performance', 'load_time', Math.round(navigationEntry.loadEventEnd - navigationEntry.loadEventStart));
        
        // Track DOM content loaded time
        trackEvent('dom_content_loaded', 'performance', 'dcl_time', Math.round(navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart));
      }
      
      if (entry.entryType === 'largest-contentful-paint') {
        // Track Largest Contentful Paint (LCP)
        trackEvent('largest_contentful_paint', 'performance', 'lcp', Math.round(entry.startTime));
      }
      
      if (entry.entryType === 'first-input') {
        // Track First Input Delay (FID)
        const fidEntry = entry as any;
        trackEvent('first_input_delay', 'performance', 'fid', Math.round(fidEntry.processingStart - fidEntry.startTime));
      }
    }
  });

  // Observe performance entries
  observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint', 'first-input'] });

  // Track Cumulative Layout Shift (CLS)
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    }
  });

  clsObserver.observe({ entryTypes: ['layout-shift'] });

  // Send CLS value when page is hidden
  const sendCLS = () => {
    trackEvent('cumulative_layout_shift', 'performance', 'cls', Math.round(clsValue * 1000));
  };

  window.addEventListener('beforeunload', sendCLS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendCLS();
    }
  });
};

// Error tracking
export const trackError = (error: Error, errorInfo?: any) => {
  if (!GA_TRACKING_ID || typeof window === 'undefined') return;

  window.gtag('event', 'exception', {
    description: error.message,
    fatal: false,
    error_stack: error.stack,
    error_info: JSON.stringify(errorInfo),
  });
};

// User timing tracking
export const trackTiming = (name: string, startTime: number) => {
  const duration = performance.now() - startTime;
  trackEvent('timing', 'user_timing', name, Math.round(duration));
};

export default Analytics;
