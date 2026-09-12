import React, { useState } from 'react';
import { NavTabType } from './HeaderNav';
import { MoreMenuSheet } from './MoreMenuSheet';
import {
  LayoutDashboard,
  History,
  PieChart,
  Plus,
  MoreHorizontal,
} from 'lucide-react';

interface BottomNavBarProps {
  activeTab: NavTabType;
  onTabChange: (tab: NavTabType) => void;
  onOpenQuickCapture?: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  onOpenQuickCapture,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false);

  const primaryTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'History', icon: History },
  ] as const;

  const secondaryTabs = [
    { id: 'budgets', label: 'Budgets', icon: PieChart },
  ] as const;

  const isMoreTabActive = [
    'categories',
    'recurring',
    'goals',
    'analytics',
    'calendar',
    'ledgers',
    'settings',
  ].includes(activeTab);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card-light/95 dark:bg-card-dark/95 border-t border-hairline-light dark:border-hairline-dark px-3 py-1.5 backdrop-blur-md">
        <div className="flex items-center justify-around max-w-md mx-auto relative">
          {/* Left Items */}
          {primaryTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as NavTabType)}
                className={`flex flex-col items-center justify-center py-1 px-3.5 rounded transition-colors cursor-pointer ${
                  isActive
                    ? 'text-ink-primary dark:text-ink-darkPrimary font-bold'
                    : 'text-ink-secondary dark:text-ink-darkSecondary hover:text-ink-primary dark:hover:text-ink-darkPrimary'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="text-[10px] font-mono tracking-tight">{item.label}</span>
              </button>
            );
          })}

          {/* Center Clay Quick Capture Button */}
          <div className="relative -top-4">
            <button
              onClick={onOpenQuickCapture}
              className="w-11 h-11 rounded-full bg-clay-600 hover:bg-clay-700 text-white flex items-center justify-center border-2 border-card-light dark:border-card-dark cursor-pointer shadow-sm transition-colors"
              title="Quick Capture Expense"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Right Items */}
          {secondaryTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as NavTabType)}
                className={`flex flex-col items-center justify-center py-1 px-3.5 rounded transition-colors cursor-pointer ${
                  isActive
                    ? 'text-ink-primary dark:text-ink-darkPrimary font-bold'
                    : 'text-ink-secondary dark:text-ink-darkSecondary hover:text-ink-primary dark:hover:text-ink-darkPrimary'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="text-[10px] font-mono tracking-tight">{item.label}</span>
              </button>
            );
          })}

          {/* More Trigger */}
          <button
            onClick={() => setIsMoreOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-3.5 rounded transition-colors cursor-pointer ${
              isMoreTabActive
                ? 'text-ink-primary dark:text-ink-darkPrimary font-bold'
                : 'text-ink-secondary dark:text-ink-darkSecondary hover:text-ink-primary dark:hover:text-ink-darkPrimary'
            }`}
          >
            <MoreHorizontal className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-mono tracking-tight">More</span>
          </button>
        </div>
      </div>

      {/* More Menu Sheet */}
      <MoreMenuSheet
        isOpen={isMoreOpen}
        activeTab={activeTab}
        onClose={() => setIsMoreOpen(false)}
        onSelectTab={onTabChange}
      />
    </>
  );
};
