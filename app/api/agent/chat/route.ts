import { NextRequest, NextResponse } from "next/server";

// Proxy for ADK Cloud Run calls to avoid CORS.
// Handles both session creation and /run in one endpoint.
//
// POST /api/agent/chat
// Body: { action: "create_session" | "run", cloudRunUrl, appName, userId, sessionId, message? }

export async function POST(req: NextRequest) {
  try {
    const { action, cloudRunUrl, appName, userId, sessionId, message } =
      await req.json();

    if (!cloudRunUrl || !appName || !userId || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields: cloudRunUrl, appName, userId, sessionId" },
        { status: 400 }
      );
    }

    if (action === "create_session") {
      const res = await fetch(
        `${cloudRunUrl}/apps/${appName}/users/${userId}/sessions/${sessionId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      // 409 = already exists, treat as success
      if (!res.ok && res.status !== 409) {
        const errText = await res.text();
        return NextResponse.json(
          { error: `Session creation failed (${res.status}): ${errText}` },
          { status: res.status }
        );
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "run") {
      if (!message) {
        return NextResponse.json(
          { error: "Missing required field: message" },
          { status: 400 }
        );
      }

      const res = await fetch(`${cloudRunUrl}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_name: appName,
          user_id: userId,
          session_id: sessionId,
          new_message: {
            role: "user",
            parts: [{ text: message }],
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json(
          { error: `Agent error (${res.status}): ${errText}` },
          { status: res.status }
        );
      }

      const events = await res.json();
      return NextResponse.json({ events });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("ADK proxy error:", err);
    return NextResponse.json(
      { error: err.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
