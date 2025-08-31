# 🎮 MULTIPLAYER IMPLEMENTATION TRACKER

## ⚡ QUICK START FOR CLAUDE CODE

When starting a new session, Claude Code should:
1. **READ THIS FILE FIRST** to understand current progress
2. Check which tickets are ✅ DONE vs ⏳ PENDING
3. Read implementation notes from completed tickets
4. Continue with next pending ticket in sequence
5. **UPDATE THIS FILE** after completing each ticket

## 📊 PROGRESS OVERVIEW

**Current Sprint**: SPRINT 1
**Completed Tickets**: 0/13
**Hermes Safe**: ❓ (Update when Ticket 1 complete)
**Feature Flag Status**: OFF (Update when enabled)

---

## 🎯 SPRINT 1: FOUNDATION (Days 1-3)
*Offline-first hooks with safe boundaries*

### 📌 Ticket 1: Feature Flag + Safe Import Boundary
**Status**: ⏳ PENDING
**Dependencies**: None
**Files to Create**:
- `src/config/featureFlags.ts`
- `src/services/realtimeClient.native.ts`
- `src/hooks/useMultiplayerGame.ts`

**Acceptance Criteria**:
- [ ] App boots with flag OFF, zero Supabase imports at startup
- [ ] Enabling flag activates realtime without reload
- [ ] All multiplayer code behind flag check

**Implementation Notes**:
```
<!-- Claude Code: Add notes here after completion -->
```

---

### 📌 Ticket 2: Rooms Hook (Offline-First)
**Status**: ⏳ PENDING
**Dependencies**: Ticket 1
**Files to Create**:
- `src/hooks/useUnifiedRooms.ts`
- `src/services/connectionService.ts`

**Acceptance Criteria**:
- [ ] Create/join/leave work online
- [ ] Actions queued offline, sync on reconnect
- [ ] Optimistic UI updates with rollback

**Implementation Notes**:
```
<!-- Claude Code: Add notes here after completion -->
```

---

### 📌 Ticket 3: Friends Hook
**Status**: ⏳ PENDING
**Dependencies**: Ticket 1
**Files to Create**:
- `src/hooks/useUnifiedFriends.ts`

**Acceptance Criteria**:
- [ ] Pending/accepted/blocked states persist
- [ ] Search returns relevant users
- [ ] Online status updates in real-time

**Implementation Notes**:
```
<!-- Claude Code: Add notes here after completion -->
```

---

### 📌 DB Migration: Foundation
**Status**: ⏳ PENDING
**Dependencies**: None (can run parallel)
**Files to Create**:
- `supabase/migrations/08_multiplayer_foundation.sql`

**Acceptance Criteria**:
- [ ] Add missing columns with defaults
- [ ] Create essential indexes
- [ ] Setup RLS policies
- [ ] Migration is idempotent (IF NOT EXISTS)

**Implementation Notes**:
```
<!-- Claude Code: Add notes here after completion -->
```

---

## 🏃 SPRINT 2: LOBBY + INVITE (Days 4-7)

### 📌 Ticket 4: GameRoom Screen
**Status**: ⏳ PENDING
**Dependencies**: Tickets 1, 2
**Files to Create**:
- `src/screens/GameRoomScreen.tsx`
- `src/components/room/RoomHeader.tsx`
- `src/components/room/PlayerSlots.tsx`
- `src/components/room/TeamIndicator.tsx`
- `src/components/room/ReadyButton.tsx`
- `src/components/room/StartGameButton.tsx`

**Acceptance Criteria**:
- [ ] 4 slots with player/AI indicators
- [ ] Team assignment visible (1-2 vs 3-4)
- [ ] Host-only start when all ready

**Implementation Notes**:
```
<!-- Claude Code: Add notes here after completion -->
```

---

### 📌 Ticket 5: AI Player Manager
**Status**: ⏳ PENDING
**Dependencies**: Ticket 4
**Files to Create**:
- `src/components/room/AIPlayerManager.tsx`
- `supabase/functions/ai-player/index.ts` (update existing)

**Acceptance Criteria**:
- [ ] Add/remove AI with difficulty selection
- [ ] AI moves deterministic (room-seeded RNG)
- [ ] Server function drives AI actions

**Implementation Notes**:
```
<!-- Claude Code: Add notes here after completion -->
```

---

### 📌 Ticket 6: Deep Linking + WhatsApp
**Status**: ⏳ PENDING
**Dependencies**: Ticket 4
**Files to Create**:
- `src/utils/invitations.ts`
- Update `src/navigation/RootNavigator.tsx`

**Acceptance Criteria**:
- [ ] WhatsApp opens with prefilled message
- [ ] Deep link auto-joins room on app open
- [ ] Store fallback for non-app users

**Implementation Notes**:
```
<!-- Claude Code: Add notes here after completion -->
```

---

## 🏃 SPRINT 3: REALTIME GAMEPLAY (Days 8-12)

### 📌 Ticket 7: Realtime Protocol
**Status**: ⏳ PENDING
**Dependencies**: Tickets 1, 2, 4
**Files to Create**:
- `src/services/multiplayerGameService.ts`
- `src/types/realtime.types.ts`

**Acceptance Criteria**:
- [ ] Server validates and rebroadcasts
- [ ] Conflicts rejected with rollback
- [ ] Version tracking prevents divergence

**Implementation Notes**:
```
<!-- Claude Code: Add notes here after completion -->
```

---

### 📌 Ticket 8: Multiplayer GameScreen
**Status**: ⏳ PENDING
**Dependencies**: Ticket 7
**Files to Create**:
- `src/screens/MultiplayerGameScreen.tsx`
- `src/components/game/ConnectionIndicator.tsx`
- `src/components/game/TurnTimer.tsx`
- `src/components/game/PlayerAvatars.tsx`
- `src/components/game/SpectatorMode.tsx`

**Acceptance Criteria**:
- [ ] 4 screens show consistent state
- [ ] Timer forces auto-play on timeout
- [ ] Spectator mode after elimination

**Implementation Notes**:
```
<!-- Claude Code: Add notes here after completion -->
```

---

### 📌 Ticket 9: Connection Recovery
**Status**: ⏳ PENDING
**Dependencies**: Ticket 7
**Files to Create**:
- Update `src/services/connectionService.ts`
- `src/components/ui/ConnectionBanner.tsx`

**Acceptance Criteria**:
- [ ] Seamless recovery after network toggle
- [ ] No duplicate/lost moves
- [ ] Connection banner shows status

**Implementation Notes**:
```
<!-- Claude Code: Add notes here after completion -->
```

---

### 📌 Ticket 10: Server Validation
**Status**: ⏳ PENDING
**Dependencies**: Ticket 7
**Files to Create**:
- `supabase/functions/validate-move/index.ts`

**Acceptance Criteria**:
- [ ] Check player turn validity
- [ ] Validate card ownership
- [ ] Rate limiting (max 10/second)
- [ ] Audit logging

**Implementation Notes**:
```
<!-- Claude Code: Add notes here after completion -->
```

---

## 🏃 SPRINT 4: SOCIAL (Days 13-16)

### 📌 Ticket 11: RLS Optimization
**Status**: ⏳ PENDING
**Dependencies**: DB Migration
**Files to Create**:
- `supabase/migrations/09_rls_optimization.sql`

**Implementation Notes**:
```
<!-- Claude Code: Add notes here after completion -->
```

---

### 📌 Ticket 12: Friends UI
**Status**: ⏳ PENDING
**Dependencies**: Ticket 3
**Files to Create**:
- `src/screens/FriendsScreen.tsx`
- `src/components/friends/FriendCard.tsx`
- `src/components/friends/AllFriends.tsx`
- `src/components/friends/OnlineFriends.tsx`
- `src/components/friends/FriendRequests.tsx`
- `src/components/friends/BlockedUsers.tsx`

**Implementation Notes**:
```
<!-- Claude Code: Add notes here after completion -->
```

---

## 🏃 SPRINT 5: POLISH (Days 17-20)

### 📌 Ticket 13: Test Suite
**Status**: ⏳ PENDING
**Dependencies**: All previous tickets
**Files to Create**:
- `__tests__/multiplayer/*.spec.ts`
- `maestro/flows/multiplayer_game.yaml`
- `maestro/flows/friend_system.yaml`

**Implementation Notes**:
```
<!-- Claude Code: Add notes here after completion -->
```

---

## 🔧 IMPLEMENTATION CONTEXT

### Core Principles
1. **Offline-first**: All features work offline, sync when online
2. **Hermes-safe**: No Supabase imports at startup, feature-flagged
3. **Server authority**: Server validates all moves, single source of truth
4. **Deterministic AI**: Room-seeded RNG for consistent behavior

### Architecture Decisions
- **Hooks**: `useUnifiedRooms`, `useUnifiedFriends` for state management
- **Queue System**: Actions queued offline, executed on reconnect
- **Optimistic UI**: Immediate updates with rollback on server rejection
- **Version Control**: State versioning to prevent divergence

### Testing Strategy
- Unit tests for each hook and service
- Integration tests for realtime flows
- Maestro tests for UI flows
- Network interruption testing

---

## 📝 CLAUDE CODE INSTRUCTIONS

### When Starting a New Session

1. **Read this file completely**
2. Check the current sprint and pending tickets
3. Read implementation notes from completed tickets
4. Ask user: "Should I continue with Ticket X: [Name]?"

### When Completing a Ticket

1. Run all tests: `npm test -- --testPathPattern="[relevant]"`
2. Run type check: `npm run typecheck`
3. Run lint: `npm run lint`
4. Update this file:
   - Change status from ⏳ PENDING to ✅ DONE
   - Check all acceptance criteria boxes
   - Add implementation notes with:
     - Key decisions made
     - Files created/modified
     - Any deviations from plan
     - Dependencies for next tickets

### Template for Marking Completion

```markdown
**Status**: ✅ DONE
**Completed**: [Date]

**Implementation Notes**:
```
- Created [list of files]
- Key decision: [explain any important choices]
- Deviation: [any changes from original plan]
- Next ticket should know: [important context]
- Tests passing: [test file names]
```
```

### Inter-Sprint Handoff

When finishing a sprint, add a summary:

```markdown
## SPRINT X SUMMARY
**Completed**: [Date]
**Tickets Done**: X/Y
**Key Achievements**:
- [List major milestones]
**Known Issues**:
- [Any pending problems]
**Ready for Next Sprint**: YES/NO
```

---

## 🚀 QUICK COMMANDS

```bash
# Test specific ticket
npm test -- --testPathPattern="featureFlag.spec.ts"

# Check Hermes safety
npm run ios -- --reset-cache

# Test offline behavior
# 1. Disable network
# 2. Test feature
# 3. Re-enable network
# 4. Verify sync

# Run Maestro test
maestro test maestro/flows/multiplayer_game.yaml
```

---

## 🔄 DEPENDENCY GRAPH

```
Ticket 1 (Feature Flag)
├── Ticket 2 (Rooms Hook)
│   ├── Ticket 4 (GameRoom Screen)
│   │   ├── Ticket 5 (AI Manager)
│   │   └── Ticket 6 (Deep Links)
│   └── Ticket 7 (Realtime Protocol)
│       ├── Ticket 8 (Multiplayer Screen)
│       ├── Ticket 9 (Connection Recovery)
│       └── Ticket 10 (Server Validation)
└── Ticket 3 (Friends Hook)
    └── Ticket 12 (Friends UI)

Parallel: DB Migration → Ticket 11 (RLS)
Final: Ticket 13 (Test Suite)
```

---

## 📌 CURRENT FOCUS

**Next Ticket to Implement**: Ticket 1 - Feature Flag + Safe Import Boundary
**Blocker**: None
**Ready to Start**: YES

---

*Last Updated*: Never (Fresh start)
*Total Sessions*: 0
*Current Session Sprint*: None yet