import { Dimensions } from 'react-native';

// Base dimensions (iPhone 14 Pro in portrait)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

// Detect orientation - always get fresh dimensions
export const isLandscape = (): boolean => {
  const { width, height } = Dimensions.get('window');
  return width > height;
};

// Get orientation-aware dimensions
export const getOrientationDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return {
    width: isLandscape() ? Math.max(width, height) : Math.min(width, height),
    height: isLandscape() ? Math.min(width, height) : Math.max(width, height),
  };
};

export const scaleWidth = (size: number): number => {
  const { width } = Dimensions.get('window');
  return (size * width) / BASE_WIDTH;
};

export const scaleHeight = (size: number): number => {
  const { height } = Dimensions.get('window');
  return (size * height) / BASE_HEIGHT;
};

export const scaleFont = (size: number): number => {
  const { width } = Dimensions.get('window');
  const scale = width / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(newSize);
};

export const getResponsiveFontSize = scaleFont;

export const isSmallScreen = (): boolean => {
  const { width } = Dimensions.get('window');
  return width < 375;
};

export const isTablet = (): boolean => {
  const { width } = Dimensions.get('window');
  return width >= 768;
};

export const getCardDimensions = () => {
  const landscape = isLandscape();

  if (isTablet()) {
    return {
      small: landscape ? { width: 45, height: 70 } : { width: 54, height: 80 },
      medium: landscape
        ? { width: 70, height: 108 }
        : { width: 78, height: 116 },
      large: landscape
        ? { width: 92, height: 136 }
        : { width: 102, height: 152 },
      hand: landscape ? { width: 65, height: 100 } : { width: 72, height: 108 },
    };
  } else if (isSmallScreen()) {
    return {
      small: landscape ? { width: 32, height: 48 } : { width: 36, height: 54 },
      medium: landscape ? { width: 48, height: 72 } : { width: 54, height: 80 },
      large: landscape ? { width: 64, height: 96 } : { width: 72, height: 108 },
      hand: landscape ? { width: 45, height: 70 } : { width: 50, height: 75 },
    };
  } else {
    return {
      small: landscape ? { width: 35, height: 55 } : { width: 32, height: 48 },
      medium: landscape ? { width: 55, height: 85 } : { width: 48, height: 72 },
      large: landscape ? { width: 60, height: 92 } : { width: 65, height: 95 },
      hand: landscape ? { width: 50, height: 78 } : { width: 48, height: 72 },
    };
  }
};

export const getResponsiveValue = <T>(
  phone: T,
  tablet: T,
  smallPhone?: T,
): T => {
  if (isTablet()) return tablet;
  if (smallPhone && isSmallScreen()) return smallPhone;
  return phone;
};

// Get scale factor for maintaining aspect ratio
export const getScaleFactor = (): number => {
  const { width, height } = Dimensions.get('window');
  const landscape = isLandscape();

  // Base design dimensions
  const baseWidth = landscape ? 1920 : 393;
  const baseHeight = landscape ? 1080 : 852;

  // Calculate scale factor maintaining aspect ratio
  const scaleX = width / baseWidth;
  const scaleY = height / baseHeight;

  return Math.min(scaleX, scaleY);
};

// Get card overlap percentage based on screen size
export const getCardOverlap = (): number => {
  if (isTablet()) return 0.7; // 70% overlap on tablets
  if (isSmallScreen()) return 0.8; // 80% overlap on small phones
  return 0.75; // 75% overlap default
};
