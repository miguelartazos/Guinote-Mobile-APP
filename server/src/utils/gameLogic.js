// Game logic utilities - adapted from client side
// This is a simplified version for the server

export function createDeck() {
  const suits = ['oros', 'copas', 'espadas', 'bastos'];
  const values = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  const deck = [];

  for (const suit of suits) {
    for (const value of values) {
      deck.push({
        id: `${suit}_${value}`,
        suit,
        value,
      });
    }
  }

  return deck;
}

export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealInitialCards(deck, playerIds) {
  const hands = new Map();
  const dealingDeck = [...deck];

  // Deal 6 cards to each player
  for (const playerId of playerIds) {
    const playerCards = [];
    for (let i = 0; i < 6; i++) {
      if (dealingDeck.length > 0) {
        playerCards.push(dealingDeck.pop());
      }
    }
    hands.set(playerId, playerCards);
  }

  return {
    hands,
    remainingDeck: dealingDeck,
  };
}

export function isValidPlay(
  card,
  playerHand,
  currentTrick,
  trumpSuit,
  phase,
  playerId,
  gameState,
) {
  // If first card of trick, any card is valid
  if (currentTrick.length === 0) {
    return true;
  }

  const leadCard = currentTrick[0].card;
  const leadSuit = leadCard.suit;

  // Get cards of the lead suit
  const sameSuitCards = playerHand.filter(c => c.suit === leadSuit);

  // Must follow suit if possible
  if (sameSuitCards.length > 0) {
    return card.suit === leadSuit;
  }

  // If can't follow suit, any card is valid
  return true;
}

export function calculateTrickWinner(trick, trumpSuit) {
  let winningCard = trick[0];
  let winningIndex = 0;

  const cardValue = card => {
    const baseValue = {
      1: 11, // As
      3: 10, // Tres
      12: 4, // Rey
      11: 3, // Caballo
      10: 2, // Sota
      7: 1,
      6: 0.6,
      5: 0.5,
      4: 0.4,
      2: 0.2,
    };
    return baseValue[card.value] || 0;
  };

  for (let i = 1; i < trick.length; i++) {
    const currentCard = trick[i].card;
    const leadSuit = trick[0].card.suit;

    // Trump always wins
    if (currentCard.suit === trumpSuit && winningCard.card.suit !== trumpSuit) {
      winningCard = trick[i];
      winningIndex = i;
    }
    // Higher trump wins
    else if (
      currentCard.suit === trumpSuit &&
      winningCard.card.suit === trumpSuit
    ) {
      if (cardValue(currentCard) > cardValue(winningCard.card)) {
        winningCard = trick[i];
        winningIndex = i;
      }
    }
    // Follow suit with higher value
    else if (
      currentCard.suit === leadSuit &&
      winningCard.card.suit === leadSuit
    ) {
      if (cardValue(currentCard) > cardValue(winningCard.card)) {
        winningCard = trick[i];
        winningIndex = i;
      }
    }
  }

  return winningCard.playerId;
}

export function calculateTrickPoints(trick) {
  const cardPoints = {
    1: 11, // As
    3: 10, // Tres
    12: 4, // Rey
    11: 2, // Caballo
    10: 3, // Sota
    7: 0,
    6: 0,
    5: 0,
    4: 0,
    2: 0,
  };

  return trick.reduce((total, { card }) => {
    return total + (cardPoints[card.value] || 0);
  }, 0);
}

export function canCantar(playerHand, trumpSuit, existingCantes) {
  const suits = ['oros', 'copas', 'espadas', 'bastos'];
  const cantableSuits = [];

  for (const suit of suits) {
    // Check if already canted this suit
    if (existingCantes.some(c => c.suit === suit)) {
      continue;
    }

    // Need Rey (12) and Caballo (11) of same suit
    const hasRey = playerHand.some(c => c.suit === suit && c.value === 12);
    const hasCaballo = playerHand.some(c => c.suit === suit && c.value === 11);

    if (hasRey && hasCaballo) {
      cantableSuits.push(suit);
    }
  }

  return cantableSuits;
}

export function calculateCantePoints(suit, trumpSuit) {
  return suit === trumpSuit ? 40 : 20;
}

export function canCambiar7(playerHand, trumpCard, deckSize) {
  // Can only cambiar 7 if deck has cards
  if (deckSize === 0) return false;

  // Need 7 of trump suit and trump card must not be 7
  return (
    playerHand.some(c => c.suit === trumpCard.suit && c.value === 7) &&
    trumpCard.value !== 7
  );
}

export function getNextPlayerIndex(currentIndex, numPlayers) {
  return (currentIndex + 1) % numPlayers;
}

export function findPlayerTeam(playerId, gameState) {
  for (const team of gameState.teams) {
    if (team.playerIds.includes(playerId)) {
      return team.id;
    }
  }
  return null;
}

export function isGameOver(gameState) {
  const WINNING_SCORE = 101;
  const MINIMUM_CARD_POINTS = 30;

  return gameState.teams.some(
    team =>
      team.score >= WINNING_SCORE && team.cardPoints >= MINIMUM_CARD_POINTS,
  );
}

export function shouldStartVueltas(gameState) {
  const WINNING_SCORE = 101;
  const MINIMUM_CARD_POINTS = 30;

  // Check if any team has reached 101 but not 30 card points
  const noWinner = !gameState.teams.some(
    team =>
      team.score >= WINNING_SCORE && team.cardPoints >= MINIMUM_CARD_POINTS,
  );

  // Check if all hands are empty (game round complete)
  const allHandsEmpty = Array.from(gameState.hands.values()).every(
    hand => hand.length === 0,
  );

  return noWinner && allHandsEmpty && !gameState.isVueltas;
}

export function canDeclareVictory(teamId, gameState) {
  if (!gameState.isVueltas || !gameState.canDeclareVictory) {
    return false;
  }

  // Team that won last trick in first hand can declare
  if (gameState.lastTrickWinnerTeam !== teamId) {
    return false;
  }

  // Check if team has enough points
  const team = gameState.teams.find(t => t.id === teamId);
  const initialScore = gameState.initialScores?.get(teamId) || 0;

  return team && team.score >= initialScore;
}
