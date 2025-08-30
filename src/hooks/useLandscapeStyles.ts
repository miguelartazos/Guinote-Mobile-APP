import { useMemo } from 'react';
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useOrientation } from './useOrientation';

type Style = ViewStyle | TextStyle | ImageStyle;

/**
 * Hook to merge portrait and landscape styles based on device orientation
 * @param portraitStyles Base styles for portrait mode
 * @param landscapeStyles Additional styles to apply in landscape mode
 * @returns Merged styles object
 */
export function useLandscapeStyles<T extends Record<string, Style>>(
  portraitStyles: T,
  landscapeStyles: Partial<T>,
): T {
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  return useMemo(() => {
    if (!isLandscape) {
      return portraitStyles;
    }

    const mergedStyles = { ...portraitStyles };

    Object.entries(landscapeStyles).forEach(([key, modifier]) => {
      if (key in mergedStyles && modifier) {
        mergedStyles[key as keyof T] = {
          ...mergedStyles[key as keyof T],
          ...modifier,
        } as T[keyof T];
      }
    });

    return mergedStyles;
  }, [isLandscape, portraitStyles, landscapeStyles]);
}

/**
 * Helper to conditionally apply styles based on landscape orientation
 * @param condition Whether to apply the conditional style
 * @param style The style to apply if condition is true
 * @returns Style array or undefined
 */
export function conditionalLandscapeStyle<T extends Style>(
  condition: boolean,
  style?: T,
): T | undefined {
  return condition ? style : undefined;
}
