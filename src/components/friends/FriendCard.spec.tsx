import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FriendCard } from './FriendCard';
import type { Friend, FriendRequest } from '../../types/friend.types';

describe('FriendCard', () => {
  const mockFriend: Friend = {
    id: '1',
    username: 'TestUser',
    friendCode: 'TEST123',
    isOnline: true,
  };

  const mockRequest: FriendRequest = {
    id: 'req1',
    sender: { id: '2', username: 'RequestUser' },
    status: 'pending',
  };

  const mockBlockedUser = {
    id: '3',
    username: 'BlockedUser',
  };

  describe('with friend prop', () => {
    it('renders friend information', () => {
      const { getByText } = render(<FriendCard friend={mockFriend} />);

      expect(getByText('TestUser')).toBeTruthy();
      expect(getByText('#TEST123')).toBeTruthy();
      expect(getByText('TE')).toBeTruthy(); // Avatar initials (first 2 chars)
    });

    it('shows online indicator when friend is online', () => {
      const { queryByText, rerender } = render(<FriendCard friend={mockFriend} />);

      // Avatar should be rendered
      expect(queryByText('TE')).toBeTruthy();

      // Rerender with offline friend and verify it still renders
      rerender(<FriendCard friend={{ ...mockFriend, isOnline: false }} />);
      expect(queryByText('TE')).toBeTruthy();
    });

    it('shows invite button for online friends', () => {
      const mockInvite = jest.fn();
      const { getByText } = render(<FriendCard friend={mockFriend} onInvite={mockInvite} />);

      const inviteButton = getByText('Invitar');
      fireEvent.press(inviteButton);
      expect(mockInvite).toHaveBeenCalledWith('1');
    });

    it('does not show invite button for offline friends', () => {
      const mockInvite = jest.fn();
      const { queryByText } = render(
        <FriendCard friend={{ ...mockFriend, isOnline: false }} onInvite={mockInvite} />,
      );

      expect(queryByText('Invitar')).toBeNull();
    });

    it('shows remove button when onRemove is provided', () => {
      const mockRemove = jest.fn();
      const { getByText } = render(<FriendCard friend={mockFriend} onRemove={mockRemove} />);

      const removeButton = getByText('Eliminar');
      fireEvent.press(removeButton);
      expect(mockRemove).toHaveBeenCalledWith('1');
    });
  });

  describe('with request prop', () => {
    it('renders request information', () => {
      const { getByText } = render(<FriendCard request={mockRequest} />);

      expect(getByText('RequestUser')).toBeTruthy();
      expect(getByText('Solicitud pendiente')).toBeTruthy();
      expect(getByText('RE')).toBeTruthy(); // Avatar initials (first 2 chars)
    });

    it('shows accept and reject buttons', () => {
      const mockAccept = jest.fn();
      const mockReject = jest.fn();

      const { getByText } = render(
        <FriendCard request={mockRequest} onAccept={mockAccept} onReject={mockReject} />,
      );

      const acceptButton = getByText('✓');
      const rejectButton = getByText('✗');

      fireEvent.press(acceptButton);
      expect(mockAccept).toHaveBeenCalledWith('req1');

      fireEvent.press(rejectButton);
      expect(mockReject).toHaveBeenCalledWith('req1');
    });
  });

  describe('with blockedUser prop', () => {
    it('renders blocked user information', () => {
      const { getByText } = render(<FriendCard blockedUser={mockBlockedUser} />);

      expect(getByText('BlockedUser')).toBeTruthy();
      expect(getByText('Usuario bloqueado')).toBeTruthy();
      expect(getByText('BL')).toBeTruthy(); // Avatar initials (first 2 chars)
    });

    it('shows unblock button', () => {
      const mockUnblock = jest.fn();
      const { getByText } = render(
        <FriendCard blockedUser={mockBlockedUser} onUnblock={mockUnblock} />,
      );

      const unblockButton = getByText('Desbloquear');
      fireEvent.press(unblockButton);
      expect(mockUnblock).toHaveBeenCalledWith('3');
    });
  });

  describe('edge cases', () => {
    it('returns null when no user data is provided', () => {
      const { toJSON } = render(<FriendCard />);
      expect(toJSON()).toBeNull();
    });

    it('handles long usernames gracefully', () => {
      const longNameFriend = {
        ...mockFriend,
        username: 'VeryLongUsernameHere',
      };

      const { getByText } = render(<FriendCard friend={longNameFriend} />);
      expect(getByText('VeryLongUsernameHere')).toBeTruthy();
      expect(getByText('VE')).toBeTruthy(); // Still shows first 2 chars
    });

    it('handles missing friend code gracefully', () => {
      const friendWithoutCode = {
        ...mockFriend,
        friendCode: undefined,
      };

      const { queryByText } = render(<FriendCard friend={friendWithoutCode} />);
      expect(queryByText('#')).toBeNull();
    });
  });
});
