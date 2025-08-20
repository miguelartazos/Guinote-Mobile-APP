import React from 'react';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import type { SpanishSuit, CardValue } from '../../types/cardTypes';

type CardGraphicsProps = {
  suit: SpanishSuit;
  value: CardValue;
  width: number;
  height: number;
};

function getCardKey(suit: SpanishSuit, value: CardValue): string {
  return `${suit}_${value}`;
}

// Import all card SVGs
import Oros1 from '../../../assets/images/cards/oros_1.svg';
import Oros2 from '../../../assets/images/cards/oros_2.svg';
import Oros3 from '../../../assets/images/cards/oros_3.svg';
import Oros4 from '../../../assets/images/cards/oros_4.svg';
import Oros5 from '../../../assets/images/cards/oros_5.svg';
import Oros6 from '../../../assets/images/cards/oros_6.svg';
import Oros7 from '../../../assets/images/cards/oros_7.svg';
import Oros10 from '../../../assets/images/cards/oros_10.svg';
import Oros11 from '../../../assets/images/cards/oros_11.svg';
import Oros12 from '../../../assets/images/cards/oros_12.svg';

import Copas1 from '../../../assets/images/cards/copas_1.svg';
import Copas2 from '../../../assets/images/cards/copas_2.svg';
import Copas3 from '../../../assets/images/cards/copas_3.svg';
import Copas4 from '../../../assets/images/cards/copas_4.svg';
import Copas5 from '../../../assets/images/cards/copas_5.svg';
import Copas6 from '../../../assets/images/cards/copas_6.svg';
import Copas7 from '../../../assets/images/cards/copas_7.svg';
import Copas10 from '../../../assets/images/cards/copas_10.svg';
import Copas11 from '../../../assets/images/cards/copas_11.svg';
import Copas12 from '../../../assets/images/cards/copas_12.svg';

import Espadas1 from '../../../assets/images/cards/espadas_1.svg';
import Espadas2 from '../../../assets/images/cards/espadas_2.svg';
import Espadas3 from '../../../assets/images/cards/espadas_3.svg';
import Espadas4 from '../../../assets/images/cards/espadas_4.svg';
import Espadas5 from '../../../assets/images/cards/espadas_5.svg';
import Espadas6 from '../../../assets/images/cards/espadas_6.svg';
import Espadas7 from '../../../assets/images/cards/espadas_7.svg';
import Espadas10 from '../../../assets/images/cards/espadas_10.svg';
import Espadas11 from '../../../assets/images/cards/espadas_11.svg';
import Espadas12 from '../../../assets/images/cards/espadas_12.svg';

import Bastos1 from '../../../assets/images/cards/bastos_1.svg';
import Bastos2 from '../../../assets/images/cards/bastos_2.svg';
import Bastos3 from '../../../assets/images/cards/bastos_3.svg';
import Bastos4 from '../../../assets/images/cards/bastos_4.svg';
import Bastos5 from '../../../assets/images/cards/bastos_5.svg';
import Bastos6 from '../../../assets/images/cards/bastos_6.svg';
import Bastos7 from '../../../assets/images/cards/bastos_7.svg';
import Bastos10 from '../../../assets/images/cards/bastos_10.svg';
import Bastos11 from '../../../assets/images/cards/bastos_11.svg';
import Bastos12 from '../../../assets/images/cards/bastos_12.svg';

// Map of card components
const CARD_COMPONENTS: Record<string, React.FC<{ width: number; height: number }>> = {
  oros_1: Oros1,
  oros_2: Oros2,
  oros_3: Oros3,
  oros_4: Oros4,
  oros_5: Oros5,
  oros_6: Oros6,
  oros_7: Oros7,
  oros_10: Oros10,
  oros_11: Oros11,
  oros_12: Oros12,
  copas_1: Copas1,
  copas_2: Copas2,
  copas_3: Copas3,
  copas_4: Copas4,
  copas_5: Copas5,
  copas_6: Copas6,
  copas_7: Copas7,
  copas_10: Copas10,
  copas_11: Copas11,
  copas_12: Copas12,
  espadas_1: Espadas1,
  espadas_2: Espadas2,
  espadas_3: Espadas3,
  espadas_4: Espadas4,
  espadas_5: Espadas5,
  espadas_6: Espadas6,
  espadas_7: Espadas7,
  espadas_10: Espadas10,
  espadas_11: Espadas11,
  espadas_12: Espadas12,
  bastos_1: Bastos1,
  bastos_2: Bastos2,
  bastos_3: Bastos3,
  bastos_4: Bastos4,
  bastos_5: Bastos5,
  bastos_6: Bastos6,
  bastos_7: Bastos7,
  bastos_10: Bastos10,
  bastos_11: Bastos11,
  bastos_12: Bastos12,
};

const CardFallback = React.memo(function CardFallback({
  suit,
  value,
  width,
  height,
}: CardGraphicsProps) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill="#f0f0f0"
        stroke="#999"
        strokeWidth="2"
        rx={4}
      />
      <SvgText
        x={width / 2}
        y={height / 2}
        fontSize={16}
        fontWeight="bold"
        fill="#666"
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        {suit[0].toUpperCase()}
        {value}
      </SvgText>
    </Svg>
  );
});

export const CardGraphics = React.memo(function CardGraphics({
  suit,
  value,
  width,
  height,
}: CardGraphicsProps) {
  const cardKey = getCardKey(suit, value);
  const CardComponent = CARD_COMPONENTS[cardKey];

  if (!CardComponent) {
    console.warn(`Card component not found for: ${cardKey}`);
    return <CardFallback suit={suit} value={value} width={width} height={height} />;
  }

  return <CardComponent width={width} height={height} />;
});
