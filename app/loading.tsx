import Image from "next/image";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4">
      <div className="rounded-lg border border-canary/70 bg-white px-6 py-5 text-center shadow-panel">
        <Image
          src="/brand/logo_texto.png"
          alt="Bet Barão by d. Rosa"
          width={210}
          height={90}
          className="mx-auto h-auto w-44 object-contain"
          priority
        />
        <p className="mt-3 text-sm font-semibold text-coal/70">Carregando...</p>
      </div>
    </main>
  );
}
