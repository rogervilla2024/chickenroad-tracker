import { useState, useEffect, useCallback } from 'react';
import { gameConfig } from '../config/gameConfig';

/**
 * Custom hook for fetching and managing lane crossing statistics
 */
export function useStats() {
  const [stats, setStats] = useState(null);
  const [laneStats, setLaneStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch overall statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${gameConfig.api.baseUrl}${gameConfig.api.endpoints.stats}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('[useStats] Error fetching stats:', err);
      setError(err.message);
    }
  }, []);

  // Fetch lane-specific statistics
  const fetchLaneStats = useCallback(async () => {
    try {
      const response = await fetch(`${gameConfig.api.baseUrl}${gameConfig.api.endpoints.laneStats}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLaneStats(data);
    } catch (err) {
      console.error('[useStats] Error fetching lane stats:', err);
      // Lane stats error doesn't override main error
    }
  }, []);

  // Fetch crossing history
  const fetchHistory = useCallback(async (limit = gameConfig.ui.historyLimit) => {
    try {
      const response = await fetch(
        `${gameConfig.api.baseUrl}${gameConfig.api.endpoints.history}?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error('[useStats] Error fetching history:', err);
    }
  }, []);

  // Fetch all data
  const refetch = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchLaneStats(), fetchHistory()]);
    setLoading(false);
  }, [fetchStats, fetchLaneStats, fetchHistory]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Auto-refresh stats at configured interval
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
      fetchLaneStats();
    }, gameConfig.ui.refreshInterval);

    return () => clearInterval(interval);
  }, [fetchStats, fetchLaneStats]);

  // Calculate derived statistics
  const derivedStats = stats ? {
    ...stats,
    successRate: stats.totalCrossings > 0
      ? ((stats.successfulCrossings / stats.totalCrossings) * 100).toFixed(1)
      : 0,
    averageLanes: stats.totalRounds > 0
      ? (stats.totalLanesCrossed / stats.totalRounds).toFixed(2)
      : 0,
  } : null;

  return {
    stats: derivedStats,
    laneStats,
    history,
    loading,
    error,
    refetch,
    fetchStats,
    fetchLaneStats,
    fetchHistory,
  };
}

/**
 * Hook for calculating lane-specific statistics from raw data
 */
export function useLaneAnalytics(crossings) {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (!crossings || crossings.length === 0) {
      setAnalytics(null);
      return;
    }

    // Calculate per-lane statistics
    const laneData = Array.from({ length: gameConfig.maxLanes }, (_, i) => ({
      lane: i + 1,
      label: `Lane ${i + 1}`,
      attempts: 0,
      success: 0,
      successRate: 0,
    }));

    crossings.forEach((crossing) => {
      // For each lane crossed, it was an attempt and success
      for (let i = 0; i < crossing.lanesCrossed; i++) {
        laneData[i].attempts += 1;
        laneData[i].success += 1;
      }

      // If hit, the next lane was attempted but not successful
      if (crossing.outcome === 'hit' && crossing.lanesCrossed < gameConfig.maxLanes) {
        laneData[crossing.lanesCrossed].attempts += 1;
      }
    });

    // Calculate success rates
    laneData.forEach((lane) => {
      lane.successRate = lane.attempts > 0
        ? (lane.success / lane.attempts) * 100
        : 0;
    });

    // Calculate overall statistics
    const totalCrossings = crossings.length;
    const successfulCrossings = crossings.filter((c) => c.outcome === 'crossed').length;
    const totalLanesCrossed = crossings.reduce((sum, c) => sum + c.lanesCrossed, 0);

    setAnalytics({
      laneData,
      totalCrossings,
      successfulCrossings,
      hitCount: totalCrossings - successfulCrossings,
      successRate: totalCrossings > 0 ? (successfulCrossings / totalCrossings) * 100 : 0,
      avgLanesCrossed: totalCrossings > 0 ? totalLanesCrossed / totalCrossings : 0,
    });
  }, [crossings]);

  return analytics;
}

export default useStats;
