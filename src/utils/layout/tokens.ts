import { useWindowDimensions } from 'react-native';

export type LandscapeTokens = {
  vw: number;
  vh: number;
  scale: number;
  spacing: {
    s1: number;
    s2: number;
    s3: number;
    s4: number;
    s6: number;
    s8: number;
  };
  radius: {
    r2: number;
    r3: number;
  };
  bars: {
    topBarHeight: number;
    bottomBarHeight: number;
  };
  card: {
    width: number;
    height: number;
    tableHeight: number;
  };
  gutters: {
    x: number;
    maxContentWidth: number;
  };
};

export function useLandscapeTokens(): LandscapeTokens {
  const { width, height } = useWindowDimensions();
  const vw = width;
  const vh = height;
  const baseHeight = 393; // iPhone 14 landscape height
  const scale = Math.max(0.85, Math.min(1.55, vh / baseHeight));

  const s = (n: number) => Math.round(n * scale);

  const cardH = Math.max(72, Math.min(128, Math.round(vh * 0.26)));
  const cardW = Math.round(cardH * (2 / 3));

  const gutterX = Math.max(16, Math.round(vw * 0.03));
  const maxW = Math.min(1200, vw - 2 * gutterX);

  return {
    vw,
    vh,
    scale,
    spacing: {
      s1: s(4),
      s2: s(8),
      s3: s(12),
      s4: s(16),
      s6: s(24),
      s8: s(32),
    },
    radius: {
      r2: s(8),
      r3: s(12),
    },
    bars: {
      topBarHeight: s(56),
      bottomBarHeight: s(64),
    },
    card: {
      width: cardW,
      height: cardH,
      tableHeight: Math.round(cardH * 0.8),
    },
    gutters: {
      x: gutterX,
      maxContentWidth: maxW,
    },
  };
}


