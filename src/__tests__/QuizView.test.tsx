import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from '@testing-library/react';
import QuizView from '../components/QuizView';
import { saveQuizHistory } from '../services/dataService';
import type { Quiz } from '../types';

// Mock dataService
vi.mock('../services/dataService', () => ({
  saveQuizHistory: vi.fn()
}));

// Mock useAuth hook
const mockUseAuth = vi.fn(() => ({
  currentUser: { uid: 'test-user-id' },
  userProfile: null,
  loading: false,
  signIn: vi.fn(),
  signInWithGoogle: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn()
}));

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock useTranslation hook
vi.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        correct: '✓ 正確',
        incorrect: '✗ 錯誤',
        enterYourAnswer: '請在此輸入你的答案...',
        quizResults: '測驗結果',
        perfectScore: '完美的分數！做得好！',
        reviewAnswers: '查看上方答案以了解可以改進的地方。',
        submit: '提交',
        close: '關閉'
      };
      return translations[key] || key;
    },
    language: 'zh-TW'
  })
}));

const mockQuiz: Quiz = {
  id: 'quiz1',
  questions: [
    {
      type: 'single_choice',
      text: '2 + 2 等於多少？',
      options: [
        { text: '3', isCorrect: false },
        { text: '4', isCorrect: true },
        { text: '5', isCorrect: false }
      ]
    },
    {
      type: 'single_choice',
      text: '法國的首都是什麼？',
      options: [
        { text: '倫敦', isCorrect: false },
        { text: '柏林', isCorrect: false },
        { text: '巴黎', isCorrect: true }
      ]
    },
    {
      type: 'free_form',
      text: '請解釋程式設計中變數的概念。'
    }
  ]
};

describe('QuizView', () => {
  it('renders quiz questions correctly', () => {
    render(
      <QuizView
        quiz={mockQuiz}
        onSubmit={() => {}}
        courseId="course1"
        lessonId="lesson1"
        onClose={() => {}}
      />
    );

    // Check if questions are rendered
    expect(screen.getByText('1. 2 + 2 等於多少？')).toBeInTheDocument();
    expect(screen.getByText('2. 法國的首都是什麼？')).toBeInTheDocument();
    expect(screen.getByText('3. 請解釋程式設計中變數的概念。')).toBeInTheDocument();

    // Check if options are rendered for multiple choice questions
    expect(screen.getByLabelText('3')).toBeInTheDocument();
    expect(screen.getByLabelText('4')).toBeInTheDocument();
    expect(screen.getByLabelText('5')).toBeInTheDocument();
    expect(screen.getByLabelText('倫敦')).toBeInTheDocument();
    expect(screen.getByLabelText('柏林')).toBeInTheDocument();
    expect(screen.getByLabelText('巴黎')).toBeInTheDocument();

    // Check if text area is rendered for free form question
    const textAreas = screen.getAllByRole('textbox');
    expect(textAreas).toHaveLength(1);
  });

  it('handles answer selection correctly', () => {
    render(
      <QuizView
        quiz={mockQuiz}
        onSubmit={() => {}}
        courseId="course1"
        lessonId="lesson1"
        onClose={() => {}}
      />
    );

    // Select answers
    fireEvent.click(screen.getByLabelText('4'));
    fireEvent.click(screen.getByLabelText('巴黎'));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '變數是用來儲存資料的容器。' }
    });

    // Submit button should be enabled
    const submitButton = screen.getByRole('button', { name: '提交' });
    expect(submitButton).not.toBeDisabled();
  });

  it('calculates and displays score correctly', async () => {
    const onSubmit = vi.fn();
    render(
      <QuizView
        quiz={mockQuiz}
        onSubmit={onSubmit}
        courseId="course1"
        lessonId="lesson1"
        onClose={() => {}}
      />
    );

    // Select correct answers
    fireEvent.click(screen.getByLabelText('4'));
    fireEvent.click(screen.getByLabelText('巴黎'));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '變數是用來儲存資料的容器。' }
    });

    // Submit quiz
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '提交' }));
    });

    // Check score display
    expect(screen.getByText('2/2')).toBeInTheDocument();
    expect(screen.getByText('完美的分數！做得好！')).toBeInTheDocument();

    // Verify onSubmit was called
    expect(onSubmit).toHaveBeenCalled();
  });

  it('disables inputs after submission', async () => {
    render(
      <QuizView
        quiz={mockQuiz}
        onSubmit={() => {}}
        courseId="course1"
        lessonId="lesson1"
        onClose={() => {}}
      />
    );

    // Select answers and submit
    fireEvent.click(screen.getByLabelText('4'));
    fireEvent.click(screen.getByLabelText('巴黎'));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '測試答案' }
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '提交' }));
    });

    // Check if inputs are disabled
    const radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach(radio => {
      expect(radio).toBeDisabled();
    });

    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.queryByRole('button', { name: '提交' })).not.toBeInTheDocument();
  });

  it('renders in readonly mode with previous answers', async () => {
    const previousAnswers = {
      0: '0',  // Index of selected option for first question (wrong answer)
      1: '2',  // Index of selected option for second question (correct answer)
      2: '測試答案'  // Answer for free form question
    };

    render(
      <QuizView
        quiz={mockQuiz}
        onSubmit={() => {}}
        courseId="course1"
        lessonId="lesson1"
        onClose={() => {}}
        readOnlyAnswers={previousAnswers}
      />
    );

    // Verify that previous answers are displayed
    expect(screen.getByLabelText('3')).toBeChecked(); //incorrect
    expect(screen.getByLabelText('巴黎')).toBeChecked(); //correct
    expect(screen.getByRole('textbox')).toHaveValue('測試答案');

    // Verify that all inputs are disabled
    const radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach(radio => {
      expect(radio).toBeDisabled();
    });
    expect(screen.getByRole('textbox')).toBeDisabled();

    // Verify that submit button is not shown
    expect(screen.queryByRole('button', { name: '提交' })).not.toBeInTheDocument();

    // Verify correct/incorrect indicators are shown
    expect(screen.getByText('✗ 錯誤')).toBeInTheDocument();
    expect(screen.getByText('✓ 正確')).toBeInTheDocument();
  });

  it('handles close button click', () => {
    const onClose = vi.fn();
    render(
      <QuizView
        quiz={mockQuiz}
        onSubmit={() => {}}
        courseId="course1"
        lessonId="lesson1"
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '關閉' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows correct/incorrect indicators after submission', async () => {
    render(
      <QuizView
        quiz={mockQuiz}
        onSubmit={() => {}}
        courseId="course1"
        lessonId="lesson1"
        onClose={() => {}}
      />
    );

    // Select a mix of correct and incorrect answers
    fireEvent.click(screen.getByLabelText('3')); // Wrong answer
    fireEvent.click(screen.getByLabelText('巴黎')); // Correct answer
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '測試答案' }
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '提交' }));
    });

    // Check for correct/incorrect indicators
    expect(screen.getByText('✗ 錯誤')).toBeInTheDocument();
    expect(screen.getByText('✓ 正確')).toBeInTheDocument();
  });
});