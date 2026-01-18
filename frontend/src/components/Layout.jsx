import React, { useState } from 'react';
import { Footer } from '../../../../shared-core/components/footer/Footer'
import { Outlet, Link } from 'react-router-dom';
import { Menu, X, Bird, BarChart3, Home, Info, Mail, Shield, AlertTriangle } from 'lucide-react';
import { gameConfig } from '../config/gameConfig';
import { SchemaMarkup } from '../../../../shared-core/components/SchemaMarkup'


// Game configuration for SEO
const GAME_SEO = {
  name: 'Chicken Road',
  provider: 'Evoplay',
  rtp: 96,
  domain: 'chickenroadtracker.com',
  maxMultiplier: '5,000x',
  description: 'Real-time Chicken Road statistics tracker with live multiplier data, RTP analysis, and historical patterns.'
}

function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Statistics', href: '/statistics', icon: BarChart3 },
    { name: 'About', href: '/about', icon: Info },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Schema.org SEO Markup */}
      <SchemaMarkup game={GAME_SEO} />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-stone-900/95 backdrop-blur-md border-b border-stone-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-chicken-400 to-chicken-600 rounded-xl flex items-center justify-center shadow-farm group-hover:scale-105 transition-transform">
                  <Bird className="w-6 h-6 text-stone-900" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-grass-500 rounded-full border-2 border-stone-900"></div>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-xl text-chicken-400 leading-tight">
                  Chicken Road
                </span>
                <span className="text-xs text-stone-500 leading-tight">Tracker</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-stone-300 hover:text-chicken-400 hover:bg-stone-800/50 transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              ))}
            </div>

            {/* Provider Badge */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-800/50 rounded-lg border border-stone-700">
                <span className="text-xs text-stone-400">Provider:</span>
                <span className="text-xs font-semibold text-chicken-400">{gameConfig.provider}</span>
              </div>
              <div className="live-indicator">
                <span className="live-dot"></span>
                <span className="text-xs font-medium">Live</span>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-stone-400 hover:text-chicken-400 hover:bg-stone-800/50"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-800 bg-stone-900/95 backdrop-blur-md">
            <div className="px-4 py-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-stone-300 hover:text-chicken-400 hover:bg-stone-800/50 transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
              <div className="flex items-center gap-2 px-4 py-3">
                <span className="text-sm text-stone-400">Provider:</span>
                <span className="text-sm font-semibold text-chicken-400">{gameConfig.provider}</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Disclaimer Banner */}
      <div className="bg-stone-800/50 border-b border-stone-700">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <p className="text-xs text-stone-400 text-center">
            <AlertTriangle className="w-3 h-3 inline mr-1 text-chicken-500" />
            {gameConfig.disclaimer.affiliation}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer
        gameName="Chicken Road"
        gameEmoji="🐔"
        domain="chickenroadtracker.com"
        primaryColor="#eab308"
        botUsername="ChickenRoadBot"
        rtp={96}
        provider="Evoplay"
      />
    </div>
  );
}

export default Layout;
