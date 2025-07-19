import React from 'react';
import Svg, { Rect, Pattern, G, Circle, Path } from 'react-native-svg';

type CardBackProps = {
  width: number;
  height: number;
};

export function CardBack({ width, height }: CardBackProps) {
  const scaleFactor = width / 60;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Define pattern */}
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
        <Circle
          cx={5 * scaleFactor}
          cy={5 * scaleFactor}
          r={3 * scaleFactor}
          fill="#A52A2A"
        />
      </Pattern>

      {/* Card background */}
      <Rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill="#8B0000"
        stroke="#D4A574"
        strokeWidth="2"
        rx={4 * scaleFactor}
      />

      {/* Inner border */}
      <Rect
        x={2 * scaleFactor}
        y={2 * scaleFactor}
        width={width - 4 * scaleFactor}
        height={height - 4 * scaleFactor}
        fill="url(#cardBackPattern)"
        stroke="#D4A574"
        strokeWidth="1"
        rx={3 * scaleFactor}
      />

      {/* Center logo */}
      <G transform={`translate(${width / 2}, ${height / 2})`}>
        <Rect
          x={-20 * scaleFactor}
          y={-15 * scaleFactor}
          width={40 * scaleFactor}
          height={30 * scaleFactor}
          fill="#8B0000"
          stroke="#D4A574"
          strokeWidth="1"
          rx={2 * scaleFactor}
        />
        <Path
          d={`M${-10 * scaleFactor},${-5 * scaleFactor} 
              Q${-10 * scaleFactor},${-10 * scaleFactor} ${-5 * scaleFactor},${
            -10 * scaleFactor
          }
              L${5 * scaleFactor},${-10 * scaleFactor}
              Q${10 * scaleFactor},${-10 * scaleFactor} ${10 * scaleFactor},${
            -5 * scaleFactor
          }
              L${10 * scaleFactor},${0}
              Q${10 * scaleFactor},${5 * scaleFactor} ${5 * scaleFactor},${
            5 * scaleFactor
          }
              Q${5 * scaleFactor},${10 * scaleFactor} ${0},${10 * scaleFactor}
              Q${-5 * scaleFactor},${10 * scaleFactor} ${-5 * scaleFactor},${
            5 * scaleFactor
          }
              Q${-10 * scaleFactor},${5 * scaleFactor} ${-10 * scaleFactor},${0}
              Z`}
          fill="#D4A574"
        />
        <Path
          d={`M${-3 * scaleFactor},${3 * scaleFactor}
              L${-3 * scaleFactor},${-3 * scaleFactor}
              L${3 * scaleFactor},${-3 * scaleFactor}
              M${0},${-3 * scaleFactor}
              L${0},${3 * scaleFactor}`}
          stroke="#8B0000"
          strokeWidth={2 * scaleFactor}
          strokeLinecap="round"
          fill="none"
        />
      </G>
    </Svg>
  );
}
