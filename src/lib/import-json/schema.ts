export interface ImportRosterCharacter {
  characterId: string;
  eidolon: number;
  level?: number;
  lightConeId?: string;
}

export interface ImportPayload {
  version: 1;
  roster?: {
    characters: ImportRosterCharacter[];
  };
  corrections?: {
    characters?: Record<string, unknown>;
    banners?: Record<string, unknown>;
    lightcones?: Record<string, unknown>;
    relicsets?: Record<string, unknown>;
  };
}

export interface ImportParseResult {
  payload?: ImportPayload;
  errors: string[];
}

const maxCharacters = 1000;
const correctionKeys = ["characters", "banners", "lightcones", "relicsets"] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringField(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function boundedInteger(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : undefined;
}

function parseRosterCharacter(value: unknown, index: number, errors: string[]) {
  if (!isObject(value)) {
    errors.push(`roster.characters[${index}] debe ser un objeto.`);
    return undefined;
  }

  const characterId = stringField(value.characterId);
  const eidolon = boundedInteger(value.eidolon, 0, 6);

  if (!characterId) {
    errors.push(`roster.characters[${index}].characterId es obligatorio.`);
  }

  if (eidolon === undefined) {
    errors.push(`roster.characters[${index}].eidolon debe ser un entero entre 0 y 6.`);
  }

  const level = value.level === undefined ? undefined : boundedInteger(value.level, 1, 80);
  if (value.level !== undefined && level === undefined) {
    errors.push(`roster.characters[${index}].level debe ser un entero entre 1 y 80.`);
  }

  const lightConeId = value.lightConeId === undefined ? undefined : stringField(value.lightConeId);
  if (value.lightConeId !== undefined && !lightConeId) {
    errors.push(`roster.characters[${index}].lightConeId debe ser texto no vacío.`);
  }

  if (!characterId || eidolon === undefined || (value.level !== undefined && level === undefined) || (value.lightConeId !== undefined && !lightConeId)) {
    return undefined;
  }

  return { characterId, eidolon, level, lightConeId } satisfies ImportRosterCharacter;
}

function parseCorrections(value: unknown, errors: string[]) {
  if (value === undefined) {
    return undefined;
  }

  if (!isObject(value)) {
    errors.push("corrections debe ser un objeto.");
    return undefined;
  }

  const corrections: NonNullable<ImportPayload["corrections"]> = {};

  for (const key of correctionKeys) {
    const section = value[key];
    if (section === undefined) {
      continue;
    }

    if (!isObject(section)) {
      errors.push(`corrections.${key} debe ser un objeto.`);
      continue;
    }

    corrections[key] = section;
  }

  return Object.keys(corrections).length ? corrections : undefined;
}

export function parseImportPayload(value: unknown): ImportParseResult {
  const errors: string[] = [];

  if (!isObject(value)) {
    return { errors: ["El JSON raíz debe ser un objeto."] };
  }

  if (value.version !== 1) {
    errors.push("version debe ser 1.");
  }

  let roster: ImportPayload["roster"];
  if (value.roster !== undefined) {
    if (!isObject(value.roster) || !Array.isArray(value.roster.characters)) {
      errors.push("roster.characters debe ser un array.");
    } else if (value.roster.characters.length > maxCharacters) {
      errors.push(`roster.characters no puede superar ${maxCharacters} entradas.`);
    } else {
      const characters = value.roster.characters
        .map((character, index) => parseRosterCharacter(character, index, errors))
        .filter((character): character is ImportRosterCharacter => Boolean(character));

      const seen = new Set<string>();
      roster = {
        characters: characters.filter((character) => {
          if (seen.has(character.characterId)) {
            errors.push(`roster.characters contiene characterId duplicado: ${character.characterId}.`);
            return false;
          }

          seen.add(character.characterId);
          return true;
        }),
      };
    }
  }

  const corrections = parseCorrections(value.corrections, errors);

  if (!roster && !corrections) {
    errors.push("El import debe incluir roster o corrections.");
  }

  if (errors.length) {
    return { errors };
  }

  return {
    payload: {
      version: 1,
      ...(roster ? { roster } : {}),
      ...(corrections ? { corrections } : {}),
    },
    errors,
  };
}
