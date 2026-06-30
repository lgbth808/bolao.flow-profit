export const ADMIN_COOKIE_NAME = "bolao_admin_session";
export const DEFAULT_ADMIN_PASSWORD = "bolao2026";

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || getAdminPassword();
}

async function sha256Hex(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(digest))
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
}

export async function createAdminSessionToken() {
  return sha256Hex(`bolao-admin:${getAdminPassword()}:${getSessionSecret()}`);
}

export function isAdminPassword(password: string) {
  return password === getAdminPassword();
}

export async function isValidAdminSession(token?: string) {
  if (!token) {
    return false;
  }

  return token === (await createAdminSessionToken());
}
