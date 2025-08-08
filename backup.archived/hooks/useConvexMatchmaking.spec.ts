// Jest test file
import { renderHook, act } from '@testing-library/react-hooks';
import { useQuery, useMutation } from 'convex/react';
import { useNavigation } from '@react-navigation/native';
import { useConvexMatchmaking } from './useConvexMatchmaking';
import type { NavigationIntent } from '../utils/matchmakingHandlers';

// Mock dependencies
jest.mock('convex/react');
jest.mock('@react-navigation/native');

describe('useConvexMatchmaking', () => {
  const mockJoinQueue = jest.fn();
  const mockLeaveQueue = jest.fn();
  const mockNavigate = jest.fn();
  const mockUserId = 'user123' as any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock useMutation
    (useMutation as any).mockImplementation((api: any) => {
      if (api._name === 'matchmaking.joinQueue') return mockJoinQueue;
      if (api._name === 'matchmaking.leaveQueue') return mockLeaveQueue;
      return jest.fn();
    });

    // Mock useQuery
    (useQuery as any).mockImplementation(() => null);

    // Mock navigation
    (useNavigation as any).mockReturnValue({
      navigate: mockNavigate,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start with idle status', () => {
    const { result } = renderHook(() =>
      useConvexMatchmaking({ userId: mockUserId }),
    );

    expect(result.current.status).toEqual({
      status: 'idle',
      playersInQueue: 0,
      waitTime: 0,
      estimatedTime: 45,
      eloRange: 100,
    });
  });

  it('should start matchmaking when called', async () => {
    const { result } = renderHook(() =>
      useConvexMatchmaking({ userId: mockUserId }),
    );

    await act(async () => {
      await result.current.startMatchmaking(mockUserId);
    });

    expect(mockJoinQueue).toHaveBeenCalledWith({
      userId: mockUserId,
      gameMode: 'ranked',
    });
    expect(result.current.status.status).toBe('searching');
  });

  it('should handle matchmaking errors', async () => {
    mockJoinQueue.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() =>
      useConvexMatchmaking({ userId: mockUserId }),
    );

    await act(async () => {
      await result.current.startMatchmaking(mockUserId);
    });

    expect(result.current.status.status).toBe('error');
    expect(result.current.error).toBe('Network error');
  });

  it('should cancel matchmaking', async () => {
    const { result } = renderHook(() =>
      useConvexMatchmaking({ userId: mockUserId }),
    );

    // Start matchmaking first
    await act(async () => {
      await result.current.startMatchmaking(mockUserId);
    });

    // Then cancel
    await act(async () => {
      await result.current.cancelMatchmaking(mockUserId);
    });

    expect(mockLeaveQueue).toHaveBeenCalledWith({ userId: mockUserId });
    expect(result.current.status.status).toBe('idle');
  });

  it('should use custom navigation handler when provided', async () => {
    const onNavigate = jest.fn();

    // Mock useQuery to return a room
    (useQuery as any).mockImplementation((api: any) => {
      if (api._name === 'rooms.getUserActiveRoom') {
        return { roomId: 'room123', code: 'ABC123' };
      }
      return null;
    });

    const { result } = renderHook(() =>
      useConvexMatchmaking({ userId: mockUserId, onNavigate }),
    );

    // Start matchmaking
    await act(async () => {
      await result.current.startMatchmaking(mockUserId);
    });

    // Wait for navigation timeout
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    const expectedIntent: NavigationIntent = {
      type: 'navigate',
      screen: 'NetworkGame',
      params: { roomId: 'room123', roomCode: 'ABC123' },
    };

    expect(onNavigate).toHaveBeenCalledWith(expectedIntent);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should update wait time while searching', async () => {
    const { result } = renderHook(() =>
      useConvexMatchmaking({ userId: mockUserId }),
    );

    await act(async () => {
      await result.current.startMatchmaking(mockUserId);
    });

    // Advance time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.status.waitTime).toBe(5);
    expect(result.current.status.eloRange).toBe(100); // 100 + floor(5/10) * 50
  });
});
