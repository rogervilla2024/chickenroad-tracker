import React, { useState, useEffect, useRef } from 'react';
import { Bird, CheckCircle, XCircle, Clock, Zap, ArrowRight } from 'lucide-react';
import { formatTimeAgo, formatNumber } from '../utils/formatters';
import { gameConfig } from '../config/gameConfig';

// Mock data generator for demonstration
const generateMockCrossing = () => {
  const lanesCrossed = Math.floor(Math.random() * 6); // 0-5 lanes
  const wasHit = lanesCrossed < 5 && Math.random() > 0.7;
  const multiplier = lanesCrossed === 0 ? 0 : [1.2, 1.5, 2.0, 3.5, 8.0][lanesCrossed - 1];

  return {
    id: `cr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    lanesCrossed,
    outcome: wasHit ? 'hit' : 'crossed',
    multiplier: wasHit ? 0 : multiplier,
    betAmount: (Math.random() * 10 + 0.5).toFixed(2),
  };
};

function LiveFeed({ crossings: externalCrossings, connected }) {
  const [crossings, setCrossings] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const feedRef = useRef(null);

  // Initialize with mock data if no external crossings
  useEffect(() => {
    if (!externalCrossings || externalCrossings.length === 0) {
      // Generate initial mock data
      const initialData = Array.from({ length: 15 }, () => ({
        ...generateMockCrossing(),
        timestamp: new Date(Date.now() - Math.random() * 60000).toISOString(),
      }));
      setCrossings(initialData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } else {
      setCrossings(externalCrossings);
    }
  }, [externalCrossings]);

  // Simulate live updates when not connected to backend
  useEffect(() => {
    if (connected || isPaused) return;

    const interval = setInterval(() => {
      const newCrossing = generateMockCrossing();
      setCrossings((prev) => [newCrossing, ...prev].slice(0, gameConfig.ui.liveFeedLimit));
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [connected, isPaused]);

  // Auto-scroll to top on new crossings
  useEffect(() => {
    if (feedRef.current && !isPaused) {
      feedRef.current.scrollTop = 0;
    }
  }, [crossings, isPaused]);

  const getOutcomeIcon = (outcome) => {
    return outcome === 'crossed' ? (
      <CheckCircle className="w-5 h-5 text-grass-400" />
    ) : (
      <XCircle className="w-5 h-5 text-red-400" />
    );
  };

  const getOutcomeBadge = (outcome) => {
    return outcome === 'crossed' ? 'badge-crossed' : 'badge-hit';
  };

  const getLaneIndicators = (lanesCrossed) => {
    return Array.from({ length: 5 }, (_, i) => (
      <div
        key={i}
        className={`w-3 h-3 rounded-full transition-colors ${
          i < lanesCrossed ? 'bg-grass-500' : 'bg-stone-700'
        }`}
        title={`Lane ${i + 1}: ${i < lanesCrossed ? 'Crossed' : 'Not reached'}`}
      />
    ));
  };

  return (
    <div className="card h-fit sticky top-24">
      {/* Header */}
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`live-indicator ${connected ? '' : 'bg-chicken-500/20 border-chicken-500/50'}`}>
              <span className={`live-dot ${connected ? '' : 'bg-chicken-400'}`}></span>
              <span className="text-xs font-medium">{connected ? 'Live Feed' : 'Demo Mode'}</span>
            </div>
          </div>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              isPaused
                ? 'bg-grass-500/20 text-grass-400 hover:bg-grass-500/30'
                : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
            }`}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      {/* Feed Content */}
      <div
        ref={feedRef}
        className="max-h-[600px] overflow-y-auto hide-scrollbar"
      >
        <div className="p-4 space-y-3">
          {crossings.map((crossing, index) => (
            <div
              key={crossing.id}
              className={`history-item ${index === 0 ? 'ring-1 ring-chicken-500/30' : ''}`}
            >
              <div className="flex items-start gap-3 w-full">
                {/* Outcome Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getOutcomeIcon(crossing.outcome)}
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`font-semibold ${
                      crossing.outcome === 'crossed' ? 'text-grass-400' : 'text-red-400'
                    }`}>
                      {crossing.outcome === 'crossed' ? 'Crossed!' : 'Hit!'}
                    </span>
                    <span className="text-xs text-stone-500">
                      {formatTimeAgo(crossing.timestamp)}
                    </span>
                  </div>

                  {/* Lane Progress */}
                  <div className="flex items-center gap-1 mb-2">
                    {getLaneIndicators(crossing.lanesCrossed)}
                    <span className="ml-2 text-xs text-stone-400">
                      {crossing.lanesCrossed}/5 lanes
                    </span>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {crossing.multiplier > 0 && (
                      <span className="badge-lane flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {crossing.multiplier}x
                      </span>
                    )}
                    <span className={getOutcomeBadge(crossing.outcome)}>
                      {crossing.outcome === 'crossed' ? 'Safe' : 'Hit'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {crossings.length === 0 && (
            <div className="text-center py-8">
              <Bird className="w-12 h-12 text-stone-600 mx-auto mb-3" />
              <p className="text-stone-400">Waiting for crossings...</p>
              <p className="text-xs text-stone-500 mt-1">
                Live updates will appear here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="border-t border-stone-800 p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-grass-400">
              {crossings.filter((c) => c.outcome === 'crossed').length}
            </p>
            <p className="text-xs text-stone-500">Crossed</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-400">
              {crossings.filter((c) => c.outcome === 'hit').length}
            </p>
            <p className="text-xs text-stone-500">Hit</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-stone-800">
          <div className="flex items-center justify-center gap-2 text-xs text-stone-500">
            <Clock className="w-3 h-3" />
            <span>Last {gameConfig.ui.liveFeedLimit} crossings</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveFeed;
