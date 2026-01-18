import React, { useState, useEffect } from 'react';
import {
  Bird,
  TrendingUp,
  Target,
  Activity,
  CheckCircle,
  XCircle,
  ArrowRight,
  Zap,
  BarChart3,
  Percent,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import LiveFeed from '../components/LiveFeed';
import { useStats } from '../hooks/useStats';
import { useWebSocket } from '../hooks/useWebSocket';
import { formatNumber, formatPercent, formatTimeAgo } from '../utils/formatters';
import { gameConfig, laneMultipliers } from '../config/gameConfig';

function HomePage() {
  const { stats, laneStats, loading, error, refetch } = useStats();
  const { crossings, connected } = useWebSocket();

  // Mock data for demonstration (remove when backend is connected)
  const mockStats = {
    totalRounds: 125847,
    totalCrossings: 89543,
    avgLanesCrossed: 2.34,
    hitRate: 28.9,
    crossedRate: 71.1,
    lastUpdate: new Date().toISOString(),
  };

  const mockLaneStats = [
    { lane: 1, label: 'Lane 1', attempts: 125847, success: 98765, successRate: 78.5 },
    { lane: 2, label: 'Lane 2', attempts: 98765, success: 71234, successRate: 72.1 },
    { lane: 3, label: 'Lane 3', attempts: 71234, success: 45678, successRate: 64.1 },
    { lane: 4, label: 'Lane 4', attempts: 45678, success: 24567, successRate: 53.8 },
    { lane: 5, label: 'Lane 5', attempts: 24567, success: 10234, successRate: 41.7 },
  ];

  const displayStats = stats || mockStats;
  const displayLaneStats = laneStats || mockLaneStats;

  // Pie chart data for outcomes
  const outcomeData = [
    { name: 'Crossed', value: displayStats.crossedRate || 71.1, color: '#22c55e' },
    { name: 'Hit', value: displayStats.hitRate || 28.9, color: '#ef4444' },
  ];

  // Quick stats cards
  const quickStats = [
    {
      label: 'Total Rounds',
      value: formatNumber(displayStats.totalRounds),
      icon: Activity,
      color: 'text-chicken-400',
    },
    {
      label: 'Avg Lanes Crossed',
      value: displayStats.avgLanesCrossed?.toFixed(2) || '2.34',
      icon: Target,
      color: 'text-grass-400',
    },
    {
      label: 'Success Rate',
      value: formatPercent(displayStats.crossedRate || 71.1),
      icon: CheckCircle,
      color: 'text-grass-400',
    },
    {
      label: 'Hit Rate',
      value: formatPercent(displayStats.hitRate || 28.9),
      icon: XCircle,
      color: 'text-red-400',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12">
        <div className="card overflow-hidden">
          <div className="relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 road-bg opacity-30"></div>

            {/* Content */}
            <div className="relative p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Icon */}
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-chicken-400 to-chicken-600 rounded-2xl flex items-center justify-center shadow-farm-lg animate-bounce-gentle">
                  <Bird className="w-16 h-16 md:w-20 md:h-20 text-stone-900" />
                </div>

                {/* Text */}
                <div className="text-center md:text-left flex-grow">
                  <h1 className="text-3xl md:text-4xl font-display text-gradient mb-3">
                    Chicken Road Tracker
                  </h1>
                  <p className="text-lg text-stone-300 mb-4">
                    Real-time lane crossing statistics for Evoplay's Chicken Road game.
                    Track success rates, analyze patterns, and view crossing history.
                  </p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-stone-800/50 rounded-lg">
                      <Percent className="w-4 h-4 text-chicken-400" />
                      <span className="text-sm text-stone-300">
                        RTP: <span className="text-chicken-400 font-semibold">{gameConfig.rtp}%</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-stone-800/50 rounded-lg">
                      <Zap className="w-4 h-4 text-road-400" />
                      <span className="text-sm text-stone-300">
                        Max: <span className="text-road-400 font-semibold">{gameConfig.maxMultiplier.toLocaleString()}x</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-stone-800/50 rounded-lg">
                      <ArrowRight className="w-4 h-4 text-grass-400" />
                      <span className="text-sm text-stone-300">
                        Lanes: <span className="text-grass-400 font-semibold">{gameConfig.maxLanes}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex flex-col items-center gap-2">
                  <div className={`live-indicator ${connected ? '' : 'opacity-50'}`}>
                    <span className="live-dot"></span>
                    <span className="text-sm font-medium">{connected ? 'Live' : 'Connecting...'}</span>
                  </div>
                  <span className="text-xs text-stone-500">
                    Provider: {gameConfig.provider}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <div key={index} className="stat-card">
              <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Statistics */}
        <div className="lg:col-span-2 space-y-8">
          {/* Lane Success Rates */}
          <section className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-chicken-400" />
                  <h2 className="text-lg font-semibold text-stone-100">Lane Success Rates</h2>
                </div>
                <span className="text-xs text-stone-500">
                  Based on {formatNumber(displayStats.totalRounds)} rounds
                </span>
              </div>
            </div>
            <div className="card-body">
              {/* Lane Progress Bars */}
              <div className="space-y-4 mb-8">
                {displayLaneStats.map((lane) => (
                  <div key={lane.lane} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-stone-300">{lane.label}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-stone-500">
                          {formatNumber(lane.success)} / {formatNumber(lane.attempts)}
                        </span>
                        <span className={`text-sm font-semibold ${
                          lane.successRate >= 60 ? 'text-grass-400' :
                          lane.successRate >= 40 ? 'text-chicken-400' :
                          'text-red-400'
                        }`}>
                          {lane.successRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="lane-progress">
                      <div
                        className="lane-progress-fill"
                        style={{ width: `${lane.successRate}%` }}
                      ></div>
                      <div className="lane-progress-label">
                        {lane.successRate >= 30 && `${lane.successRate.toFixed(1)}%`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bar Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayLaneStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="label" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1c1917',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#f5f5f4' }}
                    />
                    <Bar
                      dataKey="successRate"
                      name="Success Rate"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Outcome Distribution */}
          <section className="card">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-chicken-400" />
                <h2 className="text-lg font-semibold text-stone-100">Outcome Distribution</h2>
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pie Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={outcomeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                        labelLine={{ stroke: '#78716c' }}
                      >
                        {outcomeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `${value.toFixed(1)}%`}
                        contentStyle={{
                          backgroundColor: '#1c1917',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Outcome Stats */}
                <div className="flex flex-col justify-center space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-grass-500/10 rounded-lg border border-grass-500/30">
                    <CheckCircle className="w-10 h-10 text-grass-400" />
                    <div>
                      <p className="text-2xl font-bold text-grass-400">
                        {formatPercent(displayStats.crossedRate || 71.1)}
                      </p>
                      <p className="text-sm text-stone-400">Successfully Crossed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                    <XCircle className="w-10 h-10 text-red-400" />
                    <div>
                      <p className="text-2xl font-bold text-red-400">
                        {formatPercent(displayStats.hitRate || 28.9)}
                      </p>
                      <p className="text-sm text-stone-400">Hit by Vehicle</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Lane Multipliers Info */}
          <section className="card">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-chicken-400" />
                <h2 className="text-lg font-semibold text-stone-100">Lane Multipliers</h2>
              </div>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Lane</th>
                      <th>Multiplier</th>
                      <th>Success Rate</th>
                      <th>Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(laneMultipliers).slice(1).map(([lane, multiplier], index) => {
                      const laneData = displayLaneStats[index];
                      const riskLevel = laneData?.successRate >= 60 ? 'Low' :
                        laneData?.successRate >= 40 ? 'Medium' : 'High';
                      const riskColor = laneData?.successRate >= 60 ? 'text-grass-400' :
                        laneData?.successRate >= 40 ? 'text-chicken-400' : 'text-red-400';

                      return (
                        <tr key={lane}>
                          <td className="font-medium text-stone-200">Lane {lane}</td>
                          <td>
                            <span className="badge-lane">{multiplier}x</span>
                          </td>
                          <td className="text-stone-300">
                            {laneData?.successRate.toFixed(1)}%
                          </td>
                          <td>
                            <span className={`font-medium ${riskColor}`}>{riskLevel}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-stone-500 mt-4">
                Note: Multipliers are approximate and may vary. Always check the official game for exact values.
              </p>
            </div>
          </section>
        </div>

        {/* Right Column - Live Feed */}
        <div className="lg:col-span-1">
          <LiveFeed crossings={crossings} connected={connected} />
        </div>
      </div>

      {/* Educational Notice */}
      <section className="mt-12">
        <div className="card p-6 bg-stone-800/30 border-stone-700/50">
          <h3 className="text-lg font-semibold text-chicken-400 mb-3">Understanding the Statistics</h3>
          <div className="space-y-3 text-sm text-stone-400">
            <p>
              <strong className="text-stone-300">Lane Success Rates:</strong> Show the percentage of successful crossings for each lane.
              Earlier lanes typically have higher success rates than later ones.
            </p>
            <p>
              <strong className="text-stone-300">Important Note:</strong> {gameConfig.disclaimer.fallacy}
            </p>
            <p>
              <strong className="text-stone-300">RTP (Return to Player):</strong> The {gameConfig.rtp}% RTP means that, on average,
              players receive {gameConfig.rtp}% of their wagers back over the long term. The house edge is {gameConfig.houseEdge}%.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
