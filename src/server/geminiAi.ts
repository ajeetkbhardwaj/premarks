import { GoogleGenAI } from '@google/genai';
import { lintDeck } from './lintDeck.ts';
import { ensureSlideIds } from './slideIds.ts';

const GEMINI_MODEL = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Server-side GEMINI_API_KEY is not configured in the environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function stripOuterCodeFences(raw: string): string {
  let cleaned = raw.trim();
  const fenceStart = /^```(?:markdown|md)?\s*\n/i;
  if (fenceStart.test(cleaned)) {
    cleaned = cleaned.replace(fenceStart, '');
    cleaned = cleaned.replace(/\n```\s*$/, '');
  }
  return cleaned.trim();
}

export interface AiDeckGenerateParams {
  topic: string;
  notes?: string;
  field: string;
  themeId: string;
  slideCount: number;
}

export async function generatePresentationWithGemini(params: AiDeckGenerateParams) {
  const ai = getGeminiClient();
  const prompt = `You are an expert presentation architect writing valid Marp Markdown for Premarks Studio.
Return ONLY valid Marp Markdown (no commentary, no outer markdown code fences).

Requirements:
- Begin with YAML frontmatter:
---
marp: true
theme: ${params.themeId}
size: 16:9
paginate: true
math: mathjax
transition: fade 0.5s
---
- Target discipline: ${params.field}
- Target slide count: ${params.slideCount} slides separated by ---
- Keep slides concise (<= 110 words per slide) so there is zero vertical overflow.
- Slide 1 must use <!-- _class: lead animate-in --> with <span class="eyebrow">...</span>, # Title, and ## Subtitle.
- Use Premarks layout classes across body slides:
  - <!-- _class: section animate-in --> with <div class="row"> or <div class="row-3"> and <div class="card" data-fragment="1">
  - <!-- _class: split animate-in --> with two <div class="stack"> columns
  - <div class="formula-box"> with $$ ... $$ LaTeX equations when relevant to ${params.field}
  - <div class="table-wrap"> with structured comparison tables
  - Optional \`\`\`mermaid flowchart block when illustrating architecture or workflows
  - Final <!-- _class: closing animate-in --> summary slide
- Add concise presenter speaker notes inside HTML comments <!-- Speaker note text --> on key slides.

Topic: ${params.topic}
${params.notes ? `Additional source notes:\n${params.notes}` : ''}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });

  const rawText = stripOuterCodeFences(response.text || '');
  if (!rawText) {
    throw new Error('Gemini returned an empty presentation draft.');
  }

  const withFrontmatter = rawText.startsWith('---')
    ? rawText
    : `---\nmarp: true\ntheme: ${params.themeId}\nsize: 16:9\npaginate: true\nmath: mathjax\ntransition: fade 0.5s\n---\n\n${rawText}`;

  const ensured = ensureSlideIds(withFrontmatter);
  const lint = lintDeck(ensured.markdown, { autoFix: true });

  return {
    markdown: lint.fixedMarkdown || ensured.markdown,
    model: GEMINI_MODEL,
    eval: {
      deckScore: lint.deckScore,
      slideCount: lint.slideCount,
      passed: lint.passed,
      issueCount: lint.issues.length,
    },
  };
}

export async function polishSlideWithGemini(slideBody: string, instruction: string) {
  const ai = getGeminiClient();
  const prompt = `Improve this single Marp slide while preserving valid Marp Markdown and Premarks layout helpers (.row, .card, .formula-box, .table-wrap, data-fragment).
Keep slide copy under 115 words so it fits cleanly on 16:9 without overflow.
Return ONLY the updated single slide Markdown (no frontmatter, no --- separators, no outer code fences).

Goal: ${instruction}

Current slide:
${slideBody}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });

  const cleaned = stripOuterCodeFences(response.text || '');
  if (!cleaned) {
    throw new Error('Gemini returned an empty slide revision.');
  }
  return { markdownBody: cleaned, model: GEMINI_MODEL };
}

export async function generateSpeakerNotesWithGemini(slideBody: string) {
  const ai = getGeminiClient();
  const prompt = `Write concise, natural presenter speaker notes (2-4 sentences) for this slide. Return ONLY plain text for the speaker notes, with no HTML comments or Markdown fences.

Slide content:
${slideBody}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });

  const cleaned = stripOuterCodeFences(response.text || '').replace(/^<!--|-->$/g, '').trim();
  if (!cleaned) {
    throw new Error('Gemini returned empty speaker notes.');
  }
  return { notes: cleaned, model: GEMINI_MODEL };
}
