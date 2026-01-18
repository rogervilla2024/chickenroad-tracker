import React, { useState, useMemo, useCallback } from 'react';

/**
 * Road Crossing Simulator - Chicken Road
 * Guide the chicken across traffic lanes!
 */
export function RoadCrossingSimulator({ rtp = 96 }) {
  const [lanes, setLanes] = useState(5);
  const [currentLane, setCurrentLane] = useState(0);
  const [gameState, setGameState] = useState('idle');
  const [carPositions, setCarPositions] = useState([]);
  const [betAmount, setBetAmount] = useState(10);
  const [stats, setStats] = useState({ games: 0, wins: 0, maxLane: 0, profit: 0 });

  // Lane configurations
  const laneConfigs = [
    { difficulty: 'easy', lanes: 5, survivalRate: 0.8, maxMultiplier: 5.0 },
    { difficulty: 'medium', lanes: 7, survivalRate: 0.7, maxMultiplier: 15.0 },
    { difficulty: 'hard', lanes: 9, survivalRate: 0.6, maxMultiplier: 50.0 }
  ];

  // Calculate lane probabilities
  const laneData = useMemo(() => {
    const data = [];
    const survivalRate = currentLane <= 3 ? 0.8 : currentLane <= 6 ? 0.7 : 0.6;
    let cumulativeProb = 1;
    let multiplier = 1;

    for (let lane = 1; lane <= lanes; lane++) {
      cumulativeProb *= survivalRate;
      multiplier = (1 / cumulativeProb) * (rtp / 100);

      data.push({
        lane,
        probability: cumulativeProb * 100,
        multiplier,
        profit: betAmount * (multiplier - 1),
        laneSurvival: survivalRate * 100
      });
    }

    return data;
  }, [lanes, rtp, betAmount, currentLane]);

  // Start game
  const startGame = useCallback(() => {
    // Generate car positions for each lane
    const cars = [];
    for (let i = 0; i < lanes; i++) {
      cars.push({
        position: Math.random(),
        speed: 0.5 + Math.random() * 0.5,
        hasCar: Math.random() > (i < 3 ? 0.2 : i < 6 ? 0.3 : 0.4)
      });
    }
    setCarPositions(cars);
    setCurrentLane(0);
    setGameState('playing');
  }, [lanes]);

  // Cross lane
  const crossLane = useCallback(() => {
    if (gameState !== 'playing') return;

    const survivalRate = currentLane < 3 ? 0.8 : currentLane < 6 ? 0.7 : 0.6;
    const survived = Math.random() < survivalRate;

    if (survived) {
      const newLane = currentLane + 1;
      setCurrentLane(newLane);

      if (newLane === lanes) {
        // Crossed all lanes!
        const winAmount = laneData[newLane - 1].profit;
        setGameState('won');
        setStats(prev => ({
          games: prev.games + 1,
          wins: prev.wins + 1,
          maxLane: Math.max(prev.maxLane, newLane),
          profit: prev.profit + winAmount
        }));
      }
    } else {
      // Hit by car!
      setGameState('lost');
      setStats(prev => ({
        games: prev.games + 1,
        wins: prev.wins,
        maxLane: Math.max(prev.maxLane, currentLane),
        profit: prev.profit - betAmount
      }));
    }
  }, [gameState, currentLane, lanes, laneData, betAmount]);

  // Cash out
  const cashOut = useCallback(() => {
    if (gameState !== 'playing' || currentLane === 0) return;

    const winAmount = laneData[currentLane - 1].profit;
    setGameState('won');
    setStats(prev => ({
      games: prev.games + 1,
      wins: prev.wins + 1,
      maxLane: Math.max(prev.maxLane, currentLane),
      profit: prev.profit + winAmount
    }));
  }, [gameState, currentLane, laneData]);

  // Get lane visual
  const getLaneType = (idx) => {
    if (idx === 0) return { color: 'bg-green-600', type: 'START', emoji: '🏠' };
    if (idx === lanes + 1) return { color: 'bg-green-600', type: 'FINISH', emoji: '🏁' };
    if (idx <= 3) return { color: 'bg-gray-600', type: 'Road', emoji: '🚗' };
    if (idx <= 6) return { color: 'bg-gray-700', type: 'Highway', emoji: '🚙' };
    return { color: 'bg-gray-800', type: 'Freeway', emoji: '🚚' };
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">🐔</span>
        Road Crossing Simulator
        <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded ml-2">CHICKEN ROAD</span>
      </h3>

      {/* Game Info */}
      <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mb-6">
        <h4 className="text-yellow-400 font-bold">Why Did The Chicken Cross The Road?</h4>
        <p className="text-gray-300 text-sm mt-1">
          Guide your chicken across {lanes} lanes of traffic! Each lane crossed increases your multiplier,
          but watch out for cars! Cash out anytime or risk it all for the big win.
        </p>
      </div>

      {/* Road Visualization */}
      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <div className="flex flex-col-reverse gap-1">
          {/* Finish */}
          <div className="flex items-center gap-2 bg-green-800 rounded p-3">
            <span className="text-2xl">🏁</span>
            <span className="text-white font-bold flex-1">FINISH LINE!</span>
            <span className="text-yellow-400 font-bold">{laneData[lanes - 1]?.multiplier.toFixed(2)}x</span>
          </div>

          {/* Lanes */}
          {Array.from({ length: lanes }).map((_, idx) => {
            const laneNum = lanes - idx;
            const laneInfo = getLaneType(laneNum);
            const isCurrentLane = laneNum === currentLane + 1;
            const isCrossed = laneNum <= currentLane;

            return (
              <div
                key={idx}
                className={`flex items-center gap-2 rounded p-3 transition-all ${
                  isCurrentLane ? 'bg-blue-600 animate-pulse' :
                  isCrossed ? 'bg-green-700' : laneInfo.color
                }`}
              >
                <span className="w-8 text-gray-400 text-sm">L{laneNum}</span>
                <div className="flex-1 flex items-center justify-center gap-4">
                  {carPositions[laneNum - 1]?.hasCar && !isCrossed && (
                    <span className="text-2xl animate-bounce">{laneInfo.emoji}</span>
                  )}
                  {(isCrossed || isCurrentLane) && <span className="text-2xl">🐔</span>}
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 font-bold">{laneData[laneNum - 1]?.multiplier.toFixed(2)}x</div>
                  <div className="text-xs text-gray-400">{laneData[laneNum - 1]?.probability.toFixed(1)}%</div>
                </div>
              </div>
            );
          })}

          {/* Start */}
          <div className="flex items-center gap-2 bg-green-800 rounded p-3">
            <span className="text-2xl">🏠</span>
            <span className="text-white font-bold flex-1">START</span>
            {currentLane === 0 && <span className="text-2xl">🐔</span>}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-gray-400 text-xs mb-1">Lanes</label>
          <select
            value={lanes}
            onChange={(e) => setLanes(parseInt(e.target.value))}
            disabled={gameState === 'playing'}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
          >
            <option value={5}>5 lanes (Easy)</option>
            <option value={7}>7 lanes (Medium)</option>
            <option value={9}>9 lanes (Hard)</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Bet Amount ($)</label>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(parseFloat(e.target.value) || 1)}
            disabled={gameState === 'playing'}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Current Lane</label>
          <div className="bg-gray-900 rounded px-3 py-2 text-blue-400 font-bold">
            {currentLane} / {lanes}
          </div>
        </div>
        <div>
          <label className="block text-gray-400 text-xs mb-1">Current Value</label>
          <div className="bg-gray-900 rounded px-3 py-2 text-green-400 font-bold">
            ${currentLane > 0 ? laneData[currentLane - 1]?.profit.toFixed(2) : '0.00'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        {gameState === 'idle' && (
          <button
            onClick={startGame}
            className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold"
          >
            START CROSSING 🐔 (${betAmount})
          </button>
        )}
        {gameState === 'playing' && (
          <>
            <button
              onClick={crossLane}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold"
            >
              CROSS LANE! 🚗
            </button>
            <button
              onClick={cashOut}
              disabled={currentLane === 0}
              className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg font-bold"
            >
              CASH OUT ${currentLane > 0 ? laneData[currentLane - 1]?.profit.toFixed(2) : '0'}
            </button>
          </>
        )}
        {(gameState === 'won' || gameState === 'lost') && (
          <button
            onClick={startGame}
            className={`flex-1 py-3 ${
              gameState === 'won' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            } text-white rounded-lg font-bold`}
          >
            {gameState === 'won' ? '🎉 YOU MADE IT! ' : '💥 HIT BY CAR! '} PLAY AGAIN
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Games</div>
          <div className="text-xl font-bold text-white">{stats.games}</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Success Rate</div>
          <div className={`text-xl font-bold ${
            stats.games > 0 && (stats.wins / stats.games) >= 0.5 ? 'text-green-400' : 'text-red-400'
          }`}>
            {stats.games > 0 ? ((stats.wins / stats.games) * 100).toFixed(1) : 0}%
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Max Lanes</div>
          <div className="text-xl font-bold text-yellow-400">{stats.maxLane}</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Profit</div>
          <div className={`text-xl font-bold ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.profit >= 0 ? '+' : ''}${stats.profit.toFixed(2)}
          </div>
        </div>
      </div>

      {/* RTP Note */}
      <div className="bg-gray-900 rounded-lg p-4">
        <p className="text-gray-400 text-sm">
          <strong className="text-yellow-400">Note:</strong> Chicken Road has 96% RTP (4% house edge) -
          slightly worse than Aviator's 97%. But the fun gameplay might be worth it!
        </p>
      </div>
    </div>
  );
}

export default RoadCrossingSimulator;
