import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SpanishCard, type SpanishCardData } from './SpanishCard';
import { PlayerPanel } from './PlayerPanel';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';
import {
  scaleWidth,
  scaleHeight,
  getResponsiveValue,
} from '../../utils/responsive';

type Player = {
  name: string;
  ranking: number;
  cards: SpanishCardData[];
  avatar: string;
};

type GameTableProps = {
  players: [Player, Player, Player, Player]; // [bottom, left, top, right]
  currentPlayerIndex: number;
  trumpCard?: SpanishCardData;
  onCardPlay: (cardIndex: number) => void;
  onCantar: () => void;
  onCambiar7: () => void;
  onSalir: () => void;
};

export function GameTable({
  players,
  currentPlayerIndex,
  trumpCard,
  onCardPlay,
  onCantar,
  onCambiar7,
  onSalir,
}: GameTableProps) {
  const [bottomPlayer, leftPlayer, topPlayer, rightPlayer] = players;

  return (
    <View style={styles.table}>
      {/* Top Toolbar - Smaller and more compact */}
      <View style={styles.topToolbar}>
        <TouchableOpacity style={styles.toolbarButton}>
          <Text style={styles.toolbarIcon}>⚙️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton}>
          <Text style={styles.toolbarIcon}>📊</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton}>
          <Text style={styles.toolbarIcon}>📢</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton}>
          <Text style={styles.toolbarIcon}>💖</Text>
        </TouchableOpacity>
      </View>

      {/* Player Panels */}
      <PlayerPanel
        playerName={topPlayer.name}
        ranking={topPlayer.ranking}
        position="top"
        avatar={topPlayer.avatar}
        isCurrentPlayer={currentPlayerIndex === 2}
      />
      <PlayerPanel
        playerName={leftPlayer.name}
        ranking={leftPlayer.ranking}
        position="left"
        avatar={leftPlayer.avatar}
        isCurrentPlayer={currentPlayerIndex === 1}
      />
      <PlayerPanel
        playerName={rightPlayer.name}
        ranking={rightPlayer.ranking}
        position="right"
        avatar={rightPlayer.avatar}
        isCurrentPlayer={currentPlayerIndex === 3}
      />
      <PlayerPanel
        playerName={bottomPlayer.name}
        ranking={bottomPlayer.ranking}
        position="bottom"
        avatar={bottomPlayer.avatar}
        isCurrentPlayer={currentPlayerIndex === 0}
      />

      {/* Top Player Cards */}
      <View style={styles.topPlayerCards}>
        {Array.from({ length: 6 }).map((_, index) => (
          <SpanishCard
            key={`top-${index}`}
            faceDown
            size="small"
            style={[styles.topCard, { left: index * 15 }]}
          />
        ))}
      </View>

      {/* Left Player Cards */}
      <View style={styles.leftPlayerCards}>
        {Array.from({ length: 6 }).map((_, index) => (
          <SpanishCard
            key={`left-${index}`}
            faceDown
            size="small"
            style={[styles.leftCard, { top: index * 15 }]}
          />
        ))}
      </View>

      {/* Right Player Cards */}
      <View style={styles.rightPlayerCards}>
        {Array.from({ length: 6 }).map((_, index) => (
          <SpanishCard
            key={`right-${index}`}
            faceDown
            size="small"
            style={[styles.rightCard, { top: index * 15 }]}
          />
        ))}
      </View>

      {/* Central Game Area */}
      <View style={styles.centralArea}>
        {/* Trump Card and Deck */}
        <View style={styles.trumpArea}>
          {trumpCard && (
            <SpanishCard
              card={trumpCard}
              size="medium"
              style={styles.trumpCard}
            />
          )}
          <View style={styles.deckPile}>
            {Array.from({ length: 3 }).map((_, index) => (
              <SpanishCard
                key={`deck-${index}`}
                faceDown
                size="medium"
                style={[styles.deckCard, { top: index * 2, left: index * 2 }]}
              />
            ))}
          </View>
        </View>

        {/* Playing Area - Show current trick cards */}
        <View style={styles.playingArea}>
          {/* This would show cards played in current trick */}
          <Text style={styles.playingAreaText}>Mesa</Text>
        </View>
      </View>

      {/* Bottom Player Hand */}
      <View style={styles.bottomPlayerHand}>
        {bottomPlayer.cards.map((card, index) => (
          <TouchableOpacity
            key={`hand-${index}`}
            onPress={() => onCardPlay(index)}
            style={styles.handCardContainer}
          >
            <SpanishCard card={card} size="large" style={styles.handCard} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Action Buttons - Redesigned */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cantarButton]}
          onPress={onCantar}
        >
          <View style={styles.buttonInner}>
            <Text style={styles.actionButtonText}>Cantar</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.cambiarButton]}
          onPress={onCambiar7}
        >
          <View style={styles.buttonInner}>
            <Text style={styles.actionButtonText}>Cambiar 7</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.exitButton]}
          onPress={onSalir}
        >
          <View style={styles.buttonInner}>
            <Text style={[styles.actionButtonText, styles.exitButtonText]}>
              Salir
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    flex: 1,
    backgroundColor: colors.primary,
    position: 'relative',
  },
  topToolbar: {
    position: 'absolute',
    top: 5,
    left: 5,
    flexDirection: 'row',
    zIndex: 100,
  },
  toolbarButton: {
    width: 32,
    height: 32,
    backgroundColor: colors.accent,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    opacity: 0.9,
  },
  toolbarIcon: {
    fontSize: typography.fontSize.md,
  },
  topPlayerCards: {
    position: 'absolute',
    top: scaleHeight(50),
    left: '50%',
    transform: [{ translateX: scaleWidth(-40) }],
    flexDirection: 'row',
    zIndex: 10,
  },
  topCard: {
    position: 'absolute',
  },
  leftPlayerCards: {
    position: 'absolute',
    left: scaleWidth(10),
    top: '50%',
    transform: [{ translateY: scaleHeight(-45) }],
    zIndex: 10,
  },
  leftCard: {
    position: 'absolute',
    transform: [{ rotate: '90deg' }],
  },
  rightPlayerCards: {
    position: 'absolute',
    right: scaleWidth(10),
    top: '50%',
    transform: [{ translateY: scaleHeight(-45) }],
    zIndex: 10,
  },
  rightCard: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  centralArea: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -80 }, { translateY: -60 }],
    width: 160,
    height: 120,
  },
  trumpArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  trumpCard: {
    marginRight: 10,
  },
  deckPile: {
    position: 'relative',
    width: 60,
    height: 90,
  },
  deckCard: {
    position: 'absolute',
  },
  playingArea: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  playingAreaText: {
    color: colors.text,
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
  },
  bottomPlayerHand: {
    position: 'absolute',
    bottom: getResponsiveValue(110, 130, 100),
    left: '50%',
    transform: [{ translateX: scaleWidth(-195) }],
    flexDirection: 'row',
    zIndex: 20,
  },
  handCardContainer: {
    marginRight: 4,
  },
  handCard: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  actionBar: {
    position: 'absolute',
    bottom: getResponsiveValue(10, 15, 8),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: scaleWidth(20),
    zIndex: 30,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    minHeight: dimensions.touchTarget.large,
    borderRadius: dimensions.borderRadius.xl,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cantarButton: {
    backgroundColor: '#C4915C',
  },
  cambiarButton: {
    backgroundColor: '#C4915C',
  },
  exitButton: {
    backgroundColor: '#DC2626',
  },
  buttonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  exitButtonText: {
    color: colors.white,
  },
});
