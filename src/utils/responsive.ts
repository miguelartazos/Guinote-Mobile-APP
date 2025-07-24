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
      small: { width: 54, height: 80 }, // 20% larger
      medium: { width: 78, height: 116 }, // 20% larger
      large: { width: 102, height: 152 }, // 20% larger
    };
  } else if (isSmallScreen()) {
    return {
      small: { width: 36, height: 54 }, // 20% larger
      medium: { width: 54, height: 80 }, // 20% larger
      large: { width: 72, height: 108 }, // 20% larger
    };
  } else {
    return {
      small: { width: 42, height: 62 }, // 20% larger
      medium: { width: 60, height: 90 }, // 20% larger
      large: { width: 78, height: 114 }, // 20% larger
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
