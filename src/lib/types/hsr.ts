export type Language = "en" | "zh" | "ko" | "ja";

export type CharacterRarity = 4 | 5;

export type CharacterPath =
  | "Preservation"
  | "The Hunt"
  | "Erudition"
  | "Nihility"
  | "Destruction"
  | "Abundance"
  | "Harmony"
  | "Remembrance"
  | "Elation"
  | "Unknown";

export type DamageType =
  | "Physical"
  | "Fire"
  | "Ice"
  | "Lightning"
  | "Wind"
  | "Quantum"
  | "Imaginary";

export interface CharacterIndexEntry {
  release?: number;
  icon: string;
  rank: "CombatPowerAvatarRarityType4" | "CombatPowerAvatarRarityType5";
  baseType: string;
  damageType: string;
  en: string;
  ko: string;
  zh: string;
  ja: string;
  desc: string;
  enhance: number[];
}

export type CharacterIndex = Record<string, CharacterIndexEntry>;

export interface CharacterSummary {
  id: string;
  name: string;
  rarity: CharacterRarity;
  path: CharacterPath;
  element: DamageType;
  icon: string;
  pathIcon?: string;
  elementIcon?: string;
  release?: number;
}

export interface Banner {
  id: string;
  name: string;
  patch: string;
  status: "current" | "rumored";
  featuredCharacterIds: string[];
}

export interface GachaPlannerSnapshot {
  ownedCharacterIds: string[];
  wishlistCharacterIds: string[];
  currentTickets: number;
  pity: number;
  guaranteed: boolean;
}

export const PATH_MAP: Record<string, CharacterPath> = {
  Knight: "Preservation",
  Rogue: "The Hunt",
  Mage: "Erudition",
  Warlock: "Nihility",
  Warrior: "Destruction",
  Priest: "Abundance",
  Shaman: "Harmony",
  Memory: "Remembrance",
  Elation: "Elation",
};
