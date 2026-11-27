import { useEffect, useState } from 'react';
import { Loader2, LogIn, Sparkles, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { ThemeItem } from '../types';
import {
  generatePresentationDeck,
  polishSlideMarkdown,
} from '../utils/aiClient';

export type AgentActionMode = 'create_deck' | 'edit_slide';

interface SlideAgentDrawerProps {
  themes: ThemeItem[];
  activeThemeId: string;
  activeSlideIndex: number;
  activeSlideMarkdown: string;
  hasActiveSlide: boolean;
  onClose: () => void;
  onCreateDeck: (title: string, markdown: string, themeId: string) => void;
  onUpdateActiveSlide: (nextSlideMarkdown: string) => void;
}

export function SlideAgentDrawer({
  themes,
  activeThemeId,
  activeSlideIndex,
  activeSlideMarkdown,
  hasActiveSlide,
  onClose,
  onCreateDeck,
  onUpdateActiveSlide,
}: SlideAgentDrawerProps) {
  const { user, signInWithGoogle, authFetch } = useAuth();
  const [mode, setMode] = useState<AgentActionMode>(
    hasActiveSlide ? 'edit_slide' : 'create_deck',
  );
  const [prompt, setPrompt] = useState<string>('');
  const [slideCount, setSlideCount] = useState<number>(8);
  const [themeId, setThemeId] = useState<string>(activeThemeId || 'anime');
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  useEffect(() => {
    setThemeId(activeThemeId || 'anime');
  }, [activeThemeId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Sign in with Google to use Slide Agent.');
      return;
    }

    setError(null);
    setStatusNote(null);
    setBusy(true);

    try {
      if (mode === 'create_deck') {
        const topic = prompt.trim();
        if (!topic) {
          setError('Describe the presentation you want to create.');
          setBusy(false);
          return;
        }
        const res = await generatePresentationDeck(
          {
            topic,
            notes: '',
            field: 'General',
            themeId,
            slideCount,
          },
          authFetch,
        );
        onCreateDeck(topic, res.markdown, themeId);
        setStatusNote(`Created ${slideCount}-slide deck "${topic}".`);
        setPrompt('');
      } else {
        if (!activeSlideMarkdown.trim()) {
          setError('Select a slide in Studio first.');
          setBusy(false);
          return;
        }
        const instruction =
          prompt.trim() || 'Make this slide clearer, tighter, and visually balanced.';
        const updated = await polishSlideMarkdown(
          activeSlideMarkdown,
          instruction,
          authFetch,
        );
        onUpdateActiveSlide(updated);
        setStatusNote(`Updated slide ${activeSlideIndex + 1}.`);
        setPrompt('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Slide Agent request failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Slide Agent"
        className="relative z-10 flex h-full w-full max-w-sm flex-col border-l border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-red-700 dark:text-red-400" aria-hidden="true" />
            <h2 className="font-display text-sm font-bold text-neutral-950 dark:text-white">
              Slide Agent
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Slide Agent"
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {!user && (
            <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 dark:border-neutral-800 dark:bg-neutral-950">
              <p className="text-xs text-neutral-700 dark:text-neutral-300">
                Sign in with Google to ask Slide Agent to create decks or rewrite slides.
              </p>
              <button
                type="button"
                onClick={() => signInWithGoogle().catch(() => {})}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-neutral-950 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                Sign in with Google
              </button>
            </div>
          )}

          <div>
            <span className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Task
            </span>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
              {(
                [
                  { id: 'create_deck', label: 'New Deck' },
                  { id: 'edit_slide', label: 'Edit Slide' },
                ] as { id: AgentActionMode; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setMode(item.id);
                    setError(null);
                    setStatusNote(null);
                  }}
                  className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    mode === item.id
                      ? 'bg-white text-neutral-950 shadow-xs dark:bg-neutral-700 dark:text-white'
                      : 'text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleRun} className="space-y-4">
            {mode === 'create_deck' && (
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Slides
                  <select
                    value={slideCount}
                    onChange={(e) => setSlideCount(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs font-medium text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  >
                    <option value={5}>5 slides</option>
                    <option value={8}>8 slides</option>
                    <option value={12}>12 slides</option>
                  </select>
                </label>

                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Theme
                  <select
                    value={themeId}
                    onChange={(e) => setThemeId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs font-medium text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  >
                    {themes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              {mode === 'create_deck'
                ? 'What should this presentation cover?'
                : `How should Slide ${activeSlideIndex + 1} be updated?`}
              <textarea
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === 'create_deck'
                    ? 'e.g., Q3 engineering review with architecture diagram and rollout milestones'
                    : 'e.g., Turn these bullets into a clean two-column comparison'
                }
                className="mt-1.5 w-full resize-none rounded-lg border border-neutral-200 bg-white p-3 text-xs leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
              />
            </label>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            {statusNote && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                {statusNote}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Working...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  {mode === 'create_deck' ? 'Generate Presentation' : 'Apply to Slide'}
                </>
              )}
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
