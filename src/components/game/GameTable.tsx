import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { SpanishCard, type SpanishCardData } from './SpanishCard';
import { DraggableCard } from './DraggableCard';
import { PlayerPanel } from './PlayerPanel';
import { DeckPile } from './DeckPile';
import { VoiceButton } from './VoiceButton';
import { VoiceBubble } from './VoiceBubble';
import { VoiceQueueIndicator } from './VoiceQueueIndicator';
import { TrickCollectionAnimation } from './TrickCollectionAnimation';
import { TopLeftActions } from './TopLeftActions';
import { CardCountBadge } from './CardCountBadge';
import { colors, TABLE_COLORS } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';
import type { VoiceRecordingId } from '../../utils/voiceStorage';
import { useVoiceQueue } from '../../hooks/useVoiceQueue';
import {
  scaleWidth,
  getCardDimensions,
  getCardOverlap,
} from '../../utils/responsive';
import { useOrientation } from '../../hooks/useOrientation';

type Player = {
  id: string;
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
  onCantar?: () => void;
  onCambiar7?: () => void;
  onSalir?: () => void;
  thinkingPlayerId?: string | null;
  tableColor?: 'green' | 'blue' | 'red' | 'wood';
  isDealing?: boolean;
  deckCount?: number;
  validCardIndices?: number[]; // Indices of valid cards for current player
  isVueltas?: boolean;
  canDeclareVictory?: boolean;
  trickAnimating?: boolean;
  pendingTrickWinner?: {
    playerId: string;
    points: number;
    cards: SpanishCardData[];
  };
  onCompleteTrickAnimation?: () => void;
};

type VoiceMessage = {
  recordingId: VoiceRecordingId;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  position: 'top' | 'left' | 'right' | 'bottom';
};

export function GameTable({
  players,
  currentPlayerIndex,
  trumpCard,
  currentTrick = [],
  onCardPlay,
  onCantar: _onCantar,
  onCambiar7: _onCambiar7,
  onSalir: _onSalir,
  thinkingPlayerId,
  tableColor = 'green',
  isDealing = false,
  deckCount = 0,
  validCardIndices,
  isVueltas = false,
  canDeclareVictory = false,
  trickAnimating = false,
  pendingTrickWinner,
  onCompleteTrickAnimation,
}: GameTableProps) {
  const [bottomPlayer, leftPlayer, topPlayer, rightPlayer] = players;
  const orientation = useOrientation();
  const landscape = orientation === 'landscape';
  const playAreaRef = useRef<View>(null);
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  const [dropZoneBounds, setDropZoneBounds] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Create mapping of player IDs to their positions
  const playerIdToPosition = {
    [bottomPlayer.id]: 0, // bottom
    [leftPlayer.id]: 1, // left
    [topPlayer.id]: 2, // top
    [rightPlayer.id]: 3, // right
  };

  const {
    queue,
    isPaused,
    addToQueue,
    pauseQueue,
    resumeQueue,
    clearQueue,
    skipCurrent,
  } = useVoiceQueue();

  const handleVoiceRecording = (recordingId: VoiceRecordingId) => {
    // Add to queue instead of direct display
    addToQueue({
      recordingId,
      playerId: 'player',
      playerName: bottomPlayer.name,
      playerAvatar: bottomPlayer.avatar,
      position: 'bottom',
      isCurrentPlayer: currentPlayerIndex === 0,
      isTeammate: false, // In Guiñote, bottom and top are teammates
    });

    // Also add to display
    const newMessage: VoiceMessage = {
      recordingId,
      playerId: 'player',
      playerName: bottomPlayer.name,
      playerAvatar: bottomPlayer.avatar,
      position: 'bottom',
    };
    setVoiceMessages(prev => [...prev, newMessage]);
  };

  const handleVoiceExpire = (recordingId: VoiceRecordingId) => {
    setVoiceMessages(prev =>
      prev.filter(msg => msg.recordingId !== recordingId),
    );
  };

  return (
    <View
      style={[
        styles.table,
        { backgroundColor: getTableColor(tableColor) },
        landscape && styles.landscapeTable,
      ]}
    >
      {/* Player Panels */}
      <PlayerPanel
        playerName={topPlayer.name}
        ranking={topPlayer.ranking}
        position="top"
        avatar={topPlayer.avatar}
        isCurrentPlayer={currentPlayerIndex === 2}
        teamId="team1"
        isThinking={thinkingPlayerId === 'bot2'}
        showRanking={isVueltas}
      />
      <PlayerPanel
        playerName={leftPlayer.name}
        ranking={leftPlayer.ranking}
        position="left"
        avatar={leftPlayer.avatar}
        isCurrentPlayer={currentPlayerIndex === 1}
        teamId="team2"
        isThinking={thinkingPlayerId === 'bot1'}
        showRanking={isVueltas}
      />
      <PlayerPanel
        playerName={rightPlayer.name}
        ranking={rightPlayer.ranking}
        position="right"
        avatar={rightPlayer.avatar}
        isCurrentPlayer={currentPlayerIndex === 3}
        teamId="team2"
        isThinking={thinkingPlayerId === 'bot3'}
        showRanking={isVueltas}
      />
      <PlayerPanel
        playerName={bottomPlayer.name}
        ranking={bottomPlayer.ranking}
        position="bottom"
        avatar={bottomPlayer.avatar}
        isCurrentPlayer={currentPlayerIndex === 0}
        teamId="team1"
        isThinking={thinkingPlayerId === 'player'}
        showRanking={isVueltas}
      />

      {/* Top Player Cards (Teammate) with Icon */}
      <View
        style={[
          styles.topPlayerCardsContainer,
          landscape && styles.topPlayerCardsLandscape,
        ]}
      >
        <View style={styles.topPlayerIcon}>
          <Text style={styles.topPlayerIconText}>🤝</Text>
        </View>
        <View style={styles.topPlayerCards}>
          {topPlayer.cards.map((_, index) => (
            <SpanishCard
              key={`top-${index}`}
              faceDown
              size="small"
              style={[styles.topCard, { left: index * 15 }]}
            />
          ))}
          <CardCountBadge count={topPlayer.cards.length} position="top" />
        </View>
      </View>

      {/* Left Player Cards */}
      <View
        style={[
          styles.leftPlayerCards,
          landscape && styles.leftPlayerCardsLandscape,
        ]}
      >
        {leftPlayer.cards.map((_, index) => (
          <SpanishCard
            key={`left-${index}`}
            faceDown
            size="small"
            style={[
              styles.leftCard,
              {
                top: index * 15,
                zIndex: 5 + index,
                transform: [{ rotate: '90deg' }],
              },
            ]}
          />
        ))}
        <CardCountBadge count={leftPlayer.cards.length} position="left" />
      </View>

      {/* Right Player Cards */}
      <View
        style={[
          styles.rightPlayerCards,
          landscape && styles.rightPlayerCardsLandscape,
        ]}
      >
        {rightPlayer.cards.map((_, index) => (
          <SpanishCard
            key={`right-${index}`}
            faceDown
            size="small"
            style={[
              styles.rightCard,
              {
                top: index * 15,
                zIndex: 5 + index,
                transform: [{ rotate: '-90deg' }],
              },
            ]}
          />
        ))}
        <CardCountBadge count={rightPlayer.cards.length} position="right" />
      </View>

      {/* Central Game Area */}
      <View style={styles.centralArea}>
        {/* Playing Area - Show current trick cards */}
        <View
          ref={playAreaRef}
          style={styles.playingArea}
          onLayout={() => {
            // Add delay to ensure proper measurement
            setTimeout(() => {
              playAreaRef.current?.measureInWindow((x, y, width, height) => {
                setDropZoneBounds({ x, y, width, height });
              });
            }, 100);
          }}
        >
          {currentTrick.length > 0 && (
            <View style={styles.trickCards}>
              {currentTrick.map((play, index) => {
                const position = playerIdToPosition[play.playerId] ?? 0;
                return (
                  <SpanishCard
                    key={`trick-${index}`}
                    card={play.card}
                    size="medium"
                    style={[styles.trickCard, getTrickCardPosition(position)]}
                  />
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* Trick Collection Animation */}
      {trickAnimating && pendingTrickWinner && (
        <TrickCollectionAnimation
          cards={pendingTrickWinner.cards}
          winnerPosition={getPlayerPosition(
            playerIdToPosition[pendingTrickWinner.playerId] ?? 0,
          )}
          points={pendingTrickWinner.points}
          onComplete={() => {
            onCompleteTrickAnimation?.();
          }}
          playSound={() => {
            // Add sound effect here if needed
          }}
        />
      )}

      {/* Deck and Trump Display */}
      {deckCount > 0 && trumpCard && (
        <View style={styles.deckPileContainer}>
          <DeckPile
            cardsRemaining={deckCount}
            trumpCard={trumpCard}
            showTrump={true}
          />
        </View>
      )}

      {/* Vueltas Indicator */}
      {isVueltas && (
        <View style={styles.vueltasIndicator}>
          <Text style={styles.vueltasText}>VUELTAS</Text>
          {canDeclareVictory && currentPlayerIndex === 0 && (
            <Text style={styles.declareText}>Puedes declarar victoria</Text>
          )}
        </View>
      )}

      {/* Bottom Player Hand */}
      {!isDealing && (
        <View
          style={[
            styles.bottomPlayerHand,
            landscape && styles.bottomPlayerHandLandscape,
          ]}
        >
          {bottomPlayer.cards.map((card, index) => {
            const isValidCard =
              !validCardIndices || validCardIndices.includes(index);
            const isPlayerTurn = currentPlayerIndex === 0;
            const cardDimensions = getCardDimensions();
            const overlap = getCardOverlap();
            const cardOffset =
              index * (cardDimensions.medium.width * (1 - overlap));

            return (
              <DraggableCard
                key={`hand-${index}`}
                card={card}
                index={index}
                onCardPlay={onCardPlay}
                dropZoneBounds={dropZoneBounds || undefined}
                isEnabled={
                  !isDealing && !!dropZoneBounds && isPlayerTurn && isValidCard
                }
                cardSize="medium"
                style={[
                  styles.handCardContainer,
                  { left: cardOffset, zIndex: 20 + index },
                  styles.handCard,
                  landscape && styles.handCardLandscape,
                  !isValidCard && isPlayerTurn && styles.invalidCard,
                ]}
              />
            );
          })}
          <CardCountBadge count={bottomPlayer.cards.length} position="bottom" />
        </View>
      )}

      {/* Voice Messages */}
      {voiceMessages.map(msg => (
        <VoiceBubble
          key={msg.recordingId}
          recordingId={msg.recordingId}
          playerName={msg.playerName}
          playerAvatar={msg.playerAvatar}
          position={msg.position}
          onExpire={() => handleVoiceExpire(msg.recordingId)}
        />
      ))}

      {/* Voice Queue Indicator */}
      <VoiceQueueIndicator
        queue={queue}
        isPaused={isPaused}
        onPauseToggle={() => (isPaused ? resumeQueue() : pauseQueue())}
        onClear={clearQueue}
        onSkip={skipCurrent}
      />

      {/* Top Left Actions */}
      <TopLeftActions
        onMenuPress={() => {
          // TODO: Implement menu functionality
        }}
        onEmojiPress={() => {
          // TODO: Implement emoji functionality
        }}
        onRankingPress={() => {
          // TODO: Implement ranking functionality
        }}
        onSettingsPress={() => {
          // TODO: Implement settings functionality
        }}
      />

      {/* Voice Button - Right Side */}
      <View style={styles.rightSideActions}>
        <VoiceButton
          playerId="player"
          onRecordingComplete={handleVoiceRecording}
          disabled={currentPlayerIndex !== 0}
        />
      </View>
    </View>
  );
}

const getTableColor = (color: 'green' | 'blue' | 'red' | 'wood') => {
  return TABLE_COLORS[color] || TABLE_COLORS.green;
};

const styles = StyleSheet.create({
  table: {
    flex: 1,
    backgroundColor: colors.tableGreen,
    position: 'relative',
    // Table depth effect
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 100,
    // Subtle gradient overlay would be applied via image background
  },
  centralArea: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -200 }, { translateY: -150 }],
    width: 400,
    height: 300,
    backgroundColor: 'transparent',
  },
  topPlayerCardsContainer: {
    position: 'absolute',
    top: 80,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 5,
  },
  topPlayerCardsLandscape: {
    top: 80,
    left: 20,
  },
  topPlayerIcon: {
    width: 30,
    height: 30,
    backgroundColor: colors.accent,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  topPlayerIconText: {
    fontSize: typography.fontSize.md,
  },
  topPlayerCards: {
    flexDirection: 'row',
    position: 'relative',
  },
  topCard: {
    position: 'absolute',
  },
  leftPlayerCards: {
    position: 'absolute',
    left: 20,
    bottom: 200,
    flexDirection: 'column',
    zIndex: 5,
  },
  leftPlayerCardsLandscape: {
    bottom: 200,
    left: 20,
  },
  leftCard: {
    position: 'absolute',
  },
  rightPlayerCards: {
    position: 'absolute',
    right: 20,
    top: 80,
    flexDirection: 'column',
    zIndex: 5,
  },
  rightPlayerCardsLandscape: {
    top: 80,
    right: 20,
  },
  rightCard: {
    position: 'absolute',
  },
  deckPileContainer: {
    position: 'absolute',
    top: '45%',
    right: scaleWidth(50),
    transform: [{ translateY: -70 }],
    zIndex: 15,
  },
  trumpCard: {
    marginRight: 10,
  },
  playingArea: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: dimensions.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.gold,
    minHeight: 280,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
  },
  playingAreaText: {
    color: colors.gold,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    fontStyle: 'italic',
    opacity: 0.6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bottomPlayerHand: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    flexDirection: 'row',
    zIndex: 20,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  handCardContainer: {
    position: 'absolute',
  },
  handCard: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    // Cards will lift on hover/drag via DraggableCard component
  },
  rightSideActions: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 30,
  },
  helpButton: {
    backgroundColor: colors.accent,
  },
  buttonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.sm,
    paddingHorizontal: dimensions.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  helpButtonIcon: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  trickCards: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  trickCard: {
    position: 'absolute',
  },
  landscapeTable: {
    // Apply radial gradient effect for depth
    backgroundColor: colors.tableGreen,
  },
  bottomPlayerHandLandscape: {
    bottom: 100,
    right: 20,
  },
  handCardLandscape: {
    // Cards in landscape have controlled overlap via getCardOverlap()
  },
  actionBarLandscape: {
    bottom: 10,
    right: 20,
    left: 'auto',
    flexDirection: 'row',
    gap: 10,
  },
  invalidCard: {
    opacity: 0.5,
    // Grayed out cards that can't be played
  },
  vueltasIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  vueltasText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  declareText: {
    color: colors.white,
    fontSize: 12,
    marginTop: 4,
  },
});

// Helper function to position trick cards based on player position
function getTrickCardPosition(position: number): ViewStyle {
  const positions: ViewStyle[] = [
    // Bottom player - card closer to bottom edge
    {
      bottom: 60,
      left: '50%',
      transform: [{ translateX: -35 }],
    },
    // Left player - card closer to left edge
    {
      left: 60,
      top: '50%',
      transform: [{ translateY: -45 }],
    },
    // Top player - card closer to top edge
    {
      top: 60,
      left: '50%',
      transform: [{ translateX: -35 }],
    },
    // Right player - card closer to right edge
    {
      right: 60,
      top: '50%',
      transform: [{ translateY: -45 }],
    },
  ];
  return positions[position] || positions[0];
}

// Helper function to get player position for animation
function getPlayerPosition(position: number): { x: number; y: number } {
  // These are approximate positions for the animation target
  // You may need to adjust based on your layout
  const positions = [
    { x: 200, y: 400 }, // Bottom player
    { x: 50, y: 200 }, // Left player
    { x: 200, y: 50 }, // Top player
    { x: 350, y: 200 }, // Right player
  ];
  return positions[position] || positions[0];
}
