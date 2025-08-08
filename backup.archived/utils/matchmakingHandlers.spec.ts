// Jest test file
import {
  updateQueueStatus,
  calculateWaitTimeStatus,
  checkMatchFound,
  createNavigationIntent,
  createErrorStatus,
  getErrorMessage,
  type MatchmakingStatus,
  type UserRoom,
} from './matchmakingHandlers';

describe('matchmakingHandlers', () => {
  const createMockStatus = (
    overrides: Partial<MatchmakingStatus> = {},
  ): MatchmakingStatus => ({
    status: 'idle',
    playersInQueue: 0,
    waitTime: 0,
    estimatedTime: 45,
    eloRange: 100,
    ...overrides,
  });

  describe('updateQueueStatus', () => {
    it('should update players in queue when searching', () => {
      const currentStatus = createMockStatus({ status: 'searching' });
      const queueInfo = { playersInQueue: 5 };

      const result = updateQueueStatus(currentStatus, queueInfo);

      expect(result.playersInQueue).toBe(5);
      expect(result.status).toBe('searching');
    });

    it('should not update when not searching', () => {
      const currentStatus = createMockStatus({ status: 'idle' });
      const queueInfo = { playersInQueue: 5 };

      const result = updateQueueStatus(currentStatus, queueInfo);

      expect(result).toEqual(currentStatus);
    });

    it('should handle null queue info', () => {
      const currentStatus = createMockStatus({ status: 'searching' });

      const result = updateQueueStatus(currentStatus, null);

      expect(result).toEqual(currentStatus);
    });
  });

  describe('calculateWaitTimeStatus', () => {
    it('should calculate wait time and ELO range correctly', () => {
      const currentStatus = createMockStatus({ status: 'searching' });
      const startTime = 1000;
      const currentTime = 16000; // 15 seconds later

      const result = calculateWaitTimeStatus(
        currentStatus,
        startTime,
        currentTime,
      );

      expect(result.waitTime).toBe(15);
      expect(result.eloRange).toBe(150); // 100 + floor(15/10) * 50
    });

    it('should cap ELO range at 500', () => {
      const currentStatus = createMockStatus({ status: 'searching' });
      const startTime = 1000;
      const currentTime = 101000; // 100 seconds later

      const result = calculateWaitTimeStatus(
        currentStatus,
        startTime,
        currentTime,
      );

      expect(result.waitTime).toBe(100);
      expect(result.eloRange).toBe(500); // Capped at 500
    });

    it('should not update when not searching', () => {
      const currentStatus = createMockStatus({ status: 'idle' });
      const startTime = 1000;
      const currentTime = 16000;

      const result = calculateWaitTimeStatus(
        currentStatus,
        startTime,
        currentTime,
      );

      expect(result).toEqual(currentStatus);
    });

    it('should handle null start time', () => {
      const currentStatus = createMockStatus({ status: 'searching' });

      const result = calculateWaitTimeStatus(currentStatus, null, 16000);

      expect(result).toEqual(currentStatus);
    });
  });

  describe('checkMatchFound', () => {
    it('should detect match when room is available', () => {
      const userRooms: UserRoom = { roomId: 'room123', code: 'ABC123' };
      const currentStatus = createMockStatus({ status: 'searching' });

      const result = checkMatchFound(userRooms, currentStatus);

      expect(result).toEqual({
        matchFound: true,
        roomId: 'room123',
        roomCode: 'ABC123',
      });
    });

    it('should not detect match when not searching', () => {
      const userRooms: UserRoom = { roomId: 'room123', code: 'ABC123' };
      const currentStatus = createMockStatus({ status: 'idle' });

      const result = checkMatchFound(userRooms, currentStatus);

      expect(result).toEqual({ matchFound: false });
    });

    it('should handle null user rooms', () => {
      const currentStatus = createMockStatus({ status: 'searching' });

      const result = checkMatchFound(null, currentStatus);

      expect(result).toEqual({ matchFound: false });
    });
  });

  describe('createNavigationIntent', () => {
    it('should create proper navigation intent', () => {
      const intent = createNavigationIntent('room123', 'ABC123');

      expect(intent).toEqual({
        type: 'navigate',
        screen: 'NetworkGame',
        params: {
          roomId: 'room123',
          roomCode: 'ABC123',
        },
      });
    });
  });

  describe('createErrorStatus', () => {
    it('should create error status with default values', () => {
      const error = new Error('Test error');
      const result = createErrorStatus(error);

      expect(result).toEqual({
        status: 'error',
        playersInQueue: 0,
        waitTime: 0,
        estimatedTime: 45,
        eloRange: 100,
      });
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error object', () => {
      const error = new Error('Custom error message');
      const message = getErrorMessage(error);

      expect(message).toBe('Custom error message');
    });

    it('should return default message for non-Error objects', () => {
      const message = getErrorMessage('string error');

      expect(message).toBe('Error al buscar partida');
    });
  });
});
