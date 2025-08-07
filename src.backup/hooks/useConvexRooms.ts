import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

export function useConvexRooms() {
  // Mutations
  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const updateRoomSettings = useMutation(api.rooms.updateRoomSettings);
  const kickPlayer = useMutation(api.rooms.kickPlayer);
  const removeAIPlayerMutation = useMutation(api.rooms.removeAIPlayer);

  // Queries
  const getPublicRooms = useQuery(api.rooms.getPublicRooms, {});

  return {
    // Actions
    createFriendsRoom: async (hostId: Id<'users'>) => {
      const result = await createRoom({
        hostId,
        gameMode: 'friends',
        isPublic: false,
      });
      return {
        id: result.roomId,
        code: result.code,
        roomId: result.roomId,
      };
    },

    createPublicRoom: async (hostId: Id<'users'>) => {
      const result = await createRoom({
        hostId,
        gameMode: 'casual',
        isPublic: true,
      });
      return {
        id: result.roomId,
        code: result.code,
        roomId: result.roomId,
      };
    },

    createRoom: async (args: {
      hostId: Id<'users'>;
      gameMode: 'ranked' | 'casual' | 'friends' | 'local';
      isPublic: boolean;
    }) => {
      const result = await createRoom(args);
      return {
        id: result.roomId,
        code: result.code,
        roomId: result.roomId,
      };
    },

    joinRoomByCode: async (code: string, userId: Id<'users'>) => {
      const result = await joinRoom({
        code,
        userId,
      });
      return {
        roomId: result.roomId,
        position: result.position,
      };
    },

    leaveRoom: async (roomId: Id<'rooms'>, userId: Id<'users'>) => {
      await leaveRoom({ roomId, userId });
    },

    updateSettings: async (
      roomId: Id<'rooms'>,
      hostId: Id<'users'>,
      settings: {
        gameMode?: 'ranked' | 'casual' | 'friends' | 'local';
        isPublic?: boolean;
      },
    ) => {
      await updateRoomSettings({
        roomId,
        hostId,
        ...settings,
      });
    },

    kickPlayer: async (
      roomId: Id<'rooms'>,
      hostId: Id<'users'>,
      playerToKick: Id<'users'>,
    ) => {
      await kickPlayer({
        roomId,
        hostId,
        playerToKick,
      });
    },

    removeAIPlayer: async (roomId: Id<'rooms'>, position: number) => {
      await removeAIPlayerMutation({ roomId, position });
    },

    // Data
    publicRooms: getPublicRooms || [],
  };
}

// Hook to get room details by code
export function useConvexRoomByCode(code: string | undefined) {
  const room = useQuery(api.rooms.getRoomByCode, code ? { code } : 'skip');
  return room;
}
