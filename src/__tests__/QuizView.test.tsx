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

const mockQuiz: Quiz = {
  id: 'quiz1',
  questions: [
    {
      type: 'single_choice',
      text: 'What is 2 + 2?',
      options: [
        { text: '3', isCorrect: false },
        { text: '4', isCorrect: true },
        { text: '5', isCorrect: false }
      ]
    },
    {
      type: 'single_choice',
      text: 'What is the capital of France?',
      options: [
        { text: 'London', isCorrect: false },
        { text: 'Berlin', isCorrect: false },
        { text: 'Paris', isCorrect: true }
      ]
    },
    {
      type: 'free_form',
      text: 'Explain the concept of variables in programming.'
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
    expect(screen.getByText('1. What is 2 + 2?')).toBeInTheDocument();
    expect(screen.getByText('2. What is the capital of France?')).toBeInTheDocument();
    expect(screen.getByText('3. Explain the concept of variables in programming.')).toBeInTheDocument();

    // Check if options are rendered for multiple choice questions
    expect(screen.getByLabelText('3')).toBeInTheDocument();
    expect(screen.getByLabelText('4')).toBeInTheDocument();
    expect(screen.getByLabelText('5')).toBeInTheDocument();
    expect(screen.getByLabelText('London')).toBeInTheDocument();
    expect(screen.getByLabelText('Berlin')).toBeInTheDocument();
    expect(screen.getByLabelText('Paris')).toBeInTheDocument();

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
    fireEvent.click(screen.getByLabelText('Paris'));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Variables are containers for storing data values.' }
    });

    // Submit button should be enabled
    const submitButton = screen.getByRole('button', { name: /submit/i });
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
    fireEvent.click(screen.getByLabelText('Paris'));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Variables are containers for storing data values.' }
    });

    // Submit quiz
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    });

    // Check score display
    expect(screen.getByText('2/2')).toBeInTheDocument();
    expect(screen.getByText('Perfect score! Well done!')).toBeInTheDocument();

    // Verify that answers were saved
    expect(saveQuizHistory).toHaveBeenCalledWith(
      'test-user-id',
      'course1',
      'lesson1',
      {
        0: '1',  // Index of selected option for first question
        1: '2',  // Index of selected option for second question
        2: 'Variables are containers for storing data values.'
      },
      2,  // Correct answers
      2   // Total questions (excluding free form)
    );

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
    fireEvent.click(screen.getByLabelText('Paris'));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Test answer' }
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    });

    // Check if inputs are disabled
    const radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach(radio => {
      expect(radio).toBeDisabled();
    });

    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument();
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
    fireEvent.click(screen.getByLabelText('Paris')); // Correct answer
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Test answer' }
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    });

    // Check for correct/incorrect indicators
    expect(screen.getByText('✗ Incorrect')).toBeInTheDocument();
    expect(screen.getByText('✓ Correct')).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
}); 