import EDSNav from "../../components/eds/EDSNav";
import EDSFooter from "../../components/eds/EDSFooter";
import { Link } from "react-router-dom";

const COMPLIANCE = [
  { id: "CMMC",    icon: "🏛️", color: "#00e5c8", label: "CMMC L1–L3",       desc: "Cybersecurity Maturity Model Certification for DoD contractors. We guide you from gap assessment through certification-ready posture." },
  { id: "NIST",    icon: "📐", color: "#38bdf8", label: "NIST SP 800-53",    desc: "Security and privacy controls for federal information systems. Full control implementation and documentation support." },
  { id: "FISMA",   icon: "🇺🇸", color: "#2dd4bf", label: "FISMA / ATO",      desc: "Federal Information Security Management Act authorization. We author complete ATO packages and ISSO support." },
  { id: "SOC2",    icon: "✅", color: "#00e5c8",  label: "SOC 2 Type II",     desc: "Trust service criteria for security, availability, and confidentiality. Readiness assessments and audit support." },
  { id: "NISTCSF", icon: "🔄", color: "#38bdf8", label: "NIST CSF 2.0",      desc: "Cybersecurity Framework for critical infrastructure protection. Identify, protect, detect, respond, recover." },
  { id: "ISO",     icon: "🌐", color: "#2dd4bf", label: "ISO 27001",          desc: "International standard for information security management. Gap analysis through certification readiness." },
  { id: "STIG",    icon: "🔐", color: "#00e5c8", label: "DISA STIGs / SCAP", desc: "DoD Security Technical Implementation Guides for hardening. Automated scanning, remediation, and reporting." },
  { id: "ZT",      icon: "🔮", color: "#38bdf8", label: "CISA Zero Trust",    desc: "Zero Trust Maturity Model for federal and commercial environments. Architecture design and implementation." },
  { id: "FEDRAMP", icon: "☁️", color: "#2dd4bf", label: "FedRAMP Readiness",  desc: "Federal Risk and Authorization Management Program. Readiness assessment and boundary documentation." },
];

const PROCESS = [
  { step: "01", color: "#00e5c8", title: "Gap Assessment", desc: "We baseline your current posture against the target framework, identifying every open finding and prioritizing by risk." },
  { step: "02", color: "#38bdf8", title: "Remediation Plan", desc: "A plain-language roadmap with owners, timelines, and effort estimates — so your team knows exactly what to do next." },
  { step: "03", color: "#2dd4bf", title: "Implementation", desc: "EDS engineers implement technical controls, author policies, and configure tools to close every gap." },
  { step: "04", color: "#00e5c8", title: "Documentation", desc: "System Security Plans, POA&Ms, Risk Assessments — all delivered in auditor-ready format." },
  { step: "05", color: "#38bdf8", title: "Assessment Support", desc: "We stand beside you during third-party assessments, answering auditor questions and resolving findings in real time." },
  { step: "06", color: "#2dd4bf", title: "Ongoing Maintenance", desc: "Compliance is never done. Our retainer programs keep your posture current as frameworks and threats evolve." },
];

const css = {
  page: { background: "linear-gradient(160deg, #071520 0%, #0a2030 40%, #082828 100%)", minHeight: "100vh", fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif", color: "#e2e8f0" },
};

export default function CompliancePage() {
  return (
    <div style={css.page}>
      <EDSNav />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <img src="https://media.base44.com/images/public/69f1f1da68cbf198a19d2008/74f34baa5_2133.png" alt="EDS" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(0,229,200,0.3)", marginBottom: 16 }} />
          <h1 style={{ margin: "0 0 12px", fontSize: 36, fontWeight: 900, color: "#e2e8f0" }}>Compliance & Certification</h1>
          <p style={{ color: "#64748b", fontSize: 16, maxWidth: 600, margin: "0 auto" }}>We don't just advise — we implement, document, and maintain your compliance posture end-to-end.</p>
          <div style={{ width: 48, height: 3, background: "#38bdf8", borderRadius: 2, margin: "14px auto 0" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 60 }}>
          {COMPLIANCE.map(c => (
            <div key={c.id} style={{ background: `${c.color}08`, border: `1px solid ${c.color}25`, borderRadius: 14, padding: "20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${c.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{c.icon}</div>
              <div>
                <div style={{ color: c.color, fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{c.label}</div>
                <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 60 }}>
          <h2 style={{ textAlign: "center", fontSize: 26, fontWeight: 900, color: "#e2e8f0", marginBottom: 32 }}>Our Compliance Process</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {PROCESS.map(p => (
              <div key={p.step} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${p.color}20`, borderRadius: 14, padding: "22px" }}>
                <div style={{ color: p.color, fontWeight: 900, fontSize: 28, fontFamily: "monospace", marginBottom: 8 }}>{p.step}</div>
                <div style={{ color: "#e2e8f0", fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{p.title}</div>
                <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.6 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <Link to="/contact" style={{ padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700, background: "#38bdf8", color: "#071520", textDecoration: "none" }}>Book a Compliance Assessment →</Link>
        </div>
      </div>
      <EDSFooter />
    </div>
  );
}