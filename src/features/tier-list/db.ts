import { eq } from "drizzle-orm";
import { db } from "../../db";
import { tierLists } from "../../db/schema";
import { defaultTierListId, defaultTierListSnapshot, normalizeRows, type TierListSnapshot } from "./tier-data";

export async function getTierListSnapshot(): Promise<TierListSnapshot> {
  const [tierList] = await db.select().from(tierLists).where(eq(tierLists.id, defaultTierListId)).limit(1);

  if (!tierList) {
    return defaultTierListSnapshot();
  }

  return {
    patch: tierList.patch,
    rows: normalizeRows(tierList.rows),
  };
}

export async function saveTierListSnapshot(snapshot: TierListSnapshot) {
  const now = new Date();
  const normalizedSnapshot = {
    patch: snapshot.patch.trim() || "Actual",
    rows: normalizeRows(snapshot.rows),
  };

  await db
    .insert(tierLists)
    .values({
      id: defaultTierListId,
      patch: normalizedSnapshot.patch,
      rows: normalizedSnapshot.rows,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: tierLists.id,
      set: {
        patch: normalizedSnapshot.patch,
        rows: normalizedSnapshot.rows,
        updatedAt: now,
      },
    });

  return normalizedSnapshot;
}
