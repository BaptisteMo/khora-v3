# Khora Game Database Structure

This directory contains SQL migrations for setting up the Supabase database schema for the Khora game.

## Core Game Data Tables

The database is structured around these main tables:

### 1. Profiles
Extends Supabase Auth users with game-specific profile information.
- `id` - References auth.users(id), the primary user identifier
- `username` - Unique username for the player
- `display_name` - Display name shown in games
- `avatar_url` - URL to user's avatar
- `games_played`, `games_won`, `games_lost` - Game statistics

### 2. Games
Stores information about each game session.
- `id` - Unique game identifier
- `name` - Name of the game room
- `status` - Current game state (lobby, in_progress, completed, abandoned)
- `current_round`, `current_phase` - Track game progression
- `join_code` - Code for joining private games
- Various configuration options and timestamps

### 3. Game Participants
Links users to games they've joined.
- `game_id` - Reference to the game
- `user_id` - Reference to the user profile
- `player_number` - Position in turn order (1-4)
- `is_host` - Whether this participant is the host
- `is_active` - Whether the player is still active in the game

### 4. Player State
Tracks the current state of each player in a game.
- `game_id` - Reference to the game
- `participant_id` - Reference to the participant
- `score` - Current score
- Track positions (glory, citizen, tax, culture, military, economy, philosophy)
- `resources` - JSONB object containing resource counts
- Action tracking for game phases

## Security Policies

Row Level Security (RLS) policies are implemented for all tables to ensure:
- Users can only update their own profiles
- Game data is only visible to participants (except public games)
- Game state modifications follow proper authorization rules

## How to Apply Migrations

These SQL files should be executed in your Supabase project's SQL editor in the following order:

1. `01_core_game_tables.sql` - Creates the basic tables and relationships
2. `01_core_game_security.sql` - Applies security policies to the tables

Future migrations will follow the same numbered pattern for clarity.

## Triggers

Several triggers are included:
- Automatic profile creation when a user signs up
- Player state creation when a player joins a game
- Timestamp updates when records are modified
- Game statistic updates when games change status 