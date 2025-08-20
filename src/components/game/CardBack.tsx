import React from 'react';
import CardBackSvg from '../../../assets/images/cards/card_back.svg';

type CardBackProps = {
  width: number;
  height: number;
};

export const CardBack = React.memo(function CardBack({ width, height }: CardBackProps) {
  return <CardBackSvg width={width} height={height} />;
});
