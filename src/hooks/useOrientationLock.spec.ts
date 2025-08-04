import { renderHook } from '@testing-library/react-native';
import { useOrientationLock } from './useOrientationLock';

const mockOrientation = {
  lockToPortrait: jest.fn(),
  lockToLandscape: jest.fn(),
  lockToLandscapeLeft: jest.fn(),
  lockToLandscapeRight: jest.fn(),
  unlockAllOrientations: jest.fn(),
};

jest.mock('react-native-orientation-locker', () => ({
  default: mockOrientation,
}));

describe('useOrientationLock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('locks to portrait when portrait is specified', () => {
    renderHook(() => useOrientationLock('portrait'));
    expect(mockOrientation.lockToPortrait).toHaveBeenCalledTimes(1);
  });

  test('locks to landscape when landscape is specified', () => {
    renderHook(() => useOrientationLock('landscape'));
    expect(mockOrientation.lockToLandscape).toHaveBeenCalledTimes(1);
  });

  test('locks to landscape-left when landscape-left is specified', () => {
    renderHook(() => useOrientationLock('landscape-left'));
    expect(mockOrientation.lockToLandscapeLeft).toHaveBeenCalledTimes(1);
  });

  test('locks to landscape-right when landscape-right is specified', () => {
    renderHook(() => useOrientationLock('landscape-right'));
    expect(mockOrientation.lockToLandscapeRight).toHaveBeenCalledTimes(1);
  });

  test('unlocks all orientations when all is specified', () => {
    renderHook(() => useOrientationLock('all'));
    expect(mockOrientation.unlockAllOrientations).toHaveBeenCalledTimes(1);
  });

  test('does nothing when null is passed', () => {
    renderHook(() => useOrientationLock(null));
    expect(mockOrientation.lockToPortrait).not.toHaveBeenCalled();
    expect(mockOrientation.lockToLandscape).not.toHaveBeenCalled();
    expect(mockOrientation.unlockAllOrientations).not.toHaveBeenCalled();
  });

  test('does NOT unlock orientations on unmount (fixed orientation)', () => {
    const { unmount } = renderHook(() => useOrientationLock('landscape'));
    expect(mockOrientation.lockToLandscape).toHaveBeenCalledTimes(1);

    unmount();
    // Should NOT unlock - orientations stay fixed
    expect(mockOrientation.unlockAllOrientations).not.toHaveBeenCalled();
  });

  test('does not call unlock on unmount when null was passed', () => {
    const { unmount } = renderHook(() => useOrientationLock(null));

    unmount();
    expect(mockOrientation.unlockAllOrientations).not.toHaveBeenCalled();
  });

  test('re-locks when orientation changes', () => {
    const { rerender } = renderHook(({ lock }) => useOrientationLock(lock), {
      initialProps: { lock: 'portrait' as const },
    });

    expect(mockOrientation.lockToPortrait).toHaveBeenCalledTimes(1);

    rerender({ lock: 'landscape' });
    // Should directly lock to landscape without unlocking first
    expect(mockOrientation.lockToLandscape).toHaveBeenCalledTimes(1);
    // Should NOT unlock between orientation changes
    expect(mockOrientation.unlockAllOrientations).not.toHaveBeenCalled();
  });
});
