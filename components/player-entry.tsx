"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";

type IdentifiedPlayer = {
  id: string;
  name: string;
  whatsapp: string;
  whatsappFormatted: string;
  poolId: string | null;
  poolName: string | null;
};

type ApiResult<T> = T & {
  error?: string;
  requiresName?: boolean;
};

const PLAYER_STORAGE_KEY = "bolao-d-rosa-do-brassssillll-player";

function formatWhatsappInput(value: string) {
  const digits = value.replace(/\D/g, "");
  const nationalDigits =
    digits.startsWith("55") && digits.length > 11 ? digits.slice(2, 13) : digits.slice(0, 11);
  const ddd = nationalDigits.slice(0, 2);
  const local = nationalDigits.slice(2);

  if (nationalDigits.length <= 2) {
    return ddd ? `(${ddd}` : "";
  }

  if (local.length <= 4) {
    return `(${ddd}) ${local}`;
  }

  if (local.length <= 8) {
    return `(${ddd}) ${local.slice(0, 4)}-${local.slice(4)}`;
  }

  return `(${ddd}) ${local.slice(0, 5)}-${local.slice(5, 9)}`;
}

export function PlayerEntry() {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [needsNameModal, setNeedsNameModal] = useState(false);

  const isPinReady = /^\d{4}$/.test(pin);

  useEffect(() => {
    const saved = window.localStorage.getItem(PLAYER_STORAGE_KEY);

    if (saved) {
      window.location.href = "/apostas";
    }
  }, []);

  async function identifyPlayer(nameOverride?: string) {
    const response = await fetch("/api/players/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameOverride ?? "", whatsapp, pin })
    });
    const payload = (await response.json()) as ApiResult<{
      player: IdentifiedPlayer;
      created: boolean;
    }>;

    if (!response.ok) {
      if (payload.requiresName) {
        setNeedsNameModal(true);
        setMessage("");
        return null;
      }

      throw new Error(payload.error ?? "Erro inesperado.");
    }

    return payload;
  }

  async function handleIdentify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await identifyPlayer();

      if (!result) {
        return;
      }

      window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(result.player));
      setMessage(result.created ? "Cadastro criado." : "Cadastro localizado.");
      window.location.href = "/apostas";
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao identificar jogador.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRegisterName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await identifyPlayer(name);

      if (!result) {
        return;
      }

      window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(result.player));
      setNeedsNameModal(false);
      setMessage("Cadastro criado.");
      window.location.href = "/apostas";
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao cadastrar.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-mist px-4 py-6">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1fr_0.95fr]">
        <div className="rounded-lg border border-canary bg-field p-5 text-white shadow-panel sm:p-7">
          <p className="text-sm font-black uppercase tracking-wide text-canary">
            Família Silva
          </p>
          <h1 className="mt-3 text-5xl font-black leading-none tracking-normal sm:text-6xl">
            bet <span className="block text-canary">BARÃO</span>
          </h1>
          <p className="mt-2 inline-flex rounded-md bg-rose px-3 py-1 text-lg font-black text-white">
            by d. Rosa
          </p>
          <p className="mt-5 max-w-xl text-2xl font-black leading-tight text-white">
            Palpites, PIX e prêmio por jogo em um só lugar.
          </p>

          <div className="relative mt-6 h-72 overflow-hidden rounded-lg border border-canary/70 bg-white">
            <Image
              src="/brand/logo_principal.png"
              alt="Bet Barão by d. Rosa com d. Rosa em cartoon"
              width={900}
              height={900}
              className="absolute left-1/2 top-1/2 h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 object-contain"
              priority
            />
          </div>

          <div className="mt-5 grid gap-3 text-sm font-bold text-white/90 sm:grid-cols-3">
            <p className="rounded-md border border-canary/40 bg-white/10 px-3 py-3">
              Use WhatsApp e senha de 4 números.
            </p>
            <p className="rounded-md border border-canary/40 bg-white/10 px-3 py-3">
              Escolha o bolão e abra o jogo.
            </p>
            <p className="rounded-md border border-canary/40 bg-white/10 px-3 py-3">
              Seu acesso fica salvo neste aparelho.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-canary/80 bg-white p-5 shadow-panel sm:p-7">
          <div>
            <p className="text-sm font-black uppercase text-field">
              Bet Barão
            </p>
            <h2 className="mt-2 text-3xl font-black text-ink sm:text-4xl">
              Acesso do palpiteiro
            </h2>
            <p className="mt-2 text-base font-semibold text-coal/70">
              Digite WhatsApp e senha para continuar.
            </p>
          </div>

          <form onSubmit={handleIdentify} className="mt-6 grid gap-4">
            <label className="grid gap-1 text-sm font-semibold text-coal">
              WhatsApp
              <input
                value={whatsapp}
                onChange={(event) => setWhatsapp(formatWhatsappInput(event.target.value))}
                placeholder="(91) 98258-5313"
                type="tel"
                inputMode="numeric"
                pattern="[0-9()\\s-]*"
                autoComplete="tel-national"
                className="h-11 rounded-md border border-line px-3 text-sm font-normal text-ink outline-none transition focus:border-field focus:ring-2 focus:ring-field/15"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-coal">
              Senha de 4 números
              <input
                value={pin}
                onChange={(event) =>
                  setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="Ex.: 1234"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                type="password"
                maxLength={4}
                className="h-11 rounded-md border border-line px-3 text-sm font-normal text-ink outline-none transition focus:border-field focus:ring-2 focus:ring-field/15"
              />
            </label>
            <button
              type="submit"
              disabled={isBusy || !isPinReady}
              className="h-12 rounded-md bg-field px-4 text-base font-semibold text-white transition hover:bg-field/90 disabled:bg-coal/30"
            >
              Entrar
            </button>
          </form>

          {message ? (
            <p className="mt-4 rounded-md border border-field/20 bg-field/5 px-3 py-2 text-sm font-semibold text-field">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}
        </div>
      </section>

      {needsNameModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="name-dialog-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 px-4 py-5 backdrop-blur-sm sm:items-center"
        >
          <form
            onSubmit={handleRegisterName}
            className="w-full max-w-sm rounded-lg border border-line bg-white p-5 shadow-panel"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="name-dialog-title" className="text-lg font-semibold text-ink">
                  Primeiro acesso
                </h2>
                <p className="mt-1 text-sm text-coal/70">
                  Este WhatsApp ainda não existe. Informe o nome para criar o
                  cadastro.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNeedsNameModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-lg font-semibold text-coal transition hover:border-field hover:text-field"
                aria-label="Fechar cadastro"
              >
                ×
              </button>
            </div>

            <label className="mt-4 grid gap-1 text-sm font-semibold text-coal">
              Nome
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoFocus
                placeholder="Nome do palpiteiro"
                className="h-11 rounded-md border border-line px-3 text-sm font-normal text-ink outline-none transition focus:border-field focus:ring-2 focus:ring-field/15"
              />
            </label>

            <button
              disabled={isBusy || name.trim().length < 2}
              className="mt-4 h-11 w-full rounded-md bg-field px-4 text-sm font-semibold text-white transition hover:bg-field/90 disabled:bg-coal/30"
            >
              Criar cadastro
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
