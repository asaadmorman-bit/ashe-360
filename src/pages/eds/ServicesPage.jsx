import EDSNav from "../../components/eds/EDSNav";
import EDSFooter from "../../components/eds/EDSFooter";
import { Link } from "react-router-dom";

const SERVICES = [
  { icon: "🛡️", color: "#00e5c8", title: "SOCaaS — Security Operations", sub: "24/7 Managed Security", desc: "Fully managed Security Operations Center as a Service. Real-time threat detection, incident response, SIEM/SOAR automation, and zero-day exploit management — without the overhead of building an in-house SOC.", features: ["24/7 Threat Monitoring", "Incident Response & Containment", "SIEM / SOAR Automation", "Zero-Day & IOC Hunting", "VirusTotal + Suricata Integration", "Executive Reporting"] },
  { icon: "🔒", color: "#38bdf8", title: "Zero Trust Architecture", sub: "Identity-First Security", desc: "Design, implement, and maintain a Zero Trust security posture aligned to CISA's Zero Trust Maturity Model. Every user, device, and connection is continuously verified — never implicitly trusted.", features: ["CISA ZT Maturity Assessment", "Identity & Access Management", "Micro-Segmentation", "Continuous Verification", "Network Access Control", "Policy Enforcement"] },
  { icon: "📋", color: "#a78bfa", title: "Compliance & Certification", sub: "CMMC · NIST · FISMA · SOC2", desc: "End-to-end compliance management for federal and commercial requirements. From gap assessments to ATO packages, we guide your organization through every control framework with precision.", features: ["CMMC Level 1–3 Preparation", "NIST RMF / SP 800-53", "FISMA ATO Packages", "SOC2 Type I & II", "ISO 27001", "FedRAMP Readiness"] },
  { icon: "🎖️", color: "#00e5c8", title: "Defense & Security Training", sub: "Professional Certification", desc: "Hands-on cybersecurity and defense training programs built for government contractors, military personnel, and enterprise teams. DISA-aligned, certification-ready, and delivered in-person or virtually.", features: ["Security+ / CISSP Prep", "DISA STIG Compliance Training", "Insider Threat Awareness", "Active Shooter / Emergency Response", "Incident Command System (ICS)", "Cleared Personnel Programs"] },
  { icon: "🔍", color: "#38bdf8", title: "Penetration Testing & Red Team", sub: "Adversarial Security Assessment", desc: "Simulated cyberattacks designed to uncover exploitable vulnerabilities before real adversaries do. From external network pen tests to full red team engagements, we test what matters most.", features: ["External & Internal Network Pen Test", "Web Application Testing", "Phishing Simulation", "Red Team Engagements", "OWASP Top 10 Coverage", "Executive-Ready Findings Report"] },
  { icon: "📊", color: "#2dd4bf", title: "Security Awareness Training", sub: "Human-Layer Defense", desc: "Your people are your perimeter. EDS delivers role-based cybersecurity awareness training that reduces phishing click rates, builds a security-first culture, and satisfies compliance training requirements.", features: ["Phishing Simulation Campaigns", "Role-Based Training Modules", "DISA / NIST Aligned Content", "Compliance Tracking & Reporting", "Insider Threat Awareness", "Annual Certification Programs"] },
];

const css = {
  page: { background: "linear-gradient(160deg, #071520 0%, #0a2030 40%, #082828 100%)", minHeight: "100vh", fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif", color: "#e2e8f0" },
  badge: (color) => ({ background: `${color}15`, color, border: `1px solid ${color}30`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700, display: "inline-block" }),
};

export default function ServicesPage() {
  return (
    <div style={css.page}>
      <EDSNav />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <img src="https://media.base44.com/images/public/69f1f1da68cbf198a19d2008/74f34baa5_2133.png" alt="EDS" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(0,229,200,0.3)", marginBottom: 16 }} />
          <h1 style={{ margin: "0 0 12px", fontSize: 36, fontWeight: 900, color: "#e2e8f0" }}>Our IT & Cyber Service Lines</h1>
          <p style={{ color: "#64748b", fontSize: 16, maxWidth: 600, margin: "0 auto" }}>Four specialized practices. One unified mission: protecting your organization's people, data, and infrastructure.</p>
          <div style={{ width: 48, height: 3, background: "#00e5c8", borderRadius: 2, margin: "14px auto 0" }} />
        </div>
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
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <Link to="/contact" style={{ padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700, background: "#00e5c8", color: "#071520", textDecoration: "none" }}>Get a Free Assessment →</Link>
        </div>
      </div>
      <EDSFooter />
    </div>
  );
}