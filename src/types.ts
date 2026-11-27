export type AppView = 'templates' | 'studio' | 'integrations';
export type StudioPaneMode = 'split' | 'editor' | 'preview' | 'grid';
export type EditorSurfaceMode = 'visual' | 'markdown';

export interface TemplateItem {
  id: string;
  title: string;
  field: string;
  themeId: string;
  slideCount: number;
  summary: string;
  markdown: string;
  previewHtml: string;
  previewCss: string;
}

export interface ThemeItem {
  id: string;
  name: string;
  tagline: string;
  bestFor: string;
  fonts: string;
  isDark: boolean;
  swatches: string[];
  css: string;
}

export interface RenderResult {
  slides: string[];
  css: string;
  comments: string[][];
  slideCount: number;
  themeId: string;
}

export interface ParsedSlide {
  index: number;
  id?: string;
  title: string;
  layoutClass: string;
  rawBody: string;
  startOffset: number;
  endOffset: number;
}

export interface SavedDeck {
  id: string;
  title: string;
  themeId: string;
  markdown: string;
  templateId: string | null;
  slideCount: number;
  updatedAt: string;
  isCloud?: boolean;
}

export interface DeckSnapshot {
  id: string;
  label: string;
  markdown: string;
  themeId: string;
  slideCount: number;
  createdAt: string;
}

export interface BrandKitConfig {
  headerText: string;
  footerText: string;
  paginate: boolean;
  accentColor: string;
  bgColor: string;
  inkColor: string;
  fontChoice: string;
  logoDataUrl: string;
}

export interface LintIssue {
  id: string;
  slideId: string | null;
  slideIndex: number | null;
  rule:
    | 'density-words'
    | 'overflow-risk'
    | 'missing-alt-text'
    | 'contrast-ratio'
    | 'heading-hierarchy'
    | 'missing-slide-ids';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
  autoFixable: boolean;
}

export interface LintDeckReport {
  deckScore: number;
  slideCount: number;
  passed: boolean;
  issues: LintIssue[];
  perSlideScores: Record<string, number>;
  fixedMarkdown?: string;
}

export interface ApiKeySummary {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string;
  rateLimitPerMin: number;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  rawKey?: string;
}

export interface UsageSummary {
  totalEvents: number;
  byAction: Record<string, number>;
  recent: Array<{
    id: string;
    action: string;
    model: string | null;
    units: number;
    createdAt: string;
  }>;
}

export interface UuidTaskItem {
  uuid: string;
  phase: string;
  title: string;
  status: string;
}
