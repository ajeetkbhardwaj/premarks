import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type {
  AppView,
  RenderResult,
  SavedDeck,
  TemplateItem,
  ThemeItem,
} from './types';
import {
  extractFrontmatterDirective,
  joinMarpDocument,
  splitMarpDocument,
  updateFrontmatterDirective,
} from './utils/marpDocument';
import { TemplatesView } from './components/TemplatesView';
import { StudioView } from './components/StudioView';
import { IntegrationsView } from './components/IntegrationsView';
import { PresenterModal } from './components/PresenterModal';
import { SlideAgentDrawer } from './components/SlideAgentDrawer';

const DECKS_STORAGE_KEY = 'premarks.decks.v1';
const ACTIVE_ID_KEY = 'premarks.activeDeckId.v1';

const BLANK_DECK_MARKDOWN = `---
marp: true
theme: anime
size: 16:9
paginate: true
math: mathjax
transition: fade 0.5s
---

<!-- _class: lead animate-in -->

<span class="eyebrow">New Presentation</span>

# Untitled Deck

## Add a clear opening thesis or presentation overview here

Presenter Name · Organization · 2026

---

<!-- _class: section animate-in -->

# First Section

<div class="row">

<div class="card" data-fragment="1">

### Point One
Replace this text using the Visual Editor or Markdown tab.

</div>

<div class="card" data-fragment="2">

### Point Two
Add equations, Mermaid diagrams, tables, or callout cards.

</div>

</div>
`;

function makeDeckId(): string {
  return `deck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function PremarksApp() {
  const { user, authFetch } = useAuth();
  const [view, setView] = useState<AppView>('templates');
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [deckTitle, setDeckTitle] = useState<string>('Untitled Presentation');
  const [markdown, setMarkdown] = useState<string>(BLANK_DECK_MARKDOWN);
  const [themeId, setThemeId] = useState<string>('anime');
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  const [rendered, setRendered] = useState<RenderResult | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const [isDarkUi, setIsDarkUi] = useState<boolean>(false);
  const [showAgentDrawer, setShowAgentDrawer] = useState<boolean>(false);

  // Presenter modal state
  const [presenterOpen, setPresenterOpen] = useState<boolean>(false);
  const [presenterTitle, setPresenterTitle] = useState<string>('Presentation');
  const [presenterHtml, setPresenterHtml] = useState<string | null>(null);
  const [presenterSrcUrl, setPresenterSrcUrl] = useState<string | null>(null);
  const [presenterEmbedded, setPresenterEmbedded] = useState<boolean>(false);
  const [presenterLoading, setPresenterLoading] = useState<boolean>(false);
  const [presenterError, setPresenterError] = useState<string | null>(null);

  const cloudSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkUi);
  }, [isDarkUi]);

  const buildAndPresent = useCallback(
    async (targetTitle: string, targetMd: string, targetTheme: string, embedded = false) => {
      setPresenterTitle(targetTitle);
      setPresenterSrcUrl(null);
      setPresenterHtml(null);
      setPresenterEmbedded(embedded);
      setPresenterError(null);
      setPresenterLoading(true);
      setPresenterOpen(true);

      try {
        const htmlRes = await fetch('/api/export-html', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            markdown: targetMd,
            themeId: targetTheme,
            title: targetTitle,
          }),
        });
        if (!htmlRes.ok) {
          const errJson = await htmlRes.json().catch(() => ({}));
          throw new Error(errJson.error || 'HTML export failed');
        }
        const html = await htmlRes.text();
        setPresenterHtml(html);
      } catch (err) {
        setPresenterError(err instanceof Error ? err.message : 'Export error');
      } finally {
        setPresenterLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setIsLoadingCatalog(true);
      setCatalogError(null);
      try {
        const [tplRes, thmRes] = await Promise.all([
          fetch('/api/templates'),
          fetch('/api/themes'),
        ]);
        if (!tplRes.ok || !thmRes.ok) {
          throw new Error('Failed to load presentation catalog from server.');
        }
        const tplData = await tplRes.json();
        const thmData = await thmRes.json();
        if (cancelled) return;

        const loadedTemplates: TemplateItem[] = tplData.templates || [];
        const loadedThemes: ThemeItem[] = thmData.themes || [];
        setTemplates(loadedTemplates);
        setThemes(loadedThemes);

        let initialDecks: SavedDeck[] = [];
        try {
          const rawList = localStorage.getItem(DECKS_STORAGE_KEY);
          if (rawList) {
            const parsedList = JSON.parse(rawList);
            if (Array.isArray(parsedList)) initialDecks = parsedList;
          }
        } catch {
          // Ignore storage read error
        }

        if (initialDecks.length === 0 && loadedTemplates.length > 0) {
          const first = loadedTemplates[0];
          const starter: SavedDeck = {
            id: makeDeckId(),
            title: first.title,
            themeId: first.themeId,
            markdown: first.markdown,
            templateId: first.id,
            slideCount: first.slideCount,
            updatedAt: new Date().toISOString(),
          };
          initialDecks = [starter];
        }

        setSavedDecks(initialDecks);

        const storedActiveId = localStorage.getItem(ACTIVE_ID_KEY);
        const activeDeck =
          initialDecks.find((d) => d.id === storedActiveId) || initialDecks[0];

        if (activeDeck) {
          setActiveDeckId(activeDeck.id);
          setActiveTemplateId(activeDeck.templateId);
          setDeckTitle(activeDeck.title);
          setMarkdown(activeDeck.markdown);
          setThemeId(activeDeck.themeId);
        }

        const params = new URLSearchParams(window.location.search);
        const shareId = params.get('share');
        const isEmbed = params.get('embed') === '1';
        if (shareId) {
          try {
            const shareRes = await fetch(`/api/shares/${encodeURIComponent(shareId)}`);
            if (shareRes.ok) {
              const shared = await shareRes.json();
              if (!cancelled && shared?.markdown) {
                buildAndPresent(
                  shared.title || 'Shared Presentation',
                  shared.markdown,
                  shared.themeId || 'anime',
                  isEmbed,
                );
              }
            }
          } catch {
            // Ignore invalid share link
          }
        }
      } catch (err) {
        if (!cancelled) {
          setCatalogError(err instanceof Error ? err.message : 'Catalog load failed');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCatalog(false);
        }
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [buildAndPresent]);

  useEffect(() => {
    if (!activeDeckId || !markdown) return;
    const slideCount = splitMarpDocument(markdown).slides.length;
    setSavedDecks((prev) => {
      const idx = prev.findIndex((d) => d.id === activeDeckId);
      const existingIsCloud = idx >= 0 ? Boolean(prev[idx].isCloud) : false;
      const updatedItem: SavedDeck = {
        id: activeDeckId,
        title: deckTitle,
        themeId,
        markdown,
        templateId: activeTemplateId,
        slideCount,
        updatedAt: new Date().toISOString(),
        isCloud: existingIsCloud,
      };
      const next =
        idx >= 0
          ? prev.map((d, i) => (i === idx ? updatedItem : d))
          : [updatedItem, ...prev];
      try {
        localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(next));
        localStorage.setItem(ACTIVE_ID_KEY, activeDeckId);
      } catch {
        // Ignore quota error
      }
      return next;
    });

    if (user && !activeDeckId.startsWith('deck-')) {
      if (cloudSyncTimerRef.current) clearTimeout(cloudSyncTimerRef.current);
      cloudSyncTimerRef.current = setTimeout(() => {
        authFetch(`/api/decks/${encodeURIComponent(activeDeckId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: deckTitle, themeId, markdown }),
        }).catch(() => {});
      }, 900);
    }

    return () => {
      if (cloudSyncTimerRef.current) clearTimeout(cloudSyncTimerRef.current);
    };
  }, [activeDeckId, activeTemplateId, authFetch, deckTitle, markdown, themeId, user]);

  useEffect(() => {
    if (!markdown.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsRendering(true);
      setRenderError(null);
      try {
        const res = await fetch('/api/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markdown, themeId }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Compilation error');
        }
        setRendered(data);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setRenderError(err instanceof Error ? err.message : 'Failed to render slides');
        }
      } finally {
        setIsRendering(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [markdown, themeId]);

  const openNewDeckInStudio = async (
    title: string,
    nextMd: string,
    nextTheme: string,
    templateId: string | null,
  ) => {
    const localId = makeDeckId();
    const count = splitMarpDocument(nextMd).slides.length;
    let finalDeck: SavedDeck = {
      id: localId,
      title,
      themeId: nextTheme,
      markdown: nextMd,
      templateId,
      slideCount: count,
      updatedAt: new Date().toISOString(),
    };

    setActiveDeckId(finalDeck.id);
    setActiveTemplateId(templateId);
    setDeckTitle(title);
    setMarkdown(finalDeck.markdown);
    setThemeId(nextTheme);
    setActiveSlideIndex(0);
    setSavedDecks((prev) => [finalDeck, ...prev]);
    setView('studio');

    if (user) {
      try {
        const res = await authFetch('/api/decks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, themeId: nextTheme, markdown: nextMd, templateId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.deck) {
            finalDeck = { ...data.deck, isCloud: true };
            setSavedDecks((prev) =>
              prev.map((d) => (d.id === localId ? finalDeck : d)),
            );
            setActiveDeckId(finalDeck.id);
            setMarkdown(finalDeck.markdown);
          }
        }
      } catch {
        // Keep local deck if cloud write fails transiently
      }
    }
  };

  const handleSelectTemplate = (tpl: TemplateItem) => {
    openNewDeckInStudio(tpl.title, tpl.markdown, tpl.themeId, tpl.id);
  };

  const handleChangeTheme = (nextThemeId: string) => {
    setThemeId(nextThemeId);
    setMarkdown((prev) => updateFrontmatterDirective(prev, 'theme', nextThemeId));
  };

  const handleMarkdownChange = (nextMd: string) => {
    setMarkdown(nextMd);
    const fmTheme = extractFrontmatterDirective(nextMd, 'theme');
    if (fmTheme && themes.some((t) => t.id === fmTheme) && fmTheme !== themeId) {
      setThemeId(fmTheme);
    }
  };

  const handleImportMarkdownFile = (title: string, md: string) => {
    const detectedTheme = extractFrontmatterDirective(md, 'theme') || themeId || 'anime';
    openNewDeckInStudio(title, md, detectedTheme, null);
  };

  const parsedDoc = useMemo(() => splitMarpDocument(markdown), [markdown]);
  const activeSlideRaw = parsedDoc.slides[activeSlideIndex]?.rawBody || '';

  const handleAgentUpdateSlide = (nextBody: string) => {
    const bodies = parsedDoc.slides.map((s) => s.rawBody);
    bodies[activeSlideIndex] = nextBody;
    handleMarkdownChange(joinMarpDocument(parsedDoc.frontmatter, bodies));
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'presentation';

  const triggerDownload = (content: BlobPart, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    triggerDownload(markdown, `${slugify(deckTitle)}.md`, 'text/markdown;charset=utf-8');
  };

  const handleExportHtmlDownload = async () => {
    const res = await authFetch('/api/export-html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markdown,
        themeId,
        title: deckTitle,
      }),
    });
    if (!res.ok) throw new Error('HTML export failed');
    const html = await res.text();
    triggerDownload(html, `${slugify(deckTitle)}.html`, 'text/html;charset=utf-8');
  };

  const handleExportPptxDownload = async () => {
    const res = await authFetch('/api/export-pptx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markdown,
        themeId,
        title: deckTitle,
      }),
    });
    if (!res.ok) throw new Error('PPTX export failed');
    const arrayBuf = await res.arrayBuffer();
    triggerDownload(
      arrayBuf,
      `${slugify(deckTitle)}.pptx`,
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    );
  };

  const handleExportPrintPdf = async () => {
    const res = await authFetch('/api/export-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markdown,
        themeId,
        title: deckTitle,
      }),
    });
    if (!res.ok) throw new Error('PDF export failed');
    const mode = res.headers.get('X-Export-Mode');
    if (mode === 'pdf') {
      const pdfBuf = await res.arrayBuffer();
      triggerDownload(pdfBuf, `${slugify(deckTitle)}.pdf`, 'application/pdf');
      return;
    }

    const html = await res.text();
    const frame = document.createElement('iframe');
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    frame.srcdoc = html;
    document.body.appendChild(frame);
    frame.onload = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } finally {
        setTimeout(() => frame.remove(), 2000);
      }
    };
  };

  const handleShareDeck = async (): Promise<string> => {
    const res = await authFetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: deckTitle,
        markdown,
        themeId,
        deckId: activeDeckId && !activeDeckId.startsWith('deck-') ? activeDeckId : null,
      }),
    });
    if (!res.ok) {
      throw new Error('Could not create shareable link');
    }
    const { id } = await res.json();
    const url = new URL(window.location.href);
    url.search = `?share=${encodeURIComponent(id)}`;
    return url.toString();
  };

  const handleOpenShowcase = () => {
    setPresenterTitle('Premarks Showcase');
    setPresenterHtml(null);
    setPresenterEmbedded(false);
    setPresenterError(null);
    setPresenterLoading(false);
    setPresenterSrcUrl('/slides.html');
    setPresenterOpen(true);
  };

  void savedDecks;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/95">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-8 px-6 lg:px-10">
          {/* Zone 1: Brand wordmark */}
          <button
            type="button"
            onClick={() => setView('templates')}
            className="font-display text-lg font-bold tracking-tight text-neutral-950 whitespace-nowrap shrink-0 dark:text-white"
          >
            Premarks
          </button>

          {/* Zone 2: 3 focused nav links */}
          <nav aria-label="Primary navigation" className="hidden items-center gap-7 md:flex">
            <button
              type="button"
              onClick={() => setView('templates')}
              className={`border-b-2 py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                view === 'templates'
                  ? 'border-red-700 text-neutral-950 dark:border-red-500 dark:text-white'
                  : 'border-transparent text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Templates
            </button>
            <button
              type="button"
              onClick={() => setView('studio')}
              className={`border-b-2 py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                view === 'studio'
                  ? 'border-red-700 text-neutral-950 dark:border-red-500 dark:text-white'
                  : 'border-transparent text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Studio
            </button>
            <button
              type="button"
              onClick={() => setView('integrations')}
              className={`border-b-2 py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                view === 'integrations'
                  ? 'border-red-700 text-neutral-950 dark:border-red-500 dark:text-white'
                  : 'border-transparent text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Integrations
            </button>
          </nav>

          {/* Zone 3: Single Google Slides-style Slide Agent button */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setShowAgentDrawer((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-950 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 whitespace-nowrap shrink-0 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Slide Agent
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Strip */}
      <nav
        aria-label="Mobile navigation"
        className="flex items-center gap-5 overflow-x-auto border-b border-neutral-200 bg-white px-6 py-2.5 md:hidden dark:border-neutral-800 dark:bg-neutral-900"
      >
        {(['templates', 'studio', 'integrations'] as AppView[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setView(tab)}
            className={`text-xs font-semibold capitalize whitespace-nowrap shrink-0 ${
              view === tab ? 'text-red-700 dark:text-red-400' : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {view === 'templates' && (
        <TemplatesView
          templates={templates}
          themes={themes}
          isLoading={isLoadingCatalog}
          error={catalogError}
          onSelectTemplate={handleSelectTemplate}
          onPresentTemplate={(tpl) => buildAndPresent(tpl.title, tpl.markdown, tpl.themeId)}
          onOpenBlankStudio={() =>
            openNewDeckInStudio('Untitled Deck', BLANK_DECK_MARKDOWN, 'anime', null)
          }
          onImportMarkdownFile={handleImportMarkdownFile}
          onOpenShowcase={handleOpenShowcase}
        />
      )}

      {view === 'studio' && (
        <StudioView
          deckTitle={deckTitle}
          markdown={markdown}
          themeId={themeId}
          themes={themes}
          rendered={rendered}
          isRendering={isRendering}
          renderError={renderError}
          isDarkUi={isDarkUi}
          activeSlideIndex={activeSlideIndex}
          onChangeActiveSlide={setActiveSlideIndex}
          onToggleDarkUi={() => setIsDarkUi((v) => !v)}
          onChangeTitle={setDeckTitle}
          onChangeMarkdown={handleMarkdownChange}
          onChangeTheme={handleChangeTheme}
          onPresent={() => buildAndPresent(deckTitle, markdown, themeId)}
          onImportMarkdownFile={handleImportMarkdownFile}
          onExportHtml={handleExportHtmlDownload}
          onExportPptx={handleExportPptxDownload}
          onExportPrintPdf={handleExportPrintPdf}
          onDownloadMarkdown={handleDownloadMarkdown}
          onShareDeck={handleShareDeck}
        />
      )}

      {view === 'integrations' && (
        <IntegrationsView
          templates={templates}
          themes={themes}
          onOpenStudio={() => setView('studio')}
        />
      )}

      {showAgentDrawer && (
        <SlideAgentDrawer
          themes={themes}
          activeThemeId={themeId}
          activeSlideIndex={activeSlideIndex}
          activeSlideMarkdown={activeSlideRaw}
          hasActiveSlide={view === 'studio' && parsedDoc.slides.length > 0}
          onClose={() => setShowAgentDrawer(false)}
          onCreateDeck={(title, md, chosenTheme) => {
            openNewDeckInStudio(title, md, chosenTheme, null);
          }}
          onUpdateActiveSlide={handleAgentUpdateSlide}
        />
      )}

      {presenterOpen && (
        <PresenterModal
          title={presenterTitle}
          htmlContent={presenterHtml}
          srcUrl={presenterSrcUrl}
          isEmbedded={presenterEmbedded}
          isLoading={presenterLoading}
          error={presenterError}
          onClose={() => setPresenterOpen(false)}
          onDownloadHtml={
            presenterHtml
              ? () =>
                  triggerDownload(
                    presenterHtml,
                    `${slugify(presenterTitle)}.html`,
                    'text/html;charset=utf-8',
                  )
              : undefined
          }
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <PremarksApp />
    </AuthProvider>
  );
}

export default App;
