# Working Features (Before Architecture Cleanup)

## ✅ Fully Working Features

### Core Gameplay

- **Offline Single Player** - Play against AI with 3 difficulty levels (Easy, Medium, Hard)
- **Local Multiplayer (Pass & Play)** - 2-4 players on same device
- **Game Rules** - Basic Guiñote rules implementation (with some bugs in arrastre phase)
- **Card Dealing** - Initial deal of 6 cards per player
- **Trump Selection** - Automatic trump card selection
- **Trick Taking** - Playing cards and collecting tricks
- **Scoring System** - Points calculation and winner determination

### UI/UX Features

- **Card Animations** - Card dealing and playing animations
- **Spanish Card Graphics** - Traditional Spanish deck visuals
- **Orientation Support** - Portrait for menus, landscape for gameplay
- **Haptic Feedback** - Vibration on actions (iOS)
- **Sound Effects** - Basic sound effects for actions

### Game Features

- **AI Players** - Three difficulty levels with different strategies
- **AI Memory System** - AI remembers played cards
- **Cante System** - Declaration of King-Knight pairs (20/40 points)
- **Cambiar 7** - Exchange 7 of trumps with trump card
- **Statistics Tracking** - Local statistics (games played, won, lost)
- **Settings** - Sound, haptics, player name configuration

### Screens That Work

- JugarHomeScreen - Main menu
- OfflineModeScreen - AI difficulty selection
- LocalMultiplayerScreen - Pass & play setup
- GameScreen - Main game screen
- SettingsScreen - App settings
- RankingScreen - Statistics display
- TutorialSetupScreen - Tutorial selection
- TutorialViewerScreen - Tutorial content

## ⚠️ Partially Working Features

### Tutorial System

- Basic tutorial screens exist
- Content is defined
- Navigation works
- But: Tutorial gameplay not fully interactive

### Game Phases

- Initial phase (draw from deck) works
- Arrastre phase has bugs
- Vueltas (second hand) partially implemented

## ❌ Not Working / Fake Features

### Online Multiplayer

- NetworkGameScreen exists but doesn't work
- Convex integration incomplete
- Matchmaking is stub only
- Room system not functional

### Authentication

- Clerk integration exists but uses test keys
- Login/Register screens are placeholders
- Guest mode not implemented despite config

### Social Features

- Friends system completely fake
- Friend lobby is placeholder
- No actual friend management

### Shop/Store

- TiendaScreen is placeholder only
- No actual shop functionality

### Voice System

- Voice messaging UI exists
- Recording doesn't actually work
- Voice queue not functional

## 📊 Test Coverage Status

- 55 test files for 183 source files (~30% coverage)
- Some tests failing due to timestamp issues
- Integration tests missing
- E2E tests not implemented

## 🎮 Critical User Paths That Must Keep Working

1. **Start Game vs AI**

   - JugarHome → OfflineMode → Select Difficulty → GameScreen → Play → See Winner

2. **Local Multiplayer**

   - JugarHome → LocalMultiplayer → Enter Names → GameScreen → Pass Device → Play → See Winner

3. **View Statistics**

   - Tab to Ranking → See Stats → Reset Stats (optional)

4. **Change Settings**
   - Tab to Settings → Toggle Sound/Haptics → Changes persist

## 📝 Notes

- The app works best in offline mode
- Online features should be hidden/disabled during cleanup
- Focus on preserving the working single-player experience
- Authentication can be made optional

Last verified: $(date)
