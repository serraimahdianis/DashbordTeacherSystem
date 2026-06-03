import { NextRequest, NextResponse } from "next/server";

// Backend URL — set via env var or fall back to production
const BACKEND_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

/**
 * Universal proxy handler for all HTTP methods.
 * Forwards /api-proxy/<path> → BACKEND_URL/<path>
 */
async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await params;
  const backendPath = path.join("/");
  const url = new URL(`/${backendPath}`, BACKEND_URL);

  // Forward query string
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  // Build headers — forward relevant ones, skip hop-by-hop headers
  const headers = new Headers();
  const skipHeaders = new Set([
    "host",
    "connection",
    "keep-alive",
    "transfer-encoding",
    "te",
    "trailer",
    "upgrade",
    "proxy-authorization",
    "proxy-authenticate",
  ]);

  req.headers.forEach((value, key) => {
    if (!skipHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  // Read body for non-GET/HEAD requests
  let body: BodyInit | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  try {
    const backendRes = await fetch(url.toString(), {
      method: req.method,
      headers,
      body,
    });

    // Build response — forward status, body, and safe headers
    const responseHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!skipHeaders.has(lower) && lower !== "content-encoding") {
        responseHeaders.set(key, value);
      }
    });

    const responseBody = await backendRes.arrayBuffer();

    return new NextResponse(responseBody, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[api-proxy] Backend request failed:", error);
    return NextResponse.json(
      { error: "Backend unreachable", details: String(error) },
      { status: 502 }
    );
  }
}

// Export all HTTP methods
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
