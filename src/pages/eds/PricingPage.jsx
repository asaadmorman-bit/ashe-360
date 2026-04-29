import EDSNav from "../../components/eds/EDSNav";
import EDSFooter from "../../components/eds/EDSFooter";
import { Link } from "react-router-dom";

const PRICING = [
  { tier: "Starter", icon: "🔰", color: "#2dd4bf", price: "$1,500", period: "/mo", tagline: "For small businesses & startups", highlight: false, cta: "Get Started", features: ["24/7 SOC monitoring (up to 25 endpoints)", "Monthly security posture report", "Email threat triage", "NIST CSF gap assessment (annual)", "Incident response (business hours)", "1 compliance framework advisory", "Slack/email alerting"] },
  { tier: "Professional", icon: "⚡", color: "#00e5c8", price: "$4,500", period: "/mo", tagline: "For SMBs & government contractors", highlight: true, cta: "Most Popular", features: ["24/7 SOC monitoring (up to 150 endpoints)", "Weekly executive security brief", "SIEM + SOAR automation", "CMMC / NIST RMF compliance support", "Incident response <4hr SLA", "STIG scanning & remediation", "VirusTotal + CVE feed integration", "Dedicated account manager", "2 compliance frameworks"] },
  { tier: "Enterprise", icon: "🏛️", color: "#38bdf8", price: "Custom", period: "", tagline: "For federal agencies & large orgs", highlight: false, cta: "Contact Us", features: ["Unlimited endpoints", "Full-time vCISO / ISSO support", "ATO package authoring", "FedRAMP readiness assessment", "Zero Trust architecture design", "Incident response <1hr SLA", "All compliance frameworks", "ServiceNow ITSM integration", "On-site assessments available", "Custom SLA & white-glove support"] },
];

const FAQ = [
  { q: "Do contracts require long-term commitments?", a: "No. All plans are month-to-month. We earn your business every month." },
  { q: "Can we start with a project before committing to a managed plan?", a: "Absolutely. Many clients start with a one-time assessment or pen test before moving to a managed program." },
  { q: "Are government contracting rates available?", a: "Yes. We offer special pricing for DoD primes, subs, and federal agencies. Contact us for a custom quote." },
  { q: "What happens if we have an incident?", a: "Professional and Enterprise clients receive SLA-backed incident response. Starter clients receive best-effort support during business hours." },
  { q: "Can you scale with us as we grow?", a: "Yes. Plans can be upgraded at any time. Enterprise is fully custom-scoped to your environment." },
];

const css = {
  page: { background: "linear-gradient(160deg, #071520 0%, #0a2030 40%, #082828 100%)", minHeight: "100vh", fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif", color: "#e2e8f0" },
};

export default function PricingPage() {
  return (
    <div style={css.page}>
      <EDSNav />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <img src="https://media.base44.com/images/public/69f1f1da68cbf198a19d2008/74f34baa5_2133.png" alt="EDS" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(0,229,200,0.3)", marginBottom: 16 }} />
          <h1 style={{ margin: "0 0 12px", fontSize: 36, fontWeight: 900, color: "#e2e8f0" }}>Transparent Pricing</h1>
          <p style={{ color: "#64748b", fontSize: 16, maxWidth: 600, margin: "0 auto" }}>No surprises. No hidden fees. Pick the tier that fits your mission.</p>
          <div style={{ width: 48, height: 3, background: "#00e5c8", borderRadius: 2, margin: "14px auto 0" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, alignItems: "start", marginBottom: 16 }}>
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
              <Link to="/contact" style={{ display: "block", textAlign: "center", padding: "11px", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", background: p.highlight ? p.color : "transparent", color: p.highlight ? "#071520" : p.color, border: p.highlight ? "none" : `2px solid ${p.color}` }}>{p.cta}</Link>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", color: "#334155", fontSize: 13, marginBottom: 60 }}>All plans include onboarding support. Custom government contracting rates available. <Link to="/contact" style={{ color: "#00e5c8", textDecoration: "none" }}>Contact us</Link> for multi-site or agency pricing.</p>

        <h2 style={{ textAlign: "center", fontSize: 26, fontWeight: 900, color: "#e2e8f0", marginBottom: 28 }}>Frequently Asked Questions</h2>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
          {FAQ.map(f => (
            <div key={f.q} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(0,229,200,0.1)", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ color: "#00e5c8", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{f.q}</div>
              <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.6 }}>{f.a}</div>
            </div>
          ))}
        </div>
      </div>
      <EDSFooter />
    </div>
  );
}