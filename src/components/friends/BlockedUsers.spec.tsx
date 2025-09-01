import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BlockedUsers } from './BlockedUsers';
import * as useUnifiedFriends from '../../hooks/useUnifiedFriends';

jest.mock('../../hooks/useUnifiedFriends');

// Mock React Native components
jest.mock('react-native', () => {
  const React = require('react');
  const RN = jest.requireActual('react-native');
  const { mockFlatList } = require('../../__mocks__/react-native-mock');

  RN.FlatList = mockFlatList;

  // Mock NativeDeviceInfo
  RN.NativeModules = {
    ...RN.NativeModules,
    DeviceInfo: {
      getConstants: () => ({
        Dimensions: {
          window: { width: 375, height: 667, scale: 2, fontScale: 1 },
          screen: { width: 375, height: 667, scale: 2, fontScale: 1 },
        },
      }),
    },
  };

  return RN;
});

describe('BlockedUsers', () => {
  const mockBlockedUsers = [
    { id: '1', username: 'ToxicPlayer' },
    { id: '2', username: 'Spammer' },
  ];

  const mockUnblockUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUnifiedFriends.useUnifiedFriends as jest.Mock).mockReturnValue({
      blockedUsers: mockBlockedUsers,
      unblockUser: mockUnblockUser,
    });
  });

  it('renders all blocked users', () => {
    const { getByText } = render(<BlockedUsers />);

    expect(getByText('ToxicPlayer')).toBeTruthy();
    expect(getByText('Spammer')).toBeTruthy();
  });

  it('shows correct blocked count', () => {
    const { getByText } = render(<BlockedUsers />);

    expect(getByText('2 usuarios bloqueados')).toBeTruthy();
  });

  it('shows singular form for one blocked user', () => {
    (useUnifiedFriends.useUnifiedFriends as jest.Mock).mockReturnValue({
      blockedUsers: [mockBlockedUsers[0]],
      unblockUser: mockUnblockUser,
    });

    const { getByText } = render(<BlockedUsers />);

    expect(getByText('1 usuario bloqueado')).toBeTruthy();
  });

  it('shows empty state when no blocked users', () => {
    (useUnifiedFriends.useUnifiedFriends as jest.Mock).mockReturnValue({
      blockedUsers: [],
      unblockUser: mockUnblockUser,
    });

    const { getByText } = render(<BlockedUsers />);

    expect(getByText('No hay usuarios bloqueados')).toBeTruthy();
    expect(getByText('Los usuarios que bloquees aparecerán aquí')).toBeTruthy();
  });

  it('handles unblocking user', () => {
    const { getAllByText } = render(<BlockedUsers />);

    const unblockButtons = getAllByText('Desbloquear');
    fireEvent.press(unblockButtons[0]);

    expect(mockUnblockUser).toHaveBeenCalledWith('1');
  });

  it('does not show header when no blocked users', () => {
    (useUnifiedFriends.useUnifiedFriends as jest.Mock).mockReturnValue({
      blockedUsers: [],
      unblockUser: mockUnblockUser,
    });

    const { queryByText } = render(<BlockedUsers />);

    expect(queryByText(/bloqueado/)).toBeNull();
  });

  it('shows blocked status for each user', () => {
    const { getAllByText } = render(<BlockedUsers />);

    const blockedTexts = getAllByText('Usuario bloqueado');
    expect(blockedTexts).toHaveLength(2);
  });

  it('renders user initials correctly', () => {
    const { getByText } = render(<BlockedUsers />);

    expect(getByText('TO')).toBeTruthy(); // ToxicPlayer
    expect(getByText('SP')).toBeTruthy(); // Spammer
  });
});
