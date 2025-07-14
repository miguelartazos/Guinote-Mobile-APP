import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type MainTabParamList = {
  Jugar: undefined;
  Amigos: undefined;
  Ranking: undefined;
  Tienda: undefined;
  Comunidad: undefined;
  Ajustes: undefined;
};

export type JugarStackParamList = {
  MainGameHub: undefined;
  Game: undefined;
  Room: undefined;
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

export type ComunidadStackParamList = {
  Community: undefined;
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

export type ComunidadStackScreenProps<T extends keyof ComunidadStackParamList> =
  StackScreenProps<ComunidadStackParamList, T>;

export type AjustesStackScreenProps<T extends keyof AjustesStackParamList> =
  StackScreenProps<AjustesStackParamList, T>;
