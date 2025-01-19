// Analytics interface
export interface Analytics {
  page: (_path: string) => Promise<void>;
  track: (_event: string, _data: Record<string, unknown>) => Promise<void>;
  identify: (_userId: string, _traits: Record<string, unknown>) => Promise<void>;
}

// Event interfaces
export interface CourseEvent {
  courseId: string;
  courseName: string;
  unitId?: string;
  unitName?: string;
  [key: string]: string | undefined;
}

export interface LessonEvent extends Omit<CourseEvent, 'unitId' | 'unitName'> {
  lessonId: string;
  lessonName: string;
  unitId?: string;
  unitName?: string;
  [key: string]: string | undefined;
}

export interface QuizEvent {
  courseId: string;
  courseName: string;
  lessonId: string;
  lessonName: string;
  unitId?: string;
  unitName?: string;
  score: number;
  timeSpent?: number;
  [key: string]: string | number | undefined;
}

// Analytics service
export class AnalyticsService {
  private analytics: Analytics;

  constructor(analytics: Analytics) {
    this.analytics = analytics;
  }

  async trackPageView(path: string): Promise<void> {
    await this.analytics.page(path);
  }

  async trackCourseView(event: CourseEvent): Promise<void> {
    await this.analytics.track('Course Viewed', event);
  }

  async trackCourseRegistration(event: CourseEvent): Promise<void> {
    await this.analytics.track('Course Registered', event);
  }

  async trackCourseDropped(event: CourseEvent): Promise<void> {
    await this.analytics.track('Course Dropped', event);
  }

  async trackLessonView(event: LessonEvent): Promise<void> {
    await this.analytics.track('Lesson Viewed', event);
  }

  async trackLessonComplete(event: LessonEvent): Promise<void> {
    await this.analytics.track('Lesson Completed', event);
  }

  async trackQuizComplete(event: QuizEvent): Promise<void> {
    await this.analytics.track('Quiz Completed', event);
  }

  async identifyUser(userId: string, traits: Record<string, unknown>): Promise<void> {
    await this.analytics.identify(userId, traits);
  }
}

// Initialize analytics with mock implementation for now
// This should be replaced with actual Google Analytics implementation
const analytics = {
  page: async (_path: string): Promise<void> => {
    // Logging disabled in production
  },
  track: async (_event: string, _data: Record<string, unknown>): Promise<void> => {
    // Logging disabled in production
  },
  identify: async (_userId: string, _traits: Record<string, unknown>): Promise<void> => {
    // Logging disabled in production
  }
};

export const analyticsService = new AnalyticsService(analytics);

export default analytics;