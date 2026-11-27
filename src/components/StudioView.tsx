import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
  FileUp,
  LayoutGrid,
  Loader2,
  Maximize2,
  Moon,
  Palette,
  PanelLeft,
  Play,
  Plus,
  RotateCcw,
  Share2,
  Sun,
  Trash2,
} from 'lucide-react';
import type {
  EditorSurfaceMode,
  RenderResult,
  StudioPaneMode,
  ThemeItem,
} from '../types';
import {
  SLIDE_LAYOUT_TEMPLATES,
  SNIPPET_BLOCKS,
  countSlideFragments,
  joinMarpDocument,
  splitMarpDocument,
} from '../utils/marpDocument';
import {
  MERMAID_SNIPPETS,
  parseVisualSlideFields,
  serializeVisualSlideFields,
  type VisualSlideFields,
} from '../utils/brandKit';
import { BrandKitDrawer } from './BrandKitDrawer';
import { SlideFrame } from './SlideFrame';

interface StudioViewProps {
  deckTitle: string;
  markdown: string;
  themeId: string;
  themes: ThemeItem[];
  rendered: RenderResult | null;
  isRendering: boolean;
  renderError: string | null;
  isDarkUi: boolean;
  activeSlideIndex: number;
  onChangeActiveSlide: (index: number) => void;
  onToggleDarkUi: () => void;
  onChangeTitle: (title: string) => void;
  onChangeMarkdown: (nextMarkdown: string) => void;
  onChangeTheme: (nextThemeId: string) => void;
  onPresent: () => void;
  onImportMarkdownFile: (title: string, markdown: string) => void;
  onExportHtml: () => Promise<void>;
  onExportPptx: () => Promise<void>;
  onExportPrintPdf: () => Promise<void>;
  onDownloadMarkdown: () => void;
  onShareDeck: () => Promise<string>;
}

const TRANSITION_OPTIONS = [
  { label: 'Fade (0.5s)', value: 'fade 0.5s' },
  { label: 'Rise (0.55s)', value: 'rise 0.55s' },
  { label: 'Veil (0.55s)', value: 'veil 0.55s' },
  { label: 'Wipe (0.55s)', value: 'wipe 0.55s' },
  { label: 'Iris (0.6s)', value: 'iris 0.6s' },
  { label: 'Glide (0.5s)', value: 'glide 0.5s' },
  { label: 'Flip (0.6s)', value: 'flip 0.6s' },
  { label: 'Focus (0.6s)', value: 'focus 0.6s' },
  { label: 'Zoom (0.65s)', value: 'zoom 0.65s' },
  { label: 'Slide (0.5s)', value: 'slide 0.5s' },
  { label: 'None', value: 'none' },
];

const ENTRANCE_ANIM_OPTIONS = [
  { label: 'Stagger Rise', value: 'animate-in' },
  { label: 'Zoom Reveal', value: 'animate-zoom' },
  { label: 'Slide Left', value: 'animate-left' },
  { label: 'Slide Right', value: 'animate-right' },
  { label: 'Focus Blur', value: 'animate-blur' },
  { label: 'Pop Bounce', value: 'animate-pop' },
  { label: 'None', value: 'none' },
];

const LAYOUT_CLASSES = [
  { label: 'Standard', value: 'standard' },
  { label: 'Cover', value: 'lead' },
  { label: 'Section', value: 'section' },
  { label: '2-Column', value: 'split' },
  { label: 'Bento', value: 'bento' },
  { label: 'Metrics', value: 'kpi' },
  { label: 'Timeline', value: 'timeline-slide' },
  { label: 'Agenda', value: 'agenda' },
  { label: 'Standout', value: 'standout' },
  { label: 'Quote', value: 'quote' },
  { label: 'Closing', value: 'closing' },
];

function LayoutGlyph({ layout }: { layout: string }) {
  if (layout === 'lead') {
    return (
      <div className="flex h-6 w-10 flex-col items-start justify-center gap-0.5 rounded-[2px] border border-current/25 bg-current/[0.04] px-1.5">
        <div className="h-0.5 w-3 bg-current/40" />
        <div className="h-1 w-6 bg-current/80" />
        <div className="h-0.5 w-4 bg-current/45" />
      </div>
    );
  }
  if (layout === 'split') {
    return (
      <div className="grid h-6 w-10 grid-cols-2 gap-1 rounded-[2px] border border-current/25 bg-current/[0.04] p-1">
        <div className="flex flex-col justify-center gap-0.5">
          <div className="h-0.5 w-full bg-current/70" />
          <div className="h-0.5 w-3/4 bg-current/40" />
        </div>
        <div className="rounded-[1px] border border-current/35 bg-current/10" />
      </div>
    );
  }
  if (layout === 'bento') {
    return (
      <div className="grid h-6 w-10 grid-cols-3 grid-rows-2 gap-0.5 rounded-[2px] border border-current/25 bg-current/[0.04] p-1">
        <div className="col-span-2 rounded-[1px] border border-current/35 bg-current/10" />
        <div className="rounded-[1px] border border-current/35" />
        <div className="rounded-[1px] border border-current/35" />
        <div className="col-span-2 rounded-[1px] border border-current/35 bg-current/10" />
      </div>
    );
  }
  if (layout === 'kpi') {
    return (
      <div className="grid h-6 w-10 grid-cols-3 gap-0.5 rounded-[2px] border border-current/25 bg-current/[0.04] p-1">
        <div className="rounded-[1px] border border-current/35 bg-current/10" />
        <div className="rounded-[1px] border border-current/35 bg-current/10" />
        <div className="rounded-[1px] border border-current/35 bg-current/10" />
      </div>
    );
  }
  if (layout === 'timeline-slide') {
    return (
      <div className="flex h-6 w-10 items-center justify-between gap-0.5 rounded-[2px] border border-current/25 bg-current/[0.04] px-1">
        <div className="h-2 w-2 rounded-xs bg-current/60" />
        <div className="h-2 w-2 rounded-xs bg-current/45" />
        <div className="h-2 w-2 rounded-xs bg-current/35" />
      </div>
    );
  }
  if (layout === 'agenda') {
    return (
      <div className="grid h-6 w-10 grid-cols-2 grid-rows-2 gap-0.5 rounded-[2px] border border-current/25 bg-current/[0.04] p-1">
        <div className="rounded-[1px] border border-current/35" />
        <div className="rounded-[1px] border border-current/35" />
        <div className="rounded-[1px] border border-current/35" />
        <div className="rounded-[1px] border border-current/35" />
      </div>
    );
  }
  if (layout === 'centered' || layout === 'quote') {
    return (
      <div className="flex h-6 w-10 flex-col items-center justify-center gap-0.5 rounded-[2px] border border-current/25 bg-current/[0.04] px-1.5">
        <div className="h-1 w-6 bg-current/75" />
        <div className="h-0.5 w-4 bg-current/45" />
      </div>
    );
  }
  if (layout === 'closing') {
    return (
      <div className="flex h-6 w-10 flex-col items-start justify-center gap-0.5 rounded-[2px] border border-current/35 bg-current/85 px-1.5">
        <div className="h-1 w-5 bg-white/90 dark:bg-neutral-950/90" />
        <div className="h-0.5 w-6 bg-white/55 dark:bg-neutral-950/55" />
      </div>
    );
  }
  if (layout === 'section') {
    return (
      <div className="flex h-6 w-10 flex-col justify-between rounded-[2px] border border-current/25 bg-current/[0.04] p-1">
        <div className="h-0.5 w-5 bg-current/80" />
        <div className="grid grid-cols-2 gap-0.5">
          <div className="h-2.5 rounded-[1px] border border-current/30" />
          <div className="h-2.5 rounded-[1px] border border-current/30" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-6 w-10 flex-col justify-center gap-0.5 rounded-[2px] border border-current/25 bg-current/[0.04] p-1">
      <div className="h-0.5 w-4 bg-current/75" />
      <div className="h-0.5 w-full bg-current/35" />
      <div className="h-0.5 w-5/6 bg-current/35" />
    </div>
  );
}

export function StudioView({
  deckTitle,
  markdown,
  themeId,
  themes,
  rendered,
  isRendering,
  renderError,
  isDarkUi,
  activeSlideIndex,
  onChangeActiveSlide,
  onToggleDarkUi,
  onChangeTitle,
  onChangeMarkdown,
  onChangeTheme,
  onPresent,
  onImportMarkdownFile,
  onExportHtml,
  onExportPptx,
  onExportPrintPdf,
  onDownloadMarkdown,
  onShareDeck,
}: StudioViewProps) {
  const [paneMode, setPaneMode] = useState<StudioPaneMode>('split');
  const [editorMode, setEditorMode] = useState<EditorSurfaceMode>('visual');
  const [fragmentStep, setFragmentStep] = useState<number>(-1);
  const [replayKey, setReplayKey] = useState<number>(0);

  const [showAddSlideMenu, setShowAddSlideMenu] = useState<boolean>(false);
  const [showSnippetMenu, setShowSnippetMenu] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [showBrandKit, setShowBrandKit] = useState<boolean>(false);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const stageScrollRef = useRef<HTMLDivElement | null>(null);
  const slideStageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const suppressStageScrollRef = useRef<boolean>(false);
  const hasMountedStageRef = useRef<boolean>(false);

  const closeAllMenus = () => {
    setShowAddSlideMenu(false);
    setShowSnippetMenu(false);
    setShowExportMenu(false);
  };

  const parsed = useMemo(() => splitMarpDocument(markdown), [markdown]);
  const totalSlides = Math.max(parsed.slides.length, rendered?.slides.length || 0);

  useEffect(() => {
    if (activeSlideIndex >= parsed.slides.length && parsed.slides.length > 0) {
      onChangeActiveSlide(parsed.slides.length - 1);
    }
  }, [activeSlideIndex, onChangeActiveSlide, parsed.slides.length]);

  useEffect(() => {
    setFragmentStep(-1);
  }, [activeSlideIndex]);

  useEffect(() => {
    if (paneMode !== 'split' && paneMode !== 'preview') return;
    if (!hasMountedStageRef.current) {
      hasMountedStageRef.current = true;
      return;
    }
    if (suppressStageScrollRef.current) {
      suppressStageScrollRef.current = false;
      return;
    }
    const rafId = requestAnimationFrame(() => {
      const container = stageScrollRef.current;
      const targetEl = slideStageRefs.current[activeSlideIndex];
      if (container && targetEl) {
        container.scrollTo({
          top: Math.max(0, targetEl.offsetTop - 10),
          behavior: 'smooth',
        });
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [activeSlideIndex, paneMode]);

  const activeSlide = parsed.slides[activeSlideIndex];
  const visualFields = useMemo(
    () => parseVisualSlideFields(activeSlide?.rawBody || ''),
    [activeSlide?.rawBody],
  );

  const activeSlideHtml = rendered?.slides[activeSlideIndex] || '';
  const activeSlideCss = rendered?.css || '';
  const activeFragmentCount = useMemo(
    () => countSlideFragments(activeSlideHtml),
    [activeSlideHtml],
  );

  const wordCount = useMemo(() => {
    const clean = (activeSlide?.rawBody || '')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .trim();
    return clean ? clean.split(/\s+/).length : 0;
  }, [activeSlide?.rawBody]);

  const updateActiveSlideBody = (nextBody: string) => {
    const bodies = parsed.slides.map((s) => s.rawBody);
    bodies[activeSlideIndex] = nextBody;
    onChangeMarkdown(joinMarpDocument(parsed.frontmatter, bodies));
  };

  const updateVisualField = (patch: Partial<VisualSlideFields>) => {
    const merged: VisualSlideFields = { ...visualFields, ...patch };
    updateActiveSlideBody(serializeVisualSlideFields(merged));
  };

  const selectSlide = (index: number, fromStageClick = false) => {
    const safeIdx = Math.max(0, Math.min(index, parsed.slides.length - 1));
    suppressStageScrollRef.current = fromStageClick;
    onChangeActiveSlide(safeIdx);
    const target = parsed.slides[safeIdx];
    if (target && editorRef.current && editorMode === 'markdown') {
      editorRef.current.focus();
      editorRef.current.setSelectionRange(target.startOffset, target.startOffset);
      const textBefore = markdown.slice(0, target.startOffset);
      const lineNum = textBefore.split('\n').length;
      const totalLines = markdown.split('\n').length || 1;
      const ratio = lineNum / totalLines;
      editorRef.current.scrollTop = Math.max(
        0,
        ratio * editorRef.current.scrollHeight - 40,
      );
    }
  };

  const handleInsertSlide = (layoutMarkdown: string) => {
    const bodies = parsed.slides.map((s) => s.rawBody);
    const insertAt = Math.min(activeSlideIndex + 1, bodies.length);
    bodies.splice(insertAt, 0, layoutMarkdown);
    onChangeMarkdown(joinMarpDocument(parsed.frontmatter, bodies));
    onChangeActiveSlide(insertAt);
    setShowAddSlideMenu(false);
  };

  const handleDuplicateSlide = (index: number) => {
    const bodies = parsed.slides.map((s) => s.rawBody);
    if (!bodies[index]) return;
    bodies.splice(index + 1, 0, bodies[index]);
    onChangeMarkdown(joinMarpDocument(parsed.frontmatter, bodies));
    onChangeActiveSlide(index + 1);
  };

  const handleDeleteSlide = (index: number) => {
    if (parsed.slides.length <= 1) return;
    const bodies = parsed.slides.map((s) => s.rawBody);
    bodies.splice(index, 1);
    onChangeMarkdown(joinMarpDocument(parsed.frontmatter, bodies));
    onChangeActiveSlide(Math.max(0, Math.min(index, bodies.length - 1)));
  };

  const handleMoveSlide = (index: number, delta: -1 | 1) => {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= parsed.slides.length) return;
    const bodies = parsed.slides.map((s) => s.rawBody);
    const [moved] = bodies.splice(index, 1);
    bodies.splice(nextIndex, 0, moved);
    onChangeMarkdown(joinMarpDocument(parsed.frontmatter, bodies));
    onChangeActiveSlide(nextIndex);
  };

  const handleInsertSnippet = (snippet: string) => {
    setShowSnippetMenu(false);
    if (editorMode === 'visual') {
      updateVisualField({ body: `${visualFields.body}\n${snippet}`.trim() });
      return;
    }
    const textarea = editorRef.current;
    if (!textarea) {
      onChangeMarkdown(markdown + snippet);
      return;
    }
    const start = textarea.selectionStart ?? markdown.length;
    const end = textarea.selectionEnd ?? markdown.length;
    const next = markdown.slice(0, start) + snippet + markdown.slice(end);
    onChangeMarkdown(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + snippet.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const next = markdown.slice(0, start) + '  ' + markdown.slice(end);
      onChangeMarkdown(next);
      requestAnimationFrame(() => {
        textarea.setSelectionRange(start + 2, start + 2);
      });
    }
  };

  const handleEditorCursorMove = () => {
    const textarea = editorRef.current;
    if (!textarea) return;
    const pos = textarea.selectionStart;
    const found = parsed.slides.findIndex(
      (s) => pos >= s.startOffset && pos <= s.endOffset + 1,
    );
    if (found >= 0 && found !== activeSlideIndex) {
      onChangeActiveSlide(found);
    }
  };

  const handleRunExport = async (fn: () => Promise<void> | void) => {
    setShowExportMenu(false);
    setIsExporting(true);
    try {
      await fn();
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareClick = async () => {
    closeAllMenus();
    setIsSharing(true);
    try {
      const url = await onShareDeck();
      setShareUrl(url);
      await navigator.clipboard?.writeText(url).catch(() => {});
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } finally {
      setIsSharing(false);
    }
  };

  const handleMarkdownFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const cleanTitle = file.name.replace(/\.(md|markdown)$/i, '') || 'Imported Deck';
        onImportMarkdownFile(cleanTitle, reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex h-[calc(100vh-65px)] min-h-[600px] flex-col bg-[#EBEEF3] dark:bg-[#0B0C0F]">
      {/* Tier 1: Document Title + Share / Export / Present */}
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex min-w-0 items-center gap-2.5">
          <input
            type="text"
            value={deckTitle}
            onChange={(e) => onChangeTitle(e.target.value)}
            aria-label="Presentation title"
            className="w-48 truncate rounded-md border border-transparent bg-transparent px-2 py-1 font-display text-sm font-bold text-neutral-950 transition-colors hover:bg-neutral-100 focus:border-neutral-300 focus:bg-white focus:outline-none sm:w-64 dark:text-white dark:hover:bg-neutral-800 dark:focus:border-neutral-700 dark:focus:bg-neutral-950"
          />
          <span className="hidden text-xs text-neutral-500 tabular-nums md:inline dark:text-neutral-400">
            {parsed.slides.length} slides
          </span>
          {isRendering && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" aria-label="Rendering" />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="relative">
            <button
              type="button"
              onClick={handleShareClick}
              disabled={isSharing}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 whitespace-nowrap shrink-0 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              {shareCopied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              ) : (
                <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{shareCopied ? 'Copied' : 'Share'}</span>
            </button>
            {shareUrl && (
              <div className="absolute top-full right-0 z-30 mt-1.5 w-80 rounded-lg border border-neutral-200 bg-white p-3 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
                    Shareable Link
                  </span>
                  <button
                    type="button"
                    onClick={() => setShareUrl(null)}
                    className="text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  >
                    Close
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.target.select()}
                  className="mt-1.5 w-full rounded border border-neutral-200 bg-neutral-50 px-2 py-1 font-mono text-[11px] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
                />
                <span className="mt-2.5 block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                  Embed Code
                </span>
                <input
                  type="text"
                  readOnly
                  value={`<iframe src="${shareUrl}&embed=1" width="960" height="540" style="border:0;" allowfullscreen></iframe>`}
                  onFocus={(e) => e.target.select()}
                  className="mt-1 w-full rounded border border-neutral-200 bg-neutral-50 px-2 py-1 font-mono text-[11px] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
                />
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                const next = !showExportMenu;
                closeAllMenus();
                setShowExportMenu(next);
              }}
              disabled={isExporting}
              className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 whitespace-nowrap shrink-0 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="h-3 w-3 opacity-60" aria-hidden="true" />
            </button>
            {showExportMenu && (
              <div className="absolute top-full right-0 z-30 mt-1.5 w-48 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                <button
                  type="button"
                  onClick={() => handleRunExport(onExportPptx)}
                  className="block w-full rounded-md px-3 py-2 text-left text-xs font-medium text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  PowerPoint (.pptx)
                </button>
                <button
                  type="button"
                  onClick={() => handleRunExport(onExportPrintPdf)}
                  className="block w-full rounded-md px-3 py-2 text-left text-xs font-medium text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  PDF Document (.pdf)
                </button>
                <button
                  type="button"
                  onClick={() => handleRunExport(onExportHtml)}
                  className="block w-full rounded-md px-3 py-2 text-left text-xs font-medium text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  Web Slides (.html)
                </button>
                <button
                  type="button"
                  onClick={() => handleRunExport(onDownloadMarkdown)}
                  className="block w-full rounded-md px-3 py-2 text-left text-xs font-medium text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  Markdown (.md)
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onPresent}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-700 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-800 whitespace-nowrap shrink-0"
          >
            <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            Present
          </button>
        </div>
      </div>

      {/* Tier 2: Clean Formatting & Mode Bar */}
      <div className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/90 px-4 dark:border-neutral-800 dark:bg-neutral-900/75">
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto">
          <select
            value={themeId}
            onChange={(e) => onChangeTheme(e.target.value)}
            aria-label="Presentation theme"
            className="h-7 rounded border border-neutral-200 bg-white px-2 text-xs font-medium text-neutral-800 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          >
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                Theme: {t.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              closeAllMenus();
              setShowBrandKit(true);
            }}
            className="inline-flex h-7 items-center gap-1.5 rounded px-2 text-xs font-medium text-neutral-700 hover:bg-neutral-200/70 whitespace-nowrap shrink-0 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <Palette className="h-3.5 w-3.5" aria-hidden="true" />
            Customize
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                const next = !showSnippetMenu;
                closeAllMenus();
                setShowSnippetMenu(next);
              }}
              className="inline-flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-neutral-700 hover:bg-neutral-200/70 whitespace-nowrap shrink-0 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Insert
            </button>
            {showSnippetMenu && (
              <div className="fixed top-[154px] left-4 z-40 w-56 rounded-lg border border-neutral-200 bg-white p-2 shadow-xl sm:left-auto dark:border-neutral-700 dark:bg-neutral-900">
                <p className="px-2 py-1 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                  Slide Blocks
                </p>
                {SNIPPET_BLOCKS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleInsertSnippet(item.snippet)}
                    className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                  >
                    {item.label}
                  </button>
                ))}
                <p className="mt-1.5 border-t border-neutral-100 px-2 pt-2 pb-1 text-[11px] font-semibold text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                  Diagrams
                </p>
                {MERMAID_SNIPPETS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleInsertSnippet(item.code)}
                    className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            ref={importFileRef}
            type="file"
            accept=".md,.markdown"
            onChange={handleMarkdownFileSelected}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => importFileRef.current?.click()}
            className="inline-flex h-7 items-center gap-1.5 rounded px-2 text-xs font-medium text-neutral-700 hover:bg-neutral-200/70 whitespace-nowrap shrink-0 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
            Import .md
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="flex items-center rounded-md bg-neutral-200/70 p-0.5 dark:bg-neutral-800">
            {(
              [
                { id: 'split', label: 'Split', icon: PanelLeft },
                { id: 'editor', label: 'Write', icon: null },
                { id: 'preview', label: 'Preview', icon: Maximize2 },
                { id: 'grid', label: 'Grid', icon: LayoutGrid },
              ] as { id: StudioPaneMode; label: string; icon: typeof PanelLeft | null }[]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPaneMode(item.id)}
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  paneMode === item.id
                    ? 'bg-white text-neutral-950 shadow-xs dark:bg-neutral-700 dark:text-white'
                    : 'text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                {item.icon && <item.icon className="h-3 w-3" aria-hidden="true" />}
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onToggleDarkUi}
            aria-label={isDarkUi ? 'Switch studio to light mode' : 'Switch studio to dark mode'}
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            {isDarkUi ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left Slide Filmstrip */}
        {paneMode !== 'grid' && (
          <aside className="flex w-full shrink-0 flex-col border-b border-neutral-200 bg-white lg:w-52 lg:border-r lg:border-b-0 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="relative flex h-10 shrink-0 items-center justify-between border-b border-neutral-200 px-3 dark:border-neutral-800">
              <span className="text-xs font-semibold text-neutral-700 tabular-nums dark:text-neutral-200">
                Slides ({parsed.slides.length})
              </span>

              <button
                type="button"
                onClick={() => {
                  const next = !showAddSlideMenu;
                  closeAllMenus();
                  setShowAddSlideMenu(next);
                }}
                className="inline-flex items-center gap-1 rounded-md bg-neutral-950 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-neutral-800 whitespace-nowrap shrink-0 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                New Slide
              </button>

              {showAddSlideMenu && (
                <div className="absolute top-full right-2 left-2 z-30 mt-1 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                  <p className="px-2.5 py-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                    Choose a layout
                  </p>
                  {SLIDE_LAYOUT_TEMPLATES.map((layout) => (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => handleInsertSlide(layout.markdown)}
                      className="block w-full rounded-md px-2.5 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                        {layout.label}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {layout.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-row gap-2 overflow-x-auto p-2.5 lg:flex-1 lg:flex-col lg:overflow-y-auto">
              {parsed.slides.map((slide, idx) => {
                const isActive = idx === activeSlideIndex;
                return (
                  <div
                    key={`${idx}-${slide.id || slide.title.slice(0, 12)}`}
                    className={`group relative flex w-40 shrink-0 flex-col rounded-lg p-1.5 transition-colors lg:w-full ${
                      isActive
                        ? 'bg-neutral-100 dark:bg-neutral-800/90'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`w-4 shrink-0 pt-0.5 text-right font-mono text-[11px] font-semibold tabular-nums ${
                          isActive
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-neutral-400 dark:text-neutral-500'
                        }`}
                      >
                        {idx + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => selectSlide(idx)}
                        aria-label={`Select slide ${idx + 1}: ${slide.title}`}
                        className={`min-w-0 flex-1 overflow-hidden rounded-[5px] text-left transition-all ${
                          isActive
                            ? 'ring-2 ring-red-700 dark:ring-red-500'
                            : 'ring-1 ring-neutral-200 hover:ring-neutral-400 dark:ring-neutral-700 dark:hover:ring-neutral-500'
                        }`}
                      >
                        <SlideFrame
                          slideHtml={rendered?.slides[idx] || ''}
                          css={activeSlideCss}
                          title={`Thumbnail ${idx + 1}: ${slide.title}`}
                          variant="thumb"
                          placeholderTitle={slide.title}
                        />
                      </button>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-1 pl-6">
                      <button
                        type="button"
                        onClick={() => selectSlide(idx)}
                        className="min-w-0 flex-1 truncate text-left text-[11px] font-medium text-neutral-700 dark:text-neutral-300"
                      >
                        {slide.title}
                      </button>

                      <div
                        className={`flex shrink-0 items-center gap-0.5 transition-opacity ${
                          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleMoveSlide(idx, -1)}
                          disabled={idx === 0}
                          title="Move up"
                          className="rounded p-0.5 text-neutral-500 hover:bg-neutral-200 disabled:opacity-30 dark:hover:bg-neutral-700"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSlide(idx, 1)}
                          disabled={idx === parsed.slides.length - 1}
                          title="Move down"
                          className="rounded p-0.5 text-neutral-500 hover:bg-neutral-200 disabled:opacity-30 dark:hover:bg-neutral-700"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateSlide(idx)}
                          title="Duplicate"
                          className="rounded p-0.5 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlide(idx)}
                          disabled={parsed.slides.length <= 1}
                          title="Delete"
                          className="rounded p-0.5 text-neutral-500 hover:bg-red-100 hover:text-red-700 disabled:opacity-30 dark:hover:bg-red-950 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Workspace: Grid Slide Sorter OR Split/Single Editor + Stage */}
        {paneMode === 'grid' ? (
          <div className="flex-1 overflow-y-auto bg-[#EBEEF3] p-6 dark:bg-[#0B0C0F]">
            <div className="mx-auto max-w-[1360px]">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-bold text-neutral-950 dark:text-white">
                    Slide Overview ({parsed.slides.length} slides)
                  </h2>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Click any slide to edit it, or reorder and duplicate slides below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInsertSlide(SLIDE_LAYOUT_TEMPLATES[0].markdown)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-950 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  New Slide
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {parsed.slides.map((slide, idx) => (
                  <div
                    key={`grid-${idx}`}
                    className={`flex flex-col rounded-xl border bg-white p-3 transition-all dark:bg-neutral-900 ${
                      idx === activeSlideIndex
                        ? 'border-red-700 ring-1 ring-red-700 dark:border-red-500 dark:ring-red-500'
                        : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onChangeActiveSlide(idx);
                        setPaneMode('split');
                      }}
                      className="block w-full text-left"
                    >
                      <SlideFrame
                        slideHtml={rendered?.slides[idx] || ''}
                        css={activeSlideCss}
                        title={`Slide ${idx + 1}: ${slide.title}`}
                        variant="card"
                        placeholderTitle={slide.title}
                      />
                    </button>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-neutral-900 tabular-nums dark:text-neutral-100">
                        <span className="mr-1.5 font-mono text-neutral-400">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        {slide.title}
                      </span>

                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveSlide(idx, -1)}
                          disabled={idx === 0}
                          title="Move earlier"
                          className="rounded p-1 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSlide(idx, 1)}
                          disabled={idx === parsed.slides.length - 1}
                          title="Move later"
                          className="rounded p-1 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateSlide(idx)}
                          title="Duplicate"
                          className="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlide(idx)}
                          disabled={parsed.slides.length <= 1}
                          title="Delete"
                          className="rounded p-1 text-neutral-500 hover:bg-red-100 hover:text-red-700 disabled:opacity-30 dark:hover:bg-red-950 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            {/* Editor Pane */}
            {(paneMode === 'split' || paneMode === 'editor') && (
              <div
                className={`flex min-h-0 flex-col border-b border-neutral-200 bg-white lg:border-b-0 dark:border-neutral-800 dark:bg-neutral-950 ${
                  paneMode === 'split' ? 'lg:w-[40%] lg:min-w-[340px] lg:border-r' : 'flex-1'
                }`}
              >
                <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-neutral-200 px-3.5 text-xs dark:border-neutral-800">
                  <div className="flex items-center gap-1 rounded-md bg-neutral-100 p-0.5 dark:bg-neutral-800">
                    <button
                      type="button"
                      onClick={() => setEditorMode('visual')}
                      className={`rounded px-2.5 py-0.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        editorMode === 'visual'
                          ? 'bg-white text-neutral-950 shadow-xs dark:bg-neutral-700 dark:text-white'
                          : 'text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'
                      }`}
                    >
                      Visual Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode('markdown')}
                      className={`rounded px-2.5 py-0.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        editorMode === 'markdown'
                          ? 'bg-white text-neutral-950 shadow-xs dark:bg-neutral-700 dark:text-white'
                          : 'text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'
                      }`}
                    >
                      Markdown
                    </button>
                  </div>

                  <span className="text-[11px] text-neutral-500 tabular-nums dark:text-neutral-400">
                    Slide {activeSlideIndex + 1} · {wordCount} words
                  </span>
                </div>

                {editorMode === 'markdown' ? (
                  <textarea
                    ref={editorRef}
                    value={markdown}
                    onChange={(e) => onChangeMarkdown(e.target.value)}
                    onKeyDown={handleEditorKeyDown}
                    onClick={handleEditorCursorMove}
                    onKeyUp={handleEditorCursorMove}
                    spellCheck={false}
                    aria-label="Slide Markdown editor"
                    className="min-h-[260px] w-full flex-1 resize-none bg-transparent px-4 py-3.5 font-mono text-[13px] leading-6 text-neutral-900 focus:outline-none dark:text-neutral-100"
                  />
                ) : (
                  <div className="flex-1 space-y-4 overflow-y-auto p-4">
                    <div>
                      <span className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Slide Layout
                      </span>
                      <div className="mt-2 grid grid-cols-5 gap-1.5">
                        {LAYOUT_CLASSES.map((lc) => {
                          const selected = visualFields.layoutClass === lc.value;
                          return (
                            <button
                              key={lc.value}
                              type="button"
                              onClick={() => updateVisualField({ layoutClass: lc.value })}
                              className={`flex flex-col items-center gap-1 rounded-md border px-1.5 py-2 text-[11px] font-medium transition-colors ${
                                selected
                                  ? 'border-neutral-950 bg-neutral-100 text-neutral-950 dark:border-white dark:bg-neutral-800 dark:text-white'
                                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-950 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                              }`}
                            >
                              <LayoutGlyph layout={lc.value} />
                              <span className="max-w-full truncate">{lc.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Title
                      <input
                        type="text"
                        value={visualFields.heading}
                        onChange={(e) => updateVisualField({ heading: e.target.value })}
                        placeholder="Main heading for this slide"
                        className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-normal text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                      />
                    </label>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Section Tag
                        <input
                          type="text"
                          value={visualFields.eyebrow}
                          onChange={(e) => updateVisualField({ eyebrow: e.target.value })}
                          placeholder="e.g., Chapter 1"
                          className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-normal text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                        />
                      </label>

                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Entrance Animation
                        <select
                          value={visualFields.entranceAnim}
                          onChange={(e) => {
                            updateVisualField({ entranceAnim: e.target.value });
                            setReplayKey((k) => k + 1);
                          }}
                          className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs font-medium text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                        >
                          {ENTRANCE_ANIM_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Slide Transition
                        <select
                          value={visualFields.transition}
                          onChange={(e) => updateVisualField({ transition: e.target.value })}
                          className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs font-medium text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                        >
                          <option value="">Default</option>
                          {TRANSITION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          Slide Content
                        </span>
                        <div className="flex flex-wrap items-center gap-1">
                          {[
                            { label: 'KPI Card', snippet: SNIPPET_BLOCKS[0].snippet },
                            { label: 'Bento', snippet: SNIPPET_BLOCKS[1].snippet },
                            { label: 'Beamer Block', snippet: SNIPPET_BLOCKS[9].snippet },
                            { label: 'Compare', snippet: SNIPPET_BLOCKS[10].snippet },
                            { label: 'Equation', snippet: SNIPPET_BLOCKS[4].snippet },
                            { label: 'Table', snippet: SNIPPET_BLOCKS[7].snippet },
                            { label: 'Diagram', snippet: MERMAID_SNIPPETS[0].code },
                          ].map((blk) => (
                            <button
                              key={blk.label}
                              type="button"
                              onClick={() =>
                                updateVisualField({
                                  body: `${visualFields.body}\n\n${blk.snippet.trim()}`.trim(),
                                })
                              }
                              className="rounded border border-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                            >
                              + {blk.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        rows={9}
                        value={visualFields.body}
                        onChange={(e) => updateVisualField({ body: e.target.value })}
                        placeholder="Write bullet points, tables, math formulas, or diagrams..."
                        className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white p-3 font-mono text-xs leading-relaxed text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Center-Right Continuous Full-Width Slide Stream */}
            {(paneMode === 'split' || paneMode === 'preview') && (
              <div className="flex min-h-0 flex-1 flex-col bg-[#EBEEF3] dark:bg-[#0B0C0F]">
                <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => selectSlide(activeSlideIndex - 1)}
                      disabled={activeSlideIndex <= 0}
                      aria-label="Previous slide"
                      className="inline-flex h-7 w-7 items-center justify-center rounded border border-neutral-200 text-neutral-700 hover:bg-neutral-100 disabled:opacity-35 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="min-w-[82px] text-center text-xs font-medium text-neutral-700 tabular-nums dark:text-neutral-200">
                      Slide {activeSlideIndex + 1} / {Math.max(1, totalSlides)}
                    </span>
                    <button
                      type="button"
                      onClick={() => selectSlide(activeSlideIndex + 1)}
                      disabled={activeSlideIndex >= totalSlides - 1}
                      aria-label="Next slide"
                      className="inline-flex h-7 w-7 items-center justify-center rounded border border-neutral-200 text-neutral-700 hover:bg-neutral-100 disabled:opacity-35 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReplayKey((k) => k + 1)}
                      title="Replay slide entrance animations"
                      className="inline-flex h-7 items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-2 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 whitespace-nowrap shrink-0 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                    >
                      <RotateCcw className="h-3 w-3" aria-hidden="true" />
                      <span className="hidden sm:inline">Replay</span>
                    </button>

                    {activeFragmentCount > 0 && (
                      <div className="flex items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-xs dark:border-neutral-700 dark:bg-neutral-800">
                        <span className="hidden text-[11px] text-neutral-500 sm:inline dark:text-neutral-400">
                          Step:
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setFragmentStep((prev) =>
                              prev === -1 ? 0 : Math.max(0, prev - 1),
                            )
                          }
                          className="rounded px-1 text-neutral-700 hover:bg-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-700"
                        >
                          -
                        </button>
                        <span className="min-w-[30px] text-center font-mono text-[11px] font-semibold tabular-nums">
                          {fragmentStep === -1 ? 'All' : `${fragmentStep}/${activeFragmentCount}`}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setFragmentStep((prev) =>
                              prev === -1
                                ? 1
                                : prev >= activeFragmentCount
                                  ? -1
                                  : prev + 1,
                            )
                          }
                          className="rounded px-1 text-neutral-700 hover:bg-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-700"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Full-Width Continuous 16:9 Slide Stream */}
                <div
                  ref={stageScrollRef}
                  className="relative min-h-0 flex-1 overflow-y-auto p-2.5 lg:p-3"
                >
                  {renderError ? (
                    <div className="w-full rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                      {renderError}
                    </div>
                  ) : (
                    <div className="flex w-full flex-col gap-2.5 lg:gap-3">
                      {parsed.slides.map((slide, idx) => {
                        const isActive = idx === activeSlideIndex;
                        return (
                          <div
                            key={`stage-slide-${idx}-${slide.id || slide.title.slice(0, 12)}`}
                            ref={(el) => {
                              slideStageRefs.current[idx] = el;
                            }}
                            role="button"
                            tabIndex={0}
                            onClick={() => selectSlide(idx, true)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                selectSlide(idx, true);
                              }
                            }}
                            aria-label={`Select slide ${idx + 1}: ${slide.title}`}
                            className={`relative w-full cursor-pointer overflow-hidden rounded-[6px] transition-shadow focus:outline-none ${
                              isActive
                                ? 'ring-2 ring-red-700 shadow-md dark:ring-red-500'
                                : 'ring-1 ring-black/10 hover:ring-neutral-400 dark:ring-white/15 dark:hover:ring-neutral-500'
                            }`}
                          >
                            <SlideFrame
                              slideHtml={rendered?.slides[idx] || ''}
                              css={activeSlideCss}
                              title={`${deckTitle} — Slide ${idx + 1}: ${slide.title}`}
                              fragmentStep={isActive ? fragmentStep : -1}
                              replayKey={isActive ? replayKey : 0}
                              variant="stream"
                              placeholderTitle={slide.title || 'Rendering slide preview...'}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showBrandKit && (
        <BrandKitDrawer
          markdown={markdown}
          onApplyMarkdown={onChangeMarkdown}
          onClose={() => setShowBrandKit(false)}
        />
      )}
    </div>
  );
}
