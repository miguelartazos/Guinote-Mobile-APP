import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type MainTabParamList = {
  Jugar: undefined;
  Torneos: undefined;
  Social: undefined;
};

export type JugarStackParamList = {
  JugarHome: undefined;
  QuickMatch: undefined;
  FriendsLobby: undefined;
  CreateRoom: undefined;
  LocalMultiplayer: undefined;
  OfflineMode: undefined;
  TutorialSetup: undefined;
  TutorialViewer: {
    tutorialType: 'complete' | 'basic' | 'cantes' | 'special';
  };
  Login: undefined;
  Register: undefined;
  OnlineLobby: undefined;
  Game: {
    gameMode: 'quick' | 'friends' | 'ai' | 'local' | 'tutorial' | 'offline' | 'online';
    difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
    playerName?: string;
    playerNames?: string[];
    tutorialMode?: 'complete' | 'basic' | 'cantes' | 'special' | 'practice';
    practiceMode?: boolean;
    roomId?: string;
    roomCode?: string;
    players?: any[];
    isHost?: boolean;
  };
  GameRoom: {
    roomId: string;
    roomCode?: string;
  };
};

export type RankingStackParamList = {
  Leaderboard: undefined;
  PlayerProfile: { playerId: string };
};

export type AjustesStackParamList = {
  Settings: undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<
  MainTabParamList,
  T
>;

export type JugarStackScreenProps<T extends keyof JugarStackParamList> = StackScreenProps<
  JugarStackParamList,
  T
>;

export type RankingStackScreenProps<T extends keyof RankingStackParamList> = StackScreenProps<
  RankingStackParamList,
  T
>;

export type AjustesStackScreenProps<T extends keyof AjustesStackParamList> = StackScreenProps<
  AjustesStackParamList,
  T
>;

// Navigation prop types
export type JugarStackNavigationProp = StackScreenProps<JugarStackParamList>['navigation'];
