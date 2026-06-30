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
    <main
      className="min-h-screen bg-mist bg-cover bg-center px-4 py-8"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(255,246,229,0.94), rgba(255,255,255,0.88)), url('/brand/background_login.png')"
      }}
    >
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden rounded-lg border border-canary/60 bg-white/80 p-6 shadow-panel backdrop-blur lg:block">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/logo_simbolo.png"
              alt="Símbolo Bet Barão by d. Rosa"
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-contain shadow-sm"
              priority
            />
            <div>
              <p className="text-sm font-semibold uppercase text-field">
                Família Silva
              </p>
              <p className="text-2xl font-semibold text-ink">
                Palpites, PIX e prêmio por jogo em um só lugar.
              </p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-4 rounded-lg border border-canary/60 bg-mist/80 p-4">
            <Image
              src="/brand/avatar_d_rosa.png"
              alt="d. Rosa em cartoon"
              width={112}
              height={112}
              className="h-24 w-24 shrink-0 rounded-full object-contain"
              priority
            />
            <div>
              <p className="text-sm font-semibold uppercase text-rose">
                Rua Barão
              </p>
              <p className="mt-1 text-sm font-semibold text-coal/75">
                A d. Rosa organiza o bolão da família com tradição, futebol e
                diversão.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 text-sm font-semibold text-coal/75">
            <p className="rounded-md bg-white px-3 py-3 shadow-sm">
              Use apenas seu WhatsApp e sua senha de 4 números.
            </p>
            <p className="rounded-md bg-white px-3 py-3 shadow-sm">
              Depois de entrar, escolha o bolão e abra o jogo desejado.
            </p>
            <p className="rounded-md bg-white px-3 py-3 shadow-sm">
              Seu acesso fica salvo neste aparelho para os próximos palpites.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-canary/70 bg-white p-5 shadow-panel sm:p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <Image
              src="/brand/logo_principal.png"
              alt="Bet Barão by d. Rosa"
              width={180}
              height={180}
              className="h-32 w-32 object-contain sm:h-40 sm:w-40"
              priority
            />
            <div>
              <h1 className="text-2xl font-semibold text-ink">
                Acesso do palpiteiro
              </h1>
              <p className="mt-1 text-sm text-coal/70">
                Digite WhatsApp e senha para continuar.
              </p>
            </div>
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
            <div className="mt-4 flex items-center gap-3 rounded-md border border-field/20 bg-field/5 px-3 py-2 text-sm font-semibold text-field">
              <Image
                src="/brand/avatar_d_rosa.png"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-contain"
              />
              <p>{message}</p>
            </div>
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
