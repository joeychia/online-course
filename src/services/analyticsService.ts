import Analytics from 'analytics';
import googleAnalytics from '@analytics/google-analytics';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

if (!GA_MEASUREMENT_ID) {
  console.warn('Google Analytics Measurement ID is not set in environment variables');
}

// Initialize analytics with Google Analytics
const analytics = Analytics({
  app: 'online-course',
  plugins: [
    googleAnalytics({
      measurementIds: [GA_MEASUREMENT_ID],
      gtagConfig: {
        send_page_view: true
      }
    })
  ]
});

// Event types
export type CourseEvent = {
  courseId: string;
  courseName: string;
};

export type LessonEvent = CourseEvent & {
  unitId: string;
  unitName: string;
  lessonId: string;
  lessonName: string;
};

export type QuizEvent = LessonEvent & {
  score: number;
  timeSpent: number;
};

// Analytics service
class AnalyticsService {
  // Page views
  trackPageView(path: string) {
    analytics.page({
      url: path,
      title: document.title
    });
  }

  // Course events
  trackCourseView({ courseId, courseName }: CourseEvent) {
    analytics.track('course_view', {
      courseId,
      courseName
    });
  }

  trackCourseRegistration({ courseId, courseName }: CourseEvent) {
    analytics.track('course_registration', {
      courseId,
      courseName
    });
  }

  trackCourseDropped({ courseId, courseName }: CourseEvent) {
    analytics.track('course_dropped', {
      courseId,
      courseName
    });
  }

  // Lesson events
  trackLessonView({ courseId, courseName, unitId, unitName, lessonId, lessonName }: LessonEvent) {
    analytics.track('lesson_view', {
      courseId,
      courseName,
      unitId,
      unitName,
      lessonId,
      lessonName
    });
  }

  trackLessonComplete({ courseId, courseName, unitId, unitName, lessonId, lessonName }: LessonEvent) {
    analytics.track('lesson_complete', {
      courseId,
      courseName,
      unitId,
      unitName,
      lessonId,
      lessonName
    });
  }

  // Quiz events
  trackQuizComplete({ 
    courseId, 
    courseName, 
    unitId, 
    unitName, 
    lessonId, 
    lessonName, 
    score,
    timeSpent 
  }: QuizEvent) {
    analytics.track('quiz_complete', {
      courseId,
      courseName,
      unitId,
      unitName,
      lessonId,
      lessonName,
      score,
      timeSpent
    });
  }

  // User events
  identifyUser(userId: string, traits?: { [key: string]: any }) {
    analytics.identify(userId, traits);
  }
}

export const analyticsService = new AnalyticsService(); 