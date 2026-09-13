import React from 'react';
import { Sun, Moon } from 'lucide-react';

export type NavTabType =
  | 'dashboard'
  | 'history'
  | 'budgets'
  | 'categories'
  | 'recurring'
  | 'goals'
  | 'analytics'
  | 'calendar'
  | 'ledgers'
  | 'settings';

interface HeaderNavProps {
  activeTab: NavTabType;
  onTabChange: (tab: NavTabType) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  onTabChange,
  darkMode,
  onToggleDarkMode,
}) => {

  const titleMap: Record<NavTabType, string> = {
    dashboard: 'Dashboard',
    history: 'Expense History',
    budgets: 'Budgets & Limits',
    categories: 'Categories',
    recurring: 'Recurring Expenses',
    goals: 'Savings Goals',
    analytics: 'Analytics',
    calendar: 'Month Calendar',
    ledgers: 'Trips & Shared Ledgers',
    settings: 'Settings & Profile',
  };

  return (
    <header className="w-full border-b border-hairline-light dark:border-hairline-dark bg-canvas-light/90 dark:bg-canvas-dark/90 sticky top-0 z-20 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand / Screen Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('dashboard')}>
          <span className="font-serif text-lg font-bold tracking-tight text-ink-primary dark:text-ink-darkPrimary">
            Runway
          </span>
          <span className="text-stone-300 dark:text-stone-700">/</span>
          <span className="text-xs font-mono font-medium text-ink-secondary dark:text-ink-darkSecondary uppercase tracking-wider">
            {titleMap[activeTab]}
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex md:hidden items-center space-x-1">
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded text-ink-secondary dark:text-ink-darkSecondary hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
};
