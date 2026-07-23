"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState, type DragEvent } from "react";
import charactersData from "../../../data/characters.json";
import type { CharacterSummary, DamageType } from "../../lib/types/hsr";
import { emptyRows, normalizeRows, removeCharacter, tierRanks, tierRoles, type TierListSnapshot, type TierRank, type TierRole, type TierRows } from "./tier-data";

const characters = charactersData as CharacterSummary[];

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

const tierStyles: Record<TierRank, string> = {
  SS: "from-rose-400 to-fuchsia-400 text-slate-950",
  S: "from-amber-300 to-orange-400 text-slate-950",
  A: "from-emerald-300 to-cyan-300 text-slate-950",
  B: "from-sky-300 to-indigo-300 text-slate-950",
  C: "from-slate-400 to-slate-600 text-white",
};

export function TierList({ initialSnapshot, isAdmin }: { initialSnapshot: TierListSnapshot; isAdmin: boolean }) {
  const [patch, setPatch] = useState(initialSnapshot.patch);
  const [rows, setRows] = useState<TierRows>(() => normalizeRows(initialSnapshot.rows));
  const [search, setSearch] = useState("");
  const [elementFilter, setElementFilter] = useState<(typeof elements)[number]>("all");
  const [rarityFilter, setRarityFilter] = useState<"all" | "4" | "5">("all");
  const [draggedCharacterId, setDraggedCharacterId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const rankedIds = new Set(tierRanks.flatMap((tier) => tierRoles.flatMap((role) => rows[tier][role])));
  const characterById = new Map(characters.map((character) => [character.id, character]));
  const unrankedCharacters = characters.filter((character) => !rankedIds.has(character.id));
  const filteredUnrankedCharacters = unrankedCharacters.filter((character) => {
    const normalizedSearch = search.toLowerCase().trim();
    const matchesSearch = character.name.toLowerCase().includes(normalizedSearch);
    const matchesElement = elementFilter === "all" || character.element === elementFilter;
    const matchesRarity = rarityFilter === "all" || character.rarity === Number(rarityFilter);

    return matchesSearch && matchesElement && matchesRarity;
  });

  async function saveSnapshot(nextPatch: string, nextRows: TierRows) {
    if (!isAdmin) {
      return;
    }

    setSaveState("saving");

    const response = await fetch("/api/tier-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patch: nextPatch, rows: nextRows }),
    });

    if (!response.ok) {
      setSaveState("error");
      return;
    }

    const snapshot = (await response.json()) as TierListSnapshot;
    setPatch(snapshot.patch);
    setRows(normalizeRows(snapshot.rows));
    setSaveState("saved");
  }

  function updatePatch(value: string) {
    setPatch(value);
    setSaveState("idle");
  }

  async function resetTierList() {
    const nextRows = emptyRows();

    setRows(nextRows);
    await saveSnapshot(patch, nextRows);
  }

  async function handleDrop(event: DragEvent<HTMLElement>, target: { tier: TierRank; role: TierRole } | "unranked") {
    event.preventDefault();

    if (!isAdmin) {
      return;
    }

    const characterId = event.dataTransfer.getData("text/plain") || draggedCharacterId;

    if (characterId) {
      const nextRows = removeCharacter(rows, characterId);

      if (target !== "unranked") {
        nextRows[target.tier][target.role] = [...nextRows[target.tier][target.role], characterId];
      }

      setRows(nextRows);
      await saveSnapshot(patch, nextRows);
    }

    setDraggedCharacterId(null);
  }

  function allowDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,#3b1f5f,transparent_34rem),linear-gradient(135deg,#070712,#111827_58%,#312e81)] px-4 py-6 text-slate-50 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
          <nav className="mb-6 flex flex-wrap gap-3 text-sm font-semibold text-slate-200">
            <Link className="rounded-full border border-white/10 bg-white/10 px-4 py-2 transition hover:bg-white/20" href="/">
              Gacha Planner
            </Link>
            <span className="rounded-full border border-fuchsia-300/40 bg-fuchsia-300/20 px-4 py-2 text-fuchsia-100">
              Tier List
            </span>
          </nav>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-fuchsia-200">Fase 2</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Tier List</h1>
              <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
                Consulta la tier list pública por rol. Inicia sesión como admin para editarla y guardar cambios en Turso.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <label className="grid gap-2 text-sm text-slate-300">
                Parche de la tier list
                <input
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none ring-fuchsia-300/40 focus:ring-2"
                  disabled={!isAdmin}
                  value={patch}
                  onBlur={() => saveSnapshot(patch, rows)}
                  onChange={(event) => updatePatch(event.target.value)}
                />
              </label>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {isAdmin ? (
                  <>
                    <button
                      className="rounded-full border border-red-300/30 bg-red-300/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-300/20"
                      type="button"
                      onClick={resetTierList}
                    >
                      Reiniciar tier list
                    </button>
                    <button
                      className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/20"
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/tier-list" })}
                    >
                      Salir
                    </button>
                  </>
                ) : (
                  <Link className="rounded-full bg-fuchsia-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-fuchsia-200" href="/login">
                    Login admin
                  </Link>
                )}
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {saveState === "saving" ? "Guardando" : saveState === "saved" ? "Guardado" : saveState === "error" ? "Error al guardar" : isAdmin ? "Editable" : "Solo lectura"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-3">
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-xl shadow-black/20 xl:grid xl:grid-cols-[7rem_1fr]">
            <div className="bg-white/5" />
            <div className="grid gap-px bg-white/10 xl:grid-cols-4">
              {tierRoles.map((role) => (
                <div key={role} className="bg-slate-950/80 px-4 py-3 text-center text-xs font-black tracking-[0.25em] text-fuchsia-100">
                  {role}
                </div>
              ))}
            </div>
          </div>
          {tierRanks.map((tier) => (
            <TierRow
              key={tier}
              characterById={characterById}
              columns={rows[tier]}
              editable={isAdmin}
              tier={tier}
              onDragStart={setDraggedCharacterId}
              onDrop={(event, role) => handleDrop(event, { tier, role })}
              onDragOver={allowDrop}
            />
          ))}
        </section>

        {isAdmin ? (
          <section
            className="rounded-3xl border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-black/20 backdrop-blur sm:p-6"
            onDrop={(event) => handleDrop(event, "unranked")}
            onDragOver={allowDrop}
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Pool admin</p>
                <h2 className="mt-1 text-2xl font-black">Personajes sin tier</h2>
                <p className="mt-2 text-sm text-slate-400">Arrastra portraits desde aquí a una columna, o devuélvelos al pool.</p>
              </div>
              <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs font-semibold uppercase text-slate-300">
                {filteredUnrankedCharacters.length}/{unrankedCharacters.length} visibles
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_10rem_12rem]">
              <input
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none ring-fuchsia-300/40 placeholder:text-slate-500 focus:ring-2"
                placeholder="Buscar personaje"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none ring-fuchsia-300/40 focus:ring-2"
                value={rarityFilter}
                onChange={(event) => setRarityFilter(event.target.value as typeof rarityFilter)}
              >
                <option value="all">Todas</option>
                <option value="5">5 estrellas</option>
                <option value="4">4 estrellas</option>
              </select>
              <select
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none ring-fuchsia-300/40 focus:ring-2"
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

            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-12">
              {filteredUnrankedCharacters.map((character) => (
                <CharacterPortrait key={character.id} character={character} editable={isAdmin} onDragStart={setDraggedCharacterId} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function TierRow(props: {
  tier: TierRank;
  columns: Record<TierRole, string[]>;
  editable: boolean;
  characterById: Map<string, CharacterSummary>;
  onDragStart: (characterId: string) => void;
  onDrop: (event: DragEvent<HTMLElement>, role: TierRole) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
}) {
  return (
    <section className="grid min-h-36 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 shadow-xl shadow-black/20 xl:grid-cols-[7rem_1fr]">
      <div className={`flex items-center justify-center bg-gradient-to-br ${tierStyles[props.tier]} p-4 text-3xl font-black`}>
        {props.tier}
      </div>
      <div className="grid min-h-36 gap-px bg-white/10 md:grid-cols-2 xl:grid-cols-4">
        {tierRoles.map((role) => {
          const characters = props.columns[role]
            .map((characterId) => props.characterById.get(characterId))
            .filter(Boolean) as CharacterSummary[];

          return (
            <div
              key={role}
              className="min-h-36 bg-slate-950/45 p-3"
              onDrop={(event) => props.editable && props.onDrop(event, role)}
              onDragOver={props.onDragOver}
            >
              <h3 className="mb-3 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-center text-xs font-black tracking-[0.2em] text-slate-300 xl:hidden">
                {role}
              </h3>
              <div className="flex flex-wrap content-start gap-3">
                {characters.length > 0 ? (
                  characters.map((character) => (
                    <CharacterPortrait key={character.id} character={character} editable={props.editable} onDragStart={props.onDragStart} />
                  ))
                ) : (
                  <p className="py-6 text-center text-sm text-slate-500">Suelta personajes aquí</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CharacterPortrait({
  character,
  editable,
  onDragStart,
}: {
  character: CharacterSummary;
  editable: boolean;
  onDragStart: (characterId: string) => void;
}) {
  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-fuchsia-200/50 ${editable ? "cursor-grab active:cursor-grabbing" : ""}`}
      draggable={editable}
      title={`${character.name} · ${character.element} · ${character.path}`}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", character.id);
        onDragStart(character.id);
      }}
    >
      <div className="aspect-square w-full bg-gradient-to-br from-slate-800 to-slate-950 p-2">
        <img
          alt={character.name}
          className="h-full w-full object-contain drop-shadow-2xl transition group-hover:scale-105"
          loading="lazy"
          src={character.icon}
        />
      </div>
      <div className="max-w-28 px-2 py-2">
        <p className="truncate text-xs font-bold text-white">{character.name}</p>
        <p className="mt-0.5 truncate text-[0.65rem] text-slate-400">
          {character.rarity}★ · {character.element}
        </p>
      </div>
    </article>
  );
}
