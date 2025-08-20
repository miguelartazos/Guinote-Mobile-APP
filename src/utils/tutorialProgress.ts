import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TutorialType, TutorialStepId } from '../types/game.types';

const TUTORIAL_PROGRESS_KEY = '@guinote2_tutorial_progress';

export type TutorialProgress = {
  tutorialType: TutorialType;
  currentStepIndex: number;
  completedSteps: TutorialStepId[];
  startedAt: string;
  lastUpdated: string;
  isCompleted: boolean;
};

export type TutorialCompletionRecord = {
  tutorialType: TutorialType;
  completedAt: string;
  duration: number; // in milliseconds
};

export type AllTutorialProgress = {
  currentProgress?: TutorialProgress;
  completedTutorials: TutorialCompletionRecord[];
};

const DEFAULT_PROGRESS: AllTutorialProgress = {
  currentProgress: undefined,
  completedTutorials: [],
};

export async function loadTutorialProgress(): Promise<AllTutorialProgress> {
  try {
    const stored = await AsyncStorage.getItem(TUTORIAL_PROGRESS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading tutorial progress:', error);
  }
  return DEFAULT_PROGRESS;
}

export async function saveTutorialProgress(progress: TutorialProgress): Promise<void> {
  try {
    const allProgress = await loadTutorialProgress();
    allProgress.currentProgress = {
      ...progress,
      lastUpdated: new Date().toISOString(),
    };
    await AsyncStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error('Error saving tutorial progress:', error);
  }
}

export async function completeTutorial(
  tutorialType: TutorialType,
  startedAt: string,
): Promise<void> {
  try {
    const allProgress = await loadTutorialProgress();

    // Calculate duration
    const duration = Date.now() - new Date(startedAt).getTime();

    // Add to completed tutorials
    allProgress.completedTutorials.push({
      tutorialType,
      completedAt: new Date().toISOString(),
      duration,
    });

    // Clear current progress if it matches
    if (allProgress.currentProgress?.tutorialType === tutorialType) {
      allProgress.currentProgress = undefined;
    }

    await AsyncStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error('Error completing tutorial:', error);
  }
}

export async function clearCurrentProgress(): Promise<void> {
  try {
    const allProgress = await loadTutorialProgress();
    allProgress.currentProgress = undefined;
    await AsyncStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error('Error clearing tutorial progress:', error);
  }
}

export async function resetAllTutorialProgress(): Promise<void> {
  try {
    await AsyncStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify(DEFAULT_PROGRESS));
  } catch (error) {
    console.error('Error resetting all tutorial progress:', error);
  }
}

export async function hasCompletedTutorial(tutorialType: TutorialType): Promise<boolean> {
  try {
    const allProgress = await loadTutorialProgress();
    return allProgress.completedTutorials.some(record => record.tutorialType === tutorialType);
  } catch (error) {
    console.error('Error checking tutorial completion:', error);
    return false;
  }
}

export async function getTutorialCompletionStats(): Promise<{
  totalCompleted: number;
  totalDuration: number;
  averageDuration: number;
  completionDates: Record<string, string>;
}> {
  try {
    const allProgress = await loadTutorialProgress();
    const completed = allProgress.completedTutorials;

    if (completed.length === 0) {
      return {
        totalCompleted: 0,
        totalDuration: 0,
        averageDuration: 0,
        completionDates: {},
      };
    }

    const totalDuration = completed.reduce((sum, record) => sum + record.duration, 0);
    const completionDates = completed.reduce((acc, record) => {
      acc[record.tutorialType] = record.completedAt;
      return acc;
    }, {} as Record<string, string>);

    return {
      totalCompleted: completed.length,
      totalDuration,
      averageDuration: totalDuration / completed.length,
      completionDates,
    };
  } catch (error) {
    console.error('Error getting tutorial stats:', error);
    return {
      totalCompleted: 0,
      totalDuration: 0,
      averageDuration: 0,
      completionDates: {},
    };
  }
}
