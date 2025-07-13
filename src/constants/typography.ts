export const typography = {
  fontSize: {
    xs: 14,
    sm: 16,
    md: 18,
    lg: 22,
    xl: 28,
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
} as const;