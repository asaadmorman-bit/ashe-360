import { Link } from "react-router-dom";
import EDSNav from "../components/eds/EDSNav";
import EDSFooter from "../components/eds/EDSFooter";

const SECTIONS = [
  { icon: "🛡️", color: "#00e5c8", title: "Services",      sub: "SOCaaS, Zero Trust, Pen Testing & more",   path: "/services"     },
  { icon: "🏛️", color: "#38bdf8", title: "Compliance",    sub: "CMMC, NIST, FISMA, SOC2, FedRAMP",         path: "/compliance"   },
  { icon: "📁", color: "#2dd4bf", title: "Case Studies",  sub: "Real results from real engagements",        path: "/case-studies" },
  { icon: "💰", color: "#00e5c8", title: "Pricing",       sub: "Transparent, no-surprise pricing tiers",    path: "/pricing"      },
  { icon: "🔄", color: "#38bdf8", title: "CI/CD Security","sub": "Rafter pattern scanning & automation",    path: "/cicd"         },
  { icon: "🎖️", color: "#2dd4bf", title: "About EDS",    sub: "SDVOSB veteran-owned, Spotsylvania VA",     path: "/about"        },
  { icon: "🎓", color: "#a78bfa", title: "Training",      sub: "Register for upcoming security classes",    path: "/training-register" },
  { icon: "📡", color: "#f97316", title: "Contact",       sub: "Book a free security assessment",           path: "/contact"      },
];

export default function EDSHome() {
  return (
    <div style={{ background: "linear-gradient(160deg, #071520 0%, #0a2030 50%, #082828 100%)", minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif", color: "#e2e8f0" }}>
      <EDSNav />

      {/* Hero */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center" }}>
        <img
          src="https://media.base44.com/images/public/69f1f1da68cbf198a19d2008/74f34baa5_2133.png"
          alt="EDS Logo"
          style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(0,229,200,0.35)", boxShadow: "0 0 32px rgba(0,229,200,0.12)", marginBottom: 28 }}
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
          <span style={{ background: "rgba(0,229,200,0.1)", color: "#00e5c8", border: "1px solid rgba(0,229,200,0.25)", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>🎖️ SDVOSB Veteran-Owned</span>
          <span style={{ background: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.25)", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>🛡️ Premier SOCaaS</span>
          <span style={{ background: "rgba(0,229,200,0.1)", color: "#2dd4bf", border: "1px solid rgba(0,229,200,0.25)", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>🏛️ CMMC · NIST · FedRAMP</span>
        </div>
        <h1 style={{ margin: "0 0 16px", fontSize: "clamp(32px,5vw,52px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
          Defending What<br /><span style={{ color: "#00e5c8" }}>Matters Most.</span>
        </h1>
        <p style={{ color: "#64748b", fontSize: 17, lineHeight: 1.7, maxWidth: 560, margin: "0 auto 36px" }}>
          Enterprise-grade cybersecurity and SOCaaS built on <strong style={{ color: "#94a3b8" }}>Confidentiality, Integrity, and Availability</strong> — for federal contractors, agencies, and enterprises.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/contact" style={{ padding: "13px 28px", borderRadius: 10, background: "#00e5c8", color: "#071520", fontWeight: 800, fontSize: 15, textDecoration: "none" }}>
            Book Free Assessment →
          </Link>
          <Link to="/services" style={{ padding: "13px 28px", borderRadius: 10, background: "transparent", border: "2px solid rgba(0,229,200,0.35)", color: "#00e5c8", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
            Our Services
          </Link>
        </div>
      </div>

      {/* Section Cards */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ textAlign: "center", color: "#334155", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 24 }}>Explore EDS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {SECTIONS.map(s => (
            <Link
              key={s.path}
              to={s.path}
              style={{ background: `${s.color}08`, border: `1px solid ${s.color}25`, borderTop: `3px solid ${s.color}`, borderRadius: 14, padding: "22px 20px", textDecoration: "none", display: "flex", flexDirection: "column", gap: 8, transition: "transform 0.15s, box-shadow 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}18`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <span style={{ fontSize: 26 }}>{s.icon}</span>
              <div style={{ color: "#e2e8f0", fontWeight: 800, fontSize: 15 }}>{s.title}</div>
              <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.5 }}>{s.sub}</div>
              <div style={{ color: s.color, fontSize: 12, fontWeight: 700, marginTop: 4 }}>Explore →</div>
            </Link>
          ))}
        </div>

        {/* Trust strip */}
        <div style={{ marginTop: 56, padding: "20px 24px", background: "rgba(0,229,200,0.03)", border: "1px solid rgba(0,229,200,0.1)", borderRadius: 14, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 20 }}>
          {["CMMC L1–L3", "NIST 800-53", "DISA STIGs", "FedRAMP", "SOC 2", "ISO 27001", "CISA Zero Trust", "SDVOSB"].map(b => (
            <span key={b} style={{ color: "#334155", fontSize: 12, fontWeight: 600 }}>{b}</span>
          ))}
        </div>

        {/* Contact strip */}
        <div style={{ marginTop: 20, textAlign: "center", display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          <a href="tel:5404988350" style={{ color: "#475569", fontSize: 13, textDecoration: "none" }}>📞 (540) 498-8350</a>
          <a href="mailto:cyber@eds-360.com" style={{ color: "#475569", fontSize: 13, textDecoration: "none" }}>✉️ cyber@eds-360.com</a>
          <span style={{ color: "#475569", fontSize: 13 }}>📍 Spotsylvania, VA</span>
          <a href="https://emergingdefensesolutions.com" target="_blank" rel="noreferrer" style={{ color: "#475569", fontSize: 13, textDecoration: "none" }}>🌐 emergingdefensesolutions.com</a>
        </div>
      </div>

      <EDSFooter />
    </div>
  );
}