import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <header className="w-full max-w-xl mx-auto px-4 pt-8 pb-6 flex items-center justify-between border-b border-hairline-light dark:border-hairline-dark mb-8">
      <div className="flex items-center space-x-3">
        <h1 className="text-xl font-semibold tracking-tight text-ink-primary dark:text-ink-darkPrimary">
          Runway
        </h1>
        <span className="px-2 py-0.5 text-xs font-mono rounded bg-stone-200/60 dark:bg-neutral-800 text-stone-600 dark:text-stone-400">
          V1
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <span className="text-xs text-ink-secondary dark:text-ink-darkSecondary hidden sm:inline">
            {user.email}
          </span>
        )}

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user && (
          <button
            onClick={logout}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </header>
  );
};
