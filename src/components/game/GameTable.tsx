import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SpanishCard, type SpanishCardData } from './SpanishCard';
import { DraggableCard } from './DraggableCard';
import { MinimalPlayerPanel } from './MinimalPlayerPanel';
import { DeckPile } from './DeckPile';
import { TrickCollectionAnimation } from './TrickCollectionAnimation';
// import { CardCountBadge } from './CardCountBadge';
import { CollapsibleGameMenu } from './CollapsibleGameMenu';
import { colors, TABLE_COLORS } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';
import { getCardDimensions } from '../../utils/responsive';
import { useOrientation } from '../../hooks/useOrientation';
import { useTableLayout } from '../../hooks/useTableLayout';
import { getPlayerCardPosition, getDeckPosition, type LayoutInfo } from '../../utils/cardPositions';
import { getTrickCardPositionWithinBoard } from '../../utils/trickCardPositions';

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
  collectedTricks?: Map<string, Array<Array<{ playerId: string; card: SpanishCardData }>>>;
  onCardPlay: (cardIndex: number) => void;
  onCardReorder?: (playerId: string, fromIndex: number, toIndex: number) => void;
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

  // Use table layout hook for responsive positioning
  const { layout, onTableLayout, onBoardLayout } = useTableLayout();
  const layoutInfo: LayoutInfo = {
    parentLayout: layout.table,
    boardLayout: layout.board,
  };

  // Create mapping of player IDs to their positions
  const playerIdToPosition = {
    [bottomPlayer.id]: 0, // bottom
    [leftPlayer.id]: 1, // left
    [topPlayer.id]: 2, // top
    [rightPlayer.id]: 3, // right
  } as const;

  return (
    <View
      style={[
        styles.table,
        { backgroundColor: getTableColor(tableColor) },
        landscape && styles.landscapeTable,
      ]}
      onLayout={onTableLayout}
    >
      {/* Player Panels */}
      <MinimalPlayerPanel
        playerName={topPlayer.name}
        position="top"
        isCurrentPlayer={currentPlayerIndex === playerIdToPosition[topPlayer.id]}
        teamId="team1"
        isThinking={thinkingPlayerId === topPlayer.id}
      />
      <MinimalPlayerPanel
        playerName={leftPlayer.name}
        position="left"
        isCurrentPlayer={currentPlayerIndex === playerIdToPosition[leftPlayer.id]}
        teamId="team2"
        isThinking={thinkingPlayerId === leftPlayer.id}
      />
      <MinimalPlayerPanel
        playerName={rightPlayer.name}
        position="right"
        isCurrentPlayer={currentPlayerIndex === playerIdToPosition[rightPlayer.id]}
        teamId="team2"
        isThinking={thinkingPlayerId === rightPlayer.id}
      />
      <MinimalPlayerPanel
        playerName={bottomPlayer.name}
        position="bottom"
        isCurrentPlayer={currentPlayerIndex === playerIdToPosition[bottomPlayer.id]}
        teamId="team1"
        isThinking={thinkingPlayerId === bottomPlayer.id}
      />

      {/* Top Player Cards (Teammate) */}
      {!isDealing && layout.isReady && (
        <View style={styles.topPlayerCardsContainer}>
          {topPlayer.cards.map((_, index) => {
            const position = getPlayerCardPosition(
              2,
              index,
              topPlayer.cards.length,
              'small',
              layoutInfo,
            );

            return (
              <SpanishCard
                key={`top-${index}`}
                faceDown
                size="small"
                style={[
                  styles.opponentCard,
                  {
                    left: position.x,
                    top: position.y,
                    zIndex: position.zIndex,
                    transform: [{ rotate: `${position.rotation}deg` }],
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      {/* Left Player Cards */}
      {!isDealing && layout.isReady && (
        <View style={styles.leftPlayerCards}>
          {leftPlayer.cards.map((_, index) => {
            const pos = getPlayerCardPosition(
              3,
              index,
              leftPlayer.cards.length,
              'small',
              layoutInfo,
            );
            const dims = getCardDimensions().small;
            const rotatedWidth = dims.height; // 90deg rotated
            const containerWidth = 120; // matches leftPlayerCards width
            const x = Math.max(0, (containerWidth - rotatedWidth) / 2);

            return (
              <SpanishCard
                key={`left-${index}`}
                faceDown
                size="small"
                style={[
                  styles.opponentCard,
                  {
                    left: x,
                    top: pos.y,
                    zIndex: pos.zIndex,
                    transform: [{ rotate: `${pos.rotation}deg` }],
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      {/* Right Player Cards */}
      {!isDealing && layout.isReady && (
        <View style={styles.rightPlayerCards}>
          {rightPlayer.cards.map((_, index) => {
            const pos = getPlayerCardPosition(
              1,
              index,
              rightPlayer.cards.length,
              'small',
              layoutInfo,
            );
            const dims = getCardDimensions().small;
            const rotatedWidth = dims.height; // -90deg rotated
            const containerWidth = 120; // matches rightPlayerCards width
            const x = Math.max(0, (containerWidth - rotatedWidth) / 2);

            return (
              <SpanishCard
                key={`right-${index}`}
                faceDown
                size="small"
                style={[
                  styles.opponentCard,
                  {
                    left: x,
                    top: pos.y,
                    zIndex: pos.zIndex,
                    transform: [{ rotate: `${pos.rotation}deg` }],
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      {/* Central Game Area - Responsive Board */}
      <View style={styles.centralArea}>
        {/* Playing Area - Show current trick cards */}
        <View
          ref={playAreaRef}
          style={styles.playingArea}
          onLayout={event => {
            onBoardLayout(event);
            // Also measure for drop zone
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
                    style={[
                      styles.trickCard,
                      getTrickCardPositionWithinBoard(position, layout.board),
                    ]}
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
          winnerPosition={getPlayerPosition(playerIdToPosition[pendingTrickWinner.playerId] ?? 0)}
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
      {deckCount > 0 && trumpCard && !isDealing && layout.isReady && (
        <View
          style={[
            styles.deckPileContainer,
            {
              left: getDeckPosition(layout.table.width, layout.table.height, layoutInfo).x,
              top: getDeckPosition(layout.table.width, layout.table.height, layoutInfo).y,
            },
          ]}
        >
          <DeckPile cardsRemaining={deckCount} trumpCard={trumpCard} showTrump={true} />
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

      {/* Team Trick Piles (two stacks) */}
      {(() => {
        const getCount = (id: string) => collectedTricks.get(id)?.length || 0;
        const team1Count = getCount(bottomPlayer.id) + getCount(topPlayer.id);
        const team2Count = getCount(leftPlayer.id) + getCount(rightPlayer.id);

        return (
          <>
            {team1Count > 0 && (
              <View style={[styles.trickPile, styles.bottomTrickPile]}>
                <SpanishCard faceDown size="small" />
              </View>
            )}
            {team2Count > 0 && (
              <View style={[styles.trickPile, styles.topTrickPile]}>
                <SpanishCard faceDown size="small" />
              </View>
            )}
          </>
        );
      })()}

      {/* Bottom Player Hand - Only render when not dealing */}
      {!isDealing && layout.isReady && (
        <View style={[styles.bottomPlayerHand, landscape && styles.bottomPlayerHandLandscape]}>
          {bottomPlayer.cards.map((card, index) => {
            const isValidCard = !validCardIndices || validCardIndices.includes(index);
            const isPlayerTurn = currentPlayerIndex === 0;
            const position = getPlayerCardPosition(
              0,
              index,
              bottomPlayer.cards.length,
              'large',
              layoutInfo,
            );
            const cardDimensions = getCardDimensions();
            const scaledCardWidth = cardDimensions.medium.width;

            return (
              <DraggableCard
                key={`hand-${index}`}
                card={card}
                index={index}
                onCardPlay={onCardPlay}
                onReorder={
                  onCardReorder
                    ? (fromIndex, toIndex) => onCardReorder(bottomPlayer.id, fromIndex, toIndex)
                    : undefined
                }
                dropZoneBounds={dropZoneBounds || undefined}
                isEnabled={!isDealing && !!dropZoneBounds && isPlayerTurn && isValidCard}
                cardSize="medium" // match dealing size for consistency
                totalCards={bottomPlayer.cards.length}
                cardWidth={scaledCardWidth}
                style={[
                  styles.handCardContainer,
                  {
                    left: position.x,
                    top: position.y,
                    zIndex: position.zIndex,
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
      )}

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
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'stretch',
    backgroundColor: 'transparent',
  },
  topPlayerCardsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    pointerEvents: 'none',
    alignItems: 'center',
    zIndex: 10,
  },
  topPlayerCardsLandscape: {
    // Removed positioning adjustments
  },
  topPlayerCards: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topCard: {
    position: 'absolute',
  },
  opponentCard: {
    position: 'absolute',
  },
  leftPlayerCards: {
    position: 'absolute',
    left: 8,
    top: 0,
    bottom: 0,
    width: 120,
    pointerEvents: 'none',
    justifyContent: 'center',
    zIndex: 10,
  },
  leftPlayerCardsLandscape: {
    // Removed positioning adjustments
  },
  leftCard: {
    position: 'absolute',
  },
  rightPlayerCards: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    width: 120,
    pointerEvents: 'none',
    justifyContent: 'center',
    zIndex: 10,
  },
  rightPlayerCardsLandscape: {
    // Removed positioning adjustments
  },
  rightCard: {
    position: 'absolute',
  },
  deckPileContainer: {
    position: 'absolute',
    zIndex: 15,
  },
  trumpCard: {
    marginRight: 10,
  },
  playingArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: dimensions.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.gold,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
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
    bottom: 10,
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
  // Use bottom-left for Team 1 (bottom+top) and top-right for Team 2 (left+right)
  bottomTrickPile: {
    bottom: 12,
    left: 12,
  },
  topTrickPile: {
    top: 12,
    right: 12,
  },
  // removed trickPileCount styles (no counters)
});

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
