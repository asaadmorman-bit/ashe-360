import EDSNav from "../../components/eds/EDSNav";
import EDSFooter from "../../components/eds/EDSFooter";
import { Link } from "react-router-dom";

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

const PIPELINE_STAGES = [
  { icon: "📝", color: "#00e5c8", stage: "Code Commit", desc: "Secrets scanner runs on every push. Pre-commit hooks block hardcoded credentials, API keys, and sensitive strings from ever reaching the repo." },
  { icon: "🔬", color: "#38bdf8", stage: "Static Analysis", desc: "SAST tools scan the codebase for injection vulnerabilities, insecure function calls, and common OWASP Top 10 patterns on every pull request." },
  { icon: "📦", color: "#2dd4bf", stage: "Dependency Audit", desc: "All third-party packages are checked against the NVD CVE database. Known vulnerable dependencies block the build pipeline automatically." },
  { icon: "🧪", color: "#a78bfa", stage: "DAST Testing", desc: "Dynamic application security testing runs against deployed preview environments, probing for runtime vulnerabilities, auth bypass, and injection flaws." },
  { icon: "🔐", color: "#00e5c8", stage: "Security Gate", desc: "No code ships without passing all security checks. Critical findings are a hard block. High findings require risk acceptance with documented approval." },
  { icon: "🚀", color: "#38bdf8", stage: "Monitored Deploy", desc: "Production deployments are monitored in real time via SIEM. Any anomalous behavior post-deploy triggers an immediate SOC alert." },
];

const css = {
  page: { background: "linear-gradient(160deg, #071520 0%, #0a2030 40%, #082828 100%)", minHeight: "100vh", fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif", color: "#e2e8f0" },
};

export default function CICDPage() {
  return (
    <div style={css.page}>
      <EDSNav />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <img src="https://media.base44.com/images/public/69f1f1da68cbf198a19d2008/74f34baa5_2133.png" alt="EDS" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(0,229,200,0.3)", marginBottom: 16 }} />
          <h1 style={{ margin: "0 0 12px", fontSize: 36, fontWeight: 900, color: "#e2e8f0" }}>CI/CD & Rafter Security</h1>
          <p style={{ color: "#64748b", fontSize: 16, maxWidth: 600, margin: "0 auto" }}>We practice what we preach. Every system we deploy is continuously scanned, tested, and hardened.</p>
          <div style={{ width: 48, height: 3, background: "#22c55e", borderRadius: 2, margin: "14px auto 0" }} />
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", marginBottom: 20 }}>10-Point Rafter Security Checklist</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 60 }}>
          {CICD_CHECKS.map(c => (
            <div key={c.label} style={{ background: "rgba(0,229,200,0.04)", border: "1px solid rgba(0,229,200,0.12)", borderRadius: 10, padding: "16px" }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ color: "#00e5c8", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{c.label}</div>
              <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.5 }}>{c.desc}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", marginBottom: 20 }}>Secure Pipeline Stages</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 60 }}>
          {PIPELINE_STAGES.map(p => (
            <div key={p.stage} style={{ background: `${p.color}08`, border: `1px solid ${p.color}20`, borderRadius: 14, padding: "22px" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>{p.icon}</span>
                <div style={{ color: p.color, fontWeight: 800, fontSize: 15 }}>{p.stage}</div>
              </div>
              <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.6 }}>{p.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 48 }}>
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

        <div style={{ textAlign: "center" }}>
          <Link to="/contact" style={{ padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700, background: "#22c55e", color: "#071520", textDecoration: "none" }}>Secure Your Pipeline →</Link>
        </div>
      </div>
      <EDSFooter />
    </div>
  );
}