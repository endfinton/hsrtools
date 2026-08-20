import type { CharacterPath, CharacterRarity, CharacterSummary, DamageType } from "../types/hsr";

const characterPaths = new Set<CharacterPath>([
  "Preservation",
  "The Hunt",
  "Erudition",
  "Nihility",
  "Destruction",
  "Abundance",
  "Harmony",
  "Remembrance",
  "Elation",
  "Unknown",
]);
const damageTypes = new Set<DamageType>(["Physical", "Fire", "Ice", "Lightning", "Wind", "Quantum", "Imaginary"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalRarity(value: unknown): CharacterRarity | undefined {
  return value === 4 || value === 5 ? value : undefined;
}

function optionalPath(value: unknown): CharacterPath | undefined {
  return typeof value === "string" && characterPaths.has(value as CharacterPath) ? (value as CharacterPath) : undefined;
}

function optionalDamageType(value: unknown): DamageType | undefined {
  return typeof value === "string" && damageTypes.has(value as DamageType) ? (value as DamageType) : undefined;
}

function optionalRelease(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

export function applyCharacterCorrections(
  characters: CharacterSummary[],
  corrections: unknown,
): { characters: CharacterSummary[]; overriddenCharacterIds: string[] } {
  if (!isObject(corrections)) {
    return { characters, overriddenCharacterIds: [] };
  }

  const overriddenCharacterIds: string[] = [];
  const correctedCharacters = characters.map((character) => {
    const correction = corrections[character.id];
    if (!isObject(correction)) {
      return character;
    }

    const correctedCharacter: CharacterSummary = {
      ...character,
      name: optionalText(correction.name) ?? character.name,
      rarity: optionalRarity(correction.rarity) ?? character.rarity,
      path: optionalPath(correction.path) ?? character.path,
      element: optionalDamageType(correction.element) ?? character.element,
      icon: optionalText(correction.icon) ?? character.icon,
      pathIcon: optionalText(correction.pathIcon) ?? character.pathIcon,
      elementIcon: optionalText(correction.elementIcon) ?? character.elementIcon,
      release: optionalRelease(correction.release) ?? character.release,
    };

    overriddenCharacterIds.push(character.id);
    return correctedCharacter;
  });

  return { characters: correctedCharacters, overriddenCharacterIds };
}
