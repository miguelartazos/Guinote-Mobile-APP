import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { GameTable } from '../components/game/GameTable';
import type { SpanishCardData } from '../components/game/SpanishCard';
import type { JugarStackScreenProps } from '../types/navigation';

// Mock game data
const createMockPlayer = (name: string, ranking: number, avatar: string) => ({
  name,
  ranking,
  avatar,
  cards: [
    { suit: 'espadas' as const, value: 1 as const },
    { suit: 'bastos' as const, value: 10 as const },
    { suit: 'oros' as const, value: 7 as const },
    { suit: 'copas' as const, value: 12 as const },
    { suit: 'espadas' as const, value: 5 as const },
    { suit: 'oros' as const, value: 6 as const },
  ],
});

export function GameScreen({
  navigation,
  route,
}: JugarStackScreenProps<'Game'>) {
  const { playerName } = route.params;

  const [players] = useState([
    createMockPlayer(playerName || 'Tú', 1325, '👤'),
    createMockPlayer('Jorge A.', 6780, '🧔'),
    createMockPlayer('Juancelotti', 255, '👨'),
    createMockPlayer('Miguel A..N.', 16163, '👴'),
  ]);

  const [currentPlayerIndex] = useState(0);
  const [trumpCard] = useState<SpanishCardData>({ suit: 'copas', value: 6 });

  const handleCardPlay = (cardIndex: number) => {
    console.log(`Playing card at index ${cardIndex}`);
  };

  const handleCantar = () => {
    console.log('Cantar pressed');
  };

  const handleCambiar7 = () => {
    console.log('Cambiar 7 pressed');
  };

  const handleSalir = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <GameTable
        players={players as [any, any, any, any]}
        currentPlayerIndex={currentPlayerIndex}
        trumpCard={trumpCard}
        onCardPlay={handleCardPlay}
        onCantar={handleCantar}
        onCambiar7={handleCambiar7}
        onSalir={handleSalir}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
