import crypto from 'node:crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from './index.ts';
import {
  apiKeys,
  decks,
  deckVersions,
  shares,
  slides,
  taskRuns,
  usageEvents,
  users,
} from './schema.ts';
import { ensureSlideIds } from '../server/slideIds.ts';
import { lintDeck } from '../server/lintDeck.ts';

export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export async function createApiKeyForUser(
  userId: number,
  name: string,
  scopes = 'decks:read,decks:write,mcp,ai',
  rateLimitPerMin = 60,
) {
  try {
    const rawSecret = `pm_live_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = hashApiKey(rawSecret);
    const keyPrefix = rawSecret.slice(0, 14);
    const id = crypto.randomUUID();

    const [created] = await db
      .insert(apiKeys)
      .values({
        id,
        userId,
        name: name.trim().slice(0, 80) || 'API Key',
        keyPrefix,
        keyHash,
        scopes,
        rateLimitPerMin,
      })
      .returning();

    return {
      id: created.id,
      name: created.name,
      keyPrefix: created.keyPrefix,
      scopes: created.scopes,
      rateLimitPerMin: created.rateLimitPerMin,
      createdAt: created.createdAt,
      rawKey: rawSecret,
    };
  } catch (error) {
    console.error('Failed to create API key:', error);
    throw new Error('Could not create API key.', { cause: error });
  }
}

export async function listApiKeysForUser(userId: number) {
  try {
    return await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        scopes: apiKeys.scopes,
        rateLimitPerMin: apiKeys.rateLimitPerMin,
        lastUsedAt: apiKeys.lastUsedAt,
        revokedAt: apiKeys.revokedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt));
  } catch (error) {
    console.error('Failed to list API keys:', error);
    throw new Error('Could not load API keys.', { cause: error });
  }
}

export async function revokeApiKeyForUser(userId: number, keyId: string) {
  try {
    const [updated] = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
      .returning({ id: apiKeys.id });
    return Boolean(updated);
  } catch (error) {
    console.error('Failed to revoke API key:', error);
    throw new Error('Could not revoke API key.', { cause: error });
  }
}

export async function findActiveApiKeyWithUser(rawKey: string) {
  try {
    const keyHash = hashApiKey(rawKey);
    const rows = await db
      .select({
        apiKey: apiKeys,
        user: users,
      })
      .from(apiKeys)
      .innerJoin(users, eq(apiKeys.userId, users.id))
      .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
      .limit(1);

    if (!rows[0]) return null;

    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, rows[0].apiKey.id))
      .catch(() => {});

    return rows[0];
  } catch (error) {
    console.error('API key lookup failed:', error);
    throw new Error('Authentication verification failed.', { cause: error });
  }
}

async function syncDeckSlides(deckId: string, markdown: string) {
  const { markdown: normalizedMd, parsed } = ensureSlideIds(markdown);
  const lint = lintDeck(normalizedMd);

  await db.delete(slides).where(eq(slides.deckId, deckId));
  if (parsed.slides.length > 0) {
    await db.insert(slides).values(
      parsed.slides.map((s) => ({
        id: s.id,
        deckId,
        position: s.position,
        layoutClass: s.layoutClass,
        title: s.title,
        markdownBody: s.body,
        speakerNotes: s.speakerNotes,
        lintScore: lint.perSlideScores[s.id] ?? 100,
      })),
    );
  }

  return { normalizedMd, slideCount: parsed.slides.length, lint };
}

export async function listDecksForUser(userId: number) {
  try {
    return await db
      .select()
      .from(decks)
      .where(eq(decks.userId, userId))
      .orderBy(desc(decks.updatedAt));
  } catch (error) {
    console.error('Failed to list decks:', error);
    throw new Error('Could not load presentations.', { cause: error });
  }
}

export async function getDeckByIdForUser(userId: number, deckId: string) {
  try {
    const [deck] = await db
      .select()
      .from(decks)
      .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
      .limit(1);
    if (!deck) return null;

    const slideRows = await db
      .select()
      .from(slides)
      .where(eq(slides.deckId, deck.id))
      .orderBy(slides.position);

    return { deck, slides: slideRows };
  } catch (error) {
    console.error('Failed to read deck:', error);
    throw new Error('Could not load presentation.', { cause: error });
  }
}

export async function createDeckForUser(params: {
  userId: number;
  title: string;
  themeId: string;
  markdown: string;
  templateId?: string | null;
}) {
  try {
    const deckId = crypto.randomUUID();
    const { markdown: normalizedMd, parsed } = ensureSlideIds(params.markdown);

    const [created] = await db
      .insert(decks)
      .values({
        id: deckId,
        userId: params.userId,
        title: params.title.trim().slice(0, 140) || 'Untitled Presentation',
        themeId: params.themeId || parsed.themeId || 'anime',
        templateId: params.templateId || null,
        markdown: normalizedMd,
        slideCount: parsed.slides.length,
      })
      .returning();

    await syncDeckSlides(deckId, normalizedMd);
    return created;
  } catch (error) {
    console.error('Failed to create deck:', error);
    throw new Error('Could not create presentation.', { cause: error });
  }
}

export async function updateDeckForUser(params: {
  userId: number;
  deckId: string;
  title?: string;
  themeId?: string;
  markdown?: string;
}) {
  try {
    const existing = await getDeckByIdForUser(params.userId, params.deckId);
    if (!existing) return null;

    const nextMd = params.markdown ?? existing.deck.markdown;
    const { normalizedMd, slideCount } = await syncDeckSlides(params.deckId, nextMd);

    const [updated] = await db
      .update(decks)
      .set({
        title: params.title !== undefined ? params.title.trim().slice(0, 140) : existing.deck.title,
        themeId: params.themeId ?? existing.deck.themeId,
        markdown: normalizedMd,
        slideCount,
        updatedAt: new Date(),
      })
      .where(and(eq(decks.id, params.deckId), eq(decks.userId, params.userId)))
      .returning();

    return updated;
  } catch (error) {
    console.error('Failed to update deck:', error);
    throw new Error('Could not save presentation.', { cause: error });
  }
}

export async function deleteDeckForUser(userId: number, deckId: string) {
  try {
    const [deleted] = await db
      .delete(decks)
      .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
      .returning({ id: decks.id });
    return Boolean(deleted);
  } catch (error) {
    console.error('Failed to delete deck:', error);
    throw new Error('Could not delete presentation.', { cause: error });
  }
}

export async function createDeckVersionForUser(params: {
  userId: number;
  deckId: string;
  label: string;
}) {
  try {
    const found = await getDeckByIdForUser(params.userId, params.deckId);
    if (!found) return null;

    const [version] = await db
      .insert(deckVersions)
      .values({
        id: crypto.randomUUID(),
        deckId: found.deck.id,
        label: params.label.trim().slice(0, 80) || 'Snapshot',
        markdown: found.deck.markdown,
        themeId: found.deck.themeId,
        slideCount: found.deck.slideCount,
      })
      .returning();

    return version;
  } catch (error) {
    console.error('Failed to create deck version:', error);
    throw new Error('Could not save deck snapshot.', { cause: error });
  }
}

export async function listDeckVersionsForUser(userId: number, deckId: string) {
  try {
    const found = await getDeckByIdForUser(userId, deckId);
    if (!found) return null;

    return await db
      .select()
      .from(deckVersions)
      .where(eq(deckVersions.deckId, deckId))
      .orderBy(desc(deckVersions.createdAt));
  } catch (error) {
    console.error('Failed to list deck versions:', error);
    throw new Error('Could not load deck snapshots.', { cause: error });
  }
}

export async function createShareRecord(params: {
  title: string;
  markdown: string;
  themeId: string;
  userId?: number | null;
  deckId?: string | null;
  isPublic?: boolean;
}) {
  try {
    const id = crypto.randomBytes(6).toString('hex');
    const [created] = await db
      .insert(shares)
      .values({
        id,
        deckId: params.deckId || null,
        userId: params.userId || null,
        title: params.title.trim().slice(0, 140) || 'Shared Presentation',
        themeId: params.themeId || 'anime',
        markdown: params.markdown,
        isPublic: params.isPublic ?? true,
        watermark: false,
      })
      .returning();

    return created;
  } catch (error) {
    console.error('Failed to create share:', error);
    throw new Error('Could not create shareable link.', { cause: error });
  }
}

export async function getShareRecordById(id: string) {
  try {
    const [row] = await db.select().from(shares).where(eq(shares.id, id)).limit(1);
    return row || null;
  } catch (error) {
    console.error('Failed to read share:', error);
    throw new Error('Could not load shared presentation.', { cause: error });
  }
}

export async function recordUsageEvent(params: {
  userId: number;
  apiKeyId?: string | null;
  action: string;
  model?: string | null;
  units?: number;
}) {
  try {
    await db.insert(usageEvents).values({
      id: crypto.randomUUID(),
      userId: params.userId,
      apiKeyId: params.apiKeyId || null,
      action: params.action,
      model: params.model || null,
      units: params.units ?? 1,
    });
  } catch (error) {
    console.error('Usage metering log failed:', error);
  }
}

export async function getUsageSummaryForUser(userId: number) {
  try {
    const rows = await db
      .select()
      .from(usageEvents)
      .where(eq(usageEvents.userId, userId))
      .orderBy(desc(usageEvents.createdAt))
      .limit(100);

    const byAction: Record<string, number> = {};
    for (const row of rows) {
      byAction[row.action] = (byAction[row.action] || 0) + row.units;
    }

    return {
      totalEvents: rows.length,
      byAction,
      recent: rows.slice(0, 15),
    };
  } catch (error) {
    console.error('Failed to read usage summary:', error);
    throw new Error('Could not load usage metrics.', { cause: error });
  }
}

export async function logTaskRun(
  taskUuid: string,
  phase: string,
  status: string,
  details = '',
) {
  try {
    await db.insert(taskRuns).values({
      id: crypto.randomUUID(),
      taskUuid,
      phase,
      status,
      details,
    });
  } catch (error) {
    console.error('Task run log error:', error);
  }
}
