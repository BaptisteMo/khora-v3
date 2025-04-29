// City definitions generated from raw_city_data.md
// TODO: Implement effect logic for all effect types marked as 'todo'

export type KnowledgeTokenColor = 'red' | 'blue' | 'green';

type Track = 'economy' | 'military' | 'culture' | 'army' | 'tax';

type CityEffectParams = {
  track?: Track;
  level?: number;
  grantBonus?: boolean;
  amount?: number;
  drachmas?: number;
  philosophy?: number;
};

export type CityEffect = {
  type: string; // e.g. 'track_upgrade', 'resource_bonus', 'special', 'todo'
  params?: CityEffectParams;
  description: string;
};

export type CityDevelopment = {
  level: number;
  requirements: {
    drachmas: number;
    knowledgeTokens: { color: KnowledgeTokenColor; amount: number }[];
  };
  effect: CityEffect;
};

export type City = {
  id: string;
  name: string;
  description: string;
  startingEffect: CityEffect;
  developments: CityDevelopment[];
};

export const CITIES: City[] = [
  {
    id: 'milet',
    name: 'Milet',
    description: 'blabla',
    startingEffect: {
      type: 'track_upgrade',
      params: { track: 'economy', level: 2, grantBonus: true },
      description: 'Start the game with economy track level 2 (gain the bonus from level 2)'
    },
    developments: [
      {
        level: 1,
        requirements: {
          drachmas: 1,
          knowledgeTokens: [{ color: 'red', amount: 1 }]
        },
        effect: {
          type: 'todo',
          description: 'Choose 2 tracks (economy, military, culture), gain 1 level on each for free (gain reward if applicable)'
        }
      },
      {
        level: 2,
        requirements: {
          drachmas: 2,
          knowledgeTokens: [
            { color: 'red', amount: 2 },
            { color: 'green', amount: 1 }
          ]
        },
        effect: {
          type: 'todo',
          description: 'Each commerce action performed, player gains 3 victory points automatically'
        }
      },
      {
        level: 3,
        requirements: {
          drachmas: 4,
          knowledgeTokens: [
            { color: 'red', amount: 3 },
            { color: 'green', amount: 2 }
          ]
        },
        effect: {
          type: 'victory_point',
          params: { amount: 15 },
          description: 'Gain 15 victory points'
        }
      }
    ]
  },
  {
    id: 'argos',
    name: 'Argos',
    description: 'blabla',
    startingEffect: {
      type: 'track_upgrade',
      params: { track: 'army', level: 2 },
      description: 'Start the game with 2 in the army track'
    },
    developments: [
      {
        level: 1,
        requirements: {
          drachmas: 0,
          knowledgeTokens: [{ color: 'blue', amount: 2 }]
        },
        effect: {
          type: 'todo',
          description: 'Player chooses 1: gain 2 army, 3 drachmas, 4 victory points, or 5 citizen'
        }
      },
      {
        level: 2,
        requirements: {
          drachmas: 0,
          knowledgeTokens: [
            { color: 'blue', amount: 2 },
            { color: 'red', amount: 1 }
          ]
        },
        effect: {
          type: 'track_upgrade',
          params: { track: 'military', level: 1, grantBonus: true },
          description: 'Upgrade military track for 1 level for free (gain bonus if applicable)'
        }
      },
      {
        level: 3,
        requirements: {
          drachmas: 2,
          knowledgeTokens: [
            { color: 'blue', amount: 3 },
            { color: 'green', amount: 2 },
            { color: 'red', amount: 1 }
          ]
        },
        effect: {
          type: 'glory',
          params: { amount: 2 },
          description: 'Gain 2 glory points'
        }
      }
    ]
  },
  {
    id: 'corinthe',
    name: 'Corinthe',
    description: 'blabla',
    startingEffect: {
      type: 'resource_bonus',
      params: { drachmas: 4 },
      description: 'Start the game with 4 extra drachmas'
    },
    developments: [
      {
        level: 1,
        requirements: {
          drachmas: 1,
          knowledgeTokens: [{ color: 'red', amount: 1 }]
        },
        effect: {
          type: 'todo',
          description: 'Upgrade the tax track as much as the player has minor & major tokens (color doesn\'t matter)'
        }
      },
      {
        level: 2,
        requirements: {
          drachmas: 2,
          knowledgeTokens: [
            { color: 'red', amount: 2 },
            { color: 'blue', amount: 1 },
            { color: 'green', amount: 1 }
          ]
        },
        effect: {
          type: 'todo',
          description: 'During progress phase, player can upgrade 2 tracks instead of 1. Upgrade cost is 1 drachma less.'
        }
      },
      {
        level: 3,
        requirements: {
          drachmas: 3,
          knowledgeTokens: [
            { color: 'blue', amount: 2 },
            { color: 'green', amount: 2 },
            { color: 'red', amount: 2 }
          ]
        },
        effect: {
          type: 'todo',
          description: 'During scoring phase, gain 2 victory points per minor and major knowledge token (color doesn\'t matter)'
        }
      }
    ]
  },
  {
    id: 'sparte',
    name: 'Sparte',
    description: 'blabla',
    startingEffect: {
      type: 'todo',
      description: 'During each military action, colonisation\'s death of the army is 1 less than indicated'
    },
    developments: [
      {
        level: 1,
        requirements: {
          drachmas: 1,
          knowledgeTokens: [{ color: 'blue', amount: 2 }]
        },
        effect: {
          type: 'todo',
          description: 'Each military action increases the tax track by 1'
        }
      },
      {
        level: 2,
        requirements: {
          drachmas: 2,
          knowledgeTokens: [
            { color: 'red', amount: 1 },
            { color: 'blue', amount: 3 },
            { color: 'green', amount: 1 }
          ]
        },
        effect: {
          type: 'todo',
          description: 'Perform the military action 2 times'
        }
      },
      {
        level: 3,
        requirements: {
          drachmas: 4,
          knowledgeTokens: [
            { color: 'blue', amount: 3 },
            { color: 'green', amount: 2 },
            { color: 'red', amount: 2 }
          ]
        },
        effect: {
          type: 'todo',
          description: 'During scoring phase, gain 4 victory points per minor and major blue knowledge token'
        }
      }
    ]
  },
  {
    id: 'olympie',
    name: 'Olympie',
    description: 'blabla',
    startingEffect: {
      type: 'track_upgrade',
      params: { track: 'tax', level: 1 },
      description: 'Start the game with 1 extra tax point'
    },
    developments: [
      {
        level: 1,
        requirements: {
          drachmas: 0,
          knowledgeTokens: [{ color: 'green', amount: 1 }]
        },
        effect: {
          type: 'todo',
          description: 'Each culture action gains 1 army amount & 1 philosophy token'
        }
      },
      {
        level: 2,
        requirements: {
          drachmas: 2,
          knowledgeTokens: [
            { color: 'red', amount: 1 },
            { color: 'green', amount: 2 }
          ]
        },
        effect: {
          type: 'track_upgrade',
          params: { track: 'culture', level: 2, grantBonus: true },
          description: 'Increase culture track by 2 levels for free (gain rewards if applicable)'
        }
      },
      {
        level: 3,
        requirements: {
          drachmas: 3,
          knowledgeTokens: [
            { color: 'blue', amount: 1 },
            { color: 'green', amount: 2 },
            { color: 'red', amount: 3 }
          ]
        },
        effect: {
          type: 'todo',
          description: 'Perform the culture action 3 times'
        }
      }
    ]
  },
  {
    id: 'thebes',
    name: 'Thèbes',
    description: 'blabla',
    startingEffect: {
      type: 'track_upgrade',
      params: { track: 'military', level: 2 },
      description: 'Start the game with the military track level 2'
    },
    developments: [
      {
        level: 1,
        requirements: {
          drachmas: 0,
          knowledgeTokens: [
            { color: 'green', amount: 1 },
            { color: 'blue', amount: 1 }
          ]
        },
        effect: {
          type: 'todo',
          description: 'Anytime: trade 1 glory point for 2 drachmas & 4 victory points'
        }
      },
      {
        level: 2,
        requirements: {
          drachmas: 0,
          knowledgeTokens: [
            { color: 'red', amount: 1 },
            { color: 'green', amount: 1 },
            { color: 'blue', amount: 2 }
          ]
        },
        effect: {
          type: 'todo',
          description: 'For 1 military action, perform 2 colonisations instead of 1'
        }
      },
      {
        level: 3,
        requirements: {
          drachmas: 2,
          knowledgeTokens: [
            { color: 'blue', amount: 2 },
            { color: 'green', amount: 2 },
            { color: 'red', amount: 2 }
          ]
        },
        effect: {
          type: 'todo',
          description: 'During scoring phase, gain 2 victory points for each minor knowledge token (color doesn\'t matter)'
        }
      }
    ]
  },
  {
    id: 'athenes',
    name: 'Athènes',
    description: 'blabla',
    startingEffect: {
      type: 'resource_bonus',
      params: { philosophy: 3 },
      description: 'At the beginning of the game, start with 3 philosophy points'
    },
    developments: [
      {
        level: 1,
        requirements: {
          drachmas: 0,
          knowledgeTokens: [
            { color: 'green', amount: 1 },
            { color: 'red', amount: 1 }
          ]
        },
        effect: {
          type: 'todo',
          description: 'For each political card played, gain 2 drachmas and 3 victory points'
        }
      },
      {
        level: 2,
        requirements: {
          drachmas: 1,
          knowledgeTokens: [
            { color: 'blue', amount: 2 }
          ]
        },
        effect: {
          type: 'todo',
          description: 'For each political card played, gain 2 army points'
        }
      },
      {
        level: 3,
        requirements: {
          drachmas: 2,
          knowledgeTokens: [
            { color: 'blue', amount: 2 },
            { color: 'green', amount: 2 },
            { color: 'red', amount: 2 }
          ]
        },
        effect: {
          type: 'todo',
          description: 'During scoring phase, gain 3 victory points for each political card played during the game'
        }
      }
    ]
  }
]; 