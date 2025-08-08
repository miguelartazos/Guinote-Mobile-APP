import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import GameBoard from './GameBoard';
import PlayerPositions, { LAYOUT } from './PlayerPositions';
import PlayerHand from './PlayerHand';
import OpponentHand from './OpponentHand';
import ActionButtons from './ActionButtons';
import CenterPlayArea from './CenterPlayArea';
import { DeckPile } from './DeckPile';
import { DealingAnimationCoordinator } from './DealingAnimationCoordinator';
import type { Card as CardType, PlayerId } from '../../types/game.types';
import { CARD_WIDTH, CARD_HEIGHT } from '../../utils/cardPositions';
import {
  CardSlot,
  createEmptySlots,
  fillSlots,
  playCardFromSlot,
  addCardToSlot,
  findEmptySlotIndex,
} from '../../utils/cardSlots';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GuinotePROGameTableProps {
  playerHand: CardType[];
  partnerHand: CardType[];
  leftOpponentHand: CardType[];
  rightOpponentHand: CardType[];
  playedCards: Array<{ card: CardType; playerId: string }>;
  currentPlayer: number;
  isDealing: boolean;
  gamePhase: 'dealing' | 'playing' | 'trick-collection' | 'game-over';
  deckCount: number;
  trumpCard?: CardType;
  onCardPlay: (card: CardType, index: number) => void;
  canPlayCard: (card: CardType) => boolean;
  onCante?: () => void;
  onChange7?: () => void;
  onExit?: () => void;
  canCante?: boolean;
  canChange7?: boolean;
}

type DealingPhase = 'initial' | 'trump' | 'postTrick' | null;

export const GuinotePROGameTable: React.FC<GuinotePROGameTableProps> = ({
  playerHand,
  partnerHand,
  leftOpponentHand,
  rightOpponentHand,
  playedCards,
  currentPlayer,
  isDealing,
  gamePhase,
  deckCount,
  trumpCard,
  onCardPlay,
  canPlayCard,
  onCante,
  onChange7,
  onExit,
  canCante = false,
  canChange7 = false,
}) => {
  const centerRef = useRef<View>(null);

  // Slot state management for each player
  const [playerSlots, setPlayerSlots] = useState<CardSlot[]>(
    createEmptySlots(),
  );
  const [partnerSlots, setPartnerSlots] = useState<CardSlot[]>(
    createEmptySlots(),
  );
  const [leftSlots, setLeftSlots] = useState<CardSlot[]>(createEmptySlots());
  const [rightSlots, setRightSlots] = useState<CardSlot[]>(createEmptySlots());

  // Track empty slots after cards are played
  const [emptySlotMap, setEmptySlotMap] = useState<Record<string, number>>({});

  // Animation state
  const [dealingPhase, setDealingPhase] = useState<DealingPhase>(null);
  const [isInitialDealComplete, setIsInitialDealComplete] = useState(false);

  // Previous hand states for comparison
  const prevPlayerHandRef = useRef<CardType[]>([]);
  const prevPartnerHandRef = useRef<CardType[]>([]);
  const prevLeftHandRef = useRef<CardType[]>([]);
  const prevRightHandRef = useRef<CardType[]>([]);

  // Helper to find which card was played
  const findPlayedCard = (
    prevHand: CardType[],
    currentHand: CardType[],
  ): CardType | null => {
    return (
      prevHand.find(card => !currentHand.some(c => c.id === card.id)) || null
    );
  };

  // Helper to find which card was added
  const findNewCard = (
    prevHand: CardType[],
    currentHand: CardType[],
  ): CardType | null => {
    return (
      currentHand.find(card => !prevHand.some(c => c.id === card.id)) || null
    );
  };

  // Helper to find card's slot index
  const findCardSlotIndex = (slots: CardSlot[], card: CardType): number => {
    const slot = slots.find(s => s.card?.id === card.id);
    return slot ? slot.slotIndex : -1;
  };

  // Sync player hand to slots
  useEffect(() => {
    const prevHand = prevPlayerHandRef.current;

    if (playerHand.length === 0 && prevHand.length === 0) {
      // Initial empty state
      return;
    }

    if (
      prevHand.length === 0 &&
      playerHand.length > 0 &&
      !isInitialDealComplete
    ) {
      // Initial deal - fill slots sequentially
      const newSlots = fillSlots(playerHand);
      setPlayerSlots(newSlots);
    } else if (prevHand.length > playerHand.length) {
      // Card was played - create gap
      const playedCard = findPlayedCard(prevHand, playerHand);
      if (playedCard) {
        const slotIndex = findCardSlotIndex(playerSlots, playedCard);
        if (slotIndex !== -1) {
          const { newSlots } = playCardFromSlot(playerSlots, slotIndex);
          setPlayerSlots(newSlots);
          setEmptySlotMap(prev => ({ ...prev, player: slotIndex }));
        }
      }
    } else if (prevHand.length < playerHand.length && prevHand.length > 0) {
      // Card was added - fill empty slot
      const newCard = findNewCard(prevHand, playerHand);
      if (newCard) {
        const emptySlot =
          emptySlotMap.player ?? findEmptySlotIndex(playerSlots);
        if (emptySlot !== null) {
          const newSlots = addCardToSlot(playerSlots, newCard, emptySlot);
          setPlayerSlots(newSlots);
          setEmptySlotMap(prev => {
            const updated = { ...prev };
            delete updated.player;
            return updated;
          });
        }
      }
    }

    prevPlayerHandRef.current = playerHand;
  }, [playerHand, isInitialDealComplete, playerSlots, emptySlotMap]);

  // Sync partner hand to slots
  useEffect(() => {
    const prevHand = prevPartnerHandRef.current;

    if (partnerHand.length === 0 && prevHand.length === 0) {
      return;
    }

    if (
      prevHand.length === 0 &&
      partnerHand.length > 0 &&
      !isInitialDealComplete
    ) {
      const newSlots = fillSlots(partnerHand);
      setPartnerSlots(newSlots);
    } else if (prevHand.length > partnerHand.length) {
      const playedCard = findPlayedCard(prevHand, partnerHand);
      if (playedCard) {
        const slotIndex = findCardSlotIndex(partnerSlots, playedCard);
        if (slotIndex !== -1) {
          const { newSlots } = playCardFromSlot(partnerSlots, slotIndex);
          setPartnerSlots(newSlots);
          setEmptySlotMap(prev => ({ ...prev, partner: slotIndex }));
        }
      }
    } else if (prevHand.length < partnerHand.length && prevHand.length > 0) {
      const newCard = findNewCard(prevHand, partnerHand);
      if (newCard) {
        const emptySlot =
          emptySlotMap.partner ?? findEmptySlotIndex(partnerSlots);
        if (emptySlot !== null) {
          const newSlots = addCardToSlot(partnerSlots, newCard, emptySlot);
          setPartnerSlots(newSlots);
          setEmptySlotMap(prev => {
            const updated = { ...prev };
            delete updated.partner;
            return updated;
          });
        }
      }
    }

    prevPartnerHandRef.current = partnerHand;
  }, [partnerHand, isInitialDealComplete, partnerSlots, emptySlotMap]);

  // Sync left opponent hand to slots
  useEffect(() => {
    const prevHand = prevLeftHandRef.current;

    if (leftOpponentHand.length === 0 && prevHand.length === 0) {
      return;
    }

    if (
      prevHand.length === 0 &&
      leftOpponentHand.length > 0 &&
      !isInitialDealComplete
    ) {
      const newSlots = fillSlots(leftOpponentHand);
      setLeftSlots(newSlots);
    } else if (prevHand.length > leftOpponentHand.length) {
      const playedCard = findPlayedCard(prevHand, leftOpponentHand);
      if (playedCard) {
        const slotIndex = findCardSlotIndex(leftSlots, playedCard);
        if (slotIndex !== -1) {
          const { newSlots } = playCardFromSlot(leftSlots, slotIndex);
          setLeftSlots(newSlots);
          setEmptySlotMap(prev => ({ ...prev, left: slotIndex }));
        }
      }
    } else if (
      prevHand.length < leftOpponentHand.length &&
      prevHand.length > 0
    ) {
      const newCard = findNewCard(prevHand, leftOpponentHand);
      if (newCard) {
        const emptySlot = emptySlotMap.left ?? findEmptySlotIndex(leftSlots);
        if (emptySlot !== null) {
          const newSlots = addCardToSlot(leftSlots, newCard, emptySlot);
          setLeftSlots(newSlots);
          setEmptySlotMap(prev => {
            const updated = { ...prev };
            delete updated.left;
            return updated;
          });
        }
      }
    }

    prevLeftHandRef.current = leftOpponentHand;
  }, [leftOpponentHand, isInitialDealComplete, leftSlots, emptySlotMap]);

  // Sync right opponent hand to slots
  useEffect(() => {
    const prevHand = prevRightHandRef.current;

    if (rightOpponentHand.length === 0 && prevHand.length === 0) {
      return;
    }

    if (
      prevHand.length === 0 &&
      rightOpponentHand.length > 0 &&
      !isInitialDealComplete
    ) {
      const newSlots = fillSlots(rightOpponentHand);
      setRightSlots(newSlots);
    } else if (prevHand.length > rightOpponentHand.length) {
      const playedCard = findPlayedCard(prevHand, rightOpponentHand);
      if (playedCard) {
        const slotIndex = findCardSlotIndex(rightSlots, playedCard);
        if (slotIndex !== -1) {
          const { newSlots } = playCardFromSlot(rightSlots, slotIndex);
          setRightSlots(newSlots);
          setEmptySlotMap(prev => ({ ...prev, right: slotIndex }));
        }
      }
    } else if (
      prevHand.length < rightOpponentHand.length &&
      prevHand.length > 0
    ) {
      const newCard = findNewCard(prevHand, rightOpponentHand);
      if (newCard) {
        const emptySlot = emptySlotMap.right ?? findEmptySlotIndex(rightSlots);
        if (emptySlot !== null) {
          const newSlots = addCardToSlot(rightSlots, newCard, emptySlot);
          setRightSlots(newSlots);
          setEmptySlotMap(prev => {
            const updated = { ...prev };
            delete updated.right;
            return updated;
          });
        }
      }
    }

    prevRightHandRef.current = rightOpponentHand;
  }, [rightOpponentHand, isInitialDealComplete, rightSlots, emptySlotMap]);

  // Handle initial dealing animation
  useEffect(() => {
    if (isDealing && gamePhase === 'dealing' && playerHand.length === 0) {
      // Start initial deal animation
      setDealingPhase('initial');
    }
  }, [isDealing, gamePhase, playerHand.length]);

  // Handle post-trick dealing
  useEffect(() => {
    // Detect when cards are being added after initial deal
    const hasEmptySlots = Object.keys(emptySlotMap).length > 0;
    const isPlayingPhase = gamePhase === 'playing';
    const cardsBeingAdded =
      prevPlayerHandRef.current.length < playerHand.length ||
      prevPartnerHandRef.current.length < partnerHand.length ||
      prevLeftHandRef.current.length < leftOpponentHand.length ||
      prevRightHandRef.current.length < rightOpponentHand.length;

    if (
      hasEmptySlots &&
      isPlayingPhase &&
      cardsBeingAdded &&
      isInitialDealComplete
    ) {
      setDealingPhase('postTrick');
    }
  }, [
    gamePhase,
    playerHand,
    partnerHand,
    leftOpponentHand,
    rightOpponentHand,
    emptySlotMap,
    isInitialDealComplete,
  ]);

  // Bridge onCardPlay with slots
  const handleCardPlay = (card: CardType, slotIndex: number) => {
    if (!canPlayCard(card)) return;

    // Find the array index for the parent component
    const arrayIndex = playerHand.findIndex(c => c.id === card.id);
    if (arrayIndex !== -1) {
      onCardPlay(card, arrayIndex);
    }
  };

  // Handle dealing animation complete
  const handleDealingComplete = () => {
    setDealingPhase(null);
    if (!isInitialDealComplete) {
      setIsInitialDealComplete(true);
    }
  };

  // Handle card dealt callback
  const handleCardDealt = (
    playerIndex: number,
    cardIndex: number,
    card: CardType,
  ) => {
    // This callback can be used to update slots during animation if needed
    // For now, the slots are synced via the useEffect hooks
  };

  // Create deck for animation (reconstruct from current hands)
  const createAnimationDeck = (): CardType[] => {
    // For initial deal, we need to create a deck
    // This is a simplified version - in production, you'd get this from the game state
    return [
      ...playerHand,
      ...partnerHand,
      ...leftOpponentHand,
      ...rightOpponentHand,
    ];
  };

  // Create post-trick deal cards
  const createPostTrickDealCards = () => {
    const dealCards: Array<{
      card: CardType;
      playerId: PlayerId;
      slotIndex: number;
    }> = [];

    // Check each player for new cards to deal
    if (emptySlotMap.player !== undefined) {
      const newCard = findNewCard(prevPlayerHandRef.current, playerHand);
      if (newCard) {
        dealCards.push({
          card: newCard,
          playerId: 'player0' as PlayerId,
          slotIndex: emptySlotMap.player,
        });
      }
    }

    if (emptySlotMap.partner !== undefined) {
      const newCard = findNewCard(prevPartnerHandRef.current, partnerHand);
      if (newCard) {
        dealCards.push({
          card: newCard,
          playerId: 'player2' as PlayerId,
          slotIndex: emptySlotMap.partner,
        });
      }
    }

    if (emptySlotMap.left !== undefined) {
      const newCard = findNewCard(prevLeftHandRef.current, leftOpponentHand);
      if (newCard) {
        dealCards.push({
          card: newCard,
          playerId: 'player3' as PlayerId,
          slotIndex: emptySlotMap.left,
        });
      }
    }

    if (emptySlotMap.right !== undefined) {
      const newCard = findNewCard(prevRightHandRef.current, rightOpponentHand);
      if (newCard) {
        dealCards.push({
          card: newCard,
          playerId: 'player1' as PlayerId,
          slotIndex: emptySlotMap.right,
        });
      }
    }

    return dealCards;
  };

  return (
    <GameBoard>
      <PlayerPositions>
        {/* Dealing Animation Coordinator */}
        {dealingPhase && (
          <DealingAnimationCoordinator
            dealingPhase={dealingPhase}
            deck={
              dealingPhase === 'initial' ? createAnimationDeck() : undefined
            }
            players={[
              { id: 'player0' as PlayerId },
              { id: 'player1' as PlayerId },
              { id: 'player2' as PlayerId },
              { id: 'player3' as PlayerId },
            ]}
            dealerIndex={0}
            postTrickDealCards={
              dealingPhase === 'postTrick'
                ? createPostTrickDealCards()
                : undefined
            }
            trumpCard={trumpCard}
            onComplete={handleDealingComplete}
            onCardDealt={handleCardDealt}
          />
        )}

        {/* Deck and Trump */}
        {deckCount > 0 && (
          <View style={styles.deckContainer}>
            <DeckPile
              cardsRemaining={deckCount}
              trumpCard={trumpCard}
              showTrump={!!trumpCard}
            />
          </View>
        )}

        {/* Player Hand (Bottom) - Now using slots */}
        <PlayerHand
          slots={playerSlots}
          onCardPress={handleCardPlay}
          canPlay={canPlayCard}
          isCurrentPlayer={currentPlayer === 0}
        />

        {/* Partner Hand (Top) - Now using slots */}
        <OpponentHand
          position="top"
          slots={partnerSlots}
          isPartner={true}
          isCurrentPlayer={currentPlayer === 2}
        />

        {/* Left Opponent - Now using slots */}
        <OpponentHand
          position="left"
          slots={leftSlots}
          isCurrentPlayer={currentPlayer === 3}
        />

        {/* Right Opponent - Now using slots */}
        <OpponentHand
          position="right"
          slots={rightSlots}
          isCurrentPlayer={currentPlayer === 1}
        />

        {/* Center Play Area */}
        <View ref={centerRef} style={styles.centerContainer}>
          <CenterPlayArea cards={playedCards} />
        </View>

        {/* Action Buttons */}
        <ActionButtons
          onCante={onCante || (() => {})}
          onChange7={onChange7 || (() => {})}
          onExit={onExit || (() => {})}
          canCante={canCante}
          canChange7={canChange7}
        />
      </PlayerPositions>
    </GameBoard>
  );
};

const styles = StyleSheet.create({
  deckContainer: {
    position: 'absolute',
    left: LAYOUT.deck.x - CARD_WIDTH / 2,
    top: LAYOUT.deck.y - CARD_HEIGHT / 2,
    zIndex: LAYOUT.deck.zIndex,
  },
  centerContainer: {
    position: 'absolute',
    left: LAYOUT.centerArea.x - LAYOUT.centerArea.radius,
    top: LAYOUT.centerArea.y - LAYOUT.centerArea.radius,
    width: LAYOUT.centerArea.radius * 2,
    height: LAYOUT.centerArea.radius * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GuinotePROGameTable;
