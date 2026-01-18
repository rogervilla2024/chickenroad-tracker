/**
 * Utility functions for formatting data in Chicken Road Tracker
 */

/**
 * Format a number with thousands separators
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number string
 */
export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined) return '0';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format a number as a percentage
 * @param {number} value - Value to format (already in percentage form, e.g., 71.5)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return '0%';

  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a multiplier value
 * @param {number} multiplier - Multiplier value
 * @returns {string} Formatted multiplier string
 */
export function formatMultiplier(multiplier) {
  if (multiplier === null || multiplier === undefined) return '0x';

  if (multiplier >= 100) {
    return `${multiplier.toFixed(0)}x`;
  } else if (multiplier >= 10) {
    return `${multiplier.toFixed(1)}x`;
  } else {
    return `${multiplier.toFixed(2)}x`;
  }
}

/**
 * Format a timestamp as relative time (e.g., "2 minutes ago")
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Relative time string
 */
export function formatTimeAgo(timestamp) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a timestamp as a full date/time string
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Formatted date/time string
 */
export function formatDateTime(timestamp) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format a timestamp as time only
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Formatted time string
 */
export function formatTime(timestamp) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format currency value
 * @param {number} value - Value to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = 'USD') {
  if (value === null || value === undefined) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value);
}

/**
 * Format lane outcome for display
 * @param {string} outcome - 'crossed' or 'hit'
 * @returns {object} Object with label and color
 */
export function formatOutcome(outcome) {
  const outcomes = {
    crossed: {
      label: 'Crossed',
      shortLabel: 'Safe',
      color: '#22c55e',
      bgColor: 'bg-grass-500/20',
      textColor: 'text-grass-400',
      borderColor: 'border-grass-500/30',
    },
    hit: {
      label: 'Hit',
      shortLabel: 'Hit',
      color: '#ef4444',
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
      borderColor: 'border-red-500/30',
    },
  };

  return outcomes[outcome] || outcomes.hit;
}

/**
 * Format lanes crossed for display
 * @param {number} lanesCrossed - Number of lanes crossed (0-5)
 * @param {number} maxLanes - Maximum lanes (default: 5)
 * @returns {string} Formatted lanes string
 */
export function formatLanes(lanesCrossed, maxLanes = 5) {
  return `${lanesCrossed}/${maxLanes}`;
}

/**
 * Calculate and format success rate
 * @param {number} success - Number of successes
 * @param {number} total - Total attempts
 * @returns {string} Formatted percentage
 */
export function calculateSuccessRate(success, total) {
  if (!total || total === 0) return '0.0%';
  return formatPercent((success / total) * 100);
}

/**
 * Get risk level based on success rate
 * @param {number} successRate - Success rate as percentage (0-100)
 * @returns {object} Risk level info
 */
export function getRiskLevel(successRate) {
  if (successRate >= 60) {
    return {
      level: 'Low',
      color: 'text-grass-400',
      bgColor: 'bg-grass-500/20',
    };
  } else if (successRate >= 40) {
    return {
      level: 'Medium',
      color: 'text-chicken-400',
      bgColor: 'bg-chicken-500/20',
    };
  } else {
    return {
      level: 'High',
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
    };
  }
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Format a game round ID for display
 * @param {string} roundId - Full round ID
 * @returns {string} Shortened display ID
 */
export function formatRoundId(roundId) {
  if (!roundId) return '-';
  if (roundId.length <= 12) return roundId;
  return `${roundId.substring(0, 6)}...${roundId.substring(roundId.length - 4)}`;
}
