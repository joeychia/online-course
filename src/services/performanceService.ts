import { getPerformance, trace, PerformanceTrace } from '@firebase/performance';
import { app } from './firebaseConfig';

// Initialize Firebase Performance
const firebasePerformance = getPerformance(app);

// Performance trace names for Firestore operations
export const PERFORMANCE_TRACES = {
  FIRESTORE_READ: 'firestore_read',
  FIRESTORE_WRITE: 'firestore_write',
  FIRESTORE_DELETE: 'firestore_delete',
  FIRESTORE_QUERY: 'firestore_query',
  PAGE_LOAD: 'page_load',
  RESOURCE_TIMING: 'resource_timing',
  TIME_TO_INTERACTIVE: 'time_to_interactive'
};

// Performance service for Firestore operation traces
export class PerformanceService {
  private activeTraces: Map<string, PerformanceTrace> = new Map();

  /**
   * Track page load performance
   * @param pageName Name of the page being loaded
   * @returns Trace ID
   */
  tracePageLoad(pageName: string): string {
    const traceId = this.startTrace(PERFORMANCE_TRACES.PAGE_LOAD, {
      page: pageName
    });
    
    // Record navigation timing metrics
    if (window.performance) {
      const timing = window.performance.timing;
      const navigationStart = timing.navigationStart;
      
      this.recordMetric(traceId, 'dns_time', timing.domainLookupEnd - timing.domainLookupStart);
      this.recordMetric(traceId, 'connect_time', timing.connectEnd - timing.connectStart);
      this.recordMetric(traceId, 'server_time', timing.responseEnd - timing.requestStart);
      this.recordMetric(traceId, 'dom_load_time', timing.domContentLoadedEventEnd - navigationStart);
      this.recordMetric(traceId, 'full_page_load', timing.loadEventEnd - navigationStart);
    }
    
    return traceId;
  }

  /**
   * Track resource timing performance
   * @param resourceType Type of resource (script, stylesheet, image, etc)
   * @param resourceUrl URL of the resource
   * @returns Trace ID
   */
  traceResourceTiming(resourceType: string, resourceUrl: string): string {
    const traceId = this.startTrace(PERFORMANCE_TRACES.RESOURCE_TIMING, {
      type: resourceType,
      url: resourceUrl
    });
    
    // Record resource timing metrics if available
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource');
      const resource = resources.find(r => r.name === resourceUrl) as PerformanceResourceTiming;
      
      if (resource) {
        this.recordMetric(traceId, 'fetch_time', resource.duration);
        this.recordMetric(traceId, 'dns_time', resource.domainLookupEnd - resource.domainLookupStart);
        this.recordMetric(traceId, 'connect_time', resource.connectEnd - resource.connectStart);
        this.recordMetric(traceId, 'request_time', resource.responseEnd - resource.requestStart);
      }
    }
    
    return traceId;
  }

  /**
   * Track time to interactive
   * @param componentName Name of the component being measured
   * @returns Trace ID
   */
  traceTimeToInteractive(componentName: string): string {
    return this.startTrace(PERFORMANCE_TRACES.TIME_TO_INTERACTIVE, {
      component: componentName
    });
  }

  /**
   * Start a custom trace
   * @param traceName Name of the trace
   * @param attributes Optional attributes to add to the trace
   * @returns The trace ID
   */
  startTrace(traceName: string, attributes?: Record<string, string>): string {
    try {
      const traceId = `${traceName}_${Date.now()}`;
      const customTrace = trace(firebasePerformance, traceName);
      
      // Add custom attributes if provided
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          customTrace.putAttribute(key, value);
        });
      }
      
      customTrace.start();
      this.activeTraces.set(traceId, customTrace);
      return traceId;
    } catch (error) {
      console.warn('Failed to start performance trace:', error);
      return '';
    }
  }

  /**
   * Stop a custom trace
   * @param traceId ID of the trace to stop
   * @param attributes Optional additional attributes to add before stopping
   */
  stopTrace(traceId: string, attributes?: Record<string, string>): void {
    try {
      const customTrace = this.activeTraces.get(traceId);
      if (customTrace) {
        // Add additional attributes if provided
        if (attributes) {
          Object.entries(attributes).forEach(([key, value]) => {
            customTrace.putAttribute(key, value);
          });
        }
        
        customTrace.stop();
        this.activeTraces.delete(traceId);
      }
    } catch (error) {
      console.warn('Failed to stop performance trace:', error);
    }
  }

  /**
   * Record a metric for a trace
   * @param traceId ID of the trace
   * @param metricName Name of the metric
   * @param value Value of the metric
   */
  recordMetric(traceId: string, metricName: string, value: number): void {
    try {
      const customTrace = this.activeTraces.get(traceId);
      if (customTrace) {
        customTrace.putMetric(metricName, value);
      }
    } catch (error) {
      console.warn('Failed to record metric for trace:', error);
    }
  }

  /**
   * Create a trace for Firestore read operations
   * @param collection Collection being read
   * @param operation Type of read operation (get/list/query)
   * @returns Trace ID
   */
  traceFirestoreRead(collection: string, operation: string): string {
    return this.startTrace(PERFORMANCE_TRACES.FIRESTORE_READ, {
      collection,
      operation
    });
  }

  /**
   * Create a trace for Firestore write operations
   * @param collection Collection being written to
   * @param operation Type of write operation (add/set/update)
   * @returns Trace ID
   */
  traceFirestoreWrite(collection: string, operation: string): string {
    return this.startTrace(PERFORMANCE_TRACES.FIRESTORE_WRITE, {
      collection,
      operation
    });
  }

  /**
   * Create a trace for Firestore delete operations
   * @param collection Collection being deleted from
   * @returns Trace ID
   */
  traceFirestoreDelete(collection: string): string {
    return this.startTrace(PERFORMANCE_TRACES.FIRESTORE_DELETE, {
      collection
    });
  }

  /**
   * Create a trace for Firestore query operations
   * @param collection Collection being queried
   * @param queryComplexity Number of filters/orders in the query
   * @returns Trace ID
   */
  traceFirestoreQuery(collection: string, queryComplexity: number): string {
    const traceId = this.startTrace(PERFORMANCE_TRACES.FIRESTORE_QUERY, {
      collection
    });
    this.recordMetric(traceId, 'query_complexity', queryComplexity);
    return traceId;
  }
}

// Create and export a singleton instance
export const performanceService = new PerformanceService();

export default performanceService;