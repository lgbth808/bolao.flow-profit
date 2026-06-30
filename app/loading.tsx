import Image from "next/image";

export default function Loading() {
  return (
    <main className="login-brand-bg flex min-h-screen items-center justify-center px-4">
      <div className="rounded-lg border border-canary/70 bg-white/95 px-6 py-5 text-center shadow-panel backdrop-blur">
        <Image
          src="/brand/logos/logo_texto.png"
          alt="Bet Barão by d. Rosa"
          width={180}
          height={64}
          className="mx-auto h-12 w-auto object-contain"
          priority
        />
        <p className="mt-3 text-sm font-semibold text-coal/70">Carregando...</p>
      </div>
    </main>
  );
}
