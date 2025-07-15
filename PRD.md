# Updated Product Requirements Document (PRD) - Guiñote+

## Executive Summary

Guiñote+ is a premium mobile card game app for iOS and Android that digitizes the traditional Spanish card game Guiñote. Our mission is to become the definitive Guiñote app by solving the major problems of the existing competitor (GuiñotePro) while preserving the authentic game experience loved by Spanish players.

## Problem Statement

GuiñotePro, the current market leader with ~50,000 users, suffers from:

- Frequent crashes and poor performance
- Intrusive 60-second advertisements between games
- AI opponents that cheat (can see other players' cards)
- No voice communication during gameplay
- Outdated UI that hasn't been updated since 2017
- Poor customer support and bug fixes

Players, primarily Spanish males aged 40-65 from the Aragón region, are frustrated but have no better alternative.

## Solution

Guiñote+ offers:

- Stable, crash-free gameplay with smooth 60 FPS performance
- Fair AI with 4 difficulty levels that cannot cheat
- Voice messaging system (5-second messages during play)
- Modern, elegant UI designed for older users
- Respectful monetization (optional ads, premium subscriptions)
- Active development with monthly updates

## Target Users

### Primary Persona: "Miguel from Zaragoza"

- **Age**: 55 years old
- **Location**: Aragón, Spain
- **Tech level**: Uses WhatsApp and Facebook daily
- **Pain points**: GuiñotePro crashes, ads interrupt games
- **Plays**: Daily with friends/family, both online and in bars
- **Values**: Tradition, fairness, social connection

### User Demographics

- 70% male, 30% female
- 85% aged 40-65
- 70% located in Aragón region
- Play 3-5 times per week
- Average session: 25 minutes

## Core Features

### 1. Game Engine

**Complete Guiñote rules implementation**

- 4 players (partnerships) or 2 players (mano a mano)
- Spanish 40-card deck
- Deal 6 cards (3+3 pattern)
- Trump determination (25th/13th card)
- Cantes system (20/40 points for Rey-Sota pairs)
- Special rules: arrastre, cambio de siete, diez últimas
- First to 101 points wins

### 2. AI System

**4 Difficulty Levels**

- **Easy** (30% win rate) - Beginners
- **Medium** (45% win rate) - Casual players
- **Hard** (55% win rate) - Experienced
- **Expert** (65% win rate) - Masters

**Fair Play Guaranteed**

- No access to hidden cards
- Human-like thinking time (1-5 seconds)
- Personality variations

### 3. Multiplayer System

- Real-time online play via Socket.IO
- Room system with 6-character codes
- Reconnection support (5-minute window)
- Spectator mode for watching games
- Private/public rooms with optional passwords

### 4. Social Features

- **Voice Messages** - 5-second audio clips during gameplay
- **Friend System** - Add friends, see online status
- **Liga Familiar** - Persistent competitions between regular players
- **Quick Chat** - Preset messages in Spanish

### 5. User Profiles

**Statistics Tracking**

- Games won/lost
- Win rate by mode
- Favorite partners
- Cante success rate

**Achievements** - 50+ unlockable
**Customization** - Avatars, card backs, table themes

## Technical Requirements

### Frontend

- **Framework**: React Native with TypeScript
- **Styling**: Native styling with style constants
- **State Management**: Redux Toolkit or Zustand
- **Navigation**: React Navigation
- **Animations**: React Native Reanimated

### Backend

- **Server**: Node.js with Express
- **Real-time**: Socket.IO
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage for voice messages

### Performance Targets

- **App launch**: <3 seconds
- **Game load**: <2 seconds
- **Animation**: 60 FPS constant
- **Memory usage**: <150MB
- **Crash rate**: <0.1%

## Design Guidelines

### Color Palette

- **Primary**: #0F2619 (Deep Green - game table)
- **Accent**: #D4A574 (Gold - premium feel)
- **Secondary**: #1E3A2F (Medium Green - UI panels)
- **Text Primary**: #F5E6D3 (Cream - high contrast)
- **Error**: #DC2626 (Red - alerts)

### Typography

- **Headers**: Bold, large (32-48pt)
- **Body**: Regular, readable (16-18pt)
- **Minimum touch targets**: 48x48dp
- **High contrast ratios** for older users

### UI Principles

- **Large, clear buttons** - Easy to tap
- **Simple navigation** - Maximum 3 taps to any feature
- **Visual feedback** - Every action acknowledged
- **Familiar patterns** - Nothing experimental
- **Spanish-first** - All text in European Spanish

## Monetization Strategy

### Free Tier

- 3 games per day OR watch ads for unlimited
- Basic statistics
- Play with friends
- Standard AI opponents

### Premium (€4.99/month)

- No advertisements
- Unlimited games
- Advanced statistics
- All customization options
- Priority matchmaking
- Voice message history

### One-Time Purchases

- Remove ads forever: €9.99
- Card back designs: €2.99
- Table themes: €3.99

## Success Metrics

### Launch Targets (6 months)

- 10,000 active users
- 4.5+ star rating
- 30% Day 7 retention
- 10% premium conversion
- <€2 user acquisition cost

### Key Performance Indicators

- Daily Active Users (DAU)
- Session length (target: 25 min)
- Games per session (target: 3)
- Voice messages sent per game
- Friend invites per user

## Development Phases - Frontend First Approach

### Phase 1: Complete Frontend UI/UX (Months 1-2)

**Rationale**: Build and test the entire user experience before backend complexity

**Week 1-2: Core Screen Development**
- Navigation structure with all screens
- MainGameHub with smart cards
- GameScreen with complete layout
- Profile and Settings screens
- All UI components (cards, buttons, modals)

**Week 3-4: Polish & Animations**
- Card animations (flip, deal, play)
- Screen transitions
- Haptic feedback
- Loading states and skeletons
- Error states UI

**Week 5-6: Frontend Game Logic**
- Local game state management
- Game rules implementation (client-side)
- AI opponents (running locally)
- Score calculation
- Win/lose conditions

**Week 7-8: User Testing & Iteration**
- Beta testing with 50 users
- UI/UX refinements
- Performance optimization
- Device compatibility testing
- Accessibility improvements

### Phase 2: Backend Infrastructure (Months 3-4)

**Week 9-10: Core Backend Setup**
- Node.js server initialization
- Firebase project configuration
- Database schema design
- API structure planning
- Security rules implementation

**Week 11-12: Authentication & User Management**
- Firebase Auth integration
- User profile creation/management
- Session handling
- Account recovery flows
- Data privacy compliance

**Week 13-14: Real-time Multiplayer**
- Socket.IO server setup
- Room management system
- Game state synchronization
- Reconnection handling
- Anti-cheat measures

**Week 15-16: Data & Analytics**
- Statistics tracking system
- Achievement engine
- Leaderboards implementation
- Analytics integration
- Performance monitoring

### Phase 3: Integration & Polish (Months 5-6)

**Week 17-18: Feature Integration**
- Connect frontend to backend
- Liga Familiar system
- Voice messaging implementation
- Friend system activation
- Push notifications

**Week 19-20: Monetization & Testing**
- Payment integration
- Ad network setup
- Premium features activation
- A/B testing framework
- Load testing

**Week 21-22: Beta Launch**
- Closed beta (500 users)
- Bug fixing sprint
- Performance optimization
- Feedback integration
- Stability improvements

**Week 23-24: Production Launch**
- App store submission
- Marketing campaign launch
- Support system activation
- Monitoring setup
- Post-launch updates

## Risk Mitigation

### Technical Risks

- **Risk**: React Native performance issues
  - **Mitigation**: Native modules for critical paths

- **Risk**: Multiplayer synchronization bugs
  - **Mitigation**: Extensive testing, gradual rollout

- **Risk**: Server scaling challenges
  - **Mitigation**: Cloud architecture, load balancing

### Market Risks

- **Risk**: Low user adoption
  - **Mitigation**: Guerrilla marketing in Aragón

- **Risk**: GuiñotePro improvements
  - **Mitigation**: Faster feature development

- **Risk**: High user acquisition costs
  - **Mitigation**: Referral program, organic growth

### Operational Risks

- **Risk**: Support overwhelm
  - **Mitigation**: Comprehensive FAQ, community moderators

- **Risk**: Content moderation (voice messages)
  - **Mitigation**: Report system, automatic filtering

- **Risk**: Compliance issues
  - **Mitigation**: Legal review, age gates

## Quality Assurance

### Testing Strategy

- **Unit Testing**: 80% code coverage minimum
- **Integration Testing**: All API endpoints
- **E2E Testing**: Critical user journeys
- **Performance Testing**: 60 FPS on 3-year-old devices
- **Accessibility Testing**: WCAG 2.1 AA compliance

### Device Coverage

- **iOS**: iPhone 8 and newer
- **Android**: API 21+ (5.0 Lollipop)
- **Tablets**: Responsive layout support
- **Screen Sizes**: 4.7" to 12.9"

## Localization

### Language Support

- **Spanish (Spain)**: Primary language
- **Aragonese Dialect**: Regional variations
- **English**: Future consideration
- **Catalan**: Phase 2 consideration

### Cultural Considerations

- Spanish date/time formats
- European number formatting
- Local tournament times (siesta consideration)
- Regional holiday events

## Legal & Compliance

### Requirements

- **GDPR**: Full compliance for EU users
- **COPPA**: Age verification (13+)
- **Spanish Gaming Laws**: No real-money gambling
- **App Store Guidelines**: Family-friendly content
- **Accessibility**: Spanish disability laws

### Data Protection

- Encryption at rest and in transit
- Right to deletion
- Data portability
- Minimal data collection
- Clear privacy policy

## Launch Strategy

### Soft Launch (Month 5)

- **Region**: Aragón only
- **Users**: 500 beta testers
- **Duration**: 2 weeks
- **Focus**: Stability and feedback

### Regional Launch (Month 6)

- **Regions**: Aragón, La Rioja, Navarra
- **Marketing**: Local partnerships
- **PR**: Regional media coverage
- **Target**: 5,000 users first month

### National Launch (Month 7+)

- **Coverage**: All of Spain
- **Marketing**: Digital campaign
- **Partnerships**: Gaming sites
- **Target**: 25,000 users by month 12

## Success Definition

Guiñote+ succeeds when:

- **User Satisfaction**: 4.5+ star rating maintained
- **Market Position**: #1 Guiñote app in Spain
- **Financial**: €5,000+ monthly revenue
- **Engagement**: 40% monthly retention
- **Community**: Active Liga Familiar participation
- **Recognition**: "The Guiñote app that works"

## Post-Launch Roadmap

### Months 7-9

- Tournament system
- Seasonal events
- Advanced statistics
- Replay system

### Months 10-12

- Cross-platform play
- TV/tablet optimization
- Regional expansions
- AI improvements

### Year 2

- Other Spanish card games
- International expansion
- Platform partnerships
- Competitive leagues

---

*"We're not just building an app. We're preserving and enhancing a beloved Spanish tradition for the digital age."*