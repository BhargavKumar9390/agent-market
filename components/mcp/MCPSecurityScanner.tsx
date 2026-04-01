"use client";

import { useState } from "react";

const SEVERITY = {
  CRITICAL: { label: "CRITICAL", color: "#ef4444", bg: "#2a0808" },
  HIGH: { label: "HIGH", color: "#f97316", bg: "#1f1008" },
  MEDIUM: { label: "MEDIUM", color: "#eab308", bg: "#1a1500" },
  LOW: { label: "LOW", color: "#22d3ee", bg: "#001a1f" },
  INFO: { label: "INFO", color: "#6b7280", bg: "#111113" },
  PASS: { label: "PASS", color: "#22c55e", bg: "#0a1a0f" },
} as const;

export default function MCPSecurityScanner({
  serverUrl = "",
  token = "",
}: {
  serverUrl?: string;
  token?: string;
}) {
  const [url, setUrl] = useState(serverUrl);
  const [authToken, setAuthToken] = useState(token);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [error, setError] = useState("");

  const scan = async () => {
    if (!url.trim()) return;
    setScanning(true);
    setError("");
    setResults(null);

    try {
      const res = await fetch("/api/mcp/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, token: authToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setResults(data);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setScanning(false);
    }
  };

  const score = results
    ? results.findings.reduce((acc: number, f: any) => {
        if (f.severity === "CRITICAL") return acc - 30;
        if (f.severity === "HIGH") return acc - 15;
        if (f.severity === "MEDIUM") return acc - 8;
        if (f.severity === "LOW") return acc - 3;
        return acc;
      }, 100)
    : null;

  const clampedScore =
    score !== null ? Math.max(0, Math.min(100, score)) : null;

  const scoreColor =
    clampedScore === null
      ? "#6b7280"
      : clampedScore >= 80
        ? "#22c55e"
        : clampedScore >= 50
          ? "#eab308"
          : clampedScore >= 25
            ? "#f97316"
            : "#ef4444";

  const scoreLabel =
    clampedScore === null
      ? "—"
      : clampedScore >= 80
        ? "SAFE"
        : clampedScore >= 50
          ? "CAUTION"
          : clampedScore >= 25
            ? "RISKY"
            : "DANGEROUS";

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.headerLeft}>
          <span style={S.shieldIcon}>🛡</span>
          <div>
            <div style={S.title}>Security Scanner</div>
            <div style={S.subtitle}>
              Checks for tool poisoning, prompt injection & misconfigurations
            </div>
          </div>
        </div>
        {clampedScore !== null && (
          <div style={S.scoreBox}>
            <div
              style={{
                ...S.scoreBadge,
                color: scoreColor,
                borderColor: scoreColor + "44",
              }}
            >
              <span style={S.scoreNum}>{clampedScore}</span>
              <span style={{ ...S.scoreLabel, color: scoreColor }}>
                {scoreLabel}
              </span>
            </div>
          </div>
        )}
      </div>

      <div style={S.inputRow}>
        <input
          style={S.input}
          type="text"
          placeholder="https://your-mcp-server.com/mcp"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && scan()}
        />
        <input
          style={{ ...S.input, width: 180 }}
          type="password"
          placeholder="Token (optional)"
          value={authToken}
          onChange={(e) => setAuthToken(e.target.value)}
        />
        <button
          style={S.scanBtn(scanning || !url.trim())}
          onClick={scan}
          disabled={scanning || !url.trim()}
        >
          {scanning ? (
            <span style={S.scanningText}>Scanning…</span>
          ) : (
            "Run Scan"
          )}
        </button>
      </div>

      {error && <div style={S.errorBanner}>{error}</div>}

      {scanning && (
        <div style={S.progressWrap}>
          <div style={S.progressBar}>
            <div style={S.progressFill} />
          </div>
          <div style={S.progressLabel}>
            Connecting and analysing server metadata…
          </div>
        </div>
      )}

      {results && (
        <div style={S.results}>
          <div style={S.summary}>
            {["CRITICAL", "HIGH", "MEDIUM", "LOW", "PASS"].map((sev) => {
              const count = results.findings.filter(
                (f: any) => f.severity === sev,
              ).length;
              if (count === 0) return null;
              const s = SEVERITY[sev as keyof typeof SEVERITY];
              return (
                <div
                  key={sev}
                  style={{
                    ...S.summaryChip,
                    background: s.bg,
                    borderColor: s.color + "44",
                  }}
                >
                  <span style={{ color: s.color, fontWeight: 700 }}>
                    {count}
                  </span>
                  <span style={{ color: s.color, fontSize: 10 }}>{sev}</span>
                </div>
              );
            })}
            <div style={S.summaryMeta}>
              {results.toolCount} tools · {results.resourceCount} resources ·{" "}
              {results.promptCount} prompts scanned
            </div>
          </div>

          <div style={S.findings}>
            {results.findings.map((f: any, i: number) => {
              const s =
                SEVERITY[f.severity as keyof typeof SEVERITY] || SEVERITY.INFO;
              return (
                <div
                  key={i}
                  style={{
                    ...S.finding,
                    background: s.bg,
                    borderColor: s.color + "33",
                  }}
                >
                  <div style={S.findingHeader}>
                    <span
                      style={{
                        ...S.sevBadge,
                        color: s.color,
                        borderColor: s.color + "55",
                      }}
                    >
                      {f.severity}
                    </span>
                    <span style={S.findingTitle}>{f.title}</span>
                    <span style={S.findingCheck}>{f.check}</span>
                  </div>
                  <div style={S.findingDesc}>{f.description}</div>
                  {f.evidence && (
                    <pre style={{ ...S.evidence, borderColor: s.color + "22" }}>
                      {f.evidence}
                    </pre>
                  )}
                  {f.recommendation && (
                    <div style={S.recommendation}>
                      <span style={S.recIcon}>💡</span>
                      {f.recommendation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={S.footer}>
            Scanned at {new Date(results.scannedAt).toLocaleString()} · This
            scan analyses static metadata only. Runtime behaviour may differ.
          </div>
        </div>
      )}
    </div>
  );
}

const C = {
  bg: "#0d0d0f",
  surface: "#141416",
  border: "#1e1e22",
  text: "#e8e8f0",
  muted: "#5a5a6e",
  accent: "#7c6af7",
  red: "#ef4444",
  green: "#22c55e",
};

const S: any = {
  root: {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    background: C.bg,
    color: C.text,
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    overflow: "hidden",
    fontSize: 13,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: `1px solid ${C.border}`,
    background: C.surface,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  shieldIcon: { fontSize: 24 },
  title: { fontWeight: 700, fontSize: 14, color: C.text },
  subtitle: { fontSize: 11, color: C.muted, marginTop: 2 },
  scoreBox: {},
  scoreBadge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    border: "1px solid",
    borderRadius: 8,
    padding: "8px 16px",
    minWidth: 80,
  },
  scoreNum: { fontSize: 28, fontWeight: 800, lineHeight: 1 },
  scoreLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.1em",
    marginTop: 2,
  },
  inputRow: {
    display: "flex",
    gap: 8,
    padding: "12px 20px",
    borderBottom: `1px solid ${C.border}`,
    background: C.surface,
  },
  input: {
    flex: 1,
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    padding: "8px 12px",
    color: C.text,
    fontFamily: "inherit",
    fontSize: 12,
    outline: "none",
  },
  scanBtn: (disabled: boolean) => ({
    background: disabled ? "#1e1e28" : "#ef4444",
    color: disabled ? C.muted : "#fff",
    border: "none",
    borderRadius: 6,
    padding: "8px 20px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
    transition: "all 0.2s",
  }),
  scanningText: { animation: "pulse 1s infinite" },
  errorBanner: {
    background: "#2a0f0f",
    borderTop: `1px solid ${C.red}44`,
    color: C.red,
    padding: "8px 20px",
    fontSize: 12,
  },
  progressWrap: { padding: "16px 20px" },
  progressBar: {
    height: 3,
    background: "#1e1e22",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    width: "60%",
    background: "#7c6af7",
    borderRadius: 2,
    animation: "progress 1.5s ease-in-out infinite",
  },
  progressLabel: { fontSize: 11, color: C.muted, marginTop: 8 },
  results: { padding: 20, display: "flex", flexDirection: "column", gap: 16 },
  summary: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  summaryChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 600,
  },
  summaryMeta: { fontSize: 11, color: C.muted, marginLeft: "auto" },
  findings: { display: "flex", flexDirection: "column", gap: 10 },
  finding: {
    border: "1px solid",
    borderRadius: 8,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  findingHeader: { display: "flex", alignItems: "center", gap: 8 },
  sevBadge: {
    border: "1px solid",
    borderRadius: 4,
    padding: "1px 7px",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    flexShrink: 0,
  },
  findingTitle: { fontWeight: 600, fontSize: 13, flex: 1 },
  findingCheck: { fontSize: 10, color: C.muted, fontStyle: "italic" },
  findingDesc: { fontSize: 12, color: "#aaa", lineHeight: 1.6 },
  evidence: {
    background: "#08080c",
    border: "1px solid",
    borderRadius: 5,
    padding: "8px 12px",
    fontSize: 11,
    color: "#f97316",
    margin: 0,
    fontFamily: "inherit",
    overflowX: "auto",
    maxHeight: 120,
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },
  recommendation: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    fontSize: 11,
    color: "#22c55e",
    lineHeight: 1.5,
  },
  recIcon: { flexShrink: 0 },
  footer: {
    fontSize: 10,
    color: C.muted,
    textAlign: "center",
    borderTop: `1px solid ${C.border}`,
    paddingTop: 12,
  },
};
