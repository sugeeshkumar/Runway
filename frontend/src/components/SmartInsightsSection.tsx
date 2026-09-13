import React, { useState, useEffect, useCallback } from 'react';
import { InsightResponse, InsightItem, AnalyticsPeriod } from '../types';
import api from '../api/client';
import { Sparkles, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Store, Calendar, ArrowUpRight } from 'lucide-react';
import * as expenseRepository from '../data/expenseRepository';

interface SmartInsightsSectionProps {
  period: AnalyticsPeriod;
  userCurrency: string;
  refreshKey?: number;
}

export const SmartInsightsSection: React.FC<SmartInsightsSectionProps> = ({
  period,
  userCurrency,
  refreshKey = 0,
}) => {
  const [data, setData] = useState<InsightResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const insightsData = await expenseRepository.getLocalSmartInsights(period, userCurrency);
      setData(insightsData);
    } catch (err) {
      console.error('Failed to fetch smart financial insights from local storage', err);
    } finally {
      setLoading(false);
    }
  }, [period, userCurrency]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights, refreshKey]);

  if (loading) {
    return (
      <div className="border border-hairline-light dark:border-hairline-dark rounded-xl p-6 bg-canvas-light dark:bg-canvas-dark animate-pulse space-y-4">
        <div className="h-4 w-40 bg-stone-200 dark:bg-stone-800 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-stone-100 dark:bg-stone-900 rounded-lg" />
          <div className="h-28 bg-stone-100 dark:bg-stone-900 rounded-lg" />
          <div className="h-28 bg-stone-100 dark:bg-stone-900 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data || !data.hasEnoughData || !data.insights || data.insights.length === 0) {
    return (
      <div className="border border-hairline-light dark:border-hairline-dark rounded-xl p-6 bg-canvas-light dark:bg-canvas-dark space-y-2">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-clay-600 dark:text-clay-400" />
          <h3 className="font-mono text-xs font-medium uppercase tracking-wider text-ink-primary dark:text-ink-darkPrimary">
            Smart Financial Insights
          </h3>
        </div>
        <p className="font-sans text-xs text-ink-secondary dark:text-ink-darkSecondary leading-relaxed">
          {data?.notice || 'Keep tracking expenses to unlock spending insights.'}
        </p>
      </div>
    );
  }

  const getSeverityPill = (insight: InsightItem) => {
    switch (insight.severity) {
      case 'WARNING':
        return (
          <span className="font-mono text-[10px] font-medium px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20">
            {insight.metric || 'Pacing Notice'}
          </span>
        );
      case 'POSITIVE':
        return (
          <span className="font-mono text-[10px] font-medium px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
            {insight.metric || 'Reduced'}
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="font-mono text-[10px] font-medium px-2 py-0.5 rounded border border-hairline-light dark:border-hairline-dark text-clay-700 dark:text-clay-400 bg-canvas-warm/40 dark:bg-canvas-dark">
            {insight.metric || 'Observed'}
          </span>
        );
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'CATEGORY_INCREASE':
        return <TrendingUp className="w-3.5 h-3.5 text-clay-600 dark:text-clay-400 shrink-0" />;
      case 'CATEGORY_DECREASE':
        return <TrendingDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'MERCHANT_FREQUENCY':
      case 'MERCHANT_REPEATED_SPEND':
        return <Store className="w-3.5 h-3.5 text-ink-secondary dark:text-ink-darkSecondary shrink-0" />;
      case 'SPENDING_PATTERN_WEEKDAY':
      case 'SPENDING_PATTERN_WEEKEND':
        return <Calendar className="w-3.5 h-3.5 text-ink-secondary dark:text-ink-darkSecondary shrink-0" />;
      case 'BUDGET_PACING':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />;
      case 'ANOMALY_UNUSUAL_EXPENSE':
        return <ArrowUpRight className="w-3.5 h-3.5 text-clay-600 dark:text-clay-400 shrink-0" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-clay-600 dark:text-clay-400 shrink-0" />;
    }
  };

  return (
    <div className="border border-hairline-light dark:border-hairline-dark rounded-xl p-5 sm:p-6 bg-canvas-light dark:bg-canvas-dark space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline-light dark:border-hairline-dark pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-clay-600 dark:text-clay-400" />
            <h3 className="font-mono text-xs font-medium uppercase tracking-wider text-ink-primary dark:text-ink-darkPrimary">
              Smart Financial Insights
            </h3>
          </div>
          <p className="font-sans text-xs text-ink-secondary dark:text-ink-darkSecondary">
            Deterministic observations derived from your recent transaction patterns.
          </p>
        </div>
        <span className="font-mono text-[10px] text-ink-secondary dark:text-ink-darkSecondary tabular-nums">
          {data.insights.length} {data.insights.length === 1 ? 'insight' : 'ranked insights'}
        </span>
      </div>

      {/* Ranked Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.insights.map((insight) => (
          <div
            key={insight.id}
            className="border border-hairline-light dark:border-hairline-dark/70 rounded-lg p-4 bg-canvas-warm/20 dark:bg-canvas-dark/50 hover:border-clay-400 dark:hover:border-clay-600 transition-colors flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              {/* Category & Pill */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5 min-w-0">
                  {getIconForType(insight.type)}
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-ink-secondary dark:text-ink-darkSecondary truncate">
                    {insight.category}
                  </span>
                </div>
                {getSeverityPill(insight)}
              </div>

              {/* Title */}
              <h4 className="font-serif text-sm font-medium text-ink-primary dark:text-ink-darkPrimary leading-snug">
                {insight.title}
              </h4>

              {/* Description */}
              <p className="font-sans text-xs text-ink-secondary dark:text-ink-darkSecondary leading-relaxed">
                {insight.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
