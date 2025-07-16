# Guiñote+ Architecture

## Project Structure

```
src/
├── components/
│   ├── core/                    # Reusable UI elements
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Modal/
│   │   └── Text/
│   ├── game/                    # Game-specific components
│   │   ├── GameCard/
│   │   ├── GameTable/
│   │   ├── PlayerPanel/
│   │   ├── TrickArea/
│   │   └── ScoreDisplay/
│   └── social/                  # Social features
│       ├── FriendCard/
│       ├── VoiceMessage/
│       └── OnlineIndicator/
├── screens/                     # Screen components
│   ├── tabs/                    # Tab screen components
│   │   ├── JugarTab/
│   │   ├── AmigosTab/
│   │   ├── RankingTab/
│   │   ├── TiendaTab/
│   │   ├── ComunidadTab/
│   │   └── AjustesTab/
│   └── game/                    # Game flow screens
│       ├── GameScreen/
│       ├── CreateRoomScreen/
│       └── QuickMatchScreen/
├── stores/                      # Zustand state management
│   ├── gameStore.ts
│   ├── userStore.ts
│   ├── roomStore.ts
│   └── settingsStore.ts
├── services/                    # External integrations
│   ├── api/
│   ├── analytics/
│   ├── auth/
│   └── storage/
├── utils/                       # Utility functions
│   ├── gameLogic/
│   ├── animations/
│   └── responsive/
├── hooks/                       # Custom React hooks
│   ├── useVoiceRecording.ts
│   ├── useGameState.ts
│   └── useAccessibility.ts
├── types/                       # TypeScript definitions
│   ├── game.types.ts
│   ├── user.types.ts
│   └── api.types.ts
└── constants/                   # App-wide constants
    ├── colors.ts
    ├── dimensions.ts
    ├── typography.ts
    └── gameRules.ts
```

## State Management Architecture

### Zustand Stores

```typescript
// gameStore.ts
interface GameState {
  // Current game
  gameId: string;
  players: Player[];
  currentTrick: Card[];
  trumpSuit: Suit;
  score: TeamScore;
  phase: GamePhase;

  // Actions
  playCard: (card: Card) => void;
  declareCante: (cante: Cante) => void;
  nextTurn: () => void;
}

// userStore.ts
interface UserState {
  // Profile
  userId: string;
  displayName: string;
  elo: number;
  stats: UserStats;

  // Preferences
  soundEnabled: boolean;
  voiceEnabled: boolean;
  fontSize: FontSize;

  // Actions
  updateProfile: (data: Partial<Profile>) => void;
  updateStats: (stats: Stats) => void;
}

// roomStore.ts
interface RoomState {
  // Room info
  roomCode: string;
  players: RoomPlayer[];
  spectators: Spectator[];
  settings: RoomSettings;

  // Actions
  createRoom: () => Promise<string>;
  joinRoom: (code: string) => Promise<void>;
  startGame: () => void;
}
```

## Navigation Architecture

```typescript
// Root Navigator Structure
<NavigationContainer>
  <Stack.Navigator>
    <Stack.Screen name="Main" component={TabNavigator} />
    <Stack.Screen name="Game" component={GameScreen} />
    <Stack.Screen name="Room" component={RoomScreen} />
  </Stack.Navigator>
</NavigationContainer>

// Tab Navigator (6 tabs)
<Tab.Navigator>
  <Tab.Screen name="Jugar" component={JugarStackNavigator} />
  <Tab.Screen name="Amigos" component={AmigosScreen} />
  <Tab.Screen name="Ranking" component={RankingScreen} />
  <Tab.Screen name="Tienda" component={TiendaScreen} />
  <Tab.Screen name="Comunidad" component={ComunidadScreen} />
  <Tab.Screen name="Ajustes" component={AjustesScreen} />
</Tab.Navigator>
```

## Component Architecture

### Design System Components

```typescript
// Standardized variants for consistency
<Button variant="primary" size="large" onPress={handlePress}>
  Jugar Ahora
</Button>

<GameCard
  suit="oros"
  rank={7}
  size="large"
  onPress={playCard}
/>

<Text variant="heading" accessible>
  Guiñote+
</Text>
```

### Accessibility First

- Minimum touch targets: 56dp (WCAG compliant)
- Font scaling: 100% to 200%
- Screen reader support
- High contrast mode support
- Voice control integration

## Performance Architecture

### Bundle Size Budgets

- Initial bundle: <10MB
- Per-route lazy loading: <2MB
- Image assets: <200KB each
- Font files: <100KB total

### Runtime Performance

- 60 FPS animations (Reanimated 3)
- <300ms screen transitions
- <100ms touch response
- Memory usage: <150MB

### Optimization Strategies

- React.memo for expensive components
- useMemo/useCallback for complex calculations
- Image caching and lazy loading
- Code splitting by route

## API Architecture (Future - Week 4)

### RESTful Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/user/profile
GET    /api/friends
POST   /api/rooms/create
POST   /api/rooms/join
GET    /api/leaderboard
```

### WebSocket Events

```typescript
// Client → Server
socket.emit('room:join', { roomCode, userId });
socket.emit('game:playCard', { cardId, gameId });
socket.emit('voice:start', { gameId });

// Server → Client
socket.on('game:cardPlayed', update => {});
socket.on('voice:received', message => {});
```

## Testing Strategy

### Unit Tests (Jest + React Native Testing Library)

- Components: Rendering, props, interactions
- Stores: State updates, actions
- Utils: Pure functions, game logic
- Coverage target: 80%

### Integration Tests

- Navigation flows
- Store interactions
- API mocking with MSW

### E2E Tests (Detox - Week 4+)

- Critical user journeys
- Device matrix testing
- Performance regression tests

## Security Architecture

### Client Security

- Secure storage for tokens (Keychain/Keystore)
- Certificate pinning for API calls
- Input validation on all forms
- No sensitive data in logs

### Data Protection

- Voice messages: End-to-end encryption
- User data: Minimal collection (GDPR)
- Analytics: Anonymized tracking
- Passwords: Never stored locally

## Development Workflow

### Code Quality Gates

- ESLint: Enforce code standards
- Prettier: Consistent formatting
- TypeScript: Strict mode enabled
- Husky: Pre-commit hooks

### CI/CD Pipeline (Future)

1. Lint and type check
2. Run unit tests
3. Build for both platforms
4. Deploy to beta testers
5. Monitor crash reports

## Platform-Specific Considerations

### iOS

- Swift for native modules
- CocoaPods for dependencies
- TestFlight for beta distribution
- iOS 13+ support

### Android

- Kotlin for native modules
- Gradle for build management
- Google Play Console for beta
- Android 6+ (API 23+) support

## Monitoring and Analytics

### Performance Monitoring

- Frame rate tracking
- API response times
- Crash reporting (Sentry)
- User session recording

### Analytics Events

- Game completion rate
- Feature adoption
- User retention
- Revenue metrics
