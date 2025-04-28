// GameState class for managing game flow, rounds, and phases

export type GamePhase =
  | 'Setup'
  | 'Event Announcement'
  | 'Tax'
  | 'Dice'
  | 'Action'
  | 'Progress'
  | 'Event Resolution'
  | 'Achievement Tracking';

export type GameStatus = 'lobby' | 'in_progress' | 'completed' | 'abandoned' | 'setup';

export interface GameRow {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  ended_at?: string;
  max_players: number;
  min_players: number;
  status: GameStatus;
  current_round: number;
  total_round: number;
  current_phase: GamePhase;
  is_public: boolean;
  join_code?: string;
  game_options: Record<string, unknown>;
  setup_started_at?: string;
}

const PHASES: GamePhase[] = [
  'Setup',
  'Event Announcement',
  'Tax',
  'Dice',
  'Action',
  'Progress',
  'Event Resolution',
  'Achievement Tracking',
];

export class GameState {
  public readonly game: GameRow;
  static PHASES = PHASES;

  constructor(game: GameRow) {
    this.game = game;
  }

  get id() { return this.game.id; }
  get round() { return this.game.current_round; }
  get totalRounds() { return this.game.total_round; }
  get phase() { return this.game.current_phase; }
  get status() { return this.game.status; }

  isGameOver(): boolean {
    return (
      this.game.current_round >= this.game.total_round &&
      this.game.current_phase === 'Achievement Tracking'
    );
  }

  canAdvancePhase(): boolean {
    return !this.isGameOver();
  }

  nextPhase(): GamePhase {
    const idx = PHASES.indexOf(this.game.current_phase);
    if (idx === -1 || idx === PHASES.length - 1) {
      return PHASES[1]; // After last phase, go to Event Announcement
    }
    return PHASES[idx + 1];
  }

  prevPhase(): GamePhase {
    const idx = PHASES.indexOf(this.game.current_phase);
    if (idx <= 1) return PHASES[1]; // Don't go before Event Announcement
    return PHASES[idx - 1];
  }

  advancePhase(): GameState {
    if (!this.canAdvancePhase()) return this;
    let newPhase = this.nextPhase();
    let newRound = this.game.current_round;
    // If moving from last phase to first, increment round
    if (this.game.current_phase === 'Achievement Tracking') {
      if (this.game.current_round < this.game.total_round) {
        newRound++;
        newPhase = 'Event Announcement';
      }
    }
    return new GameState({ ...this.game, current_phase: newPhase, current_round: newRound });
  }

  // Static helper to initialize a new game
  static initNewGame(params: Partial<GameRow> & { id?: string; name: string; created_by: string; }): GameRow {
    return {
      ...(params.id ? { id: params.id } : {}),
      name: params.name,
      created_by: params.created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      max_players: params.max_players || 4,
      min_players: params.min_players || 2,
      status: 'setup',
      current_round: 1,
      total_round: params.total_round || 9,
      current_phase: 'Setup',
      is_public: params.is_public ?? true,
      game_options: params.game_options || {},
      // Add other fields as needed
    } as GameRow;
  }

  validatePhaseTransition(nextPhase: GamePhase): { valid: boolean; reason?: string; updates?: Partial<GameRow> } {
    // Block next phase if at last round and phase is Achievement Tracking
    if (
      this.game.current_phase === 'Achievement Tracking' &&
      this.game.current_round === this.game.total_round &&
      nextPhase === 'Event Announcement'
    ) {
      return {
        valid: false,
        reason: 'Cannot proceed to next phase: last round reached. Start final scoring.'
      };
    }
    const updates: Partial<GameRow> = { current_phase: nextPhase };
    // Only increment round if moving from Achievement Tracking to Event Announcement
    if (
      this.game.current_phase === 'Achievement Tracking' &&
      nextPhase === 'Event Announcement'
    ) {
      if (this.game.current_round < this.game.total_round) {
        updates.current_round = this.game.current_round + 1;
      }
    }
    // If moving to Setup phase, set setup_started_at and status
    if (nextPhase === 'Setup') {
      updates.setup_started_at = new Date().toISOString();
      updates.status = 'setup';
    }
    return { valid: true, updates };
  }

  // Add more helpers as needed (e.g., validate transitions, get phase index, etc.)
} 