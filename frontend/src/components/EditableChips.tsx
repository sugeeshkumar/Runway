import React from 'react';
import { Category, ParsedExpenseDraft } from '../types';
import { Tag, Calendar, DollarSign, Type, Check, Store, AlertCircle } from 'lucide-react';

interface EditableChipsProps {
  draft: ParsedExpenseDraft;
  categories: Category[];
  onChange: (updatedDraft: ParsedExpenseDraft) => void;
  onConfirm?: () => void;
  isSaving?: boolean;
}

export const EditableChips: React.FC<EditableChipsProps> = ({
  draft,
  categories,
  onChange,
  onConfirm,
  isSaving = false,
}) => {
  const isLowConfidence = draft.confidence < 0.80;

  return (
    <div className="space-y-2 pt-2">
      {/* Low Confidence Notice Badge */}
      {isLowConfidence && (
        <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-mono text-[11px]">
          <AlertCircle size={13} className="shrink-0" />
          <span>Low confidence interpretation ({(draft.confidence * 100).toFixed(0)}%). Please verify fields before saving.</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* Amount & Currency Chip */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-hairline-light dark:border-hairline-dark bg-stone-100/60 dark:bg-neutral-800 text-xs font-mono text-ink-primary dark:text-ink-darkPrimary">
          <DollarSign size={13} className="text-ink-secondary dark:text-ink-darkSecondary shrink-0" />
          <select
            value={draft.currency || 'INR'}
            onChange={(e) => onChange({ ...draft, currency: e.target.value })}
            className="bg-transparent font-semibold border-none focus:ring-0 p-0 text-xs text-ink-primary dark:text-ink-darkPrimary cursor-pointer focus:outline-none"
          >
            <option value="INR" className="bg-canvas-light dark:bg-canvas-dark text-ink-primary dark:text-ink-darkPrimary">INR (₹)</option>
            <option value="USD" className="bg-canvas-light dark:bg-canvas-dark text-ink-primary dark:text-ink-darkPrimary">USD ($)</option>
            <option value="EUR" className="bg-canvas-light dark:bg-canvas-dark text-ink-primary dark:text-ink-darkPrimary">EUR (€)</option>
            <option value="GBP" className="bg-canvas-light dark:bg-canvas-dark text-ink-primary dark:text-ink-darkPrimary">GBP (£)</option>
          </select>
          <input
            type="number"
            step="0.01"
            value={draft.amount === 0 ? '' : draft.amount}
            onChange={(e) => onChange({ ...draft, amount: parseFloat(e.target.value) || 0 })}
            className="bg-transparent w-20 font-bold border-none focus:ring-0 p-0 text-xs text-ink-primary dark:text-ink-darkPrimary focus:outline-none tabular-nums"
            placeholder="0.00"
          />
        </div>

        {/* Category Chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-hairline-light dark:border-hairline-dark bg-stone-100/60 dark:bg-neutral-800 text-xs font-sans text-ink-primary dark:text-ink-darkPrimary">
          <Tag size={13} className="text-ink-secondary dark:text-ink-darkSecondary shrink-0" />
          <select
            value={draft.categoryId || ''}
            onChange={(e) => {
              const selectedCat = categories.find((c) => c.id === e.target.value);
              onChange({
                ...draft,
                categoryId: e.target.value,
                categoryName: selectedCat ? selectedCat.name : draft.categoryName,
              });
            }}
            className="bg-transparent font-medium border-none focus:ring-0 p-0 text-xs text-ink-primary dark:text-ink-darkPrimary cursor-pointer focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-canvas-light dark:bg-canvas-dark text-ink-primary dark:text-ink-darkPrimary">
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Merchant Chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-hairline-light dark:border-hairline-dark bg-stone-100/60 dark:bg-neutral-800 text-xs font-sans text-ink-primary dark:text-ink-darkPrimary">
          <Store size={13} className="text-ink-secondary dark:text-ink-darkSecondary shrink-0" />
          <input
            type="text"
            value={draft.merchant || ''}
            onChange={(e) => onChange({ ...draft, merchant: e.target.value || undefined })}
            className="bg-transparent min-w-[90px] max-w-[140px] border-none focus:ring-0 p-0 text-xs text-ink-primary dark:text-ink-darkPrimary focus:outline-none"
            placeholder="Merchant (Optional)"
          />
        </div>

        {/* Description Chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-hairline-light dark:border-hairline-dark bg-stone-100/60 dark:bg-neutral-800 text-xs font-sans text-ink-primary dark:text-ink-darkPrimary">
          <Type size={13} className="text-ink-secondary dark:text-ink-darkSecondary shrink-0" />
          <input
            type="text"
            value={draft.description || ''}
            onChange={(e) => onChange({ ...draft, description: e.target.value })}
            className="bg-transparent min-w-[100px] max-w-[160px] border-none focus:ring-0 p-0 text-xs text-ink-primary dark:text-ink-darkPrimary focus:outline-none"
            placeholder="Description"
          />
        </div>

        {/* Date Chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-hairline-light dark:border-hairline-dark bg-stone-100/60 dark:bg-neutral-800 text-xs font-mono text-ink-primary dark:text-ink-darkPrimary">
          <Calendar size={13} className="text-ink-secondary dark:text-ink-darkSecondary shrink-0" />
          <input
            type="datetime-local"
            value={draft.occurredAt ? new Date(draft.occurredAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)}
            onChange={(e) => onChange({ ...draft, occurredAt: new Date(e.target.value).toISOString() })}
            className="bg-transparent border-none focus:ring-0 p-0 text-xs text-ink-primary dark:text-ink-darkPrimary cursor-pointer focus:outline-none"
          />
        </div>

        {/* Confirm & Save Button */}
        {onConfirm && (
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving || draft.amount <= 0}
            className="px-3.5 py-1 rounded-lg bg-clay-600 hover:bg-clay-700 text-white font-sans font-medium text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 ml-auto"
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check size={13} />
                <span>Confirm & Save</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
