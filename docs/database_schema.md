# Khora Game Database Schema and Security Policies

This document provides a comprehensive overview of the database schema and row-level security (RLS) policies implemented for the Khora game application.

## Table of Contents

1. [Core Game Tables](#core-game-tables)
2. [Game Resource Tables](#game-resource-tables)
3. [Game Progress Tables](#game-progress-tables)
4. [Row-Level Security (RLS) Policies](#row-level-security-rls-policies)
5. [Security Best Practices](#security-best-practices)
6. [Testing Security Policies](#testing-security-policies)

## Core Game Tables

### Profiles Table
Stores user profile information linked to Supabase authentication.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, references auth.users.id |
| username | text | User's display name |
| avatar_url | text | URL to user's avatar image |
| created_at | timestamp | When the profile was created |
| updated_at | timestamp | When the profile was last updated |

### Games Table
Stores information about game sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Game name |
| created_by | uuid | User who created the game, references profiles.id |
| created_at | timestamp | When the game was created |
| started_at | timestamp | When the game started |
| ended_at | timestamp | When the game ended |
| is_public | boolean | Whether the game is publicly viewable |
| max_players | integer | Maximum number of players allowed |
| config | jsonb | Game configuration options |
| status | text | Game status (waiting, active, completed) |

### Game Participants Table
Links users to games they're participating in.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| game_id | uuid | References games.id |
| profile_id | uuid | References profiles.id |
| joined_at | timestamp | When the user joined the game |
| is_host | boolean | Whether the user is the game host |
| status | text | Participant status (joined, active, left) |

### Player State Table
Tracks the current state of each player in a game.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| game_id | uuid | References games.id |
| profile_id | uuid | References profiles.id |
| resources | jsonb | Player's current resources |
| score | integer | Player's current score |
| tracks | jsonb | Player's position on game tracks |
| updated_at | timestamp | When the state was last updated |

## Game Resource Tables

### Cities Table
Stores information about available cities in the game.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | City name |
| description | text | City description |
| level | integer | City level |
| resource_type | text | Primary resource type |
| points | integer | Points value |
| effects | jsonb | City effects on game mechanics |

### City Developments Table
Stores available developments that can be added to cities.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Development name |
| description | text | Development description |
| cost | integer | Cost to build |
| points | integer | Points value |
| resource_type | text | Type of resource it produces |
| effects | jsonb | Development effects |
| requirements | jsonb | Requirements to build |

### Politics Cards Table
Stores information about available politics cards.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Card name |
| description | text | Card description |
| cost | integer | Cost to play |
| points | integer | Points value |
| effects | jsonb | Card effects |
| is_active | boolean | Whether the card has an active effect |

### Player Politics Cards Table
Tracks which politics cards each player has.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| profile_id | uuid | References profiles.id |
| politics_card_id | uuid | References politics_cards.id |
| game_id | uuid | References games.id |
| acquired_at | timestamp | When the card was acquired |
| is_active | boolean | Whether the card is active |

### Knowledge Tokens Table
Stores information about available knowledge tokens.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Token name |
| description | text | Token description |
| points | integer | Points value |
| effects | jsonb | Token effects |

### Player Knowledge Tokens Table
Tracks which knowledge tokens each player has acquired.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| profile_id | uuid | References profiles.id |
| knowledge_token_id | uuid | References knowledge_tokens.id |
| game_id | uuid | References games.id |
| acquired_at | timestamp | When the token was acquired |

### Event Cards Table
Stores information about game event cards.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Event name |
| description | text | Event description |
| type | text | Event type |
| effects | jsonb | Event effects |

### Game Events Table
Tracks events that occur in a specific game.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| game_id | uuid | References games.id |
| event_card_id | uuid | References event_cards.id |
| round | integer | Game round when event occurs |
| resolved | boolean | Whether the event is resolved |
| effects_applied | boolean | Whether the effects have been applied |
| notes | text | Additional notes about the event |

## Game Progress Tables

### Achievements Table
Stores information about available game achievements.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Achievement name |
| description | text | Achievement description |
| category | text | Achievement category |
| points | integer | Points value |
| icon_name | text | Name of the achievement icon |
| requirements | jsonb | Requirements to earn the achievement |

### Player Achievements Table
Tracks which achievements each player has earned.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| profile_id | uuid | References profiles.id |
| achievement_id | uuid | References achievements.id |
| game_id | uuid | References games.id |
| earned_at | timestamp | When the achievement was earned |

### Game Logs Table
Tracks events and actions in a game for history and achievements.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| game_id | uuid | References games.id |
| player_id | uuid | References profiles.id |
| event_type | text | Type of event logged |
| description | text | Human-readable description |
| event_data | jsonb | Detailed event data |
| created_at | timestamp | When the log was created |

## Row-Level Security (RLS) Policies

### Core Game Tables Security

#### Profiles Table
- **Profiles are viewable by everyone**: Anyone can view profile information
- **Users can update their own profile**: Users can only update their own profile
- **Users can insert their own profile**: Users can only create their own profile

#### Games Table
- **Games are viewable by participants and public games by anyone**: Games are visible to participants or if marked as public
- **Only hosts can update games**: Only the game host can update game settings
- **Authenticated users can create games**: Any authenticated user can create a new game
- **Only game creator can delete games**: Only the original creator can delete a game

#### Game Participants Table
- **Participants are viewable by anyone in the same game**: All participants in a game can see other participants
- **Users can join games**: Authenticated users can join games
- **Participants can update their own status**: Users can update their own participation status
- **Hosts can update participants**: Game hosts can update any participant's information

#### Player State Table
- **Player state is readable by game participants**: Only participants in the game can view player states
- **Players can update their own state**: Users can only update their own game state
- **Hosts can update any player state**: Game hosts can update any player's state

### Game Resource Tables Security

#### Cities and City Developments Tables
- **Cities are viewable by game participants**: Only participants can view city data
- **Players can only update their own city**: Users can only update their own city
- **City developments are viewable by game participants**: Only participants can view development data
- **Players can only update developments in their own city**: Users can only modify their own developments

#### Politics Cards and Knowledge Tokens Tables
- **Definitions are readable by all authenticated users**: Card and token definitions are visible to all users
- **Player cards/tokens are viewable by game participants**: Specific player cards/tokens are only visible to game participants
- **Players can only update their own cards/tokens**: Users can only modify their own cards/tokens

#### Event Cards and Game Events Tables
- **Event cards definitions are readable by all authenticated users**: Event card definitions visible to all users
- **Game events are viewable by game participants**: Specific game events only visible to participants
- **Only hosts can update game events**: Only game hosts can modify game events

### Game Progress Tables Security

#### Achievements Table
- **Achievements are viewable by everyone**: Achievement definitions visible to all users
- **Only authenticated users can create/update achievements**: Only authenticated users can create or modify achievements

#### Player Achievements Table
- **Player achievements are viewable by everyone**: Anyone can see which achievements players have earned
- **Players can insert their own achievements**: Users can record their own achievement progress

#### Game Logs Table
- **Game logs are viewable by game participants**: Only participants can view game logs
- **Game logs can be inserted by participants**: Only participants can create log entries

## Security Best Practices

The following security best practices are implemented in our database:

1. **Principle of Least Privilege**: Users can only access what they need
2. **Data Isolation**: Game data is isolated between different games
3. **Ownership Controls**: Users can only modify their own resources
4. **Public vs. Private Data**: Clear separation between what's public vs. private
5. **Host Privileges**: Game hosts have elevated permissions within their games

## Testing Security Policies

To test the RLS policies, you can use the following approaches:

1. **As a regular user**:
   - Attempt to view/modify your own profile (should succeed)
   - Attempt to view/modify another user's profile (should fail)
   - Join a game and verify you can see game data (should succeed)
   - Try to modify game settings as a non-host (should fail)

2. **As a game host**:
   - Create a game and verify host privileges (should succeed)
   - Modify game settings (should succeed)
   - Update other participants' status (should succeed)
   - Verify you cannot modify data in games you don't host (should fail)

3. **As an unauthenticated user**:
   - Attempt to view public data (should succeed)
   - Attempt to view private game data (should fail)
   - Attempt to modify any data (should fail)

You can use Supabase client libraries with different user sessions to test these scenarios programmatically. 