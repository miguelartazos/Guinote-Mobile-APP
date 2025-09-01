export const typography = {
  fontSize: {
    // Increased sizes for better readability for seniors
    xs: 14, // Minimum size
    sm: 16, // Small text
    base: 18, // Base size
    md: 20, // Body text
    lg: 24, // Emphasized text
    xl: 28, // Section headers
    '2xl': 32, // Alternative large
    '3xl': 36, // Alternative extra large
    xxl: 32, // Page headers
    xxxl: 40, // Main titles
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
    normal: 1.6,
    relaxed: 1.8,
    loose: 2.0,
  },
  body: {
    fontSize: 20,
    lineHeight: 1.6,
  },
  caption: {
    fontSize: 16,
    lineHeight: 1.4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 1.3,
  },
  button: {
    fontSize: 20,
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

// Accessibility helpers
export const accessibleTextStyle = {
  minHeight: 44, // Minimum touch target
  lineHeight: typography.lineHeight.relaxed,
};
