import { renderHook, act } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { useOrientation } from './useOrientation';

describe('useOrientation', () => {
  const mockDimensions = {
    portrait: { width: 375, height: 812, scale: 2, fontScale: 1 },
    landscape: { width: 812, height: 375, scale: 2, fontScale: 1 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns portrait orientation when height > width', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue(mockDimensions.portrait);

    const { result } = renderHook(() => useOrientation());

    expect(result.current).toBe('portrait');
  });

  test('returns landscape orientation when width > height', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue(mockDimensions.landscape);

    const { result } = renderHook(() => useOrientation());

    expect(result.current).toBe('landscape');
  });

  test('updates orientation when dimensions change', () => {
    let changeHandler: any;
    const mockAddEventListener = jest.fn((event, handler) => {
      changeHandler = handler;
      return { remove: jest.fn() };
    });

    jest.spyOn(Dimensions, 'addEventListener').mockImplementation(mockAddEventListener);
    jest.spyOn(Dimensions, 'get').mockReturnValue(mockDimensions.portrait);

    const { result } = renderHook(() => useOrientation());

    expect(result.current).toBe('portrait');

    // Simulate orientation change
    act(() => {
      changeHandler({ window: mockDimensions.landscape });
    });

    expect(result.current).toBe('landscape');
  });

  test('removes event listener on unmount', () => {
    const mockRemove = jest.fn();
    const mockAddEventListener = jest.fn(() => ({ remove: mockRemove }));

    jest.spyOn(Dimensions, 'addEventListener').mockImplementation(mockAddEventListener);

    const { unmount } = renderHook(() => useOrientation());

    unmount();

    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  test('returns portrait orientation when width equals height', () => {
    const squareDimensions = {
      width: 500,
      height: 500,
      scale: 2,
      fontScale: 1,
    };
    jest.spyOn(Dimensions, 'get').mockReturnValue(squareDimensions);

    const { result } = renderHook(() => useOrientation());

    expect(result.current).toBe('portrait');
  });
});
