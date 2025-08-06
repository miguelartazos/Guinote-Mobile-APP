import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// GuiñotePro-style layout constants
export const LAYOUT = {
  players: {
    bottom: {
      x: SCREEN_WIDTH * 0.5,
      y: SCREEN_HEIGHT * 0.85,
      handWidth: SCREEN_WIDTH * 0.7,
      cardOverlap: 0.6,
      cardRotation: 10,
    },
    top: {
      x: SCREEN_WIDTH * 0.5,
      y: SCREEN_HEIGHT * 0.08,
      stackDirection: 'horizontal' as const,
      cardOffset: { x: 20, y: 0 },
    },
    left: {
      x: SCREEN_WIDTH * 0.08,
      y: SCREEN_HEIGHT * 0.5,
      stackDirection: 'vertical' as const,
      cardOffset: { x: 0, y: 15 },
    },
    right: {
      x: SCREEN_WIDTH * 0.92,
      y: SCREEN_HEIGHT * 0.5,
      stackDirection: 'vertical' as const,
      cardOffset: { x: 0, y: 15 },
    },
  },
  centerArea: {
    x: SCREEN_WIDTH * 0.5,
    y: SCREEN_HEIGHT * 0.5,
    radius: SCREEN_WIDTH * 0.25,
    cardSpread: 30,
  },
  deck: {
    x: SCREEN_WIDTH * 0.85,
    y: SCREEN_HEIGHT * 0.5,
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
      {/* Bottom Player (You) */}
      <View style={[styles.playerZone, styles.bottomPlayer]} />

      {/* Top Player (Partner) */}
      <View style={[styles.playerZone, styles.topPlayer]} />

      {/* Left Player (Opponent) */}
      <View style={[styles.playerZone, styles.leftPlayer]} />

      {/* Right Player (Opponent) */}
      <View style={[styles.playerZone, styles.rightPlayer]} />

      {/* Center Play Area */}
      <View style={styles.centerPlayArea} />

      {/* Deck Position */}
      <View style={styles.deckPosition} />

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
    height: SCREEN_HEIGHT * 0.2,
    alignItems: 'center',
  },
  topPlayer: {
    top: 0,
    left: SCREEN_WIDTH * 0.3,
    right: SCREEN_WIDTH * 0.3,
    height: SCREEN_HEIGHT * 0.15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftPlayer: {
    left: 0,
    top: SCREEN_HEIGHT * 0.35,
    bottom: SCREEN_HEIGHT * 0.35,
    width: SCREEN_WIDTH * 0.15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightPlayer: {
    right: 0,
    top: SCREEN_HEIGHT * 0.35,
    bottom: SCREEN_HEIGHT * 0.35,
    width: SCREEN_WIDTH * 0.15,
    alignItems: 'center',
    justifyContent: 'center',
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
    left: LAYOUT.deck.x - 35,
    top: LAYOUT.deck.y - 50,
    width: 70,
    height: 100,
  },
});

export default PlayerPositions;
