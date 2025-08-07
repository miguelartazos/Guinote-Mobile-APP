import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadTutorialProgress,
  saveTutorialProgress,
  completeTutorial,
  clearCurrentProgress,
  resetAllTutorialProgress,
  hasCompletedTutorial,
  getTutorialCompletionStats,
} from './tutorialProgress';
import { tutorialStepId, tutorialType } from './brandedTypes';

jest.mock('@react-native-async-storage/async-storage');

describe('tutorialProgress', () => {
  const mockProgress = {
    tutorialType: tutorialType('complete'),
    currentStepIndex: 3,
    completedSteps: [
      tutorialStepId('step1'),
      tutorialStepId('step2'),
      tutorialStepId('step3'),
    ],
    startedAt: '2024-01-01T10:00:00.000Z',
    lastUpdated: '2024-01-01T10:05:00.000Z',
    isCompleted: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('loadTutorialProgress', () => {
    test('returns default progress when no data stored', async () => {
      const result = await loadTutorialProgress();

      expect(result).toEqual({
        currentProgress: undefined,
        completedTutorials: [],
      });
    });

    test('returns stored progress', async () => {
      const storedData = {
        currentProgress: mockProgress,
        completedTutorials: [],
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(storedData),
      );

      const result = await loadTutorialProgress();

      expect(result).toEqual(storedData);
    });

    test('handles storage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error'),
      );

      const result = await loadTutorialProgress();

      expect(result).toEqual({
        currentProgress: undefined,
        completedTutorials: [],
      });
    });
  });

  describe('saveTutorialProgress', () => {
    test('saves progress with updated timestamp', async () => {
      const now = new Date('2024-01-01T11:00:00.000Z');
      jest.spyOn(Date, 'now').mockReturnValue(now.getTime());

      await saveTutorialProgress(mockProgress);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@guinote2_tutorial_progress',
        expect.stringContaining('"lastUpdated":"2024-01-01T11:00:00.000Z"'),
      );
    });

    test('preserves existing completed tutorials', async () => {
      const existingData = {
        currentProgress: undefined,
        completedTutorials: [
          {
            tutorialType: tutorialType('basic'),
            completedAt: '2024-01-01T09:00:00.000Z',
            duration: 300000,
          },
        ],
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(existingData),
      );

      await saveTutorialProgress(mockProgress);

      const savedData = JSON.parse(
        (AsyncStorage.setItem as jest.Mock).mock.calls[0][1],
      );
      expect(savedData.completedTutorials).toHaveLength(1);
      expect(savedData.currentProgress).toEqual(
        expect.objectContaining({
          tutorialType: mockProgress.tutorialType,
        }),
      );
    });
  });

  describe('completeTutorial', () => {
    test('adds tutorial to completed list', async () => {
      const startedAt = '2024-01-01T10:00:00.000Z';
      const now = new Date('2024-01-01T10:15:00.000Z');
      jest.spyOn(Date, 'now').mockReturnValue(now.getTime());

      await completeTutorial(tutorialType('complete'), startedAt);

      const savedData = JSON.parse(
        (AsyncStorage.setItem as jest.Mock).mock.calls[0][1],
      );
      expect(savedData.completedTutorials).toHaveLength(1);
      expect(savedData.completedTutorials[0]).toEqual({
        tutorialType: tutorialType('complete'),
        completedAt: '2024-01-01T10:15:00.000Z',
        duration: 900000, // 15 minutes
      });
    });

    test('clears current progress if matching tutorial type', async () => {
      const existingData = {
        currentProgress: mockProgress,
        completedTutorials: [],
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(existingData),
      );

      await completeTutorial(tutorialType('complete'), mockProgress.startedAt);

      const savedData = JSON.parse(
        (AsyncStorage.setItem as jest.Mock).mock.calls[0][1],
      );
      expect(savedData.currentProgress).toBeUndefined();
    });
  });

  describe('clearCurrentProgress', () => {
    test('clears only current progress', async () => {
      const existingData = {
        currentProgress: mockProgress,
        completedTutorials: [
          {
            tutorialType: tutorialType('basic'),
            completedAt: '2024-01-01T09:00:00.000Z',
            duration: 300000,
          },
        ],
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(existingData),
      );

      await clearCurrentProgress();

      const savedData = JSON.parse(
        (AsyncStorage.setItem as jest.Mock).mock.calls[0][1],
      );
      expect(savedData.currentProgress).toBeUndefined();
      expect(savedData.completedTutorials).toHaveLength(1);
    });
  });

  describe('resetAllTutorialProgress', () => {
    test('resets all progress to default', async () => {
      await resetAllTutorialProgress();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@guinote2_tutorial_progress',
        JSON.stringify({
          currentProgress: undefined,
          completedTutorials: [],
        }),
      );
    });
  });

  describe('hasCompletedTutorial', () => {
    test('returns true if tutorial completed', async () => {
      const existingData = {
        currentProgress: undefined,
        completedTutorials: [
          {
            tutorialType: tutorialType('basic'),
            completedAt: '2024-01-01T09:00:00.000Z',
            duration: 300000,
          },
        ],
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(existingData),
      );

      const result = await hasCompletedTutorial(tutorialType('basic'));

      expect(result).toBe(true);
    });

    test('returns false if tutorial not completed', async () => {
      const result = await hasCompletedTutorial(tutorialType('complete'));

      expect(result).toBe(false);
    });
  });

  describe('getTutorialCompletionStats', () => {
    test('returns stats for completed tutorials', async () => {
      const existingData = {
        currentProgress: undefined,
        completedTutorials: [
          {
            tutorialType: tutorialType('basic'),
            completedAt: '2024-01-01T09:00:00.000Z',
            duration: 300000, // 5 minutes
          },
          {
            tutorialType: tutorialType('complete'),
            completedAt: '2024-01-01T10:00:00.000Z',
            duration: 900000, // 15 minutes
          },
        ],
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(existingData),
      );

      const stats = await getTutorialCompletionStats();

      expect(stats).toEqual({
        totalCompleted: 2,
        totalDuration: 1200000, // 20 minutes total
        averageDuration: 600000, // 10 minutes average
        completionDates: {
          [tutorialType('basic')]: '2024-01-01T09:00:00.000Z',
          [tutorialType('complete')]: '2024-01-01T10:00:00.000Z',
        },
      });
    });

    test('returns empty stats when no tutorials completed', async () => {
      const stats = await getTutorialCompletionStats();

      expect(stats).toEqual({
        totalCompleted: 0,
        totalDuration: 0,
        averageDuration: 0,
        completionDates: {},
      });
    });
  });
});
