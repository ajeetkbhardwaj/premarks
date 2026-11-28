import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  createDeckForUser,
  createShareRecord,
  getDeckByIdForUser,
  recordUsageEvent,
  updateDeckForUser,
} from '../db/repositories.ts';
import type { AuthenticatedContext } from '../middleware/auth.ts';
import { lintDeck } from './lintDeck.ts';
import {
  buildPrintDocument,
  exportHtmlIsolated,
  exportPdfWithHeadlessFallback,
  exportPptxIsolated,
} from './renderService.ts';
import { applySlideEditById, ensureSlideIds, splitDeckDocumentRaw } from './slideIds.ts';

const require = createRequire(import.meta.url);
const { TEMPLATES } = require('../../lib/templates.js');
const { THEMES, THEME_MAP } = require('../../lib/themes.js');
const ALL_THEME_IDS = THEMES.map((t: { id: string }) => t.id).join(', ');

export function createPremarksMcpServer(auth: AuthenticatedContext, baseOrigin: string): McpServer {
  const server = new McpServer({
    name: 'premarks-mcp',
    version: '2.0.0',
  });

  // 1. list_templates
  server.registerTool(
    'list_templates',
    {
      title: 'List Premarks Templates & Themes',
      description: 'List available Premarks Markdown slide templates and visual style themes.',
      inputSchema: {
        field: z.string().optional().describe('Optional discipline filter (e.g., STEM, Engineering, Business).'),
      },
    },
    async ({ field }) => {
      const filtered = field
        ? TEMPLATES.filter((t: { field: string }) =>
            t.field.toLowerCase().includes(field.toLowerCase()),
          )
        : TEMPLATES;

      await recordUsageEvent({
        userId: auth.userId,
        apiKeyId: auth.apiKeyId,
        action: 'mcp.list_templates',
        units: 1,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                templates: filtered.map(
                  (t: { id: string; title: string; field: string; themeId: string; summary: string; markdown: string }) => ({
                    id: t.id,
                    title: t.title,
                    field: t.field,
                    themeId: t.themeId,
                    slideCount: splitDeckDocumentRaw(t.markdown).rawSlides.length,
                    summary: t.summary,
                  }),
                ),
                themes: THEMES.map((th: { id: string; name: string; tagline: string; isDark: boolean }) => ({
                  id: th.id,
                  name: th.name,
                  tagline: th.tagline,
                  isDark: th.isDark,
                })),
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // 2. create_deck
  server.registerTool(
    'create_deck',
    {
      title: 'Create Presentation Deck',
      description:
        'Create a persistent Premarks deck in PostgreSQL from a template or custom Markdown, returning stable pm-slide-id UUID anchors.',
      inputSchema: {
        title: z.string().min(1).max(140).describe('Presentation title.'),
        themeId: z.string().optional().describe(`Theme ID (${ALL_THEME_IDS}).`),
        templateId: z.string().optional().describe('Optional starter template ID from list_templates.'),
        markdown: z.string().optional().describe('Full Marp Markdown document. If omitted, scaffolds from templateId or blank.'),
      },
    },
    async ({ title, themeId, templateId, markdown }) => {
      const tpl = templateId
        ? TEMPLATES.find((t: { id: string }) => t.id === templateId)
        : null;
      if (templateId && !tpl) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Template "${templateId}" not found. Call list_templates for valid IDs.`,
            },
          ],
        };
      }
      const chosenTheme =
        themeId && THEME_MAP.has(themeId) ? themeId : tpl?.themeId || 'anime';
      const initialMd =
        markdown?.trim() ||
        tpl?.markdown ||
        `---\nmarp: true\ntheme: ${chosenTheme}\nsize: 16:9\npaginate: true\nmath: mathjax\n---\n\n<!-- _class: lead animate-in -->\n\n# ${title}\n\n## Created via Premarks MCP\n`;

      const created = await createDeckForUser({
        userId: auth.userId,
        title,
        themeId: chosenTheme,
        templateId: tpl?.id || null,
        markdown: initialMd,
      });

      const lint = lintDeck(created.markdown);
      const parsed = ensureSlideIds(created.markdown).parsed;

      await recordUsageEvent({
        userId: auth.userId,
        apiKeyId: auth.apiKeyId,
        action: 'mcp.create_deck',
        units: 1,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                deckId: created.id,
                title: created.title,
                themeId: created.themeId,
                slideCount: created.slideCount,
                deckScore: lint.deckScore,
                slides: parsed.slides.map((s) => ({
                  slideId: s.id,
                  position: s.position,
                  title: s.title,
                  layoutClass: s.layoutClass,
                })),
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // 3. read_deck
  server.registerTool(
    'read_deck',
    {
      title: 'Read Presentation Deck',
      description: 'Read a persisted deck with its ordered slide UUIDs, Markdown bodies, and speaker notes.',
      inputSchema: {
        deckId: z.string().min(1).describe('Deck UUID returned by create_deck.'),
      },
    },
    async ({ deckId }) => {
      const found = await getDeckByIdForUser(auth.userId, deckId);
      if (!found) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Deck "${deckId}" not found for authenticated user.` }],
        };
      }

      await recordUsageEvent({
        userId: auth.userId,
        apiKeyId: auth.apiKeyId,
        action: 'mcp.read_deck',
        units: 1,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                deckId: found.deck.id,
                title: found.deck.title,
                themeId: found.deck.themeId,
                slideCount: found.deck.slideCount,
                updatedAt: found.deck.updatedAt,
                slides: found.slides.map((s) => ({
                  slideId: s.id,
                  position: s.position,
                  title: s.title,
                  layoutClass: s.layoutClass,
                  lintScore: s.lintScore,
                  speakerNotes: s.speakerNotes,
                  markdownBody: s.markdownBody,
                })),
                markdown: found.deck.markdown,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // 4. edit_slide
  server.registerTool(
    'edit_slide',
    {
      title: 'Edit Single Slide by UUID',
      description:
        'Targeted ID-based slide edit (update, insert_after, delete, move) without rewriting the entire Markdown deck.',
      inputSchema: {
        deckId: z.string().min(1),
        slideId: z.string().min(1).describe('Immutable slide ID (e.g., s-<uuid>).'),
        action: z.enum(['update', 'insert_after', 'delete', 'move']),
        markdownBody: z.string().optional(),
        speakerNotes: z.string().optional(),
        layoutClass: z.string().optional(),
        targetPosition: z.number().int().min(0).optional(),
      },
    },
    async ({ deckId, slideId, action, markdownBody, speakerNotes, layoutClass, targetPosition }) => {
      const found = await getDeckByIdForUser(auth.userId, deckId);
      if (!found) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Deck "${deckId}" not found.` }],
        };
      }

      let edited;
      try {
        edited = applySlideEditById(found.deck.markdown, slideId, {
          action,
          markdownBody,
          speakerNotes,
          layoutClass,
          targetPosition,
        });
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: (err as Error).message || 'Slide edit failed.' }],
        };
      }

      const updated = await updateDeckForUser({
        userId: auth.userId,
        deckId,
        markdown: edited.markdown,
      });
      const lint = lintDeck(edited.markdown);

      await recordUsageEvent({
        userId: auth.userId,
        apiKeyId: auth.apiKeyId,
        action: 'mcp.edit_slide',
        units: 1,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                deckId,
                updatedSlideId: edited.updatedSlideId,
                slideCount: updated?.slideCount ?? edited.slides.length,
                deckScore: lint.deckScore,
                issues: lint.issues,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // 5. add_chart_from_data
  server.registerTool(
    'add_chart_from_data',
    {
      title: 'Add Structured Chart or Data Slide',
      description: 'Generate a structured chart/table slide from numeric arrays and insert it into a deck.',
      inputSchema: {
        deckId: z.string().min(1),
        slideTitle: z.string().min(1),
        chartType: z.enum(['bar', 'line', 'table', 'flowchart']).default('bar'),
        labels: z.array(z.string()).min(1).max(16),
        values: z.array(z.number()).min(1).max(16),
        seriesLabel: z.string().optional(),
        afterSlideId: z.string().optional(),
      },
    },
    async ({ deckId, slideTitle, chartType, labels, values, seriesLabel, afterSlideId }) => {
      const found = await getDeckByIdForUser(auth.userId, deckId);
      if (!found) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Deck "${deckId}" not found.` }],
        };
      }

      const count = Math.min(labels.length, values.length);
      const safeLabels = labels.slice(0, count);
      const safeValues = values.slice(0, count);
      const maxVal = Math.max(10, ...safeValues.map((v) => Math.ceil(v * 1.15)));

      let blockMd = '';
      if (chartType === 'table') {
        const rows = safeLabels.map((lbl, i) => `| ${lbl} | ${safeValues[i]} |`).join('\n');
        blockMd = `<div class="table-wrap">\n\n| Metric | ${seriesLabel || 'Value'} |\n|---|---|\n${rows}\n\n</div>`;
      } else if (chartType === 'flowchart') {
        const edges = safeLabels
          .map((lbl, i) => `  N${i}["${lbl}: ${safeValues[i]}"]`)
          .concat(safeLabels.slice(0, -1).map((_, i) => `  N${i} --> N${i + 1}`))
          .join('\n');
        blockMd = `\`\`\`mermaid\nflowchart LR\n${edges}\n\`\`\``;
      } else {
        const kind = chartType === 'line' ? 'line' : 'bar';
        blockMd = `\`\`\`mermaid\nxychart-beta\n  title "${slideTitle.replace(/"/g, '')}"\n  x-axis [${safeLabels.map((l) => `"${l.replace(/"/g, '')}"`).join(', ')}]\n  y-axis "${seriesLabel || 'Value'}" 0 --> ${maxVal}\n  ${kind} [${safeValues.join(', ')}]\n\`\`\``;
      }

      const slideBody = `# ${slideTitle}\n\n${blockMd}`;
      const targetAnchorId =
        afterSlideId || found.slides[found.slides.length - 1]?.id;

      let nextMarkdown = found.deck.markdown;
      let insertedSlideId = '';
      if (targetAnchorId) {
        const edited = applySlideEditById(found.deck.markdown, targetAnchorId, {
          action: 'insert_after',
          markdownBody: slideBody,
          layoutClass: 'section',
        });
        nextMarkdown = edited.markdown;
        insertedSlideId = edited.updatedSlideId;
      } else {
        const ensured = ensureSlideIds(`${found.deck.markdown}\n\n---\n\n${slideBody}`);
        nextMarkdown = ensured.markdown;
        insertedSlideId = ensured.parsed.slides[ensured.parsed.slides.length - 1]?.id || '';
      }

      const updated = await updateDeckForUser({
        userId: auth.userId,
        deckId,
        markdown: nextMarkdown,
      });

      await recordUsageEvent({
        userId: auth.userId,
        apiKeyId: auth.apiKeyId,
        action: 'mcp.add_chart_from_data',
        units: 1,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                deckId,
                insertedSlideId,
                slideCount: updated?.slideCount ?? 0,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // 6. lint_deck
  server.registerTool(
    'lint_deck',
    {
      title: 'Lint Presentation Quality & Layout',
      description:
        'Audit slide density, 16:9 vertical overflow risk, WCAG contrast, missing image alt text, heading hierarchy, and slide IDs. Returns actionable fixes for agents.',
      inputSchema: {
        deckId: z.string().optional(),
        markdown: z.string().optional(),
        autoFix: z.boolean().optional().default(false),
      },
    },
    async ({ deckId, markdown, autoFix }) => {
      let targetMd = markdown || '';
      if (deckId) {
        const found = await getDeckByIdForUser(auth.userId, deckId);
        if (!found) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Deck "${deckId}" not found.` }],
          };
        }
        targetMd = found.deck.markdown;
      }
      if (!targetMd.trim()) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'Provide either deckId or markdown to lint.' }],
        };
      }

      const report = lintDeck(targetMd, { autoFix });
      if (deckId && autoFix && report.fixedMarkdown) {
        await updateDeckForUser({
          userId: auth.userId,
          deckId,
          markdown: report.fixedMarkdown,
        });
      }

      await recordUsageEvent({
        userId: auth.userId,
        apiKeyId: auth.apiKeyId,
        action: 'mcp.lint_deck',
        units: 1,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(report, null, 2),
          },
        ],
      };
    },
  );

  // 7. export
  server.registerTool(
    'export',
    {
      title: 'Export Presentation (HTML, PPTX, PDF, Print)',
      description:
        'Compile a Premarks deck in an isolated worker to HTML, PowerPoint (.pptx), PDF, or Print HTML.',
      inputSchema: {
        deckId: z.string().optional(),
        markdown: z.string().optional(),
        themeId: z.string().optional().describe(`Theme ID (${ALL_THEME_IDS}).`),
        title: z.string().optional(),
        format: z.enum(['html', 'pptx', 'print', 'pdf']).default('pptx'),
      },
    },
    async ({ deckId, markdown, themeId, title, format }) => {
      let targetMd = markdown || '';
      let targetTheme = themeId || 'anime';
      let targetTitle = title || 'Presentation';

      if (deckId) {
        const found = await getDeckByIdForUser(auth.userId, deckId);
        if (!found) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Deck "${deckId}" not found.` }],
          };
        }
        targetMd = found.deck.markdown;
        targetTheme = themeId || found.deck.themeId;
        targetTitle = title || found.deck.title;
      }

      if (!targetMd.trim()) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'Provide deckId or markdown to export.' }],
        };
      }

      const validTheme = THEME_MAP.has(targetTheme) ? targetTheme : 'anime';

      await recordUsageEvent({
        userId: auth.userId,
        apiKeyId: auth.apiKeyId,
        action: `mcp.export.${format}`,
        units: 1,
      });

      if (format === 'pptx') {
        const buf = await exportPptxIsolated(targetMd, validTheme, targetTitle);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  format: 'pptx',
                  mimeType:
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                  bytes: buf.length,
                  base64: buf.toString('base64'),
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      if (format === 'pdf') {
        const pdfRes = await exportPdfWithHeadlessFallback(targetMd, validTheme, targetTitle);
        if (pdfRes.mode === 'pdf') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    format: 'pdf',
                    mimeType: pdfRes.contentType,
                    bytes: pdfRes.buffer.length,
                    base64: pdfRes.buffer.toString('base64'),
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  format: 'print-html',
                  mimeType: pdfRes.contentType,
                  note: 'Headless Chromium not installed on server; returning print-ready HTML document.',
                  bytes: pdfRes.buffer.length,
                  html: pdfRes.buffer.toString('utf8'),
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const html =
        format === 'print'
          ? buildPrintDocument(targetMd, validTheme, targetTitle)
          : await exportHtmlIsolated(targetMd, validTheme, targetTitle);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                format,
                mimeType: 'text/html; charset=utf-8',
                bytes: Buffer.byteLength(html, 'utf8'),
                html,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // 8. share
  server.registerTool(
    'share',
    {
      title: 'Publish Shareable Deck URL',
      description: 'Persist a hosted Premarks presentation share in PostgreSQL and return its share and embed URLs.',
      inputSchema: {
        deckId: z.string().optional(),
        title: z.string().optional(),
        markdown: z.string().optional(),
        themeId: z.string().optional(),
        isPublic: z.boolean().optional().default(true),
      },
    },
    async ({ deckId, title, markdown, themeId, isPublic }) => {
      let targetMd = markdown || '';
      let targetTheme = themeId || 'anime';
      let targetTitle = title || 'Shared Presentation';

      if (deckId) {
        const found = await getDeckByIdForUser(auth.userId, deckId);
        if (!found) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Deck "${deckId}" not found.` }],
          };
        }
        targetMd = found.deck.markdown;
        targetTheme = themeId || found.deck.themeId;
        targetTitle = title || found.deck.title;
      }

      if (!targetMd.trim()) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'Provide deckId or markdown to share.' }],
        };
      }

      const record = await createShareRecord({
        title: targetTitle,
        markdown: targetMd,
        themeId: targetTheme,
        userId: auth.userId,
        deckId: deckId || null,
        isPublic,
      });

      await recordUsageEvent({
        userId: auth.userId,
        apiKeyId: auth.apiKeyId,
        action: 'mcp.share',
        units: 1,
      });

      const cleanOrigin = baseOrigin.replace(/\/+$/, '');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                shareId: record.id,
                isPublic: record.isPublic,
                shareUrl: `${cleanOrigin}/?share=${encodeURIComponent(record.id)}`,
                embedUrl: `${cleanOrigin}/?share=${encodeURIComponent(record.id)}&embed=1`,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  return server;
}
