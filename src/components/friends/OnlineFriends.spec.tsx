import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OnlineFriends } from './OnlineFriends';
import * as useUnifiedFriends from '../../hooks/useUnifiedFriends';
import * as useUnifiedRooms from '../../hooks/useUnifiedRooms';

jest.mock('../../hooks/useUnifiedFriends');
jest.mock('../../hooks/useUnifiedRooms');

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

describe('OnlineFriends', () => {
  const mockFriends = [
    { id: '1', username: 'Alice', friendCode: 'ABC123', isOnline: true },
    { id: '2', username: 'Bob', friendCode: 'DEF456', isOnline: false },
    { id: '3', username: 'Charlie', friendCode: 'GHI789', isOnline: true },
  ];

  const mockRemoveFriend = jest.fn();
  const mockCreateRoom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUnifiedFriends.useUnifiedFriends as jest.Mock).mockReturnValue({
      friends: mockFriends,
      removeFriend: mockRemoveFriend,
    });
    (useUnifiedRooms.useUnifiedRooms as jest.Mock).mockReturnValue({
      createRoom: mockCreateRoom,
    });
  });

  it('renders only online friends', () => {
    const { getByText, queryByText } = render(<OnlineFriends />);

    expect(getByText('Alice')).toBeTruthy();
    expect(queryByText('Bob')).toBeNull(); // Bob is offline
    expect(getByText('Charlie')).toBeTruthy();
  });

  it('shows correct online count', () => {
    const { getByText } = render(<OnlineFriends />);

    expect(getByText('2 amigos en línea')).toBeTruthy();
  });

  it('shows singular form for one friend online', () => {
    (useUnifiedFriends.useUnifiedFriends as jest.Mock).mockReturnValue({
      friends: [mockFriends[0]], // Only Alice
      removeFriend: mockRemoveFriend,
    });

    const { getByText } = render(<OnlineFriends />);

    expect(getByText('1 amigo en línea')).toBeTruthy();
  });

  it('shows empty state when no friends are online', () => {
    (useUnifiedFriends.useUnifiedFriends as jest.Mock).mockReturnValue({
      friends: [{ ...mockFriends[1], isOnline: false }], // Only Bob, offline
      removeFriend: mockRemoveFriend,
    });

    const { getByText } = render(<OnlineFriends />);

    expect(getByText('No hay amigos en línea')).toBeTruthy();
    expect(getByText('Tus amigos aparecerán aquí cuando estén conectados')).toBeTruthy();
  });

  it('handles friend invitation', async () => {
    mockCreateRoom.mockResolvedValue({ id: 'room123', code: 'ROOM' });

    const { getAllByText } = render(<OnlineFriends />);

    const inviteButtons = getAllByText('Invitar');
    fireEvent.press(inviteButtons[0]);

    await waitFor(() => {
      expect(mockCreateRoom).toHaveBeenCalled();
    });
  });

  it('handles friend removal', () => {
    const { getAllByText } = render(<OnlineFriends />);

    const removeButtons = getAllByText('Eliminar');
    fireEvent.press(removeButtons[0]);

    expect(mockRemoveFriend).toHaveBeenCalledWith('1');
  });
});
