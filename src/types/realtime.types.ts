import type { PlayerId, GameState, TeamId } from './game.types';
import type { GameMove } from './gameMove.types';
import type { Brand } from './game.types';

export type RoomId = Brand<string, 'RoomId'>;
export type MessageId = Brand<string, 'MessageId'>;
export type StateVersion = Brand<number, 'StateVersion'>;

export type RealtimeEventType =
  | 'ready_toggled'
  | 'team_set'
  | 'game_action'
  | 'state_sync'
  | 'host_change'
  | 'ai_takeover'
  | 'chat_msg'
  | 'conflict_detected'
  | 'version_mismatch';

export interface BaseRealtimeEvent {
  type: RealtimeEventType;
  timestamp: number;
  roomId: RoomId;
}

export interface ReadyToggledEvent extends BaseRealtimeEvent {
  type: 'ready_toggled';
  playerId: PlayerId;
  ready: boolean;
}

export interface TeamSetEvent extends BaseRealtimeEvent {
  type: 'team_set';
  playerId: PlayerId;
  team: 1 | 2;
}

export interface GameActionEvent extends BaseRealtimeEvent {
  type: 'game_action';
  action: GameMove;
  validated: boolean;
  version: StateVersion;
}

export interface StateSyncEvent extends BaseRealtimeEvent {
  type: 'state_sync';
  state: GameState;
  version: StateVersion;
}

export interface HostChangeEvent extends BaseRealtimeEvent {
  type: 'host_change';
  newHostId: PlayerId;
}

export interface AITakeoverEvent extends BaseRealtimeEvent {
  type: 'ai_takeover';
  playerId: PlayerId;
}

export interface ChatMessageEvent extends BaseRealtimeEvent {
  type: 'chat_msg';
  playerId: PlayerId;
  text: string;
  messageId: MessageId;
}

export interface ConflictDetectedEvent extends BaseRealtimeEvent {
  type: 'conflict_detected';
  action: GameMove;
  reason: string;
  expectedVersion: StateVersion;
  actualVersion: StateVersion;
}

export interface VersionMismatchEvent extends BaseRealtimeEvent {
  type: 'version_mismatch';
  clientVersion: StateVersion;
  serverVersion: StateVersion;
  requiresSync: boolean;
}

export type RealtimeEvent =
  | ReadyToggledEvent
  | TeamSetEvent
  | GameActionEvent
  | StateSyncEvent
  | HostChangeEvent
  | AITakeoverEvent
  | ChatMessageEvent
  | ConflictDetectedEvent
  | VersionMismatchEvent;

export interface RealtimeGameState extends GameState {
  version: StateVersion;
  lastModified: number;
  lastModifiedBy: PlayerId;
}

export interface AuthorityFlow {
  clientAction: GameMove;
  serverValidation: ValidationResult;
  broadcast: GameActionEvent;
  clientApply: RealtimeGameState;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  validatedAction?: GameMove;
  newVersion?: StateVersion;
}

export interface ConflictResolution {
  type: 'rollback' | 'merge' | 'force';
  originalState: RealtimeGameState;
  conflictingAction: GameMove;
  resolution: RealtimeGameState;
}

export interface RealtimeConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastHeartbeat: number;
  missedHeartbeats: number;
  queuedActions: GameMove[];
}

export interface RoomPresence {
  playerId: PlayerId;
  name: string;
  team: TeamId | null;
  isReady: boolean;
  isHost: boolean;
  isOnline: boolean;
  lastSeen: number;
}

export interface RealtimeConfig {
  maxReconnectAttempts: number;
  reconnectDelayMs: number;
  heartbeatIntervalMs: number;
  actionTimeoutMs: number;
  maxQueueSize: number;
}

export const DEFAULT_REALTIME_CONFIG: RealtimeConfig = {
  maxReconnectAttempts: 5,
  reconnectDelayMs: 1000,
  heartbeatIntervalMs: 30000,
  actionTimeoutMs: 5000,
  maxQueueSize: 100,
};
