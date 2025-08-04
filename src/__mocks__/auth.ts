// Mock auth context and hooks
export interface MockUser {
  id: string;
  clerk_id: string;
  username: string;
  friend_code: string;
  phone_number?: string;
  elo_rating: number;
  games_played: number;
  games_won: number;
  avatar_url?: string;
}

// Mock users for testing
export const mockUsers: Record<string, MockUser> = {
  'test-user-1': {
    id: 'test-user-1',
    clerk_id: 'clerk-test-1',
    username: 'TestPlayer1',
    friend_code: 'TEST1#01',
    phone_number: '+34600000001',
    elo_rating: 1200,
    games_played: 10,
    games_won: 5,
  },
  'test-user-2': {
    id: 'test-user-2',
    clerk_id: 'clerk-test-2',
    username: 'TestPlayer2',
    friend_code: 'TEST2#02',
    phone_number: '+34600000002',
    elo_rating: 1250,
    games_played: 20,
    games_won: 12,
  },
  'test-user-3': {
    id: 'test-user-3',
    clerk_id: 'clerk-test-3',
    username: 'TestPlayer3',
    friend_code: 'TEST3#03',
    phone_number: '+34600000003',
    elo_rating: 1100,
    games_played: 5,
    games_won: 2,
  },
};

// Current authenticated user
let currentUser: MockUser | null = null;

// Mock auth functions
export const mockAuth = {
  setCurrentUser: (userId: string | null) => {
    currentUser = userId ? mockUsers[userId] || null : null;
  },

  getCurrentUser: () => currentUser,

  isAuthenticated: () => currentUser !== null,

  login: async (userId: string) => {
    currentUser = mockUsers[userId] || null;
    return currentUser;
  },

  logout: async () => {
    currentUser = null;
  },
};

// Mock useAuth hook
export const useAuth = jest.fn(() => ({
  user: currentUser,
  isAuthenticated: currentUser !== null,
  isLoading: false,
  login: mockAuth.login,
  logout: mockAuth.logout,
}));

// Mock useUserProfile hook
export const useUserProfile = jest.fn((clerkId: string | null) => {
  const profile = clerkId
    ? Object.values(mockUsers).find(u => u.clerk_id === clerkId)
    : null;
  return {
    profile,
    isLoading: false,
    error: null,
  };
});

// Helper to create a mock user
export const createMockUser = (overrides?: Partial<MockUser>): MockUser => {
  const id = `test-user-${Date.now()}`;
  return {
    id,
    clerk_id: `clerk-${id}`,
    username: 'TestUser',
    friend_code: 'TEST#99',
    elo_rating: 1200,
    games_played: 0,
    games_won: 0,
    ...overrides,
  };
};
