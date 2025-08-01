# Guiñote Multiplayer Server

Backend server for the Guiñote online multiplayer game.

## Features

- Real-time multiplayer using Socket.io
- JWT-based authentication
- ELO-based matchmaking system
- Game state synchronization
- Player profiles and statistics
- Reconnection handling

## Requirements

- Node.js 18+
- MongoDB 6+
- Redis 7+

## Development Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Start MongoDB and Redis:

```bash
# Using Docker
docker-compose up -d mongodb redis

# Or install locally
```

4. Run development server:

```bash
npm run dev
```

## Production Deployment

### Using Docker

1. Build and run all services:

```bash
docker-compose up -d
```

### Manual Deployment

1. Set production environment variables
2. Install dependencies: `npm ci --only=production`
3. Start server: `npm start`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/guest` - Guest login
- `POST /api/auth/logout` - Logout

### Players

- `GET /api/players/profile` - Get player profile
- `PATCH /api/players/profile` - Update profile
- `GET /api/players/stats/:playerId` - Get player stats
- `GET /api/players/leaderboard` - Get leaderboard
- `GET /api/players/search?q=query` - Search players

### WebSocket Events

#### Client → Server

- `join_matchmaking` - Join matchmaking queue
- `leave_matchmaking` - Leave queue
- `join_room` - Join game room
- `leave_room` - Leave game room
- `play_card` - Play a card
- `cantar` - Declare cante
- `cambiar_7` - Exchange 7 of trump
- `declare_victory` - Declare victory in vueltas
- `send_message` - Send chat message
- `voice_message` - Send voice message

#### Server → Client

- `matchmaking_status` - Queue status update
- `match_found` - Match found
- `game_state` - Full game state
- `game_update` - Game state update
- `player_disconnected` - Player disconnected
- `chat_message` - Chat message
- `voice_message` - Voice message
- `error` - Error message

## Architecture

```
server/
├── src/
│   ├── index.js          # Entry point
│   ├── config/           # Configuration
│   ├── models/           # Database models
│   ├── services/         # Business logic
│   ├── controllers/      # HTTP controllers
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   └── utils/            # Utilities
```

## Testing

```bash
npm test
```

## Monitoring

The server exposes health check endpoint at `/health`.

## License

Private - All rights reserved
