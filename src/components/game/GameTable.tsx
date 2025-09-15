import React, { useState, useRef, useMemo, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
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
import { EnhancedVueltasDisplay } from './EnhancedVueltasDisplay';
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
import {
  HAND_ANIMATION_DURATION,
  HAND_ANIMATION_STAGGER,
  STANDARD_EASING,
} from '../../constants/animations';

type Player = {
  id: string;
  name: string;
  ranking: number;
  cards: SpanishCardData[];
  avatar: string;
  isHidden?: boolean; // True if cards should be hidden (opponent hands)
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
  vueltasInitialScores?: { team1: number; team2: number }; // Idas scores to display
  canDeclareVictory?: boolean;
  teamScores?: { team1: number; team2: number };
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

export const GameTable = React.memo(function GameTable({
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
  vueltasInitialScores,
  canDeclareVictory = false,
  teamScores,
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

  // Create stable callback refs for memoization
  const onCardPlayRef = useRef(onCardPlay);
  const onCardReorderRef = useRef(onCardReorder);
  const bottomPlayerIdRef = useRef(bottomPlayer.id);

  // Stable deck position with smart caching
  const deckPositionRef = useRef<Position | null>(null);
  const lastLayoutDimensions = useRef({ width: 0, height: 0 });

  // Update refs on each render
  useEffect(() => {
    onCardPlayRef.current = onCardPlay;
    onCardReorderRef.current = onCardReorder;
    bottomPlayerIdRef.current = bottomPlayer.id;
  });

  // Create stable callback wrappers
  const stableOnCardPlay = useRef((index: number) => {
    onCardPlayRef.current(index);
  }).current;

  const stableOnReorder = useRef((fromIndex: number, toIndex: number) => {
    if (onCardReorderRef.current) {
      onCardReorderRef.current(
        bottomPlayerIdRef.current as unknown as PlayerId,
        fromIndex,
        toIndex,
      );
    }
  }).current;
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

  // Calculate deck position with stability mechanism
  const deckPosition = useMemo(() => {
    // Return cached position when layout isn't ready
    if (!layout.isReady) {
      return deckPositionRef.current;
    }

    const { width, height } = layout.table;

    // Only recalculate if dimensions changed significantly (3px threshold)
    const widthDiff = Math.abs(width - lastLayoutDimensions.current.width);
    const heightDiff = Math.abs(height - lastLayoutDimensions.current.height);

    if (deckPositionRef.current && widthDiff < 3 && heightDiff < 3) {
      // Return cached position for micro-movements
      return deckPositionRef.current;
    }

    // Update cached dimensions
    lastLayoutDimensions.current = { width, height };

    const currentLayoutInfo: LayoutInfo = {
      parentLayout: layout.table,
      boardLayout: layout.board,
    };

    const newPosition = getDeckPosition(width, height, currentLayoutInfo);

    // Cache the new position
    deckPositionRef.current = newPosition;

    return newPosition;
  }, [
    layout.table.width,
    layout.table.height,
    layout.board.width,
    layout.board.height,
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
  const leftOpacityAnimations = useRef<Map<string, Animated.Value>>(new Map()).current;
  const topCardAnimations = useRef<Map<string, Animated.Value>>(new Map()).current;
  const topPreviousPositions = useRef<Map<string, number>>(new Map()).current;
  const topOpacityAnimations = useRef<Map<string, Animated.Value>>(new Map()).current;
  const rightCardAnimations = useRef<Map<string, Animated.Value>>(new Map()).current;
  const rightPreviousPositions = useRef<Map<string, number>>(new Map()).current;
  const rightOpacityAnimations = useRef<Map<string, Animated.Value>>(new Map()).current;

  // Track previous card counts to maintain positions during animations
  const leftPreviousCount = useRef(leftPlayer.cards.length);
  const topPreviousCount = useRef(topPlayer.cards.length);
  const rightPreviousCount = useRef(rightPlayer.cards.length);

  // Track if we're currently animating to prevent position jumps
  const leftAnimating = useRef(false);
  const topAnimating = useRef(false);
  const rightAnimating = useRef(false);

  // Track active animations to handle completion properly
  const leftActiveAnimations = useRef<Set<number>>(new Set());
  const topActiveAnimations = useRef<Set<number>>(new Set());
  const rightActiveAnimations = useRef<Set<number>>(new Set());

  // Track previous cards to find correct source positions
  const leftPreviousCards = useRef<typeof leftPlayer.cards>(leftPlayer.cards);
  const topPreviousCards = useRef<typeof topPlayer.cards>(topPlayer.cards);
  const rightPreviousCards = useRef<typeof rightPlayer.cards>(rightPlayer.cards);

  // Track card ID sequence for stable keys in hidden hands
  const leftCardIdSequence = useRef<Map<number, string>>(new Map());
  const topCardIdSequence = useRef<Map<number, string>>(new Map());
  const rightCardIdSequence = useRef<Map<number, string>>(new Map());
  const nextCardId = useRef(0);

  // Create unique keys for cards with stable IDs for hidden cards
  // Use card.id if available (for visible cards), otherwise create stable ID
  const getCardKey = (
    card: SpanishCardData,
    index: number,
    playerPrefix: string,
    isHidden: boolean = false,
  ) => {
    if (isHidden) {
      // For hidden cards, maintain stable IDs across renders
      let idMap: Map<number, string>;
      if (playerPrefix === 'left') {
        idMap = leftCardIdSequence.current;
      } else if (playerPrefix === 'top') {
        idMap = topCardIdSequence.current;
      } else if (playerPrefix === 'right') {
        idMap = rightCardIdSequence.current;
      } else {
        return `${playerPrefix}_hidden_${index}`;
      }

      // If we don't have an ID for this position yet, create one
      if (!idMap.has(index)) {
        idMap.set(index, `${playerPrefix}_card_${nextCardId.current++}`);
      }
      return idMap.get(index)!;
    }
    // Use card.id if available (visible cards from GameScreen include id)
    if ('id' in card && card.id) {
      return card.id as string;
    }
    return `${card.suit}_${card.value}`;
  };

  // Cleanup animations for bottom player
  useEffect(() => {
    const currentCardKeys = new Set(
      bottomPlayer.cards.map((card, index) =>
        getCardKey(card, index, 'bottom', bottomPlayer.isHidden),
      ),
    );
    Array.from(bottomCardAnimations.keys()).forEach(key => {
      if (!currentCardKeys.has(key)) {
        bottomCardAnimations.delete(key);
        bottomPreviousPositions.delete(key);
      }
    });
  }, [bottomPlayer.cards, bottomCardAnimations, bottomPreviousPositions]);

  // Cleanup animations for left player and manage card ID sequence
  useEffect(() => {
    // When cards are removed, shift the ID sequence
    if (leftPlayer.isHidden && leftPlayer.cards.length < leftPreviousCount.current) {
      const newIdMap = new Map<number, string>();
      const oldMap = leftCardIdSequence.current;

      // Shift IDs to maintain stability
      for (let i = 0; i < leftPlayer.cards.length; i++) {
        if (oldMap.has(i)) {
          newIdMap.set(i, oldMap.get(i)!);
        } else if (oldMap.has(i + 1)) {
          newIdMap.set(i, oldMap.get(i + 1)!);
        } else {
          newIdMap.set(i, `left_card_${nextCardId.current++}`);
        }
      }
      leftCardIdSequence.current = newIdMap;
    }

    const currentCardKeys = new Set(
      leftPlayer.cards.map((card, index) => getCardKey(card, index, 'left', leftPlayer.isHidden)),
    );
    Array.from(leftCardAnimations.keys()).forEach(key => {
      if (!currentCardKeys.has(key)) {
        leftCardAnimations.delete(key);
        leftPreviousPositions.delete(key);
        leftOpacityAnimations.delete(key);
      }
    });
  }, [leftPlayer.cards, leftCardAnimations, leftPreviousPositions, leftOpacityAnimations]);

  // Cleanup animations for top player and manage card ID sequence
  useEffect(() => {
    // When cards are removed, shift the ID sequence
    if (topPlayer.isHidden && topPlayer.cards.length < topPreviousCount.current) {
      const newIdMap = new Map<number, string>();
      const oldMap = topCardIdSequence.current;

      // Shift IDs to maintain stability
      for (let i = 0; i < topPlayer.cards.length; i++) {
        // Try to reuse the ID from position i+1 if a card was removed before this position
        if (oldMap.has(i)) {
          newIdMap.set(i, oldMap.get(i)!);
        } else if (oldMap.has(i + 1)) {
          newIdMap.set(i, oldMap.get(i + 1)!);
        } else {
          newIdMap.set(i, `top_card_${nextCardId.current++}`);
        }
      }
      topCardIdSequence.current = newIdMap;
    }

    const currentCardKeys = new Set(
      topPlayer.cards.map((card, index) => getCardKey(card, index, 'top', topPlayer.isHidden)),
    );
    Array.from(topCardAnimations.keys()).forEach(key => {
      if (!currentCardKeys.has(key)) {
        topCardAnimations.delete(key);
        topPreviousPositions.delete(key);
        topOpacityAnimations.delete(key);
      }
    });
  }, [topPlayer.cards, topCardAnimations, topPreviousPositions, topOpacityAnimations]);

  // Cleanup animations for right player and manage card ID sequence
  useEffect(() => {
    // When cards are removed, shift the ID sequence
    if (rightPlayer.isHidden && rightPlayer.cards.length < rightPreviousCount.current) {
      const newIdMap = new Map<number, string>();
      const oldMap = rightCardIdSequence.current;

      // Shift IDs to maintain stability
      for (let i = 0; i < rightPlayer.cards.length; i++) {
        if (oldMap.has(i)) {
          newIdMap.set(i, oldMap.get(i)!);
        } else if (oldMap.has(i + 1)) {
          newIdMap.set(i, oldMap.get(i + 1)!);
        } else {
          newIdMap.set(i, `right_card_${nextCardId.current++}`);
        }
      }
      rightCardIdSequence.current = newIdMap;
    }

    const currentCardKeys = new Set(
      rightPlayer.cards.map((card, index) =>
        getCardKey(card, index, 'right', rightPlayer.isHidden),
      ),
    );
    Array.from(rightCardAnimations.keys()).forEach(key => {
      if (!currentCardKeys.has(key)) {
        rightCardAnimations.delete(key);
        rightPreviousPositions.delete(key);
        rightOpacityAnimations.delete(key);
      }
    });
  }, [rightPlayer.cards, rightCardAnimations, rightPreviousPositions, rightOpacityAnimations]);

  // Measure pile centers so trick animation can land exactly on stacks
  const [team1PileCenter, setTeam1PileCenter] = useState<{ x: number; y: number } | null>(null);
  const [team2PileCenter, setTeam2PileCenter] = useState<{ x: number; y: number } | null>(null);

  // Manage overlay fade-out after dealing completes to avoid deck blink
  const [shouldFadeOutOverlay, setShouldFadeOutOverlay] = useState(false);
  const [dealingAnimationComplete, setDealingAnimationComplete] = useState(false);
  // Remove unmount gap by keeping trick mounted but fully hidden during overlay

  // Crossfade current trick instead of hard unmounting
  const trickOpacity = useRef(new Animated.Value(1)).current;
  const prevTrickAnimatingRef = useRef<boolean>(false);
  // Overlay container opacity (kept mounted to avoid layer churn)
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const wasAnimating = prevTrickAnimatingRef.current;
    prevTrickAnimatingRef.current = trickAnimating;
    if (trickAnimating && !wasAnimating) {
      // Fade overlay in first, then fade static trick out with small delay for continuity
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 120,
        easing: STANDARD_EASING,
        useNativeDriver: true,
      }).start();
      Animated.timing(trickOpacity, {
        toValue: 0,
        duration: 120,
        delay: 60,
        easing: STANDARD_EASING,
        useNativeDriver: true,
      }).start();
    } else if (!trickAnimating && wasAnimating) {
      // Restore static trick immediately and fade overlay out
      trickOpacity.stopAnimation();
      trickOpacity.setValue(1);
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 120,
        easing: STANDARD_EASING,
        useNativeDriver: true,
      }).start();
    }
  }, [trickAnimating, overlayOpacity, trickOpacity]);

  // Freeze trick start positions on overlay mount to avoid drift from layout updates
  const trickStartPositionsRef = useRef<Array<{ x: number; y: number }> | null>(null);
  const prevTrickAnimatingForPositionsRef = useRef<boolean>(false);
  useEffect(() => {
    const prev = prevTrickAnimatingForPositionsRef.current;
    prevTrickAnimatingForPositionsRef.current = trickAnimating;
    if (trickAnimating && !prev && (currentTrick?.length || 0) > 0) {
      // Snapshot absolute positions once
      const snapshot = (currentTrick || []).map(play => {
        const posStyle = getTrickCardPositionWithinBoard(
          playerIdToPosition[play.playerId] ?? 0,
          layout.board,
        ) as any;
        const left = typeof posStyle.left === 'number' ? posStyle.left : 0;
        const top = typeof posStyle.top === 'number' ? posStyle.top : 0;
        const boardOffsetX = layout.board?.x || 0;
        const boardOffsetY = layout.board?.y || 0;
        return { x: boardOffsetX + left, y: boardOffsetY + top };
      });
      trickStartPositionsRef.current = snapshot;
    }
    if (!trickAnimating) {
      trickStartPositionsRef.current = null;
    }
  }, [trickAnimating, currentTrick, layout.board, playerIdToPosition]);

  // Freeze static trick card positions as they are played to avoid micro-shifts
  const trickStaticAbsPositionsRef = useRef<Array<{ x: number; y: number }>>([]);
  const prevTrickLengthRef = useRef<number>(0);
  // Stable pixel dimensions for trick cards (frozen per trick)
  const stableTrickDimsRef = useRef<{ width: number; height: number } | null>(null);
  // Precise landing coordinates by card identity (to align static with flight end)
  const landingAbsByCardRef = useRef<Record<string, { x: number; y: number }>>({});

  const getTrickIdentity = (playerId: string, card: SpanishCardData) => {
    // Prefer card.id if available; fallback to suit-value
    const cardId = (card as any)?.id ? String((card as any).id) : `${card.suit}-${card.value}`;
    return `${playerId}-${cardId}`;
  };
  useEffect(() => {
    const prevLen = prevTrickLengthRef.current;
    const len = currentTrick.length;
    // Reset on new trick or when cleared
    if (len === 0) {
      trickStaticAbsPositionsRef.current = [];
      prevTrickLengthRef.current = 0;
      stableTrickDimsRef.current = null;
      landingAbsByCardRef.current = {};
      return;
    }
    if (len > prevLen) {
      // Freeze card pixel size at first card of the trick
      if (!stableTrickDimsRef.current) {
        const dims = getCardDimensions().medium;
        stableTrickDimsRef.current = { width: Math.round(dims.width), height: Math.round(dims.height) };
      }
      // Compute absolute positions only for newly added cards
      for (let i = prevLen; i < len; i++) {
        const play = currentTrick[i];
        // Prefer exact landing coords captured from flight if available
        const identity = getTrickIdentity(play.playerId, play.card);
        const landing = landingAbsByCardRef.current[identity];
        if (landing) {
          trickStaticAbsPositionsRef.current[i] = { x: Math.round(landing.x), y: Math.round(landing.y) };
        } else {
          const posStyle = getTrickCardPositionWithinBoard(
            playerIdToPosition[play.playerId] ?? 0,
            layout.board,
          ) as any;
          const left = typeof posStyle.left === 'number' ? posStyle.left : 0;
          const top = typeof posStyle.top === 'number' ? posStyle.top : 0;
          const boardOffsetX = layout.board?.x || 0;
          const boardOffsetY = layout.board?.y || 0;
          trickStaticAbsPositionsRef.current[i] = {
            x: Math.round(boardOffsetX + left),
            y: Math.round(boardOffsetY + top),
          };
        }
      }
      prevTrickLengthRef.current = len;
    } else if (len < prevLen) {
      // Trick shrank (likely collected) – reset cache
      trickStaticAbsPositionsRef.current = [];
      prevTrickLengthRef.current = len;
    }
  }, [currentTrick.length, currentTrick, layout.board, playerIdToPosition]);
  // Log when dealing overlay should mount
  useEffect(() => {
    if (isDealing) {
      console.log('🎬 GameTable: dealing overlay mounting (phase dealing)');
    }
  }, [isDealing]);

  // Determine if deck should be visible - centralized logic to prevent bugs
  const shouldShowDeck = useMemo(() => {
    // Never show during end game phases
    if (gamePhase === 'scoring' || gamePhase === 'gameOver' || gamePhase === 'finished') {
      return false;
    }
    // Keep deck visible during trick animations (winner card enlargement)
    // This preserves prior behavior and avoids the deck disappearing mid-animation
    // Never show during initial dealing animation
    if (isDealing) {
      return false;
    }
    // Hide deck in arrastre phase ONLY if there are no cards left to deal
    // This ensures deck remains visible while the last cards are being dealt
    if (
      gamePhase === 'arrastre' &&
      deckCount <= 0 &&
      !postTrickDealingAnimating &&
      !postTrickDealingPending
    ) {
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
  }, [
    gamePhase,
    isDealing,
    deckCount,
    layout.isReady,
    deckPosition,
    trumpCard,
    postTrickDealingAnimating,
    postTrickDealingPending,
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
            // Mark animation as complete first
            setDealingAnimationComplete(true);
            // Small delay to ensure cards are rendered before fade
            setTimeout(() => {
              onCompleteDealingAnimation?.();
              setShouldFadeOutOverlay(true);
            }, 150);
          }}
          playDealSound={playDealSound || (() => {})}
          playTrumpRevealSound={playTrumpRevealSound || (() => {})}
          playShuffleSound={playShuffleSound || (() => {})}
          firstPlayerIndex={currentPlayerIndex}
          fadeOut={shouldFadeOutOverlay}
          onFadeOutComplete={() => {
            setShouldFadeOutOverlay(false);
            setDealingAnimationComplete(false);
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
      {(!isDealing || dealingAnimationComplete) && layout.isReady && (
        <View style={styles.topPlayerCardsContainer} pointerEvents="none">
          {topPlayer.cards.map((card, index) => {
            // Hide card during play animation
            // For hidden hands (no id), match by index to avoid hiding all identical dummy cards
            const isAnimating =
              cardPlayAnimation?.playerId === topPlayer.id &&
              (('id' in cardPlayAnimation.card &&
                'id' in card &&
                (cardPlayAnimation.card as any).id === (card as any).id) ||
                index === cardPlayAnimation.cardIndex);

            // If card is animating to table, render fully hidden placeholder to maintain spacing
            if (isAnimating) {
              const cardDims = getCardDimensions();
              return (
                <View
                  key={`top-${index}`}
                  style={{
                    width: cardDims.small.width,
                    height: cardDims.small.height,
                    opacity: 0, // Fully hidden to avoid double-paint
                  }}
                />
              );
            }

            // Detect if cards were added (count increased) or removed (count decreased)
            const cardsAdded = topPlayer.cards.length > topPreviousCount.current;
            const cardsRemoved = topPlayer.cards.length < topPreviousCount.current;

            // Find where this card was in the previous arrangement
            let sourcePosition = null;
            if (cardsRemoved && topPreviousCards.current) {
              // For hidden cards, we need to find the visual position based on removal
              if (topPlayer.isHidden) {
                // When a card is removed, remaining cards slide from their old positions
                // Find which card was removed by comparing lengths
                const removedIndex = topPreviousCards.current.length - topPlayer.cards.length;
                if (index >= removedIndex) {
                  // This card was after the removed card, so it slides from index+1
                  sourcePosition = getPlayerCardPosition(
                    2,
                    index + 1,
                    topPreviousCount.current,
                    'small',
                    layoutInfo,
                  );
                } else {
                  // This card was before the removed card, stays in same position
                  sourcePosition = getPlayerCardPosition(
                    2,
                    index,
                    topPreviousCount.current,
                    'small',
                    layoutInfo,
                  );
                }
              } else {
                // For visible cards, match by suit and value
                const currentCard = topPlayer.cards[index];
                const previousIndex = topPreviousCards.current.findIndex(
                  card => card.suit === currentCard.suit && card.value === currentCard.value,
                );
                if (previousIndex !== -1) {
                  sourcePosition = getPlayerCardPosition(
                    2,
                    previousIndex,
                    topPreviousCount.current,
                    'small',
                    layoutInfo,
                  );
                }
              }
            }

            const targetPosition = getPlayerCardPosition(
              2,
              index,
              topPlayer.cards.length,
              'small',
              layoutInfo,
            );

            // Create a stable key based on card's suit and value
            const cardKey = getCardKey(card, index, 'top', topPlayer.isHidden);

            let animatedX: Animated.Value;
            let animatedOpacity: Animated.Value;

            if (!topCardAnimations.has(cardKey)) {
              // Check if this is a new card added after post-trick dealing
              const isNewCard =
                cardsAdded &&
                !topPreviousCards.current.some(
                  prevCard => prevCard.suit === card.suit && prevCard.value === card.value,
                );

              if (isNewCard && postTrickDealingAnimating) {
                // New card from dealing - start from deck/trump position
                const deckPos = getDeckPosition(
                  layout.table.width,
                  layout.table.height,
                  layoutInfo,
                );
                animatedX = new Animated.Value(deckPos.x);
                animatedOpacity = new Animated.Value(0.7); // Start semi-transparent
              } else if (cardsRemoved && sourcePosition) {
                // Start from where the card was with the old layout
                animatedX = new Animated.Value(sourcePosition.x);
                animatedOpacity = new Animated.Value(0.7); // Fade during slide
                topAnimating.current = true;
              } else {
                // First render or existing card - start at target
                // Initialize directly at target to prevent teleporting
                animatedX = new Animated.Value(targetPosition.x);
                animatedOpacity = new Animated.Value(1); // Already visible
                topPreviousPositions.set(cardKey, targetPosition.x);
              }
              topCardAnimations.set(cardKey, animatedX);
              topOpacityAnimations.set(cardKey, animatedOpacity);
            } else {
              animatedX = topCardAnimations.get(cardKey)!;
              animatedOpacity = topOpacityAnimations.get(cardKey) || new Animated.Value(1);
              if (!topOpacityAnimations.has(cardKey)) {
                topOpacityAnimations.set(cardKey, animatedOpacity);
              }
            }

            // Get the current actual position of the animated value
            // We need to track the current value without using private API
            let currentX = targetPosition.x;
            const previousX = topPreviousPositions.get(cardKey);
            if (previousX !== undefined) {
              currentX = previousX;
            } else if (sourcePosition) {
              currentX = sourcePosition.x;
            }

            // Only animate if position differs from target AND not during initial render
            const shouldAnimate =
              Math.abs(currentX - targetPosition.x) > 1 && previousX !== undefined;
            if (shouldAnimate) {
              const staggerDelay = cardsRemoved || cardsAdded ? index * HAND_ANIMATION_STAGGER : 0;

              // Track this animation
              topActiveAnimations.current.add(index);

              Animated.parallel([
                Animated.timing(animatedX, {
                  toValue: targetPosition.x,
                  duration: HAND_ANIMATION_DURATION,
                  delay: staggerDelay,
                  easing: STANDARD_EASING,
                  useNativeDriver: false,
                }),
                Animated.timing(animatedOpacity, {
                  toValue: 1,
                  duration: HAND_ANIMATION_DURATION * 0.8,
                  delay: staggerDelay,
                  easing: STANDARD_EASING,
                  useNativeDriver: false,
                }),
              ]).start(() => {
                // Remove from active animations
                topActiveAnimations.current.delete(index);

                // Update state when all animations complete
                if ((cardsRemoved || cardsAdded) && topActiveAnimations.current.size === 0) {
                  topPreviousCount.current = topPlayer.cards.length;
                  topPreviousCards.current = topPlayer.cards;
                  topAnimating.current = false;
                }
              });
            } else if (
              cardsRemoved &&
              index === topPlayer.cards.length - 1 &&
              topActiveAnimations.current.size === 0
            ) {
              // No animation needed but still need to update state
              topPreviousCount.current = topPlayer.cards.length;
              topPreviousCards.current = topPlayer.cards;
              topAnimating.current = false;
            }

            topPreviousPositions.set(cardKey, targetPosition.x);

            return (
              <Animated.View
                key={`top-${index}`}
                style={[
                  styles.opponentCard,
                  {
                    left: animatedX,
                    top: targetPosition.y,
                    zIndex: targetPosition.zIndex,
                    opacity: animatedOpacity,
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
      {(!isDealing || dealingAnimationComplete) && layout.isReady && (
        <View style={styles.leftPlayerCards} pointerEvents="none">
          {leftPlayer.cards.map((card, index) => {
            const currentCard = card; // Use currentCard to avoid unused variable warning
            // Hide card during play animation - for hidden hands, match by index
            const isAnimating =
              cardPlayAnimation?.playerId === leftPlayer.id &&
              (('id' in cardPlayAnimation.card &&
                'id' in card &&
                (cardPlayAnimation.card as any).id === (card as any).id) ||
                index === cardPlayAnimation.cardIndex);

            // If card is animating to table, render fully hidden placeholder to maintain spacing
            if (isAnimating) {
              const dims = getCardDimensions().small;
              return (
                <View
                  key={`left-${index}`}
                  style={{
                    width: dims.width,
                    height: dims.height,
                    opacity: 0, // Fully hidden to avoid double-paint
                  }}
                />
              );
            }

            // Detect if cards were added (count increased) or removed (count decreased)
            const cardsAdded = leftPlayer.cards.length > leftPreviousCount.current;
            const cardsRemoved = leftPlayer.cards.length < leftPreviousCount.current;

            // Find where this card was in the previous arrangement
            let sourcePosition = null;
            if (cardsRemoved && leftPreviousCards.current) {
              // For hidden cards, we need to find the visual position based on removal
              if (leftPlayer.isHidden) {
                // When a card is removed, remaining cards slide from their old positions
                const removedIndex = leftPreviousCards.current.length - leftPlayer.cards.length;
                if (index >= removedIndex) {
                  // This card was after the removed card, so it slides from index+1
                  sourcePosition = getPlayerCardPosition(
                    3,
                    index + 1,
                    leftPreviousCount.current,
                    'small',
                    layoutInfo,
                  );
                } else {
                  // This card was before the removed card, stays in same position
                  sourcePosition = getPlayerCardPosition(
                    3,
                    index,
                    leftPreviousCount.current,
                    'small',
                    layoutInfo,
                  );
                }
              } else {
                // For visible cards, match by suit and value
                const currentCard = leftPlayer.cards[index];
                const previousIndex = leftPreviousCards.current.findIndex(
                  card => card.suit === currentCard.suit && card.value === currentCard.value,
                );
                if (previousIndex !== -1) {
                  sourcePosition = getPlayerCardPosition(
                    3,
                    previousIndex,
                    leftPreviousCount.current,
                    'small',
                    layoutInfo,
                  );
                }
              }
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

            // Create a stable key based on card's suit and value
            const cardKey = getCardKey(card, index, 'left', leftPlayer.isHidden);

            let animatedY: Animated.Value;
            let animatedOpacity: Animated.Value;

            if (!leftCardAnimations.has(cardKey)) {
              // Check if this is a new card added after post-trick dealing
              const isNewCard =
                cardsAdded &&
                !leftPreviousCards.current.some(
                  prevCard =>
                    prevCard.suit === currentCard.suit && prevCard.value === currentCard.value,
                );

              if (isNewCard && postTrickDealingAnimating) {
                // New card from dealing - start from deck/trump position
                const deckPos = getDeckPosition(
                  layout.table.width,
                  layout.table.height,
                  layoutInfo,
                );
                animatedY = new Animated.Value(deckPos.y);
                animatedOpacity = new Animated.Value(0.7); // Start semi-transparent
              } else if (cardsRemoved && sourcePosition) {
                // Start from where the card was with the old layout
                animatedY = new Animated.Value(sourcePosition.y);
                animatedOpacity = new Animated.Value(0.7); // Fade during slide
                leftAnimating.current = true;
              } else {
                // First render or existing card - start at target
                // Initialize directly at target to prevent teleporting
                animatedY = new Animated.Value(targetPosition.y);
                animatedOpacity = new Animated.Value(1); // Already visible
                leftPreviousPositions.set(cardKey, targetPosition.y);
              }
              leftCardAnimations.set(cardKey, animatedY);
              leftOpacityAnimations.set(cardKey, animatedOpacity);
            } else {
              animatedY = leftCardAnimations.get(cardKey)!;
              animatedOpacity = leftOpacityAnimations.get(cardKey) || new Animated.Value(1);
              if (!leftOpacityAnimations.has(cardKey)) {
                leftOpacityAnimations.set(cardKey, animatedOpacity);
              }
            }

            // Get the current actual position of the animated value
            // We need to track the current value without using private API
            let currentY = targetPosition.y;
            const previousY = leftPreviousPositions.get(cardKey);
            if (previousY !== undefined) {
              currentY = previousY;
            } else if (sourcePosition) {
              currentY = sourcePosition.y;
            }

            // Only animate if position differs from target AND not during initial render
            const shouldAnimateLeft =
              Math.abs(currentY - targetPosition.y) > 1 && previousY !== undefined;
            if (shouldAnimateLeft) {
              const staggerDelay = cardsRemoved || cardsAdded ? index * HAND_ANIMATION_STAGGER : 0;

              // Track this animation
              leftActiveAnimations.current.add(index);

              Animated.parallel([
                Animated.timing(animatedY, {
                  toValue: targetPosition.y,
                  duration: HAND_ANIMATION_DURATION,
                  delay: staggerDelay,
                  easing: STANDARD_EASING,
                  useNativeDriver: false,
                }),
                Animated.timing(animatedOpacity, {
                  toValue: 1,
                  duration: HAND_ANIMATION_DURATION * 0.8,
                  delay: staggerDelay,
                  easing: STANDARD_EASING,
                  useNativeDriver: false,
                }),
              ]).start(() => {
                // Remove from active animations
                leftActiveAnimations.current.delete(index);

                // Update state when all animations complete
                if ((cardsRemoved || cardsAdded) && leftActiveAnimations.current.size === 0) {
                  leftPreviousCount.current = leftPlayer.cards.length;
                  leftPreviousCards.current = leftPlayer.cards;
                  leftAnimating.current = false;
                }
              });
            } else if (
              cardsRemoved &&
              index === leftPlayer.cards.length - 1 &&
              leftActiveAnimations.current.size === 0
            ) {
              // No animation needed but still need to update state
              leftPreviousCount.current = leftPlayer.cards.length;
              leftPreviousCards.current = leftPlayer.cards;
              leftAnimating.current = false;
            }

            leftPreviousPositions.set(cardKey, targetPosition.y);

            return (
              <Animated.View
                key={`left-${index}`}
                style={[
                  styles.opponentCard,
                  {
                    left: x,
                    top: animatedY,
                    zIndex: targetPosition.zIndex,
                    opacity: animatedOpacity,
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
      {(!isDealing || dealingAnimationComplete) && layout.isReady && (
        <View style={styles.rightPlayerCards} pointerEvents="none">
          {rightPlayer.cards.map((card, index) => {
            const currentCard = card; // Use currentCard to avoid unused variable warning
            // Hide card during play animation - for hidden hands, match by index
            const isAnimating =
              cardPlayAnimation?.playerId === rightPlayer.id &&
              (('id' in cardPlayAnimation.card &&
                'id' in card &&
                (cardPlayAnimation.card as any).id === (card as any).id) ||
                index === cardPlayAnimation.cardIndex);

            // If card is animating to table, render fully hidden placeholder to maintain spacing
            if (isAnimating) {
              const dims = getCardDimensions().small;
              return (
                <View
                  key={`right-${index}`}
                  style={{
                    width: dims.width,
                    height: dims.height,
                    opacity: 0, // Fully hidden to avoid double-paint
                  }}
                />
              );
            }

            // Detect if cards were added (count increased) or removed (count decreased)
            const cardsAdded = rightPlayer.cards.length > rightPreviousCount.current;
            const cardsRemoved = rightPlayer.cards.length < rightPreviousCount.current;

            // Find where this card was in the previous arrangement
            let sourcePosition = null;
            if (cardsRemoved && rightPreviousCards.current) {
              // For hidden cards, we need to find the visual position based on removal
              if (rightPlayer.isHidden) {
                // When a card is removed, remaining cards slide from their old positions
                const removedIndex = rightPreviousCards.current.length - rightPlayer.cards.length;
                if (index >= removedIndex) {
                  // This card was after the removed card, so it slides from index+1
                  sourcePosition = getPlayerCardPosition(
                    1,
                    index + 1,
                    rightPreviousCount.current,
                    'small',
                    layoutInfo,
                  );
                } else {
                  // This card was before the removed card, stays in same position
                  sourcePosition = getPlayerCardPosition(
                    1,
                    index,
                    rightPreviousCount.current,
                    'small',
                    layoutInfo,
                  );
                }
              } else {
                // For visible cards, match by suit and value
                const currentCard = rightPlayer.cards[index];
                const previousIndex = rightPreviousCards.current.findIndex(
                  card => card.suit === currentCard.suit && card.value === currentCard.value,
                );
                if (previousIndex !== -1) {
                  sourcePosition = getPlayerCardPosition(
                    1,
                    previousIndex,
                    rightPreviousCount.current,
                    'small',
                    layoutInfo,
                  );
                }
              }
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

            // Create a stable key based on card's suit and value
            const cardKey = getCardKey(card, index, 'right', rightPlayer.isHidden);

            let animatedY: Animated.Value;
            let animatedOpacity: Animated.Value;

            if (!rightCardAnimations.has(cardKey)) {
              // Check if this is a new card added after post-trick dealing
              const isNewCard =
                cardsAdded &&
                !rightPreviousCards.current.some(
                  prevCard =>
                    prevCard.suit === currentCard.suit && prevCard.value === currentCard.value,
                );

              if (isNewCard && postTrickDealingAnimating) {
                // New card from dealing - start from deck/trump position
                const deckPos = getDeckPosition(
                  layout.table.width,
                  layout.table.height,
                  layoutInfo,
                );
                animatedY = new Animated.Value(deckPos.y);
                animatedOpacity = new Animated.Value(0.7); // Start semi-transparent
              } else if (cardsRemoved && sourcePosition) {
                // Start from where the card was with the old layout
                animatedY = new Animated.Value(sourcePosition.y);
                animatedOpacity = new Animated.Value(0.7); // Fade during slide
                rightAnimating.current = true;
              } else {
                // First render or existing card - start at target
                // Initialize directly at target to prevent teleporting
                animatedY = new Animated.Value(targetPosition.y);
                animatedOpacity = new Animated.Value(1); // Already visible
                rightPreviousPositions.set(cardKey, targetPosition.y);
              }
              rightCardAnimations.set(cardKey, animatedY);
              rightOpacityAnimations.set(cardKey, animatedOpacity);
            } else {
              animatedY = rightCardAnimations.get(cardKey)!;
              animatedOpacity = rightOpacityAnimations.get(cardKey) || new Animated.Value(1);
              if (!rightOpacityAnimations.has(cardKey)) {
                rightOpacityAnimations.set(cardKey, animatedOpacity);
              }
            }

            // Get the current actual position of the animated value
            // We need to track the current value without using private API
            let currentY = targetPosition.y;
            const previousY = rightPreviousPositions.get(cardKey);
            if (previousY !== undefined) {
              currentY = previousY;
            } else if (sourcePosition) {
              currentY = sourcePosition.y;
            }

            // Only animate if position differs from target AND not during initial render
            const shouldAnimateRight =
              Math.abs(currentY - targetPosition.y) > 1 && previousY !== undefined;
            if (shouldAnimateRight) {
              const staggerDelay = cardsRemoved || cardsAdded ? index * HAND_ANIMATION_STAGGER : 0;

              // Track this animation
              rightActiveAnimations.current.add(index);

              Animated.parallel([
                Animated.timing(animatedY, {
                  toValue: targetPosition.y,
                  duration: HAND_ANIMATION_DURATION,
                  delay: staggerDelay,
                  easing: STANDARD_EASING,
                  useNativeDriver: false,
                }),
                Animated.timing(animatedOpacity, {
                  toValue: 1,
                  duration: HAND_ANIMATION_DURATION * 0.8,
                  delay: staggerDelay,
                  easing: STANDARD_EASING,
                  useNativeDriver: false,
                }),
              ]).start(() => {
                // Remove from active animations
                rightActiveAnimations.current.delete(index);

                // Update state when all animations complete
                if ((cardsRemoved || cardsAdded) && rightActiveAnimations.current.size === 0) {
                  rightPreviousCount.current = rightPlayer.cards.length;
                  rightPreviousCards.current = rightPlayer.cards;
                  rightAnimating.current = false;
                }
              });
            } else if (
              cardsRemoved &&
              index === rightPlayer.cards.length - 1 &&
              rightActiveAnimations.current.size === 0
            ) {
              // No animation needed but still need to update state
              rightPreviousCount.current = rightPlayer.cards.length;
              rightPreviousCards.current = rightPlayer.cards;
              rightAnimating.current = false;
            }

            rightPreviousPositions.set(cardKey, targetPosition.y);

            return (
              <Animated.View
                key={`right-${index}`}
                style={[
                  styles.opponentCard,
                  {
                    left: x,
                    top: animatedY,
                    zIndex: targetPosition.zIndex,
                    opacity: animatedOpacity,
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
          style={[
            styles.playingArea,
            trickAnimating && styles.playingAreaSwap,
          ]}
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
          {/* Hide trick visuals entirely while initial dealing overlay is active */}
          {!isDealing && currentTrick.length > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[styles.trickCards, { opacity: trickOpacity }]}
            >
              {currentTrick.map((play, index) => {
                const position = playerIdToPosition[play.playerId] ?? 0;
                // Suppress static trick card for the one currently flying to avoid duplication
                if (
                  cardPlayAnimation &&
                  cardPlayAnimation.playerId === play.playerId &&
                  ((('id' in cardPlayAnimation.card && 'id' in play.card && (cardPlayAnimation.card as any).id === (play.card as any).id)) ||
                    (cardPlayAnimation.card.suit === play.card.suit && cardPlayAnimation.card.value === play.card.value))
                ) {
                  return null;
                }
                // Keep static trick card always rendered. Flying copy draws above, avoiding gaps.
                // Use frozen absolute positions to avoid micro-shifts
                let abs = trickStaticAbsPositionsRef.current[index];
                if (!abs) {
                  const posStyle = getTrickCardPositionWithinBoard(
                    position,
                    layout.board,
                  ) as any;
                  const left = typeof posStyle.left === 'number' ? posStyle.left : 0;
                  const top = typeof posStyle.top === 'number' ? posStyle.top : 0;
                  const boardOffsetX = layout.board?.x || 0;
                  const boardOffsetY = layout.board?.y || 0;
                  abs = {
                    x: Math.round(boardOffsetX + left),
                    y: Math.round(boardOffsetY + top),
                  };
                  trickStaticAbsPositionsRef.current[index] = abs;
                }
                const boardOffsetX = layout.board?.x || 0;
                const boardOffsetY = layout.board?.y || 0;
                const stableStyle = {
                  position: 'absolute' as const,
                  left: 0,
                  top: 0,
                  transform: [
                    { translateX: (abs?.x ?? 0) - boardOffsetX },
                    { translateY: (abs?.y ?? 0) - boardOffsetY },
                  ],
                } as const;
                return (
                  <SpanishCard
                    key={`trick-${play.playerId}-${('id' in play.card && (play.card as any).id) ? (play.card as any).id : `${play.card.suit}-${play.card.value}`}`}
                    card={play.card}
                    size="medium"
                    fixedCardSize={stableTrickDimsRef.current || undefined}
                    style={[styles.trickCard, stableStyle]}
                  />
                );
              })}
            </Animated.View>
          )}
        </View>
      </View>

      {/* Trick Collection Animation - overlay container kept mounted to avoid layer churn */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject as any, { opacity: overlayOpacity }]}
     >
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
            startPositions={
              trickStartPositionsRef.current ||
              (currentTrick || []).map(play => {
                const identity = getTrickIdentity(play.playerId, play.card);
                const landing = landingAbsByCardRef.current[identity];
                if (landing) return landing;
                const posStyle = getTrickCardPositionWithinBoard(
                  playerIdToPosition[play.playerId] ?? 0,
                  layout.board,
                ) as any;
                const left = typeof posStyle.left === 'number' ? posStyle.left : 0;
                const top = typeof posStyle.top === 'number' ? posStyle.top : 0;
                const boardOffsetX = layout.board?.x || 0;
                const boardOffsetY = layout.board?.y || 0;
                return { x: boardOffsetX + left, y: boardOffsetY + top };
              })
            }
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
      </Animated.View>

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
            const landing = {
              x: Math.round(boardOffsetX + (trickPos.left as number)),
              y: Math.round(boardOffsetY + (trickPos.top as number)),
            };
            // Store precise landing for static trick alignment
            const identity = getTrickIdentity(cardPlayAnimation.playerId, cardPlayAnimation.card);
            landingAbsByCardRef.current[identity] = landing;
            return landing;
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
          // Do not defer the local player's overlay; start immediately to avoid perceived duplication
          deferStart={playerIdToPosition[cardPlayAnimation.playerId] !== 0}
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

      {/* Enhanced Vueltas Score Display with Animations */}
      {isVueltas && teamScores && (
        <EnhancedVueltasDisplay
          team1Score={teamScores.team1}
          team2Score={teamScores.team2}
          visible={true}
        />
      )}

      {/* Team Trick Piles (two stacks) - Hidden during dealing phase */}
      {!isDealing && (
        <>
          <TeamTrickPile
            count={teamTrickCounts.team1}
            anchor="bottomLeft"
            disablePulse={!!trickAnimating}
            onCenterLayout={setTeam1PileCenter}
          />
          <TeamTrickPile
            count={teamTrickCounts.team2}
            anchor="topRight"
            disablePulse={!!trickAnimating}
            onCenterLayout={setTeam2PileCenter}
          />
        </>
      )}

      {/* Bottom Player Hand - Only render when not dealing */}
      {(!isDealing || dealingAnimationComplete) && layout.isReady && (
        <View style={[styles.bottomPlayerHand, landscape && styles.bottomPlayerHandLandscape]}>
          {(() => {
            // Build a derived list that hides the animating card during its flight
            const isBottomAnimating = !!cardPlayAnimation && cardPlayAnimation.playerId === bottomPlayer.id;
            const hiddenCardId = isBottomAnimating && (cardPlayAnimation.card as any)?.id ? String((cardPlayAnimation.card as any).id) : null;
            const hiddenByIndex = isBottomAnimating && typeof cardPlayAnimation.cardIndex === 'number' ? cardPlayAnimation.cardIndex : -1;
            const hiddenSuit = isBottomAnimating ? cardPlayAnimation.card.suit : null;
            const hiddenValue = isBottomAnimating ? cardPlayAnimation.card.value : null;
            const visibleCards = isBottomAnimating
              ? bottomPlayer.cards.filter((c, idx) => {
                  if (hiddenCardId && 'id' in c && (c as any).id) {
                    return String((c as any).id) !== hiddenCardId;
                  }
                  if (hiddenByIndex >= 0) {
                    return idx !== hiddenByIndex;
                  }
                  if (hiddenSuit && hiddenValue) {
                    return !(c.suit === hiddenSuit && c.value === hiddenValue);
                  }
                  return true;
                })
              : bottomPlayer.cards;

            return visibleCards.map((card, index) => {
            // Get card key and dimensions first (needed for placeholder)
            const cardKey = getCardKey(card, index, 'bottom', bottomPlayer.isHidden);
            const cardDimensions = getCardDimensions();

            // Hide card if it matches the hideCardFromHand criteria
            const shouldHide =
              hideCardFromHand &&
              hideCardFromHand.playerId === bottomPlayer.id &&
              card.suit === hideCardFromHand.suit &&
              card.value === hideCardFromHand.value;

            if (shouldHide) return null;

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
              // Initialize at exact target position to prevent teleporting
              const initialPos = bottomPreviousPositions.get(cardKey) || targetPosition;
              bottomCardAnimations.set(cardKey, new Animated.ValueXY(initialPos));
              if (!bottomPreviousPositions.has(cardKey)) {
                bottomPreviousPositions.set(cardKey, targetPosition);
              }
            }

            const animatedPosition = bottomCardAnimations.get(cardKey)!;
            const previousPosition = bottomPreviousPositions.get(cardKey);

            // Only animate if position changed AND this is not the initial render
            const shouldAnimateBottom =
              previousPosition &&
              (Math.abs(previousPosition.x - targetPosition.x) > 1 ||
                Math.abs(previousPosition.y - targetPosition.y) > 1);

            if (shouldAnimateBottom) {
              // Calculate stagger delay based on how many cards are moving
              const movingCardsCount = bottomPlayer.cards.filter((_, i) => {
                const pos = getPlayerCardPosition(
                  0,
                  i,
                  bottomPlayer.cards.length,
                  'large',
                  layoutInfo,
                );
                const key = getCardKey(bottomPlayer.cards[i], i, 'bottom', bottomPlayer.isHidden);
                const prev = bottomPreviousPositions.get(key);
                return prev && Math.abs(prev.x - pos.x) > 1;
              }).length;

              const staggerDelay = movingCardsCount > 1 ? index * HAND_ANIMATION_STAGGER : 0;

              Animated.timing(animatedPosition, {
                toValue: targetPosition,
                duration: HAND_ANIMATION_DURATION,
                delay: staggerDelay,
                easing: STANDARD_EASING,
                useNativeDriver: false,
              }).start();

              bottomPreviousPositions.set(cardKey, targetPosition);
            } else if (!previousPosition) {
              // First render - set position immediately without animation
              animatedPosition.stopAnimation();
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
                  onCardPlay={stableOnCardPlay}
                  onReorder={onCardReorder ? stableOnReorder : undefined}
                  dropZoneBounds={dropZoneBounds || undefined}
                  isEnabled={
                    !isDealingBlocked &&
                    !!dropZoneBounds &&
                    isPlayerTurn &&
                    isValidCard &&
                    !cardPlayAnimation // disable input while a play animation is active
                  }
                  isPlayerTurn={isPlayerTurn}
                  cardSize="large"
                  totalCards={bottomPlayer.cards.length}
                  cardWidth={scaledCardWidth}
                  gamePhase={gamePhase}
                />
              </Animated.View>
            );
            });
          })()}
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
});

const getTableColor = (color: 'green' | 'blue' | 'red' | 'wood') => {
  // Map 'red' to 'terracotta' for backward compatibility
  const mappedColor = color === 'red' ? 'terracotta' : color;
  return TABLE_COLORS[mappedColor as keyof typeof TABLE_COLORS] || TABLE_COLORS.green;
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
  // Swap-time dampening: reduce heavy shadows/translucency to prevent iOS layer flash
  playingAreaSwap: {
    shadowOpacity: 0.1,
    shadowRadius: 6,
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
    left: 80,
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
  vueltasPointsText: {
    color: colors.white,
    fontSize: 14,
    marginTop: 4,
    opacity: 0.95,
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
