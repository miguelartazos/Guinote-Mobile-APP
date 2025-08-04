import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { CardDealingAnimation } from './CardDealingAnimation';
import type { SpanishCardData } from './SpanishCard';

describe('CardDealingAnimation', () => {
  const mockTrumpCard: SpanishCardData = {
    suit: 'oros',
    value: 3,
  };

  const mockPlayerCards: SpanishCardData[] = [
    { suit: 'oros', value: 1 },
    { suit: 'copas', value: 12 },
    { suit: 'espadas', value: 3 },
    { suit: 'bastos', value: 7 },
    { suit: 'oros', value: 10 },
    { suit: 'copas', value: 5 },
  ];

  const mockSounds = {
    playDealSound: jest.fn(),
    playTrumpRevealSound: jest.fn(),
    playShuffleSound: jest.fn(),
  };

  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls shuffle sound on mount', () => {
    render(
      <CardDealingAnimation
        trumpCard={mockTrumpCard}
        playerCards={mockPlayerCards}
        onComplete={mockOnComplete}
        playDealSound={mockSounds.playDealSound}
        playTrumpRevealSound={mockSounds.playTrumpRevealSound}
        playShuffleSound={mockSounds.playShuffleSound}
        firstPlayerIndex={0}
      />,
    );

    expect(mockSounds.playShuffleSound).toHaveBeenCalledTimes(1);
  });

  test('calls onComplete after animation sequence', async () => {
    render(
      <CardDealingAnimation
        trumpCard={mockTrumpCard}
        playerCards={mockPlayerCards}
        onComplete={mockOnComplete}
        playDealSound={mockSounds.playDealSound}
        playTrumpRevealSound={mockSounds.playTrumpRevealSound}
        playShuffleSound={mockSounds.playShuffleSound}
        firstPlayerIndex={0}
      />,
    );

    await waitFor(
      () => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      },
      { timeout: 6000 },
    );
  });

  test('plays deal sound multiple times during dealing', async () => {
    render(
      <CardDealingAnimation
        trumpCard={mockTrumpCard}
        playerCards={mockPlayerCards}
        onComplete={mockOnComplete}
        playDealSound={mockSounds.playDealSound}
        playTrumpRevealSound={mockSounds.playTrumpRevealSound}
        playShuffleSound={mockSounds.playShuffleSound}
        firstPlayerIndex={0}
      />,
    );

    await waitFor(
      () => {
        expect(mockSounds.playDealSound).toHaveBeenCalledTimes(8); // 2 rounds x 4 players
      },
      { timeout: 4000 },
    );
  });

  test('shows game start message for first player', async () => {
    const { getByText } = render(
      <CardDealingAnimation
        trumpCard={mockTrumpCard}
        playerCards={mockPlayerCards}
        onComplete={mockOnComplete}
        playDealSound={mockSounds.playDealSound}
        playTrumpRevealSound={mockSounds.playTrumpRevealSound}
        playShuffleSound={mockSounds.playShuffleSound}
        firstPlayerIndex={0}
      />,
    );

    await waitFor(
      () => {
        expect(getByText('¡Comienza el juego!')).toBeTruthy();
        expect(getByText('Tu turno')).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });

  test('does not show turn indicator when AI starts', async () => {
    const { getByText, queryByText } = render(
      <CardDealingAnimation
        trumpCard={mockTrumpCard}
        playerCards={mockPlayerCards}
        onComplete={mockOnComplete}
        playDealSound={mockSounds.playDealSound}
        playTrumpRevealSound={mockSounds.playTrumpRevealSound}
        playShuffleSound={mockSounds.playShuffleSound}
        firstPlayerIndex={1}
      />,
    );

    await waitFor(
      () => {
        expect(getByText('¡Comienza el juego!')).toBeTruthy();
        expect(queryByText('Tu turno')).toBeNull();
      },
      { timeout: 5000 },
    );
  });
});
