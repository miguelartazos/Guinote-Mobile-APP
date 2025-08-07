import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  getDeckPosition,
  getTrumpPosition,
  CARD_WIDTH,
  CARD_HEIGHT,
  BOTTOM_PLAYER_SCALE,
} from '../../utils/cardPositions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Get positions from our new utility
const deckPos = getDeckPosition(SCREEN_WIDTH, SCREEN_HEIGHT);
const trumpPos = getTrumpPosition(SCREEN_WIDTH, SCREEN_HEIGHT);

// GuiñotePro-style layout constants using our new positioning system
export const LAYOUT = {
  players: {
    bottom: {
      x: SCREEN_WIDTH * 0.5,
      y: SCREEN_HEIGHT - 120, // Match cardPositions.ts
      handWidth: CARD_WIDTH * BOTTOM_PLAYER_SCALE * 6, // 6 cards side by side
      cardScale: BOTTOM_PLAYER_SCALE,
      cardOverlap: 0, // No overlap for bottom player
    },
    top: {
      x: SCREEN_WIDTH * 0.5,
      y: 80, // Match cardPositions.ts
      cardOverlap: 0.9, // 90% visible, 10% overlap
      stackDirection: 'horizontal' as const,
    },
    left: {
      x: 80, // Match cardPositions.ts
      y: SCREEN_HEIGHT * 0.5,
      cardOverlap: 0.9, // 90% visible, 10% overlap
      stackDirection: 'vertical' as const,
      rotation: 90,
    },
    right: {
      x: SCREEN_WIDTH - 80, // Match cardPositions.ts
      y: SCREEN_HEIGHT * 0.5,
      cardOverlap: 0.9, // 90% visible, 10% overlap
      stackDirection: 'vertical' as const,
      rotation: -90,
    },
  },
  centerArea: {
    x: SCREEN_WIDTH * 0.5,
    y: SCREEN_HEIGHT * 0.5,
    radius: SCREEN_WIDTH * 0.25,
    cardSpread: 40, // Distance from center for each card
  },
  deck: {
    x: deckPos.x,
    y: deckPos.y,
    zIndex: deckPos.zIndex,
  },
  trump: {
    x: trumpPos.x,
    y: trumpPos.y,
    zIndex: trumpPos.zIndex,
  },
  trickPile: {
    x: SCREEN_WIDTH * 0.1, // Bottom-left corner
    y: SCREEN_HEIGHT * 0.9,
    zIndex: 5,
  },
  buttons: {
    y: SCREEN_HEIGHT * 0.92,
    spacing: SCREEN_WIDTH * 0.25,
    width: SCREEN_WIDTH * 0.2,
  },
};

interface PlayerPositionsProps {
  children: React.ReactNode;
}

export const PlayerPositions: React.FC<PlayerPositionsProps> = ({
  children,
}) => {
  return (
    <View style={styles.container}>
      {/* Bottom Player (You) - larger cards, no overlap */}
      <View style={[styles.playerZone, styles.bottomPlayer]} />

      {/* Top Player - 10% overlap */}
      <View style={[styles.playerZone, styles.topPlayer]} />

      {/* Left Player - vertical, 10% overlap */}
      <View style={[styles.playerZone, styles.leftPlayer]} />

      {/* Right Player - vertical, 10% overlap */}
      <View style={[styles.playerZone, styles.rightPlayer]} />

      {/* Center Play Area for tricks */}
      <View style={styles.centerPlayArea} />

      {/* Deck Position (middle-left, elevated) */}
      <View style={styles.deckPosition} />

      {/* Trump Position (below deck) */}
      <View style={styles.trumpPosition} />

      {/* Trick Collection Pile (bottom-left) */}
      <View style={styles.trickPilePosition} />

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  playerZone: {
    position: 'absolute',
  },
  bottomPlayer: {
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.25,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  topPlayer: {
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.15,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  leftPlayer: {
    left: 0,
    top: SCREEN_HEIGHT * 0.2,
    bottom: SCREEN_HEIGHT * 0.2,
    width: SCREEN_WIDTH * 0.2,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 20,
  },
  rightPlayer: {
    right: 0,
    top: SCREEN_HEIGHT * 0.2,
    bottom: SCREEN_HEIGHT * 0.2,
    width: SCREEN_WIDTH * 0.2,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 20,
  },
  centerPlayArea: {
    position: 'absolute',
    left: LAYOUT.centerArea.x - LAYOUT.centerArea.radius,
    top: LAYOUT.centerArea.y - LAYOUT.centerArea.radius,
    width: LAYOUT.centerArea.radius * 2,
    height: LAYOUT.centerArea.radius * 2,
    borderRadius: LAYOUT.centerArea.radius,
  },
  deckPosition: {
    position: 'absolute',
    left: LAYOUT.deck.x - CARD_WIDTH / 2,
    top: LAYOUT.deck.y - CARD_HEIGHT / 2,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    zIndex: LAYOUT.deck.zIndex,
  },
  trumpPosition: {
    position: 'absolute',
    left: LAYOUT.trump.x - CARD_WIDTH / 2,
    top: LAYOUT.trump.y - CARD_HEIGHT / 2,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    zIndex: LAYOUT.trump.zIndex,
  },
  trickPilePosition: {
    position: 'absolute',
    left: LAYOUT.trickPile.x - CARD_WIDTH / 2,
    top: LAYOUT.trickPile.y - CARD_HEIGHT / 2,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    zIndex: LAYOUT.trickPile.zIndex,
  },
});

export default PlayerPositions;
