export const tierRanks = ["SS", "S", "A", "B", "C"] as const;
export const tierRoles = ["DPS", "SUB-DPS", "SUPPORT", "SUSTAIN"] as const;

export type TierRank = (typeof tierRanks)[number];
export type TierRole = (typeof tierRoles)[number];
export type TierRows = Record<TierRank, Record<TierRole, string[]>>;

export interface TierListSnapshot {
  patch: string;
  rows: TierRows;
}

export const defaultTierListId = "main";

export const emptyRoleColumns = (): Record<TierRole, string[]> => ({
  DPS: [],
  "SUB-DPS": [],
  SUPPORT: [],
  SUSTAIN: [],
});

export const emptyRows = (): TierRows => ({
  SS: emptyRoleColumns(),
  S: emptyRoleColumns(),
  A: emptyRoleColumns(),
  B: emptyRoleColumns(),
  C: emptyRoleColumns(),
});

export function normalizeRows(rows: unknown): TierRows {
  const nextRows = emptyRows();

  if (!rows || typeof rows !== "object") {
    return nextRows;
  }

  for (const tier of tierRanks) {
    const row = (rows as Partial<Record<TierRank, unknown>>)[tier];

    if (Array.isArray(row)) {
      nextRows[tier].DPS = row.filter((characterId): characterId is string => typeof characterId === "string");
      continue;
    }

    if (!row || typeof row !== "object") {
      continue;
    }

    for (const role of tierRoles) {
      const characterIds = (row as Partial<Record<TierRole, unknown>>)[role];

      if (Array.isArray(characterIds)) {
        nextRows[tier][role] = characterIds.filter((characterId): characterId is string => typeof characterId === "string");
      }
    }
  }

  return nextRows;
}

export function removeCharacter(rows: TierRows, characterId: string) {
  return tierRanks.reduce<TierRows>((nextRows, tier) => {
    nextRows[tier] = tierRoles.reduce<Record<TierRole, string[]>>((nextRoles, role) => {
      nextRoles[role] = rows[tier][role].filter((currentId) => currentId !== characterId);
      return nextRoles;
    }, emptyRoleColumns());

    return nextRows;
  }, emptyRows());
}

export const defaultTierListSnapshot = (): TierListSnapshot => ({
  patch: "Actual",
  rows: emptyRows(),
});
