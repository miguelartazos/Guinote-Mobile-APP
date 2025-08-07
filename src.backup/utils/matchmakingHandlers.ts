import type { Id } from '../../convex/_generated/dataModel';

export interface MatchmakingStatus {
  status: 'idle' | 'searching' | 'found' | 'error';
  playersInQueue: number;
  waitTime: number;
  estimatedTime: number;
  eloRange: number;
}

export interface UserRoom {
  roomId: string;
  code: string;
}

// Pure function to calculate new status based on queue info
export const updateQueueStatus = (
  currentStatus: MatchmakingStatus,
  queueInfo: { playersInQueue: number } | null,
): MatchmakingStatus => {
  if (!queueInfo || currentStatus.status !== 'searching') {
    return currentStatus;
  }

  return {
    ...currentStatus,
    playersInQueue: queueInfo.playersInQueue,
  };
};

// Pure function to calculate wait time and ELO range
export const calculateWaitTimeStatus = (
  currentStatus: MatchmakingStatus,
  startTime: number | null,
  currentTime: number,
): MatchmakingStatus => {
  if (currentStatus.status !== 'searching' || !startTime) {
    return currentStatus;
  }

  const elapsed = Math.floor((currentTime - startTime) / 1000);
  return {
    ...currentStatus,
    waitTime: elapsed,
    eloRange: Math.min(500, 100 + Math.floor(elapsed / 10) * 50),
  };
};

// Pure function to determine if match was found
export const checkMatchFound = (
  userRooms: UserRoom | null,
  currentStatus: MatchmakingStatus,
): { matchFound: boolean; roomId?: string; roomCode?: string } => {
  if (!userRooms || currentStatus.status !== 'searching') {
    return { matchFound: false };
  }

  if (userRooms.roomId && userRooms.code) {
    return {
      matchFound: true,
      roomId: userRooms.roomId,
      roomCode: userRooms.code,
    };
  }

  return { matchFound: false };
};

// Navigation intent object instead of direct navigation
export interface NavigationIntent {
  type: 'navigate';
  screen: string;
  params: {
    roomId: string;
    roomCode: string;
  };
}

export const createNavigationIntent = (
  roomId: string,
  roomCode: string,
): NavigationIntent => ({
  type: 'navigate',
  screen: 'NetworkGame',
  params: { roomId, roomCode },
});

// Error handling
export const createErrorStatus = (error: unknown): MatchmakingStatus => ({
  status: 'error',
  playersInQueue: 0,
  waitTime: 0,
  estimatedTime: 45,
  eloRange: 100,
});

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error al buscar partida';
};
