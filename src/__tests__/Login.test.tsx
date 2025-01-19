import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { firestoreService } from '../services/firestoreService';

// Mock useAuth hook
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithGoogle = vi.fn();

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithGoogle: mockSignInWithGoogle
  })
}));

// Mock firestoreService
vi.mock('../services/firestoreService', () => ({
  firestoreService: {
    createUser: vi.fn(),
    getUserById: vi.fn()
  }
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

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
  };

  describe('Sign In Mode', () => {
    it('renders sign in form by default', () => {
      renderLogin();
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
    });

    it('validates required fields', async () => {
      renderLogin();
      const signInButton = screen.getByRole('button', { name: 'Sign In' });
      
      await act(async () => {
        fireEvent.submit(signInButton.closest('form'));
      });
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(screen.getByRole('alert')).toHaveTextContent('Please fill in all required fields.');
    });

    it('handles successful sign in', async () => {
      renderLogin();
      
      fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      
      const signInButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(signInButton);
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('handles sign in error', async () => {
      mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));
      renderLogin();
      
      fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      
      const signInButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(signInButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to sign in.')).toBeInTheDocument();
      });
    });
  });

  describe('Sign Up Mode', () => {
    const switchToSignUp = () => {
      fireEvent.click(screen.getByText("Don't have an account? Sign up"));
    };

    it('switches to sign up mode', () => {
      renderLogin();
      switchToSignUp();
      
      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('validates password match', async () => {
      renderLogin();
      switchToSignUp();
      
      fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'password456' }
      });
      
      const signUpButton = screen.getByRole('button', { name: 'Sign Up' });
      fireEvent.click(signUpButton);
      
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });

    it('validates password length', async () => {
      renderLogin();
      switchToSignUp();
      
      fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: '12345' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: '12345' }
      });
      
      const signUpButton = screen.getByRole('button', { name: 'Sign Up' });
      fireEvent.click(signUpButton);
      
      expect(screen.getByText('Password must be at least 6 characters long.')).toBeInTheDocument();
    });

    it('handles successful sign up', async () => {
      const mockUserCredential = { uid: 'user123', email: 'test@example.com' };
      mockSignUp.mockResolvedValueOnce(mockUserCredential);
      
      renderLogin();
      switchToSignUp();
      
      fireEvent.change(screen.getByRole('textbox', { name: /name/i }), {
        target: { value: 'Test User' }
      });
      fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'password123' }
      });
      
      const signUpButton = screen.getByRole('button', { name: 'Sign Up' });
      fireEvent.click(signUpButton);
      
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(firestoreService.createUser).toHaveBeenCalledWith({
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
          progress: {},
          registeredCourses: {},
          groupIds: {},
          notes: {}
        });
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Google Sign In', () => {
    it('handles successful Google sign in for new user', async () => {
      const mockUserCredential = {
        uid: 'google123',
        email: 'google@example.com',
        displayName: 'Google User'
      };
      mockSignInWithGoogle.mockResolvedValueOnce(mockUserCredential);
      vi.mocked(firestoreService.getUserById).mockResolvedValueOnce(null);
      
      renderLogin();
      
      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
        expect(firestoreService.createUser).toHaveBeenCalledWith({
          id: 'google123',
          email: 'google@example.com',
          name: 'Google User',
          progress: {},
          registeredCourses: {},
          groupIds: {},
          notes: {}
        });
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('handles successful Google sign in for existing user', async () => {
      const mockUserCredential = {
        uid: 'google123',
        email: 'google@example.com',
        displayName: 'Google User'
      };
      mockSignInWithGoogle.mockResolvedValueOnce(mockUserCredential);
      vi.mocked(firestoreService.getUserById).mockResolvedValueOnce({
        id: 'google123',
        email: 'google@example.com',
        name: 'Google User'
      });
      
      renderLogin();
      
      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
        expect(firestoreService.createUser).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('handles Google sign in error', async () => {
      mockSignInWithGoogle.mockRejectedValueOnce(new Error('Google sign in failed'));
      
      renderLogin();
      
      const googleButton = screen.getByRole('button', { name: /Continue with Google/i });
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to sign in with Google.')).toBeInTheDocument();
      });
    });
  });
}); 