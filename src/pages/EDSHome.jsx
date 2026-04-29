import { useState, useEffect } from "react";

const HERO_BG = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&q=80";

const NAV_LINKS = [
  { label: "Services",     href: "#services"    },
  { label: "Compliance",   href: "#compliance"  },
  { label: "Case Studies", href: "#cases"       },
  { label: "Pricing",      href: "#pricing"     },
  { label: "CI/CD",        href: "#cicd"        },
  { label: "About",        href: "#about"       },
  { label: "Contact",      href: "#contact"     },
];

const TRUST_BADGES = [
  { icon: "🏛️", label: "CMMC",        sub: "L1–L3 Ready"       },
  { icon: "📐", label: "NIST 800-53",  sub: "Compliant"         },
  { icon: "🔐", label: "DISA STIGs",   sub: "Implemented"       },
  { icon: "🛡️", label: "CISA ZT",     sub: "Maturity Model"    },
  { icon: "🇺🇸", label: "DoD Aligned", sub: "Federal Ready"     },
  { icon: "☁️", label: "FedRAMP",      sub: "Readiness Support" },
  { icon: "✅", label: "SOC 2",        sub: "Type I & II"       },
  { icon: "🌐", label: "ISO 27001",    sub: "Certified Ready"   },
  { icon: "🎖️", label: "SDVOSB",      sub: "Veteran-Owned"     },
];

const SERVICES = [
  { icon: "🛡️", color: "#00e5c8", title: "SOCaaS — Security Operations", sub: "24/7 Managed Security", desc: "Fully managed Security Operations Center as a Service. Real-time threat detection, incident response, SIEM/SOAR automation, and zero-day exploit management — without the overhead of building an in-house SOC.", features: ["24/7 Threat Monitoring", "Incident Response & Containment", "SIEM / SOAR Automation", "Zero-Day & IOC Hunting", "VirusTotal + Suricata Integration", "Executive Reporting"] },
  { icon: "🔒", color: "#38bdf8", title: "Zero Trust Architecture", sub: "Identity-First Security", desc: "Design, implement, and maintain a Zero Trust security posture aligned to CISA's Zero Trust Maturity Model. Every user, device, and connection is continuously verified — never implicitly trusted.", features: ["CISA ZT Maturity Assessment", "Identity & Access Management", "Micro-Segmentation", "Continuous Verification", "Network Access Control", "Policy Enforcement"] },
  { icon: "📋", color: "#a78bfa", title: "Compliance & Certification", sub: "CMMC · NIST · FISMA · SOC2", desc: "End-to-end compliance management for federal and commercial requirements. From gap assessments to ATO packages, we guide your organization through every control framework with precision.", features: ["CMMC Level 1–3 Preparation", "NIST RMF / SP 800-53", "FISMA ATO Packages", "SOC2 Type I & II", "ISO 27001", "FedRAMP Readiness"] },
  { icon: "🎖️", color: "#00e5c8", title: "Defense & Security Training", sub: "Professional Certification", desc: "Hands-on cybersecurity and defense training programs built for government contractors, military personnel, and enterprise teams. DISA-aligned, certification-ready, and delivered in-person or virtually.", features: ["Security+ / CISSP Prep", "DISA STIG Compliance Training", "Insider Threat Awareness", "Active Shooter / Emergency Response", "Incident Command System (ICS)", "Cleared Personnel Programs"] },
  { icon: "⚖️", color: "#38bdf8", title: "Legal & Compliance Services", sub: "Notary · Process Server · Business Law", desc: "Professional notary and process server services, business formation, compliance filings, and legal document support — serving individuals, businesses, and government contractors in Virginia and Maryland.", features: ["Notary Public Services", "Process Serving", "Business Formation", "Contract Review", "Registered Agent Services", "Compliance Filings"] },
  { icon: "🌿", color: "#2dd4bf", title: "Smart Landscaping & IoT", sub: "Intelligent Site Management", desc: "IoT-connected landscape management with real-time sensor monitoring, automated irrigation control, and predictive maintenance — bringing enterprise-grade operational intelligence to physical site management.", features: ["IoT Sensor Networks", "Automated Irrigation Control", "Remote Monitoring", "Predictive Maintenance", "Energy Optimization", "Site Security Integration"] },
];

const COMPLIANCE = [
  { id: "CMMC",    icon: "🏛️", color: "#00e5c8", label: "CMMC L1–L3",       desc: "Cybersecurity Maturity Model Certification for DoD contractors" },
  { id: "NIST",    icon: "📐", color: "#38bdf8", label: "NIST SP 800-53",    desc: "Security and privacy controls for federal information systems" },
  { id: "FISMA",   icon: "🇺🇸", color: "#2dd4bf", label: "FISMA / ATO",      desc: "Federal Information Security Management Act authorization" },
  { id: "SOC2",    icon: "✅", color: "#00e5c8",  label: "SOC 2 Type II",     desc: "Trust service criteria for security, availability, and confidentiality" },
  { id: "NISTCSF", icon: "🔄", color: "#38bdf8", label: "NIST CSF 2.0",      desc: "Cybersecurity Framework for critical infrastructure protection" },
  { id: "ISO",     icon: "🌐", color: "#2dd4bf", label: "ISO 27001",          desc: "International standard for information security management" },
  { id: "STIG",    icon: "🔐", color: "#00e5c8", label: "DISA STIGs / SCAP", desc: "DoD Security Technical Implementation Guides for hardening" },
  { id: "ZT",      icon: "🔮", color: "#38bdf8", label: "CISA Zero Trust",    desc: "Zero Trust Maturity Model for federal and commercial environments" },
];

const CASE_STUDIES = [
  { icon: "🏗️", color: "#00e5c8", tag: "Defense Contractor", title: "CMMC L2 Achieved in 90 Days", client: "Mid-size DoD subcontractor, 80 employees", challenge: "Failed pre-assessment with 47 open findings. Contract at risk. CUI handling gaps across 3 sites.", solution: "EDS deployed agentless SCAP scanning, remediated all CAT I STIGs, implemented CUI data flow mapping, and built the SSP from scratch.", result: "CMMC Level 2 certification achieved in 87 days. $4.2M contract retained. Zero CAT I findings at final assessment.", metrics: [{ v: "87", u: "days" }, { v: "47→0", u: "findings" }, { v: "$4.2M", u: "contract saved" }] },
  { icon: "🏫", color: "#38bdf8", tag: "K-12 Education", title: "Ransomware Contained in 38 Minutes", client: "County school district, 14,000 students", challenge: "LockBit variant deployed via phishing. 3 servers encrypted. No IR plan. IT team of 2.", solution: "EDS SOCaaS detected lateral movement via Suricata at T+4 min. Network isolation triggered. Forensic imaging, IOC extraction, and recovery playbook executed.", result: "38-minute containment. No student data exfiltrated. Schools online next morning. Full IOC report delivered to FBI CISA.", metrics: [{ v: "38", u: "min containment" }, { v: "0", u: "records stolen" }, { v: "100%", u: "recovery" }] },
  { icon: "🏛️", color: "#2dd4bf", tag: "Municipal Government", title: "FISMA ATO Package — 6 Weeks", client: "Regional metro authority, 400 endpoints", challenge: "FY audit approaching. No existing ATO documentation. Legacy systems with unknown asset inventory. $180K in potential funding at risk.", solution: "EDS conducted full asset discovery via agentless scanning, built the system security plan, conducted risk assessment, and authored the complete ATO package.", result: "ATO granted on first submission. Audit passed. $180K federal funding secured. Ongoing ISSO retainer established.", metrics: [{ v: "6", u: "weeks to ATO" }, { v: "1st", u: "submission pass" }, { v: "$180K", u: "funding secured" }] },
];

const PRICING = [
  { tier: "Starter", icon: "🔰", color: "#2dd4bf", price: "$1,500", period: "/mo", tagline: "For small businesses & startups", highlight: false, cta: "Get Started", features: ["24/7 SOC monitoring (up to 25 endpoints)", "Monthly security posture report", "Email threat triage", "NIST CSF gap assessment (annual)", "Incident response (business hours)", "1 compliance framework advisory", "Slack/email alerting"] },
  { tier: "Professional", icon: "⚡", color: "#00e5c8", price: "$4,500", period: "/mo", tagline: "For SMBs & government contractors", highlight: true, cta: "Most Popular", features: ["24/7 SOC monitoring (up to 150 endpoints)", "Weekly executive security brief", "SIEM + SOAR automation", "CMMC / NIST RMF compliance support", "Incident response <4hr SLA", "STIG scanning & remediation", "VirusTotal + CVE feed integration", "Dedicated account manager", "2 compliance frameworks"] },
  { tier: "Enterprise", icon: "🏛️", color: "#38bdf8", price: "Custom", period: "", tagline: "For federal agencies & large orgs", highlight: false, cta: "Contact Us", features: ["Unlimited endpoints", "Full-time vCISO / ISSO support", "ATO package authoring", "FedRAMP readiness assessment", "Zero Trust architecture design", "Incident response <1hr SLA", "All compliance frameworks", "ServiceNow ITSM integration", "On-site assessments available", "Custom SLA & white-glove support"] },
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
  { key: "C", color: "#00e5c8", glow: "#00e5c820", icon: "🔒", title: "Confidentiality", sub: "Your data stays yours.", desc: "We implement role-based access control, end-to-end encryption, Zero Trust policies, and strict data classification to ensure that only authorized parties ever access sensitive information — whether at rest or in transit.", controls: ["AES-256 Encryption at Rest", "TLS 1.3 in Transit", "Zero Trust IAM", "Data Classification", "Need-to-Know Access"] },
  { key: "I", color: "#38bdf8", glow: "#38bdf820", icon: "✅", title: "Integrity",        sub: "Trust what you see.",    desc: "From cryptographic checksums to immutable audit trails, we ensure that your data, systems, and configurations haven't been tampered with. Every change is logged, versioned, and verifiable.", controls: ["Cryptographic Hashing", "Immutable Audit Logs", "Change Management (CAB)", "File Integrity Monitoring", "Digital Signatures"] },
  { key: "A", color: "#2dd4bf", glow: "#2dd4bf20", icon: "⚡", title: "Availability",     sub: "Always on. Always ready.", desc: "Our SOCaaS infrastructure is designed for 99.9%+ uptime with business continuity plans, redundant monitoring, automated failover, and SLA-backed response times — so your operations never stop.", controls: ["99.9% SLA Uptime", "Business Continuity Mode", "Redundant Monitoring", "Automated Failover", "24/7 Incident Response"] },
];

const STATS = [
  { value: "24/7",   label: "SOC Coverage",          icon: "🛰️", color: "#00e5c8" },
  { value: "99.9%",  label: "Uptime SLA",            icon: "⚡",  color: "#2dd4bf" },
  { value: "<1hr",   label: "Critical Response",     icon: "🚨",  color: "#38bdf8" },
  { value: "CMMC",   label: "Certified Ready",        icon: "🏛️", color: "#00e5c8" },
  { value: "8+",     label: "Compliance Frameworks",  icon: "📋", color: "#2dd4bf" },
  { value: "SDVOSB", label: "Veteran-Owned",          icon: "🎖️", color: "#38bdf8" },
];

function SectionHeader({ icon, title, sub, accent = "#00e5c8" }) {
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
  const [assessForm, setAssessForm] = useState({ name: "", email: "", company: "", size: "" });
  const [assessSubmitted, setAssessSubmitted] = useState(false);
  const [openCase, setOpenCase] = useState(null);

  useEffect(() => {
    document.title = "Emerging Defense Solutions — SOCaaS & Cybersecurity";
    return () => { document.title = "ASME"; };
  }, []);

  const css = {
    page:  { background: "linear-gradient(160deg, #071520 0%, #0a2030 40%, #082828 100%)", minHeight: "100vh", fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif", color: "#e2e8f0" },
    section: { padding: "80px 24px", maxWidth: 1200, margin: "0 auto" },
    badge: (color) => ({ background: `${color}15`, color, border: `1px solid ${color}30`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700, display: "inline-block" }),
    btn:   (color = "#00e5c8", outline = false) => ({ padding: "12px 28px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", border: outline ? `2px solid ${color}` : "none", background: outline ? "transparent" : color, color: outline ? color : "#071520" }),
    input: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,229,200,0.15)", borderRadius: 8, color: "#e2e8f0", fontSize: 15, padding: "11px 14px", outline: "none", width: "100%", boxSizing: "border-box" },
  };

  return (
    <div style={css.page}>

      {/* NAVBAR */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(7,21,32,0.96)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,229,200,0.12)", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <span style={{ fontSize: 24 }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, color: "#00e5c8", letterSpacing: 1 }}>EDS</div>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, marginTop: -2 }}>EMERGING DEFENSE SOLUTIONS</div>
            </div>
          </a>
          <div style={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} style={{ padding: "8px 11px", fontSize: 12, fontWeight: 500, color: "#94a3b8", textDecoration: "none", borderRadius: 8 }}>{l.label}</a>
            ))}
            <a href="#assessment" style={{ ...css.btn(), marginLeft: 8, padding: "8px 16px", fontSize: 12, textDecoration: "none", borderRadius: 8 }}>Free Assessment →</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", minHeight: 580, display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.2 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #071520 40%, rgba(7,21,32,0.7) 70%, #071520 100%)" }} />
        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
          <div style={{ maxWidth: 700 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              <span style={css.badge("#00e5c8")}>🎖️ SDVOSB Veteran-Owned</span>
              <span style={css.badge("#2dd4bf")}>🛡️ SOCaaS Provider</span>
              <span style={css.badge("#38bdf8")}>🏛️ CMMC Ready</span>
            </div>
            <h1 style={{ margin: "0 0 16px", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Defending What<br /><span style={{ color: "#00e5c8" }}>Matters Most.</span>
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 18, lineHeight: 1.7, marginBottom: 28, maxWidth: 580 }}>
              Emerging Defense Solutions delivers enterprise-grade Security Operations as a Service — built on the CIA triad of{" "}
              <strong style={{ color: "#00e5c8" }}>Confidentiality</strong>,{" "}
              <strong style={{ color: "#38bdf8" }}>Integrity</strong>, and{" "}
              <strong style={{ color: "#2dd4bf" }}>Availability</strong>. Rigorous federal compliance. Continuous CI/CD security scanning. Zero-day protection.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="#assessment" style={{ ...css.btn(), textDecoration: "none", borderRadius: 10 }}>Get Free Security Assessment →</a>
              <a href="#services" style={{ ...css.btn("#00e5c8", true), textDecoration: "none", borderRadius: 10 }}>Explore Services</a>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div style={{ background: "rgba(0,229,200,0.03)", borderTop: "1px solid rgba(0,229,200,0.1)", borderBottom: "1px solid rgba(0,229,200,0.1)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px" }}>
          <div style={{ textAlign: "center", color: "#334155", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Aligned to the standards that matter</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {TRUST_BADGES.map(b => (
              <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(0,229,200,0.04)", border: "1px solid rgba(0,229,200,0.12)", borderRadius: 8, padding: "8px 14px" }}>
                <span style={{ fontSize: 16 }}>{b.icon}</span>
                <div>
                  <div style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{b.label}</div>
                  <div style={{ color: "#334155", fontSize: 10 }}>{b.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STATS BAR */}
      <div style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
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

      {/* FREE ASSESSMENT */}
      <section id="assessment" style={{ background: "linear-gradient(135deg, rgba(0,229,200,0.06) 0%, rgba(7,21,32,0) 60%)", borderBottom: "1px solid rgba(0,229,200,0.1)", padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 40, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-block", background: "rgba(0,229,200,0.1)", border: "1px solid rgba(0,229,200,0.3)", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700, color: "#00e5c8", marginBottom: 14 }}>🆓 NO COST · NO OBLIGATION</div>
            <h2 style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 900, color: "#e2e8f0", lineHeight: 1.2 }}>Book a Free 30-Min<br /><span style={{ color: "#00e5c8" }}>Security Posture Review</span></h2>
            <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.7, margin: "0 0 20px" }}>In 30 minutes, EDS will assess your current security posture, identify your top 3 compliance gaps, and give you a prioritized action plan — completely free. No sales pitch. Just answers.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Identify your CMMC / NIST gap score", "Pinpoint your highest-risk exposure areas", "Get a plain-language remediation roadmap", "No commitment required — just clarity"].map(i => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: "#00e5c8", fontSize: 14, flexShrink: 0 }}>✓</span>
                  <span style={{ color: "#64748b", fontSize: 14 }}>{i}</span>
                </div>
              ))}
            </div>
          </div>
          {assessSubmitted ? (
            <div style={{ background: "rgba(0,229,200,0.05)", border: "1px solid rgba(0,229,200,0.2)", borderRadius: 16, padding: "36px 28px", textAlign: "center" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
              <div style={{ color: "#00e5c8", fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Request Received!</div>
              <div style={{ color: "#475569", fontSize: 14, lineHeight: 1.6 }}>We'll reach out within one business day to schedule your free assessment. Mission accepted.</div>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setAssessSubmitted(true); }} style={{ background: "rgba(0,229,200,0.03)", border: "1px solid rgba(0,229,200,0.15)", borderRadius: 16, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ color: "#e2e8f0", fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Request Your Free Assessment</div>
              <input style={css.input} placeholder="Full Name *" required value={assessForm.name} onChange={e => setAssessForm(f => ({ ...f, name: e.target.value }))} />
              <input style={css.input} placeholder="Work Email *" type="email" required value={assessForm.email} onChange={e => setAssessForm(f => ({ ...f, email: e.target.value }))} />
              <input style={css.input} placeholder="Organization" value={assessForm.company} onChange={e => setAssessForm(f => ({ ...f, company: e.target.value }))} />
              <select style={{ ...css.input, color: assessForm.size ? "#e2e8f0" : "#475569" }} value={assessForm.size} onChange={e => setAssessForm(f => ({ ...f, size: e.target.value }))}>
                <option value="">Organization Size</option>
                <option>1–10 employees</option>
                <option>11–50 employees</option>
                <option>51–200 employees</option>
                <option>201–1000 employees</option>
                <option>1000+ / Government Agency</option>
              </select>
              <button type="submit" style={{ ...css.btn(), borderRadius: 8, width: "100%", marginTop: 4 }}>Book My Free Assessment →</button>
              <div style={{ color: "#334155", fontSize: 11, textAlign: "center" }}>🔒 Your information is encrypted and never shared.</div>
            </form>
          )}
        </div>
      </section>

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
      <section id="services" style={{ background: "rgba(0,229,200,0.01)", padding: "80px 24px" }}>
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
        <SectionHeader icon="🏛️" title="Compliance Frameworks" sub="We don't just advise — we implement, document, and maintain your compliance posture end-to-end." accent="#38bdf8" />
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
          <a href="#assessment" style={{ ...css.btn("#38bdf8"), textDecoration: "none", borderRadius: 10 }}>Book a Compliance Assessment</a>
        </div>
      </section>

      {/* CASE STUDIES */}
      <section id="cases" style={{ background: "rgba(0,229,200,0.02)", borderTop: "1px solid rgba(0,229,200,0.08)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SectionHeader icon="📁" title="Case Studies" sub="Real results. Real organizations. Anonymized to protect our clients." accent="#2dd4bf" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {CASE_STUDIES.map((c, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${c.color}25`, borderTop: `3px solid ${c.color}`, borderRadius: 16, padding: "24px", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 24 }}>{c.icon}</span>
                  <div>
                    <span style={css.badge(c.color)}>{c.tag}</span>
                    <div style={{ color: "#e2e8f0", fontWeight: 800, fontSize: 16, marginTop: 4 }}>{c.title}</div>
                  </div>
                </div>
                <div style={{ color: "#475569", fontSize: 12, marginBottom: 14, fontStyle: "italic" }}>{c.client}</div>
                <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                  {c.metrics.map((m, j) => (
                    <div key={j} style={{ background: `${c.color}10`, border: `1px solid ${c.color}25`, borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                      <div style={{ color: c.color, fontWeight: 900, fontSize: 18, fontFamily: "monospace" }}>{m.v}</div>
                      <div style={{ color: "#475569", fontSize: 10 }}>{m.u}</div>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  {openCase === i ? (
                    <>
                      <div style={{ marginBottom: 10 }}><div style={{ color: "#00e5c8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Challenge</div><div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>{c.challenge}</div></div>
                      <div style={{ marginBottom: 10 }}><div style={{ color: "#38bdf8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Solution</div><div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>{c.solution}</div></div>
                      <div><div style={{ color: "#2dd4bf", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Result</div><div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>{c.result}</div></div>
                    </>
                  ) : (
                    <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.6 }}>{c.challenge}</div>
                  )}
                </div>
                <button onClick={() => setOpenCase(openCase === i ? null : i)} style={{ marginTop: 16, background: "transparent", border: `1px solid ${c.color}30`, color: c.color, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {openCase === i ? "▲ Show Less" : "▼ Read Full Case Study"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={css.section}>
        <SectionHeader icon="💰" title="Transparent Pricing" sub="No surprises. No hidden fees. Pick the tier that fits your mission." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, alignItems: "start" }}>
          {PRICING.map(p => (
            <div key={p.tier} style={{ background: p.highlight ? "rgba(0,229,200,0.06)" : "rgba(255,255,255,0.025)", border: p.highlight ? `2px solid ${p.color}50` : "1px solid rgba(255,255,255,0.08)", borderTop: `3px solid ${p.color}`, borderRadius: 16, padding: "28px 24px", position: "relative" }}>
              {p.highlight && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: p.color, color: "#071520", fontSize: 11, fontWeight: 800, padding: "3px 14px", borderRadius: 20, whiteSpace: "nowrap" }}>⭐ MOST POPULAR</div>}
              <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
              <div style={{ color: p.color, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>{p.tier}</div>
              <div style={{ color: "#475569", fontSize: 13, marginBottom: 16 }}>{p.tagline}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
                <span style={{ color: "#e2e8f0", fontSize: 32, fontWeight: 900, fontFamily: "monospace" }}>{p.price}</span>
                <span style={{ color: "#475569", fontSize: 14 }}>{p.period}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: p.color, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ color: "#64748b", fontSize: 13, lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href="#assessment" style={{ ...css.btn(p.color, !p.highlight), display: "block", textAlign: "center", textDecoration: "none", borderRadius: 8, padding: "11px" }}>{p.cta}</a>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", color: "#334155", fontSize: 13, marginTop: 24 }}>All plans include onboarding support. Custom government contracting rates available. <a href="#contact" style={{ color: "#00e5c8", textDecoration: "none" }}>Contact us</a> for multi-site or agency pricing.</p>
      </section>

      {/* CI/CD & RAFTER */}
      <section id="cicd" style={{ background: "rgba(0,229,200,0.02)", padding: "80px 24px", borderTop: "1px solid rgba(0,229,200,0.08)", borderBottom: "1px solid rgba(0,229,200,0.08)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SectionHeader icon="🔄" title="CI/CD & Rafter Security Integration" sub="We practice what we preach. Every system we deploy is continuously scanned, tested, and hardened." accent="#22c55e" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 40 }}>
            {CICD_CHECKS.map(c => (
              <div key={c.label} style={{ background: "rgba(0,229,200,0.04)", border: "1px solid rgba(0,229,200,0.12)", borderRadius: 10, padding: "16px" }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
                <div style={{ color: "#00e5c8", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{c.label}</div>
                <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {[
              { icon: "🤖", color: "#00e5c8", title: "Autonomous Daily Scanning", body: "ASME agents run a full Rafter-pattern security scan every day at 3am ET — automatically. All 10 security rules evaluated across every service layer. Critical findings trigger an immediate executive alert." },
              { icon: "📊", color: "#38bdf8", title: "Weekly Executive Reports",   body: "Every Monday at 7am ET, a full security posture report is emailed to executive leadership. Includes trend analysis, new vulnerabilities introduced, remediation status, and a prioritized action list." },
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
              Emerging Defense Solutions is a <strong style={{ color: "#00e5c8" }}>Service-Disabled Veteran-Owned Small Business (SDVOSB)</strong> headquartered in Fredericksburg, Virginia — at the intersection of DoD Country and the nation's capital.
            </p>
            <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>Founded by veterans with decades of combined experience in defense, cybersecurity, and enterprise operations, EDS was built to deliver the same mission-critical reliability that the military demands — applied to securing the businesses, agencies, and communities of the modern world.</p>
            <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>Two executives. AI-powered agents running 24/7. Zero compromise on quality.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span style={css.badge("#00e5c8")}>🎖️ SDVOSB Certified</span>
              <span style={css.badge("#38bdf8")}>🏢 Fredericksburg, VA</span>
              <span style={css.badge("#2dd4bf")}>🤖 AI-Augmented Ops</span>
              <span style={css.badge("#38bdf8")}>🛡️ CIA Triad Aligned</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "🧭", color: "#00e5c8", title: "Mission", desc: "To deliver enterprise-grade security, compliance, and operational excellence to organizations that can't afford to fail." },
              { icon: "👁️", color: "#38bdf8", title: "Vision",  desc: "A world where every organization — from a 2-person startup to a federal agency — has access to the same level of defense that protects the nation." },
              { icon: "⚖️", color: "#2dd4bf", title: "Values",  desc: "Confidentiality. Integrity. Availability. No shortcuts, no excuses, no gaps." },
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
      <section id="contact" style={{ background: "rgba(0,229,200,0.02)", borderTop: "1px solid rgba(0,229,200,0.1)", padding: "80px 24px" }}>
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
            <a href="tel:5404988350" style={{ color: "#475569", fontSize: 14, textDecoration: "none" }}>📞 (540) 498-8350</a>
            <span style={{ color: "#334155" }}>|</span>
            <a href="mailto:cyber@eds-360.com" style={{ color: "#475569", fontSize: 14, textDecoration: "none" }}>✉️ cyber@eds-360.com</a>
            <span style={{ color: "#334155" }}>|</span>
            <span style={{ color: "#475569", fontSize: 14 }}>📍 Northern Virginia / Maryland / DC</span>
            <span style={{ color: "#334155" }}>|</span>
            <a href="https://eds-360.com" target="_blank" rel="noreferrer" style={{ color: "#475569", fontSize: 14, textDecoration: "none" }}>🌐 eds-360.com</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#040d14", borderTop: "1px solid rgba(0,229,200,0.1)", padding: "28px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>🛡️</span>
            <span style={{ fontWeight: 900, fontSize: 15, color: "#00e5c8" }}>EDS</span>
            <span style={{ color: "#334155", fontSize: 15 }}>Emerging Defense Solutions</span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 14, flexWrap: "wrap" }}>
            {["Confidentiality", "Integrity", "Availability"].map((v, i) => (
              <span key={v} style={{ color: ["#00e5c8", "#38bdf8", "#2dd4bf"][i], fontSize: 13, fontWeight: 700 }}>● {v}</span>
            ))}
          </div>
          <div style={{ color: "#1e293b", fontSize: 12 }}>© 2026 Emerging Defense Solutions LLC · Fredericksburg, VA · SDVOSB Certified · All Rights Reserved</div>
        </div>
      </footer>

    </div>
  );
}