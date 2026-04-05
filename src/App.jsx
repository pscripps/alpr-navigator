import { useState, useMemo } from "react";
import statuteData from "./data/alpr-statutes.json";

const RAW = statuteData.data;
const DATA = Object.fromEntries(RAW.map(s => [s.abbr, s]));

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GLOBAL = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #F5F2EE; }
  button { cursor: pointer; font-family: inherit; border: none; background: none; }
  .tile { transition: transform 0.1s ease, box-shadow 0.1s ease; cursor: pointer; }
  .tile:hover { transform: scale(1.15); z-index: 20; box-shadow: 0 4px 14px rgba(0,0,0,0.25); }
  .tile.selected { transform: scale(1.18); z-index: 30; box-shadow: 0 0 0 2px #F5F2EE, 0 0 0 4px #1A1A1A; }
  .panel { animation: slideIn 0.22s ease; }
  @keyframes slideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
  .door { transition: transform 0.15s ease, box-shadow 0.15s ease; }
  .door:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
`;

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────
const S = {
  forbidden:             { label: "Prohibited",            bg: "#1C1C2E", fg: "#fff" },
  legal_review_required: { label: "Consult Legal",         bg: "#B06020", fg: "#fff" },
  narrow:                { label: "Specific Uses Only",    bg: "#5A4E88", fg: "#fff" },
  permitted:             { label: "Permitted",             bg: "#2C6A9C", fg: "#fff" },
  silent:                { label: "No Specific Law",       bg: "#888",    fg: "#fff" },
};
const RISK_ORDER = ["forbidden", "legal_review_required", "narrow", "permitted", "silent"];
const riskRank = s => RISK_ORDER.indexOf(s);
const worstOf = (a, b) => riskRank(a) <= riskRank(b) ? a : b;

function Pill({ status, sm }) {
  const c = S[status] || S.silent;
  return (
    <span style={{
      display: "inline-block", background: c.bg, color: c.fg,
      padding: sm ? "2px 7px" : "3px 10px",
      borderRadius: 3, fontSize: sm ? 10 : 11,
      fontFamily: "'DM Mono', monospace", fontWeight: 500,
      letterSpacing: "0.04em", whiteSpace: "nowrap",
    }}>{c.label}</span>
  );
}

// ─── TILE GRID POSITIONS [col, row] ──────────────────────────────────────────
const GRID = {
  ME:[11,0],
  VT:[10,0], NH:[11,1],
  WA:[0,1],MT:[1,1],ND:[2,1],MN:[3,1],WI:[5,1],MI:[6,1],NY:[9,1],MA:[10,1],
  OR:[0,2],ID:[1,2],WY:[2,2],SD:[3,2],IA:[4,2],IL:[5,2],IN:[6,2],OH:[7,2],PA:[8,2],NJ:[9,2],CT:[10,2],RI:[11,2],
  CA:[0,3],NV:[1,3],UT:[2,3],CO:[3,3],NE:[4,3],MO:[5,3],KY:[6,3],WV:[7,3],VA:[8,3],MD:[9,3],DE:[10,3],DC:[11,3],
  AZ:[1,4],NM:[2,4],KS:[3,4],AR:[4,4],TN:[5,4],NC:[6,4],SC:[7,4],
  OK:[3,5],LA:[4,5],MS:[5,5],AL:[6,5],GA:[7,5],FL:[8,5],
  TX:[3,6],
  AK:[0,7],HI:[2,7],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function tileColor(abbr, track) {
  const d = DATA[abbr];
  if (!d) return S.silent.bg;
  if (track === "both") {
    const ws = worstOf(d.private.status, d.le.status);
    return S[ws]?.bg || S.silent.bg;
  }
  return S[d[track]?.status]?.bg || S.silent.bg;
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(RAW, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "alpr-statutes.json"; a.click();
}

function exportCSV() {
  const headers = [
    "state","abbr",
    "private_status","private_summary","private_retention","private_data_sharing",
    "private_can_users_sue","private_suit_notes","private_notable_points","private_litigation",
    "le_status","le_summary","le_retention","le_data_sharing",
    "le_can_users_sue","le_suit_notes","le_notable_points","le_litigation",
    "statute_citation","new_statute","watch","watch_note","last_verified"
  ];
  const rows = RAW.map(s => [
    `"${s.name}"`, s.abbr,
    s.private.status,
    `"${(s.private.summary||"").replace(/"/g,'""')}"`,
    `"${(s.private.retention||"").replace(/"/g,'""')}"`,
    `"${(s.private.data_sharing||"").replace(/"/g,'""')}"`,
    s.private.pra?.alpr_specific === true ? "Yes" : s.private.pra?.alpr_specific === false ? "No" : "Pending verification",
    `"${(s.private.pra?.notes||"").replace(/"/g,'""')}"`,
    `"${(s.private.notable_points||[]).join("; ").replace(/"/g,'""')}"`,
    `"${(s.private.litigation||[]).join("; ").replace(/"/g,'""')}"`,
    s.le.status,
    `"${(s.le.summary||"").replace(/"/g,'""')}"`,
    `"${(s.le.retention||"").replace(/"/g,'""')}"`,
    `"${(s.le.data_sharing||"").replace(/"/g,'""')}"`,
    s.le.pra?.alpr_specific === true ? "Yes" : s.le.pra?.alpr_specific === false ? "No" : "Pending verification",
    `"${(s.le.pra?.notes||"").replace(/"/g,'""')}"`,
    `"${(s.le.notable_points||[]).join("; ").replace(/"/g,'""')}"`,
    `"${(s.le.litigation||[]).join("; ").replace(/"/g,'""')}"`,
    `"${(s.statute?.citation||"").replace(/"/g,'""')}"`,
    s.meta.new_statute ? "Yes" : "No",
    s.meta.watch ? "Yes" : "No",
    `"${(s.meta.watch_note||"").replace(/"/g,'""')}"`,
    s.meta.last_verified
  ].join(","));
  const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "alpr-statutes.csv"; a.click();
}

// ─── STATE DETAIL PANEL ───────────────────────────────────────────────────────
function TrackDetail({ track }) {
  const pra = track.pra;
  const praText = pra.alpr_specific === true ? `Yes — ${pra.notes}` :
    pra.alpr_specific === false ? "No ALPR-specific private right of action." :
    `Unverified — ${pra.notes}`;

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Pill status={track.status} />
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "#222", marginBottom: 16 }}>{track.summary}</p>

      {(track.retention || track.data_sharing) && (
        <div style={{ background: "#F5F2EE", borderRadius: 6, padding: "12px 14px", marginBottom: 12 }}>
          {track.retention && (
            <div style={{ marginBottom: track.data_sharing ? 8 : 0 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Retention</span>
              <p style={{ fontSize: 13, color: "#333", marginTop: 2 }}>{track.retention}</p>
            </div>
          )}
          {track.data_sharing && (
            <div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Data Sharing</span>
              <p style={{ fontSize: 13, color: "#333", marginTop: 2 }}>{track.data_sharing}</p>
            </div>
          )}
        </div>
      )}

      <div style={{ background: pra.alpr_specific === true ? "#FFF3E0" : "#F5F2EE", borderRadius: 6, padding: "10px 14px", marginBottom: 12, borderLeft: pra.alpr_specific === true ? "3px solid #B06020" : "none" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Can users sue you directly?</span>
        <p style={{ fontSize: 13, color: pra.alpr_specific === true ? "#7A3A00" : "#333", marginTop: 2, fontWeight: pra.alpr_specific === true ? 500 : 400 }}>{praText}</p>
      </div>

      {track.notable_points.length > 0 && (
        <div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Notable Points</span>
          <ul style={{ listStyle: "none", marginTop: 6 }}>
            {track.notable_points.map((p, i) => (
              <li key={i} style={{ fontSize: 13, color: "#333", lineHeight: 1.5, paddingLeft: 14, position: "relative", marginBottom: 5 }}>
                <span style={{ position: "absolute", left: 0, color: "#999" }}>—</span>{p}
              </li>
            ))}
          </ul>
        </div>
      )}
      {track.litigation?.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, color: "#A0282A", textTransform: "uppercase", letterSpacing: "0.08em" }}>Active Litigation</span>
          <ul style={{ listStyle: "none", marginTop: 6 }}>
            {track.litigation.map((l, i) => (
              <li key={i} style={{ fontSize: 13, color: "#7A1A1A", lineHeight: 1.5, paddingLeft: 14, position: "relative", marginBottom: 5, background: "#FFF5F5", borderRadius: 4, padding: "6px 10px 6px 10px" }}>
                {l}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatePanel({ abbr, onClose }) {
  const d = DATA[abbr];
  const [activeTrack, setActiveTrack] = useState("private");
  if (!d) return null;

  return (
    <div className="panel" style={{ background: "#fff", borderRadius: 8, padding: 24, height: "100%", overflowY: "auto", boxShadow: "-4px 0 20px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: "#1A1A1A" }}>{d.name}</h2>
            {d.meta?.new_statute && <span style={{ fontFamily:"'DM Mono', monospace", fontSize:9, fontWeight:500, background:"#1C1C2E", color:"#fff", padding:"2px 6px", borderRadius:3, letterSpacing:"0.06em" }}>NEW LAW</span>}
          </div>
          {d.statute?.citation && (
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#888", marginTop: 4 }}>
              {d.statute.url ? <a href={d.statute.url} target="_blank" rel="noreferrer" style={{ color: "#888", textDecoration: "underline" }}>{d.statute.citation}</a> : d.statute.citation}
              {d.statute.url_type === "official" && <span style={{ marginLeft: 6, background: "#E8F5E9", color: "#2E7D32", fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 500 }}>OFFICIAL</span>}
              {!d.statute.url && d.statute.url_fallback && <a href={d.statute.url_fallback} target="_blank" rel="noreferrer" style={{ marginLeft: 8, color: "#aaa", fontSize: 10 }}>free mirror ↗</a>}
              {d.statute.url_bill && <a href={d.statute.url_bill} target="_blank" rel="noreferrer" style={{ marginLeft: 8, color: "#aaa", fontSize: 10 }}>bill text ↗</a>}
            </p>
          )}
          {!d.statute?.exists && <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#aaa", marginTop: 4 }}>No enacted statute</p>}
        </div>
        <button onClick={onClose} style={{ color: "#aaa", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>✕</button>
      </div>

      {d.meta?.new_statute && (
        <div style={{ background:"#1C1C2E", borderRadius:6, padding:"8px 12px", marginBottom:10, fontSize:12, color:"#FFD700", display:"flex", gap:8, alignItems:"flex-start" }}>
          <span style={{ flexShrink:0 }}>●</span>
          <span><strong>Recently enacted or amended</strong>{d.meta.new_statute_note ? ` — ${d.meta.new_statute_note}` : ""}</span>
        </div>
      )}
      {d.meta?.watch && (
        <div style={{ background:"#FFF8E1", border:"1px solid #FFD54F", borderRadius:6, padding:"8px 12px", marginBottom:10, fontSize:12, color:"#7A5800", display:"flex", gap:8, alignItems:"flex-start" }}>
          <span style={{ flexShrink:0 }}>●</span>
          <span><strong>Watch:</strong> {d.meta.watch_note}</span>
        </div>
      )}
      {d.meta.needs_review && (
        <div style={{ background: "#FFF8E1", border: "1px solid #FFD54F", borderRadius: 6, padding: "8px 12px", marginBottom: 16, fontSize: 12, color: "#7A5800" }}>
          ⚠ {d.meta.review_note || "This entry needs verification before relying on it."}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["private","le"].map(t => (
          <button key={t} onClick={() => setActiveTrack(t)} style={{ padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: activeTrack === t ? "#1A1A1A" : "#eee", color: activeTrack === t ? "#fff" : "#555", transition: "all 0.15s" }}>
            {t === "private" ? "Private Enterprise" : "Law Enforcement"}
          </button>
        ))}
      </div>

      <TrackDetail track={d[activeTrack]} />

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#bbb" }}>Verified {d.meta.last_verified}</span>
      </div>
    </div>
  );
}

// ─── MAP VIEW ─────────────────────────────────────────────────────────────────
function MapView({ onBack }) {
  const [track, setTrack] = useState("both");
  const [selected, setSelected] = useState(null);
  const CELL = 46;

  const maxCol = Math.max(...Object.values(GRID).map(([c]) => c));
  const maxRow = Math.max(...Object.values(GRID).map(([,r]) => r));

  return (
    <div style={{ minHeight: "100vh", background: "#F5F2EE" }}>
      <div style={{ background: "#1A1A1A", color: "#fff", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ color: "#aaa", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>← back</button>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, flex: 1 }}>ALPR Statute Landscape</h1>
        <div style={{ display: "flex", gap: 6 }}>
          {[["both","Both"],["private","Private"],["le","LE"]].map(([v,l]) => (
            <button key={v} onClick={() => setTrack(v)} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontFamily: "'DM Mono', monospace", background: track === v ? "#fff" : "transparent", color: track === v ? "#1A1A1A" : "#aaa", border: track === v ? "none" : "1px solid #444", transition: "all 0.15s" }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 0 }}>
        <div style={{ flex: 1, padding: "24px 24px 24px", overflowX: "auto" }}>
          {/* Legend */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
            {Object.entries(S).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: v.bg, flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#444", whiteSpace: "nowrap" }}>{v.label}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: "#888", flexShrink: 0, position:"relative" }}>
                <span style={{ position:"absolute", top:3, right:3, width:5, height:5, borderRadius:"50%", background:"#FFD700" }} />
              </div>
              <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#444", whiteSpace: "nowrap" }}>Recently changed or watch item</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: "#888", flexShrink: 0, position:"relative" }}>
                <span style={{ position:"absolute", top:3, right:3, width:0, height:0, borderLeft:"3px solid transparent", borderRight:"3px solid transparent", borderBottom:"6px solid #A0282A" }} />
              </div>
              <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#444", whiteSpace: "nowrap" }}>Active litigation</span>
            </div>
          </div>

          {/* Tile Grid */}
          <div style={{ position: "relative", width: (maxCol + 1) * CELL + maxCol * 2, height: (maxRow + 1) * CELL + maxRow * 2 }}>
            {Object.entries(GRID).map(([abbr, [col, row]]) => {
              const bg = tileColor(abbr, track);
              const isSel = selected === abbr;
              return (
                <div key={abbr} className={`tile${isSel ? " selected" : ""}`}
                  onClick={() => setSelected(isSel ? null : abbr)}
                  style={{ position: "absolute", left: col * (CELL + 2), top: row * (CELL + 2), width: CELL, height: CELL, background: bg, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, userSelect: "none" }}>
                  {abbr}
                  {(DATA[abbr]?.meta?.new_statute || DATA[abbr]?.meta?.watch) && <span style={{ position:"absolute", top:3, right:3, width:5, height:5, borderRadius:"50%", background:"#FFD700" }} />}
                  {(DATA[abbr]?.private?.litigation?.length > 0 || DATA[abbr]?.le?.litigation?.length > 0) && (
                    <span style={{ position:"absolute", top:3, right: (DATA[abbr]?.meta?.new_statute || DATA[abbr]?.meta?.watch) ? 11 : 3, width:0, height:0, borderLeft:"3px solid transparent", borderRight:"3px solid transparent", borderBottom:"6px solid #A0282A" }} />
                  )}
                </div>
              );
            })}
          </div>

          <p style={{ marginTop: 24, fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#bbb" }}>
            Data last verified April 2026 · This tool demonstrates methodology, not production compliance software · Always verify against current statute text
          </p>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ width: 380, minHeight: "calc(100vh - 52px)", borderLeft: "1px solid #e5e5e5", flexShrink: 0 }}>
            <StatePanel abbr={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WIZARD VIEW ──────────────────────────────────────────────────────────────
function WizardView({ onBack }) {
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [selectedState, setSelectedState] = useState(null);

  const ranked = useMemo(() => {
    if (!selectedTrack) return [];
    const tracks = selectedTrack === "both" ? ["private", "le"] : [selectedTrack];
    return RAW
      .map(s => {
        const status = selectedTrack === "both"
          ? worstOf(s.private.status, s.le.status)
          : s[selectedTrack].status;
        return { ...s, status };
      })
      .sort((a, b) => {
        const rA = riskRank(a.status), rB = riskRank(b.status);
        if (rA !== rB) return rA - rB;
        if (a.status === "silent") {
          const hasContent = s => tracks.some(t => s[t].notable_points?.length > 0 || s[t].retention || s[t].data_sharing);
          const aHas = hasContent(a) ? 0 : 1;
          const bHas = hasContent(b) ? 0 : 1;
          if (aHas !== bHas) return aHas - bHas;
        }
        return a.name.localeCompare(b.name);
      });
  }, [selectedTrack]);

  return (
    <div style={{ minHeight: "100vh", background: "#F5F2EE" }}>
      <div style={{ background: "#1A1A1A", color: "#fff", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ color: "#aaa", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>← back</button>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600 }}>Build Assessment</h1>
      </div>

      <div style={{ display: "flex", gap: 0 }}>
        <div style={{ flex: 1, padding: 32, maxWidth: 680 }}>
          {!selectedTrack ? (
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 8 }}>Who are you deploying for?</h2>
              <p style={{ color: "#666", marginBottom: 28, fontSize: 14 }}>Your answer determines which statutory regime applies. Private enterprise and law enforcement operate under different rules in most states.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  ["private", "Private Enterprise or Personal Use", "Commercial operators, fleet managers, retail, parking, real estate — and individuals using ALPR for personal purposes"],
                  ["le",      "Law Enforcement",                    "Police, sheriff, and other government agencies"],
                  ["both",    "Both / Not Sure",                    "Show the worst-case across both tracks — useful if your product serves multiple user types"],
                ].map(([v, label, desc]) => (
                  <button key={v} className="door" onClick={() => setSelectedTrack(v)} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 10, padding: "20px 24px", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 13, color: "#777" }}>{desc}</div>
                    </div>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#aaa", marginLeft: 16 }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <button onClick={() => { setSelectedTrack(null); setSelectedState(null); }} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#aaa", textDecoration: "underline" }}>← back</button>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20 }}>
                  {selectedTrack === "private" ? "Private Enterprise & Personal Use" : selectedTrack === "le" ? "Law Enforcement" : "Both Tracks"} — all states by risk
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {selectedTrack === "both" && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 14px 8px", borderBottom: "1px solid #eee", marginBottom: 4 }}>
                  <div style={{ width: 32 }} />
                  <div style={{ flex: 1 }} />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#bbb", letterSpacing: "0.06em" }}>PRIVATE</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#bbb", letterSpacing: "0.06em" }}>LE</span>
                  </div>
                </div>
              )}
              {ranked.map(s => {
                  const hasContent = selectedTrack === "both"
                    ? (s.private.notable_points?.length > 0 || s.private.retention || s.private.data_sharing ||
                       s.le.notable_points?.length > 0 || s.le.retention || s.le.data_sharing)
                    : (s[selectedTrack]?.notable_points?.length > 0 || s[selectedTrack]?.retention || s[selectedTrack]?.data_sharing);
                  return (
                  <button key={s.abbr} onClick={() => setSelectedState(selectedState === s.abbr ? null : s.abbr)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: selectedState === s.abbr ? "#fff" : "transparent", borderRadius: 6, textAlign: "left", transition: "background 0.1s", border: selectedState === s.abbr ? "1px solid #ddd" : "1px solid transparent" }}>
                    <div style={{ width: 32, fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500, color: "#555", flexShrink: 0 }}>{s.abbr}</div>
                    <div style={{ flex: 1, fontSize: 13, color: "#333" }}>{s.name}</div>
                    {s.status === "silent" && hasContent && (
                      <span title="Some requirements exist" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#888", background: "#eee", padding: "1px 5px", borderRadius: 3, flexShrink: 0 }}>thin coverage</span>
                    )}
                    {selectedTrack === "both" ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#aaa" }}>Private</span>
                            <Pill status={s.private.status} sm />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#aaa" }}>LE</span>
                            <Pill status={s.le.status} sm />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Pill status={s.status} sm />
                    )}
                    {s.meta?.needs_review && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#B06020", background: "#FFF3E0", padding: "1px 5px", borderRadius: 3, flexShrink: 0 }}>VERIFY</span>}
                  </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {selectedState && (
          <div style={{ width: 400, minHeight: "calc(100vh - 52px)", borderLeft: "1px solid #e5e5e5", flexShrink: 0 }}>
            <StatePanel abbr={selectedState} onClose={() => setSelectedState(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DATA VIEW ────────────────────────────────────────────────────────────────
function DataView({ onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F5F2EE" }}>
      <div style={{ background: "#1A1A1A", color: "#fff", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ color: "#aaa", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>← back</button>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600 }}>Raw Data</h1>
      </div>

      <div style={{ maxWidth: 640, margin: "60px auto", padding: "0 24px" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 12 }}>Download the dataset</h2>
        <p style={{ color: "#555", fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          The underlying data is structured JSON — every statute entry, both tracks, PRA status, retention requirements, and source citations.
          Use it to build your own tools, extend it to other statute categories, or verify the underlying entries yourself.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
          <button onClick={exportJSON} style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: "16px 20px", textAlign: "left" }}>
            <div style={{ background: "#1A1A1A", color: "#fff", borderRadius: 4, padding: "6px 10px", fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500 }}>JSON</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Download as JSON</div>
              <div style={{ fontSize: 12, color: "#888" }}>All fields, both tracks, nested structure.</div>
            </div>
          </button>
          <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: "16px 20px", textAlign: "left" }}>
            <div style={{ background: "#2C6A9C", color: "#fff", borderRadius: 4, padding: "6px 10px", fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500 }}>CSV</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Download as CSV</div>
              <div style={{ fontSize: 12, color: "#888" }}>All fields, both tracks. Multiple values in a cell are semicolon-separated.</div>
            </div>
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 8, padding: 20, border: "1px solid #e8e8e8" }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#888", lineHeight: 1.8 }}>
            <strong style={{ color: "#555" }}>Data notes</strong><br/>
            Last verified: April 2026<br/>
            States with enacted statutes: 25 (DC statute exists but is unfunded and not yet effective)<br/>
            This data demonstrates methodology. Always verify against current statute text before relying on it professionally.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── RECENT CHANGES VIEW ─────────────────────────────────────────────────────
function RecentView({ onBack }) {
  const [selected, setSelected] = useState(null);

  const newStatutes = RAW.filter(s => s.meta?.new_statute);
  const watchItems  = RAW.filter(s => s.meta?.watch);
  const litigation  = RAW.filter(s =>
    s.private?.litigation?.length > 0 || s.le?.litigation?.length > 0
  );

  function Section({ title, dot, items, emptyText }) {
    return (
      <div style={{ marginBottom: 36 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          {dot}
          <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:20, fontWeight:600 }}>{title}</h2>
        </div>
        {items.length === 0
          ? <p style={{ fontSize:13, color:"#aaa", fontFamily:"'DM Mono', monospace" }}>{emptyText}</p>
          : items.map(s => (
            <button key={s.abbr} onClick={() => setSelected(selected === s.abbr ? null : s.abbr)}
              style={{ display:"flex", alignItems:"flex-start", gap:16, width:"100%", textAlign:"left", background: selected === s.abbr ? "#fff" : "#F5F2EE", border: selected === s.abbr ? "1px solid #ddd" : "1px solid transparent", borderRadius:8, padding:"14px 16px", marginBottom:8, transition:"background 0.1s" }}>
              <div style={{ fontFamily:"'DM Mono', monospace", fontSize:12, fontWeight:500, color:"#555", paddingTop:2, flexShrink:0 }}>{s.abbr}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:500, color:"#1A1A1A", marginBottom:4 }}>{s.name}</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <Pill status={s.private.status} sm />
                  {s.private.status !== s.le.status && <Pill status={s.le.status} sm />}
                </div>
                {s.meta?.new_statute_note && <p style={{ fontSize:12, color:"#555", marginTop:6, lineHeight:1.5 }}>{s.meta.new_statute_note}</p>}
                {s.meta?.watch_note && <p style={{ fontSize:12, color:"#7A5800", marginTop:4, lineHeight:1.5 }}>⚠ {s.meta.watch_note}</p>}
                {(s.private?.litigation?.length > 0) && s.private.litigation.map((l,i) => (
                  <p key={i} style={{ fontSize:12, color:"#7A1A1A", marginTop:4, lineHeight:1.5 }}>▲ {l}</p>
                ))}
              </div>
            </button>
          ))
        }
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#F5F2EE" }}>
      <div style={{ background:"#1A1A1A", color:"#fff", padding:"14px 24px", display:"flex", alignItems:"center", gap:16 }}>
        <button onClick={onBack} style={{ color:"#aaa", fontSize:12, fontFamily:"'DM Mono', monospace" }}>← back</button>
        <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:18, fontWeight:600 }}>What's Changed Recently</h1>
      </div>

      <div style={{ display:"flex", gap:0 }}>
        <div style={{ flex:1, padding:"32px 32px 48px", maxWidth:700 }}>
          <Section
            title="New or Recently Amended"
            dot={<span style={{ width:10, height:10, borderRadius:"50%", background:"#FFD700", flexShrink:0, display:"inline-block" }} />}
            items={newStatutes}
            emptyText="No statutes enacted or amended in the last two years."
          />
          <Section
            title="Watch Items"
            dot={<span style={{ width:10, height:10, borderRadius:"50%", background:"#FFD700", border:"2px solid #B08800", flexShrink:0, display:"inline-block" }} />}
            items={watchItems}
            emptyText="No active watch items."
          />
          <Section
            title="Active Litigation"
            dot={<span style={{ display:"inline-block", width:0, height:0, borderLeft:"6px solid transparent", borderRight:"6px solid transparent", borderBottom:"10px solid #A0282A", flexShrink:0 }} />}
            items={litigation}
            emptyText="No active litigation tracked."
          />
        </div>

        {selected && (
          <div style={{ width:400, minHeight:"calc(100vh - 52px)", borderLeft:"1px solid #e5e5e5", flexShrink:0 }}>
            <StatePanel abbr={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  );
}


function Landing({ onNavigate }) {
  const doors = [
    { key: "wizard", icon: "01", title: "I'm building a product", sub: "See which states are highest risk for your deployment. Ranked list, both tracks.", accent: "#1C1C2E" },
    { key: "map",    icon: "02", title: "I want to understand the landscape", sub: "50-state tile map colored by status. Click any state for the full picture.", accent: "#2C6A9C" },
    { key: "data",   icon: "03", title: "Give me the data", sub: "Download the full dataset as JSON or CSV. Build your own tools.", accent: "#5A4E88" },
  ];

  const recentCount = RAW.filter(s => s.meta?.new_statute || s.meta?.watch).length;
  const litigationCount = RAW.filter(s => s.private?.litigation?.length > 0 || s.le?.litigation?.length > 0).length;

  return (
    <div style={{ minHeight: "100vh", background: "#F5F2EE", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "48px 48px 0" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#aaa", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>US ALPR Law · April 2026</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 600, lineHeight: 1.15, color: "#1A1A1A", maxWidth: 560 }}>
          Automatic License Plate Reader<br/><em style={{ fontWeight: 400, fontStyle: "italic", color: "#555" }}>Statute Navigator</em>
        </h1>
        <p style={{ marginTop: 16, fontSize: 15, color: "#666", lineHeight: 1.7, maxWidth: 480 }}>
          50-state coverage. Two tracks: private enterprise and law enforcement. Built by a privacy lawyer with direct domain expertise.
        </p>
      </div>

      <div style={{ padding: "40px 48px 0", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Three main doors */}
        <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
          {doors.map(d => (
            <button key={d.key} className="door" onClick={() => onNavigate(d.key)}
              style={{ flex: 1, background: "#fff", borderRadius: 10, padding: "28px 24px", textAlign: "left", border: "1px solid #e8e8e8", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, color: d.accent, letterSpacing: "0.08em", marginBottom: 4 }}>{d.icon}</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.3 }}>{d.title}</div>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6, flex: 1 }}>{d.sub}</div>
              <div style={{ paddingTop: 16, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ height: 2, flex: 1, background: d.accent, borderRadius: 1 }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: d.accent, fontWeight: 500 }}>GO →</span>
              </div>
            </button>
          ))}
        </div>

        {/* New developments strip — same width, flush with boxes */}
        <button className="door" onClick={() => onNavigate("recent")}
          style={{ background: "#fff", borderRadius: 8, padding: "14px 20px", textAlign: "left", border: "1px solid #e8e8e8", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 16, width: "100%" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFD700", display: "inline-block" }} />
            <span style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: "8px solid #A0282A", display: "inline-block" }} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, color: "#555" }}>New developments</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#aaa", marginLeft: 12 }}>
              {recentCount} state{recentCount !== 1 ? "s" : ""} with recent legislative activity · {litigationCount} with active litigation
            </span>
          </div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#aaa" }}>VIEW →</span>
        </button>
      </div>

      <div style={{ padding: "16px 48px 32px" }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#bbb" }}>
          Data last verified April 2026 · ALPR statutes only · Always verify against current statute text before relying on it professionally
        </p>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("landing");
  return (
    <div>
      <style>{GLOBAL}</style>
      {view === "landing" && <Landing onNavigate={setView} />}
      {view === "map"     && <MapView onBack={() => setView("landing")} />}
      {view === "wizard"  && <WizardView onBack={() => setView("landing")} />}
      {view === "recent"  && <RecentView onBack={() => setView("landing")} />}
      {view === "data"    && <DataView onBack={() => setView("landing")} />}
    </div>
  );
}
