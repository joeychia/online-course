import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useParams } from 'react-router-dom';
import Notebook from '../pages/Notebook';
import { getNotesForUserCourse, getAllCourses } from '../services/dataService';
import { firestoreService } from '../services/firestoreService';
import { ThemeProvider } from '../contexts/ThemeContext';
import { FontSizeProvider } from '../contexts/FontSizeContext';
import { LanguageProvider } from '../contexts/LanguageContext';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: () => mockNavigate
  };
});

// Mock dataService
vi.mock('../services/dataService', () => ({
  getAllCourses: vi.fn(),
  getNotesForUserCourse: vi.fn()
}));

// Mock firestoreService
vi.mock('../services/firestoreService', () => ({
  firestoreService: {
    getQuizById: vi.fn(),
    getQuizHistoryForUserCourse: vi.fn()
  }
}));

// Mock useTranslation hook
vi.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        selectCourse: '選擇課程',
        pleaseSignIn: '請登入',
        noNotesFound: '尚未有筆記',
        myNotes: '我的筆記',
        failedToLoadNotes: '載入筆記失敗'
      };
      return translations[key] || key;
    },
    language: 'zh-TW'
  })
}));

// Mock data
const mockUser = { uid: 'test-user', email: 'test@example.com' };

const mockCourses = [
  { 
    id: 'course1', 
    name: '課程1',
    description: 'Course 1 description',
    settings: { unlockLessonIndex: 0 },
    units: [],
    groupIds: {}
  },
  { 
    id: 'course2', 
    name: '課程2',
    description: 'Course 2 description',
    settings: { unlockLessonIndex: 0 },
    units: [],
    groupIds: {}
  },
];

const mockNotes = [
  {
    id: 'note1',
    courseId: 'course1',
    text: '# 筆記 1\n這是筆記1的內容',
    lessonName: '課時1',
    unitName: '單元1',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'note2',
    courseId: 'course1',
    text: '# 筆記 2\n這是筆記2的內容',
    lessonName: '課時2',
    unitName: '單元2',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

const mockQuizHistories = [
  {
    quizId: 'quiz1',
    userId: 'test-user',
    courseId: 'course1',
    lessonId: 'lesson1',
    correct: 8,
    total: 10,
    lessonName: '測驗課時1',
    unitName: '測驗單元1',
    completedAt: '2024-01-03T00:00:00.000Z',
    answers: { '0': '1', '1': '2' },
    score: 80
  }
];

const mockQuiz = {
  id: 'quiz1',
  questions: [
    {
      text: '問題1',
      type: 'single_choice' as const,
      options: [
        { text: '選項1', isCorrect: false },
        { text: '選項2', isCorrect: true }
      ]
    }
  ]
};

describe('Notebook Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current date to ensure consistent testing
    vi.setSystemTime(new Date('2024-01-15'));
    // Mock useAuth hook
    vi.mock('../contexts/useAuth', () => ({
      useAuth: () => ({
        currentUser: mockUser
      })
    }));
    vi.mocked(getAllCourses).mockResolvedValue(mockCourses);
    vi.mocked(getNotesForUserCourse).mockResolvedValue(mockNotes);
    vi.mocked(firestoreService.getQuizHistoryForUserCourse).mockResolvedValue(mockQuizHistories);
    vi.mocked(firestoreService.getQuizById).mockResolvedValue(mockQuiz);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderNotebook = (initialEntries: string[] = ['']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <ThemeProvider>
          <FontSizeProvider>
            <LanguageProvider>
              <Notebook />
            </LanguageProvider>
          </FontSizeProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  it('shows loading state initially', () => {
    vi.mocked(useParams).mockReturnValue({});
    renderNotebook();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays course selection when no courseId is provided', async () => {
    vi.mocked(useParams).mockReturnValue({});
    renderNotebook();
    await waitFor(() => {
      expect(screen.getByText('課程1')).toBeInTheDocument();
      expect(screen.getByText('課程2')).toBeInTheDocument();
    });
  });

  it('navigates to course notebook when a course is selected', async () => {
    vi.mocked(useParams).mockReturnValue({});
    renderNotebook();
    await waitFor(() => {
      expect(screen.getByText('課程1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('課程1'));
    expect(mockNavigate).toHaveBeenCalledWith('/notebook/course1');
  });

  it('shows error message when notes fail to load', async () => {
    vi.mocked(useParams).mockReturnValue({ courseId: 'course1' });
    vi.mocked(getNotesForUserCourse).mockRejectedValue(new Error('Failed to load'));
    renderNotebook(['/notebook/course1']);
    await waitFor(() => {
      expect(screen.getByText('載入筆記失敗')).toBeInTheDocument();
    });
  });

  it('shows no notes message when notes array is empty', async () => {
    vi.mocked(useParams).mockReturnValue({ courseId: 'course1' });
    vi.mocked(getNotesForUserCourse).mockResolvedValue([]);
    vi.mocked(firestoreService.getQuizHistoryForUserCourse).mockResolvedValue([]);
    renderNotebook(['/notebook/course1']);
    await waitFor(() => {
      expect(screen.getByText('尚未有筆記')).toBeInTheDocument();
    });
  });

  it('displays notes grouped by week', async () => {
    vi.mocked(useParams).mockReturnValue({ courseId: 'course1' });
    renderNotebook(['/notebook/course1']);
    await waitFor(() => {
      expect(screen.getByText('單元1 / 課時1')).toBeInTheDocument();
      expect(screen.getByText('單元2 / 課時2')).toBeInTheDocument();
      // Check for week grouping header with Chinese date format
      expect(screen.getByText((content) => content.includes('12月31日') && content.includes('1月6日'))).toBeInTheDocument();
    });
  });

  it('handles month navigation correctly', async () => {
    vi.mocked(useParams).mockReturnValue({ courseId: 'course1' });
    renderNotebook(['/notebook/course1']);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'previous month' })).toBeInTheDocument();
    });

    // Test previous month navigation
    const prevButton = screen.getByRole('button', { name: 'previous month' });
    fireEvent.click(prevButton);
    
    await waitFor(() => {
      expect(getNotesForUserCourse).toHaveBeenCalledWith(
        mockUser.uid,
        'course1',
        expect.any(Date), // December 1st
        expect.any(Date)  // December 31st
      );
    });

    // Test next month navigation
    const nextButton = screen.getByRole('button', { name: 'next month' });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(getNotesForUserCourse).toHaveBeenCalledWith(
        mockUser.uid,
        'course1',
        expect.any(Date), // January 1st
        expect.any(Date)  // January 31st
      );
    });
  });

  it('displays quiz history in notes list', async () => {
    vi.mocked(useParams).mockReturnValue({ courseId: 'course1' });
    renderNotebook(['/notebook/course1']);
    
    await waitFor(() => {
      expect(screen.getByText('測驗 / 結果')).toBeInTheDocument();
      expect(screen.getByText('分数: 8/10')).toBeInTheDocument();
    });
  });

  it('opens quiz view dialog when clicking on a quiz note', async () => {
    vi.mocked(useParams).mockReturnValue({ courseId: 'course1' });
    renderNotebook(['/notebook/course1']);
    
    await waitFor(() => {
      expect(screen.getByText('測驗 / 結果')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('測驗 / 結果'));
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(firestoreService.getQuizById).toHaveBeenCalledWith('quiz1');
    });
  });

  it('shows no notes message when notes array is empty', async () => {
    vi.mocked(useParams).mockReturnValue({ courseId: 'course1' });
    vi.mocked(getNotesForUserCourse).mockResolvedValue([]);
    vi.mocked(firestoreService.getQuizHistoryForUserCourse).mockResolvedValue([]);
    renderNotebook(['/notebook/course1']);
    await waitFor(() => {
      expect(screen.getByText('尚未有筆記')).toBeInTheDocument();
    });
  });

  it('opens note dialog when clicking on a note', async () => {
    vi.mocked(useParams).mockReturnValue({ courseId: 'course1' });
    renderNotebook(['/notebook/course1']);
    await waitFor(() => {
      expect(screen.getByText('單元1 / 課時1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('單元1 / 課時1'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('這是筆記1的內容')).toBeInTheDocument();
  });

  it('closes note dialog when clicking close button', async () => {
    vi.mocked(useParams).mockReturnValue({ courseId: 'course1' });
    renderNotebook(['/notebook/course1']);
    await waitFor(() => {
      expect(screen.getByText('單元1 / 課時1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('單元1 / 課時1'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('close'));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows no notes message when notes array is empty', async () => {
    vi.mocked(useParams).mockReturnValue({ courseId: 'course1' });
    vi.mocked(getNotesForUserCourse).mockResolvedValue([]);
    vi.mocked(firestoreService.getQuizHistoryForUserCourse).mockResolvedValue([]);
    renderNotebook(['/notebook/course1']);
    await waitFor(() => {
      expect(screen.getByText('尚未有筆記')).toBeInTheDocument();
    });
  });
});
