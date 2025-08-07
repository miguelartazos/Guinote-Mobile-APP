import { Card } from '../types/game';

// Map card data to image paths
export const getCardImage = (card: Card) => {
  const suitMap = {
    oros: 'o',
    copas: 'c',
    espadas: 'e',
    bastos: 'b',
  };

  const suit = suitMap[card.suit];
  const imageName = `${suit}${card.value}`;

  // Return the require statement for the card image
  // This assumes images are named like: o1.png, c10.png, etc.
  try {
    return require(`../assets/images/cards/${imageName}.png`);
  } catch {
    // Fallback to a default card if image not found
    return require('../assets/images/cards/back.png');
  }
};
