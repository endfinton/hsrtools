"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const result = await signIn("admin-credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }

    router.push("/tier-list");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#3b1f5f,transparent_34rem),linear-gradient(135deg,#070712,#111827_58%,#312e81)] px-4 py-10 text-slate-50">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-fuchsia-200">Cuenta</p>
        <h1 className="mt-4 text-3xl font-black">Entrar a HSR Tools</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Usa Google para guardar tu progreso entre dispositivos. No guardamos credenciales del juego.
        </p>
        <button
          className="mt-6 w-full rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          Continuar con Google
        </button>

        <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          Admin
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form action={handleSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm text-slate-300">
            Usuario
            <input
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-fuchsia-300/40 focus:ring-2"
              name="username"
              required
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Contraseña
            <input
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-fuchsia-300/40 focus:ring-2"
              name="password"
              required
              type="password"
            />
          </label>
          {error ? <p className="rounded-2xl border border-red-300/30 bg-red-300/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}
          <button
            className="rounded-full bg-fuchsia-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-fuchsia-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <Link className="mt-4 inline-flex text-sm font-semibold text-slate-300 transition hover:text-white" href="/">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
