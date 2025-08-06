import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import GameBoard from './GameBoard';
import PlayerPositions, { LAYOUT } from './PlayerPositions';
import PlayerHand from './PlayerHand';
import OpponentHand from './OpponentHand';
import ActionButtons from './ActionButtons';
import CenterPlayArea from './CenterPlayArea';
import { DeckPile } from './DeckPile';
import { DealingAnimator } from '../../animations/DealingAnimator';
import { PlayAnimator } from '../../animations/PlayAnimator';
import { Card as CardType } from '../../types/game';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GuinotePROGameTableProps {
  playerHand: CardType[];
  partnerHand: CardType[];
  leftOpponentHand: CardType[];
  rightOpponentHand: CardType[];
  playedCards: Array<{ card: CardType; playerId: string }>;
  currentPlayer: number;
  isDealing: boolean;
  gamePhase: 'dealing' | 'playing' | 'trick-collection' | 'game-over';
  deckCount: number;
  trumpCard?: CardType;
  onCardPlay: (card: CardType, index: number) => void;
  canPlayCard: (card: CardType) => boolean;
  onCante?: () => void;
  onChange7?: () => void;
  onExit?: () => void;
  canCante?: boolean;
  canChange7?: boolean;
}

export const GuinotePROGameTable: React.FC<GuinotePROGameTableProps> = ({
  playerHand,
  partnerHand,
  leftOpponentHand,
  rightOpponentHand,
  playedCards,
  currentPlayer,
  isDealing,
  gamePhase,
  deckCount,
  trumpCard,
  onCardPlay,
  canPlayCard,
  onCante,
  onChange7,
  onExit,
  canCante = false,
  canChange7 = false,
}) => {
  const [dealingAnimator] = useState(() => new DealingAnimator());
  const [playAnimator] = useState(() => new PlayAnimator());
  const centerRef = useRef<View>(null);

  // Animation values for dealing
  const dealingCards = Array.from({ length: 24 }, () => ({
    x: useSharedValue(LAYOUT.deck.x),
    y: useSharedValue(LAYOUT.deck.y),
    rotation: useSharedValue(0),
    scale: useSharedValue(0),
    opacity: useSharedValue(0),
    zIndex: useSharedValue(0),
  }));

  // Deal cards animation
  useEffect(() => {
    if (isDealing && gamePhase === 'dealing') {
      // Sound removed: shuffle

      // Simulate dealing animation
      const positions: Array<'bottom' | 'left' | 'top' | 'right'> = [
        'bottom',
        'left',
        'top',
        'right',
      ];
      const dealerPos = 'bottom'; // Assuming bottom player deals

      setTimeout(() => {
        dealingAnimator.dealInitialHand(dealingCards, positions, dealerPos);

        // Sound removed: dealing sounds
      }, 500);
    }
  }, [isDealing, gamePhase]);

  const handleCardPlay = (card: CardType, index: number) => {
    if (!canPlayCard(card)) return;

    // Sound removed: play
    onCardPlay(card, index);
  };

  return (
    <GameBoard>
      <PlayerPositions>
        {/* Deck and Trump */}
        {deckCount > 0 && (
          <View style={styles.deckContainer}>
            <DeckPile
              cardsRemaining={deckCount}
              trumpCard={trumpCard}
              showTrump={!!trumpCard}
            />
          </View>
        )}

        {/* Player Hand (Bottom) */}
        <PlayerHand
          cards={playerHand}
          onCardPress={handleCardPlay}
          canPlay={canPlayCard}
          isCurrentPlayer={currentPlayer === 0}
        />

        {/* Partner Hand (Top) */}
        <OpponentHand
          position="top"
          cardCount={partnerHand.length}
          isPartner={true}
          isCurrentPlayer={currentPlayer === 2}
        />

        {/* Left Opponent */}
        <OpponentHand
          position="left"
          cardCount={leftOpponentHand.length}
          isCurrentPlayer={currentPlayer === 1}
        />

        {/* Right Opponent */}
        <OpponentHand
          position="right"
          cardCount={rightOpponentHand.length}
          isCurrentPlayer={currentPlayer === 3}
        />

        {/* Center Play Area */}
        <View ref={centerRef} style={styles.centerContainer}>
          <CenterPlayArea cards={playedCards} />
        </View>

        {/* Action Buttons */}
        <ActionButtons
          onCante={onCante || (() => {})}
          onChange7={onChange7 || (() => {})}
          onExit={onExit || (() => {})}
          canCante={canCante}
          canChange7={canChange7}
        />
      </PlayerPositions>
    </GameBoard>
  );
};

const styles = StyleSheet.create({
  deckContainer: {
    position: 'absolute',
    right: SCREEN_WIDTH * 0.15,
    top: '50%',
    transform: [{ translateY: -60 }],
    zIndex: 10,
  },
  centerContainer: {
    position: 'absolute',
    left: LAYOUT.centerArea.x - LAYOUT.centerArea.radius,
    top: LAYOUT.centerArea.y - LAYOUT.centerArea.radius,
    width: LAYOUT.centerArea.radius * 2,
    height: LAYOUT.centerArea.radius * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GuinotePROGameTable;
