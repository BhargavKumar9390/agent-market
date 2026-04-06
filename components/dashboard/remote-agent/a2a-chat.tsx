"use client";

// components/A2AChat.tsx

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
} from "react";
import {
  streamMessage,
  getAgentCard,
  ChatMessage,
} from "@/components/dashboard/remote-agent/a2a-client";

// ---------------------------------------------------------------------------
// Styles — defined outside component so they're never recreated on render
// ---------------------------------------------------------------------------

const S = {
  root: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    minHeight: 520,
    background: "#0d0f14",
    border: "1px solid #252934",
    borderRadius: 12,
    overflow: "hidden",
    fontFamily: "'Syne', sans-serif",
    color: "#e2e8f0",
  },
  hdr: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 20px",
    background: "#13161d",
    borderBottom: "1px solid #252934",
    flexShrink: 0,
  },
  hdrName: {
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: ".04em",
    color: "#e2e8f0",
  },
  hdrDesc: {
    fontFamily: "monospace",
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  badge: {
    fontFamily: "monospace",
    fontSize: 10,
    padding: "3px 8px",
    borderRadius: 4,
    background: "#2d5c4a",
    color: "#6ee7b7",
    letterSpacing: ".05em",
    flexShrink: 0,
  },
  msgs: {
    flex: 1,
    overflowY: "auto" as const,
    padding: 20,
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  empty: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    color: "#64748b",
    fontFamily: "monospace",
    fontSize: 12,
    textAlign: "center" as const,
    padding: 40,
  },
  err: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#f87171",
    background: "rgba(248,113,113,.08)",
    border: "1px solid rgba(248,113,113,.2)",
    borderRadius: 8,
    padding: "10px 14px",
    margin: "0 20px 8px",
  },
  inpRow: {
    display: "flex",
    gap: 10,
    padding: "14px 16px",
    background: "#13161d",
    borderTop: "1px solid #252934",
    flexShrink: 0,
  },
  ta: {
    flex: 1,
    background: "#1a1d26",
    border: "1px solid #252934",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#e2e8f0",
    fontFamily: "'Syne', sans-serif",
    fontSize: 13.5,
    resize: "none" as const,
    outline: "none",
    lineHeight: 1.5,
    minHeight: 42,
  },
  hint: {
    fontFamily: "monospace",
    fontSize: 10,
    color: "#64748b",
    padding: "0 16px 10px",
    textAlign: "right" as const,
  },
};

// Dynamic styles — these depend on props so remain as functions
const D = {
  dot: (on: boolean): React.CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
    background: on ? "#6ee7b7" : "#64748b",
    boxShadow: on ? "0 0 8px #6ee7b7" : "none",
  }),
  row: (role: "user" | "agent"): React.CSSProperties => ({
    display: "flex",
    gap: 12,
    flexDirection: role === "user" ? "row-reverse" : "row",
  }),
  av: (role: "user" | "agent"): React.CSSProperties => ({
    width: 30,
    height: 30,
    borderRadius: 8,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "monospace",
    background: role === "user" ? "#1e2235" : "#2d5c4a",
    border: `1px solid ${role === "user" ? "#3d4257" : "#2d5c4a"}`,
    color: "#6ee7b7",
  }),
  bwrap: (role: "user" | "agent"): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    maxWidth: "75%",
    alignItems: role === "user" ? "flex-end" : "flex-start",
  }),
  bub: (role: "user" | "agent"): React.CSSProperties => ({
    padding: "10px 14px",
    borderRadius: 10,
    borderTopRightRadius: role === "user" ? 3 : 10,
    borderTopLeftRadius: role === "agent" ? 3 : 10,
    fontSize: 13.5,
    lineHeight: 1.65,
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
    background: role === "user" ? "#1e2235" : "#13161d",
    border: `1px solid ${role === "user" ? "#3d4257" : "#252934"}`,
    color: "#e2e8f0",
  }),
  btn: (disabled: boolean): React.CSSProperties => ({
    width: 42,
    height: 42,
    background: "#6ee7b7",
    border: "none",
    borderRadius: 8,
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    opacity: disabled ? 0.35 : 1,
    alignSelf: "flex-end",
  }),
  ts: {
    fontFamily: "monospace",
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
    padding: "0 2px",
  } as React.CSSProperties,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type AgentStatus = "connecting" | "ready" | "error";

export default function A2AChat({
  placeholder = "Send a message…",
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [agentDesc, setAgentDesc] = useState<string>("");
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("connecting");
  const [contextId] = useState(() => crypto.randomUUID());
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Fetch agent card on mount
  useEffect(() => {
    getAgentCard()
      .then((c) => {
        setAgentName(c.name);
        setAgentDesc(c.description);
        setAgentStatus("ready");
      })
      .catch(() => {
        setAgentName("Agent");
        setAgentDesc("Could not connect to agent");
        setAgentStatus("error");
      });
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    if (taRef.current) taRef.current.style.height = "auto";

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      timestamp: new Date(),
    };
    const agentId = crypto.randomUUID();
    const agentMsg: ChatMessage = {
      id: agentId,
      role: "agent",
      text: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, agentMsg]);
    setLoading(true);
    setStreamingId(agentId);

    try {
      for await (const chunk of streamMessage(text, contextId)) {
        // Only append non-empty chunks to avoid cursor flicker
        if (chunk) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentId ? { ...m, text: m.text + chunk } : m
            )
          );
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      // Remove the empty agent placeholder on failure
      setMessages((prev) => prev.filter((m) => m.id !== agentId));
    } finally {
      setLoading(false);
      setStreamingId(null);
    }
  }, [input, loading, contextId]);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const fmt = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const canSend = !!input.trim() && !loading;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700&display=swap');
        .a2a-ta:focus { border-color: #3d4257 !important; }
        .a2a-ta::placeholder { color: #64748b; }
        .a2a-streaming::after {
          content: '▋';
          color: #6ee7b7;
          animation: a2a-blink .8s step-end infinite;
        }
        @keyframes a2a-blink { 50% { opacity: 0; } }
        .a2a-msg { animation: a2a-in .2s ease; }
        @keyframes a2a-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>

      <div style={S.root} className={className}>
        {/* Header */}
        <div style={S.hdr}>
          <span style={D.dot(agentStatus === "ready")} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.hdrName}>{agentName ?? "Agent"}</div>
            <div style={S.hdrDesc}>
              {agentStatus === "connecting"
                ? "Connecting…"
                : agentStatus === "error"
                  ? "Connection failed"
                  : agentDesc}
            </div>
          </div>
          <span style={S.badge}>A2A</span>
        </div>

        {/* Messages */}
        <div style={S.msgs}>
          {messages.length === 0 && (
            <div style={S.empty}>
              <span style={{ fontSize: 28, opacity: 0.35 }}>⬡</span>
              <span>
                {agentStatus === "ready"
                  ? `Connected to ${agentName}`
                  : agentStatus === "error"
                    ? "Could not reach agent — check your connection"
                    : "Connecting to agent…"}
              </span>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className="a2a-msg" style={D.row(m.role)}>
              <div style={D.av(m.role)}>{m.role === "user" ? "U" : "A"}</div>
              <div style={D.bwrap(m.role)}>
                <div
                  style={D.bub(m.role)}
                  className={m.id === streamingId ? "a2a-streaming" : ""}
                >
                  {/* Show placeholder dots only while awaiting first chunk */}
                  {m.text || (m.id === streamingId ? "" : "…")}
                </div>
                <div style={D.ts}>{fmt(m.timestamp)}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Error banner */}
        {error && <div style={S.err}>⚠ {error}</div>}

        {/* Input row */}
        <div style={S.inpRow}>
          <textarea
            ref={taRef}
            className="a2a-ta"
            style={S.ta}
            value={input}
            placeholder={placeholder}
            disabled={loading}
            rows={1}
            onChange={(e) => {
              const el = e.target;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
              setInput(el.value);
            }}
            onKeyDown={handleKey}
          />
          <button
            style={D.btn(!canSend)}
            disabled={!canSend}
            onClick={handleSend}
            aria-label="Send message"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0d0f14"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <div style={S.hint}>↵ Send · ⇧↵ New line</div>
      </div>
    </>
  );
}