import { getAdminClient } from "@/lib/supabase/admin-auth";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

interface ErrorRow {
  id: string;
  created_at: string;
  level: string;
  source: string;
  message: string;
  stack: string | null;
  path: string | null;
  method: string | null;
  status: number | null;
  digest: string | null;
  user_agent: string | null;
  context: Record<string, unknown> | null;
}

export default async function AdminErrorsPage() {
  const { supabase } = await getAdminClient();

  const [{ data, error }, { count: last24h }, { count: total }] = await Promise.all([
    supabase.from("app_errors").select("*").order("created_at", { ascending: false }).limit(100),
    supabase
      .from("app_errors")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 86_400_000).toISOString()),
    supabase.from("app_errors").select("id", { count: "exact", head: true }),
  ]);

  const rows = (data ?? []) as ErrorRow[];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-gradient">Errors</h1>
          <p style={{ color: "#94A3B8", fontSize: "0.95rem", marginTop: 4 }}>
            Uncaught client exceptions, route failures and boundary reports. Newest 100.
          </p>
        </div>
        <div className="flex gap-3">
          <Pill label="Last 24h" value={last24h ?? 0} />
          <Pill label="All time" value={total ?? 0} />
        </div>
      </header>

      {error && (
        <div className="section-card" style={{ padding: "16px 18px", borderColor: "rgba(239,68,68,0.35)" }}>
          <p style={{ color: "#EF4444", fontSize: "0.9rem" }}>
            Could not read the error log: {error.message}
            {error.message.includes("does not exist") && " — apply migration 20261121000001_app_errors.sql."}
          </p>
        </div>
      )}

      {rows.length === 0 && !error ? (
        <div className="section-card" style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
          No errors recorded. That is the expected state.
        </div>
      ) : (
        <div className="section-card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", background: "rgba(255,255,255,0.02)" }}>
                <th style={th}>When</th>
                <th style={th}>Source</th>
                <th style={th}>Message</th>
                <th style={th}>Path</th>
                <th style={th}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid var(--card-border)", verticalAlign: "top" }}>
                  <td style={td} title={row.created_at}>
                    {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background: row.source === "server" ? "rgba(59,130,246,0.12)" : "rgba(239,68,68,0.12)",
                        color: row.source === "server" ? "#3B82F6" : "#EF4444",
                      }}
                    >
                      {row.source}
                    </span>
                  </td>
                  <td style={{ ...td, color: "#E2E8F0", maxWidth: 420 }}>{row.message}</td>
                  <td style={{ ...td, color: "#94A3B8", maxWidth: 220, wordBreak: "break-all" }}>{row.path ?? "—"}</td>
                  <td style={{ ...td, color: "#64748B" }}>
                    {row.stack ? (
                      <details>
                        <summary style={{ cursor: "pointer" }}>stack</summary>
                        <pre
                          style={{
                            marginTop: 8,
                            maxWidth: 520,
                            maxHeight: 220,
                            overflow: "auto",
                            fontSize: "0.72rem",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {row.stack}
                        </pre>
                      </details>
                    ) : (
                      row.digest ?? "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Pill({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        padding: "8px 14px",
        borderRadius: 12,
        border: "1px solid var(--card-border)",
        textAlign: "center",
        minWidth: 96,
      }}
    >
      <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: "0.7rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 16px",
  fontWeight: 600,
  fontSize: "0.72rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#94A3B8",
};

const td: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: "0.82rem",
};
