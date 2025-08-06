import {
  SharedValue,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LAYOUT } from '../components/game/PlayerPositions';

interface CardAnimationConfig {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rotation: SharedValue<number>;
  scale: SharedValue<number>;
  zIndex: SharedValue<number>;
}

interface PlayAnimationOptions {
  from: { x: number; y: number };
  to?: { x: number; y: number };
  onComplete?: () => void;
  playedIndex?: number;
}

export class PlayAnimator {
  private playDuration = 300;
  private liftDuration = 150;
  private collectDelay = 1000;
  private collectDuration = 600;

  // Calculate center position based on cards already played
  private getCenterPosition(playedIndex: number = 0): {
    x: number;
    y: number;
    rotation: number;
  } {
    const center = LAYOUT.centerArea;
    const spread = center.cardSpread;

    // Arrange in a slight circle pattern
    const angleStep = 15; // degrees
    const angle = playedIndex * angleStep - 45; // Start from -45 degrees
    const radius = playedIndex * spread * 0.3;

    const x = center.x + Math.cos((angle * Math.PI) / 180) * radius;
    const y = center.y + Math.sin((angle * Math.PI) / 180) * radius;

    // Add slight random rotation for natural look
    const rotations = [-5, 10, -15, 20];
    const rotation = rotations[playedIndex % rotations.length];

    return { x, y, rotation };
  }

  playCard(config: CardAnimationConfig, options: PlayAnimationOptions) {
    const { from, to, onComplete, playedIndex = 0 } = options;
    const centerPos = to || this.getCenterPosition(playedIndex);

    // Phase 1: Lift card
    config.zIndex.value = 100;
    config.scale.value = withSequence(
      withTiming(1.2, {
        duration: this.liftDuration,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(1, {
        duration: this.playDuration - this.liftDuration,
        easing: Easing.inOut(Easing.quad),
      }),
    );

    // Phase 2: Move to center with parabolic path
    const midX = (from.x + centerPos.x) / 2;
    const midY = from.y - 50; // Arc height

    // Animate position
    config.x.value = withTiming(centerPos.x, {
      duration: this.playDuration,
      easing: Easing.out(Easing.cubic),
    });

    // Y animation with arc
    config.y.value = withSequence(
      withTiming(midY, {
        duration: this.playDuration * 0.4,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(centerPos.y, {
        duration: this.playDuration * 0.6,
        easing: Easing.in(Easing.quad),
      }),
    );

    // Rotation during flight
    if ('rotation' in centerPos) {
      config.rotation.value = withTiming(centerPos.rotation, {
        duration: this.playDuration,
        easing: Easing.inOut(Easing.quad),
      });
    }

    // Phase 3: Landing bounce
    setTimeout(() => {
      config.y.value = withSequence(
        withSpring(centerPos.y - 5, { damping: 8, stiffness: 200 }),
        withSpring(centerPos.y, { damping: 10, stiffness: 300 }),
      );

      if (onComplete) {
        runOnJS(onComplete)();
      }
    }, this.playDuration);
  }

  collectTrick(
    cards: CardAnimationConfig[],
    winner: 'bottom' | 'top' | 'left' | 'right',
    onComplete?: () => void,
  ) {
    const winnerPos = LAYOUT.players[winner];

    // Calculate collection position (slightly offset from player)
    const collectionOffset = {
      bottom: { x: 100, y: 0 },
      top: { x: -100, y: 0 },
      left: { x: 0, y: 50 },
      right: { x: 0, y: -50 },
    };

    const targetX = winnerPos.x + collectionOffset[winner].x;
    const targetY = winnerPos.y + collectionOffset[winner].y;

    cards.forEach((card, index) => {
      // Staggered collection
      const delay = this.collectDelay + index * 50;

      setTimeout(() => {
        // Sweep animation
        card.x.value = withTiming(targetX + index * 2, {
          duration: this.collectDuration,
          easing: Easing.inOut(Easing.cubic),
        });

        card.y.value = withTiming(targetY + index * 2, {
          duration: this.collectDuration,
          easing: Easing.inOut(Easing.cubic),
        });

        card.rotation.value = withTiming(Math.random() * 10 - 5, {
          duration: this.collectDuration,
          easing: Easing.out(Easing.quad),
        });

        card.scale.value = withTiming(0.8, {
          duration: this.collectDuration,
          easing: Easing.out(Easing.quad),
        });

        // Fade out after reaching destination
        if (index === cards.length - 1) {
          setTimeout(() => {
            cards.forEach(c => {
              c.scale.value = withTiming(0, { duration: 200 });
              c.rotation.value = withTiming(180, { duration: 200 });
            });

            if (onComplete) {
              runOnJS(onComplete)();
            }
          }, this.collectDuration);
        }
      }, delay);
    });
  }
}
