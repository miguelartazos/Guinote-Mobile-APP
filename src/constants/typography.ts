export const typography = {
  fontSize: {
    // Optimized for 40+ demographic with WCAG compliance
    xs: 14, // Absolute minimum (UI elements only)
    sm: 16, // Minimum for body text (WCAG AA)
    base: 18, // Large text threshold (WCAG relaxed contrast)
    md: 20, // Comfortable reading size
    lg: 24, // Section titles
    xl: 28, // Page headers
    '2xl': 32, // Major headers
    '3xl': 36, // Display text
    xxl: 32, // Alternative large headers
    xxxl: 40, // Hero titles
  },
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight: 1.3,
    normal: 1.5, // Optimal for readability (1.4-1.5x)
    relaxed: 1.6, // For larger text blocks
    loose: 1.8, // Maximum spacing for accessibility
  },
  body: {
    fontSize: 18, // WCAG large text standard
    lineHeight: 1.5,
  },
  caption: {
    fontSize: 16, // Minimum readable size
    lineHeight: 1.4,
  },
  title: {
    fontSize: 28, // Clear hierarchy
    fontWeight: '700' as const,
    lineHeight: 1.3,
  },
  button: {
    fontSize: 18, // Consistent with body
    fontWeight: '600' as const,
    lineHeight: 1.5,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
} as const;

// Helper function to get responsive font size
export function getResponsiveFontSize(size: keyof typeof typography.fontSize): number {
  return typography.fontSize[size];
}

// Accessibility helpers for 40+ users
export const accessibleTextStyle = {
  minHeight: 48, // Enhanced touch target (9mm physical)
  lineHeight: typography.lineHeight.normal,
  minFontSize: 16, // WCAG AA compliance
  largeFontSize: 18, // WCAG relaxed contrast threshold
};

// Three-tier font system for reduced cognitive load
export const fontHierarchy = {
  primary: typography.fontSize.lg, // 24px - Headers
  secondary: typography.fontSize.base, // 18px - Body
  tertiary: typography.fontSize.sm, // 16px - Captions
} as const;

// Contrast requirements
export const contrastRatios = {
  normalText: 4.5, // WCAG AA for normal text
  largeText: 3.0, // WCAG AA for 18pt+ text
  uiComponents: 3.0, // WCAG AA for UI elements
} as const;
