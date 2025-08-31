import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SpanishCard, type SpanishCardData } from './SpanishCard';
import type { Card, PlayerId as CorePlayerId } from '../../types/game.types';
import { DraggableCard } from './DraggableCard';
import { MinimalPlayerPanel } from './MinimalPlayerPanel';
import { DeckPile } from './DeckPile';
import { TrickCollectionAnimation } from './TrickCollectionAnimation';
import { PostTrickDealingAnimation } from './PostTrickDealingAnimation';
import { CardPlayAnimation } from './CardPlayAnimation';
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
import { HAND_ANIMATION_DURATION, HAND_ANIMATION_STAGGER } from '../../constants/animations';

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
  // Card play animation
  cardPlayAnimation?: {
    playerId: string;
    card: SpanishCardData;
    cardIndex: number;
  };
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
  cardPlayAnimation,
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

  // Animation refs for all players' hand cards
  const bottomCardAnimations = useRef<Map<string, Animated.ValueXY>>(new Map()).current;
  const bottomPreviousPositions = useRef<Map<string, Position>>(new Map()).current;
  const leftCardAnimations = useRef<Map<string, Animated.Value>>(new Map()).current;
  const leftPreviousPositions = useRef<Map<string, number>>(new Map()).current;
  const topCardAnimations = useRef<Map<string, Animated.Value>>(new Map()).current;
  const topPreviousPositions = useRef<Map<string, number>>(new Map()).current;
  const rightCardAnimations = useRef<Map<string, Animated.Value>>(new Map()).current;
  const rightPreviousPositions = useRef<Map<string, number>>(new Map()).current;

  // Create unique keys for cards based on suit and value
  const getCardKey = (card: SpanishCardData) => `${card.suit}_${card.value}`;

  // Cleanup animations for bottom player
  useEffect(() => {
    const currentCardKeys = new Set(bottomPlayer.cards.map(getCardKey));
    Array.from(bottomCardAnimations.keys()).forEach(key => {
      if (!currentCardKeys.has(key)) {
        bottomCardAnimations.delete(key);
        bottomPreviousPositions.delete(key);
      }
    });
  }, [bottomPlayer.cards, bottomCardAnimations, bottomPreviousPositions]);

  // Cleanup animations for left player
  useEffect(() => {
    const currentCardKeys = new Set(leftPlayer.cards.map(getCardKey));
    Array.from(leftCardAnimations.keys()).forEach(key => {
      if (!currentCardKeys.has(key)) {
        leftCardAnimations.delete(key);
        leftPreviousPositions.delete(key);
      }
    });
  }, [leftPlayer.cards, leftCardAnimations, leftPreviousPositions]);

  // Cleanup animations for top player
  useEffect(() => {
    const currentCardKeys = new Set(topPlayer.cards.map(getCardKey));
    Array.from(topCardAnimations.keys()).forEach(key => {
      if (!currentCardKeys.has(key)) {
        topCardAnimations.delete(key);
        topPreviousPositions.delete(key);
      }
    });
  }, [topPlayer.cards, topCardAnimations, topPreviousPositions]);

  // Cleanup animations for right player
  useEffect(() => {
    const currentCardKeys = new Set(rightPlayer.cards.map(getCardKey));
    Array.from(rightCardAnimations.keys()).forEach(key => {
      if (!currentCardKeys.has(key)) {
        rightCardAnimations.delete(key);
        rightPreviousPositions.delete(key);
      }
    });
  }, [rightPlayer.cards, rightCardAnimations, rightPreviousPositions]);

  // Measure pile centers so trick animation can land exactly on stacks
  const [team1PileCenter, setTeam1PileCenter] = useState<{ x: number; y: number } | null>(null);
  const [team2PileCenter, setTeam2PileCenter] = useState<{ x: number; y: number } | null>(null);

  // Manage overlay fade-out after dealing completes to avoid deck blink
  const [shouldFadeOutOverlay, setShouldFadeOutOverlay] = useState(false);
  const [, forceUpdate] = useState(0);

  // Determine if deck should be visible - centralized logic to prevent bugs
  const shouldShowDeck = useMemo(() => {
    // Never show during end game phases
    if (gamePhase === 'scoring' || gamePhase === 'gameOver' || gamePhase === 'finished') {
      return false;
    }
    // Never show during initial dealing animation
    if (isDealing) {
      return false;
    }
    // Only show if there are actually cards in the deck
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
  }, [gamePhase, isDealing, deckCount, layout.isReady, deckPosition, trumpCard]);

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
          {topPlayer.cards.map((card, index) => {
            // Hide card during play animation
            const isAnimating =
              cardPlayAnimation?.playerId === topPlayer.id &&
              cardPlayAnimation?.cardIndex === index;

            // If card is animating to table, render invisible placeholder to maintain spacing
            if (isAnimating) {
              const cardDims = getCardDimensions();
              return (
                <View
                  key={`top-${index}`}
                  style={{
                    width: cardDims.small.width,
                    height: cardDims.small.height,
                    opacity: 0,
                  }}
                />
              );
            }

            const targetPosition = getPlayerCardPosition(
              2,
              index,
              topPlayer.cards.length,
              'small',
              layoutInfo,
            );

            // Get or create animation for this card
            const cardKey = `${index}`; // Use index since cards are face down
            if (!topCardAnimations.has(cardKey)) {
              topCardAnimations.set(cardKey, new Animated.Value(targetPosition.x));
              topPreviousPositions.set(cardKey, targetPosition.x);
            }

            const animatedX = topCardAnimations.get(cardKey)!;
            const previousX = topPreviousPositions.get(cardKey);

            // Animate to new position if it changed
            if (previousX && Math.abs(previousX - targetPosition.x) > 1) {
              const staggerDelay = index * HAND_ANIMATION_STAGGER;

              Animated.timing(animatedX, {
                toValue: targetPosition.x,
                duration: HAND_ANIMATION_DURATION,
                delay: staggerDelay,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
              }).start();

              topPreviousPositions.set(cardKey, targetPosition.x);
            } else if (!previousX) {
              animatedX.setValue(targetPosition.x);
              topPreviousPositions.set(cardKey, targetPosition.x);
            }

            return (
              <Animated.View
                key={`top-${index}`}
                style={[
                  styles.opponentCard,
                  {
                    left: animatedX,
                    top: targetPosition.y,
                    zIndex: targetPosition.zIndex,
                    transform: [{ rotate: `${targetPosition.rotation}deg` }],
                  },
                ]}
              >
                <SpanishCard faceDown size="small" />
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Left Player Cards */}
      {!isDealing && layout.isReady && (
        <View style={styles.leftPlayerCards}>
          {leftPlayer.cards.map((card, index) => {
            // Hide card during play animation
            const isAnimating =
              cardPlayAnimation?.playerId === leftPlayer.id &&
              cardPlayAnimation?.cardIndex === index;

            // If card is animating to table, render invisible placeholder to maintain spacing
            if (isAnimating) {
              const dims = getCardDimensions().small;
              return (
                <View
                  key={`left-${index}`}
                  style={{
                    width: dims.width,
                    height: dims.height,
                    opacity: 0,
                  }}
                />
              );
            }

            const targetPosition = getPlayerCardPosition(
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

            // Get or create animation for this card
            const cardKey = `${index}`; // Use index since cards are face down
            if (!leftCardAnimations.has(cardKey)) {
              leftCardAnimations.set(cardKey, new Animated.Value(targetPosition.y));
              leftPreviousPositions.set(cardKey, targetPosition.y);
            }

            const animatedY = leftCardAnimations.get(cardKey)!;
            const previousY = leftPreviousPositions.get(cardKey);

            // Animate to new position if it changed
            if (previousY && Math.abs(previousY - targetPosition.y) > 1) {
              const staggerDelay = index * HAND_ANIMATION_STAGGER;

              Animated.timing(animatedY, {
                toValue: targetPosition.y,
                duration: HAND_ANIMATION_DURATION,
                delay: staggerDelay,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
              }).start();

              leftPreviousPositions.set(cardKey, targetPosition.y);
            } else if (!previousY) {
              animatedY.setValue(targetPosition.y);
              leftPreviousPositions.set(cardKey, targetPosition.y);
            }

            return (
              <Animated.View
                key={`left-${index}`}
                style={[
                  styles.opponentCard,
                  {
                    left: x,
                    top: animatedY,
                    zIndex: targetPosition.zIndex,
                    transform: [{ rotate: `${targetPosition.rotation}deg` }],
                  },
                ]}
              >
                <SpanishCard faceDown size="small" />
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Right Player Cards */}
      {!isDealing && layout.isReady && (
        <View style={styles.rightPlayerCards}>
          {rightPlayer.cards.map((card, index) => {
            // Hide card during play animation
            const isAnimating =
              cardPlayAnimation?.playerId === rightPlayer.id &&
              cardPlayAnimation?.cardIndex === index;

            // If card is animating to table, render invisible placeholder to maintain spacing
            if (isAnimating) {
              const dims = getCardDimensions().small;
              return (
                <View
                  key={`right-${index}`}
                  style={{
                    width: dims.width,
                    height: dims.height,
                    opacity: 0,
                  }}
                />
              );
            }

            const targetPosition = getPlayerCardPosition(
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

            // Get or create animation for this card
            const cardKey = `${index}`; // Use index since cards are face down
            if (!rightCardAnimations.has(cardKey)) {
              rightCardAnimations.set(cardKey, new Animated.Value(targetPosition.y));
              rightPreviousPositions.set(cardKey, targetPosition.y);
            }

            const animatedY = rightCardAnimations.get(cardKey)!;
            const previousY = rightPreviousPositions.get(cardKey);

            // Animate to new position if it changed
            if (previousY && Math.abs(previousY - targetPosition.y) > 1) {
              const staggerDelay = index * HAND_ANIMATION_STAGGER;

              Animated.timing(animatedY, {
                toValue: targetPosition.y,
                duration: HAND_ANIMATION_DURATION,
                delay: staggerDelay,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
              }).start();

              rightPreviousPositions.set(cardKey, targetPosition.y);
            } else if (!previousY) {
              animatedY.setValue(targetPosition.y);
              rightPreviousPositions.set(cardKey, targetPosition.y);
            }

            return (
              <Animated.View
                key={`right-${index}`}
                style={[
                  styles.opponentCard,
                  {
                    left: x,
                    top: animatedY,
                    zIndex: targetPosition.zIndex,
                    transform: [{ rotate: `${targetPosition.rotation}deg` }],
                  },
                ]}
              >
                <SpanishCard faceDown size="small" />
              </Animated.View>
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

      {/* Card Play Animation */}
      {cardPlayAnimation && layout.isReady && (
        <CardPlayAnimation
          card={cardPlayAnimation.card}
          fromPosition={(() => {
            // Calculate the position of the card in the player's hand
            const playerIndex = playerIdToHandPosition[cardPlayAnimation.playerId] ?? 0;
            const player = [bottomPlayer, leftPlayer, topPlayer, rightPlayer].find(
              p => p.id === cardPlayAnimation.playerId,
            );
            const totalCards = player?.cards.length || 0;
            const size = playerIndex === 0 ? 'large' : 'small';

            const cardPos = getPlayerCardPosition(
              playerIndex,
              cardPlayAnimation.cardIndex,
              totalCards,
              size,
              layoutInfo,
            );

            return { x: cardPos.x, y: cardPos.y };
          })()}
          toPosition={(() => {
            // Calculate the destination position on the table
            const playerPos = playerIdToPosition[cardPlayAnimation.playerId] ?? 0;
            const trickPos = getTrickCardPositionWithinBoard(playerPos, layout.board);
            const boardOffsetX = layout.board?.x || 0;
            const boardOffsetY = layout.board?.y || 0;

            return {
              x: boardOffsetX + (trickPos.left as number),
              y: boardOffsetY + (trickPos.top as number),
            };
          })()}
          playerPosition={(() => {
            const pos = playerIdToPosition[cardPlayAnimation.playerId];
            switch (pos) {
              case 0:
                return 'bottom';
              case 1:
                return 'left';
              case 2:
                return 'top';
              case 3:
                return 'right';
              default:
                return 'bottom';
            }
          })()}
          playSound={() => {
            // Card sound is played in GameScreen handleCardPlay
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
            // Get card key and dimensions first (needed for placeholder)
            const cardKey = getCardKey(card);
            const cardDimensions = getCardDimensions();
            
            // Hide card if it matches the hideCardFromHand criteria
            const shouldHide =
              hideCardFromHand &&
              hideCardFromHand.playerId === bottomPlayer.id &&
              card.suit === hideCardFromHand.suit &&
              card.value === hideCardFromHand.value;

            // Hide card during play animation
            const isAnimating =
              cardPlayAnimation?.playerId === bottomPlayer.id &&
              cardPlayAnimation?.cardIndex === index;

            if (shouldHide) return null;

            // If card is animating to table, render invisible placeholder to maintain spacing
            if (isAnimating) {
              return (
                <View
                  key={cardKey}
                  style={{
                    width: cardDimensions.large.width,
                    height: cardDimensions.large.height,
                    opacity: 0,
                  }}
                />
              );
            }
            const isValidCard = !validCardIndices || validCardIndices.includes(index);
            const isPlayerTurn = currentPlayerIndex === 0;
            const targetPosition = getPlayerCardPosition(
              0,
              index,
              bottomPlayer.cards.length,
              'large',
              layoutInfo,
            );
            const scaledCardWidth = cardDimensions.large.width;

            // Get or create animation for this card
            if (!bottomCardAnimations.has(cardKey)) {
              bottomCardAnimations.set(cardKey, new Animated.ValueXY(targetPosition));
              bottomPreviousPositions.set(cardKey, targetPosition);
            }

            const animatedPosition = bottomCardAnimations.get(cardKey)!;
            const previousPosition = bottomPreviousPositions.get(cardKey);

            // Animate to new position if it changed
            if (
              previousPosition &&
              (Math.abs(previousPosition.x - targetPosition.x) > 1 ||
                Math.abs(previousPosition.y - targetPosition.y) > 1)
            ) {
              // Calculate stagger delay based on how many cards are moving
              const movingCardsCount = bottomPlayer.cards.filter((_, i) => {
                const pos = getPlayerCardPosition(
                  0,
                  i,
                  bottomPlayer.cards.length,
                  'large',
                  layoutInfo,
                );
                const key = getCardKey(bottomPlayer.cards[i]);
                const prev = bottomPreviousPositions.get(key);
                return prev && Math.abs(prev.x - pos.x) > 1;
              }).length;

              const staggerDelay = movingCardsCount > 1 ? index * HAND_ANIMATION_STAGGER : 0;

              Animated.timing(animatedPosition, {
                toValue: targetPosition,
                duration: HAND_ANIMATION_DURATION,
                delay: staggerDelay,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
              }).start();

              bottomPreviousPositions.set(cardKey, targetPosition);
            } else if (!previousPosition) {
              // First render - set position immediately
              animatedPosition.setValue(targetPosition);
              bottomPreviousPositions.set(cardKey, targetPosition);
            }

            return (
              <Animated.View
                key={cardKey}
                style={[
                  styles.handCardContainer,
                  {
                    left: animatedPosition.x,
                    top: animatedPosition.y,
                    zIndex: targetPosition.zIndex,
                    opacity: isDealing ? 0 : 1,
                  },
                  styles.handCard,
                  landscape && styles.handCardLandscape,
                ]}
              >
                <DraggableCard
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
                  cardSize="large"
                  totalCards={bottomPlayer.cards.length}
                  cardWidth={scaledCardWidth}
                />
              </Animated.View>
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
