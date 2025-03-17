import { vi } from 'vitest';

// Create a mock Firebase user
export const mockFirebaseUser = {
  uid: 'test-user',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: false,
  isAnonymous: false,
  metadata: {
    creationTime: Date.now().toString(),
    lastSignInTime: Date.now().toString(),
  },
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: vi.fn(),
  getIdToken: vi.fn(),
  getIdTokenResult: vi.fn(),
  reload: vi.fn(),
  toJSON: vi.fn(),
  phoneNumber: null,
  photoURL: null,
  providerId: 'firebase',
};

// Create a mock user profile
export const mockUserProfile = {
  id: 'test-user',
  name: 'Test User',
  email: 'test@example.com',
  roles: {
    student: true,
    instructor: false,
    admin: false
  },
  registeredCourses: {},
  progress: {},
  groupIds: {},
  notes: {},
  QuizHistory: {}
};

/**
 * Creates a mock auth context with default values that can be overridden
 * @param overrides - Properties to override in the default mock auth context
 * @returns A mock auth context object
 */
export const createMockAuthContext = (overrides = {}) => ({
  currentUser: mockFirebaseUser,
  userProfile: mockUserProfile,
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  signInWithGoogle: vi.fn(),
  signUp: vi.fn(),
  resetPassword: vi.fn(),
  user: mockFirebaseUser,
  isAdmin: false,
  ...overrides,
});
