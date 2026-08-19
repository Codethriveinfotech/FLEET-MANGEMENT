# FleetTrack Architecture & Blueprint Documentation

Welcome to the **FleetTrack** System Engineering Blueprint. This document outlines the structural framework, coding guidelines, communication standards, and data flows designed for a production-grade enterprise deployment.

---

## 1. Directory Tree & Explanations

Here is the complete folder layout established for FleetTrack:

```text
fleet/
├── assets/                    # Shared global media assets (logos, splash, icons)
├── docs/                      # Technical documentation
│   └── architecture.md        # Comprehensive architecture & design document [THIS FILE]
├── shared/                    # Core libraries shared between Client and Server
│   ├── src/
│   │   ├── constants/         # Shared status enums and codes
│   │   ├── types/             # Common model interfaces (User, Vehicle, API responses)
│   │   ├── utils/             # Regex patterns, verification helpers
│   │   └── index.ts           # Central module exports
│   ├── package.json
│   └── tsconfig.json
├── backend/                   # Node.js + Express.js + TypeScript Backend
│   ├── prisma/
│   │   └── schema.prisma      # Relational schemas & enums
│   ├── src/
│   │   ├── config/            # Prisma connection, environmental validations
│   │   ├── controllers/       # HTTP Request controller mappings
│   │   ├── middlewares/       # JWT decoding, express error bounds, authorization
│   │   ├── routes/            # Route configurations mapping URLs to controllers
│   │   ├── services/          # Pure business logic and database CRUD execution
│   │   ├── utils/             # Winston logger, Cloudflare R2 bucket clients, response wrappers
│   │   └── app.ts             # Express loader
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── frontend/                  # React Native + Expo Application
    ├── src/
    │   ├── api/               # Axios instances, Axios interceptors, React Query hooks
    │   ├── components/        # UI elements organized atomically
    │   ├── config/            # Location, Camera, Map client setup configurations
    │   ├── hooks/             # Custom triggers (e.g. useLocationTracker, useOfflineSync)
    │   ├── navigation/        # Stack, Tab, Drawer, Role-based route redirection
    │   ├── store/             # Zustand state management slices
    │   ├── theme/             # Styling color tokens, layout spacing, fonts
    │   └── App.tsx            # Main App React Native bootstrap
    ├── .env.example
    ├── package.json
    └── tsconfig.json
```

---

## 2. Key Architecture Explanations

### Coding Standards & Naming Conventions
- **TypeScript Strictness**: `strict: true` is enforced across all configurations. All parameters must have explicit types. Avoid `any`.
- **Files**: Use kebab-case for utility/asset files (e.g., `user-validator.ts`) and PascalCase for components (e.g., `Button.tsx`).
- **Git Branching Strategy**: Use Trunk-Based Development or GitHub Flow:
  - `main` / `production`: Protected production release branch.
  - `staging`: Automated releases for QA testing.
  - `feature/*`: Short-lived feature branches, merged via reviewed Pull Requests.

### Communication between Frontend & Backend
- Communication uses **REST over HTTP/S** with JSON payloads.
- Custom headers (`Authorization: Bearer <JWT_ACCESS_TOKEN>`) secure all routes.
- Multipart-form requests upload receipts or vehicle pictures directly through `multer` to backend services, which stream the files to Cloudflare R2 bucket.

### Authentication & Role Flow
1. The app requests a login; the backend returns `accessToken` (in-memory expiration 15m) and `refreshToken` (HttpOnly or SecureStore persistent storage, 30d).
2. The user's role (`SUPER_ADMIN`, `ADMIN`, `DRIVER`) is returned with the token payload.
3. React Navigation evaluates the Zustand `useAuthStore` credentials:
   - Not authenticated -> Navigates to `AuthNavigator` (Login, Reset Password screens).
   - Authenticated:
     - `SUPER_ADMIN` or `ADMIN` -> Switched to `AdminDashboardNavigator` (Vehicles, Drivers, Expenses).
     - `DRIVER` -> Switched to `DriverDashboardNavigator` (Logs, Camera Uploads, GPS Tracker).

### State Management & Offline Queueing
- **Zustand** controls volatile UI state, user sessions, and sync queues.
- **React Query** manages server cache invalidations and query pagination.
- **Offline Mode**: A custom hook `useOfflineSync` tracks device connectivity (`@react-native-community/netinfo`). If offline, outgoing modifications (mutations) are queued into Zustand state and backed up to MMKV. Once online, they are flushed FIFO style.

### Theme & Design Tokens
The styling module (`frontend/src/theme/`) defines:
- **Color System**: Curated Tailwind/Slate style colors (`Slate-900` for text, `Slate-50` for screen backgrounds, HSL tailored accent colors).
- **Typography**: Inter/Outfit style font configs with explicit fontWeights, lineHeights, and scale sizes.
- **Spacing**: Base-8 grid spacing tokens (8px, 16px, 24px, 32px, 48px).
