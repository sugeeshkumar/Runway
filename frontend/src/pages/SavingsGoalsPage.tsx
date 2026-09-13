import React, { useState, useEffect, useCallback } from 'react';
import { SavingsGoal } from '../types';
import { formatCurrency } from '../utils/currency';
import * as savingsGoalRepository from '../data/savingsGoalRepository';
import { CreateGoalModal } from '../components/CreateGoalModal';
import { AddContributionModal } from '../components/AddContributionModal';
import { Target, Plus, PlusCircle, Calendar, Sparkles, Trash2, CheckCircle2, TrendingUp } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

interface SavingsGoalsPageProps {
  userCurrency: string;
}

export const SavingsGoalsPage: React.FC<SavingsGoalsPageProps> = ({ userCurrency }) => {
  const shouldReduceMotion = useReducedMotion();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [isContributionOpen, setIsContributionOpen] = useState<boolean>(false);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await savingsGoalRepository.getSavingsGoals();
      setGoals(data);
    } catch (err) {
      console.error('Failed to fetch savings goals', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      await savingsGoalRepository.deleteSavingsGoal(id);
      fetchGoals();
    } catch (err) {
      console.error('Failed to delete goal', err);
    }
  };

  const handleDeleteContribution = async (goalId: string, contribId: string) => {
    try {
      await savingsGoalRepository.deleteContribution(goalId, contribId);
      fetchGoals();
    } catch (err) {
      console.error('Failed to delete contribution', err);
    }
  };

  const openContributionModal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setIsContributionOpen(true);
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-12 flex justify-center">
        <div className="w-6 h-6 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalSavedAcrossGoals = goals.reduce((acc, g) => acc + g.currentSaved, 0);
  const totalTargetAcrossGoals = goals.reduce((acc, g) => acc + g.targetAmount, 0);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink-primary dark:text-ink-darkPrimary">
            Savings Goals
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Track deposits toward future purchases, emergency reserves, and major milestones
          </p>
        </div>

        <motion.button
          whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-ink-primary text-white dark:bg-white dark:text-neutral-900 text-xs font-extrabold shadow-sm hover:bg-stone-800 dark:hover:bg-stone-100 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>New Goal</span>
        </motion.button>
      </div>

      {/* Summary Banner */}
      {goals.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-950 via-stone-900 to-neutral-950 text-white rounded-3xl p-6 shadow-xl border border-stone-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <span className="text-xs uppercase tracking-widest font-bold text-emerald-400">
              Total Portfolio Savings
            </span>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white tabular-nums">
                {formatCurrency(totalSavedAcrossGoals, userCurrency)}
                <span className="text-xs font-semibold text-stone-400 ml-2">
                  saved of {formatCurrency(totalTargetAcrossGoals, userCurrency)}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-extrabold">
                {goals.length} Active {goals.length === 1 ? 'Goal' : 'Goals'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 rounded-3xl p-10 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Target size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-ink-primary dark:text-ink-darkPrimary">
              No savings goals created yet
            </h3>
            <p className="text-xs text-stone-400 dark:text-stone-500 max-w-md mx-auto">
              Set up a goal for an emergency fund, travel fund, or major purchase to monitor progress and project completion dates based on your real deposit rate.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-ink-primary text-white dark:bg-white dark:text-neutral-900 text-xs font-extrabold shadow-sm hover:bg-stone-800 dark:hover:bg-stone-100 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Create First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const isCompleted = goal.percentage >= 100;
            return (
              <motion.div
                key={goal.id}
                whileHover={shouldReduceMotion ? {} : { y: -3 }}
                className="bg-white dark:bg-neutral-900 border border-stone-200/80 dark:border-neutral-800 rounded-3xl p-6 shadow-xs transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-extrabold text-ink-primary dark:text-ink-darkPrimary">
                          {goal.name}
                        </h3>
                        {isCompleted && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 size={11} />
                            <span>Reached</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 font-medium">
                        Target: {formatCurrency(goal.targetAmount, goal.currency)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Delete goal"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Amounts & Percentage */}
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-black text-ink-primary dark:text-ink-darkPrimary tabular-nums">
                      {formatCurrency(goal.currentSaved, goal.currency)}
                    </span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {goal.percentage.toFixed(1)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-stone-100 dark:bg-neutral-850 rounded-full h-2.5 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${goal.percentage}%` }}
                    />
                  </div>

                  {/* Projected Completion Badge */}
                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-neutral-850 border border-hairline-light dark:border-hairline-dark text-xs space-y-1">
                    <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 font-medium">
                      <span className="flex items-center gap-1">
                        <TrendingUp size={13} className="text-emerald-600 dark:text-emerald-400" />
                        Est. Completion Projection:
                      </span>
                      <span className="font-bold text-ink-primary dark:text-ink-darkPrimary">
                        {goal.estimatedCompletionDate
                          ? new Date(goal.estimatedCompletionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : goal.targetDate
                          ? new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Deposit dependent'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contributions list snippet & Quick deposit */}
                <div className="space-y-3 pt-3 border-t border-hairline-light dark:border-hairline-dark">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-400 dark:text-stone-500">
                      Contributions ({goal.contributionsCount})
                    </span>
                    <button
                      onClick={() => openContributionModal(goal)}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition-all cursor-pointer"
                    >
                      <PlusCircle size={14} />
                      <span>Add Deposit</span>
                    </button>
                  </div>

                  {goal.contributions.length === 0 ? (
                    <p className="text-xs text-stone-400 dark:text-stone-500 text-center py-2 italic font-medium">
                      No deposits logged yet. Tap "Add Deposit" to start.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {goal.contributions.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-stone-50/60 dark:bg-neutral-850 text-xs border border-hairline-light/50 dark:border-hairline-dark/50"
                        >
                          <div>
                            <span className="font-bold text-ink-primary dark:text-ink-darkPrimary block">
                              {c.note || 'Deposit'}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              {new Date(c.occurredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              +{formatCurrency(c.amount, goal.currency)}
                            </span>
                            <button
                              onClick={() => handleDeleteContribution(goal.id, c.id)}
                              className="text-stone-400 hover:text-red-500 cursor-pointer"
                              title="Delete contribution"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <CreateGoalModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaved={fetchGoals}
        userCurrency={userCurrency}
      />

      <AddContributionModal
        isOpen={isContributionOpen}
        goal={selectedGoal}
        onClose={() => setIsContributionOpen(false)}
        onSaved={fetchGoals}
      />
    </div>
  );
};
