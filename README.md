# Khora Multiplayer Game Platform

A modern multiplayer game platform built with Next.js, Supabase, and shadcn/ui. This project features robust authentication, user profile management, and a real-time multiplayer waiting room/lobby system with host management.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Main Files & Structure](#main-files--structure)
- [Development Workflow](#development-workflow)
- [Usage Guide](#usage-guide)
- [Tech Stack](#tech-stack)
- [Learn More](#learn-more)
- [Deployment](#deployment)

---

## Project Overview

Khora is a Next.js-based platform for multiplayer games. It provides:
- Secure authentication and user management
- Persistent user profiles and game stats
- Real-time waiting room/lobby for multiplayer games
- Host assignment and game start logic
- Seamless join/leave/rejoin experience for all users

---

## Architecture

- **Frontend:** Next.js (App Router), React, shadcn/ui
- **Backend:** Supabase (Postgres, Auth, Storage)
- **State Management:** React Context for auth, SWR/polling for real-time updates
- **Database:**
  - `users` (managed by Supabase Auth)
  - `profiles` (user info, stats, avatar)
  - `games` (game metadata, including `created_by` for host)
  - `game_participants` (join table for users in games, with `player_number`, `is_host`, `is_active`)

---

## Key Features

### Authentication & Profile Management
- Email/password registration and login (Supabase Auth)
- JWT session management, automatic refresh
- Global `AuthProvider` context for user/session/profile state
- Profile page with stats, avatar, and game history
- Profile editing (username, avatar upload)
- Protected routes for authenticated users
- Ensured all updates are reflected in real time via Supabase subscriptions.

### Multiplayer Waiting Room & Lobby
- **Join/Leave/Rejoin:**
  - Users can join a game room as a participant. Leaving sets them inactive; rejoining reactivates them (no duplicates).
  - All users see a live-updating list of active participants.
- **Host Assignment:**
  - The host is always the user who created the game (`created_by` in `games` table).
  - Host is visually marked; only host sees the "Start Game" button.
- **Participant Management:**
  - Each participant has a persistent `player_number`.
  - Robust upsert logic prevents duplicate keys and ensures correct state.
- **Game Start:**
  - Host can start the game, updating the game status for all participants.

### In-Game Host Controls & Player Management
- **Host-Only Controls:**
  - The host can pause/resume the game and navigate between phases using dedicated controls in the in-game UI.
- **Player Management:**
  - The host can kick players or promote another player to host during the game.
- **Visual Host Indicators:**
  - The host is clearly marked in all player lists and tables.
- **Real-Time Updates:**
  - All actions (pause, phase change, player management) are synchronized in real time for all players.
- **Pause Banner:**
  - When the game is paused, a banner is shown to all players until the host resumes the game.

These features are available in the in-game UI after the game has started, providing robust session management and a smooth multiplayer experience.

## Multiplayer Game State Management

- Implemented a `GameProvider` React context (`src/app/game/[id]/GameStateContext.tsx`) to centralize all multiplayer game state and real-time updates.
- The provider:
  - Fetches and subscribes to game, participant, and player state changes using Supabase real-time channels.
  - Exposes a single `useGame` hook for accessing:
    - `gameState` (with phase/round helpers)
    - `participants` (host, active, left info)
    - `playerStates` (all per-player stats and tokens)
    - `loading` and `error` states
    - `refresh` and `updatePhase` methods
  - Cleans up all subscriptions on unmount for reliability.
- All types for participants, player states, and context values are strictly defined for type safety.
- This enables a robust, real-time multiplayer experience and makes it easy to build new game features on top of a single, reliable state source.

## Game Rounds & Phase Management

The game is structured into multiple **rounds**, each consisting of a fixed sequence of **phases**:
- `Setup`, `Event Announcement`, `Tax`, `Dice`, `Action`, `Progress`, `Event Resolution`, `Achievement Tracking`
- The current round and phase are tracked in the database (`games` table: `current_round`, `total_round`, `current_phase`).

### Advancing Phases & Rounds
- The host can advance the phase using in-game controls.
- When the last phase (`Achievement Tracking`) is completed, the round increments (unless at the final round).
- The backend enforces valid transitions and prevents advancing past the final round.

### Idempotency
- Key actions (tax phase, dice phase, event resolution) can only be performed once per round, enforced by the backend.

## GameProvider & Real-Time Round Sync

- The [`GameProvider`](src/app/game/[id]/GameStateContext.tsx) React context is the **central hub for all game state**, including round and phase management.
- It:
  - Fetches the latest game state (including `current_round` and `current_phase`) from the backend.
  - Subscribes to real-time updates for the game, participants, and player states using Supabase channels.
  - Exposes the current round, total rounds, and phase to all components via the `useGame()` hook.
  - Provides an `updatePhase` method to trigger phase changes (and round increments, if appropriate).
- The UI always reflects the latest round/phase, and all round-based actions (like dice rolls or tax collection) are automatically locked to once per round.

### How to Use in Development

- To access the current round or phase in any React component, use:
  ```typescript
  const { gameState } = useGame();
  const round = gameState?.round;
  const phase = gameState?.phase;
  ```
- To advance the phase (host only):
  ```typescript
  const { updatePhase } = useGame();
  await updatePhase(nextPhase);
  ```

## Backend Enforcement

- The backend API routes for dice phase, tax phase, and event resolution all check the current round and ensure each action is only performed once per round.
- The round and phase logic is centralized in [`src/lib/game-state.ts`](src/lib/game-state.ts) and [`src/lib/db-utils.ts`](src/lib/db-utils.ts).

## Summary Table: Round & Phase Management

| File/Module                                      | Purpose in Round Management                                                                 |
|--------------------------------------------------|---------------------------------------------------------------------------------------------|
| `game-state.ts`                                  | Core round/phase logic, round increment, validation                                         |
| `game-init.ts`                                   | Sets up initial round values for new games                                                  |
| `db-utils.ts`                                    | Updates round/phase in the database                                                         |
| `dice-phase/route.ts`, `tax-phase/route.ts`      | Enforces one action per round, updates round markers                                        |
| `event-resolution/route.ts`                      | Applies event for the current round                                                         |
| `GameStateContext.tsx` (GameProvider)            | Provides real-time round/phase info to the frontend                                         |
| `database.types.ts`                              | Type definitions for round fields                                                           |

---

## Main Files & Structure

- `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/profile/page.tsx`, `src/app/profile/edit/page.tsx`
- `src/app/game/[id]/page.tsx`

---

## Task 4: Knowledge Token Counters & Philosophy Token Usage

- Implemented a new system for tracking knowledge tokens using 7 explicit counters per player:
  - `red_minor_counter`, `red_major_counter`, `blue_minor_counter`, `blue_major_counter`, `green_minor_counter`, `green_major_counter`, `any_color_counter`
- Updated the database schema and backend logic to increment/decrement these counters based on game actions (military, commerce, politics, etc).
- The philosophy token 'use' action now increments the `any_color_counter` and decrements the player's philosophy token count.
- The in-game UI now displays a table showing all 7 counters for every player, visible to all participants.
- Removed the old knowledge token pool UI and logic.
- Ensured all updates are reflected in real time via Supabase subscriptions.

## Track Upgrade System

The game features a track upgrade system for three tracks: Economy, Culture, and Military. Each player can upgrade their tracks during the Progress phase, paying drachmas and receiving rewards according to the level.

### Implementation Summary
- The upgrade logic is implemented in the backend at `src/app/api/games/[id]/track-upgrade/route.ts`.
- **Track upgrade costs and rewards are now defined in a single shared config file:** `src/config/track-upgrade.ts`.
- Both the backend and frontend import the `TRACKS` object from this config file, ensuring a single source of truth.
- The frontend UI for upgrading tracks is in `src/app/game/[id]/page.tsx`.
- The upgrade button is only enabled if the player can afford the upgrade and there are further levels available.
- Rewards can include citizens, victory points, tax, glory, dice, etc. Victory points are now awarded as part of the upgrade process for certain levels.
- The button is disabled if the player is at the maximum level (level 7) for a track.

### How to Add or Modify Track Levels/Rewards

To add more levels or change the cost/reward structure for any track:

1. **Update the TRACKS Object:**
   - Open `src/config/track-upgrade.ts`.
   - Locate the `TRACKS` constant in this file.
   - Each track (economy, culture, military) is an array where the index represents the level.
   - To add a new level, append a new object with the desired `cost` and `reward`.
   - To modify an existing level, change the `cost` or `reward` values for that level.
   - Example:
     ```typescript
     export const TRACKS = {
       economy: [
         null, // Level 0 (unused)
         null, // Level 1 (starting)
         { cost: 2, reward: { citizen: 3 } },
         { cost: 2, reward: { citizen: 3 } },
         { cost: 3, reward: { victory_point: 5 } },
         { cost: 3, reward: {} },
         { cost: 4, reward: {} },
         { cost: 4, reward: { victory_point: 10 } },
         { cost: 5, reward: { victory_point: 15 } }, // Example new level 8
       ],
       // ...
     }
     ```

2. **Test the Upgrade Flow:**
   - Start the game and progress to the Progress phase.
   - Attempt to upgrade tracks and verify the new/modified levels and rewards are applied correctly.

3. **(Optional) Update Database Schema:**
   - If you introduce new reward types, ensure the `player_state` table has the necessary columns.

**Note:** The upgrade button will automatically be disabled if there are no further upgrades available for the selected track.

---

## Feature-to-File Mapping

### **Authentication & Profile Management**
- **Frontend:**
  - `src/app/login/page.tsx` — Login form and logic
  - `src/app/signup/page.tsx` — Signup form and logic
  - `src/app/profile/page.tsx` — User profile display
- `src/app/profile/edit/page.tsx` — Profile editing UI
- **Backend/Database:**
  - Supabase Auth (authentication)
  - `profiles` table (user info, stats, avatar)

---

### **Waiting Room & Lobby**
- **Frontend:**
  - `src/app/game/[id]/page.tsx` — Waiting room UI, participant list, join/leave logic
- **Backend/API:**
  - `src/app/api/games/[id]/route.ts` — Fetch game and participants

---

### **Host Controls (Pause, Phase, Kick, Promote)**
- **Frontend:**
  - `src/app/game/[id]/page.tsx` — Host-only controls for pausing, phase navigation, kicking, and promoting
- **Backend/API:**
  - `src/app/api/games/[id]/route.ts` — Updates to game and participant state

---

### **In-Game UI & Player State Table**
- **Frontend:**
  - `src/app/game/[id]/page.tsx` — Main in-game interface, player state table, token counters
- **Backend/Database:**
  - `player_state` table (Supabase) — All player stats and counters
  - Real-time subscriptions for updates

---

### **Knowledge Token Counters (Task 4)**
- **Frontend:**
  - `src/app/game/[id]/page.tsx` — Table showing all 7 token counters for each player
- **Backend/Database:**
  - `player_state` table — Columns: `red_minor_counter`, `red_major_counter`, `blue_minor_counter`, `blue_major_counter`, `green_minor_counter`, `green_major_counter`, `any_color_counter`

---

### **Philosophy Token Usage**
- **Frontend:**
  - `src/app/game/[id]/page.tsx` — Button and logic for using a philosophy token
- **Backend/API:**
  - `src/app/api/games/[id]/philosophy-token/use/route.ts` — Handles token usage, updates counters

---

### **Tax Phase Logic**
- **Frontend:**
  - `src/app/game/[id]/page.tsx` — Triggers tax phase from UI
- **Backend/API:**
  - `src/app/api/games/[id]/tax-phase/route.ts` — Tax phase logic

---

### **Game API (Fetch Game, Participants)**
- **Backend/API:**
  - `src/app/api/games/[id]/route.ts` — Main endpoint for game and participant data

---

### **Test/Utility Components**
- **Frontend:**
  - `src/app/test-supabase/` — Test and utility components for development

---

## Development Workflow

1. **Setup Environment:**
   - Clone the repository
   - Install dependencies using `npm install`
   - Set up environment variables (e.g., Supabase credentials)

2. **Local Development:**
   - Start the development server using `npm run dev`
   - Use tools like Postman or Insomnia to test API endpoints

3. **Deployment:**
   - Deploy to a cloud provider (e.g., Vercel, AWS)
   - Set up continuous integration and deployment (CI/CD)

---

## Usage Guide

1. **Registration and Login:**
   - Visit the login page and sign up for a new account
   - Use the provided credentials to log in

2. **Creating a Game:**
   - Navigate to the game creation page
   - Fill in the game details and start the game

3. **Joining a Game:**
   - Navigate to the game room page
   - Use the game code to join the game

4. **Playing the Game:**
   - Use the in-game controls to play the game
   - Manage your tokens and progress

---

## Tech Stack

- **Frontend:** Next.js, React, shadcn/ui
- **Backend:** Supabase, Node.js, Express
- **State Management:** React Context
- **Database:** Supabase

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://reactjs.org/docs/getting-started.html)

---

## Deployment

- Deployed on Vercel
- Continuous Integration and Deployment with GitHub Actions

---


## TODO
- ~~Update the DICE upgrade for the culture update~~
- ~~Update the "1 per round" for the progress phase~~


## Conclusion

Khora is a powerful platform for multiplayer games, offering robust authentication, user profile management, and a real-time multiplayer experience. It's designed to be scalable and easy to use, making it a great choice for both developers and players.

## Task 8: Type Safety and Linting Improvements

### Enhanced Type Safety
- Replaced all instances of `any` type with proper TypeScript types across the codebase
- Added specific types for:
  - Resource records and game list items in test components
  - City effect parameters and track updates in game logic
  - Game progress updates in database utilities
  - Auth context dependencies with proper memoization

### Key Changes
- Created `ResourceBase` and `ResourceRecord` types for resource-related components
- Defined `GameProgressUpdate` and `TrackUpdate` types for game state management
- Improved React hooks dependency arrays with proper TypeScript types
- Added proper type definitions for database utility functions

### Files Updated
- `src/app/test-supabase/progress-tables-test.tsx`
- `src/app/test-supabase/resource-tables-test.tsx`
- `src/data/cities.ts`
- `src/lib/db-utils.ts`
- `src/lib/auth-context.tsx`

### Benefits
- Better IDE support with accurate type hints
- Catch potential type-related bugs at compile time
- More maintainable and self-documenting code
- Improved development experience with proper TypeScript integration