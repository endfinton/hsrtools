import { GachaPlanner } from "../../src/features/gacha-planner/gacha-planner";
import charactersData from "../../data/characters.json";
import { applyCharacterCorrections } from "../../src/lib/import-json/corrections";
import type { ImportPayload } from "../../src/lib/import-json/schema";
import type { CharacterSummary } from "../../src/lib/types/hsr";

export default async function PlannerPage() {
  let corrections: ImportPayload["corrections"] | undefined;

  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    const [{ auth }, { eq }, { db }, { userPreferences }] = await Promise.all([
      import("../../auth"),
      import("drizzle-orm"),
      import("../../src/db"),
      import("../../src/db/schema"),
    ]);
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      const corrected = applyCharacterCorrections(charactersData as CharacterSummary[], undefined);

      return <GachaPlanner characters={corrected.characters} overriddenCharacterIds={corrected.overriddenCharacterIds} />;
    }

    const [preferences] = await db
      .select({ importedCorrections: userPreferences.importedCorrections })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    corrections = preferences?.importedCorrections as ImportPayload["corrections"] | undefined;
  }

  const corrected = applyCharacterCorrections(charactersData as CharacterSummary[], corrections?.characters);

  return <GachaPlanner characters={corrected.characters} overriddenCharacterIds={corrected.overriddenCharacterIds} />;
}
