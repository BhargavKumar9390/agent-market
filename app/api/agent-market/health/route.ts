import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ status: "inactive" });
    }

    // Ping the health endpoint
    const res = await fetch(`${url}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === "ok") {
        return NextResponse.json({ status: "active" });
      }
    }

    return NextResponse.json({ status: "inactive" });
  } catch (error) {
    return NextResponse.json({ status: "inactive" });
  }
}
