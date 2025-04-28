// Effect handler system for city developments
import { CityEffect } from '@/data/cities';

// Minimal PlayerState type for demonstration (replace with your actual type)
export interface PlayerState {
  id: string;
  city_id: string;
  level: number;
  resources: Record<string, number>;
  tracks?: Record<string, number>;
  victoryPoints?: number;
  glory?: number;
  // ...other fields as needed
}

// Effect handler type
type EffectHandler = (player: PlayerState, effect: CityEffect) => void;

// Effect handler registry
const effectHandlers: Record<string, EffectHandler> = {
  track_upgrade: (player, effect) => {
    // Example: { track: 'economy', level: 2, grantBonus: true }
    const { track, level, grantBonus } = effect.params || {};
    if (!track || !level) return;
    if (!player.tracks) player.tracks = {};
    player.tracks[track] = (player.tracks[track] || 0) + level;
    // TODO: Apply bonus if grantBonus is true
  },
  resource_bonus: (player, effect) => {
    // Example: { drachmas: 4 }
    const { drachmas } = effect.params || {};
    if (typeof drachmas === 'number') {
      player.resources.drachmas = (player.resources.drachmas || 0) + drachmas;
    }
  },
  victory_point: (player, effect) => {
    // Example: { amount: 15 }
    const { amount } = effect.params || {};
    if (typeof amount === 'number') {
      player.victoryPoints = (player.victoryPoints || 0) + amount;
    }
  },
  glory: (player, effect) => {
    // Example: { amount: 2 }
    const { amount } = effect.params || {};
    if (typeof amount === 'number') {
      player.glory = (player.glory || 0) + amount;
    }
  },
  // Add more handlers as needed
};

// Main function to apply a city development effect to a player state
export function applyDevelopmentEffect(player: PlayerState, effect: CityEffect) {
  const handler = effectHandlers[effect.type];
  if (handler) {
    handler(player, effect);
  } else {
    // For 'todo' or unknown types, log or skip
    console.warn(`No handler for effect type: ${effect.type}`);
  }
}

// Example extension: add new effect types by adding to effectHandlers 