import { Link } from "react-router-dom";
import EDSNav from "../components/eds/EDSNav";
import EDSFooter from "../components/eds/EDSFooter";
import { useEffect, useRef } from "react";

const CAPABILITIES = [
  {
    icon: "⬡",
    accent: "#2e5bff",
    title: "Behavioral Synthesis",
    sub: "DNA-Level Detection",
    body: "ASHE bypasses signature-based detection entirely. By mapping the behavioral DNA of every packet, session, and user action, it identifies Zero-Day anomalies before they materialize into breaches.",
  },
  {
    icon: "◈",
    accent: "#39ff14",
    title: "Contextual Logic",
    sub: "Predictive Intelligence",
    body: "Correlating millions of disparate events in real time, ASHE constructs a living narrative of your security posture — surfacing low-and-slow APT tactics that traditional SIEMs never see.",
  },
  {
    icon: "⟳",
    accent: "#00e5c8",
    title: "Autonomous Growth",
    sub: "Self-Evolving Defense",
    body: "Every mitigated threat becomes a new neuron in ASHE's logic matrix. Your defense grows harder, faster, and smarter with every event — compounding intelligence across the EDS-360 ecosystem.",
  },
];

const METRICS = [
  { value: "360°", label: "Heuristic Visibility" },
  { value: "<2ms", label: "Anomaly Detection Latency" },
  { value: "99.97%", label: "Threat Correlation Accuracy" },
  { value: "∞", label: "Adaptive Learning Cycles" },
];

function AnimatedGrid() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden",
    }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.04 }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2e5bff" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* Scanline effect */}
      <div style={{
        position: "absolute", inset: 0,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(46,91,255,0.015) 2px, rgba(46,91,255,0.015) 4px)",
      }} />
    </div>
  );
}

function DataStream() {
  const chars = "01アイウエオカキクケコABCDEF0123456789∑∆Ω";
  const cols = 18;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0, opacity: 0.06 }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${(i / cols) * 100}%`,
          top: 0,
          width: 20,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: i % 3 === 0 ? "#2e5bff" : i % 3 === 1 ? "#39ff14" : "#00e5c8",
          animation: `stream ${4 + (i % 5)}s linear infinite`,
          animationDelay: `${(i * 0.4)}s`,
          whiteSpace: "nowrap",
          writingMode: "vertical-lr",
          letterSpacing: 4,
        }}>
          {Array.from({ length: 20 }).map(() => chars[Math.floor(Math.random() * chars.length)]).join("")}
        </div>
      ))}
      <style>{`
        @keyframes stream {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function ASHE() {
  return (
    <div style={{ background: "#04080f", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: "#e2e8f0", position: "relative" }}>
      <AnimatedGrid />
      <EDSNav />

      {/* ── HERO ── */}
      <div style={{ position: "relative", overflow: "hidden", padding: "100px 24px 80px", textAlign: "center" }}>
        <DataStream />

        {/* Status pill */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(46,91,255,0.08)", border: "1px solid rgba(46,91,255,0.3)", borderRadius: 20, padding: "6px 16px", marginBottom: 36, fontSize: 12, color: "#2e5bff", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#39ff14", boxShadow: "0 0 8px #39ff14", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
          SYSTEM ONLINE · EDS-360 SOCaaS CORE
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
        </div>

        {/* ASHE acronym */}
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "clamp(64px, 12vw, 120px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 8, position: "relative", display: "inline-block" }}>
          <span style={{ color: "#2e5bff", textShadow: "0 0 40px rgba(46,91,255,0.6), 0 0 80px rgba(46,91,255,0.2)" }}>A</span>
          <span style={{ color: "#e2e8f0" }}>S</span>
          <span style={{ color: "#39ff14", textShadow: "0 0 40px rgba(57,255,20,0.5)" }}>H</span>
          <span style={{ color: "#e2e8f0" }}>E</span>
        </div>

        <h2 style={{ margin: "12px 0 8px", fontSize: "clamp(13px, 2vw, 17px)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 400, color: "#475569", letterSpacing: 4, textTransform: "uppercase" }}>
          Analytic · Security · Heuristic · Entity
        </h2>

        <p style={{ margin: "0 auto 48px", fontSize: "clamp(18px, 2.5vw, 26px)", fontWeight: 300, color: "#94a3b8", maxWidth: 700, lineHeight: 1.5, fontStyle: "italic" }}>
          Where machine intuition meets<br />
          <span style={{ color: "#2e5bff", fontWeight: 600, fontStyle: "normal" }}>enterprise sovereignty.</span>
        </p>

        {/* Narrative */}
        <div style={{ maxWidth: 760, margin: "0 auto 56px", background: "rgba(46,91,255,0.04)", border: "1px solid rgba(46,91,255,0.15)", borderLeft: "3px solid #2e5bff", borderRadius: 12, padding: "28px 32px", textAlign: "left" }}>
          <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.9, margin: 0 }}>
            ASHE is the <strong style={{ color: "#e2e8f0" }}>cognitive engine</strong> of the EDS-360 SOCaaS ecosystem. Unlike traditional security bots relying on outdated "if-then" logic, ASHE operates as a{" "}
            <strong style={{ color: "#39ff14" }}>Heuristic Entity</strong> — a self-evolving intelligence designed to understand the <em>intent</em> behind the data. It delivers{" "}
            <strong style={{ color: "#2e5bff" }}>360° heuristic visibility</strong>, turning the dark corners of your network into a transparent, defended landscape.
          </p>
        </div>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/contact" onClick={() => window.scrollTo(0, 0)} style={{ padding: "14px 32px", borderRadius: 8, background: "#2e5bff", color: "#fff", fontWeight: 800, fontSize: 14, textDecoration: "none", boxShadow: "0 0 24px rgba(46,91,255,0.4)", letterSpacing: 0.5 }}>
            Deploy ASHE →
          </Link>
          <Link to="/services" onClick={() => window.scrollTo(0, 0)} style={{ padding: "14px 32px", borderRadius: 8, background: "transparent", border: "1px solid rgba(57,255,20,0.4)", color: "#39ff14", fontWeight: 700, fontSize: 14, textDecoration: "none", letterSpacing: 0.5 }}>
            SOCaaS Platform
          </Link>
        </div>
      </div>

      {/* ── METRICS STRIP ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 1, background: "rgba(46,91,255,0.1)", border: "1px solid rgba(46,91,255,0.15)", borderRadius: 12, overflow: "hidden" }}>
          {METRICS.map((m, i) => (
            <div key={i} style={{ background: "#04080f", padding: "28px 20px", textAlign: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 32, fontWeight: 900, color: i % 2 === 0 ? "#2e5bff" : "#39ff14", textShadow: `0 0 20px ${i % 2 === 0 ? "rgba(46,91,255,0.5)" : "rgba(57,255,20,0.4)"}` }}>{m.value}</div>
              <div style={{ color: "#475569", fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 6 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CORE CAPABILITIES ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#2e5bff", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>// core_capabilities.heuristic</div>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#e2e8f0", margin: 0 }}>The ASHE Intelligence Stack</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {CAPABILITIES.map((c, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.02)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${c.accent}22`,
              borderTop: `2px solid ${c.accent}`,
              borderRadius: 16,
              padding: "32px 28px",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Glow orb */}
              <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${c.accent}18 0%, transparent 70%)`, pointerEvents: "none" }} />

              <div style={{ fontSize: 28, marginBottom: 16, color: c.accent }}>{c.icon}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: c.accent, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{c.sub}</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#e2e8f0", margin: "0 0 14px" }}>{c.title}</h3>
              <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.8, margin: 0 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 360 STRIP ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(46,91,255,0.06) 0%, rgba(57,255,20,0.04) 100%)",
          border: "1px solid rgba(46,91,255,0.2)",
          borderRadius: 16,
          padding: "40px 40px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(46,91,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 48, fontWeight: 900, color: "#2e5bff", marginBottom: 8, textShadow: "0 0 30px rgba(46,91,255,0.5)" }}>360°</div>
          <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8, maxWidth: 600, margin: "0 auto 28px", fontStyle: "italic" }}>
            "ASHE provides <strong style={{ color: "#e2e8f0", fontStyle: "normal" }}>360-degree heuristic visibility</strong>, turning the dark corners of your network into a transparent, defended landscape."
          </p>
          <Link to="/contact" onClick={() => window.scrollTo(0, 0)} style={{ display: "inline-block", padding: "12px 28px", borderRadius: 8, background: "rgba(46,91,255,0.15)", border: "1px solid rgba(46,91,255,0.4)", color: "#2e5bff", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
            Request ASHE Briefing →
          </Link>
        </div>
      </div>

      <EDSFooter />
    </div>
  );
}