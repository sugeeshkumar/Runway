import React from 'react';
import { NavTabType } from './HeaderNav';
import {
  Tag,
  RefreshCw,
  Target,
  BarChart3,
  Calendar,
  Users,
  Settings,
  X,
  ChevronRight,
} from 'lucide-react';

interface MoreMenuSheetProps {
  isOpen: boolean;
  activeTab: NavTabType;
  onClose: () => void;
  onSelectTab: (tab: NavTabType) => void;
}

export const MoreMenuSheet: React.FC<MoreMenuSheetProps> = ({
  isOpen,
  activeTab,
  onClose,
  onSelectTab,
}) => {
  if (!isOpen) return null;

  const moreItems = [
    { id: 'categories', label: 'Categories', icon: Tag, desc: 'Expense taxonomy & limits' },
    { id: 'recurring', label: 'Recurring', icon: RefreshCw, desc: 'Scheduled & committed bills' },
    { id: 'goals', label: 'Savings Goals', icon: Target, desc: 'Target milestones & projections' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, desc: 'Trends, heatmaps & MoM delta' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, desc: 'Visual monthly distribution' },
    { id: 'ledgers', label: 'Trips & Events', icon: Users, desc: 'Shared group expense splitting' },
    { id: 'settings', label: 'Settings', icon: Settings, desc: 'Currency & account preferences' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs transition-opacity"
      />

      {/* Bottom Sheet Drawer */}
      <div className="relative w-full max-w-lg bg-card-light dark:bg-card-dark border-t border-hairline-light dark:border-hairline-dark rounded-t-2xl shadow-xl p-5 z-10 text-ink-primary dark:text-ink-darkPrimary max-h-[85vh] flex flex-col">
        {/* Handle */}
        <div className="w-10 h-1 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mb-3" />

        <div className="flex items-center justify-between pb-3 border-b border-hairline-light dark:border-hairline-dark">
          <div>
            <h3 className="font-serif text-base font-bold tracking-tight">More Navigation</h3>
            <p className="text-[11px] font-mono text-ink-secondary dark:text-ink-darkSecondary">Select a section to view</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-secondary hover:text-ink-primary dark:text-ink-darkSecondary dark:hover:text-ink-darkPrimary rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="py-3 space-y-1 overflow-y-auto">
          {moreItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id as NavTabType);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100'
                    : 'bg-canvas-light/60 dark:bg-canvas-dark/60 border-hairline-light dark:border-hairline-dark hover:border-stone-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-clay-500 dark:text-clay-400' : 'text-ink-secondary dark:text-ink-darkSecondary'}`} />
                  <div className="text-left">
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-[11px] text-ink-secondary dark:text-ink-darkSecondary font-mono">{item.desc}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-muted dark:text-ink-darkMuted" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
