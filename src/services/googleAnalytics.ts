import type { Analytics } from './analyticsService';

// Mock implementation for development
export const analytics: Analytics = {
  page: async (path: string): Promise<void> => {
    console.warn('Analytics page view:', path);
  },
  track: async (event: string, data: Record<string, unknown>): Promise<void> => {
    console.warn('Analytics event:', event, data);
  },
  identify: async (userId: string, traits: Record<string, unknown>): Promise<void> => {
    console.warn('Analytics identify:', userId, traits);
  }
}; 