export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 18,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 36,
    xxl: 36,
    xxxl: 48,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
  body: {
    fontSize: 16,
    lineHeight: 1.5,
  },
  caption: {
    fontSize: 12,
    lineHeight: 1.2,
  },
} as const;
