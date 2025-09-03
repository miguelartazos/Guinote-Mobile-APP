import type { Brand } from './brand.types';

export type FriendId = Brand<string, 'FriendId'>;
export type FriendRequestId = Brand<string, 'FriendRequestId'>;
export type UserId = Brand<string, 'UserId'>;

export interface Friend {
  id: FriendId;
  username: string;
  friendCode?: string;
  isOnline?: boolean;
  ranking?: number;
}

export interface FriendRequest {
  id: FriendRequestId;
  sender: {
    id: UserId;
    username: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
}

export interface BlockedUser {
  id: UserId;
  username: string;
}
