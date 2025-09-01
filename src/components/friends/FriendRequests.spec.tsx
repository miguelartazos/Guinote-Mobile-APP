import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FriendRequests } from './FriendRequests';
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

describe('FriendRequests', () => {
  const mockFriendRequests = [
    { id: 'req1', sender: { id: '1', username: 'Alice' }, status: 'pending' as const },
    { id: 'req2', sender: { id: '2', username: 'Bob' }, status: 'pending' as const },
  ];

  const mockAcceptFriendRequest = jest.fn();
  const mockRejectFriendRequest = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUnifiedFriends.useUnifiedFriends as jest.Mock).mockReturnValue({
      friendRequests: mockFriendRequests,
      acceptFriendRequest: mockAcceptFriendRequest,
      rejectFriendRequest: mockRejectFriendRequest,
    });
  });

  it('renders all friend requests', () => {
    const { getByText } = render(<FriendRequests />);

    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
  });

  it('shows correct request count', () => {
    const { getByText } = render(<FriendRequests />);

    expect(getByText('2 solicitudes pendientes')).toBeTruthy();
  });

  it('shows singular form for one request', () => {
    (useUnifiedFriends.useUnifiedFriends as jest.Mock).mockReturnValue({
      friendRequests: [mockFriendRequests[0]],
      acceptFriendRequest: mockAcceptFriendRequest,
      rejectFriendRequest: mockRejectFriendRequest,
    });

    const { getByText } = render(<FriendRequests />);

    expect(getByText('1 solicitud pendiente')).toBeTruthy();
  });

  it('shows empty state when no requests', () => {
    (useUnifiedFriends.useUnifiedFriends as jest.Mock).mockReturnValue({
      friendRequests: [],
      acceptFriendRequest: mockAcceptFriendRequest,
      rejectFriendRequest: mockRejectFriendRequest,
    });

    const { getByText } = render(<FriendRequests />);

    expect(getByText('No tienes solicitudes pendientes')).toBeTruthy();
    expect(getByText('Las solicitudes de amistad aparecerán aquí')).toBeTruthy();
  });

  it('handles accepting friend request', () => {
    const { getAllByText } = render(<FriendRequests />);

    const acceptButtons = getAllByText('✓');
    fireEvent.press(acceptButtons[0]);

    expect(mockAcceptFriendRequest).toHaveBeenCalledWith('req1');
  });

  it('handles rejecting friend request', () => {
    const { getAllByText } = render(<FriendRequests />);

    const rejectButtons = getAllByText('✗');
    fireEvent.press(rejectButtons[0]);

    expect(mockRejectFriendRequest).toHaveBeenCalledWith('req1');
  });

  it('does not show header when no requests', () => {
    (useUnifiedFriends.useUnifiedFriends as jest.Mock).mockReturnValue({
      friendRequests: [],
      acceptFriendRequest: mockAcceptFriendRequest,
      rejectFriendRequest: mockRejectFriendRequest,
    });

    const { queryByText } = render(<FriendRequests />);

    expect(queryByText(/solicitud/)).toBeNull();
  });

  it('shows pending status for each request', () => {
    const { getAllByText } = render(<FriendRequests />);

    const pendingTexts = getAllByText('Solicitud pendiente');
    expect(pendingTexts).toHaveLength(2);
  });
});
