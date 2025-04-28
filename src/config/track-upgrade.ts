// Track upgrade configuration shared by backend and frontend

export type TrackReward = {
  citizen?: number;
  victory_point?: number;
  tax?: number;
  glory?: number;
  dice?: number;
  [key: string]: number | undefined;
};

export type TrackUpgrade = {
  cost: number;
  reward: TrackReward;
};

export type TrackType = 'economy' | 'culture' | 'military';

export const TRACKS: Record<TrackType, (TrackUpgrade | null)[]> = {
  economy: [
    null, // Level 1 (starting)
    { cost: 2, reward: { citizen: 3 } },
    { cost: 2, reward: { citizen: 3 } },
    { cost: 3, reward: { victory_point: 5 } },
    { cost: 3, reward: {} },
    { cost: 4, reward: {} },
    { cost: 4, reward: { victory_point: 10 } },
  ],
  culture: [
    null,
    { cost: 1, reward: {} },
    { cost: 4, reward: { tax: 1 } },
    { cost: 6, reward: { dice: 1 } },
    { cost: 6, reward: { tax: 1 } },
    { cost: 7, reward: { tax: 1 } },
    { cost: 7, reward: { tax: 2 } },
  ],
  military: [
    null,
    { cost: 2, reward: { glory: 1 } },
    { cost: 3, reward: {} },
    { cost: 4, reward: { glory: 1 } },
    { cost: 5, reward: {} },
    { cost: 7, reward: { glory: 1 } },
    { cost: 9, reward: { glory: 2 } },
  ],
}; 