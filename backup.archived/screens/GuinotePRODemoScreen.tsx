import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { GuinotePROGameTable } from '../components/game/GuinotePROGameTable';
import { Card } from '../types/game';

// Sample cards for demo
const createDemoCards = (count: number): Card[] => {
  const suits: Array<Card['suit']> = ['oros', 'copas', 'espadas', 'bastos'];
  const cards: Card[] = [];
  
  for (let i = 0; i < count; i++) {
    cards.push({
      suit: suits[Math.floor(Math.random() * suits.length)],
      value: Math.floor(Math.random() * 10) + 1,
      points: 0,
    });
  }
  
  return cards;
};

export const GuinotePRODemoScreen: React.FC = () => {
  const [gameState, setGameState] = useState({
    playerHand: createDemoCards(6),
    partnerHand: createDemoCards(6),
    leftOpponentHand: createDemoCards(6),
    rightOpponentHand: createDemoCards(6),
    playedCards: [] as Array<{ card: Card; playerId: string }>,
    currentPlayer: 0,
    isDealing: true,
    gamePhase: 'dealing' as const,
    deckCount: 16,
    trumpCard: {
      suit: 'oros' as const,
      value: 4,
      points: 0,
    },
  });

  useEffect(() => {
    // Simulate dealing animation
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        isDealing: false,
        gamePhase: 'playing',
      }));
    }, 3000);
  }, []);

  const handleCardPlay = (card: Card, index: number) => {
    setGameState(prev => ({
      ...prev,
      playedCards: [...prev.playedCards, { card, playerId: 'player' }],
      playerHand: prev.playerHand.filter((_, i) => i !== index),
    }));
    
    // Simulate other players
    setTimeout(() => {
      simulateOtherPlayers();
    }, 1000);
  };

  const simulateOtherPlayers = () => {
    // Simulate left opponent play
    setGameState(prev => {
      if (prev.leftOpponentHand.length === 0) return prev;
      const card = prev.leftOpponentHand[0];
      return {
        ...prev,
        playedCards: [...prev.playedCards, { card, playerId: 'left' }],
        leftOpponentHand: prev.leftOpponentHand.slice(1),
        currentPlayer: 2,
      };
    });
    
    // Simulate partner play
    setTimeout(() => {
      setGameState(prev => {
        if (prev.partnerHand.length === 0) return prev;
        const card = prev.partnerHand[0];
        return {
          ...prev,
          playedCards: [...prev.playedCards, { card, playerId: 'top' }],
          partnerHand: prev.partnerHand.slice(1),
          currentPlayer: 3,
        };
      });
    }, 1000);
    
    // Simulate right opponent play
    setTimeout(() => {
      setGameState(prev => {
        if (prev.rightOpponentHand.length === 0) return prev;
        const card = prev.rightOpponentHand[0];
        return {
          ...prev,
          playedCards: [...prev.playedCards, { card, playerId: 'right' }],
          rightOpponentHand: prev.rightOpponentHand.slice(1),
          currentPlayer: 0,
        };
      });
      
      // Clear played cards after trick
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          playedCards: [],
        }));
      }, 2000);
    }, 2000);
  };

  const canPlayCard = (card: Card) => {
    return gameState.currentPlayer === 0 && !gameState.isDealing;
  };

  return (
    <SafeAreaView style={styles.container}>
      <GuinotePROGameTable
        playerHand={gameState.playerHand}
        partnerHand={gameState.partnerHand}
        leftOpponentHand={gameState.leftOpponentHand}
        rightOpponentHand={gameState.rightOpponentHand}
        playedCards={gameState.playedCards}
        currentPlayer={gameState.currentPlayer}
        isDealing={gameState.isDealing}
        gamePhase={gameState.gamePhase}
        deckCount={gameState.deckCount}
        trumpCard={gameState.trumpCard}
        onCardPlay={handleCardPlay}
        canPlayCard={canPlayCard}
        onCante={() => console.log('Cante!')}
        onChange7={() => console.log('Cambiar 7!')}
        onExit={() => console.log('Exit')}
        canCante={false}
        canChange7={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default GuinotePRODemoScreen;