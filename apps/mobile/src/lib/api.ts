import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type ErrorBody = { error?: { code?: string; message?: string } };

async function rawRequest(path: string, options: RequestInit, accessToken?: string): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

async function tryRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const res = await rawRequest("/api/mobile/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    await clearTokens();
    return null;
  }

  const data = await res.json();
  await setTokens(data.accessToken, data.refreshToken);
  return data.accessToken as string;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = await getAccessToken();
  let res = await rawRequest(path, options, accessToken ?? undefined);
  let body: (ErrorBody & Record<string, unknown>) | null = await res.json().catch(() => null);

  if (res.status === 401 && body?.error?.code === "token_expired") {
    const refreshedToken = await tryRefresh();
    if (refreshedToken) {
      res = await rawRequest(path, options, refreshedToken);
      body = await res.json().catch(() => null);
    }
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error?.code ?? "unknown_error",
      body?.error?.message ?? "Ocurrió un error inesperado."
    );
  }

  return body as T;
}
