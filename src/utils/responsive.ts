import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base dimensions (iPhone 14 Pro)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

export const scaleWidth = (size: number): number => {
  return (size * screenWidth) / BASE_WIDTH;
};

export const scaleHeight = (size: number): number => {
  return (size * screenHeight) / BASE_HEIGHT;
};

export const scaleFont = (size: number): number => {
  const scale = screenWidth / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(newSize);
};

export const isSmallScreen = (): boolean => {
  return screenWidth < 375;
};

export const isTablet = (): boolean => {
  return screenWidth >= 768;
};

export const getCardDimensions = () => {
  if (isTablet()) {
    return {
      small: { width: 45, height: 67 },
      medium: { width: 65, height: 97 },
      large: { width: 85, height: 127 },
    };
  } else if (isSmallScreen()) {
    return {
      small: { width: 30, height: 45 },
      medium: { width: 45, height: 67 },
      large: { width: 60, height: 90 },
    };
  } else {
    return {
      small: { width: 35, height: 52 },
      medium: { width: 50, height: 75 },
      large: { width: 65, height: 95 },
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
