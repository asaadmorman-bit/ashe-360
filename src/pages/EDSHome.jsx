import { useState, useEffect } from "react";

const HERO_BG = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&q=80";

const NAV_LINKS = [
  { label: "Services",         href: "#services"    },
  { label: "Compliance",       href: "#compliance"  },
  { label: "CI/CD & Security", href: "#cicd"        },
  { label: "About EDS",        href: "#about"       },
  { label: "Contact",          href: "#contact"     },
];

const SERVICES = [
  { icon: "🛡️", color: "#ef4444", title: "SOCaaS — Security Operations", sub: "24/7 Managed Security", desc: "Fully managed Security Operations Center as a Service. Real-time threat detection, incident response, SIEM/SOAR automation, and zero-day exploit management — without the overhead of building an in-house SOC.", features: ["24/7 Threat Monitoring", "Incident Response & Containment", "SIEM / SOAR Automation", "Zero-Day & IOC Hunting", "VirusTotal + Suricata Integration", "Executive Reporting"] },
  { icon: "🔒", color: "#3b82f6", title: "Zero Trust Architecture", sub: "Identity-First Security", desc: "Design, implement, and maintain a Zero Trust security posture aligned to CISA's Zero Trust Maturity Model. Every user, device, and connection is continuously verified — never implicitly trusted.", features: ["CISA ZT Maturity Assessment", "Identity & Access Management", "Micro-Segmentation", "Continuous Verification", "Network Access Control", "Policy Enforcement"] },
  { icon: "📋", color: "#a78bfa", title: "Compliance & Certification", sub: "CMMC · NIST · FISMA · SOC2", desc: "End-to-end compliance management for federal and commercial requirements. From gap assessments to ATO packages, we guide your organization through every control framework with precision.", features: ["CMMC Level 1–3 Preparation", "NIST RMF / SP 800-53", "FISMA ATO Packages", "SOC2 Type I & II", "ISO 27001", "FedRAMP Readiness"] },
  { icon: "🎖️", color: "#f59e0b", title: "Defense & Security Training", sub: "Professional Certification", desc: "Hands-on cybersecurity and defense training programs built for government contractors, military personnel, and enterprise teams. DISA-aligned, certification-ready, and delivered in-person or virtually.", features: ["Security+ / CISSP Prep", "DISA STIG Compliance Training", "Insider Threat Awareness", "Active Shooter / Emergency Response", "Incident Command System (ICS)", "Cleared Personnel Programs"] },
  { icon: "⚖️", color: "#22c55e", title: "Legal & Compliance Services", sub: "Notary · Process Server · Business Law", desc: "Professional notary and process server services, business formation, compliance filings, and legal document support — serving individuals, businesses, and government contractors in Virginia and Maryland.", features: ["Notary Public Services", "Process Serving", "Business Formation", "Contract Review", "Registered Agent Services", "Compliance Filings"] },
  { icon: "🌿", color: "#10b981", title: "Smart Landscaping & IoT", sub: "Intelligent Site Management", desc: "IoT-connected landscape management with real-time sensor monitoring, automated irrigation control, and predictive maintenance — bringing enterprise-grade operational intelligence to physical site management.", features: ["IoT Sensor Networks", "Automated Irrigation Control", "Remote Monitoring", "Predictive Maintenance", "Energy Optimization", "Site Security Integration"] },
];

const COMPLIANCE = [
  { id: "CMMC",    icon: "🏛️", color: "#3b82f6", label: "CMMC L1–L3",       desc: "Cybersecurity Maturity Model Certification for DoD contractors" },
  { id: "NIST",    icon: "📐", color: "#a78bfa", label: "NIST SP 800-53",    desc: "Security and privacy controls for federal information systems" },
  { id: "FISMA",   icon: "🇺🇸", color: "#ef4444", label: "FISMA / ATO",      desc: "Federal Information Security Management Act authorization" },
  { id: "SOC2",    icon: "✅", color: "#22c55e",  label: "SOC 2 Type II",     desc: "Trust service criteria for security, availability, and confidentiality" },
  { id: "NISTCSF", icon: "🔄", color: "#f59e0b", label: "NIST CSF 2.0",      desc: "Cybersecurity Framework for critical infrastructure protection" },
  { id: "ISO",     icon: "🌐", color: "#10b981", label: "ISO 27001",          desc: "International standard for information security management" },
  { id: "STIG",    icon: "🔐", color: "#ec4899", label: "DISA STIGs / SCAP", desc: "DoD Security Technical Implementation Guides for hardening" },
  { id: "ZT",      icon: "🔮", color: "#8b5cf6", label: "CISA Zero Trust",    desc: "Zero Trust Maturity Model for federal and commercial environments" },
];

const CICD_CHECKS = [
  { icon: "🔑", label: "Secret Management",  desc: "No hardcoded credentials — all secrets in encrypted vault" },
  { icon: "🌐", label: "HTTPS Enforcement",   desc: "All transport encrypted — no unencrypted API calls" },
  { icon: "🚪", label: "Authentication",      desc: "OAuth tokens validated, sessions scoped, RBAC enforced" },
  { icon: "🧱", label: "CORS Policy",         desc: "Origin allowlists enforced — no wildcard in production" },
  { icon: "🧹", label: "Input Validation",    desc: "All user input sanitized before processing" },
  { icon: "📝", label: "Audit Logging",       desc: "Every agent action logged with timestamp and actor" },
  { icon: "📦", label: "Dependency Pinning",  desc: "All packages pinned to exact versions — supply chain safe" },
  { icon: "🔄", label: "Key Rotation Policy", desc: "API keys rotated on 90-day schedule" },
  { icon: "📡", label: "Rafter Pattern Scan", desc: "Daily automated code-level security scan across all services" },
  { icon: "🚨", label: "Zero-Day Monitoring", desc: "VirusTotal + NVD feed for CVE and IOC detection" },
];

const CIA_PILLARS = [
  { key: "C", color: "#3b82f6", glow: "#3b82f620", icon: "🔒", title: "Confidentiality", sub: "Your data stays yours.", desc: "We implement role-based access control, end-to-end encryption, Zero Trust policies, and strict data classification to ensure that only authorized parties ever access sensitive information — whether at rest or in transit.", controls: ["AES-256 Encryption at Rest", "TLS 1.3 in Transit", "Zero Trust IAM", "Data Classification", "Need-to-Know Access"] },
  { key: "I", color: "#f59e0b", glow: "#f59e0b20", icon: "✅", title: "Integrity",        sub: "Trust what you see.",    desc: "From cryptographic checksums to immutable audit trails, we ensure that your data, systems, and configurations haven't been tampered with. Every change is logged, versioned, and verifiable.", controls: ["Cryptographic Hashing", "Immutable Audit Logs", "Change Management (CAB)", "File Integrity Monitoring", "Digital Signatures"] },
  { key: "A", color: "#22c55e", glow: "#22c55e20", icon: "⚡", title: "Availability",     sub: "Always on. Always ready.", desc: "Our SOCaaS infrastructure is designed for 99.9%+ uptime with business continuity plans, redundant monitoring, automated failover, and SLA-backed response times — so your operations never stop.", controls: ["99.9% SLA Uptime", "Business Continuity Mode", "Redundant Monitoring", "Automated Failover", "24/7 Incident Response"] },
];

const STATS = [
  { value: "24/7",   label: "SOC Coverage",          icon: "🛰️", color: "#ef4444" },
  { value: "99.9%",  label: "Uptime SLA",            icon: "⚡",  color: "#22c55e" },
  { value: "<1hr",   label: "Critical Response",     icon: "🚨",  color: "#f59e0b" },
  { value: "CMMC",   label: "Certified Ready",        icon: "🏛️", color: "#3b82f6" },
  { value: "8+",     label: "Compliance Frameworks",  icon: "📋", color: "#a78bfa" },
  { value: "SDVOSB", label: "Veteran-Owned",          icon: "🎖️", color: "#f59e0b" },
];

function SectionHeader({ icon, title, sub, accent = "#f59e0b" }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 40 }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
      <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#e2e8f0", letterSpacing: "-0.02em" }}>{title}</h2>
      {sub && <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 16 }}>{sub}</p>}
      <div style={{ width: 48, height: 3, background: accent, borderRadius: 2, margin: "14px auto 0" }} />
    </div>
  );
}

export default function EDSHome() {
  const [contactForm, setContactForm] = useState({ name: "", email: "", company: "", service: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "Emerging Defense Solutions — SOCaaS & Cybersecurity";
    return () => { document.title = "ASME"; };
  }, []);

  const css = {
    page:  { background: "#04080f", minHeight: "100vh", fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif", color: "#e2e8f0" },
    section: { padding: "80px 24px", maxWidth: 1200, margin: "0 auto" },
    badge: (color) => ({ background: `${color}15`, color, border: `1px solid ${color}30`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700, display: "inline-block" }),
    btn:   (color = "#f59e0b", outline = false) => ({ padding: "12px 28px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", border: outline ? `2px solid ${color}` : "none", background: outline ? "transparent" : color, color: outline ? color : "#04080f" }),
    input: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 15, padding: "11px 14px", outline: "none", width: "100%", boxSizing: "border-box" },
  };

  return (
    <div style={css.page}>

      {/* NAVBAR */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(4,8,15,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <span style={{ fontSize: 24 }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, color: "#f59e0b", letterSpacing: 1 }}>EDS</div>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, marginTop: -2 }}>EMERGING DEFENSE SOLUTIONS</div>
            </div>
          </a>
          <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} style={{ padding: "8px 14px", fontSize: 13, fontWeight: 500, color: "#94a3b8", textDecoration: "none", borderRadius: 8 }}>{l.label}</a>
            ))}
            <a href="#contact" style={{ ...css.btn(), marginLeft: 8, padding: "8px 20px", fontSize: 13, textDecoration: "none", borderRadius: 8 }}>Get Started →</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", minHeight: 580, display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.2 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #04080f 40%, rgba(4,8,15,0.7) 70%, #04080f 100%)" }} />
        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
          <div style={{ maxWidth: 700 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              <span style={css.badge("#f59e0b")}>🎖️ SDVOSB Veteran-Owned</span>
              <span style={css.badge("#ef4444")}>🛡️ SOCaaS Provider</span>
              <span style={css.badge("#3b82f6")}>🏛️ CMMC Ready</span>
            </div>
            <h1 style={{ margin: "0 0 16px", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Defending What<br /><span style={{ color: "#f59e0b" }}>Matters Most.</span>
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 18, lineHeight: 1.7, marginBottom: 28, maxWidth: 580 }}>
              Emerging Defense Solutions delivers enterprise-grade Security Operations as a Service — built on the CIA triad of{" "}
              <strong style={{ color: "#3b82f6" }}>Confidentiality</strong>,{" "}
              <strong style={{ color: "#f59e0b" }}>Integrity</strong>, and{" "}
              <strong style={{ color: "#22c55e" }}>Availability</strong>. Rigorous federal compliance. Continuous CI/CD security scanning. Zero-day protection.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="#services" style={{ ...css.btn(), textDecoration: "none", borderRadius: 10 }}>Explore Our Services →</a>
              <a href="#contact" style={{ ...css.btn("#f59e0b", true), textDecoration: "none", borderRadius: 10 }}>Request a Consultation</a>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px", display: "flex", flexWrap: "wrap", justifyContent: "space-around" }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: "center", padding: "10px 20px" }}>
              <div style={{ fontSize: 22, marginBottom: 2 }}>{s.icon}</div>
              <div style={{ color: s.color, fontSize: 22, fontWeight: 900, fontFamily: "monospace" }}>{s.value}</div>
              <div style={{ color: "#475569", fontSize: 12, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CIA TRIAD */}
      <section id="cia" style={css.section}>
        <SectionHeader icon="🔐" title="Built on the CIA Triad" sub="Every control, policy, and service we deliver maps to Confidentiality, Integrity, and Availability." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {CIA_PILLARS.map(p => (
            <div key={p.key} style={{ background: p.glow, border: `1px solid ${p.color}30`, borderTop: `3px solid ${p.color}`, borderRadius: 16, padding: "28px 24px" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${p.color}20`, border: `1px solid ${p.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{p.icon}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: p.color, textTransform: "uppercase", letterSpacing: 2 }}>The "{p.key}" in CIA</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#e2e8f0" }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: p.color }}>{p.sub}</div>
                </div>
              </div>
              <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>{p.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {p.controls.map(c => (
                  <div key={c} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: p.color, fontSize: 12 }}>▶</span>
                    <span style={{ color: "#64748b", fontSize: 13 }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ background: "rgba(255,255,255,0.01)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SectionHeader icon="⚙️" title="Our Service Lines" sub="Six specialized divisions. One unified mission: protecting and advancing your organization." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
            {SERVICES.map(s => (
              <div key={s.title} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${s.color}20`, borderTop: `3px solid ${s.color}`, borderRadius: 16, padding: "24px" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${s.color}15`, border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0", marginBottom: 2 }}>{s.title}</div>
                    <span style={css.badge(s.color)}>{s.sub}</span>
                  </div>
                </div>
                <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, marginBottom: 14 }}>{s.desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {s.features.map(f => (
                    <div key={f} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ color: s.color, fontSize: 11 }}>✓</span>
                      <span style={{ color: "#475569", fontSize: 13 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPLIANCE */}
      <section id="compliance" style={css.section}>
        <SectionHeader icon="🏛️" title="Compliance Frameworks" sub="We don't just advise — we implement, document, and maintain your compliance posture end-to-end." accent="#3b82f6" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {COMPLIANCE.map(c => (
            <div key={c.id} style={{ background: `${c.color}08`, border: `1px solid ${c.color}25`, borderRadius: 12, padding: "18px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${c.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{c.icon}</div>
              <div>
                <div style={{ color: c.color, fontWeight: 800, fontSize: 14 }}>{c.label}</div>
                <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.5, marginTop: 3 }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <p style={{ color: "#475569", fontSize: 15, maxWidth: 600, margin: "0 auto 20px" }}>Not sure which frameworks apply to your organization? Our compliance team will assess your requirements and build a tailored roadmap — no cost for the initial consultation.</p>
          <a href="#contact" style={{ ...css.btn("#3b82f6"), textDecoration: "none", borderRadius: 10 }}>Book a Compliance Assessment</a>
        </div>
      </section>

      {/* CI/CD & RAFTER */}
      <section id="cicd" style={{ background: "rgba(0,0,0,0.3)", padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SectionHeader icon="🔄" title="CI/CD & Rafter Security Integration" sub="We practice what we preach. Every system we deploy is continuously scanned, tested, and hardened." accent="#22c55e" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 40 }}>
            {CICD_CHECKS.map(c => (
              <div key={c.label} style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: 10, padding: "16px" }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
                <div style={{ color: "#22c55e", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{c.label}</div>
                <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {[
              { icon: "🤖", color: "#22c55e", title: "Autonomous Daily Scanning", body: "ASME agents run a full Rafter-pattern security scan every day at 3am ET — automatically. All 10 security rules evaluated across every service layer. Critical findings trigger an immediate executive alert." },
              { icon: "📊", color: "#3b82f6", title: "Weekly Executive Reports",   body: "Every Monday at 7am ET, a full security posture report is emailed to executive leadership. Includes trend analysis, new vulnerabilities introduced, remediation status, and a prioritized action list." },
              { icon: "🚨", color: "#ef4444", title: "Zero-Day Response",          body: "VirusTotal + NVD CVE feed integration provides real-time zero-day and IOC detection. Suricata network alerts feed directly into the SOC dashboard. Response SLA: under 1 hour for critical findings." },
            ].map(b => (
              <div key={b.title} style={{ background: `${b.color}08`, border: `1px solid ${b.color}20`, borderRadius: 14, padding: "24px" }}>
                <div style={{ fontSize: 20, marginBottom: 10 }}>{b.icon}</div>
                <div style={{ color: b.color, fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{b.title}</div>
                <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={css.section}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40, alignItems: "center" }}>
          <div>
            <SectionHeader icon="🎖️" title="About EDS" sub="" />
            <p style={{ color: "#94a3b8", fontSize: 16, lineHeight: 1.8, marginBottom: 16 }}>
              Emerging Defense Solutions is a <strong style={{ color: "#f59e0b" }}>Service-Disabled Veteran-Owned Small Business (SDVOSB)</strong> headquartered in Fredericksburg, Virginia — at the intersection of DoD Country and the nation's capital.
            </p>
            <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
              Founded by veterans with decades of combined experience in defense, cybersecurity, and enterprise operations, EDS was built to deliver the same mission-critical reliability that the military demands — applied to securing the businesses, agencies, and communities of the modern world.
            </p>
            <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>Two executives. AI-powered agents running 24/7. Zero compromise on quality.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span style={css.badge("#f59e0b")}>🎖️ SDVOSB Certified</span>
              <span style={css.badge("#3b82f6")}>🏢 Fredericksburg, VA</span>
              <span style={css.badge("#22c55e")}>🤖 AI-Augmented Ops</span>
              <span style={css.badge("#a78bfa")}>🛡️ CIA Triad Aligned</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "🧭", color: "#f59e0b", title: "Mission", desc: "To deliver enterprise-grade security, compliance, and operational excellence to organizations that can't afford to fail." },
              { icon: "👁️", color: "#3b82f6", title: "Vision",  desc: "A world where every organization — from a 2-person startup to a federal agency — has access to the same level of defense that protects the nation." },
              { icon: "⚖️", color: "#22c55e", title: "Values",  desc: "Confidentiality. Integrity. Availability. No shortcuts, no excuses, no gaps." },
            ].map(v => (
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
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ background: "rgba(245,158,11,0.03)", borderTop: "1px solid rgba(245,158,11,0.1)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <SectionHeader icon="📡" title="Start the Conversation" sub="Tell us about your organization. We'll respond within one business day." />
          {submitted ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ color: "#22c55e", fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Message Received</div>
              <div style={{ color: "#475569", fontSize: 15 }}>We'll be in touch within one business day. Mission accepted.</div>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <input style={css.input} placeholder="Full Name *" value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} required />
                <input style={css.input} placeholder="Work Email *" type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <input style={css.input} placeholder="Organization / Company" value={contactForm.company} onChange={e => setContactForm(f => ({ ...f, company: e.target.value }))} />
              <select style={{ ...css.input, color: contactForm.service ? "#e2e8f0" : "#475569" }} value={contactForm.service} onChange={e => setContactForm(f => ({ ...f, service: e.target.value }))}>
                <option value="">Service of Interest</option>
                <option>SOCaaS — Managed Security Operations</option>
                <option>Zero Trust Architecture</option>
                <option>Compliance &amp; Certification (CMMC, NIST, FISMA)</option>
                <option>Defense &amp; Security Training</option>
                <option>Legal &amp; Compliance Services</option>
                <option>Smart Landscaping &amp; IoT</option>
                <option>Multiple Services / Not Sure Yet</option>
              </select>
              <textarea style={{ ...css.input, minHeight: 120, resize: "vertical" }} placeholder="Tell us about your security needs, compliance goals, or what challenges you're facing..." value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} />
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <button type="submit" style={{ ...css.btn(), borderRadius: 10, flex: 1 }}>Submit Inquiry →</button>
                <div style={{ color: "#334155", fontSize: 12, flex: 1, minWidth: 160, lineHeight: 1.5 }}>🔒 Encrypted &amp; confidential. We never sell your data.</div>
              </div>
            </form>
          )}
          <div style={{ display: "flex", gap: 24, marginTop: 32, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="mailto:info@eds-360.com" style={{ color: "#475569", fontSize: 14, textDecoration: "none" }}>✉️ info@eds-360.com</a>
            <span style={{ color: "#334155" }}>|</span>
            <span style={{ color: "#475569", fontSize: 14 }}>📍 Fredericksburg, VA</span>
            <span style={{ color: "#334155" }}>|</span>
            <a href="https://eds-360.com" target="_blank" rel="noreferrer" style={{ color: "#475569", fontSize: 14, textDecoration: "none" }}>🌐 eds-360.com</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#020509", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "28px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>🛡️</span>
            <span style={{ fontWeight: 900, fontSize: 15, color: "#f59e0b" }}>EDS</span>
            <span style={{ color: "#334155", fontSize: 15 }}>Emerging Defense Solutions</span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 14, flexWrap: "wrap" }}>
            {["Confidentiality", "Integrity", "Availability"].map((v, i) => (
              <span key={v} style={{ color: ["#3b82f6", "#f59e0b", "#22c55e"][i], fontSize: 13, fontWeight: 700 }}>● {v}</span>
            ))}
          </div>
          <div style={{ color: "#1e293b", fontSize: 12 }}>© 2026 Emerging Defense Solutions LLC · Fredericksburg, VA · SDVOSB Certified · All Rights Reserved</div>
        </div>
      </footer>

    </div>
  );
}