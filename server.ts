import 'dotenv/config';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import express, { type Request, type Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  createApiKeyForUser,
  createDeckForUser,
  createDeckVersionForUser,
  createShareRecord,
  deleteDeckForUser,
  getDeckByIdForUser,
  getShareRecordById,
  getUsageSummaryForUser,
  listApiKeysForUser,
  listDecksForUser,
  listDeckVersionsForUser,
  recordUsageEvent,
  revokeApiKeyForUser,
  updateDeckForUser,
} from './src/db/repositories.ts';
import {
  optionalAuth,
  requireAuth,
  requireMcpAuth,
  type AuthRequest,
} from './src/middleware/auth.ts';
import {
  generatePresentationWithGemini,
  generateSpeakerNotesWithGemini,
  polishSlideWithGemini,
} from './src/server/geminiAi.ts';
import { lintDeck } from './src/server/lintDeck.ts';
import { createPremarksMcpServer } from './src/server/mcpServer.ts';
import {
  buildPrintDocument,
  compileDeck,
  exportHtmlIsolated,
  exportPdfWithHeadlessFallback,
  exportPptxIsolated,
  getWorkerStats,
} from './src/server/renderService.ts';

const require = createRequire(import.meta.url);
const { THEMES, THEME_MAP } = require('./lib/themes.js');
const { TEMPLATES } = require('./lib/templates.js');
const { buildZipBuffer, buildTgzBuffer } = require('./lib/archiveBuilder.js');

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';
const ROOT_DIR = process.cwd();
const APP_VERSION = '2.0.0';
const START_TIME = Date.now();

function sanitizeFilename(title: unknown): string {
  return (
    (typeof title === 'string' ? title : 'presentation')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'presentation'
  );
}

function getSafeOrigin(req: Request): string {
  const rawHost = String(req.get('x-forwarded-host') || req.get('host') || '127.0.0.1:3000')
    .split(',')[0]
    .trim();
  const safeHost = /^[a-zA-Z0-9.-]+(:\d{1,5})?$/.test(rawHost) ? rawHost : '127.0.0.1:3000';
  const rawProto = String(req.get('x-forwarded-proto') || req.protocol || 'http').split(',')[0].trim();
  const safeProto = rawProto === 'https' ? 'https' : 'http';
  return `${safeProto}://${safeHost}`;
}

// Pre-render slide 1 thumbnail for each template at startup
const enrichedTemplates = TEMPLATES.map(
  (tpl: { id: string; title: string; field: string; themeId: string; summary: string; markdown: string }) => {
    try {
      const compiled = compileDeck(tpl.markdown, tpl.themeId);
      return {
        ...tpl,
        slideCount: compiled.slideCount,
        previewHtml: compiled.slides[0] || '',
        previewCss: compiled.css || '',
      };
    } catch (err) {
      console.error(`Failed to pre-render template ${tpl.id}:`, err);
      return {
        ...tpl,
        slideCount: 1,
        previewHtml: '',
        previewCss: '',
      };
    }
  },
);

const UUID_ROADMAP_TASKS = [
  {
    uuid: 'a1b2c3d4-0001-4000-8000-000000000001',
    phase: 'Phase 1 · Foundation',
    title: 'Cloud SQL PostgreSQL + Drizzle Persistence',
    status: 'completed',
  },
  {
    uuid: 'a1b2c3d4-0002-4000-8000-000000000002',
    phase: 'Phase 1 · Foundation',
    title: 'Firebase Auth + SHA-256 Hashed API Keys & Rate Limits',
    status: 'completed',
  },
  {
    uuid: 'a1b2c3d4-0004-4000-8000-000000000004',
    phase: 'Phase 1 · Foundation',
    title: 'Worker-Isolated Rendering, HTML Sanitization & Headless PDF Probe',
    status: 'completed',
  },
  {
    uuid: 'a1b2c3d4-0005-4000-8000-000000000005',
    phase: 'Phase 1 · Foundation',
    title: 'PPTX MathJax SVG + Mermaid Fidelity Upgrade',
    status: 'completed',
  },
  {
    uuid: 'b2c3d4e5-2001-4000-8000-000000002001',
    phase: 'Phase 2 · MCP Server',
    title: 'Immutable pm-slide-id UUID Anchors & Slide Edit Engine',
    status: 'completed',
  },
  {
    uuid: 'b2c3d4e5-2002-4000-8000-000000002002',
    phase: 'Phase 2 · MCP Server',
    title: 'lint_deck Layout, Overflow, Contrast & Alt-Text Analyzer',
    status: 'completed',
  },
  {
    uuid: 'b2c3d4e5-2003-4000-8000-000000002003',
    phase: 'Phase 2 · MCP Server',
    title: 'Remote Streamable HTTP /mcp Server (8 Agent Tools)',
    status: 'completed',
  },
  {
    uuid: 'b2c3d4e5-2004-4000-8000-000000002004',
    phase: 'Phase 2 · MCP Server',
    title: 'Local stdio Bridge (premarks-mcp) & IDE Config Guides',
    status: 'completed',
  },
  {
    uuid: 'c3d4e5f6-3001-4000-8000-000000003001',
    phase: 'Phase 3 · Server AI',
    title: 'Server-Side Gemini AI Metering & Deck Quality Eval',
    status: 'completed',
  },
  {
    uuid: 'd4e5f6a7-4001-4000-8000-000000004001',
    phase: 'Phase 4 · Quality',
    title: 'Automated Unit + PPTX XML Round-Trip Test Suite',
    status: 'completed',
  },
];

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '1mb' }));

  // CORS & Preflight for remote MCP clients, CLI, and VS Code extension on ai.studio / *.run.app
  app.use((req, res, next) => {
    if (req.path === '/mcp' || req.path.startsWith('/api/')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-API-Key, Mcp-Session-Id',
      );
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      res.setHeader(
        'Access-Control-Expose-Headers',
        'X-Export-Mode, X-RateLimit-Remaining, Retry-After',
      );
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
    }
    return next();
  });

  // Readiness & Worker Telemetry
  app.get('/healthz', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'premarks',
      version: APP_VERSION,
      uptimeSec: Math.round((Date.now() - START_TIME) / 1000),
      worker: getWorkerStats(),
    });
  });

  app.get('/api/tasks', (_req: Request, res: Response) => {
    res.json({ tasks: UUID_ROADMAP_TASKS });
  });

  // Public Catalog
  app.get('/api/templates', (_req: Request, res: Response) => {
    res.json({ templates: enrichedTemplates });
  });

  app.get('/api/themes', (_req: Request, res: Response) => {
    res.json({ themes: THEMES });
  });

  // Render & Lint
  app.post('/api/render', (req: Request, res: Response) => {
    const { markdown, themeId } = req.body || {};
    if (typeof markdown !== 'string') {
      return res.status(400).json({ error: 'markdown must be a string' });
    }
    if (markdown.length > 512 * 1024) {
      return res.status(413).json({ error: 'Markdown exceeds 512KB limit' });
    }
    const validThemeId = typeof themeId === 'string' && THEME_MAP.has(themeId) ? themeId : 'anime';

    try {
      const result = compileDeck(markdown, validThemeId);
      return res.json(result);
    } catch (err) {
      console.error('Render error:', err);
      return res.status(422).json({ error: (err as Error).message || 'Failed to compile Markdown' });
    }
  });

  app.post('/api/lint', optionalAuth, (req: AuthRequest, res: Response) => {
    const { markdown, autoFix } = req.body || {};
    if (typeof markdown !== 'string' || !markdown.trim()) {
      return res.status(400).json({ error: 'markdown must be a non-empty string' });
    }
    if (markdown.length > 512 * 1024) {
      return res.status(413).json({ error: 'Markdown exceeds 512KB limit' });
    }
    const report = lintDeck(markdown, { autoFix: Boolean(autoFix) });
    return res.json(report);
  });

  // Exports (Worker-isolated)
  app.post('/api/export-html', optionalAuth, async (req: AuthRequest, res: Response) => {
    const { markdown, themeId, title } = req.body || {};
    if (typeof markdown !== 'string' || !markdown.trim()) {
      return res.status(400).json({ error: 'markdown must be a non-empty string' });
    }
    if (markdown.length > 512 * 1024) {
      return res.status(413).json({ error: 'Markdown exceeds 512KB limit' });
    }
    const validThemeId = typeof themeId === 'string' && THEME_MAP.has(themeId) ? themeId : 'anime';
    const safeFilename = sanitizeFilename(title);

    try {
      const html = await exportHtmlIsolated(markdown, validThemeId, String(title || 'Presentation'));
      if (req.auth) {
        await recordUsageEvent({
          userId: req.auth.userId,
          apiKeyId: req.auth.apiKeyId,
          action: 'export.html',
          units: 1,
        });
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="${safeFilename}.html"`);
      return res.send(html);
    } catch (err) {
      console.error('Export HTML error:', err);
      return res.status(500).json({ error: 'Failed to generate HTML presentation' });
    }
  });

  app.post('/api/export-pptx', optionalAuth, async (req: AuthRequest, res: Response) => {
    const { markdown, themeId, title } = req.body || {};
    if (typeof markdown !== 'string' || !markdown.trim()) {
      return res.status(400).json({ error: 'markdown must be a non-empty string' });
    }
    if (markdown.length > 512 * 1024) {
      return res.status(413).json({ error: 'Markdown exceeds 512KB limit' });
    }
    const validThemeId = typeof themeId === 'string' && THEME_MAP.has(themeId) ? themeId : 'anime';
    const safeFilename = sanitizeFilename(title);

    try {
      const buffer = await exportPptxIsolated(markdown, validThemeId, String(title || 'Presentation'));
      if (req.auth) {
        await recordUsageEvent({
          userId: req.auth.userId,
          apiKeyId: req.auth.apiKeyId,
          action: 'export.pptx',
          units: 1,
        });
      }
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pptx"`);
      return res.send(buffer);
    } catch (err) {
      console.error('Export PPTX error:', err);
      return res.status(500).json({ error: 'Failed to generate PowerPoint presentation' });
    }
  });

  app.post('/api/export-print', (_req: Request, res: Response) => {
    const { markdown, themeId, title } = _req.body || {};
    if (typeof markdown !== 'string' || !markdown.trim()) {
      return res.status(400).json({ error: 'markdown must be a non-empty string' });
    }
    if (markdown.length > 512 * 1024) {
      return res.status(413).json({ error: 'Markdown exceeds 512KB limit' });
    }
    const validThemeId = typeof themeId === 'string' && THEME_MAP.has(themeId) ? themeId : 'anime';

    try {
      const html = buildPrintDocument(markdown, validThemeId, String(title || 'Presentation'));
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch (err) {
      console.error('Export Print error:', err);
      return res.status(500).json({ error: 'Failed to build print view' });
    }
  });

  app.post('/api/export-pdf', optionalAuth, async (req: AuthRequest, res: Response) => {
    const { markdown, themeId, title } = req.body || {};
    if (typeof markdown !== 'string' || !markdown.trim()) {
      return res.status(400).json({ error: 'markdown must be a non-empty string' });
    }
    if (markdown.length > 512 * 1024) {
      return res.status(413).json({ error: 'Markdown exceeds 512KB limit' });
    }
    const validThemeId = typeof themeId === 'string' && THEME_MAP.has(themeId) ? themeId : 'anime';
    const safeFilename = sanitizeFilename(title);

    try {
      const result = await exportPdfWithHeadlessFallback(
        markdown,
        validThemeId,
        String(title || 'Presentation'),
      );
      if (req.auth) {
        await recordUsageEvent({
          userId: req.auth.userId,
          apiKeyId: req.auth.apiKeyId,
          action: `export.${result.mode}`,
          units: 1,
        });
      }
      res.setHeader('X-Export-Mode', result.mode);
      res.setHeader('Content-Type', result.contentType);
      res.setHeader(
        'Content-Disposition',
        result.mode === 'pdf'
          ? `attachment; filename="${safeFilename}.pdf"`
          : `inline; filename="${safeFilename}.print.html"`,
      );
      return res.send(result.buffer);
    } catch (err) {
      console.error('Export PDF error:', err);
      return res.status(500).json({ error: 'Failed to export PDF' });
    }
  });

  // Authenticated User, API Keys, Usage & Cloud Decks
  app.get('/api/me', requireAuth, (req: AuthRequest, res: Response) => {
    return res.json({ user: req.auth });
  });

  app.get('/api/usage', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const summary = await getUsageSummaryForUser(req.auth!.userId);
      return res.json(summary);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/keys', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const keys = await listApiKeysForUser(req.auth!.userId);
      return res.json({ keys });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/keys', requireAuth, async (req: AuthRequest, res: Response) => {
    const { name, scopes, rateLimitPerMin } = req.body || {};
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'API key name is required.' });
    }
    try {
      const created = await createApiKeyForUser(
        req.auth!.userId,
        name,
        typeof scopes === 'string' && scopes.trim() ? scopes.trim() : 'decks:read,decks:write,mcp,ai',
        typeof rateLimitPerMin === 'number' && rateLimitPerMin >= 10 && rateLimitPerMin <= 600
          ? Math.floor(rateLimitPerMin)
          : 60,
      );
      return res.status(201).json(created);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/keys/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const revoked = await revokeApiKeyForUser(req.auth!.userId, String(req.params.id));
      if (!revoked) return res.status(404).json({ error: 'API key not found.' });
      return res.json({ revoked: true });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/decks', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const rows = await listDecksForUser(req.auth!.userId);
      return res.json({ decks: rows });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/decks', requireAuth, async (req: AuthRequest, res: Response) => {
    const { title, themeId, markdown, templateId } = req.body || {};
    if (typeof markdown !== 'string' || !markdown.trim()) {
      return res.status(400).json({ error: 'markdown must be a non-empty string' });
    }
    if (markdown.length > 512 * 1024) {
      return res.status(413).json({ error: 'Markdown exceeds 512KB limit' });
    }
    try {
      const deck = await createDeckForUser({
        userId: req.auth!.userId,
        title: typeof title === 'string' && title.trim() ? title : 'Untitled Presentation',
        themeId: typeof themeId === 'string' && THEME_MAP.has(themeId) ? themeId : 'anime',
        templateId: typeof templateId === 'string' ? templateId : null,
        markdown,
      });
      return res.status(201).json({ deck });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/decks/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const found = await getDeckByIdForUser(req.auth!.userId, String(req.params.id));
      if (!found) return res.status(404).json({ error: 'Deck not found.' });
      return res.json(found);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch('/api/decks/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    const { title, themeId, markdown } = req.body || {};
    if (typeof markdown === 'string' && markdown.length > 512 * 1024) {
      return res.status(413).json({ error: 'Markdown exceeds 512KB limit' });
    }
    try {
      const updated = await updateDeckForUser({
        userId: req.auth!.userId,
        deckId: String(req.params.id),
        title: typeof title === 'string' ? title : undefined,
        themeId: typeof themeId === 'string' && THEME_MAP.has(themeId) ? themeId : undefined,
        markdown: typeof markdown === 'string' ? markdown : undefined,
      });
      if (!updated) return res.status(404).json({ error: 'Deck not found.' });
      return res.json({ deck: updated });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/decks/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const deleted = await deleteDeckForUser(req.auth!.userId, String(req.params.id));
      if (!deleted) return res.status(404).json({ error: 'Deck not found.' });
      return res.json({ deleted: true });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/decks/:id/versions', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const versions = await listDeckVersionsForUser(req.auth!.userId, String(req.params.id));
      if (!versions) return res.status(404).json({ error: 'Deck not found.' });
      return res.json({ versions });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/decks/:id/versions', requireAuth, async (req: AuthRequest, res: Response) => {
    const { label } = req.body || {};
    try {
      const version = await createDeckVersionForUser({
        userId: req.auth!.userId,
        deckId: String(req.params.id),
        label: typeof label === 'string' && label.trim() ? label : 'Snapshot',
      });
      if (!version) return res.status(404).json({ error: 'Deck not found.' });
      return res.status(201).json({ version });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  // Server-Side Gemini AI (metered)
  app.post('/api/ai/generate-deck', requireAuth, async (req: AuthRequest, res: Response) => {
    const { topic, notes, field, themeId, slideCount } = req.body || {};
    if (typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'topic is required' });
    }
    try {
      const result = await generatePresentationWithGemini({
        topic: topic.trim().slice(0, 240),
        notes: typeof notes === 'string' ? notes.slice(0, 8000) : '',
        field: typeof field === 'string' && field.trim() ? field.trim() : 'STEM & Math',
        themeId: typeof themeId === 'string' && THEME_MAP.has(themeId) ? themeId : 'anime',
        slideCount:
          typeof slideCount === 'number' && slideCount >= 3 && slideCount <= 20
            ? Math.floor(slideCount)
            : 8,
      });

      await recordUsageEvent({
        userId: req.auth!.userId,
        apiKeyId: req.auth!.apiKeyId,
        action: 'ai.generate_deck',
        model: result.model,
        units: 1,
      });

      return res.json(result);
    } catch (err) {
      console.error('AI generate-deck error:', err);
      return res.status(500).json({ error: (err as Error).message || 'AI deck generation failed' });
    }
  });

  app.post('/api/ai/polish-slide', requireAuth, async (req: AuthRequest, res: Response) => {
    const { slideBody, instruction } = req.body || {};
    if (typeof slideBody !== 'string' || !slideBody.trim()) {
      return res.status(400).json({ error: 'slideBody is required' });
    }
    try {
      const result = await polishSlideWithGemini(
        slideBody.slice(0, 12_000),
        typeof instruction === 'string' && instruction.trim()
          ? instruction.trim()
          : 'Improve visual clarity and layout density.',
      );

      await recordUsageEvent({
        userId: req.auth!.userId,
        apiKeyId: req.auth!.apiKeyId,
        action: 'ai.polish_slide',
        model: result.model,
        units: 1,
      });

      return res.json(result);
    } catch (err) {
      console.error('AI polish-slide error:', err);
      return res.status(500).json({ error: (err as Error).message || 'AI slide polish failed' });
    }
  });

  app.post('/api/ai/speaker-notes', requireAuth, async (req: AuthRequest, res: Response) => {
    const { slideBody } = req.body || {};
    if (typeof slideBody !== 'string' || !slideBody.trim()) {
      return res.status(400).json({ error: 'slideBody is required' });
    }
    try {
      const result = await generateSpeakerNotesWithGemini(slideBody.slice(0, 12_000));

      await recordUsageEvent({
        userId: req.auth!.userId,
        apiKeyId: req.auth!.apiKeyId,
        action: 'ai.speaker_notes',
        model: result.model,
        units: 1,
      });

      return res.json(result);
    } catch (err) {
      console.error('AI speaker-notes error:', err);
      return res.status(500).json({ error: (err as Error).message || 'AI speaker notes failed' });
    }
  });

  // Persistent PostgreSQL Shares
  app.post('/api/shares', optionalAuth, async (req: AuthRequest, res: Response) => {
    const { title, markdown, themeId, deckId, isPublic } = req.body || {};
    if (typeof markdown !== 'string' || !markdown.trim()) {
      return res.status(400).json({ error: 'markdown must be a non-empty string' });
    }
    if (markdown.length > 512 * 1024) {
      return res.status(413).json({ error: 'Markdown exceeds 512KB limit' });
    }
    const validThemeId = typeof themeId === 'string' && THEME_MAP.has(themeId) ? themeId : 'anime';
    const safeTitle =
      typeof title === 'string' && title.trim() ? title.trim().slice(0, 140) : 'Shared Presentation';

    try {
      const record = await createShareRecord({
        title: safeTitle,
        markdown,
        themeId: validThemeId,
        userId: req.auth?.userId ?? null,
        deckId: typeof deckId === 'string' ? deckId : null,
        isPublic: typeof isPublic === 'boolean' ? isPublic : true,
      });
      return res.status(201).json({
        id: record.id,
        title: record.title,
        isPublic: record.isPublic,
        createdAt: record.createdAt,
      });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/shares/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id || '');
    if (!/^[a-f0-9]{12}$/.test(id)) {
      return res.status(400).json({ error: 'Invalid share ID' });
    }
    try {
      const record = await getShareRecordById(id);
      if (!record) {
        return res.status(404).json({ error: 'Shared presentation not found' });
      }
      if (!record.isPublic && record.userId !== req.auth?.userId) {
        return res.status(403).json({ error: 'This shared deck is private.' });
      }
      return res.json(record);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  // Remote Streamable HTTP MCP Endpoint (Stateless + Strict Bearer Auth)
  app.post('/mcp', requireMcpAuth, async (req: AuthRequest, res: Response) => {
    const origin = getSafeOrigin(req);
    const mcpAuth = req.auth!;
    delete req.auth;

    const accept = String(req.headers.accept || '');
    if (!accept.includes('application/json') || !accept.includes('text/event-stream')) {
      req.headers.accept = 'application/json, text/event-stream';
    }

    const server = createPremarksMcpServer(mcpAuth, origin);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on('close', () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(
        req as unknown as Parameters<typeof transport.handleRequest>[0],
        res,
        req.body,
      );
    } catch (err) {
      console.error('MCP transport error:', err);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal MCP server error' },
          id: null,
        });
      }
    }
  });

  app.get('/mcp', (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed on stateless /mcp endpoint. Use POST.' },
      id: null,
    });
  });

  app.delete('/mcp', (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed on stateless /mcp endpoint.' },
      id: null,
    });
  });

  // Static compiled demo deck
  app.get('/slides.html', (_req: Request, res: Response) => {
    res.sendFile(path.join(ROOT_DIR, 'slides.html'));
  });
  app.get('/slides.pdf', (_req: Request, res: Response) => {
    res.sendFile(path.join(ROOT_DIR, 'slides.pdf'));
  });

  // VS Code & CLI Integration Distributions
  app.get('/api/integrations/vscode/snippets', (_req: Request, res: Response) => {
    res.sendFile(path.join(ROOT_DIR, 'integrations', 'vscode-extension', 'snippets', 'premarks.json'));
  });

  app.get('/api/integrations/vscode/premarks-vscode.vsix', (req: Request, res: Response) => {
    try {
      const origin = getSafeOrigin(req);
      const extDir = path.join(ROOT_DIR, 'integrations', 'vscode-extension');
      const pkgRaw = JSON.parse(fs.readFileSync(path.join(extDir, 'package.json'), 'utf8'));
      if (pkgRaw?.contributes?.configuration?.properties?.['premarks.serverUrl']) {
        pkgRaw.contributes.configuration.properties['premarks.serverUrl'].default = origin;
      }
      const extJs = fs
        .readFileSync(path.join(extDir, 'extension.js'), 'utf8')
        .replace(/http:\/\/127\.0\.0\.1:3000/g, origin);
      const snippets = fs.readFileSync(path.join(extDir, 'snippets', 'premarks.json'), 'utf8');
      const readme = fs
        .readFileSync(path.join(extDir, 'README.md'), 'utf8')
        .replace(/http:\/\/127\.0\.0\.1:3000/g, origin);

      const contentTypesXml = `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension=".json" ContentType="application/json"/>
  <Default Extension=".js" ContentType="application/javascript"/>
  <Default Extension=".md" ContentType="text/markdown"/>
  <Default Extension=".vsixmanifest" ContentType="text/xml"/>
</Types>`;

      const vsixManifest = `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
  <Metadata>
    <Identity Language="en-US" Id="premarks-vscode" Version="${pkgRaw.version}" Publisher="premarks"/>
    <DisplayName>Premarks Presentation Studio</DisplayName>
    <Description xml:space="preserve">Write, live-preview, export (HTML/PPTX/PDF), and share Marp + MathJax + Mermaid presentations directly in VS Code.</Description>
    <Tags>marp,markdown,slides,presentation,mathjax,mermaid</Tags>
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code"/>
  </Installation>
  <Dependencies/>
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true"/>
    <Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true"/>
  </Assets>
</PackageManifest>`;

      const vsixBuffer = buildZipBuffer([
        { name: '[Content_Types].xml', content: contentTypesXml },
        { name: 'extension.vsixmanifest', content: vsixManifest },
        { name: 'extension/package.json', content: JSON.stringify(pkgRaw, null, 2) },
        { name: 'extension/extension.js', content: extJs },
        { name: 'extension/snippets/premarks.json', content: snippets },
        { name: 'extension/README.md', content: readme },
      ]);

      res.setHeader('Content-Type', 'application/vsix');
      res.setHeader('Content-Disposition', 'attachment; filename="premarks-vscode.vsix"');
      return res.send(vsixBuffer);
    } catch (err) {
      console.error('VSIX package error:', err);
      return res.status(500).json({ error: 'Failed to build VS Code extension package' });
    }
  });

  app.get('/api/integrations/cli/premarks-cli.tgz', (req: Request, res: Response) => {
    try {
      const origin = getSafeOrigin(req);
      const cliDir = path.join(ROOT_DIR, 'cli');
      const pkgJson = fs.readFileSync(path.join(cliDir, 'package.json'), 'utf8');
      const binJs = fs
        .readFileSync(path.join(cliDir, 'bin', 'premarks.js'), 'utf8')
        .replace(/http:\/\/127\.0\.0\.1:3000/g, origin);
      const mcpBinJs = fs
        .readFileSync(path.join(cliDir, 'bin', 'premarks-mcp.js'), 'utf8')
        .replace(/http:\/\/127\.0\.0\.1:3000/g, origin);
      const readme = fs
        .readFileSync(path.join(cliDir, 'README.md'), 'utf8')
        .replace(/<PREMARKS_URL>/g, origin);

      const tgzBuffer = buildTgzBuffer([
        { name: 'package/package.json', content: pkgJson, mode: 0o644 },
        { name: 'package/bin/premarks.js', content: binJs, mode: 0o755 },
        { name: 'package/bin/premarks-mcp.js', content: mcpBinJs, mode: 0o755 },
        { name: 'package/README.md', content: readme, mode: 0o644 },
      ]);

      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', 'attachment; filename="premarks-cli.tgz"');
      return res.send(tgzBuffer);
    } catch (err) {
      console.error('CLI tarball error:', err);
      return res.status(500).json({ error: 'Failed to build CLI tarball' });
    }
  });

  app.get('/api/integrations/cli/premarks.js', (req: Request, res: Response) => {
    try {
      const origin = getSafeOrigin(req);
      const binJs = fs
        .readFileSync(path.join(ROOT_DIR, 'cli', 'bin', 'premarks.js'), 'utf8')
        .replace(/http:\/\/127\.0\.0\.1:3000/g, origin);
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="premarks.js"');
      return res.send(binJs);
    } catch (err) {
      console.error('CLI script error:', err);
      return res.status(500).json({ error: 'Failed to serve CLI script' });
    }
  });

  app.get('/api/integrations/cli/premarks-mcp.js', (req: Request, res: Response) => {
    try {
      const origin = getSafeOrigin(req);
      const mcpBinJs = fs
        .readFileSync(path.join(ROOT_DIR, 'cli', 'bin', 'premarks-mcp.js'), 'utf8')
        .replace(/http:\/\/127\.0\.0\.1:3000/g, origin);
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="premarks-mcp.js"');
      return res.send(mcpBinJs);
    } catch (err) {
      console.error('MCP CLI script error:', err);
      return res.status(500).json({ error: 'Failed to serve premarks-mcp script' });
    }
  });

  app.get('/api/integrations/cli/install.sh', (req: Request, res: Response) => {
    const origin = getSafeOrigin(req);
    const script = `#!/usr/bin/env bash
set -euo pipefail

PREMARKS_ORIGIN="${origin}"
echo "Installing Premarks CLI + MCP Bridge (connected to \${PREMARKS_ORIGIN})..."

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js >= 18 is required. Install from https://nodejs.org"
  exit 1
fi

if command -v npm >/dev/null 2>&1 && npm install -g "\${PREMARKS_ORIGIN}/api/integrations/cli/premarks-cli.tgz"; then
  echo ""
  echo "Premarks CLI & premarks-mcp installed globally via npm!"
else
  BIN_DIR="\${HOME}/.local/bin"
  mkdir -p "\${BIN_DIR}"
  curl -fsSL "\${PREMARKS_ORIGIN}/api/integrations/cli/premarks.js" -o "\${BIN_DIR}/premarks"
  curl -fsSL "\${PREMARKS_ORIGIN}/api/integrations/cli/premarks-mcp.js" -o "\${BIN_DIR}/premarks-mcp"
  chmod +x "\${BIN_DIR}/premarks" "\${BIN_DIR}/premarks-mcp"
  echo ""
  echo "Installed standalone Premarks CLI & premarks-mcp to \${BIN_DIR}"
  echo "Ensure \${BIN_DIR} is in your PATH."
fi

echo "Run: premarks --help"
`;
    res.setHeader('Content-Type', 'text/x-shellscript; charset=utf-8');
    return res.send(script);
  });

  const distDir = path.join(ROOT_DIR, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.join(distDir, 'index.html'));

  if (isProd) {
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    console.log(`Premarks v${APP_VERSION} running at http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Premarks server:', err);
  process.exit(1);
});
