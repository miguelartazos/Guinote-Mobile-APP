import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export function useConvexGame(roomId?: Id<'rooms'> | string) {
  // Validate roomId format
  const validRoomId =
    roomId &&
    typeof roomId === 'string' &&
    (roomId.startsWith('k') || roomId.startsWith('j'))
      ? (roomId as Id<'rooms'>)
      : undefined;

  // Queries
  const room = useQuery(
    api.rooms.getRoom,
    validRoomId ? { roomId: validRoomId } : 'skip',
  );

  const gameState = useQuery(
    api.gameQueries.getGameState,
    validRoomId ? { roomId: validRoomId } : 'skip',
  );

  // Mutations
  const playCard = useMutation(api.gameActions.playCard);
  const cantar = useMutation(api.gameActions.cantar);
  const cambiar7 = useMutation(api.gameActions.cambiar7);
  const toggleReady = useMutation(api.rooms.toggleReady);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const addAIPlayer = useMutation(api.rooms.addAIPlayer);

  return {
    // State
    room,
    gameState,
    isLoading:
      room === undefined ||
      (room && room.status === 'playing' && gameState === undefined),

    // Actions
    actions: {
      playCard: async (cardId: string, userId: Id<'users'>) => {
        if (!validRoomId) throw new Error('No valid room ID');
        await playCard({ roomId: validRoomId, userId, cardId });
      },

      cantar: async (
        suit: 'oros' | 'copas' | 'espadas' | 'bastos',
        userId: Id<'users'>,
      ) => {
        if (!validRoomId) throw new Error('No valid room ID');
        await cantar({ roomId: validRoomId, userId, suit });
      },

      cambiar7: async (userId: Id<'users'>) => {
        if (!validRoomId) throw new Error('No valid room ID');
        await cambiar7({ roomId: validRoomId, userId });
      },

      toggleReady: async (userId: Id<'users'>) => {
        if (!validRoomId) throw new Error('No valid room ID');
        await toggleReady({ roomId: validRoomId, userId });
      },

      leaveRoom: async (userId: Id<'users'>) => {
        if (!validRoomId) throw new Error('No valid room ID');
        await leaveRoom({ roomId: validRoomId, userId });
      },

      addAI: async (difficulty: 'easy' | 'medium' | 'hard') => {
        if (!validRoomId) throw new Error('No valid room ID');
        await addAIPlayer({ roomId: validRoomId, difficulty });
      },
    },
  };
}
