import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(
  message: string,
  status = 400,
  extra?: Record<string, unknown>
) {
  return NextResponse.json({ error: message, ...(extra ?? {}) }, { status });
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new Error("Corpo da requisicao invalido.");
  }
}
