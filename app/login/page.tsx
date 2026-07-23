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

    const result = await signIn("credentials", {
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
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-fuchsia-200">Admin</p>
        <h1 className="mt-4 text-3xl font-black">Login Tier List</h1>
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
        <Link className="mt-4 inline-flex text-sm font-semibold text-slate-300 transition hover:text-white" href="/tier-list">
          Volver a la tier list pública
        </Link>
      </section>
    </main>
  );
}
