import EDSNav from "../../components/eds/EDSNav";
import EDSFooter from "../../components/eds/EDSFooter";
import { Link } from "react-router-dom";

const TEAM_VALUES = [
  { icon: "🧭", color: "#00e5c8", title: "Mission", desc: "To deliver enterprise-grade security, compliance, and operational excellence to organizations that can't afford to fail." },
  { icon: "👁️", color: "#38bdf8", title: "Vision",  desc: "A world where every organization — from a 2-person startup to a federal agency — has access to the same level of defense that protects the nation." },
  { icon: "⚖️", color: "#2dd4bf", title: "Values",  desc: "Confidentiality. Integrity. Availability. No shortcuts, no excuses, no gaps." },
];

const CIA_PILLARS = [
  { key: "C", color: "#00e5c8", glow: "#00e5c820", icon: "🔒", title: "Confidentiality", sub: "Your data stays yours.", controls: ["AES-256 Encryption at Rest", "TLS 1.3 in Transit", "Zero Trust IAM", "Data Classification", "Need-to-Know Access"] },
  { key: "I", color: "#38bdf8", glow: "#38bdf820", icon: "✅", title: "Integrity",        sub: "Trust what you see.",    controls: ["Cryptographic Hashing", "Immutable Audit Logs", "Change Management (CAB)", "File Integrity Monitoring", "Digital Signatures"] },
  { key: "A", color: "#2dd4bf", glow: "#2dd4bf20", icon: "⚡", title: "Availability",     sub: "Always on. Always ready.", controls: ["99.9% SLA Uptime", "Business Continuity Mode", "Redundant Monitoring", "Automated Failover", "24/7 Incident Response"] },
];

const STATS = [
  { value: "24/7",   label: "SOC Coverage",         icon: "🛰️", color: "#00e5c8" },
  { value: "99.9%",  label: "Uptime SLA",           icon: "⚡",  color: "#2dd4bf" },
  { value: "<1hr",   label: "Critical Response",    icon: "🚨",  color: "#38bdf8" },
  { value: "8+",     label: "Compliance Frameworks", icon: "📋", color: "#00e5c8" },
  { value: "SDVOSB", label: "Veteran-Owned",         icon: "🎖️", color: "#38bdf8" },
  { value: "NOVA",   label: "Spotsylvania, VA",       icon: "🏢", color: "#2dd4bf" },
];

const css = {
  page: { background: "linear-gradient(160deg, #071520 0%, #0a2030 40%, #082828 100%)", minHeight: "100vh", fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif", color: "#e2e8f0" },
  badge: (color) => ({ background: `${color}15`, color, border: `1px solid ${color}30`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700, display: "inline-block" }),
};

export default function AboutPage() {
  return (
    <div style={css.page}>
      <EDSNav />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px" }}>

        {/* Hero */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 48, alignItems: "center", marginBottom: 64 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <img src="https://media.base44.com/images/public/69f1f1da68cbf198a19d2008/74f34baa5_2133.png" alt="EDS Logo" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(0,229,200,0.3)", boxShadow: "0 0 24px rgba(0,229,200,0.15)" }} />
              <div>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#e2e8f0" }}>Emerging Defense Solutions</h1>
                <div style={{ color: "#00e5c8", fontSize: 13, marginTop: 4 }}>Premier SOCaaS · cyber.eds-360.com</div>
              </div>
            </div>
            <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8, marginBottom: 16 }}>
              Emerging Defense Solutions is a <strong style={{ color: "#00e5c8" }}>Service-Disabled Veteran-Owned Small Business (SDVOSB)</strong> headquartered in Fredericksburg, Virginia — at the intersection of DoD Country and the nation's capital.
            </p>
            <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
              This platform — <strong style={{ color: "#94a3b8" }}>cyber.eds-360.com</strong> — is the dedicated cybersecurity services division of EDS. Founded by veterans with decades of combined experience in defense, cybersecurity, and enterprise operations, EDS was built to deliver the same mission-critical reliability that the military demands.
            </p>
            <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
              For the full EDS ecosystem, visit <a href="https://emergingdefensesolutions.com" target="_blank" rel="noreferrer" style={{ color: "#38bdf8", textDecoration: "none" }}>emergingdefensesolutions.com</a>. Two executives. AI-powered agents running 24/7. Zero compromise on quality.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={css.badge("#00e5c8")}>🎖️ SDVOSB Certified</span>
              <span style={css.badge("#38bdf8")}>🏢 Spotsylvania, VA</span>
              <span style={css.badge("#2dd4bf")}>🤖 AI-Augmented Ops</span>
              <span style={css.badge("#38bdf8")}>🛡️ CIA Triad Aligned</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {TEAM_VALUES.map(v => (
              <div key={v.title} style={{ background: `${v.color}08`, border: `1px solid ${v.color}20`, borderRadius: 12, padding: "18px 20px", display: "flex", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${v.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{v.icon}</div>
                <div>
                  <div style={{ color: v.color, fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{v.title}</div>
                  <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.6 }}>{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-around", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "28px", marginBottom: 60 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: "center", padding: "12px 20px" }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ color: s.color, fontSize: 24, fontWeight: 900, fontFamily: "monospace" }}>{s.value}</div>
              <div style={{ color: "#475569", fontSize: 12, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* CIA Triad */}
        <h2 style={{ textAlign: "center", fontSize: 26, fontWeight: 900, color: "#e2e8f0", marginBottom: 28 }}>Built on the CIA Triad</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 48 }}>
          {CIA_PILLARS.map(p => (
            <div key={p.key} style={{ background: p.glow, border: `1px solid ${p.color}30`, borderTop: `3px solid ${p.color}`, borderRadius: 16, padding: "24px" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${p.color}20`, border: `1px solid ${p.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{p.icon}</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: p.color, textTransform: "uppercase", letterSpacing: 2 }}>The "{p.key}" in CIA</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#e2e8f0" }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: p.color }}>{p.sub}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {p.controls.map(c => (
                  <div key={c} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: p.color, fontSize: 11 }}>▶</span>
                    <span style={{ color: "#64748b", fontSize: 13 }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center" }}>
          <Link to="/contact" style={{ padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700, background: "#00e5c8", color: "#071520", textDecoration: "none" }}>Work With EDS →</Link>
        </div>
      </div>
      <EDSFooter />
    </div>
  );
}