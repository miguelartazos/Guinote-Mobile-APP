import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SpanishCard, type SpanishCardData } from './SpanishCard';
import type { Card, PlayerId as CorePlayerId } from '../../types/game.types';
import { DraggableCard } from './DraggableCard';
import { MinimalPlayerPanel } from './MinimalPlayerPanel';
import { DeckPile } from './DeckPile';
import { TrickCollectionAnimation } from './TrickCollectionAnimation';
import { PostTrickDealingAnimation } from './PostTrickDealingAnimation';
import { TeamTrickPile } from './TeamTrickPile';
// import { CardCountBadge } from './CardCountBadge';
import { CollapsibleGameMenu } from './CollapsibleGameMenu';
import { colors, TABLE_COLORS } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';
import { getCardDimensions } from '../../utils/responsive';
import { useOrientation } from '../../hooks/useOrientation';
import { useTableLayout } from '../../hooks/useTableLayout';
import {
  getPlayerCardPosition,
  getDeckPosition,
  type LayoutInfo,
  type Position,
} from '../../utils/cardPositions';
import { getTrickCardPositionWithinBoard } from '../../utils/trickCardPositions';
import type { PlayerId } from '../../types/game.types';
import { CardDealingAnimation } from './CardDealingAnimation';

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
  collectedTricks?: ReadonlyMap<string, Array<Array<{ playerId: string; card: SpanishCardData }>>>;
  teamTrickCounts?: { team1: number; team2: number };
  onCardPlay: (cardIndex: number) => void;
  onCardReorder?: (playerId: PlayerId, fromIndex: number, toIndex: number) => void;
  onExitGame?: () => void;
  onRenuncio?: () => void;
  thinkingPlayerId?: string | null;
  tableColor?: 'green' | 'blue' | 'red' | 'wood';
  isDealing?: boolean;
  deckCount?: number;
  gamePhase?: string;
  validCardIndices?: number[]; // Indices of valid cards for current player
  isVueltas?: boolean;
  canDeclareVictory?: boolean;
  trickAnimating?: boolean;
  pendingTrickWinner?: {
    playerId: string;
    points: number;
    cards: SpanishCardData[];
    isLastTrick?: boolean;
    bonus?: number;
  };
  onCompleteTrickAnimation?: () => void;
  // Post-trick dealing overlay
  postTrickDealingAnimating?: boolean;
  postTrickDealingPending?: boolean;
  pendingPostTrickDraws?: ReadonlyArray<{
    playerId: string | CorePlayerId;
    card: Card;
    source: 'deck' | 'trump';
  }>;
  onCompletePostTrickDealing?: () => void;
  onPostTrickCardLanded?: (draw: {
    playerId: string;
    card: SpanishCardData;
    source: 'deck' | 'trump';
  }) => void;
  // Hide cards during animations
  hideTrumpCard?: boolean;
  hideCardFromHand?: { playerId: string; suit: string; value: number };
  // Dealing overlay control
  onCompleteDealingAnimation?: () => void;
  playShuffleSound?: () => void;
  playDealSound?: () => void;
  playTrumpRevealSound?: () => void;
};

export function GameTable({
  players,
  currentPlayerIndex,
  trumpCard,
  currentTrick = [],
  collectedTricks = new Map(),
  teamTrickCounts = { team1: 0, team2: 0 },
  onCardPlay,
  onCardReorder,
  onExitGame,
  onRenuncio,
  thinkingPlayerId,
  tableColor = 'green',
  isDealing = false,
  deckCount = 0,
  gamePhase,
  validCardIndices,
  isVueltas = false,
  canDeclareVictory = false,
  trickAnimating = false,
  pendingTrickWinner,
  onCompleteTrickAnimation,
  postTrickDealingAnimating,
  postTrickDealingPending,
  pendingPostTrickDraws,
  onCompletePostTrickDealing,
  onPostTrickCardLanded,
  hideTrumpCard,
  hideCardFromHand,
  onCompleteDealingAnimation,
  playShuffleSound,
  playDealSound,
  playTrumpRevealSound,
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

  // Store deck position in a ref to prevent jumps
  const deckPositionRef = useRef<Position | null>(null);

  // Only update deck position when layout becomes ready or dimensions change significantly
  const deckPosition = useMemo(() => {
    if (!layout.isReady) return deckPositionRef.current;

    const currentLayoutInfo: LayoutInfo = {
      parentLayout: layout.table,
      boardLayout: layout.board,
    };

    const newPosition = getDeckPosition(layout.table.width, layout.table.height, currentLayoutInfo);

    // Only update if position changed significantly (more than 5 pixels)
    if (
      !deckPositionRef.current ||
      Math.abs(deckPositionRef.current.x - newPosition.x) > 5 ||
      Math.abs(deckPositionRef.current.y - newPosition.y) > 5
    ) {
      deckPositionRef.current = newPosition;
    }

    return deckPositionRef.current;
  }, [
    // Only recalculate on major dimension changes
    Math.floor(layout.table.width / 20) * 20,
    Math.floor(layout.table.height / 20) * 20,
    layout.isReady,
  ]);

  // Create mapping of player IDs to their positions
  // NOTE: This mapping is used for trick positions (0 bottom, 1 left, 2 top, 3 right)
  const playerIdToPosition = {
    [bottomPlayer.id]: 0, // bottom
    [leftPlayer.id]: 1, // left
    [topPlayer.id]: 2, // top
    [rightPlayer.id]: 3, // right
  } as const;

  // For hand card positions and dealing overlay, indices differ: (0 bottom, 1 right, 2 top, 3 left)
  const playerIdToHandPosition = {
    [bottomPlayer.id]: 0, // bottom
    [rightPlayer.id]: 1, // right
    [topPlayer.id]: 2, // top
    [leftPlayer.id]: 3, // left
  } as const;

  const isDealingBlocked =
    !!postTrickDealingAnimating || !!postTrickDealingPending || !!trickAnimating || !!isDealing;

  // Measure pile centers so trick animation can land exactly on stacks
  const [team1PileCenter, setTeam1PileCenter] = useState<{ x: number; y: number } | null>(null);
  const [team2PileCenter, setTeam2PileCenter] = useState<{ x: number; y: number } | null>(null);

  // Manage overlay fade-out after dealing completes to avoid deck blink
  const [shouldFadeOutOverlay, setShouldFadeOutOverlay] = useState(false);
  const [, forceUpdate] = useState(0);

  // Determine if deck should be visible - centralized logic to prevent bugs
  const shouldShowDeck = useMemo(() => {
    // Never show during certain phases
    if (
      gamePhase === 'arrastre' ||
      gamePhase === 'scoring' ||
      gamePhase === 'gameOver' ||
      gamePhase === 'finished'
    ) {
      return false;
    }
    // Never show during dealing animations
    if (isDealing || postTrickDealingAnimating) {
      return false;
    }
    // Never show during fadeout overlay
    if (shouldFadeOutOverlay) {
      return false;
    }
    // Only show if there are actually cards to draw
    if (deckCount <= 0) {
      return false;
    }
    // Don't show if layout isn't ready
    if (!layout.isReady || !deckPosition) {
      return false;
    }
    // Don't show if no trump card
    if (!trumpCard) {
      return false;
    }
    return true;
  }, [
    gamePhase,
    isDealing,
    deckCount,
    layout.isReady,
    deckPosition,
    trumpCard,
    postTrickDealingAnimating,
    shouldFadeOutOverlay,
  ]);

  return (
    <View
      style={[
        styles.table,
        { backgroundColor: getTableColor(tableColor) },
        landscape && styles.landscapeTable,
      ]}
      onLayout={onTableLayout}
    >
      {/* Card dealing animation overlay (shares same layout as table to avoid drift) */}
      {(isDealing || shouldFadeOutOverlay) && (
        <CardDealingAnimation
          trumpCard={trumpCard as any}
          playerCards={bottomPlayer.cards}
          onComplete={() => {
            // Trigger steady deck render immediately; overlay remains until fadeOut completes
            onCompleteDealingAnimation?.();
            // Wait a short moment to ensure DeckPile mounts, then crossfade overlay away
            const fadeTimer = setTimeout(() => setShouldFadeOutOverlay(true), 120);
            // Ensure we clean up if component unmounts
            return () => clearTimeout(fadeTimer);
          }}
          playDealSound={playDealSound || (() => {})}
          playTrumpRevealSound={playTrumpRevealSound || (() => {})}
          playShuffleSound={playShuffleSound || (() => {})}
          firstPlayerIndex={currentPlayerIndex}
          fadeOut={shouldFadeOutOverlay}
          onFadeOutComplete={() => {
            setShouldFadeOutOverlay(false);
            // Force a re-render to ensure deck shows properly after dealing
            forceUpdate(n => n + 1);
          }}
        />
      )}

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
          {currentTrick.length > 0 && !trickAnimating && (
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
          winnerPosition={(() => {
            // Determine team based on winner's player position
            const winnerPos = playerIdToPosition[pendingTrickWinner.playerId];
            const isTeam1 = winnerPos === 0 || winnerPos === 2; // Bottom or Top player
            const measured = isTeam1 ? team1PileCenter : team2PileCenter;
            if (measured) return measured;
            // Fallback to dynamic computation based on current table layout
            return computeTeamPileCenter(isTeam1 ? 'team1' : 'team2', layout.table);
          })()}
          startPositions={(currentTrick || []).map(play => {
            const posStyle = getTrickCardPositionWithinBoard(
              playerIdToPosition[play.playerId] ?? 0,
              layout.board,
            ) as any;
            const left = typeof posStyle.left === 'number' ? posStyle.left : 0;
            const top = typeof posStyle.top === 'number' ? posStyle.top : 0;
            const boardOffsetX = layout.board?.x || 0;
            const boardOffsetY = layout.board?.y || 0;
            return { x: boardOffsetX + left, y: boardOffsetY + top };
          })}
          winningCardIndex={Math.max(
            0,
            (currentTrick || []).findIndex(p => p.playerId === pendingTrickWinner.playerId),
          )}
          points={pendingTrickWinner.points}
          bonus={pendingTrickWinner.bonus}
          showLastTrickBonus={
            !!pendingTrickWinner.isLastTrick && (pendingTrickWinner.bonus || 0) > 0
          }
          onComplete={() => {
            onCompleteTrickAnimation?.();
            // Defensive: if there are pending draws and dealing hasn't started, request it
            if (postTrickDealingPending && !postTrickDealingAnimating) {
              // Parent hook will flip this flag in its rescue effect; no direct state here
              console.log('🔁 Requested post-trick dealing after animation');
            }
          }}
          playSound={() => {
            // Add sound effect here if needed
          }}
        />
      )}

      {/* Post-Trick Dealing Animation */}
      {postTrickDealingAnimating && layout.isReady && (
        <PostTrickDealingAnimation
          draws={(pendingPostTrickDraws as any) || []}
          playerPositions={playerIdToHandPosition as unknown as Record<string, 0 | 1 | 2 | 3>}
          currentHandSizes={{
            [bottomPlayer.id]: bottomPlayer.cards.length,
            [leftPlayer.id]: leftPlayer.cards.length,
            [topPlayer.id]: topPlayer.cards.length,
            [rightPlayer.id]: rightPlayer.cards.length,
          }}
          layoutInfo={{ parentLayout: layout.table, boardLayout: layout.board }}
          onComplete={() => onCompletePostTrickDealing?.()}
          onCardLanded={d => {
            const pos = playerIdToHandPosition[d.playerId] ?? 0;
            const target = [bottomPlayer, leftPlayer, topPlayer, rightPlayer].find(
              p => p.id === d.playerId,
            );
            console.log('📥 PostTrick card landed', {
              playerId: d.playerId,
              playerName: target?.name,
              position: pos,
              source: d.source,
              card: `${d.card.value} de ${d.card.suit}`,
            });
            onPostTrickCardLanded?.(d as any);
          }}
        />
      )}

      {/* Deck and Trump Display - controlled by shouldShowDeck */}
      {shouldShowDeck && deckPosition && (
        <View
          style={[
            styles.deckPileContainer,
            {
              left: deckPosition.x,
              top: deckPosition.y,
            },
          ]}
          pointerEvents="none"
        >
          <DeckPile
            cardsRemaining={deckCount}
            trumpCard={hideTrumpCard ? undefined : trumpCard}
            showTrump={!hideTrumpCard && !isDealing}
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

      {/* Team Trick Piles (two stacks) - Hidden during dealing phase */}
      {!isDealing && (
        <>
          <TeamTrickPile
            count={teamTrickCounts.team1}
            anchor="bottomLeft"
            onCenterLayout={setTeam1PileCenter}
          />
          <TeamTrickPile
            count={teamTrickCounts.team2}
            anchor="topRight"
            onCenterLayout={setTeam2PileCenter}
          />
        </>
      )}

      {/* Bottom Player Hand - Only render when not dealing */}
      {!isDealing && layout.isReady && (
        <View style={[styles.bottomPlayerHand, landscape && styles.bottomPlayerHandLandscape]}>
          {bottomPlayer.cards.map((card, index) => {
            // Hide card if it matches the hideCardFromHand criteria
            const shouldHide =
              hideCardFromHand &&
              hideCardFromHand.playerId === bottomPlayer.id &&
              card.suit === hideCardFromHand.suit &&
              card.value === hideCardFromHand.value;

            if (shouldHide) return null;
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
            const scaledCardWidth = cardDimensions.large.width;

            return (
              <DraggableCard
                key={`hand-${index}`}
                card={card}
                index={index}
                onCardPlay={onCardPlay}
                onReorder={
                  onCardReorder
                    ? (fromIndex, toIndex) =>
                        onCardReorder(bottomPlayer.id as unknown as PlayerId, fromIndex, toIndex)
                    : undefined
                }
                dropZoneBounds={dropZoneBounds || undefined}
                isEnabled={!isDealingBlocked && !!dropZoneBounds && isPlayerTurn && isValidCard}
                isPlayerTurn={isPlayerTurn}
                cardSize="large" // larger size for better visibility
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
    bottom: 0,
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
    height: 110,
    zIndex: 5,
    alignItems: 'center',
  },
  bottomLeftPile: {
    bottom: 15,
    left: 15,
  },
  topRightPile: {
    top: 15,
    right: 15,
  },
  pileStackContainer: {
    position: 'relative',
    width: 60,
    height: 85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  stackedPileCard: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  stackedPileCard1: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },
  stackedPileCard2: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
  pileCountText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

// Dynamic fallback using current table layout
function computeTeamPileCenter(
  teamId: 'team1' | 'team2',
  table?: { x: number; y: number; width: number; height: number },
): { x: number; y: number } {
  const card = getCardDimensions().small;
  const m = 15;
  const w = table?.width || 400;
  const h = table?.height || 250;
  if (teamId === 'team1') {
    return { x: m + card.width / 2 + 10, y: h - (m + card.height / 2) };
  }
  return { x: w - (m + card.width / 2), y: m + card.height / 2 };
}
