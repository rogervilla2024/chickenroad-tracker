/**
 * Chicken Road Tracker - Game Configuration
 * Lane-crossing minigame by Evoplay (NOT a crash game)
 */

export const gameConfig = {
  // Stats Page Config
  gameId: 'chickenroad',
  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8013',

  // Game Information
  name: 'Chicken Road',
  provider: 'Evoplay',
  type: 'lane-crossing',
  description: 'A unique lane-crossing minigame where a chicken navigates across roads',

  // Game Mechanics
  rtp: 96.0, // Return to Player percentage
  houseEdge: 4.0, // House edge percentage
  maxMultiplier: 1000, // Maximum potential multiplier (1,000x)
  maxLanes: 5, // Maximum lanes that can be crossed

  // Lane Configuration
  lanes: {
    count: 5,
    labels: ['Lane 1', 'Lane 2', 'Lane 3', 'Lane 4', 'Lane 5'],
    colors: {
      safe: '#22c55e', // Green for safe crossing
      danger: '#ef4444', // Red for hit/danger
      current: '#f59e0b', // Amber for current position
    },
  },

  // Outcomes
  outcomes: {
    crossed: {
      label: 'Crossed',
      color: '#22c55e',
      icon: 'check',
    },
    hit: {
      label: 'Hit',
      color: '#ef4444',
      icon: 'x',
    },
  },

  // API Configuration
  api: {
    baseUrl: '/api',
    wsUrl: '/ws',
    endpoints: {
      stats: '/stats',
      history: '/history',
      laneStats: '/lane-stats',
      recentCrossings: '/recent-crossings',
    },
  },

  // Domain
  domain: 'chickenroadtracker.com',
  ports: {
    frontend: 3013,
    backend: 8013,
  },

  // UI Configuration
  ui: {
    historyLimit: 100, // Maximum items in history display
    liveFeedLimit: 20, // Maximum items in live feed
    refreshInterval: 5000, // Stats refresh interval (ms)
    chartColors: {
      primary: '#f59e0b',
      secondary: '#eab308',
      success: '#22c55e',
      danger: '#ef4444',
      neutral: '#78716c',
    },
  },

  // Theme
  theme: {
    primary: '#f59e0b', // Amber
    secondary: '#eab308', // Yellow
    accent: '#22c55e', // Green
    background: '#0c0a09',
    surface: '#1c1917',
    border: '#292524',
  },

  // Disclaimer text
  disclaimer: {
    affiliation: 'ChickenRoadTracker.com is NOT affiliated with, endorsed by, or connected to Evoplay in any way. This is an independent statistics tracking service.',
    gambling: 'Gambling involves risk. Please gamble responsibly. If you have a gambling problem, seek help at BeGambleAware.org or call 1-800-522-4700.',
    educational: 'This platform is for educational and informational purposes only. Past results do not predict future outcomes.',
    fallacy: 'Remember: Each crossing is independent. Past lane success or failure does not influence future results (Gambler\'s Fallacy).',
  },

  // Contact Information
  contact: {
    general: 'contact@chickenroadtracker.com',
    support: 'support@chickenroadtracker.com',
    legal: 'legal@chickenroadtracker.com',
  },
};

// Lane multiplier configuration (example payouts)
export const laneMultipliers = {
  0: 1.0, // Starting position (no crossing)
  1: 1.2, // Lane 1 crossed
  2: 1.5, // Lane 2 crossed
  3: 2.0, // Lane 3 crossed
  4: 3.5, // Lane 4 crossed
  5: 8.0, // All 5 lanes crossed (varies)
};

// Statistics display configuration
export const statsConfig = {
  laneSuccessRates: {
    label: 'Lane Success Rates',
    description: 'Percentage of successful crossings per lane',
    format: 'percentage',
  },
  totalCrossings: {
    label: 'Total Crossings',
    description: 'Total number of lane crossing attempts tracked',
    format: 'number',
  },
  avgLanesCrossed: {
    label: 'Avg Lanes Crossed',
    description: 'Average number of lanes crossed per round',
    format: 'decimal',
  },
  hitRate: {
    label: 'Hit Rate',
    description: 'Percentage of rounds ending in a hit',
    format: 'percentage',
  },
};

export default gameConfig;
