# Guiñote - Spanish Card Game

A modern implementation of the classic Spanish card game Guiñote, built with React Native for iOS and Android.

## Features

### 🎮 Game Modes

- **Online Multiplayer** - Play with players worldwide with ELO-based matchmaking
- **Offline vs AI** - Play against intelligent AI with different personalities and difficulty levels
- **Local Multiplayer** - Pass & play mode for up to 4 players on the same device
- **Tutorial Mode** - Learn the rules step by step

### 🌐 Online Multiplayer Features

- Real-time gameplay using WebSocket connections
- ELO rating system for fair matchmaking
- Player profiles and statistics tracking
- Automatic reconnection handling
- Voice messaging during games
- Guest mode for quick play

### 🤖 AI Features

- Three difficulty levels (Easy, Medium, Hard)
- Unique AI personalities (Prudent, Aggressive, Tricky)
- Memory system for realistic gameplay
- Strategic decision making

### 🎯 Game Features

- Authentic Guiñote rules implementation
- Beautiful Spanish card graphics
- Voice recording for in-game communication
- Sound effects and background music
- Haptic feedback
- Landscape and portrait support
- Comprehensive statistics tracking

## Getting Started

### Prerequisites

- Node.js 18+
- React Native development environment ([Setup Guide](https://reactnative.dev/docs/set-up-your-environment))
- For iOS: macOS with Xcode
- For Android: Android Studio

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/guinote2.git
cd guinote2
```

2. Install dependencies:

```bash
npm install
```

3. For iOS, install CocoaPods:

```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

### Running the App

#### Development Mode

Start Metro bundler:

```bash
npm start
```

Run on iOS:

```bash
npm run ios
```

Run on Android:

```bash
npm run android
```

### Online Multiplayer Setup

To enable online multiplayer, you need to run the backend server:

1. Navigate to server directory:

```bash
cd server
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the server with Docker:

```bash
docker-compose up -d
```

Or run locally:

```bash
npm run dev
```

See [server/README.md](server/README.md) for detailed server setup.

## Project Structure

```
guinote2/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # Screen components
│   ├── navigation/     # Navigation configuration
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions and game logic
│   ├── services/       # External services (networking)
│   ├── types/          # TypeScript type definitions
│   └── constants/      # App constants
├── server/             # Backend server for multiplayer
├── assets/             # Images and other assets
├── ios/                # iOS native code
└── android/            # Android native code
```

## Development

### Code Quality

Run linting:

```bash
npm run lint
```

Run tests:

```bash
npm test
```

### Building for Production

#### iOS

1. Open `ios/guinote2.xcworkspace` in Xcode
2. Select your signing team
3. Archive and upload to App Store Connect

#### Android

```bash
cd android
./gradlew assembleRelease
```

The APK will be in `android/app/build/outputs/apk/release/`

## Game Rules

Guiñote is a Spanish trick-taking card game for 4 players in partnerships. Key rules:

- **Objective**: First team to reach 101 points wins
- **Cards**: Spanish deck (40 cards), Ace is highest
- **Cantes**: Declare King-Knight pairs for bonus points
  - Las Cuarenta (40): King-Knight of trump suit
  - Veinte (20): King-Knight of other suits
- **Arrastre**: Last phase when deck is empty
- **Special Rules**:
  - 30 Malas: Need 30+ card points to win
  - Vueltas: Second hand if no winner
  - 10 de Últimas: 10 bonus points for last trick

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is private and proprietary. All rights reserved.

## Acknowledgments

- Traditional Spanish card game community
- React Native team for the excellent framework
- Socket.io for real-time multiplayer support
