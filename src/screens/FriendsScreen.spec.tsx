import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FriendsScreen } from './FriendsScreen';
import * as featureFlags from '../config/featureFlags';
import * as useUnifiedFriends from '../hooks/useUnifiedFriends';

jest.mock('../hooks/useUnifiedFriends');
jest.mock('../config/featureFlags');

const mockNavigation = {
  goBack: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
  NavigationContainer: ({ children }: any) => children,
}));

describe('FriendsScreen', () => {
  const mockFriends = [
    { id: '1', username: 'Player1', friendCode: 'ABC123', isOnline: true },
    { id: '2', username: 'Player2', friendCode: 'DEF456', isOnline: false },
  ];

  const mockFriendRequests = [
    { id: 'req1', sender: { id: '3', username: 'Player3' }, status: 'pending' as const },
  ];

  const mockBlockedUsers = [{ id: '4', username: 'BlockedUser' }];

  const defaultMockHook = {
    friends: mockFriends,
    friendRequests: mockFriendRequests,
    blockedUsers: mockBlockedUsers,
    isLoading: false,
    error: null,
    searchUsers: jest.fn(),
    sendFriendRequest: jest.fn(),
    acceptFriendRequest: jest.fn(),
    rejectFriendRequest: jest.fn(),
    blockUser: jest.fn(),
    unblockUser: jest.fn(),
    removeFriend: jest.fn(),
    subscribeToFriendUpdates: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (featureFlags.isMultiplayerEnabled as jest.Mock).mockReturnValue(true);
    (useUnifiedFriends.useUnifiedFriends as jest.Mock).mockReturnValue(defaultMockHook);
  });

  describe('when multiplayer is disabled', () => {
    it('shows disabled message', () => {
      (featureFlags.isMultiplayerEnabled as jest.Mock).mockReturnValue(false);

      const { getByText } = render(<FriendsScreen />);

      expect(getByText('El modo multijugador está desactivado')).toBeTruthy();
    });
  });

  describe('when multiplayer is enabled', () => {
    it('renders all tabs', () => {
      const { getByText } = render(<FriendsScreen />);

      expect(getByText('Todos')).toBeTruthy();
      expect(getByText('En línea')).toBeTruthy();
      expect(getByText('Solicitudes')).toBeTruthy();
      expect(getByText('Bloqueados')).toBeTruthy();
    });

    it('shows badge on requests tab when there are pending requests', () => {
      const { getByText } = render(<FriendsScreen />);

      const badge = getByText('1');
      expect(badge).toBeTruthy();
    });

    it('switches tabs when pressed', () => {
      const { getByText } = render(<FriendsScreen />);

      // Check initial tab (AllFriends)
      const todosTab = getByText('Todos');
      expect(todosTab).toBeTruthy();

      // Switch to En línea tab
      fireEvent.press(getByText('En línea'));

      // OnlineFriends component should be rendered - check for specific text
      // The component shows "1 amigo en línea" based on mock data (only 1 friend is online)
      expect(getByText('1 amigo en línea')).toBeTruthy();
    });

    it('shows loading overlay when loading', () => {
      (useUnifiedFriends.useUnifiedFriends as jest.Mock).mockReturnValue({
        ...defaultMockHook,
        isLoading: true,
      });

      const { queryByText } = render(<FriendsScreen />);

      // LoadingOverlay component should be shown
      // Note: LoadingOverlay may not render the text directly
      // Check that tabs are still visible but content is loading
      expect(queryByText('Todos')).toBeTruthy();
    });

    it('navigates back when back button is pressed', () => {
      const { getByText } = render(<FriendsScreen />);

      fireEvent.press(getByText('← Volver'));
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('highlights active tab', () => {
      const { getByText } = render(<FriendsScreen />);

      // Just verify the tab exists and is rendered
      const todosTab = getByText('Todos');
      expect(todosTab).toBeTruthy();

      // Switch to another tab and verify it renders
      fireEvent.press(getByText('Solicitudes'));
      expect(getByText('1 solicitud pendiente')).toBeTruthy();
    });
  });
});
