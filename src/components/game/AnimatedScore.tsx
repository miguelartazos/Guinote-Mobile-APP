import React, { useEffect, useState } from 'react';
import { Text, Animated, type TextStyle } from 'react-native';

type AnimatedScoreProps = {
  value: Animated.Value;
  style?: TextStyle | TextStyle[];
  formatValue?: (value: number) => string;
};

export function AnimatedScore({ value, style, formatValue = v => String(v) }: AnimatedScoreProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const listener = value.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    return () => {
      value.removeListener(listener);
    };
  }, [value]);

  return <Text style={style}>{formatValue(displayValue)}</Text>;
}
