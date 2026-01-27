# Prosocial

**An experiment in AI-guided relationship intelligence.**

> Be the friend you want to have

We believe technology should help us be more human, not less. Prosocial uses AI and interaction data to surface insights that help you become a better friend—transforming the overwhelming complexity of maintaining relationships into an elegant, actionable experience.

This project is evolving. What started as a personal tool for staying connected is growing into a comprehensive platform that addresses real social challenges: the friend who drifts away, the birthday you forgot, the conversation you've been meaning to have.

## Vision

Modern life makes it hard to be a good friend. We're scattered across cities, buried in notifications, and genuinely struggle to maintain the connections that matter most. Prosocial approaches this as a solvable problem—using the data we already generate (messages, calendars, interactions) to provide gentle, intelligent guidance on being more present for the people in our lives.

## Features

### Intelligent Relationship Tracking
- **People Management** - Store contacts with notes, tags, birthdays, and anniversaries—the foundation for AI-powered insights
- **Today View** - A curated daily feed of who needs your attention: upcoming birthdays, overdue check-ins, and calendar meetings
- **Friendship Streaks** - Gamified habit tracking that makes consistency visible and rewarding
- **Quick Log** - One-tap interaction logging that feeds the AI understanding of your social patterns
- **Smart Reminders** - Contextual push notifications that arrive when they're actually useful

### Data-Informed Insights
Import your existing communication history to build a richer picture of your relationships:
- **WhatsApp** - Chat exports reveal conversation patterns and topics
- **Discord** - DM history surfaces digital friendships
- **Email** - Gmail, mbox, or eml imports for professional and personal contacts

### AI Coaching
The core of what makes Prosocial different—AI that learns your social patterns and provides actionable guidance:
- **Pre-meeting Briefs** - Context and talking points based on relationship history
- **Pattern Recognition** - Surface trends in your social habits you might not notice yourself
- **Awkwardness Detection** - Identify relationships that need attention before they fade
- **Conversation Starters** - Personalized suggestions based on shared interests and history

### Privacy by Design
Sensitive social data demands serious protection:
- **Client-side Encryption** - Notes are encrypted before they ever leave your device
- **Row-level Security** - Supabase RLS ensures complete data isolation between users
- **Zero Tracking** - Your relationship data is never sold or used for advertising
- **Full Data Portability** - Export everything, anytime—your data belongs to you

## Tech Stack

Built for cross-platform reach with a privacy-conscious architecture:

| Layer | Technology | Why |
|-------|------------|-----|
| **Frontend** | Expo (React Native) + Expo Router | Single codebase for iOS, Android, and web |
| **Styling** | NativeWind (Tailwind for RN) | Rapid UI iteration with consistent design tokens |
| **Backend** | Supabase (Postgres + Auth + Storage) | Open-source, self-hostable, built-in RLS |
| **State** | Zustand | Minimal boilerplate, excellent TypeScript support |
| **AI** | OpenAI API | Flexible, with graceful fallback to local tips |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (free tier works)

### 1. Clone and Install

```bash
git clone https://github.com/leo-hammett/prosocial.git
cd prosocial
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration:

```sql
-- Copy contents of supabase/migrations/001_initial_schema.sql
```

3. Get your API credentials from Settings → API

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_OPENAI_API_KEY=sk-... # Optional, for AI features
```

### 4. Run the App

```bash
# Web
npm run web

# iOS Simulator
npm run ios

# Android Emulator
npm run android
```

### 5. Try Demo Mode

If you want to test without setting up Supabase:
1. Open the app
2. Click "Get Started"
3. Click "Try Demo Mode"

This loads sample data so you can explore all features.

## Architecture

The codebase follows a clean separation of concerns—UI, business logic, and data access are decoupled to enable rapid iteration on any layer.

```
prosocial/
├── app/                    # Expo Router screens (file-based routing)
│   ├── (tabs)/            # Main tab navigation
│   │   ├── index.tsx      # Today screen - your daily social brief
│   │   ├── people.tsx     # People list with search/filter
│   │   ├── streaks.tsx    # Gamified streak dashboard
│   │   └── settings.tsx   # Privacy controls & preferences
│   ├── (auth)/            # Auth flow
│   │   ├── login.tsx
│   │   └── signup.tsx
│   └── person/            # Person detail screens
│       ├── [id].tsx       # Full relationship view
│       ├── new.tsx        # Add new person
│       └── edit/[id].tsx  # Edit existing
├── components/            # Reusable UI components
│   ├── ui/               # Design system primitives
│   ├── PersonCard.tsx    # Person list item
│   ├── StreakCard.tsx    # Streak visualization
│   └── TodayCard.tsx     # Daily action items
├── lib/                   # Core business logic
│   ├── supabase.ts       # Database client
│   ├── crypto.ts         # Client-side encryption
│   ├── streaks.ts        # Streak calculation engine
│   ├── coaching.ts       # AI coaching logic
│   ├── notifications.ts  # Push notification handling
│   ├── calendar.ts       # Calendar sync
│   ├── offline.ts        # Offline-first support
│   └── imports/          # Data import parsers
│       ├── whatsapp.ts   # WhatsApp chat parser
│       ├── discord.ts    # Discord DM parser
│       └── email.ts      # Email (Gmail/mbox/eml)
├── stores/               # Zustand state management
│   ├── authStore.ts      # Auth state + session
│   ├── peopleStore.ts    # People CRUD + cache
│   ├── interactionsStore.ts  # Interaction logging
│   └── streaksStore.ts   # Streak state + calculations
└── supabase/
    └── migrations/       # Database schema (version controlled)
```

## Configuration

### Push Notifications

1. Create an Expo account at [expo.dev](https://expo.dev)
2. Get your project ID
3. Add to `.env`:

```env
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

4. Build with EAS:

```bash
npx eas build --platform ios
npx eas build --platform android
```

### Google Calendar Integration

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Calendar API
3. Create OAuth credentials
4. Add to `.env`:

```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### OpenAI (for AI Coaching)

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Add to `.env`:

```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-key
```

Note: AI features work without this - they fall back to local tips.

## Deployment

### Web (Vercel/Netlify)

```bash
npx expo export --platform web
# Deploy the dist/ folder
```

### iOS/Android (EAS Build)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build for stores
eas build --platform ios
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run typecheck
```

## Privacy & Security

Social data is inherently sensitive. Prosocial takes a principled approach to data handling—collecting only what's needed for functionality, encrypting what's personal, and giving you full control.

### Encryption Model

| Data Type | Encrypted | Reason |
|-----------|-----------|--------|
| Notes about people | ✅ Client-side | Personal observations stay private |
| Interaction notes | ✅ Client-side | Conversation details are sensitive |
| Names, dates, tags | ❌ | Required for search, sort, reminders |
| Relationship types | ❌ | Needed for filtering and AI context |
| Timestamps | ❌ | Required for streak calculations |

### User Control

- **Full Export** - Download all your data anytime (Settings → Export My Data)
- **Complete Deletion** - Remove your account and all associated data permanently
- **Granular Permissions** - Revoke calendar/Google access independently
- **Self-hosting Option** - Supabase backend can be self-hosted for complete data sovereignty

## Roadmap

Prosocial is actively evolving. Current focus areas:

- [ ] **Relationship Health Scores** - ML-derived metrics for relationship strength
- [ ] **Group Dynamics** - Track friend groups and social circles
- [ ] **Calendar Intelligence** - Suggest optimal times to reach out based on both parties' schedules
- [ ] **Memory Prompts** - "Last time you saw Alex, you talked about..." context before meetings
- [ ] **Cross-device Sync** - Seamless experience across phone, tablet, and desktop

## Contributing

This is an open experiment—contributions are welcome.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-idea`)
3. Make your changes
4. Submit a PR with a clear description of what problem you're solving

Particularly interested in contributions around:
- Accessibility improvements
- Additional data import sources
- Privacy-preserving AI techniques
- UI/UX refinements

## License

MIT License - see LICENSE file

## Connect

- **Issues**: [GitHub Issues](https://github.com/leo-hammett/prosocial/issues)
- **Email**: support@prosocial.app
- **Twitter**: [@prosocialapp](https://twitter.com/prosocialapp)

---

**Prosocial** is built on a simple premise: technology that understands our relationships can help us nurture them. This is an ongoing experiment in making that vision real—one friendship at a time.
