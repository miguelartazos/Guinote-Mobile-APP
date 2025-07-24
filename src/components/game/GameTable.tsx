import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { SpanishCard, type SpanishCardData } from './SpanishCard';
import { DraggableCard } from './DraggableCard';
import { PlayerPanel } from './PlayerPanel';
import { TrumpIndicator } from './TrumpIndicator';
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
  currentTrick?: Array<{ playerId: string; card: SpanishCardData }>;
  onCardPlay: (cardIndex: number) => void;
  onCantar: () => void;
  onCambiar7: () => void;
  onSalir: () => void;
};

export function GameTable({
  players,
  currentPlayerIndex,
  trumpCard,
  currentTrick = [],
  onCardPlay,
  onCantar,
  onCambiar7,
  onSalir,
}: GameTableProps) {
  const [bottomPlayer, leftPlayer, topPlayer, rightPlayer] = players;
  const playAreaRef = useRef<View>(null);
  const [dropZoneBounds, setDropZoneBounds] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

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
        teamId="team1"
      />
      <PlayerPanel
        playerName={leftPlayer.name}
        ranking={leftPlayer.ranking}
        position="left"
        avatar={leftPlayer.avatar}
        isCurrentPlayer={currentPlayerIndex === 1}
        teamId="team2"
      />
      <PlayerPanel
        playerName={rightPlayer.name}
        ranking={rightPlayer.ranking}
        position="right"
        avatar={rightPlayer.avatar}
        isCurrentPlayer={currentPlayerIndex === 3}
        teamId="team2"
      />
      <PlayerPanel
        playerName={bottomPlayer.name}
        ranking={bottomPlayer.ranking}
        position="bottom"
        avatar={bottomPlayer.avatar}
        isCurrentPlayer={currentPlayerIndex === 0}
        teamId="team1"
      />

      {/* Top Player Cards */}
      <View style={styles.topPlayerCards}>
        {topPlayer.cards.map((_, index) => (
          <SpanishCard
            key={`top-${index}`}
            faceDown
            size="small"
            style={[styles.topCard, { left: index * 8 }]}
          />
        ))}
      </View>

      {/* Left Player Cards */}
      <View style={styles.leftPlayerCards}>
        {leftPlayer.cards.map((_, index) => (
          <SpanishCard
            key={`left-${index}`}
            faceDown
            size="small"
            style={[styles.leftCard, { left: index * 8 }]}
          />
        ))}
      </View>

      {/* Right Player Cards */}
      <View style={styles.rightPlayerCards}>
        {rightPlayer.cards.map((_, index) => (
          <SpanishCard
            key={`right-${index}`}
            faceDown
            size="small"
            style={[styles.rightCard, { left: index * 8 }]}
          />
        ))}
      </View>

      {/* Bottom Right Player Cards (near bottom panel) */}
      <View style={styles.bottomRightPlayerCards}>
        {Array.from({ length: Math.min(bottomPlayer.cards.length, 3) }).map(
          (_, index) => (
            <SpanishCard
              key={`bottom-right-${index}`}
              faceDown
              size="small"
              style={[styles.bottomRightCard, { left: index * 8 }]}
            />
          ),
        )}
      </View>

      {/* Central Game Area */}
      <View style={styles.centralArea}>
        {/* Trump Indicator and Deck */}
        <View style={styles.trumpArea}>
          {trumpCard && (
            <TrumpIndicator
              trumpCard={trumpCard}
              style={styles.trumpIndicator}
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
        <View
          ref={playAreaRef}
          style={styles.playingArea}
          onLayout={() => {
            playAreaRef.current?.measureInWindow((x, y, width, height) => {
              setDropZoneBounds({ x, y, width, height });
            });
          }}
        >
          {currentTrick.length === 0 ? (
            <Text style={styles.playingAreaText}>Mesa</Text>
          ) : (
            <View style={styles.trickCards}>
              {currentTrick.map((play, index) => (
                <SpanishCard
                  key={`trick-${index}`}
                  card={play.card}
                  size="medium"
                  style={[styles.trickCard, getTrickCardPosition(index)]}
                />
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Bottom Player Hand */}
      <View style={styles.bottomPlayerHand}>
        {bottomPlayer.cards.map((card, index) => {
          return (
            <DraggableCard
              key={`hand-${index}`}
              card={card}
              index={index}
              onCardPlay={onCardPlay}
              dropZoneBounds={dropZoneBounds || undefined}
              style={[
                styles.handCardContainer,
                {
                  marginLeft: index === 0 ? 0 : 5, // Small gap between cards
                  zIndex: index,
                },
                styles.handCard,
              ]}
            />
          );
        })}
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
    top: scaleHeight(130),
    left: scaleWidth(30),
    flexDirection: 'row',
    zIndex: 10,
  },
  topCard: {
    position: 'absolute',
  },
  leftPlayerCards: {
    position: 'absolute',
    left: scaleWidth(30),
    bottom: scaleHeight(270),
    flexDirection: 'row',
    zIndex: 10,
  },
  leftCard: {
    position: 'absolute',
  },
  rightPlayerCards: {
    position: 'absolute',
    right: scaleWidth(30),
    top: scaleHeight(130),
    flexDirection: 'row',
    zIndex: 10,
  },
  rightCard: {
    position: 'absolute',
  },
  bottomRightPlayerCards: {
    position: 'absolute',
    right: scaleWidth(30),
    bottom: scaleHeight(270),
    flexDirection: 'row',
    zIndex: 10,
  },
  bottomRightCard: {
    position: 'absolute',
  },
  centralArea: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -80 }],
    width: 200,
    height: 160,
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
    bottom: getResponsiveValue(80, 100, 70),
    left: '50%',
    transform: [{ translateX: scaleWidth(-250) }], // Center 6 cards
    flexDirection: 'row',
    zIndex: 20,
    height: 140,
    width: 500,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  handCardContainer: {
    position: 'relative', // Changed from absolute
  },
  handCard: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
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
    minHeight: dimensions.touchTarget.senior,
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
    paddingVertical: dimensions.spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  exitButtonText: {
    color: colors.white,
  },
  trumpIndicator: {
    marginRight: 20,
  },
  trickCards: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  trickCard: {
    position: 'absolute',
  },
});

// Helper function to position trick cards
function getTrickCardPosition(index: number): ViewStyle {
  const positions: ViewStyle[] = [
    { bottom: 5, left: '40%' }, // First player (bottom)
    { left: 5, top: '35%' }, // Second player (left)
    { top: 5, left: '40%' }, // Third player (top)
    { right: 5, top: '35%' }, // Fourth player (right)
  ];
  return positions[index] || {};
}
