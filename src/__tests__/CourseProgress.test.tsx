import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CourseProgress from '../components/CourseProgress';
import { LanguageProvider } from '../contexts/LanguageContext';


// Mock react-calendar-heatmap
vi.mock('react-calendar-heatmap', () => ({
  default: () => <div data-testid="calendar-heatmap" />
}));

// Mock react-tooltip
vi.mock('react-tooltip', () => ({
  default: () => null
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock useTranslation
vi.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, any>) => {
      const translations: Record<string, string> = {
        'courseProgress': '課程進度',
        'lessonsCompleted': '已完成 {count} 個課程',
        'completionCalendar': '完成日曆',
        'latestCompletedLesson': '最近完成的課程',
        'nextUp': '下一課',
        'noLessonsCompleted': '尚未完成任何課程。開始您的學習之旅！'
      };
      let text = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          text = text.replace(`{${key}}`, String(value));
        });
      }
      return text;
    },
    language: 'zh-TW'
  })
}));

const mockProgress = {
  'lesson1': {
    completed: true,
    completedAt: '2024-01-01T10:00:00Z',
    lessonName: 'Lesson 1'
  },
  'lesson2': {
    completed: true,
    completedAt: '2024-01-02T11:00:00Z',
    lessonName: 'Lesson 2'
  }
};

const mockUnits = [
  { id: 'unit1', name: 'Unit 1' },
  { id: 'unit2', name: 'Unit 2' }
];

const mockUnitLessons = {
  'unit1': [
    { id: 'lesson1', name: 'Lesson 1' },
    { id: 'lesson2', name: 'Lesson 2' },
    { id: 'lesson3', name: 'Lesson 3' }
  ],
  'unit2': [
    { id: 'lesson4', name: 'Lesson 4' }
  ]
};

describe('CourseProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set language to zh-TW in localStorage
    localStorage.setItem('language', 'zh-TW');
  });

  afterEach(() => {
    localStorage.clear();
  });

  const renderComponent = (props = {}) => {
    return render(
      <LanguageProvider>
        <MemoryRouter>
          <CourseProgress
            progress={mockProgress}
            courseId="course1"
            units={mockUnits}
            unitLessons={mockUnitLessons}
            {...props}
          />
        </MemoryRouter>
      </LanguageProvider>
    );
  };

  it('displays course progress header and completed lessons count', () => {
    renderComponent();
    expect(screen.getByText('課程進度')).toBeInTheDocument();
    expect(screen.getByText(/已完成 2 個課程/)).toBeInTheDocument();
  });

  it('displays completion calendar section', () => {
    renderComponent();
    expect(screen.getByText('完成日曆')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-heatmap')).toBeInTheDocument();
  });

  it('displays latest completed lesson section', () => {
    renderComponent();
    expect(screen.getByText('最近完成的課程')).toBeInTheDocument();
    expect(screen.getByText('Unit 1 / Lesson 2')).toBeInTheDocument();
  });

  it('displays next lesson section when available', () => {
    renderComponent();
    expect(screen.getByText('下一課')).toBeInTheDocument();
    expect(screen.getByText('Unit 1 / Lesson 3')).toBeInTheDocument();
  });

  it('shows empty state when no lessons completed', () => {
    renderComponent({ progress: {} });
    expect(screen.getByText('尚未完成任何課程。開始您的學習之旅！')).toBeInTheDocument();
  });

  it('finds next lesson in same unit', () => {
    renderComponent();
    expect(screen.getByText('下一課')).toBeInTheDocument();
    expect(screen.getByText('Unit 1 / Lesson 3')).toBeInTheDocument();
  });

  it('finds next lesson in next unit when at end of current unit', () => {
    const progressAtEndOfUnit = {
      'lesson3': {
        completed: true,
        completedAt: '2024-01-03T12:00:00Z',
        lessonName: 'Lesson 3'
      }
    };
    
    renderComponent({ progress: progressAtEndOfUnit });
    expect(screen.getByText('下一課')).toBeInTheDocument();
    expect(screen.getByText('Unit 2 / Lesson 4')).toBeInTheDocument();
  });

  it('navigates to lesson when clicking on latest completed lesson', () => {
    renderComponent();
    const lessonLink = screen.getByText('Unit 1 / Lesson 2');
    fireEvent.click(lessonLink);
    expect(mockNavigate).toHaveBeenCalledWith('/course1/unit1/lesson2');
  });

  it('navigates to next lesson when clicking on next lesson', () => {
    renderComponent();
    const nextLessonLink = screen.getByText('Unit 1 / Lesson 3');
    fireEvent.click(nextLessonLink);
    expect(mockNavigate).toHaveBeenCalledWith('/course1/unit1/lesson3');
  });
});