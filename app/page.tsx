import Link from "next/link";
import { auth } from "../auth";
import { signInWithGoogle, signOutToHome } from "./auth-actions";

const welcomeMessages = [
  "El Expreso Astral está listo. Planifica tu próxima parada.",
  "Hoy puede ser el día de ahorrar jades... o gastarlos sabiamente.",
  "Tu ruta está marcada entre las estrellas.",
  "Revisa tu roster antes de perseguir el próximo 5 estrella.",
  "Que tus pulls sigan el camino de la buena suerte.",
  "Una buena planificación también es parte del viaje.",
  "Las estrellas favorecen a quien prepara su equipo.",
];

const sections = [
  {
    title: "Gacha Planner",
    eyebrow: "Disponible",
    description: "Marca tu roster, prepara objetivos y calcula cuántos tickets necesitas para asegurar tus próximos personajes.",
    href: "/planner",
    accent: "from-cyan-300 to-blue-500",
  },
  {
    title: "Tier List",
    eyebrow: "Disponible",
    description: "Consulta la clasificación pública por rol y parche. Los admins pueden editarla desde una sesión protegida.",
    href: "/tier-list",
    accent: "from-fuchsia-300 to-rose-500",
  },
  {
    title: "Team Builder",
    eyebrow: "Próximamente",
    description: "Construye equipos favoritos de cuatro personajes y reutilízalos en planner, tier list y calculadora de DPS.",
    href: "/",
    accent: "from-amber-200 to-orange-500",
  },
  {
    title: "DPS Calculator",
    eyebrow: "Próximamente",
    description: "Simula daño con personajes, light cones, relics y rotaciones sin depender de React para el motor.",
    href: "/",
    accent: "from-emerald-300 to-teal-500",
  },
  {
    title: "Importar JSON",
    eyebrow: "Próximamente",
    description: "Importa roster, eidolones, backups y datos corregidos para mejorar la precisión de tus herramientas.",
    href: "/",
    accent: "from-violet-300 to-indigo-500",
  },
];

function hashText(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function dailyWelcomeMessage(userKey: string) {
  const day = new Date().toISOString().slice(0, 10);
  return welcomeMessages[hashText(`${userKey}:${day}`) % welcomeMessages.length];
}

export default async function Home() {
  const session = await auth();
  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "Trailblazer";
  const userKey = session?.user?.id || session?.user?.email || "guest";
  const welcomeMessage = dailyWelcomeMessage(userKey);

  return (
    <main className="min-h-screen overflow-hidden bg-[#050713] text-slate-50">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.28),transparent_28rem),radial-gradient(circle_at_82%_18%,rgba(217,70,239,0.24),transparent_26rem),radial-gradient(circle_at_50%_88%,rgba(245,158,11,0.16),transparent_30rem)]" />
      <div className="pointer-events-none fixed inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-10">
        {session?.user ? (
          <section className="rounded-[2rem] border border-cyan-200/20 bg-cyan-200/10 p-4 shadow-2xl shadow-cyan-950/20 backdrop-blur md:flex md:items-center md:justify-between md:gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-100/80">Mensaje del día</p>
              <h2 className="mt-2 text-2xl font-black text-white">Bienvenido/a, {userName}</h2>
              <p className="mt-1 text-sm text-cyan-50/80">{welcomeMessage}</p>
            </div>
            <form action={signOutToHome} className="mt-4 md:mt-0">
              <button className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20" type="submit">
                Cerrar sesión
              </button>
            </form>
          </section>
        ) : null}

        <nav className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-white/[0.07] px-5 py-3 backdrop-blur">
          <Link className="flex items-center gap-3" href="/">
            <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-cyan-300 via-fuchsia-300 to-amber-200 text-lg font-black text-slate-950">H</span>
            <span>
              <span className="block text-sm font-black uppercase tracking-[0.24em]">HSR Tools</span>
              <span className="block text-xs text-slate-400">Astral planning hub</span>
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
            <Link className="rounded-full px-4 py-2 text-slate-200 transition hover:bg-white/10 hover:text-white" href="/planner">Planner</Link>
            <Link className="rounded-full px-4 py-2 text-slate-200 transition hover:bg-white/10 hover:text-white" href="/tier-list">Tier List</Link>
            {!session?.user ? (
              <form action={signInWithGoogle}>
                <button className="rounded-full bg-white px-4 py-2 font-black text-slate-950 transition hover:bg-cyan-100" type="submit">
                  Entrar con Google
                </button>
              </form>
            ) : null}
          </div>
        </nav>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.42em] text-cyan-200">Trailblazer Control Room</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
              Organiza tu viaje entre banners, equipos y estrellas.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Una toolkit para Honkai: Star Rail centrada en planificación: roster, gacha, tier list, builds futuras y datos persistentes por usuario.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="rounded-full bg-gradient-to-r from-cyan-200 to-fuchsia-200 px-6 py-3 text-sm font-black text-slate-950 shadow-xl shadow-cyan-950/30 transition hover:scale-[1.02]" href="/planner">
                Abrir Gacha Planner
              </Link>
              {!session?.user ? (
                <form action={signInWithGoogle}>
                  <button className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/20" type="submit">
                    Registrarme con Google
                  </button>
                </form>
              ) : (
                <Link className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/20" href="/tier-list">
                  Ver Tier List
                </Link>
              )}
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-lg rounded-full border border-white/10 bg-slate-950/50 p-5 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="absolute inset-8 rounded-full border border-cyan-200/20" />
            <div className="absolute inset-20 rounded-full border border-fuchsia-200/20" />
            <div className="absolute left-1/2 top-1/2 h-2/3 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-gradient-to-b from-cyan-200/80 to-transparent blur-sm" />
            <div className="absolute left-1/2 top-1/2 grid size-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-amber-100/30 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 shadow-2xl shadow-cyan-500/20">
              <span className="text-center text-sm font-black uppercase tracking-[0.28em] text-amber-100">
                Astral
                <br />
                Express
              </span>
            </div>
            <div className="absolute left-[12%] top-[24%] rounded-2xl border border-cyan-200/30 bg-cyan-200/10 px-4 py-3 text-sm font-bold text-cyan-50">Planner</div>
            <div className="absolute right-[10%] top-[18%] rounded-2xl border border-fuchsia-200/30 bg-fuchsia-200/10 px-4 py-3 text-sm font-bold text-fuchsia-50">Tier</div>
            <div className="absolute bottom-[20%] left-[18%] rounded-2xl border border-amber-200/30 bg-amber-200/10 px-4 py-3 text-sm font-bold text-amber-50">Teams</div>
            <div className="absolute bottom-[24%] right-[12%] rounded-2xl border border-emerald-200/30 bg-emerald-200/10 px-4 py-3 text-sm font-bold text-emerald-50">DPS</div>
          </div>
        </section>

        <section className="grid gap-4 pb-10 md:grid-cols-2 xl:grid-cols-5">
          {sections.map((section) => {
            const disabled = section.href === "/" && section.eyebrow === "Próximamente";
            const content = (
              <article className="group h-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.1]">
                <div className={`h-1.5 w-20 rounded-full bg-gradient-to-r ${section.accent}`} />
                <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-slate-400">{section.eyebrow}</p>
                <h2 className="mt-3 text-2xl font-black text-white">{section.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{section.description}</p>
                <span className="mt-5 inline-flex text-sm font-black text-cyan-100 transition group-hover:text-white">
                  {disabled ? "En desarrollo" : "Abrir sección"}
                </span>
              </article>
            );

            return disabled ? <div key={section.title}>{content}</div> : <Link key={section.title} href={section.href}>{content}</Link>;
          })}
        </section>
      </div>
    </main>
  );
}
