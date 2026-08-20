"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CharacterSummary, DamageType } from "../../lib/types/hsr";
import { calculateWishlistPlan, HARD_PITY } from "./calculations";
import { useGachaPlannerStore } from "./store";

const elements: Array<"all" | DamageType> = [
  "all",
  "Physical",
  "Fire",
  "Ice",
  "Lightning",
  "Wind",
  "Quantum",
  "Imaginary",
];

export function GachaPlanner({
  characters,
  overriddenCharacterIds,
}: {
  characters: CharacterSummary[];
  overriddenCharacterIds: string[];
}) {
  const [search, setSearch] = useState("");
  const [elementFilter, setElementFilter] = useState<(typeof elements)[number]>("all");

  const ownedCharacterIds = useGachaPlannerStore((state) => state.ownedCharacterIds);
  const wishlistCharacterIds = useGachaPlannerStore((state) => state.wishlistCharacterIds);
  const currentTickets = useGachaPlannerStore((state) => state.currentTickets);
  const pity = useGachaPlannerStore((state) => state.pity);
  const guaranteed = useGachaPlannerStore((state) => state.guaranteed);
  const toggleOwned = useGachaPlannerStore((state) => state.toggleOwned);
  const toggleWishlist = useGachaPlannerStore((state) => state.toggleWishlist);
  const setOwnedCharacterIds = useGachaPlannerStore((state) => state.setOwnedCharacterIds);
  const setCurrentTickets = useGachaPlannerStore((state) => state.setCurrentTickets);
  const setPity = useGachaPlannerStore((state) => state.setPity);
  const setGuaranteed = useGachaPlannerStore((state) => state.setGuaranteed);
  const resetPlanner = useGachaPlannerStore((state) => state.resetPlanner);

  const fiveStarCharacters = characters.filter((character) => character.rarity === 5);
  const overriddenSet = new Set(overriddenCharacterIds);
  const ownedSet = new Set(ownedCharacterIds);
  const wishlistSet = new Set(wishlistCharacterIds);
  const ownedFiveStarCount = fiveStarCharacters.filter((character) => ownedSet.has(character.id)).length;
  const wishlistCharacters = fiveStarCharacters.filter((character) => wishlistSet.has(character.id));
  const plan = calculateWishlistPlan({
    targetCount: wishlistCharacters.length,
    currentTickets,
    pity,
    guaranteed,
  });

  const filteredCharacters = fiveStarCharacters.filter((character) => {
    const matchesSearch = character.name.toLowerCase().includes(search.toLowerCase().trim());
    const matchesElement = elementFilter === "all" || character.element === elementFilter;

    return matchesSearch && matchesElement;
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#2a214d,transparent_32rem),linear-gradient(135deg,#080814,#111827_55%,#1e1b4b)] px-4 py-6 text-slate-50 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
          <nav className="mb-6 flex flex-wrap gap-3 text-sm font-semibold text-slate-200">
            <Link className="rounded-full border border-white/10 bg-white/10 px-4 py-2 transition hover:bg-white/20" href="/">
              Inicio
            </Link>
            <span className="rounded-full border border-cyan-300/40 bg-cyan-300/20 px-4 py-2 text-cyan-100">
              Gacha Planner
            </span>
            <Link className="rounded-full border border-white/10 bg-white/10 px-4 py-2 transition hover:bg-white/20" href="/tier-list">
              Tier List
            </Link>
          </nav>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200">HSR Toolkit</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Gacha Planner</h1>
              <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
                Marca tu roster, prepara una wishlist y calcula el peor caso de tickets para asegurar tus próximos 5 estrellas.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <SummaryCard label="Roster" value={`${ownedFiveStarCount}/${fiveStarCharacters.length}`} />
              <SummaryCard label="Wishlist" value={wishlistCharacters.length.toString()} />
              <SummaryCard label="Tickets" value={currentTickets.toString()} />
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <PlannerControls
            currentTickets={currentTickets}
            pity={pity}
            guaranteed={guaranteed}
            setCurrentTickets={setCurrentTickets}
            setPity={setPity}
            setGuaranteed={setGuaranteed}
            resetPlanner={resetPlanner}
          />
          <PlanSummary targetCount={wishlistCharacters.length} plan={plan} />
        </section>

        <ImportJsonPanel currentOwnedCharacterIds={ownedCharacterIds} setOwnedCharacterIds={setOwnedCharacterIds} />

        <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Objetivos</p>
              <h2 className="mt-1 text-xl font-bold">Personajes en wishlist</h2>
            </div>
            <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 px-3 py-1 text-xs font-semibold uppercase text-fuchsia-100">
              {wishlistCharacters.length} seleccionados
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {wishlistCharacters.length > 0 ? (
              wishlistCharacters.map((character) => <CharacterPill key={character.id} character={character} />)
            ) : (
              <p className="text-sm text-slate-400">Añade personajes de 5 estrellas con el botón Quiero para verlos aquí.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-black/20 backdrop-blur sm:p-6">
          <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
            <input
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none ring-cyan-300/40 placeholder:text-slate-500 focus:ring-2"
              placeholder="Buscar personaje"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none ring-cyan-300/40 focus:ring-2"
              value={elementFilter}
              onChange={(event) => setElementFilter(event.target.value as typeof elementFilter)}
            >
              {elements.map((element) => (
                <option key={element} value={element}>
                  {element === "all" ? "Todos los elementos" : element}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {filteredCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                owned={ownedSet.has(character.id)}
                overridden={overriddenSet.has(character.id)}
                wishlisted={wishlistSet.has(character.id)}
                onToggleOwned={() => toggleOwned(character.id)}
                onToggleWishlist={() => toggleWishlist(character.id)}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

interface ImportPreview {
  roster?: {
    added: Array<{ characterId: string; eidolon: number; level?: number; lightConeId?: string }>;
    changed: Array<{
      before: { characterId: string; eidolon: number; level?: number; lightConeId?: string };
      after: { characterId: string; eidolon: number; level?: number; lightConeId?: string };
    }>;
    unchanged: Array<{ characterId: string; eidolon: number; level?: number; lightConeId?: string }>;
  };
  corrections?: {
    sections: string[];
    replacesExisting: boolean;
  };
}

function ImportJsonPanel(props: {
  currentOwnedCharacterIds: string[];
  setOwnedCharacterIds: (characterIds: string[]) => void;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  async function importFile(file: File) {
    setPending(true);
    setStatus("");
    setErrors([]);

    try {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(["El archivo supera el límite de 5 MiB."]);
        return;
      }

      const payload = JSON.parse(await file.text()) as unknown;
      const response = await fetch("/api/import-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false, payload }),
      });
      const result = (await response.json()) as { preview?: ImportPreview; errors?: string[]; error?: string; applied?: boolean };

      if (!response.ok) {
        setErrors(result.errors ?? [result.error ?? "No se pudo importar el JSON."]);
        return;
      }

      setPreview(result.preview ?? null);
      setStatus(`Import aplicado correctamente desde ${file.name}.`);

      const importedIds = result.preview?.roster
        ? [...result.preview.roster.added, ...result.preview.roster.changed.map((change) => change.after), ...result.preview.roster.unchanged].map(
            (character) => character.characterId,
          )
        : [];
      props.setOwnedCharacterIds([...props.currentOwnedCharacterIds, ...importedIds]);
      router.refresh();
    } catch {
      setErrors(["JSON mal formado."]);
    } finally {
      setPending(false);
    }
  }

  async function exportBackup() {
    setPending(true);
    setStatus("");
    setErrors([]);

    try {
      const response = await fetch("/api/import-json");
      const result = (await response.json()) as unknown;

      if (!response.ok) {
        const errorResult = result as { error?: string };
        setErrors([errorResult.error ?? "No se pudo exportar el backup."]);
        return;
      }

      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "hsr-tools-backup.json";
      link.click();
      URL.revokeObjectURL(url);
      setPreview(null);
      setStatus("Backup exportado como hsr-tools-backup.json.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-3xl border border-violet-200/20 bg-violet-200/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-violet-200/80">Import / Export</p>
          <h2 className="mt-1 text-xl font-bold">Roster, progreso y correcciones</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Selecciona un JSON interno con `version`, `roster` y/o `corrections`. Las correcciones se guardan como override separado; los datos base de `data/*.json` no se modifican.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label
            className={`rounded-full bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200 ${
              pending ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            }`}
          >
            Seleccionar e importar JSON
            <input
              accept="application/json,.json"
              className="sr-only"
              disabled={pending}
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.currentTarget.value = "";

                if (file) {
                  void importFile(file);
                }
              }}
            />
          </label>
          <button
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20 disabled:opacity-60"
            disabled={pending}
            type="button"
            onClick={exportBackup}
          >
            Exportar backup
          </button>
        </div>
      </div>

      {status ? <p className="mt-3 text-sm font-semibold text-emerald-100">{status}</p> : null}
      {errors.length ? (
        <div className="mt-3 rounded-2xl border border-red-300/30 bg-red-300/10 p-3 text-sm text-red-100">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}
      {preview ? <ImportPreviewSummary preview={preview} /> : null}
    </section>
  );
}

function ImportPreviewSummary({ preview }: { preview: ImportPreview }) {
  return (
    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
      <SummaryCard label="Altas" value={(preview.roster?.added.length ?? 0).toString()} />
      <SummaryCard label="Cambios" value={(preview.roster?.changed.length ?? 0).toString()} />
      <SummaryCard label="Iguales" value={(preview.roster?.unchanged.length ?? 0).toString()} />
      <SummaryCard label="Overrides" value={preview.corrections?.sections.length.toString() ?? "0"} />
      {preview.corrections?.replacesExisting ? (
        <p className="sm:col-span-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3 text-amber-100">
          Este import reemplazará correcciones locales existentes.
        </p>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function PlannerControls(props: {
  currentTickets: number;
  pity: number;
  guaranteed: boolean;
  setCurrentTickets: (value: number) => void;
  setPity: (value: number) => void;
  setGuaranteed: (value: boolean) => void;
  resetPlanner: () => void;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
      <h2 className="text-xl font-bold">Estado de tu banner</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm text-slate-300">
          Tickets actuales
          <input
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none ring-cyan-300/40 focus:ring-2"
            min={0}
            type="number"
            value={props.currentTickets}
            onChange={(event) => props.setCurrentTickets(Number(event.target.value))}
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-300">
          Pity actual / {HARD_PITY}
          <input
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none ring-cyan-300/40 focus:ring-2"
            max={HARD_PITY}
            min={0}
            type="number"
            value={props.pity}
            onChange={(event) => props.setPity(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
            props.guaranteed
              ? "border-emerald-300/60 bg-emerald-300/20 text-emerald-100"
              : "border-white/10 bg-white/10 text-slate-300"
          }`}
          type="button"
          onClick={() => props.setGuaranteed(!props.guaranteed)}
        >
          {props.guaranteed ? "Garantizado activo" : "50/50 pendiente"}
        </button>
        <button
          className="rounded-full border border-red-300/30 bg-red-300/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-300/20"
          type="button"
          onClick={props.resetPlanner}
        >
          Reiniciar planner
        </button>
      </div>
    </section>
  );
}

function PlanSummary({
  targetCount,
  plan,
}: {
  targetCount: number;
  plan: ReturnType<typeof calculateWishlistPlan>;
}) {
  return (
    <section className="rounded-3xl border border-cyan-200/20 bg-cyan-200/10 p-5">
      <h2 className="text-xl font-bold">Plan de tickets</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="5★ objetivo" value={targetCount.toString()} />
        <SummaryCard label="Peor caso" value={plan.worstCasePulls.toString()} />
        <SummaryCard label="Faltan" value={plan.ticketShortfall.toString()} />
      </div>
      <p className="mt-4 text-sm text-cyan-100/80">
        Si quieres asegurar toda la wishlist de 5 estrellas, necesitas cubrir un déficit de {plan.stellarJadeShortfall.toLocaleString("es-ES")} jades estelares.
      </p>
    </section>
  );
}

function CharacterPill({ character }: { character: CharacterSummary }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-slate-200">
      {character.name} · {character.rarity}★
    </span>
  );
}

function CharacterCard(props: {
  character: CharacterSummary;
  owned: boolean;
  overridden: boolean;
  wishlisted: boolean;
  onToggleOwned: () => void;
  onToggleWishlist: () => void;
}) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-cyan-200/40">
      <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-950 p-4">
        <img
          alt=""
          className="h-full w-full object-contain drop-shadow-2xl transition group-hover:scale-105"
          loading="lazy"
          src={props.character.icon}
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-white">{props.character.name}</h3>
            <p className="mt-1 text-xs text-slate-400">
              {props.character.element} · {props.character.path}
            </p>
          </div>
          <span className="rounded-full bg-amber-300/15 px-2 py-1 text-xs font-black text-amber-200">
            {props.character.rarity}★
          </span>
        </div>
        {props.overridden ? (
          <p className="mt-2 rounded-full border border-violet-300/30 bg-violet-300/10 px-3 py-1 text-xs font-semibold text-violet-100">
            Override local
          </p>
        ) : null}
        <div className="mt-3 flex items-center gap-2">
          {props.character.elementIcon ? (
            <img
              alt={props.character.element}
              className="h-6 w-6 rounded-full bg-white/10 p-1"
              loading="lazy"
              src={props.character.elementIcon}
            />
          ) : null}
          {props.character.pathIcon ? (
            <img
              alt={props.character.path}
              className="h-6 w-6 rounded-full bg-white/10 p-1"
              loading="lazy"
              src={props.character.pathIcon}
            />
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
              props.owned ? "bg-emerald-300 text-slate-950" : "bg-white/10 text-slate-200 hover:bg-white/20"
            }`}
            type="button"
            onClick={props.onToggleOwned}
          >
            {props.owned ? "Tengo" : "Roster"}
          </button>
          <button
            className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
              props.wishlisted ? "bg-fuchsia-300 text-slate-950" : "bg-white/10 text-slate-200 hover:bg-white/20"
            }`}
            type="button"
            onClick={props.onToggleWishlist}
          >
            {props.wishlisted ? "Wishlist" : "Quiero"}
          </button>
        </div>
      </div>
    </article>
  );
}
