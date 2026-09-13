import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavTabType } from './HeaderNav';
import {
  LayoutDashboard,
  History,
  PieChart,
  Tag,
  RefreshCw,
  Target,
  BarChart3,
  Calendar,
  Users,
  Settings,
  Sun,
  Moon,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface SidebarNavProps {
  activeTab: NavTabType;
  onTabChange: (tab: NavTabType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  darkMode,
  onToggleDarkMode,
}) => {
  const { user, logout } = useAuth();

  const sections = [
    {
      title: 'Track',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'history', label: 'History', icon: History },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
      ],
    },
    {
      title: 'Plan',
      items: [
        { id: 'budgets', label: 'Budgets', icon: PieChart },
        { id: 'categories', label: 'Categories', icon: Tag },
        { id: 'recurring', label: 'Recurring', icon: RefreshCw },
        { id: 'goals', label: 'Savings Goals', icon: Target },
      ],
    },
    {
      title: 'Insights',
      items: [{ id: 'analytics', label: 'Analytics', icon: BarChart3 }],
    },
    {
      title: 'Management',
      items: [
        { id: 'ledgers', label: 'Trips & Events', icon: Users },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ] as const;

  return (
    <aside
      className={`hidden md:flex flex-col fixed top-0 bottom-0 left-0 z-30 bg-card-light dark:bg-card-dark border-r border-hairline-light dark:border-hairline-dark transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-hairline-light dark:border-hairline-dark shrink-0">
        {!isCollapsed && (
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => onTabChange('dashboard')}
          >
            <span className="font-serif text-xl font-bold tracking-tight text-ink-primary dark:text-ink-darkPrimary">
              Runway
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-stone-200/60 dark:bg-stone-800 text-ink-secondary dark:text-ink-darkSecondary">
              v1.0
            </span>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded text-ink-secondary dark:text-ink-darkSecondary hover:text-ink-primary dark:hover:text-ink-darkPrimary hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors cursor-pointer mx-auto"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-4 px-2 space-y-6 overflow-y-auto no-scrollbar">
        {sections.map((section) => (
          <div key={section.title} className="space-y-0.5">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-mono font-semibold text-ink-muted dark:text-ink-darkMuted uppercase tracking-wider mb-1">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id as NavTabType)}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-2 py-2' : 'space-x-3 px-3 py-2'
                  } rounded text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 font-semibold'
                      : 'text-ink-secondary hover:text-ink-primary dark:text-ink-darkSecondary dark:hover:text-ink-darkPrimary hover:bg-stone-100 dark:hover:bg-stone-800/40'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={16} className={isActive ? 'text-clay-500 dark:text-clay-400' : ''} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Controls */}
      <div className="p-2 border-t border-hairline-light dark:border-hairline-dark space-y-0.5 shrink-0">
        <button
          onClick={onToggleDarkMode}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'space-x-3 px-3 py-2'
          } rounded text-xs font-medium text-ink-secondary dark:text-ink-darkSecondary hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors cursor-pointer`}
          title="Toggle Theme"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          {!isCollapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
      </div>
    </aside>
  );
};
