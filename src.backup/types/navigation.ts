import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type MainTabParamList = {
  Jugar: undefined;
  Amigos: undefined;
  Ranking: undefined;
  Tienda: undefined;
  Ajustes: undefined;
};

export type JugarStackParamList = {
  JugarHome: undefined;
  QuickMatch: undefined;
  FriendsLobby: undefined;
  CreateRoom: undefined;
  JoinRoom: { roomCode?: string };
  AIGame: {
    aiPlayers: Array<{
      name: string;
      difficulty: 'easy' | 'medium' | 'hard';
    }>;
  };
  LocalMultiplayer: undefined;
  OfflineMode: undefined;
  TutorialSetup: undefined;
  TutorialViewer: {
    tutorialType: 'complete' | 'basic' | 'cantes' | 'special';
  };
  Login: undefined;
  Register: undefined;
  OnlineLobby: undefined;
  NetworkGame: {
    roomId: string;
    roomCode: string;
  };
  Game: {
    gameMode: 'quick' | 'friends' | 'ai' | 'local' | 'tutorial' | 'offline';
    difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
    playerName?: string;
    playerNames?: string[];
    tutorialMode?: 'complete' | 'basic' | 'cantes' | 'special' | 'practice';
    practiceMode?: boolean;
    roomId?: string;
    roomCode?: string;
    players?: any[];
  };
  GameRoom: {
    roomId: string;
    roomCode?: string;
  };
};

export type AmigosStackParamList = {
  FriendsList: undefined;
  Profile: { userId?: string };
};

export type RankingStackParamList = {
  Leaderboard: undefined;
  PlayerProfile: { playerId: string };
};

export type TiendaStackParamList = {
  Store: undefined;
};

export type AjustesStackParamList = {
  Settings: undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

export type JugarStackScreenProps<T extends keyof JugarStackParamList> =
  StackScreenProps<JugarStackParamList, T>;

export type AmigosStackScreenProps<T extends keyof AmigosStackParamList> =
  StackScreenProps<AmigosStackParamList, T>;

export type RankingStackScreenProps<T extends keyof RankingStackParamList> =
  StackScreenProps<RankingStackParamList, T>;

export type TiendaStackScreenProps<T extends keyof TiendaStackParamList> =
  StackScreenProps<TiendaStackParamList, T>;

export type AjustesStackScreenProps<T extends keyof AjustesStackParamList> =
  StackScreenProps<AjustesStackParamList, T>;

// Navigation prop types
export type JugarStackNavigationProp =
  StackScreenProps<JugarStackParamList>['navigation'];
