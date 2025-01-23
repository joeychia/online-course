import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useParams } from 'react-router-dom';
import Notebook from '../pages/Notebook';
import { useAuth } from '../contexts/useAuth';
import { getNotesForUserCourse, getAllCourses } from '../services/dataService';
import { useTranslation } from '../hooks/useTranslation';
import { ThemeProvider } from '../contexts/ThemeContext';

// Mock the required modules
vi.mock('../contexts/useAuth');
vi.mock('../services/dataService');
vi.mock('../hooks/useTranslation');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: vi.fn().mockReturnValue({ courseId: '' })
  };
});

// Mock data
const mockCourses = [
  { id: 'course1', name: '課程1' },
  { id: 'course2', name: '課程2' },
];

const mockNotes = [
  {
    text: '# 筆記 1\n這是筆記1的內容',
    lessonName: '課時1',
    unitName: '單元1',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    text: '# 筆記 2\n這是筆記2的內容',
    lessonName: '課時2',
    unitName: '單元2',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

// Setup mock functions
const mockNavigate = vi.fn();

const mockTranslation = {
  t: (key: string) => {
    const translations: Record<string, string> = {
      selectCourse: 'selectCourse',
      pleaseSignIn: 'pleaseSignIn',
      noNotesFound: 'noNotesFound',
      myNotes: 'myNotes',
      failedToLoadNotes: 'failedToLoadNotes'
    };
    return translations[key] || key;
  },
  language: 'zh-TW'
};

describe('Notebook Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: { uid: 'testUser' },
    });
    (useTranslation as jest.Mock).mockReturnValue(mockTranslation);
    (getAllCourses as jest.Mock).mockResolvedValue(mockCourses);
    (getNotesForUserCourse as jest.Mock).mockResolvedValue(mockNotes);
  });

  const renderNotebook = (initialEntries: string[] = ['']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <ThemeProvider>
          <Notebook />
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  it('shows loading state initially', () => {
    renderNotebook();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays course selection when no courseId is provided', async () => {
    renderNotebook();
    await waitFor(() => {
      expect(screen.getByText('課程1')).toBeInTheDocument();
      expect(screen.getByText('課程2')).toBeInTheDocument();
    });
  });

  it('navigates to course notebook when a course is selected', async () => {
    renderNotebook();
    await waitFor(() => {
      expect(screen.getByText('課程1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('課程1'));
    expect(mockNavigate).toHaveBeenCalledWith('/notebook/course1');
  });

  it('shows error message when notes fail to load', async () => {
    (getNotesForUserCourse as jest.Mock).mockRejectedValue(new Error('Failed to load'));
    vi.mocked(useParams).mockReturnValue({ courseId: 'course1' });
    renderNotebook(['/notebook/course1']);
    await waitFor(() => {
      expect(screen.getByText('failedToLoadNotes')).toBeInTheDocument();
    });
  });

  it('displays notes when courseId is provided', async () => {
    vi.mocked(useParams).mockReturnValue({ courseId: 'course1' });
    renderNotebook(['/notebook/course1']);
    await waitFor(() => {
      expect(screen.getByText('單元1 / 課時1')).toBeInTheDocument();
      expect(screen.getByText('單元2 / 課時2')).toBeInTheDocument();
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
    (getNotesForUserCourse as jest.Mock).mockResolvedValue([]);
    renderNotebook(['/notebook/course1']);
    await waitFor(() => {
      expect(screen.getByText('noNotesFound')).toBeInTheDocument();
    });
  });
});