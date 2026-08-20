import type { ImportPayload, ImportRosterCharacter } from "./schema";

interface ParseResult {
  payload?: ImportPayload;
  errors: string[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringField(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function integerField(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : undefined;
}

function materialCount(materials: unknown, id: string) {
  if (!Array.isArray(materials)) {
    return 0;
  }

  const material = materials.find((entry) => isObject(entry) && entry.id === id);
  return isObject(material) && typeof material.count === "number" && Number.isFinite(material.count) ? Math.max(0, Math.floor(material.count)) : 0;
}

function equippedLightCones(lightCones: unknown) {
  const lightConeByCharacterId = new Map<string, string>();

  if (!Array.isArray(lightCones)) {
    return lightConeByCharacterId;
  }

  for (const lightCone of lightCones) {
    if (!isObject(lightCone)) {
      continue;
    }

    const characterId = stringField(lightCone.location);
    const lightConeId = stringField(lightCone.id);

    if (characterId && lightConeId) {
      lightConeByCharacterId.set(characterId, lightConeId);
    }
  }

  return lightConeByCharacterId;
}

export function parseReliquaryArchiverPayload(value: unknown): ParseResult {
  if (!isObject(value) || value.source !== "reliquary_archiver") {
    return { errors: ["El JSON no es un export de reliquary_archiver."] };
  }

  if (!Array.isArray(value.characters)) {
    return { errors: ["El export de reliquary_archiver no contiene characters[]."] };
  }

  const errors: string[] = [];
  const lightConeByCharacterId = equippedLightCones(value.light_cones);
  const characters: ImportRosterCharacter[] = [];

  value.characters.forEach((character, index) => {
    if (!isObject(character)) {
      errors.push(`characters[${index}] debe ser un objeto.`);
      return;
    }

    const characterId = stringField(character.id);
    const eidolon = integerField(character.eidolon, 0, 6);
    const level = character.level === undefined ? undefined : integerField(character.level, 1, 80);

    if (!characterId) {
      errors.push(`characters[${index}].id es obligatorio.`);
    }

    if (eidolon === undefined) {
      errors.push(`characters[${index}].eidolon debe ser un entero entre 0 y 6.`);
    }

    if (character.level !== undefined && level === undefined) {
      errors.push(`characters[${index}].level debe ser un entero entre 1 y 80.`);
    }

    if (!characterId || eidolon === undefined || (character.level !== undefined && level === undefined)) {
      return;
    }

    const lightConeId = lightConeByCharacterId.get(characterId);
    characters.push({
      characterId,
      eidolon,
      ...(level === undefined ? {} : { level }),
      ...(lightConeId === undefined ? {} : { lightConeId }),
    });
  });

  const specialPasses = materialCount(value.materials, "102");
  const stellarJade = isObject(value.gacha) && typeof value.gacha.stellar_jade === "number" ? Math.max(0, Math.floor(value.gacha.stellar_jade)) : 0;
  const currentTickets = specialPasses + Math.floor(stellarJade / 160);

  if (errors.length) {
    return { errors };
  }

  return {
    payload: {
      version: 1,
      planner: { currentTickets },
      roster: { characters },
    },
    errors,
  };
}
