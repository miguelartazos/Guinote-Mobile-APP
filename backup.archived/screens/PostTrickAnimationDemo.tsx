import React, { useState } from 'react';
import { View, Button, StyleSheet, Dimensions } from 'react-native';
import { PostTrickDealAnimation } from '../components/game/PostTrickDealAnimation';
import type { PlayerId } from '../types/game.types';

export function PostTrickAnimationDemo() {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const startAnimation = () => {
    setIsAnimating(true);
  };
  
  const handleComplete = () => {
    setIsAnimating(false);
  };
  
  const { width, height } = Dimensions.get('window');
  
  const dealingCards = [
    { card: { suit: 'oros' as const, value: 1 as const }, playerId: 'player1' as PlayerId, index: 0 },
    { card: { suit: 'copas' as const, value: 12 as const }, playerId: 'player2' as PlayerId, index: 1 },
    { card: { suit: 'espadas' as const, value: 7 as const }, playerId: 'player3' as PlayerId, index: 2 },
    { card: { suit: 'bastos' as const, value: 3 as const }, playerId: 'player4' as PlayerId, index: 3 },
  ];
  
  const deckPosition = { x: width * 0.2, y: height * 0.5 };
  
  const playerPositions = {
    player1: { x: width * 0.5, y: height - 100, rotation: 0 }, // Bottom
    player2: { x: width * 0.5, y: 100, rotation: 0 }, // Top
    player3: { x: width - 100, y: height * 0.5, rotation: -90 }, // Right
    player4: { x: 100, y: height * 0.5, rotation: 90 }, // Left
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button 
          title="Start Animation" 
          onPress={startAnimation}
          disabled={isAnimating}
        />
      </View>
      
      {isAnimating && (
        <PostTrickDealAnimation
          dealingCards={dealingCards}
          onComplete={handleComplete}
          deckPosition={deckPosition}
          playerPositions={playerPositions as Record<PlayerId, { x: number; y: number; rotation: number }>}
        />
      )}
      
      {/* Visual markers for positions */}
      <View style={[styles.marker, { left: deckPosition.x - 25, top: deckPosition.y - 25 }]}>
        <View style={styles.deckMarker} />
      </View>
      
      {Object.entries(playerPositions).map(([id, pos]) => (
        <View key={id} style={[styles.marker, { left: pos.x - 15, top: pos.y - 15 }]}>
          <View style={styles.playerMarker} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2d5a2d',
  },
  buttonContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
  },
  marker: {
    position: 'absolute',
    zIndex: 1,
  },
  deckMarker: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 0, 0.3)',
    borderRadius: 25,
  },
  playerMarker: {
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
  },
});