# Convex Migration Guide

## Overview

We've successfully migrated from Socket.io to Convex for our multiplayer backend. This provides:

- ✅ No more WebSocket errors
- ✅ Automatic scaling
- ✅ Built-in real-time sync
- ✅ Better TypeScript support
- ✅ Simplified architecture

## Setup Instructions

### 1. Initial Setup

```bash
# Run the setup script
./scripts/setup-convex.sh

# Follow the interactive prompts to:
# 1. Login to Convex
# 2. Create a new project
# 3. Get your CONVEX_URL
```

### 2. Environment Configuration

Update your `.env` file:
```env
EXPO_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

### 3. Start Development

```bash
# Terminal 1: Start Convex dev server
npx convex dev

# Terminal 2: Start React Native
npm start
```

## Architecture Changes

### Before (Socket.io)
```
App → networkService.ts → Socket.io Server → Redis/MongoDB
```

### After (Convex)
```
App → Convex Hooks → Convex Functions → Convex Database
```

## Key Components

### Hooks
- `useConvexAuth()` - Authentication with Clerk integration
- `useConvexGame()` - Game state and actions
- `useConvexMatchmaking()` - Matchmaking queue

### Convex Functions
- `auth.ts` - User synchronization
- `rooms.ts` - Room management
- `gameActions.ts` - Game logic
- `matchmaking.ts` - Queue system
- `ai.ts` - AI player logic
- `voice.ts` - Voice messages
- `presence.ts` - Connection tracking

## Migration Status

✅ **Completed:**
- Core game logic
- Room management
- Matchmaking system
- AI players
- Voice messages
- Real-time subscriptions
- Presence tracking

❌ **Removed:**
- Socket.io server
- networkService.ts
- Redis/MongoDB dependencies

## Testing

1. **Create a room:**
```typescript
const { roomId, code } = await createRoom({
  hostId: user._id,
  gameMode: "friends",
  isPublic: false,
});
```

2. **Join a room:**
```typescript
await joinRoom({
  code: "ABC123",
  userId: user._id,
});
```

3. **Play a card:**
```typescript
await playCard({
  roomId,
  userId: user._id,
  cardId: "oros_1",
});
```

## Troubleshooting

### "No CONVEX_URL" Error
- Run `npx convex dev` to get your URL
- Update `.env` file

### Authentication Issues
- Ensure Clerk is properly configured
- Check that user sync is working

### Game State Not Updating
- Verify Convex dev server is running
- Check browser console for errors

## Performance

Convex provides:
- <50ms latency for mutations
- Automatic caching
- Optimistic updates
- Real-time subscriptions

## Next Steps

1. Deploy to production
2. Set up monitoring
3. Configure backups
4. Add analytics

## Resources

- [Convex Docs](https://docs.convex.dev)
- [React Native Guide](https://docs.convex.dev/client/react-native)
- [Best Practices](https://docs.convex.dev/best-practices)