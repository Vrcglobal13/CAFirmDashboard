import { NextResponse, type NextRequest } from "next/server";

const WINDOW_MS = 60_000;
const API_LIMIT = 120;
const AUTH_LIMIT = 30;
const buckets = new Map<string, { count: number; resetAt: number; blockedUntil?: number }>();

const securityHeaders: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), payment=(), usb=()",
  "X-DNS-Prefetch-Control": "off"
};

export function buildCspHeader() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const connectSrc = ["'self'"];

  if (supabaseUrl) {
    try {
      const url = new URL(supabaseUrl);
      connectSrc.push(url.origin, `wss://${url.host}`);
    } catch {
      // Invalid env is handled by Supabase client initialization.
    }
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    `connect-src ${connectSrc.join(" ")}`,
    "font-src 'self' data:",
    "upgrade-insecure-requests"
  ].join("; ");
}

export function applySecurityHeaders(response: NextResponse) {
  Object.entries(securityHeaders).forEach(([key, value]) => response.headers.set(key, value));
  response.headers.set("Content-Security-Policy", buildCspHeader());
  return response;
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const allowedOrigins = new Set([
    request.nextUrl.origin,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
  ].filter(Boolean));

  return allowedOrigins.has(origin);
}

function checkRateLimit(key: string, limit: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (current?.blockedUntil && current.blockedUntil > now) {
    return false;
  }

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  current.count += 1;

  if (current.count > limit) {
    current.blockedUntil = now + WINDOW_MS * 5;
    buckets.set(key, current);
    return false;
  }

  buckets.set(key, current);
  return true;
}

export function runRequestSecurity(request: NextRequest) {
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") === "http"
  ) {
    const secureUrl = request.nextUrl.clone();
    secureUrl.protocol = "https:";
    return NextResponse.redirect(secureUrl, 308);
  }

  const isApi = request.nextUrl.pathname.startsWith("/api/");
  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(request.method);

  if (isApi) {
    const ip = getClientIp(request);
    const limit = request.nextUrl.pathname.startsWith("/api/auth") ? AUTH_LIMIT : API_LIMIT;
    const key = `${ip}:${request.nextUrl.pathname}`;

    if (!checkRateLimit(key, limit)) {
      return NextResponse.json({ error: "Too many requests. Please wait and try again." }, { status: 429 });
    }
  }

  if (isApi && isMutation && !isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  return null;
}

export function sanitizeText(value: string, maxLength: number) {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

export async function safeJson(request: Request, maxBytes = 16_384) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return { error: "Expected application/json request body." };
  }

  const raw = await request.text();
  if (!raw || raw.length > maxBytes) {
    return { error: "Request body is empty or too large." };
  }

  try {
    return { data: JSON.parse(raw) as unknown };
  } catch {
    return { error: "Malformed JSON request body." };
  }
}
