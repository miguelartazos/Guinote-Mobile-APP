import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AllFriends } from './AllFriends';
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

describe('AllFriends', () => {
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

  it('renders all friends', () => {
    const { getByText } = render(<AllFriends />);

    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
    expect(getByText('Charlie')).toBeTruthy();
  });

  it('shows empty state when no friends', () => {
    (useUnifiedFriends.useUnifiedFriends as jest.Mock).mockReturnValue({
      friends: [],
      removeFriend: mockRemoveFriend,
    });

    const { getByText } = render(<AllFriends />);

    expect(getByText('No tienes amigos agregados')).toBeTruthy();
    expect(getByText('Busca usuarios por su código de amigo para agregarlos')).toBeTruthy();
  });

  it('filters friends by search query', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<AllFriends />);

    const searchInput = getByPlaceholderText('Buscar amigos...');
    fireEvent.changeText(searchInput, 'Alice');

    expect(getByText('Alice')).toBeTruthy();
    expect(queryByText('Bob')).toBeNull();
    expect(queryByText('Charlie')).toBeNull();
  });

  it('filters are case insensitive', () => {
    const { getByPlaceholderText, getByText } = render(<AllFriends />);

    const searchInput = getByPlaceholderText('Buscar amigos...');
    fireEvent.changeText(searchInput, 'alice');

    expect(getByText('Alice')).toBeTruthy();
  });

  it('handles friend invitation', async () => {
    mockCreateRoom.mockResolvedValue({ id: 'room123', code: 'ROOM' });

    const { getAllByText } = render(<AllFriends />);

    // Find the first "Invitar" button (for Alice who is online)
    const inviteButtons = getAllByText('Invitar');
    fireEvent.press(inviteButtons[0]);

    await waitFor(() => {
      expect(mockCreateRoom).toHaveBeenCalled();
    });
  });

  it('handles friend removal', () => {
    const { getAllByText } = render(<AllFriends />);

    const removeButtons = getAllByText('Eliminar');
    fireEvent.press(removeButtons[0]);

    expect(mockRemoveFriend).toHaveBeenCalledWith('1');
  });

  it('shows invite button only for online friends', () => {
    const { getAllByText, queryByText } = render(<AllFriends />);

    // Should have 2 invite buttons (Alice and Charlie are online)
    const inviteButtons = getAllByText('Invitar');
    expect(inviteButtons).toHaveLength(2);

    // All friends should have remove buttons
    const removeButtons = getAllByText('Eliminar');
    expect(removeButtons).toHaveLength(3);
  });

  it('clears search when input is emptied', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<AllFriends />);

    const searchInput = getByPlaceholderText('Buscar amigos...');

    // Filter to show only Alice
    fireEvent.changeText(searchInput, 'Alice');
    expect(queryByText('Bob')).toBeNull();

    // Clear search
    fireEvent.changeText(searchInput, '');

    // All friends should be visible again
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
    expect(getByText('Charlie')).toBeTruthy();
  });
});
