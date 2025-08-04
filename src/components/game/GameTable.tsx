import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { SpanishCard, type SpanishCardData } from './SpanishCard';
import { DraggableCard } from './DraggableCard';
import { MinimalPlayerPanel } from './MinimalPlayerPanel';
import { DeckPile } from './DeckPile';
import { TrickCollectionAnimation } from './TrickCollectionAnimation';
import { CardCountBadge } from './CardCountBadge';
import { CollapsibleGameMenu } from './CollapsibleGameMenu';
import { colors, TABLE_COLORS } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';
import { getCardDimensions } from '../../utils/responsive';
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
  collectedTricks?: Map<
    string,
    Array<Array<{ playerId: string; card: SpanishCardData }>>
  >;
  onCardPlay: (cardIndex: number) => void;
  onCardReorder?: (
    playerId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;
  onExitGame?: () => void;
  onRenuncio?: () => void;
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

export function GameTable({
  players,
  currentPlayerIndex,
  trumpCard,
  currentTrick = [],
  collectedTricks = new Map(),
  onCardPlay,
  onCardReorder,
  onExitGame,
  onRenuncio,
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

  return (
    <View
      style={[
        styles.table,
        { backgroundColor: getTableColor(tableColor) },
        landscape && styles.landscapeTable,
      ]}
    >
      {/* Player Panels */}
      <MinimalPlayerPanel
        playerName={topPlayer.name}
        position="top"
        isCurrentPlayer={currentPlayerIndex === 2}
        teamId="team1"
        isThinking={thinkingPlayerId === 'bot2'}
      />
      <MinimalPlayerPanel
        playerName={leftPlayer.name}
        position="left"
        isCurrentPlayer={currentPlayerIndex === 1}
        teamId="team2"
        isThinking={thinkingPlayerId === 'bot1'}
      />
      <MinimalPlayerPanel
        playerName={rightPlayer.name}
        position="right"
        isCurrentPlayer={currentPlayerIndex === 3}
        teamId="team2"
        isThinking={thinkingPlayerId === 'bot3'}
      />
      <MinimalPlayerPanel
        playerName={bottomPlayer.name}
        position="bottom"
        isCurrentPlayer={currentPlayerIndex === 0}
        teamId="team1"
        isThinking={thinkingPlayerId === 'player'}
      />

      {/* Top Player Cards (Teammate) with Icon */}
      {!isDealing && (
        <View
          style={[
            styles.topPlayerCardsContainer,
            landscape && styles.topPlayerCardsLandscape,
          ]}
        >
          <View style={styles.topPlayerCards}>
            {topPlayer.cards.map((_, index) => {
              const cardDimensions = getCardDimensions();
              const overlap = 0.6;
              const cardWidth = cardDimensions.small.width;
              const visibleWidth = cardWidth * (1 - overlap);

              return (
                <SpanishCard
                  key={`top-${index}`}
                  faceDown
                  size="small"
                  style={[styles.topCard, { left: index * visibleWidth }]}
                />
              );
            })}
            <CardCountBadge count={topPlayer.cards.length} position="top" />
          </View>
        </View>
      )}

      {/* Left Player Cards */}
      {!isDealing && (
        <View
          style={[
            styles.leftPlayerCards,
            landscape && styles.leftPlayerCardsLandscape,
          ]}
        >
          {leftPlayer.cards.map((_, index) => {
            const verticalSpacing = 35;

            return (
              <SpanishCard
                key={`left-${index}`}
                faceDown
                size="small"
                style={[
                  styles.leftCard,
                  {
                    top: index * verticalSpacing,
                    zIndex: 5 + index,
                    transform: [{ rotate: '90deg' }],
                  },
                ]}
              />
            );
          })}
          <CardCountBadge count={leftPlayer.cards.length} position="left" />
        </View>
      )}

      {/* Right Player Cards */}
      {!isDealing && (
        <View
          style={[
            styles.rightPlayerCards,
            landscape && styles.rightPlayerCardsLandscape,
          ]}
        >
          {rightPlayer.cards.map((_, index) => {
            const verticalSpacing = 35;

            return (
              <SpanishCard
                key={`right-${index}`}
                faceDown
                size="small"
                style={[
                  styles.rightCard,
                  {
                    top: index * verticalSpacing,
                    zIndex: 5 + index,
                    transform: [{ rotate: '-90deg' }],
                  },
                ]}
              />
            );
          })}
          <CardCountBadge count={rightPlayer.cards.length} position="right" />
        </View>
      )}

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
      {deckCount > 0 && trumpCard && !isDealing && (
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

      {/* Trick Piles in Corners */}
      {/* Bottom Player Trick Pile */}
      {(collectedTricks.get(bottomPlayer.id)?.length || 0) > 0 && (
        <View style={[styles.trickPile, styles.bottomTrickPile]}>
          <SpanishCard faceDown size="small" />
          <Text style={styles.trickPileCount}>
            {collectedTricks.get(bottomPlayer.id)?.length || 0}
          </Text>
        </View>
      )}

      {/* Left Player Trick Pile */}
      {(collectedTricks.get(leftPlayer.id)?.length || 0) > 0 && (
        <View style={[styles.trickPile, styles.leftTrickPile]}>
          <SpanishCard faceDown size="small" />
          <Text style={styles.trickPileCount}>
            {collectedTricks.get(leftPlayer.id)?.length || 0}
          </Text>
        </View>
      )}

      {/* Top Player Trick Pile */}
      {(collectedTricks.get(topPlayer.id)?.length || 0) > 0 && (
        <View style={[styles.trickPile, styles.topTrickPile]}>
          <SpanishCard faceDown size="small" />
          <Text style={styles.trickPileCount}>
            {collectedTricks.get(topPlayer.id)?.length || 0}
          </Text>
        </View>
      )}

      {/* Right Player Trick Pile */}
      {(collectedTricks.get(rightPlayer.id)?.length || 0) > 0 && (
        <View style={[styles.trickPile, styles.rightTrickPile]}>
          <SpanishCard faceDown size="small" />
          <Text style={styles.trickPileCount}>
            {collectedTricks.get(rightPlayer.id)?.length || 0}
          </Text>
        </View>
      )}

      {/* Bottom Player Hand */}
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
          const cardCount = bottomPlayer.cards.length;
          const screenWidth = Dimensions.get('window').width;

          // Simple horizontal layout with less overlap for better visibility
          const overlap = 0.45; // 45% overlap
          const cardWidth = cardDimensions.hand.width;
          const visibleWidth = cardWidth * (1 - overlap);
          const totalWidth = cardWidth + (cardCount - 1) * visibleWidth;

          // Center the hand horizontally
          const startX = (screenWidth - totalWidth) / 2;
          const cardX = startX + index * visibleWidth;

          return (
            <DraggableCard
              key={`hand-${index}`}
              card={card}
              index={index}
              onCardPlay={onCardPlay}
              onReorder={
                onCardReorder
                  ? (fromIndex, toIndex) =>
                      onCardReorder(bottomPlayer.id, fromIndex, toIndex)
                  : undefined
              }
              dropZoneBounds={dropZoneBounds || undefined}
              isEnabled={
                !isDealing && !!dropZoneBounds && isPlayerTurn && isValidCard
              }
              cardSize="medium"
              totalCards={bottomPlayer.cards.length}
              cardWidth={cardWidth}
              style={[
                styles.handCardContainer,
                {
                  left: cardX,
                  bottom: -10,
                  zIndex: 20 + index,
                  opacity: isDealing ? 0 : 1,
                },
                styles.handCard,
                landscape && styles.handCardLandscape,
                !isValidCard && isPlayerTurn && styles.invalidCard,
              ]}
            />
          );
        })}
      </View>

      {/* Collapsible Game Menu */}
      <CollapsibleGameMenu
        onExitGame={onExitGame || (() => {})}
        onRenuncio={onRenuncio || (() => {})}
        onSettings={() => {
          // TODO: Implement settings
        }}
        onRankings={() => {
          // TODO: Implement rankings
        }}
        onEmojis={() => {
          // TODO: Implement emojis
        }}
        onHelp={() => {
          // TODO: Implement help
        }}
      />
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
    top: -5,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  topPlayerCardsLandscape: {
    top: 80,
    left: 20,
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
    left: 10,
    top: '50%',
    transform: [{ translateY: -87.5 }],
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
    right: 10,
    top: '50%',
    transform: [{ translateY: -87.5 }],
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
    top: '50%',
    left: '25%',
    transform: [{ translateY: -70 }, { translateX: -70 }],
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
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    zIndex: 20,
    height: 120, // Fixed height for card area
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
    bottom: 60,
    // Centered positioning maintained from base style
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
  trickPile: {
    position: 'absolute',
    width: 70,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTrickPile: {
    bottom: 20,
    right: 20,
  },
  leftTrickPile: {
    left: 20,
    bottom: 20,
  },
  topTrickPile: {
    top: 20,
    left: 20,
  },
  rightTrickPile: {
    right: 20,
    top: 20,
  },
  trickPileCount: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
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
