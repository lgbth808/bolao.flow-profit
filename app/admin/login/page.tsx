import Image from "next/image";

export const dynamic = "force-dynamic";

function safeNext(value?: string | string[]) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/admin";
  }

  return candidate;
}

export default function AdminLoginPage({
  searchParams
}: {
  searchParams?: { next?: string | string[]; error?: string | string[] };
}) {
  const next = safeNext(searchParams?.next);
  const hasError = Boolean(searchParams?.error);

  return (
    <main
      className="admin-brand-bg flex min-h-screen items-center justify-center px-4 py-8"
    >
      <section className="w-full max-w-md rounded-lg border border-canary/70 bg-white/95 p-6 shadow-panel backdrop-blur">
        <div className="text-center">
          <Image
            src="/brand/logo_horizontal.png"
            alt="Bet Barão by d. Rosa"
            width={320}
            height={120}
            className="mx-auto h-20 w-auto object-contain"
            priority
          />
          <p className="mt-3 text-xs font-black uppercase text-field">
            Administração do bolão familiar
          </p>
          <p className="mt-2 text-sm text-coal/70">
            Digite a senha administrativa para gerenciar jogos, placares e
            pagamentos.
          </p>
        </div>

        <form action="/api/admin/login" method="post" className="mt-6 grid gap-4">
          <input type="hidden" name="next" value={next} />
          <label className="grid gap-1 text-sm font-semibold text-coal">
            Senha do admin
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              className="h-11 rounded-md border border-line px-3 text-sm font-normal text-ink outline-none transition focus:border-field focus:ring-2 focus:ring-field/15"
              required
            />
          </label>
          <button className="h-11 rounded-md bg-field px-4 text-sm font-semibold text-white transition hover:bg-field/90">
            Entrar no admin
          </button>
        </form>

        {hasError ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            Senha incorreta.
          </p>
        ) : null}
      </section>
    </main>
  );
}
