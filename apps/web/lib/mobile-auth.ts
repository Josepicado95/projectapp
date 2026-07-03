// lib/mobile-auth.ts
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { auth } from "@/auth";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.MOBILE_JWT_SECRET;
  if (!secret) throw new Error("MOBILE_JWT_SECRET no está configurado");
  return secret;
}

export function signAccessToken(userId: number): string {
  return jwt.sign({ sub: String(userId) }, getSecret(), { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): number | null {
  try {
    const payload = jwt.verify(token, getSecret()) as jwt.JwtPayload;
    if (!payload.sub) return null;
    const userId = Number(payload.sub);
    return Number.isFinite(userId) ? userId : null;
  } catch {
    return null;
  }
}

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function issueRefreshToken(userId: number): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(rawToken),
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
  return rawToken;
}

export async function rotateRefreshToken(
  rawToken: string
): Promise<{ userId: number; accessToken: string; refreshToken: string } | null> {
  const tokenHash = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    return null;
  }

  const { count } = await prisma.refreshToken.updateMany({
    where: { id: stored.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  if (count === 0) {
    return null;
  }

  const newRefreshToken = await issueRefreshToken(stored.userId);
  const accessToken = signAccessToken(stored.userId);

  return { userId: stored.userId, accessToken, refreshToken: newRefreshToken };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt) return;

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });
}

export type MobileAuthHandler<C> = (
  req: NextRequest,
  ctx: { userId: number } & C
) => Promise<Response>;

export function withMobileAuth<C = unknown>(handler: MobileAuthHandler<C>) {
  return async (req: NextRequest, routeContext: C): Promise<Response> => {
    const authHeader = req.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice("Bearer ".length);
      const userId = verifyAccessToken(token);

      if (userId === null) {
        return apiError(401, "token_expired", "El access token es inválido o expiró");
      }

      return handler(req, { userId, ...routeContext });
    }

    // No Bearer header — fall back to the web app's own NextAuth session cookie.
    const session = await auth();
    if (session?.user?.id) {
      return handler(req, { userId: Number(session.user.id), ...routeContext });
    }

    return apiError(401, "missing_token", "Falta el header Authorization o la sesión");
  };
}
