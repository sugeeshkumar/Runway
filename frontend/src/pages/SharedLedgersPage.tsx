import React, { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SharedLedger } from '../types';
import { Plus, Users, Calendar, Plane, PartyPopper, Briefcase, CheckCircle2, Search, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { CreateLedgerModal } from '../components/CreateLedgerModal';
import { LedgerDetailView } from '../components/LedgerDetailView';
import api from '../api/client';

interface SharedLedgersPageProps {
  userDefaultCurrency?: string;
}

export const SharedLedgersPage: React.FC<SharedLedgersPageProps> = ({
  userDefaultCurrency = 'INR',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [ledgers, setLedgers] = useState<SharedLedger[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLedger, setSelectedLedger] = useState<SharedLedger | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'ACTIVE' | 'SETTLED'>('ALL');

  const fetchLedgers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<SharedLedger[]>('/ledgers');
      setLedgers(res.data);
    } catch (err) {
      console.error('Failed to load shared ledgers', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLedgers();
  }, [fetchLedgers]);

  const filteredLedgers = ledgers.filter((ledger) => {
    const matchesSearch = ledger.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === 'ACTIVE') return matchesSearch && !ledger.isSettled;
    if (filterType === 'SETTLED') return matchesSearch && ledger.isSettled;
    return matchesSearch;
  });

  if (selectedLedger) {
    return (
      <LedgerDetailView
        ledger={selectedLedger}
        onBack={() => setSelectedLedger(null)}
        onLedgerUpdated={fetchLedgers}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-primary dark:text-ink-darkPrimary">
            Trips & Events
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Track group money during vacations, parties, or family functions
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-ink-primary text-white dark:bg-white dark:text-neutral-900 font-bold text-xs shadow-sm hover:opacity-90 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>New Shared Ledger</span>
        </button>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trips or events..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-hairline-light dark:border-hairline-dark bg-stone-50/50 dark:bg-neutral-850 text-xs font-medium text-ink-primary dark:text-ink-darkPrimary focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-1.5 bg-stone-100 dark:bg-neutral-850 p-1 rounded-xl border border-hairline-light dark:border-hairline-dark">
          {(['ALL', 'ACTIVE', 'SETTLED'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === type
                  ? 'bg-white dark:bg-neutral-900 text-ink-primary dark:text-ink-darkPrimary shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-ink-primary'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-stone-400">
          <div className="w-6 h-6 border-2 border-stone-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs">Loading trips & events...</span>
        </div>
      ) : filteredLedgers.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-neutral-900 border border-hairline-light dark:border-hairline-dark text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-lime-400/20 text-lime-600 dark:text-lime-400 flex items-center justify-center mx-auto">
            <Users size={24} />
          </div>
          <h3 className="text-base font-bold text-ink-primary dark:text-ink-darkPrimary">
            No Shared Ledgers Found
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
            Create a shared ledger for your next group trip, dinner, or event to track expenses and calculate minimal debt netting!
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-ink-primary text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs shadow-sm hover:opacity-90 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Shared Ledger</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLedgers.map((ledger) => {
            const Icon = ledger.type === 'TRIP' ? Plane : ledger.type === 'EVENT' ? PartyPopper : Briefcase;
            const totalSpent = ledger.totalSpentInBase || 0;
            const plannedBudget = ledger.plannedBudget || 0;
            const budgetPercentage = plannedBudget > 0 ? Math.min(100, Math.round((totalSpent / plannedBudget) * 100)) : 0;

            return (
              <motion.div
                key={ledger.id}
                whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.01 }}
                onClick={() => setSelectedLedger(ledger)}
                className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-hairline-light dark:border-hairline-dark hover:border-emerald-500/40 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-xl bg-lime-400/20 text-lime-700 dark:text-lime-400">
                        <Icon size={16} />
                      </div>
                      <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-stone-400">
                        {ledger.type}
                      </span>
                    </div>

                    {ledger.isSettled ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center space-x-1">
                        <CheckCircle2 size={12} />
                        <span>Settled</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-lime-500/10 text-lime-600 dark:text-lime-400 text-[10px] font-bold">
                        Active
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-ink-primary dark:text-ink-darkPrimary tracking-tight">
                    {ledger.name}
                  </h3>

                  <div className="flex items-center space-x-3 text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
                    <div className="flex items-center space-x-1">
                      <Calendar size={13} />
                      <span>{ledger.startDate}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Users size={13} />
                      <span>{ledger.participants.length} Members</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-hairline-light dark:border-hairline-dark flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Group Total</span>
                    <div className="text-base font-black font-mono text-ink-primary dark:text-ink-darkPrimary">
                      {formatCurrency(totalSpent, ledger.baseCurrency)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-xs font-bold text-lime-600 dark:text-lime-400 group-hover:translate-x-1 transition-transform">
                    <span>View Ledger</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Ledger Modal */}
      <CreateLedgerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onLedgerCreated={(newLedger) => {
          fetchLedgers();
          setSelectedLedger(newLedger);
        }}
        userDefaultCurrency={userDefaultCurrency}
      />
    </div>
  );
};
