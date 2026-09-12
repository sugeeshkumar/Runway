import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExpenseHistoryPage } from './pages/ExpenseHistoryPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { RecurringExpensesPage } from './pages/RecurringExpensesPage';
import { SavingsGoalsPage } from './pages/SavingsGoalsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CalendarPage } from './pages/CalendarPage';
import { SharedLedgersPage } from './pages/SharedLedgersPage';
import { SettingsPage } from './pages/SettingsPage';
import { HeaderNav, NavTabType } from './components/HeaderNav';
import { SidebarNav } from './components/SidebarNav';
import { BottomNavBar } from './components/BottomNavBar';
import { QuickCapture } from './components/QuickCapture';
import { Category } from './types';
import api from './api/client';
import { X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTabType>('dashboard');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isQuickCaptureModalOpen, setIsQuickCaptureModalOpen] = useState<boolean>(false);
  const [globalRefreshKey, setGlobalRefreshKey] = useState<number>(0);

  const triggerGlobalRefresh = useCallback(() => {
    setGlobalRefreshKey((v) => v + 1);
  }, []);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get<Category[]>('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, [user]);

  const handleGlobalRefreshAndCategories = useCallback(() => {
    fetchCategories();
    triggerGlobalRefresh();
  }, [fetchCategories, triggerGlobalRefresh]);

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user, fetchCategories]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const userCurrency = user.defaultCurrency || 'INR';

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark text-ink-primary dark:text-ink-darkPrimary transition-all">
      {/* Desktop Left Rail Navigation */}
      <SidebarNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Content Area Container */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'} pb-24 md:pb-12`}>
        <HeaderNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />

        <main className="pt-4 px-4 sm:px-6 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              refreshKey={globalRefreshKey}
              onExpenseAddedOrUpdated={handleGlobalRefreshAndCategories}
              onNavigateToHistory={() => setActiveTab('history')}
              onNavigateToBudgets={() => setActiveTab('budgets')}
              onNavigateToRecurring={() => setActiveTab('recurring')}
            />
          )}

          {activeTab === 'history' && (
            <ExpenseHistoryPage
              categories={categories}
              refreshKey={globalRefreshKey}
              onExpenseAddedOrUpdated={handleGlobalRefreshAndCategories}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsPage
              categories={categories}
              userCurrency={userCurrency}
              refreshKey={globalRefreshKey}
              onNavigateToCategories={() => setActiveTab('categories')}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesPage
              categories={categories}
              onCategoriesUpdated={handleGlobalRefreshAndCategories}
            />
          )}

          {activeTab === 'recurring' && (
            <RecurringExpensesPage
              categories={categories}
              userCurrency={userCurrency}
              onNavigateToSettings={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'goals' && (
            <SavingsGoalsPage
              userCurrency={userCurrency}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage
              userCurrency={userCurrency}
              refreshKey={globalRefreshKey}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarPage
              userCurrency={userCurrency}
              refreshKey={globalRefreshKey}
              onExpenseAddedOrUpdated={handleGlobalRefreshAndCategories}
            />
          )}

          {activeTab === 'ledgers' && (
            <SharedLedgersPage
              userDefaultCurrency={userCurrency}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              onCurrencyUpdated={handleGlobalRefreshAndCategories}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenQuickCapture={() => setIsQuickCaptureModalOpen(true)}
      />

      {/* Mobile Quick Capture Trigger Modal */}
      <AnimatePresence>
        {isQuickCaptureModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-100 text-base">Quick Capture</h3>
                </div>
                <button
                  onClick={() => setIsQuickCaptureModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <QuickCapture
                categories={categories}
                onExpenseAdded={() => {
                  handleGlobalRefreshAndCategories();
                  setIsQuickCaptureModalOpen(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
