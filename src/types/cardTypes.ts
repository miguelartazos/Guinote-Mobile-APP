// Central type definitions for Spanish cards
export type SpanishSuit = 'espadas' | 'bastos' | 'oros' | 'copas';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;

export type SpanishCardData = {
  suit: SpanishSuit;
  value: CardValue;
};
