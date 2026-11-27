export interface AiDeckRequest {
  topic: string;
  notes?: string;
  field: string;
  themeId: string;
  slideCount: number;
}

export interface AiDeckResponse {
  markdown: string;
  model: string;
  eval: {
    deckScore: number;
    slideCount: number;
    passed: boolean;
    issueCount: number;
  };
}

type AuthFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function generatePresentationDeck(
  req: AiDeckRequest,
  authFetch: AuthFetch,
): Promise<AiDeckResponse> {
  const res = await authFetch('/api/ai/generate-deck', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `AI request failed (${res.status}). Sign in to generate decks.`);
  }
  return data as AiDeckResponse;
}

export async function polishSlideMarkdown(
  slideBody: string,
  instruction: string,
  authFetch: AuthFetch,
): Promise<string> {
  const res = await authFetch('/api/ai/polish-slide', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slideBody, instruction }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `AI polish failed (${res.status}). Sign in to use AI editing.`);
  }
  return String(data.markdownBody || slideBody);
}

export async function generateSpeakerNotes(
  slideBody: string,
  authFetch: AuthFetch,
): Promise<string> {
  const res = await authFetch('/api/ai/speaker-notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slideBody }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `AI notes failed (${res.status}). Sign in to generate notes.`);
  }
  return String(data.notes || '');
}
