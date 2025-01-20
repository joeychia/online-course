import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Mock useTranslation hook
vi.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        signIn: '登入',
        signUp: '註冊',
        createAccount: '建立帳號',
        name: '姓名',
        email: '電子郵件',
        password: '密碼',
        confirmPassword: '確認密碼',
        fillRequiredFields: '請填寫所有必填欄位。',
        passwordsNotMatch: '密碼不相符。',
        passwordTooShort: '密碼長度必須至少為6個字符。',
        failedToCreateAccount: '無法建立帳號。',
        failedToSignIn: '登入失敗。',
        continueWithGoogle: '使用Google帳號繼續',
        noAccount: '還沒有帳號？註冊',
        haveAccount: '已經有帳號？登入',
        failedToSignInWithGoogle: '使用Google登入失敗。'
      };
      return translations[key] || key;
    },
    language: 'zh-TW'
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
      expect(screen.getByRole('heading', { name: '登入' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /電子郵件/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/密碼/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/確認密碼/i)).not.toBeInTheDocument();
    });

    it('validates required fields', async () => {
      renderLogin();
      const signInButton = screen.getByRole('button', { name: '登入' });
      
      await act(async () => {
        fireEvent.submit(signInButton.closest('form')!);
      });
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('請填寫所有必填欄位。');
      });
    });

    it('handles successful sign in', async () => {
      mockSignIn.mockResolvedValueOnce({ uid: 'test123' });
      renderLogin();
      
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox', { name: /電子郵件/i }), {
          target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByLabelText(/密碼/i), {
          target: { value: 'password123' }
        });
        
        const signInButton = screen.getByRole('button', { name: '登入' });
        fireEvent.click(signInButton);
      });
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('handles sign in error', async () => {
      mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));
      renderLogin();
      
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox', { name: /電子郵件/i }), {
          target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByLabelText(/密碼/i), {
          target: { value: 'password123' }
        });
        
        const signInButton = screen.getByRole('button', { name: '登入' });
        fireEvent.click(signInButton);
      });
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('登入失敗。');
      });
    });
  });

  describe('Sign Up Mode', () => {
    const switchToSignUp = async () => {
      await act(async () => {
        fireEvent.click(screen.getByText('還沒有帳號？註冊'));
      });
    };

    it('switches to sign up mode', async () => {
      renderLogin();
      await switchToSignUp();
      
      expect(screen.getByText('建立帳號')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /姓名/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/確認密碼/i)).toBeInTheDocument();
    });

    it('validates password match', async () => {
      renderLogin();
      await switchToSignUp();
      
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox', { name: /電子郵件/i }), {
          target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByLabelText(/^密碼/i), {
          target: { value: 'password123' }
        });
        fireEvent.change(screen.getByLabelText(/確認密碼/i), {
          target: { value: 'password456' }
        });
        
        const signUpButton = screen.getByRole('button', { name: '註冊' });
        fireEvent.click(signUpButton);
      });
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('密碼不相符。');
      });
    });

    it('validates password length', async () => {
      renderLogin();
      await switchToSignUp();
      
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox', { name: /電子郵件/i }), {
          target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByLabelText(/^密碼/i), {
          target: { value: '12345' }
        });
        fireEvent.change(screen.getByLabelText(/確認密碼/i), {
          target: { value: '12345' }
        });
        
        const signUpButton = screen.getByRole('button', { name: '註冊' });
        fireEvent.click(signUpButton);
      });
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('密碼長度必須至少為6個字符。');
      });
    });

    it('handles successful sign up', async () => {
      const mockUserCredential = { uid: 'user123', email: 'test@example.com' };
      mockSignUp.mockResolvedValueOnce(mockUserCredential);
      
      renderLogin();
      await switchToSignUp();
      
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox', { name: /姓名/i }), {
          target: { value: 'Test User' }
        });
        fireEvent.change(screen.getByRole('textbox', { name: /電子郵件/i }), {
          target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByLabelText(/^密碼/i), {
          target: { value: 'password123' }
        });
        fireEvent.change(screen.getByLabelText(/確認密碼/i), {
          target: { value: 'password123' }
        });
        
        const signUpButton = screen.getByRole('button', { name: '註冊' });
        fireEvent.click(signUpButton);
      });
      
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
      
      await act(async () => {
        const googleButton = screen.getByRole('button', { name: /使用Google帳號繼續/i });
        fireEvent.click(googleButton);
      });
      
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
        name: 'Google User',
        registeredCourses: {},
        progress: {},
        groupIds: {},
        notes: {},
      });
      
      renderLogin();
      
      await act(async () => {
        const googleButton = screen.getByRole('button', { name: /使用Google帳號繼續/i });
        fireEvent.click(googleButton);
      });
      
      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
        expect(firestoreService.createUser).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('handles Google sign in error', async () => {
      mockSignInWithGoogle.mockRejectedValueOnce(new Error('Google sign in failed'));
      
      renderLogin();
      
      await act(async () => {
        const googleButton = screen.getByRole('button', { name: /使用Google帳號繼續/i });
        fireEvent.click(googleButton);
      });
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('登入失敗。');
      });
    });
  });
}); 