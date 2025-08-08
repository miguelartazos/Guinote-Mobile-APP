import {
  SharedValue,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LAYOUT } from '../components/game/PlayerPositions';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type DealDirection = 'fromTop' | 'fromBottom' | 'fromLeft' | 'fromRight';
export type PlayerPosition = 'bottom' | 'top' | 'left' | 'right';

interface AnimationConfig {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rotation: SharedValue<number>;
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
}

export class DealingAnimator {
  private dealDelay = 150; // ms between each card
  private cardDuration = 400; // ms for each card animation

  // Get bezier control points for curved paths
  private getBezierControlPoints(
    from: PlayerPosition,
    to: PlayerPosition,
  ): { cx1: number; cy1: number; cx2: number; cy2: number } {
    const fromPos = LAYOUT.players[from];
    const toPos = LAYOUT.players[to];

    // Calculate control points for natural arc
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2;

    // Add curve based on direction
    let cx1 = midX;
    let cy1 = midY;
    let cx2 = midX;
    let cy2 = midY;

    if (from === 'top' && to === 'bottom') {
      cx1 = midX - SCREEN_WIDTH * 0.1;
      cy1 = midY - SCREEN_HEIGHT * 0.1;
      cx2 = midX + SCREEN_WIDTH * 0.1;
      cy2 = midY + SCREEN_HEIGHT * 0.1;
    } else if (from === 'bottom' && to === 'top') {
      cx1 = midX + SCREEN_WIDTH * 0.1;
      cy1 = midY + SCREEN_HEIGHT * 0.1;
      cx2 = midX - SCREEN_WIDTH * 0.1;
      cy2 = midY - SCREEN_HEIGHT * 0.1;
    } else if (from === 'left' && to === 'right') {
      cx1 = midX;
      cy1 = midY - SCREEN_HEIGHT * 0.15;
      cx2 = midX;
      cy2 = midY - SCREEN_HEIGHT * 0.1;
    } else if (from === 'right' && to === 'left') {
      cx1 = midX;
      cy1 = midY + SCREEN_HEIGHT * 0.1;
      cx2 = midX;
      cy2 = midY + SCREEN_HEIGHT * 0.15;
    }

    return { cx1, cy1, cx2, cy2 };
  }

  // Calculate position along bezier curve
  private bezierPoint(
    t: number,
    p0: number,
    p1: number,
    p2: number,
    p3: number,
  ): number {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    return uuu * p0 + 3 * uu * t * p1 + 3 * u * tt * p2 + ttt * p3;
  }

  dealCard(
    config: AnimationConfig,
    from: PlayerPosition,
    to: PlayerPosition,
    cardIndex: number,
    onComplete?: () => void,
  ) {
    const fromPos = LAYOUT.players[from];
    const toPos = LAYOUT.players[to];
    const delay = cardIndex * this.dealDelay;

    // Set initial position at deck
    config.x.value = LAYOUT.deck.x;
    config.y.value = LAYOUT.deck.y;
    config.scale.value = 0.7;
    config.opacity.value = 0;
    config.rotation.value = 0;

    // Get control points for curved path
    const { cx1, cy1, cx2, cy2 } = this.getBezierControlPoints(from, to);

    // Animate to destination
    config.opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));

    // Scale animation
    config.scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.1, { duration: this.cardDuration * 0.3 }),
        withTiming(1, { duration: this.cardDuration * 0.7 }),
      ),
    );

    // Rotation during flight
    const rotationStart = from === 'top' || from === 'bottom' ? 0 : -90;
    const rotationEnd = from === 'top' ? 180 : from === 'bottom' ? -180 : 0;

    config.rotation.value = withDelay(
      delay,
      withTiming(rotationEnd, {
        duration: this.cardDuration,
        easing: Easing.out(Easing.quad),
      }),
    );

    // Position animation along bezier curve
    const animatePosition = () => {
      'worklet';
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / this.cardDuration, 1);

        // Ease out quad
        const t = 1 - (1 - progress) * (1 - progress);

        // Calculate position along bezier curve
        config.x.value = this.bezierPoint(t, LAYOUT.deck.x, cx1, cx2, toPos.x);
        config.y.value = this.bezierPoint(t, LAYOUT.deck.y, cy1, cy2, toPos.y);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Add bounce on landing
          config.y.value = withSequence(
            withSpring(toPos.y - 5, { damping: 8, stiffness: 200 }),
            withSpring(toPos.y, { damping: 10, stiffness: 300 }),
          );

          if (onComplete) {
            runOnJS(onComplete)();
          }
        }
      };

      setTimeout(animate, delay);
    };

    animatePosition();
  }

  dealInitialHand(
    cards: AnimationConfig[],
    playerPositions: PlayerPosition[],
    dealerPosition: PlayerPosition,
  ) {
    const dealingOrder = [
      // First round - 3 cards each
      ...playerPositions
        .map((pos, playerIndex) =>
          [0, 1, 2].map(cardIndex => ({
            playerIndex,
            cardIndex,
            globalIndex: playerIndex * 3 + cardIndex,
          })),
        )
        .flat(),
      // Second round - 3 more cards each
      ...playerPositions
        .map((pos, playerIndex) =>
          [3, 4, 5].map(cardIndex => ({
            playerIndex,
            cardIndex,
            globalIndex: 12 + playerIndex * 3 + (cardIndex - 3),
          })),
        )
        .flat(),
    ];

    dealingOrder.forEach(({ playerIndex, cardIndex, globalIndex }) => {
      const targetPosition = playerPositions[playerIndex];
      const card = cards[playerIndex * 6 + cardIndex];

      if (card) {
        this.dealCard(card, dealerPosition, targetPosition, globalIndex);
      }
    });
  }
}
