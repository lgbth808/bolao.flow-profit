"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  DEFAULT_WHATSAPP_PREFIX,
  formatWhatsappInput
} from "@/lib/phone";

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
const SELECTED_POOL_STORAGE_KEY = "bolao-d-rosa-do-brassssillll-pool";
const SWITCH_PLAYER_STORAGE_KEY = "bolao-d-rosa-switch-player";

export function PlayerEntry() {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState(DEFAULT_WHATSAPP_PREFIX);
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [needsNameModal, setNeedsNameModal] = useState(false);

  const isPinReady = /^\d{4}$/.test(pin);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldSwitchPlayer =
      params.get("trocar") === "1" ||
      window.sessionStorage.getItem(SWITCH_PLAYER_STORAGE_KEY) === "1";

    if (shouldSwitchPlayer) {
      window.localStorage.removeItem(PLAYER_STORAGE_KEY);
      window.localStorage.removeItem(SELECTED_POOL_STORAGE_KEY);
      window.sessionStorage.removeItem(SWITCH_PLAYER_STORAGE_KEY);
      window.history.replaceState(null, "", "/");
      return;
    }

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
    <main className="login-brand-bg flex min-h-screen items-end px-4 pb-4 pt-40 sm:items-center sm:py-8">
      <section className="mx-auto flex min-h-[calc(100vh-11rem)] w-full max-w-6xl items-end justify-center sm:min-h-[calc(100vh-3rem)] sm:items-center lg:justify-end">
        <div className="w-full max-w-sm rounded-lg border border-canary/80 bg-white p-4 shadow-panel sm:max-w-md sm:bg-white/95 sm:p-7">
          <div className="text-center">
            <p className="text-[0.68rem] font-black uppercase leading-tight text-field sm:text-xs">
              Família Silva, agregados e amigos
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight text-ink sm:text-4xl">
              Acesso do palpiteiro
            </h1>
            <p className="mt-2 text-sm font-semibold leading-snug text-coal/70 sm:text-base">
              Digite seu WhatsApp e sua senha de 4 números.
            </p>
            <p className="mt-1 text-xs font-semibold leading-snug text-coal/55">
              O +55 já vem preenchido. Se o número for de outro país, apague e
              digite o DDI correto.
            </p>
            <p className="mt-2 rounded-md border border-canary/45 bg-mist/90 px-3 py-2 text-xs font-semibold leading-snug text-coal/75 sm:text-sm">
              Se ainda não tiver cadastro, sua conta será criada automaticamente.
            </p>
          </div>

          <form onSubmit={handleIdentify} className="mt-4 grid gap-3 sm:mt-6 sm:gap-4">
            <label className="grid gap-1 text-sm font-semibold text-coal">
              WhatsApp
              <input
                value={whatsapp}
                onChange={(event) => setWhatsapp(formatWhatsappInput(event.target.value))}
                placeholder="+55 (91) 98258-5313"
                type="tel"
                inputMode="tel"
                pattern="[+0-9()\\s-]*"
                autoComplete="tel"
                className="h-10 rounded-md border border-line px-3 text-base font-normal text-ink outline-none transition focus:border-field focus:ring-2 focus:ring-field/15 sm:h-11 sm:text-sm"
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
                className="h-10 rounded-md border border-line px-3 text-base font-normal text-ink outline-none transition focus:border-field focus:ring-2 focus:ring-field/15 sm:h-11 sm:text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={isBusy || !isPinReady}
              className="h-11 rounded-md bg-field px-4 text-base font-semibold text-white transition hover:bg-field/90 disabled:bg-coal/30 sm:h-12"
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
                  Informe como seu nome deve aparecer no bolão.
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
