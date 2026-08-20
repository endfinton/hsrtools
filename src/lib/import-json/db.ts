import { eq } from "drizzle-orm";
import { db } from "../../db";
import { userPreferences, userRoster, users } from "../../db/schema";
import type { ImportPayload, ImportRosterCharacter } from "./schema";

export interface ImportRosterDiff {
  added: ImportRosterCharacter[];
  changed: Array<{
    before: ImportRosterCharacter;
    after: ImportRosterCharacter;
  }>;
  unchanged: ImportRosterCharacter[];
}

export interface ImportPreview {
  planner?: {
    currentTickets?: number;
  };
  roster?: ImportRosterDiff;
  corrections?: {
    sections: string[];
    replacesExisting: boolean;
  };
}

function normalizeRosterRow(row: typeof userRoster.$inferSelect): ImportRosterCharacter {
  return {
    characterId: row.characterId,
    eidolon: row.eidolon,
    ...(row.level === null ? {} : { level: row.level }),
    ...(row.lightConeId === null ? {} : { lightConeId: row.lightConeId }),
  };
}

function sameRosterCharacter(left: ImportRosterCharacter, right: ImportRosterCharacter) {
  return (
    left.characterId === right.characterId &&
    left.eidolon === right.eidolon &&
    left.level === right.level &&
    left.lightConeId === right.lightConeId
  );
}

async function ensureUserExists(userId: string) {
  await db.insert(users).values({ id: userId }).onConflictDoNothing();
}

export async function getImportPreview(userId: string, payload: ImportPayload): Promise<ImportPreview> {
  const preview: ImportPreview = {};

  if (payload.planner) {
    preview.planner = payload.planner;
  }

  if (payload.roster) {
    const rows = await db.select().from(userRoster).where(eq(userRoster.userId, userId));
    const currentById = new Map(rows.map((row) => [row.characterId, normalizeRosterRow(row)]));
    const added: ImportRosterCharacter[] = [];
    const changed: ImportRosterDiff["changed"] = [];
    const unchanged: ImportRosterCharacter[] = [];

    for (const after of payload.roster.characters) {
      const before = currentById.get(after.characterId);

      if (!before) {
        added.push(after);
      } else if (sameRosterCharacter(before, after)) {
        unchanged.push(after);
      } else {
        changed.push({ before, after });
      }
    }

    preview.roster = { added, changed, unchanged };
  }

  if (payload.corrections) {
    const [preferences] = await db
      .select({ importedCorrections: userPreferences.importedCorrections })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    preview.corrections = {
      sections: Object.keys(payload.corrections),
      replacesExisting: Boolean(preferences?.importedCorrections),
    };
  }

  return preview;
}

export async function applyImportPayload(userId: string, payload: ImportPayload) {
  const now = new Date();

  await ensureUserExists(userId);

  if (payload.roster) {
    for (const character of payload.roster.characters) {
      await db
        .insert(userRoster)
        .values({
          userId,
          characterId: character.characterId,
          eidolon: character.eidolon,
          level: character.level ?? null,
          lightConeId: character.lightConeId ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [userRoster.userId, userRoster.characterId],
          set: {
            eidolon: character.eidolon,
            level: character.level ?? null,
            lightConeId: character.lightConeId ?? null,
            updatedAt: now,
          },
        });
    }
  }

  if (payload.planner || payload.corrections) {
    await db
      .insert(userPreferences)
      .values({
        userId,
        ...(payload.planner ? { plannerState: payload.planner } : {}),
        ...(payload.corrections ? { importedCorrections: payload.corrections } : {}),
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...(payload.planner ? { plannerState: payload.planner } : {}),
          ...(payload.corrections ? { importedCorrections: payload.corrections } : {}),
          updatedAt: now,
        },
      });
  }
}

export async function exportImportPayload(userId: string): Promise<ImportPayload> {
  const rosterRows = await db.select().from(userRoster).where(eq(userRoster.userId, userId));
  const [preferences] = await db
    .select({ plannerState: userPreferences.plannerState, importedCorrections: userPreferences.importedCorrections })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  const planner = preferences?.plannerState as ImportPayload["planner"] | null | undefined;
  const corrections = preferences?.importedCorrections as ImportPayload["corrections"] | null | undefined;

  return {
    version: 1,
    ...(planner ? { planner } : {}),
    roster: { characters: rosterRows.map(normalizeRosterRow) },
    ...(corrections ? { corrections } : {}),
  };
}
