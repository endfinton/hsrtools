import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CharacterIndex, CharacterSummary, Language } from "../src/lib/types/hsr";
import { PATH_MAP } from "../src/lib/types/hsr";

const LANG: Language = (process.env.NANOKA_LANG as Language | undefined) ?? "en";
const SITE_URL = "https://hsr.nanoka.cc/";
const STATIC_BASE_URL = "https://static.nanoka.cc/hsr";

const RARITY_MAP = {
  CombatPowerAvatarRarityType4: 4,
  CombatPowerAvatarRarityType5: 5,
} as const;

const DAMAGE_TYPE_MAP: Record<string, CharacterSummary["element"]> = {
  Physical: "Physical",
  Fire: "Fire",
  Ice: "Ice",
  Thunder: "Lightning",
  Wind: "Wind",
  Quantum: "Quantum",
  Imaginary: "Imaginary",
};

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Nanoka request failed: ${response.status} ${response.statusText} (${url})`);
  }

  return (await response.json()) as T;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Nanoka request failed: ${response.status} ${response.statusText} (${url})`);
  }

  return response.text();
}

async function writeJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function compareVersion(left: string, right: string) {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);

  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);

    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

async function discoverLatestVersion() {
  const html = await fetchText(SITE_URL);
  const versions = new Set<string>();

  for (const match of html.matchAll(/static\.nanoka\.cc\/hsr\/(\d+\.\d+\.\d+)/g)) {
    versions.add(match[1]);
  }

  for (const match of html.matchAll(/\.\/?(_app\/immutable\/[^"']+\.js)/g)) {
    const scriptUrl = new URL(match[1], SITE_URL).toString();
    const script = await fetchText(scriptUrl);

    for (const versionMatch of script.matchAll(/static\.nanoka\.cc\/hsr\/(\d+\.\d+\.\d+)/g)) {
      versions.add(versionMatch[1]);
    }
  }

  const latestVersion = [...versions].sort(compareVersion).at(-1);

  if (!latestVersion) {
    throw new Error("Could not discover latest Nanoka data version from hsr.nanoka.cc");
  }

  return latestVersion;
}

async function mapConcurrent<T>(items: string[], concurrency: number, mapper: (item: string) => Promise<T>) {
  const results: T[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));

  return results;
}

function toCharacterSummary(id: string, character: CharacterIndex[string]): CharacterSummary {
  return {
    id,
    name: character[LANG],
    rarity: RARITY_MAP[character.rank],
    path: PATH_MAP[character.baseType] ?? "Unknown",
    element: DAMAGE_TYPE_MAP[character.damageType] ?? "Physical",
    icon: `https://static.nanoka.cc/assets/hsr/gridfight/icon/${id}.webp`,
    release: character.release,
  };
}

async function main() {
  const version = await discoverLatestVersion();
  const baseUrl = `${STATIC_BASE_URL}/${version}`;

  const [characterIndex, lightconeIndex, relicsetIndex] = await Promise.all([
    fetchJson<CharacterIndex>(`${baseUrl}/character.json`),
    fetchJson<Record<string, unknown>>(`${baseUrl}/lightcone.json`),
    fetchJson<Record<string, unknown>>(`${baseUrl}/relicset.json`),
  ]);

  const characterIds = Object.keys(characterIndex);
  const lightconeIds = Object.keys(lightconeIndex);
  const characters = Object.entries(characterIndex).map(([id, character]) => toCharacterSummary(id, character));

  await Promise.all([
    writeJson(join(rootDir, "data", "characters.json"), characters),
    writeJson(join(rootDir, "data", "character-index.json"), characterIndex),
    writeJson(join(rootDir, "data", "lightcones.json"), lightconeIndex),
    writeJson(join(rootDir, "data", "relicsets.json"), relicsetIndex),
  ]);

  await mapConcurrent(characterIds, 8, async (id) => {
    const detail = await fetchJson<unknown>(`${baseUrl}/${LANG}/character/${id}.json`);
    await writeJson(join(rootDir, "data", "characters", `${id}.json`), detail);
  });

  await mapConcurrent(lightconeIds, 8, async (id) => {
    const detail = await fetchJson<unknown>(`${baseUrl}/${LANG}/lightcone/${id}.json`);
    await writeJson(join(rootDir, "data", "lightcones", `${id}.json`), detail);
  });

  await writeJson(join(rootDir, "data", "meta.json"), {
    source: "nanoka",
    version,
    lang: LANG,
    characterCount: characterIds.length,
    lightconeCount: lightconeIds.length,
    relicsetCount: Object.keys(relicsetIndex).length,
    syncedAt: new Date().toISOString(),
  });

  console.log(
    `Synced Nanoka ${version}: ${characterIds.length} characters, ${lightconeIds.length} light cones, ${Object.keys(relicsetIndex).length} relic sets`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
