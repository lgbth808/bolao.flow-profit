import { createHash } from "node:crypto";

const PIN_PATTERN = /^\d{4}$/;

function getPinSecret() {
  return process.env.PLAYER_PIN_SECRET || "bolao-pin-local";
}

export function normalizePlayerPin(pin: string) {
  const normalized = pin.replace(/\D/g, "");

  if (!PIN_PATTERN.test(normalized)) {
    throw new Error("Informe uma senha de 4 numeros.");
  }

  return normalized;
}

export function hashPlayerPin(pin: string) {
  const normalized = normalizePlayerPin(pin);

  return createHash("sha256")
    .update(`bolao-player:${getPinSecret()}:${normalized}`)
    .digest("hex");
}

export function isPlayerPinValid(pin: string, pinHash: string) {
  return Boolean(pinHash) && hashPlayerPin(pin) === pinHash;
}
