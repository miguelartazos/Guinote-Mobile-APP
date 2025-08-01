import type {
  TutorialStepId,
  HelpSectionId,
  TutorialType,
  PlayerId,
  TeamId,
  GameId,
  CardId,
} from '../types/game.types';

export function tutorialStepId(id: string): TutorialStepId {
  return id as TutorialStepId;
}

export function helpSectionId(id: string): HelpSectionId {
  return id as HelpSectionId;
}

export function tutorialType(
  type: 'complete' | 'basic' | 'cantes' | 'special',
): TutorialType {
  return type as TutorialType;
}

export function playerId(id: string): PlayerId {
  return id as PlayerId;
}

export function teamId(id: string): TeamId {
  return id as TeamId;
}

export function gameId(id: string): GameId {
  return id as GameId;
}

export function cardId(id: string): CardId {
  return id as CardId;
}
