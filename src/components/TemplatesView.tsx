import { useMemo, useRef, useState } from 'react';
import { ArrowRight, FileUp, Play, Search } from 'lucide-react';
import type { TemplateItem, ThemeItem } from '../types';
import { SlideFrame } from './SlideFrame';

interface TemplatesViewProps {
  templates: TemplateItem[];
  themes: ThemeItem[];
  isLoading: boolean;
  error: string | null;
  onSelectTemplate: (template: TemplateItem) => void;
  onPresentTemplate: (template: TemplateItem) => void;
  onOpenBlankStudio: () => void;
  onImportMarkdownFile: (title: string, markdown: string) => void;
  onOpenShowcase: () => void;
}

export function TemplatesView({
  templates,
  themes,
  isLoading,
  error,
  onSelectTemplate,
  onPresentTemplate,
  onOpenBlankStudio,
  onImportMarkdownFile,
  onOpenShowcase,
}: TemplatesViewProps) {
  const [selectedField, setSelectedField] = useState<string>('All');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [query, setQuery] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const themeNameMap = useMemo(
    () => new Map(themes.map((t) => [t.id, t.name])),
    [themes],
  );

  const fields = useMemo(() => {
    const unique = Array.from(new Set(templates.map((t) => t.field)));
    return ['All', ...unique];
  }, [templates]);

  const isFiltering =
    selectedField !== 'All' || selectedTheme !== 'all' || query.trim().length > 0;

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((tpl) => {
      if (selectedField !== 'All' && tpl.field !== selectedField) return false;
      if (selectedTheme !== 'all' && tpl.themeId !== selectedTheme) return false;
      if (q) {
        const hay = `${tpl.title} ${tpl.field} ${tpl.summary} ${tpl.themeId}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [templates, selectedField, selectedTheme, query]);

  const starterTemplates = useMemo(
    () => filteredTemplates.filter((tpl) => tpl.field === 'Basic & Starter'),
    [filteredTemplates],
  );

  const showcaseTemplates = useMemo(
    () => filteredTemplates.filter((tpl) => tpl.field !== 'Basic & Starter'),
    [filteredTemplates],
  );

  const clearFilters = () => {
    setSelectedField('All');
    setSelectedTheme('all');
    setQuery('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const renderTemplateCard = (tpl: TemplateItem) => {
    const styleLabel = themeNameMap.get(tpl.themeId) || tpl.themeId;
    return (
      <article
        key={tpl.id}
        className="group flex flex-col justify-between overflow-hidden rounded-xl border border-neutral-200 bg-white transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
      >
        <div>
          <div className="bg-[#EBEEF3] p-3 dark:bg-[#0D0E12]">
            <button
              type="button"
              onClick={() => onSelectTemplate(tpl)}
              aria-label={`Use ${tpl.title}`}
              className="block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              <SlideFrame
                slideHtml={tpl.previewHtml}
                css={tpl.previewCss}
                title={`${tpl.title} preview`}
                variant="card"
              />
            </button>
          </div>

          <div className="px-4 pt-3.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
              <span>{tpl.field}</span>
              <span aria-hidden="true">·</span>
              <span>{styleLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{tpl.slideCount} slides</span>
            </div>

            <h3 className="mt-1 font-display text-base font-semibold tracking-tight text-neutral-950 dark:text-white">
              {tpl.title}
            </h3>

            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              {tpl.summary}
            </p>
          </div>
        </div>

        <div className="mx-4 mt-4 flex items-center justify-between gap-2 border-t border-neutral-100 py-3 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => onSelectTemplate(tpl)}
            className="rounded-lg bg-neutral-950 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 whitespace-nowrap shrink-0 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
          >
            Use Template
          </button>

          <button
            type="button"
            onClick={() => onPresentTemplate(tpl)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 whitespace-nowrap shrink-0 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            Preview
          </button>
        </div>
      </article>
    );
  };

  return (
    <main className="mx-auto w-full max-w-[1360px] px-6 py-8 lg:px-10">
      <section className="grid grid-cols-1 items-end gap-6 border-b border-neutral-200 pb-8 lg:grid-cols-12 dark:border-neutral-800">
        <div className="lg:col-span-7">
          <h1 className="text-balance font-display text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
            Start from a template, or open a blank deck.
          </h1>
          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Pick a clean starter or animated showcase deck, import a <code className="font-mono text-xs">.md</code> file, and export to PowerPoint, PDF, or HTML.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2.5 lg:col-span-5 lg:items-end">
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={onOpenBlankStudio}
              className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-red-800 whitespace-nowrap shrink-0"
            >
              Open Blank Deck
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-neutral-900 transition-colors hover:bg-neutral-100 whitespace-nowrap shrink-0 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
            >
              <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
              Import .md
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenShowcase}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
          >
            <Play className="h-3 w-3" aria-hidden="true" />
            Preview Interactive Showcase
          </button>
        </div>
      </section>

      <section aria-label="Filter templates" className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-900">
          {fields.map((field) => {
            const active = selectedField === field;
            return (
              <button
                key={field}
                type="button"
                onClick={() => setSelectedField(field)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white text-neutral-950 shadow-xs dark:bg-neutral-800 dark:text-white'
                    : 'text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                {field}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates..."
              aria-label="Search presentation templates"
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-8 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none sm:w-52 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-400"
            />
          </div>

          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            aria-label="Filter by presentation style"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-800 focus:border-neutral-900 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="all">All Styles</option>
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="mt-7" aria-label="Presentation templates">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="flex flex-col rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="aspect-video w-full animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
                <div className="mt-4 h-3 w-36 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
                <div className="mt-2 h-5 w-3/4 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white px-6 py-16 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="font-display text-base font-semibold text-neutral-900 dark:text-white">
              No matching templates
            </h2>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              Try clearing your search or choosing another category.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
            >
              Reset Filters
            </button>
          </div>
        ) : !isFiltering && starterTemplates.length > 0 && showcaseTemplates.length > 0 ? (
          <div className="space-y-10">
            <div>
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold tracking-tight text-neutral-950 dark:text-white">
                    Quick Starters
                  </h2>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Clean 5-slide foundations ready to edit in seconds.
                  </p>
                </div>
                <span className="font-mono text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
                  {starterTemplates.length} templates
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {starterTemplates.map(renderTemplateCard)}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-baseline justify-between gap-4 border-t border-neutral-200 pt-8 dark:border-neutral-800">
                <div>
                  <h2 className="font-display text-lg font-bold tracking-tight text-neutral-950 dark:text-white">
                    Featured &amp; Domain Templates
                  </h2>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Animated layouts with Bento grids, live counters, MathJax equations, and Mermaid diagrams.
                  </p>
                </div>
                <span className="font-mono text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
                  {showcaseTemplates.length} templates
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {showcaseTemplates.map(renderTemplateCard)}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map(renderTemplateCard)}
          </div>
        )}
      </section>
    </main>
  );
}
