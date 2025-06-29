import { useEffect, useCallback } from 'react';
import { trackEvent, trackError, trackTiming } from '@/components/Analytics';

interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
}

export const usePerformanceMonitoring = () => {
  // Track component mount time
  const trackComponentMount = useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      trackTiming(`${componentName}_mount`, startTime);
      trackEvent('component_mount', 'performance', componentName, Math.round(duration));
    };
  }, []);

  // Track API call performance
  const trackApiCall = useCallback((endpoint: string, method: string = 'GET') => {
    const startTime = performance.now();
    
    return {
      success: (responseTime?: number) => {
        const endTime = responseTime || performance.now();
        const duration = endTime - startTime;
        trackEvent('api_call_success', 'api', `${method} ${endpoint}`, Math.round(duration));
      },
      error: (error: Error) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        trackEvent('api_call_error', 'api', `${method} ${endpoint}`, Math.round(duration));
        trackError(error, { endpoint, method });
      }
    };
  }, []);

  // Track user interactions
  const trackUserInteraction = useCallback((action: string, element: string, details?: any) => {
    trackEvent(action, 'user_interaction', element, details ? JSON.stringify(details) : undefined);
  }, []);

  // Track form submissions
  const trackFormSubmission = useCallback((formName: string, success: boolean, errors?: any) => {
    const eventAction = success ? 'form_submit_success' : 'form_submit_error';
    trackEvent(eventAction, 'form', formName);
    
    if (!success && errors) {
      trackError(new Error('Form submission failed'), { formName, errors });
    }
  }, []);

  // Track wallet operations
  const trackWalletOperation = useCallback((operation: string, success: boolean, error?: Error) => {
    const eventAction = success ? 'wallet_operation_success' : 'wallet_operation_error';
    trackEvent(eventAction, 'wallet', operation);
    
    if (!success && error) {
      trackError(error, { operation });
    }
  }, []);

  // Track contract operations
  const trackContractOperation = useCallback((operation: string, contractId?: string, success: boolean = true, error?: Error) => {
    const eventAction = success ? 'contract_operation_success' : 'contract_operation_error';
    trackEvent(eventAction, 'contract', `${operation}_${contractId || 'unknown'}`);
    
    if (!success && error) {
      trackError(error, { operation, contractId });
    }
  }, []);

  // Track page load performance
  const trackPageLoad = useCallback(() => {
    if (typeof window === 'undefined') return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      // DNS lookup time
      const dnsTime = navigation.domainLookupEnd - navigation.domainLookupStart;
      trackEvent('dns_lookup_time', 'performance', 'dns', Math.round(dnsTime));
      
      // TCP connection time
      const tcpTime = navigation.connectEnd - navigation.connectStart;
      trackEvent('tcp_connection_time', 'performance', 'tcp', Math.round(tcpTime));
      
      // Request time
      const requestTime = navigation.responseEnd - navigation.requestStart;
      trackEvent('request_time', 'performance', 'request', Math.round(requestTime));
      
      // DOM processing time
      const domTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      trackEvent('dom_processing_time', 'performance', 'dom', Math.round(domTime));
      
      // Total page load time
      const totalTime = navigation.loadEventEnd - navigation.navigationStart;
      trackEvent('total_page_load_time', 'performance', 'total', Math.round(totalTime));
    }
  }, []);

  // Track resource loading performance
  const trackResourcePerformance = useCallback(() => {
    if (typeof window === 'undefined') return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    resources.forEach((resource) => {
      const duration = resource.responseEnd - resource.startTime;
      const resourceType = resource.initiatorType || 'unknown';
      
      trackEvent('resource_load_time', 'performance', resourceType, Math.round(duration));
      
      // Track large resources
      if (duration > 1000) { // Resources taking more than 1 second
        trackEvent('slow_resource', 'performance', resource.name, Math.round(duration));
      }
    });
  }, []);

  // Track memory usage
  const trackMemoryUsage = useCallback(() => {
    if (typeof window === 'undefined' || !(performance as any).memory) return;

    const memory = (performance as any).memory;
    
    trackEvent('memory_used', 'performance', 'used_heap', Math.round(memory.usedJSHeapSize / 1024 / 1024));
    trackEvent('memory_total', 'performance', 'total_heap', Math.round(memory.totalJSHeapSize / 1024 / 1024));
    trackEvent('memory_limit', 'performance', 'heap_limit', Math.round(memory.jsHeapSizeLimit / 1024 / 1024));
  }, []);

  // Track network information
  const trackNetworkInfo = useCallback(() => {
    if (typeof window === 'undefined' || !(navigator as any).connection) return;

    const connection = (navigator as any).connection;
    
    trackEvent('network_type', 'performance', 'connection_type', connection.effectiveType);
    trackEvent('network_downlink', 'performance', 'downlink_speed', Math.round(connection.downlink));
    trackEvent('network_rtt', 'performance', 'round_trip_time', Math.round(connection.rtt));
  }, []);

  // Initialize performance monitoring
  useEffect(() => {
    // Track initial page load
    if (document.readyState === 'complete') {
      trackPageLoad();
      trackResourcePerformance();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => {
          trackPageLoad();
          trackResourcePerformance();
        }, 0);
      });
    }

    // Track memory usage periodically
    const memoryInterval = setInterval(trackMemoryUsage, 30000); // Every 30 seconds

    // Track network info
    trackNetworkInfo();

    // Cleanup
    return () => {
      clearInterval(memoryInterval);
    };
  }, [trackPageLoad, trackResourcePerformance, trackMemoryUsage, trackNetworkInfo]);

  return {
    trackComponentMount,
    trackApiCall,
    trackUserInteraction,
    trackFormSubmission,
    trackWalletOperation,
    trackContractOperation,
    trackPageLoad,
    trackResourcePerformance,
    trackMemoryUsage,
    trackNetworkInfo
  };
};

export default usePerformanceMonitoring;
