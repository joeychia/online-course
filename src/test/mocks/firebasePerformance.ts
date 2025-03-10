import { PerformanceTrace } from '@firebase/performance';

// Mock trace class implementation
class MockPerformanceTrace implements PerformanceTrace {
  private attributes: Record<string, string> = {};
  private metrics: Record<string, number> = {};

  getAttribute(key: string): string | undefined {
    return this.attributes[key];
  }

  putAttribute(key: string, value: string): void {
    this.attributes[key] = value;
  }

  removeAttribute(key: string): void {
    delete this.attributes[key];
  }

  getAttributes(): Record<string, string> {
    return { ...this.attributes };
  }

  getMetric(metricName: string): number {
    return this.metrics[metricName] ?? 0;
  }

  putMetric(metricName: string, value: number): void {
    this.metrics[metricName] = value;
  }

  record(startTime: number, duration: number, options?: { metrics?: { [key: string]: number } | undefined; attributes?: { [key: string]: string } | undefined; } | undefined): void {
    if (options?.metrics) {
      Object.entries(options.metrics).forEach(([key, value]) => {
        this.putMetric(key, value);
      });
    }
    if (options?.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        this.putAttribute(key, value);
      });
    }
    this.putMetric('startTime', startTime);
    this.putMetric('duration', duration);
  }

  incrementMetric(metricName: string, incrementBy: number): void {
    const currentValue = this.getMetric(metricName);
    this.putMetric(metricName, currentValue + incrementBy);
  }

  start(): void {}
  stop(): void {}
}

// Mock performance monitoring functions
export const getPerformance = () => ({
  trace: () => new MockPerformanceTrace()
});

export const trace = () => new MockPerformanceTrace();

// Re-export types
export type { PerformanceTrace };