import React from 'react';
import Svg, {
  Rect,
  Pattern,
  G,
  Circle,
  Path,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

type CardBackProps = {
  width: number;
  height: number;
};

export const CardBack = React.memo(function CardBack({
  width,
  height,
}: CardBackProps) {
  const scaleFactor = width / 60;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        {/* Gradient for depth */}
        <LinearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#8B0000" />
          <Stop offset="100%" stopColor="#CD5C5C" />
        </LinearGradient>

        {/* Define pattern with diagonal lines */}
        <Pattern
          id="cardBackPattern"
          x="0"
          y="0"
          width={10 * scaleFactor}
          height={10 * scaleFactor}
          patternUnits="userSpaceOnUse"
        >
          <Rect
            width={10 * scaleFactor}
            height={10 * scaleFactor}
            fill="#8B0000"
          />
          <Line
            x1={0}
            y1={0}
            x2={10 * scaleFactor}
            y2={10 * scaleFactor}
            stroke="#FFD700"
            strokeWidth={0.5 * scaleFactor}
            opacity={0.2}
          />
          <Circle
            cx={5 * scaleFactor}
            cy={5 * scaleFactor}
            r={2 * scaleFactor}
            fill="#A52A2A"
            opacity={0.5}
          />
        </Pattern>
      </Defs>

      {/* Card background with gradient */}
      <Rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill="url(#redGradient)"
        stroke="#FFD700"
        strokeWidth="2"
        rx={8}
      />

      {/* Inner border */}
      <Rect
        x={2 * scaleFactor}
        y={2 * scaleFactor}
        width={width - 4 * scaleFactor}
        height={height - 4 * scaleFactor}
        fill="url(#cardBackPattern)"
        stroke="#FFD700"
        strokeWidth="1"
        rx={6}
      />

      {/* Center crown logo - Spanish royal theme */}
      <G transform={`translate(${width / 2}, ${height / 2})`}>
        {/* Crown background circle */}
        <Circle
          cx={0}
          cy={0}
          r={20 * scaleFactor}
          fill="#8B0000"
          stroke="#FFD700"
          strokeWidth={2}
        />

        {/* Crown shape */}
        <Path
          d={`M${-12 * scaleFactor},${5 * scaleFactor}
              L${-12 * scaleFactor},${-5 * scaleFactor}
              L${-8 * scaleFactor},${-10 * scaleFactor}
              L${-4 * scaleFactor},${-5 * scaleFactor}
              L${0},${-12 * scaleFactor}
              L${4 * scaleFactor},${-5 * scaleFactor}
              L${8 * scaleFactor},${-10 * scaleFactor}
              L${12 * scaleFactor},${-5 * scaleFactor}
              L${12 * scaleFactor},${5 * scaleFactor}
              Z`}
          fill="#FFD700"
          stroke="#8B0000"
          strokeWidth={1}
        />

        {/* Crown jewels */}
        <Circle
          cx={0}
          cy={-8 * scaleFactor}
          r={2 * scaleFactor}
          fill="#8B0000"
        />
        <Circle
          cx={-6 * scaleFactor}
          cy={-2 * scaleFactor}
          r={1.5 * scaleFactor}
          fill="#8B0000"
        />
        <Circle
          cx={6 * scaleFactor}
          cy={-2 * scaleFactor}
          r={1.5 * scaleFactor}
          fill="#8B0000"
        />
      </G>

      {/* Corner decorations */}
      <G>
        {/* Top-left */}
        <Path
          d={`M${4},${12} L${4},${4} L${12},${4}`}
          stroke="#FFD700"
          strokeWidth={1.5}
          fill="none"
        />
        {/* Top-right */}
        <Path
          d={`M${width - 12},${4} L${width - 4},${4} L${width - 4},${12}`}
          stroke="#FFD700"
          strokeWidth={1.5}
          fill="none"
        />
        {/* Bottom-left */}
        <Path
          d={`M${4},${height - 12} L${4},${height - 4} L${12},${height - 4}`}
          stroke="#FFD700"
          strokeWidth={1.5}
          fill="none"
        />
        {/* Bottom-right */}
        <Path
          d={`M${width - 12},${height - 4} L${width - 4},${height - 4} L${
            width - 4
          },${height - 12}`}
          stroke="#FFD700"
          strokeWidth={1.5}
          fill="none"
        />
      </G>
    </Svg>
  );
});
