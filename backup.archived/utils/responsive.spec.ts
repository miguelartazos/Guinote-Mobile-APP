import { Dimensions } from 'react-native';
import {
  scaleWidth,
  scaleHeight,
  scaleFont,
  isSmallScreen,
  isTablet,
  isLandscape,
  getCardDimensions,
  getResponsiveValue,
  getScaleFactor,
  getCardOverlap,
  getOrientationDimensions,
} from './responsive';

// Mock Dimensions
jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn(),
  },
}));

describe('responsive utilities', () => {
  const mockDimensions = Dimensions.get as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isLandscape', () => {
    it('returns true when width > height', () => {
      mockDimensions.mockReturnValue({ width: 800, height: 400 });
      expect(isLandscape()).toBe(true);
    });

    it('returns false when width <= height', () => {
      mockDimensions.mockReturnValue({ width: 400, height: 800 });
      expect(isLandscape()).toBe(false);
    });
  });

  describe('getOrientationDimensions', () => {
    it('returns correct dimensions for portrait', () => {
      mockDimensions.mockReturnValue({ width: 400, height: 800 });
      const result = getOrientationDimensions();
      expect(result).toEqual({ width: 400, height: 800 });
    });

    it('returns correct dimensions for landscape', () => {
      mockDimensions.mockReturnValue({ width: 800, height: 400 });
      const result = getOrientationDimensions();
      expect(result).toEqual({ width: 800, height: 400 });
    });
  });

  describe('scaleWidth', () => {
    it('scales width based on device width', () => {
      mockDimensions.mockReturnValue({ width: 393, height: 852 });
      expect(scaleWidth(100)).toBe(100);

      mockDimensions.mockReturnValue({ width: 786, height: 852 });
      expect(scaleWidth(100)).toBe(200);
    });
  });

  describe('scaleHeight', () => {
    it('scales height based on device height', () => {
      mockDimensions.mockReturnValue({ width: 393, height: 852 });
      expect(scaleHeight(100)).toBe(100);

      mockDimensions.mockReturnValue({ width: 393, height: 1704 });
      expect(scaleHeight(100)).toBe(200);
    });
  });

  describe('scaleFont', () => {
    it('scales font size based on device width', () => {
      mockDimensions.mockReturnValue({ width: 393, height: 852 });
      expect(scaleFont(16)).toBe(16);

      mockDimensions.mockReturnValue({ width: 786, height: 852 });
      expect(scaleFont(16)).toBe(32);
    });
  });

  describe('isSmallScreen', () => {
    it('returns true for small screens', () => {
      mockDimensions.mockReturnValue({ width: 320, height: 568 });
      expect(isSmallScreen()).toBe(true);
    });

    it('returns false for normal screens', () => {
      mockDimensions.mockReturnValue({ width: 393, height: 852 });
      expect(isSmallScreen()).toBe(false);
    });
  });

  describe('isTablet', () => {
    it('returns true for tablets', () => {
      mockDimensions.mockReturnValue({ width: 768, height: 1024 });
      expect(isTablet()).toBe(true);
    });

    it('returns false for phones', () => {
      mockDimensions.mockReturnValue({ width: 393, height: 852 });
      expect(isTablet()).toBe(false);
    });
  });

  describe('getCardDimensions', () => {
    it('returns tablet dimensions for tablets', () => {
      mockDimensions.mockReturnValue({ width: 768, height: 1024 });
      const dimensions = getCardDimensions();
      expect(dimensions.small).toEqual({ width: 54, height: 80 });
      expect(dimensions.hand).toEqual({ width: 72, height: 108 });
    });

    it('returns small phone dimensions for small screens', () => {
      mockDimensions.mockReturnValue({ width: 320, height: 568 });
      const dimensions = getCardDimensions();
      expect(dimensions.small).toEqual({ width: 36, height: 54 });
      expect(dimensions.hand).toEqual({ width: 50, height: 75 });
    });

    it('returns landscape dimensions when in landscape', () => {
      mockDimensions.mockReturnValue({ width: 800, height: 400 });
      const dimensions = getCardDimensions();
      expect(dimensions.small).toEqual({ width: 45, height: 70 });
      expect(dimensions.hand).toEqual({ width: 65, height: 100 });
    });
  });

  describe('getResponsiveValue', () => {
    it('returns tablet value for tablets', () => {
      mockDimensions.mockReturnValue({ width: 768, height: 1024 });
      expect(getResponsiveValue('phone', 'tablet')).toBe('tablet');
    });

    it('returns small phone value when provided', () => {
      mockDimensions.mockReturnValue({ width: 320, height: 568 });
      expect(getResponsiveValue('phone', 'tablet', 'small')).toBe('small');
    });

    it('returns phone value for normal phones', () => {
      mockDimensions.mockReturnValue({ width: 393, height: 852 });
      expect(getResponsiveValue('phone', 'tablet')).toBe('phone');
    });
  });

  describe('getScaleFactor', () => {
    it('calculates scale factor for portrait', () => {
      mockDimensions.mockReturnValue({ width: 393, height: 852 });
      expect(getScaleFactor()).toBe(1);
    });

    it('calculates scale factor for landscape', () => {
      mockDimensions.mockReturnValue({ width: 1920, height: 1080 });
      expect(getScaleFactor()).toBe(1);
    });

    it('uses minimum scale to maintain aspect ratio', () => {
      mockDimensions.mockReturnValue({ width: 1920, height: 540 });
      expect(getScaleFactor()).toBe(0.5);
    });
  });

  describe('getCardOverlap', () => {
    it('returns 70% overlap for tablets', () => {
      mockDimensions.mockReturnValue({ width: 768, height: 1024 });
      expect(getCardOverlap()).toBe(0.7);
    });

    it('returns 80% overlap for small screens', () => {
      mockDimensions.mockReturnValue({ width: 320, height: 568 });
      expect(getCardOverlap()).toBe(0.8);
    });

    it('returns 75% overlap for normal screens', () => {
      mockDimensions.mockReturnValue({ width: 393, height: 852 });
      expect(getCardOverlap()).toBe(0.75);
    });
  });
});
