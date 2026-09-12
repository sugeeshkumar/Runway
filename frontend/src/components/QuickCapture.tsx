import React, { useState, useEffect, useRef } from 'react';
import { Category, ParsedExpenseDraft } from '../types';
import { EditableChips } from './EditableChips';
import { UndoToast, UndoToastData } from './UndoToast';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { ArrowUpRight, Sparkles, Check, Mic, MicOff, AlertCircle, Copy } from 'lucide-react';

interface QuickCaptureProps {
  categories: Category[];
  onExpenseAdded: () => void;
}

export type VoiceState = 'IDLE' | 'LISTENING' | 'TRANSCRIPT' | 'PARSING' | 'SUCCESS' | 'FAILURE';

export const QuickCapture: React.FC<QuickCaptureProps> = ({ categories, onExpenseAdded }) => {
  const { user } = useAuth();
  const userCurrency = user?.defaultCurrency || 'INR';

  const [text, setText] = useState<string>('');
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<ParsedExpenseDraft | null>(null);
  const [activeToast, setActiveToast] = useState<UndoToastData | null>(null);

  // Duplicate Check Warning State
  const [pendingDuplicate, setPendingDuplicate] = useState<{
    timeAgoMessage: string;
    draftToSave: any;
  } | null>(null);

  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Setup Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setVoiceState('LISTENING');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(transcript);
        setVoiceState('TRANSCRIPT');
        // Parse transcript automatically
        processInputAndCapture(transcript, false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setVoiceState('FAILURE');
        setSpeechError(`Voice capture error: ${event.error}. Please type your entry.`);
        setTimeout(() => {
          setSpeechError(null);
          setVoiceState('IDLE');
        }, 4000);
      };

      recognition.onend = () => {
        if (voiceState === 'LISTENING') {
          setVoiceState('IDLE');
        }
      };

      recognitionRef.current = recognition;
    }
  }, [voiceState]);

  const toggleVoiceCapture = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceState('FAILURE');
      setSpeechError('Voice capture is not supported in this browser. Please type your entry.');
      setTimeout(() => {
        setSpeechError(null);
        setVoiceState('IDLE');
      }, 4000);
      return;
    }

    if (voiceState === 'LISTENING') {
      recognitionRef.current?.stop();
      setVoiceState('IDLE');
    } else {
      setSpeechError(null);
      try {
        recognitionRef.current?.start();
        setVoiceState('LISTENING');
      } catch (err) {
        console.error('Failed to start speech recognition', err);
        setVoiceState('FAILURE');
      }
    }
  };

  const executeSaveExpense = async (expenseData: any, rawInputText: string) => {
    setIsSaving(true);
    setPendingDuplicate(null);
    try {
      const saveRes = await api.post('/expenses', expenseData);
      const savedItem = saveRes.data;

      setText('');
      setDraft(null);
      setIsSaving(false);
      setVoiceState('SUCCESS');

      const successLabel = `Recorded ${savedItem.currency || userCurrency} ${savedItem.amount.toFixed(2)} · ${savedItem.merchant || savedItem.description} · ${savedItem.category.name}`;
      setSavedSuccessMsg(successLabel);

      onExpenseAdded();

      setActiveToast({
        id: savedItem.id,
        amount: savedItem.amount,
        currency: savedItem.currency || userCurrency,
        categoryName: savedItem.category.name || 'Expense',
      });

      setTimeout(() => {
        setSavedSuccessMsg(null);
        setVoiceState('IDLE');
      }, 3500);
    } catch (err) {
      console.error('Failed to save expense', err);
      setIsSaving(false);
      setVoiceState('FAILURE');
    }
  };

  const processInputAndCapture = async (inputText: string, isSubmitDirect = false, forceSave = false) => {
    if (!inputText.trim()) {
      setDraft(null);
      setIsParsing(false);
      return;
    }

    setIsParsing(true);
    setVoiceState('PARSING');

    try {
      const res = await api.post<ParsedExpenseDraft>('/nlp/parse', { text: inputText });
      const parsed = res.data;

      if (!inputText.includes('$') && !inputText.includes('€') && !inputText.includes('£') && !inputText.toLowerCase().includes('usd')) {
        parsed.currency = userCurrency;
      }
      if (!parsed.categoryId && categories.length > 0) {
        parsed.categoryId = categories[0].id;
        parsed.categoryName = categories[0].name;
      }

      // Check for High Confidence Auto-Save
      if ((parsed.confidence >= 0.80 || isSubmitDirect) && parsed.amount > 0 && parsed.categoryId) {
        const payload = {
          amount: parsed.amount,
          currency: parsed.currency || userCurrency,
          categoryId: parsed.categoryId,
          merchant: parsed.merchant,
          description: parsed.description,
          occurredAt: parsed.occurredAt || new Date().toISOString(),
          source: 'PARSED_TEXT',
          rawInput: inputText,
        };

        if (!forceSave) {
          // Perform duplicate check
          try {
            const dupCheck = await api.post('/expenses/check-duplicate', payload);
            if (dupCheck.data.duplicate) {
              setPendingDuplicate({
                timeAgoMessage: dupCheck.data.timeAgoMessage || 'recorded recently',
                draftToSave: payload,
              });
              setIsParsing(false);
              setVoiceState('IDLE');
              return;
            }
          } catch (e) {
            console.error('Duplicate check error', e);
          }
        }

        await executeSaveExpense(payload, inputText);
      } else {
        // Low confidence -> Keep editable preview chips open
        setDraft(parsed);
        setVoiceState('IDLE');
      }
    } catch (err) {
      console.error('NLP parse/capture error', err);
      setVoiceState('FAILURE');
    } finally {
      setIsParsing(false);
    }
  };

  // Debounce typing inputs for live chip preview
  useEffect(() => {
    if (!text.trim()) {
      setDraft(null);
      setIsParsing(false);
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      api.post<ParsedExpenseDraft>('/nlp/parse', { text })
        .then((res) => {
          const parsed = res.data;
          if (!text.includes('$') && !text.includes('€') && !text.includes('£') && !text.toLowerCase().includes('usd')) {
            parsed.currency = userCurrency;
          }
          if (!parsed.categoryId && categories.length > 0) {
            parsed.categoryId = categories[0].id;
            parsed.categoryName = categories[0].name;
          }
          setDraft(parsed);
        })
        .catch((err) => console.error('Parse preview error', err))
        .finally(() => setIsParsing(false));
    }, 400);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [text, categories, userCurrency]);

  const handleConfirmDraft = async () => {
    if (!draft || draft.amount <= 0 || !draft.categoryId) return;
    const payload = {
      amount: draft.amount,
      currency: draft.currency || userCurrency,
      categoryId: draft.categoryId,
      merchant: draft.merchant,
      description: draft.description || text.trim() || 'Expense',
      occurredAt: draft.occurredAt || new Date().toISOString(),
      source: 'PARSED_TEXT',
      rawInput: text || draft.rawInput,
    };

    // Duplicate check for manual confirmation
    try {
      const dupCheck = await api.post('/expenses/check-duplicate', payload);
      if (dupCheck.data.duplicate) {
        setPendingDuplicate({
          timeAgoMessage: dupCheck.data.timeAgoMessage || 'recorded recently',
          draftToSave: payload,
        });
        return;
      }
    } catch (e) {
      console.error('Duplicate check error', e);
    }

    await executeSaveExpense(payload, text || draft.rawInput || '');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (draft && draft.confidence < 0.8 && draft.amount > 0) {
      handleConfirmDraft();
    } else {
      processInputAndCapture(text, true);
    }
  };

  const handleUndo = async (expenseId: string) => {
    try {
      await api.delete(`/expenses/${expenseId}`);
      setActiveToast(null);
      setSavedSuccessMsg(null);
      onExpenseAdded();
    } catch (err) {
      console.error('Failed to undo expense', err);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* Success Confirmation Banner */}
      {savedSuccessMsg && (
        <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-semibold animate-in fade-in">
          <Check size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="truncate">{savedSuccessMsg}</span>
        </div>
      )}

      {/* Duplicate Warning Dialog Banner */}
      {pendingDuplicate && (
        <div className="border border-amber-500/40 rounded-xl p-4 bg-amber-500/10 space-y-3 font-sans animate-in fade-in">
          <div className="flex items-start space-x-2.5">
            <Copy size={16} className="text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-mono text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Possible Duplicate Entry Detected
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-400">
                An identical expense of {pendingDuplicate.draftToSave.currency} {pendingDuplicate.draftToSave.amount.toFixed(2)} was {pendingDuplicate.timeAgoMessage}. Would you like to log this as a second transaction anyway?
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setPendingDuplicate(null)}
              className="px-3 py-1.5 rounded-lg border border-amber-500/30 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 font-mono text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => executeSaveExpense(pendingDuplicate.draftToSave, text)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-mono font-bold text-xs cursor-pointer transition-colors"
            >
              Save Duplicate
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleManualSubmit}
        className="relative bg-canvas-light dark:bg-canvas-dark border border-hairline-light dark:border-hairline-dark rounded-xl p-3.5 transition-colors focus-within:border-clay-600 dark:focus-within:border-clay-500"
      >
        <div className="flex items-center justify-between gap-2.5">
          {/* Mic Voice Capture Button with Voice States */}
          <button
            type="button"
            onClick={toggleVoiceCapture}
            className={`p-2.5 rounded-lg transition-all flex items-center justify-center shrink-0 cursor-pointer ${
              voiceState === 'LISTENING'
                ? 'bg-clay-600 text-white animate-pulse shadow-md ring-2 ring-clay-600/30'
                : 'bg-stone-200/50 dark:bg-neutral-800 text-ink-secondary dark:text-ink-darkSecondary hover:text-clay-600 dark:hover:text-clay-500 hover:bg-stone-200 dark:hover:bg-neutral-750'
            }`}
            title={voiceState === 'LISTENING' ? 'Listening... Tap to stop' : 'Tap for Voice Capture'}
          >
            {voiceState === 'LISTENING' ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              voiceState === 'LISTENING'
                ? 'Listening... Speak naturally (e.g. ₹450 dinner at Zaitoon)'
                : 'Type or speak an expense (e.g., ₹450 dinner at Zaitoon or Uber 280)'
            }
            className="w-full bg-transparent border-none font-sans text-sm sm:text-base font-medium text-ink-primary dark:text-ink-darkPrimary placeholder:text-ink-secondary dark:placeholder:text-ink-darkSecondary focus:outline-none focus:ring-0"
          />

          <button
            type="submit"
            disabled={!text.trim() || isSaving}
            className={`p-2.5 rounded-lg font-medium text-xs transition-colors flex items-center justify-center min-w-[40px] shrink-0 ${
              text.trim() && !isSaving
                ? 'bg-clay-600 hover:bg-clay-700 text-white cursor-pointer'
                : 'bg-stone-200/40 dark:bg-neutral-800 text-ink-secondary dark:text-ink-darkSecondary cursor-not-allowed'
            }`}
            title="Parse & Capture Expense"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : voiceState === 'SUCCESS' ? (
              <Check size={16} className="text-white" />
            ) : (
              <ArrowUpRight size={16} />
            )}
          </button>
        </div>

        {/* Voice Capture / Speech Warning Notice */}
        {speechError && (
          <div className="flex items-center gap-2 font-mono text-xs text-rose-600 dark:text-rose-400 mt-2 p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5">
            <AlertCircle size={14} className="shrink-0" />
            <span>{speechError}</span>
          </div>
        )}

        {/* Live Voice / Parsing State Indicator */}
        {(isParsing || voiceState === 'LISTENING' || voiceState === 'PARSING') && (
          <div className="flex items-center gap-1.5 font-mono text-xs text-ink-secondary dark:text-ink-darkSecondary mt-2">
            <Sparkles size={12} className="animate-pulse text-clay-600" />
            <span>
              {voiceState === 'LISTENING'
                ? '[Listening...] Speak your expense naturally.'
                : 'Analyzing natural text & extracting details...'}
            </span>
          </div>
        )}

        {/* Editable Interpretation Chips (Shown for Low-Confidence or Manual Edits) */}
        {draft && draft.confidence < 0.8 && (
          <div className="mt-3 pt-3 border-t border-hairline-light dark:border-hairline-dark">
            <EditableChips
              draft={draft}
              categories={categories}
              onChange={(updated) => setDraft(updated)}
              onConfirm={handleConfirmDraft}
              isSaving={isSaving}
            />
          </div>
        )}
      </form>

      {/* Floating Undo Toast for High-Confidence Silent Captures */}
      <UndoToast
        toast={activeToast}
        onUndo={handleUndo}
        onDismiss={() => setActiveToast(null)}
      />
    </div>
  );
};
