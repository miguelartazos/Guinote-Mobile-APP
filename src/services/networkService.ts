import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  GameState,
  GameAction,
  PlayerId,
  CardId,
} from '../types/game.types';
import type { SpanishSuit } from '../types/cardTypes';

const SERVER_URL = __DEV__
  ? 'http://localhost:3000'
  : process.env.REACT_APP_SERVER_URL || 'https://your-production-server.com';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface MatchFoundData {
  roomId: string;
  players: any[];
  gameState: any;
}

interface GameUpdateData {
  roomId: string;
  gameState: GameState;
  lastAction?: GameAction;
}

interface MatchmakingStatusData {
  status: string;
  playersInQueue: number;
  waitTime?: number;
  estimatedTime?: number;
  eloRange?: number;
}

class NetworkService {
  private socket: Socket | null = null;
  public authToken: string | null = null; // Made public for mock auth
  private connectionStatus: ConnectionStatus = 'disconnected';
  private listeners: Map<string, Set<Function>> = new Map();

  async initialize() {
    try {
      // Get auth token from storage
      this.authToken = await AsyncStorage.getItem('authToken');

      if (!this.authToken) {
        console.log('No auth token found, user needs to login');
        return false;
      }

      return this.connect();
    } catch (error) {
      console.error('Failed to initialize network service:', error);
      return false;
    }
  }

  private connect(): Promise<boolean> {
    return new Promise(resolve => {
      if (this.socket?.connected) {
        resolve(true);
        return;
      }

      this.socket = io(SERVER_URL, {
        auth: {
          token: this.authToken,
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.setupEventHandlers();

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.setConnectionStatus('connected');
        resolve(true);
      });

      this.socket.on('connect_error', error => {
        console.error('Connection error:', error.message);
        this.setConnectionStatus('error');
        resolve(false);
      });
    });
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', reason => {
      console.log('Disconnected:', reason);
      this.setConnectionStatus('disconnected');
      this.emit('disconnected', { reason });
    });

    this.socket.on('reconnect', attemptNumber => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      this.setConnectionStatus('connected');
      this.emit('reconnected', { attemptNumber });
    });

    // Matchmaking events
    this.socket.on('matchmaking_status', (data: MatchmakingStatusData) => {
      this.emit('matchmaking_status', data);
    });

    this.socket.on('match_found', (data: MatchFoundData) => {
      this.emit('match_found', data);
    });

    // Game events
    this.socket.on('game_update', (data: GameUpdateData) => {
      this.emit('game_update', data);
    });

    this.socket.on('game_state', (data: any) => {
      this.emit('game_state', data);
    });

    this.socket.on('player_disconnected', (data: any) => {
      this.emit('player_disconnected', data);
    });

    // Chat/Voice events
    this.socket.on('chat_message', (data: any) => {
      this.emit('chat_message', data);
    });

    this.socket.on('voice_message', (data: any) => {
      this.emit('voice_message', data);
    });

    // Error handling
    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });
  }

  // Authentication methods
  async login(username: string, password: string): Promise<any> {
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('authToken', data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
        await AsyncStorage.setItem('player', JSON.stringify(data.player));
        this.authToken = data.accessToken;
        await this.connect();
        return data;
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(
    username: string,
    email: string,
    password: string,
    avatar?: string,
  ): Promise<any> {
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, avatar }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('authToken', data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
        await AsyncStorage.setItem('player', JSON.stringify(data.player));
        this.authToken = data.accessToken;
        await this.connect();
        return data;
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async loginAsGuest(): Promise<any> {
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('authToken', data.accessToken);
        await AsyncStorage.setItem('player', JSON.stringify(data.player));
        this.authToken = data.accessToken;
        await this.connect();
        return data;
      } else {
        throw new Error(data.error || 'Guest login failed');
      }
    } catch (error) {
      console.error('Guest login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      if (this.authToken) {
        await fetch(`${SERVER_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'player']);
      this.disconnect();
    }
  }

  // Matchmaking methods
  joinMatchmaking(gameMode: string = 'ranked') {
    if (!this.socket?.connected) {
      throw new Error('Not connected to server');
    }
    this.socket.emit('join_matchmaking', { gameMode });
  }

  leaveMatchmaking() {
    if (!this.socket?.connected) return;
    this.socket.emit('leave_matchmaking');
  }

  // Game methods
  joinRoom(roomId: string) {
    if (!this.socket?.connected) {
      throw new Error('Not connected to server');
    }
    this.socket.emit('join_room', { roomId });
  }

  leaveRoom(roomId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('leave_room', { roomId });
  }

  playCard(roomId: string, cardId: CardId) {
    if (!this.socket?.connected) {
      throw new Error('Not connected to server');
    }
    this.socket.emit('play_card', { roomId, cardId });
  }

  cantar(roomId: string, suit: SpanishSuit) {
    if (!this.socket?.connected) {
      throw new Error('Not connected to server');
    }
    this.socket.emit('cantar', { roomId, suit });
  }

  cambiar7(roomId: string) {
    if (!this.socket?.connected) {
      throw new Error('Not connected to server');
    }
    this.socket.emit('cambiar_7', { roomId });
  }

  declareVictory(roomId: string) {
    if (!this.socket?.connected) {
      throw new Error('Not connected to server');
    }
    this.socket.emit('declare_victory', { roomId });
  }

  // Chat/Voice methods
  sendMessage(roomId: string, message: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('send_message', { roomId, message });
  }

  sendVoiceMessage(roomId: string, audioData: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('voice_message', { roomId, audioData });
  }

  // Event handling
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // Connection management
  private setConnectionStatus(status: ConnectionStatus) {
    this.connectionStatus = status;
    this.emit('connection_status', { status });
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.authToken = null;
    this.connectionStatus = 'disconnected';
    this.listeners.clear();
  }

  // Player data
  async getPlayerProfile(): Promise<any> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${SERVER_URL}/api/players/profile`, {
      headers: {
        Authorization: `Bearer ${this.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get profile');
    }

    return response.json();
  }

  async getLeaderboard(limit: number = 100, offset: number = 0): Promise<any> {
    const response = await fetch(
      `${SERVER_URL}/api/players/leaderboard?limit=${limit}&offset=${offset}`,
    );

    if (!response.ok) {
      throw new Error('Failed to get leaderboard');
    }

    return response.json();
  }
}

// Singleton instance
const networkService = new NetworkService();

export default networkService;
