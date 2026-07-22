# AGENTS.md — HSR Toolkit

Guía de referencia para retomar o continuar este proyecto (humano o agente de código). Contiene el estado real de las decisiones tomadas, no ideas sueltas — todo lo de aquí ha sido verificado contra datos reales.

## 1. Qué es este proyecto

Una toolkit web en JS para el juego **Honkai: Star Rail**, con tres módulos independientes que comparten una misma capa de datos:

1. **Calculadora de DPS** — equipos custom con personajes, relics y light cones, motor de daño basado en las fórmulas reales del juego.
2. **Tier List** — panel admin con drag & drop de portraits, versionado por parche, vista pública de solo lectura.
3. **Gacha Planner** — banners actuales/rumoreados, checklist de roster, wishlist con cálculo de tickets necesarios (pity, 50/50, garantizado).

## 2. Stack técnico

| Capa | Elección |
|---|---|
| Framework | Next.js 16 + App Router + TypeScript |
| Deploy | Vercel |
| Estado | Zustand |
| DB | Turso/libSQL (SQLite serverless) |
| ORM / migraciones | Drizzle ORM + Drizzle Kit |
| Auth | Auth.js / NextAuth (solo panel Admin de tier list) |
| Drag & drop | `dnd-kit` |
| Gráficos | Recharts o Visx |
| Estilos | Tailwind |

### DB / deploy — actualizado con Context7

- La app se despliega en **Vercel** como proyecto Next.js.
- La base de datos será **Turso/libSQL**, no PostgreSQL.
- El acceso a DB desde la app usará `@libsql/client/web`, compatible con Vercel serverless/edge mediante HTTP.
- Drizzle usará dialecto `turso` y schema TypeScript en `src/db/schema.ts`.
- Las migraciones se generan con Drizzle Kit y se guardan en `/drizzle`.
- Variables requeridas en Vercel y local:
  - `TURSO_DATABASE_URL`
  - `TURSO_AUTH_TOKEN`

Configuración esperada de Drizzle:

```typescript
// drizzle.config.ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});
```

Cliente esperado para runtime en Vercel:

```typescript
// src/db/index.ts
import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle({ client });
```

## 3. Capa de datos — CONFIRMADO

### Fuente: `hsr.nanoka.cc`

SPA que sirve **JSON estático versionado por parche** desde un CDN, sin auth. Descubierto inspeccionando el Network tab del navegador (filtro `fetch/xhr`).

```
BASE = https://static.nanoka.cc/hsr/{version}
```

Versión actual verificada: `4.4.51` (⚠️ **BETA** — incluye contenido no lanzado/filtrado, ver sección 6).

### Endpoints confirmados

| Endpoint | Contenido | Estado |
|---|---|---|
| `{BASE}/character.json` | Índice de todo el roster | ✅ |
| `{BASE}/{lang}/character/{id}.json` | Ficha completa: skills, eidolones, trazas, stats | ✅ |
| `{BASE}/relicset.json` | Sets de Cavern Relics (2p/4p) y Planar Ornaments (2p) | ✅ |
| `{BASE}/lightcone.json` | Índice de light cones | ✅ |
| `{BASE}/{lang}/lightcone/{id}.json` | Ficha completa: refinamientos S1-S5, stats por fase | ✅ |
| `{BASE}/{lang}/item.json` | Nombres de materiales | 🔲 no explorado — no crítico para el motor de DPS |
| Base URL de assets (portraits, iconos) | — | 🔲 pendiente de confirmar por endpoint (visto parcialmente: `static.nanoka.cc/assets/hsr/gridfight/icon/{id}.webp` para portraits) |

`lang` = `en` / `zh` / `ko` / `ja`.

### Ingesta — NO hacer scraping en vivo desde la app

```
/scripts/sync-nanoka.ts   ← se corre manualmente o por cron, nunca desde el cliente
/data/*.json               ← output versionado en el repo
/data/meta.json            ← guarda qué versión de parche está sincronizada
```

Al salir un parche nuevo: revisar `hsr.gachabase.net/changelog/beta` para ver qué IDs cambiaron y re-sincronizar solo esos.

## 4. Schemas de datos (TypeScript)

```typescript
// ---- Roster index ----
interface CharacterIndexEntry {
  release?: number;        // unix timestamp — ausente si aún no ha salido
  icon: string;
  rank: 'CombatPowerAvatarRarityType4' | 'CombatPowerAvatarRarityType5';
  baseType: string;         // Path — ver mapeo abajo
  damageType: string;       // Elemento
  en: string; ko: string; zh: string; ja: string;
  desc: string;             // con marcado propio: <unbreak>, {RUBY_B#}{RUBY_E#}, {NICKNAME}, {F#}{M#}
  enhance: number[];
}
type CharacterIndex = Record<string, CharacterIndexEntry>;

// ---- Character detail ----
interface CharacterDetail {
  name: string; desc: string;
  rarity: 'CombatPowerAvatarRarityType4' | 'CombatPowerAvatarRarityType5';
  base_type: string; damage_type: string;
  sp_need: number;                              // energía para Ultimate
  ranks: Record<string, Eidolon>;                // "1".."6"
  skills: Record<string, Skill>;                 // keyed por skill id
  skill_trees: Record<string, Record<string, SkillTreeNode>>; // point01..point18
  stats: Record<string, StatsByPhase>;           // "0".."6" fase de ascensión
  relics: RelicRecommendation;
  lightcones: number[];
  teams: TeamRecommendation[];
}

interface Skill {
  id: number; name: string;
  desc: string;                    // plantilla con #1[i], #2[f1]... (posicional, NO parsear para cálculo)
  type: 'Normal' | 'BPSkill' | 'Ultra' | 'MazeNormal' | 'Maze' | null;
  type_name: 'Basic ATK' | 'Skill' | 'Ultimate' | 'Talent' | 'Technique' | null;
  tag: string;                      // SingleAttack, AoEAttack, Support, Enhance...
  sp_base: number | null;
  show_stance_list: number[];       // daño de ruptura
  level: Record<string, { level: number; param_list: number[] }>; // multiplicador real por nivel
}

interface SkillTreeNode {
  anchor: string;
  avatar_promotion_limit: number | null;
  avatar_level_limit: number | null;
  point_type: 1 | 2 | 3;   // 1=stat menor, 2=sube nivel de skill, 3=traza mayor
  point_name: string | null;
  status_add_list: { property_type: string; value: number; name: string }[];
  pre_point: number[];
}

interface StatsByPhase {
  attack_base: number; attack_add: number;
  defence_base: number; defence_add: number;
  hp_base: number; hp_add: number;
  speed_base: number;
  critical_chance: number; critical_damage: number;
}

// ---- Relic / Ornament sets ----
interface RelicSetEffect {
  en: string; ParamList: number[]; ko: string; zh: string; ja: string;
}
interface RelicSetEntry {
  icon: string;   // ruta relativa, falta prefijo — confirmar
  en: string; ko: string; zh: string; ja: string;
  set: { '2'?: RelicSetEffect; '4'?: RelicSetEffect }; // '4' solo existe en Cavern Relics (ids 101-132)
}                                                        // Planar Ornaments = ids 301-328, solo '2'
type RelicSetIndex = Record<string, RelicSetEntry>;

// ---- Light cones ----
interface LightConeIndexEntry {
  rank: 'CombatPowerLightconeRarity3' | '...4' | '...5';
  baseType: string; en: string; ko: string; zh: string; ja: string;
  atk: number; desc: null;
}
type LightConeIndex = Record<string, LightConeIndexEntry>;

interface LightConeDetail {
  name: string;
  rarity: 'CombatPowerLightconeRarity3' | '...4' | '...5';
  base_type: string;
  refinements: {
    name: string; desc: string;
    level: Record<string, { param_list: number[] }>; // "1".."5" = S1-S5
  };
  stats: LightConeStatsPhase[]; // 7 fases (0 a 6)
}
interface LightConeStatsPhase {
  equipment_id: number; promotion?: number;
  max_level: number;
  base_hp: number; base_hp_add: number;
  base_attack: number; base_attack_add: number;
  base_defence: number; base_defence_add: number;
  promotion_cost_list: { item_id: number; item_num: number; rarity: string }[];
}
```

### Mapeo `baseType` → Path del juego

```typescript
const PATH_MAP: Record<string, string> = {
  Knight: 'Preservation', Rogue: 'The Hunt', Mage: 'Erudition',
  Warlock: 'Nihility', Warrior: 'Destruction', Priest: 'Abundance',
  Shaman: 'Harmony', Memory: 'Remembrance',
  // "Elation" — visto solo en personajes muy recientes de beta (crossover Fate).
  // No es un Path oficial confirmado en release. Tratar como experimental.
};
```

## 5. Fórmula de escalado por nivel — CONFIRMADA

Verificada de forma cruzada entre `character/{id}.json` y `lightcone/{id}.json` (mismo patrón en ambos):

```typescript
function statAtLevel(base: number, add: number, level: number): number {
  return base + add * (level - 1);
}
```

- `add` es constante en las 7 fases de ascensión (0-6) para un mismo stat.
- El salto grande al ascender viene del cambio de `base` entre fases, no de `add`.
- Ejemplo verificado: light cone "Reforged in Hellfire" pasa de `base_attack=19.2` (fase 0) a `base_attack=42.24` (fase 1), con `base_attack_add=2.88` constante en ambas.

### Multiplicadores de skill / refinamiento

- `#1[i]`, `#2[f1]`... en `desc` son **posicionales** → `param_list[0]`, `param_list[1]`...
- El sufijo `[i]`/`[f1]` es solo formato de display, no afecta el cálculo.
- **Nunca parsear el texto de `desc` para obtener el multiplicador** — ir directo al `param_list` del nivel/refinamiento correspondiente.
- ⚠️ El stat base sobre el que aplica un multiplicador **no siempre es ATK** (ej. Mortenax Blade escala con Max HP). Hace falta un mapeo manual `{ characterId: 'atk' | 'hp' | 'def' }` que se rellena personaje a personaje.

## 6. Cuidado con esto (gotchas)

- **Los datos de nanoka.cc son de BETA.** Incluyen personajes no lanzados y contenido de un posible crossover (Fate: Saber, Archer, Gilgamesh, Rin Tohsaka...). Decidir política: ¿se muestran en el gacha planner como "próximamente/rumoreado" o se filtran hasta que tengan `release` definido?
- El campo `desc` de personajes trae marcado propio del juego (`<unbreak>`, `{RUBY_B#}{RUBY_E#}`, `{NICKNAME}`, `{F#}{M#}`) — necesita un sanitizer antes de renderizar en UI.
- La ruta base de los assets de imagen (portraits, iconos de set/skill) no está 100% confirmada — verificar por Network tab antes de asumir un prefijo fijo.
- El patrón de `lightcone/{id}.json` fue confirmado con un solo ejemplo — validar con 2-3 IDs más antes de generalizar el ingestor.

## 7. Estructura de repo propuesta

```
/drizzle
  *.sql                    # migraciones generadas por Drizzle Kit
/data
  characters.json
  lightcones.json
  relicsets.json
  meta.json              # versión de parche sincronizada
/scripts
  sync-nanoka.ts
/src
  /db
    index.ts              # cliente Drizzle + Turso/libSQL para runtime
    schema.ts             # schema SQL fuente de verdad para Drizzle
  /lib
    /types               # interfaces de este documento
    /damage-engine        # motor de cálculo de daño
  /features
    /dps-calculator
    /tier-list
    /gacha-planner
```

## 8. Roadmap por fases

- **Fase 0** — Tipos + script de ingesta + `characters.json` poblado con ~15 personajes de prueba.
- **Fase 1** — Gacha Planner (roster grid reutilizable, checklist, wishlist, cálculo de pity).
- **Fase 2** — Tier List (reutiliza el grid de fase 1, añade drag & drop y panel admin versionado).
- **Fase 3** — Calculadora de DPS (motor de daño + simulador de rotación por turnos).

## 9. Convenciones

- TypeScript en modo estricto.
- Un archivo de tipos único, fuente de verdad para los tres módulos.
- El motor de daño no debe depender de React/Next — debe ser testeable de forma aislada (funciones puras).
- Nombrar los sets de relics/ornamentos por su `id` numérico internamente; resolver a nombre solo en la capa de presentación.
