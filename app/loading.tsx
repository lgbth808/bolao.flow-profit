export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4">
      <div className="rounded-lg border border-canary/70 bg-white px-6 py-5 text-center shadow-panel">
        <p className="text-2xl font-black text-ink">
          bet <span className="text-field">BARÃO</span>
        </p>
        <p className="mt-1 text-sm font-black text-rose">by d. Rosa</p>
        <p className="mt-3 text-sm font-semibold text-coal/70">Carregando...</p>
      </div>
    </main>
  );
}
