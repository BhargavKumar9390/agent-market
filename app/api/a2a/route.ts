export const dynamic = "force-dynamic";
export const runtime = "edge";

import { NextRequest } from "next/server";

const REMOTE_AGENT = process.env.REMOTE_AGENT_URL!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${REMOTE_AGENT}/.well-known/agent.json`, {
      cache: "no-store",
      signal: controller.signal,
    });

    const data = await res.json();
    return Response.json(data, { headers: CORS_HEADERS });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return new Response("Agent discovery timed out", { status: 504, headers: CORS_HEADERS });
    }
    return new Response("Failed to reach remote agent", { status: 502, headers: CORS_HEADERS });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  const jsonBody = (() => {
    try { return JSON.parse(body); } catch { return {}; }
  })();

  const isStream = jsonBody?.method === "message/stream";

  const controller = new AbortController();
  // longer timeout for streaming responses
  const timeout = setTimeout(() => controller.abort(), isStream ? 120000 : 30000);

  try {
    const upstream = await fetch(`${REMOTE_AGENT}/anime/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": isStream ? "text/event-stream" : "application/json",
      },
      body,
      signal: controller.signal,
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      return new Response(err, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: {
          "Content-Type": upstream.headers.get("Content-Type") || "text/plain",
          ...CORS_HEADERS,
        },
      });
    }

    if (isStream) {
      // Clear timeout — stream duration is unpredictable, agent controls completion
      clearTimeout(timeout);

      const stream = new ReadableStream({
        async start(controller) {
          const reader = upstream.body!.getReader();
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } catch (e) {
            controller.error(e);
          } finally {
            controller.close();
            reader.releaseLock();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
          ...CORS_HEADERS,
        },
      });
    }

    const contentType = upstream.headers.get("Content-Type") || "application/json";
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type": contentType,
        ...CORS_HEADERS,
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return new Response("Request timed out", { status: 504, headers: CORS_HEADERS });
    }
    return new Response("Failed to reach remote agent", { status: 502, headers: CORS_HEADERS });
  } finally {
    clearTimeout(timeout);
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS });
}