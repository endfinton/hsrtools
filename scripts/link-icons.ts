import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CharacterSummary } from "../src/lib/types/hsr";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(rootDir, "data", "Icons");
const publicDir = join(rootDir, "public", "icons");
const charactersPath = join(rootDir, "data", "characters.json");
const manifestPath = join(rootDir, "data", "icon-assets.json");
const cdnBaseUrl = process.env.HSR_CDN_BASE_URL ?? "https://cdn.luislluy.ovh";

const CHARACTER_ICON_ALIASES: Record<string, string> = {
  "1001": "march-7th",
  "1112": "topaz",
  "1224": "march-7th-swordmaster",
  "1413": "march-7th-evernight",
  "1213": "imbibitor-lunae",
  "1310": "firefly",
  "1225": "tingyun-fugue",
  "1507": "blade-mortenax",
  "1506": "silver-wolf-lv-999",
  "1414": "dan-heng-permansor-terrae",
  "1501": "sparxie",
  "1321": "the-dahlia",
  "1512": "robin",
  "1513": "aventurine",
  "8001": "trailblazer-destruction",
  "8002": "trailblazer-destruction",
  "8003": "trailblazer-preservation",
  "8004": "trailblazer-preservation",
  "8005": "trailblazer-harmony",
  "8006": "trailblazer-harmony",
  "8007": "trailblazer-remembrance",
  "8008": "trailblazer-remembrance",
  "8009": "trailblazer-elation",
  "8010": "trailblazer-elation",
};

const PATH_ICON_KEYS: Record<CharacterSummary["path"], string | undefined> = {
  Abundance: "path_abundance",
  Destruction: "path_destruction",
  Elation: "path_elation",
  Erudition: "path_erudition",
  Harmony: "path_harmony",
  Nihility: "path_nihility",
  Preservation: "path_preservation",
  Remembrance: "path_remem",
  "The Hunt": "path_hunt",
  Unknown: undefined,
};

const ELEMENT_ICON_KEYS: Record<CharacterSummary["element"], string> = {
  Fire: "ele_fire",
  Ice: "ele_ice",
  Imaginary: "ele_imaginary",
  Lightning: "ele_lightning",
  Physical: "ele_physical",
  Quantum: "ele_quantum",
  Wind: "ele_wind",
};

interface IconAsset {
  key: string;
  filename: string;
  localUrl: string;
  cdnUrl: string;
  cloudflareUrl?: string;
}

function slug(value: string) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/\{[^}]+}/g, "")
    .replace(/•/g, " ")
    .replace(/&/g, " ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function writeJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const files = (await readdir(sourceDir)).filter((file) => file.endsWith(".webp"));
  const existingManifest = await readJson<Record<string, IconAsset>>(manifestPath).catch(
    (): Record<string, IconAsset> => ({}),
  );
  const manifest: Record<string, IconAsset> = {};

  await mkdir(publicDir, { recursive: true });

  for (const file of files) {
    const key = basename(file, extname(file));
    const localUrl = `/icons/${file}`;

    await copyFile(join(sourceDir, file), join(publicDir, file));

    manifest[key] = {
      key,
      filename: file,
      localUrl,
      cdnUrl: `${cdnBaseUrl}${localUrl}`,
      cloudflareUrl: existingManifest[key]?.cloudflareUrl,
    };
  }

  const characters = await readJson<CharacterSummary[]>(charactersPath);
  const linkedCharacters = characters.map((character) => {
    const characterKey = `${CHARACTER_ICON_ALIASES[character.id] ?? slug(character.name)}_icon`;
    const pathKey = PATH_ICON_KEYS[character.path];
    const elementKey = ELEMENT_ICON_KEYS[character.element];
    const characterAsset = manifest[characterKey];
    const pathAsset = pathKey ? manifest[pathKey] : undefined;
    const elementAsset = manifest[elementKey];

    return {
      ...character,
      icon: characterAsset?.cloudflareUrl ?? characterAsset?.cdnUrl ?? character.icon,
      pathIcon: pathAsset?.cloudflareUrl ?? pathAsset?.cdnUrl,
      elementIcon: elementAsset?.cloudflareUrl ?? elementAsset?.cdnUrl,
    };
  });

  const missingCharacterIcons = linkedCharacters
    .filter((character) => character.icon.startsWith("https://static.nanoka.cc/"))
    .map((character) => `${character.id}:${character.name}`);

  await writeJson(manifestPath, manifest);
  await writeJson(charactersPath, linkedCharacters);

  console.log(`Linked ${linkedCharacters.length} characters with ${files.length} icon assets via ${cdnBaseUrl}.`);

  if (missingCharacterIcons.length > 0) {
    console.warn(`Missing local character icons: ${missingCharacterIcons.join(", ")}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
