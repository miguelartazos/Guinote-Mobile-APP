import React from 'react';
import Svg, { Rect, Path, Text as SvgText, G } from 'react-native-svg';
import type { SpanishSuit, CardValue } from './SpanishCard';

type CardGraphicsProps = {
  suit: SpanishSuit;
  value: CardValue;
  width: number;
  height: number;
};

const SUIT_PATHS = {
  oros: {
    path: 'M15,5 A10,10 0 1,1 15,25 A10,10 0 1,1 15,5',
    color: '#D4A574',
  },
  copas: {
    path: 'M15,22 L15,28 L10,28 L20,28 M15,22 C10,22 5,17 5,12 C5,7 10,5 15,10 C20,5 25,7 25,12 C25,17 20,22 15,22',
    color: '#DC2626',
  },
  espadas: {
    path: 'M15,5 L15,25 M10,10 L20,10 M15,5 C15,5 10,10 10,15 C10,20 15,25 15,25 C15,25 20,20 20,15 C20,10 15,5 15,5',
    color: '#2C5F41',
  },
  bastos: {
    path: 'M15,5 L15,25 M10,8 L20,22 M20,8 L10,22',
    color: '#8B4513',
  },
};

const VALUE_DISPLAY: Record<CardValue, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  10: 'S',
  11: 'C',
  12: 'R',
};

export function CardGraphics({
  suit,
  value,
  width,
  height,
}: CardGraphicsProps) {
  const suitConfig = SUIT_PATHS[suit];
  const isRoyalty = value >= 10;
  const displayValue = VALUE_DISPLAY[value];

  // Scale factors based on card size
  const scaleFactor = width / 60;
  const cornerFontSize = 16 * scaleFactor;
  const centerScale = scaleFactor * 1.5;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Card background */}
      <Rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill="white"
        stroke="#CCCCCC"
        strokeWidth="1"
        rx={4 * scaleFactor}
      />

      {/* Top left corner */}
      <G>
        <SvgText
          x={5 * scaleFactor}
          y={18 * scaleFactor}
          fontSize={cornerFontSize}
          fontWeight="bold"
          fill={suitConfig.color}
        >
          {displayValue}
        </SvgText>
        <G
          transform={`translate(${5 * scaleFactor}, ${
            22 * scaleFactor
          }) scale(${scaleFactor * 0.5})`}
        >
          <Path d={suitConfig.path} fill={suitConfig.color} />
        </G>
      </G>

      {/* Bottom right corner (rotated) */}
      <G
        transform={`translate(${width - 5 * scaleFactor}, ${
          height - 5 * scaleFactor
        }) rotate(180)`}
      >
        <SvgText
          x={0}
          y={13 * scaleFactor}
          fontSize={cornerFontSize}
          fontWeight="bold"
          fill={suitConfig.color}
        >
          {displayValue}
        </SvgText>
        <G
          transform={`translate(0, ${17 * scaleFactor}) scale(${
            scaleFactor * 0.5
          })`}
        >
          <Path d={suitConfig.path} fill={suitConfig.color} />
        </G>
      </G>

      {/* Center content */}
      <G transform={`translate(${width / 2}, ${height / 2})`}>
        {isRoyalty ? (
          // Royalty cards show larger value
          <G>
            <SvgText
              x={0}
              y={-10 * scaleFactor}
              fontSize={20 * scaleFactor}
              fontWeight="bold"
              fill={suitConfig.color}
              textAnchor="middle"
            >
              {displayValue === 'S'
                ? 'Sota'
                : displayValue === 'C'
                ? 'Caballo'
                : 'Rey'}
            </SvgText>
            <G
              transform={`translate(0, ${
                5 * scaleFactor
              }) scale(${centerScale})`}
            >
              <Path
                d={suitConfig.path}
                fill={suitConfig.color}
                transform="translate(-15, -15)"
              />
            </G>
          </G>
        ) : (
          // Number cards show suit pattern
          <G>
            {getNumberPattern(value, scaleFactor).map((pos, i) => (
              <G
                key={i}
                transform={`translate(${pos.x}, ${pos.y}) scale(${
                  scaleFactor * 0.8
                })`}
              >
                <Path
                  d={suitConfig.path}
                  fill={suitConfig.color}
                  transform="translate(-15, -15)"
                />
              </G>
            ))}
          </G>
        )}
      </G>
    </Svg>
  );
}

const H_OFFSET = 0.6; // Horizontal offset multiplier

const CARD_PATTERNS: Record<CardValue, Array<[number, number]>> = {
  1: [[0, 0]],
  2: [
    [0, -1],
    [0, 1],
  ],
  3: [
    [0, -1],
    [0, 0],
    [0, 1],
  ],
  4: [
    [-H_OFFSET, -1],
    [H_OFFSET, -1],
    [-H_OFFSET, 1],
    [H_OFFSET, 1],
  ],
  5: [
    [-H_OFFSET, -1],
    [H_OFFSET, -1],
    [0, 0],
    [-H_OFFSET, 1],
    [H_OFFSET, 1],
  ],
  6: [
    [-H_OFFSET, -1],
    [H_OFFSET, -1],
    [-H_OFFSET, 0],
    [H_OFFSET, 0],
    [-H_OFFSET, 1],
    [H_OFFSET, 1],
  ],
  7: [
    [-H_OFFSET, -1],
    [H_OFFSET, -1],
    [0, -0.5],
    [-H_OFFSET, 0],
    [H_OFFSET, 0],
    [-H_OFFSET, 1],
    [H_OFFSET, 1],
  ],
  10: [[0, 0]], // Sota
  11: [[0, 0]], // Caballo
  12: [[0, 0]], // Rey
};

function getNumberPattern(
  value: CardValue,
  scale: number,
): Array<{ x: number; y: number }> {
  const spacing = 25 * scale;
  const pattern = CARD_PATTERNS[value] || [[0, 0]];

  return pattern.map(([x, y]) => ({
    x: x * spacing,
    y: y * spacing,
  }));
}
