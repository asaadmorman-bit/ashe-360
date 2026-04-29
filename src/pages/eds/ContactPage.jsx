import { useState } from "react";
import EDSNav from "../../components/eds/EDSNav";
import EDSFooter from "../../components/eds/EDSFooter";

const css = {
  page: { background: "linear-gradient(160deg, #071520 0%, #0a2030 40%, #082828 100%)", minHeight: "100vh", fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif", color: "#e2e8f0" },
  input: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,229,200,0.15)", borderRadius: 8, color: "#e2e8f0", fontSize: 15, padding: "11px 14px", outline: "none", width: "100%", boxSizing: "border-box" },
  btn: { padding: "13px 28px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", border: "none", background: "#00e5c8", color: "#071520" },
};

export default function ContactPage() {
  const [contactForm, setContactForm] = useState({ name: "", email: "", company: "", service: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [assessForm, setAssessForm] = useState({ name: "", email: "", company: "", size: "" });
  const [assessSubmitted, setAssessSubmitted] = useState(false);

  return (
    <div style={css.page}>
      <EDSNav />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <img src="https://media.base44.com/images/public/69f1f1da68cbf198a19d2008/74f34baa5_2133.png" alt="EDS" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(0,229,200,0.3)", marginBottom: 16 }} />
          <h1 style={{ margin: "0 0 12px", fontSize: 36, fontWeight: 900, color: "#e2e8f0" }}>Start the Conversation</h1>
          <p style={{ color: "#64748b", fontSize: 16, maxWidth: 540, margin: "0 auto" }}>Tell us about your organization. We'll respond within one business day.</p>
          <div style={{ width: 48, height: 3, background: "#00e5c8", borderRadius: 2, margin: "14px auto 0" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40, marginBottom: 60 }}>
          {/* Free Assessment */}
          <div>
            <div style={{ display: "inline-block", background: "rgba(0,229,200,0.1)", border: "1px solid rgba(0,229,200,0.3)", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700, color: "#00e5c8", marginBottom: 14 }}>🆓 NO COST · NO OBLIGATION</div>
            <h2 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 900, color: "#e2e8f0", lineHeight: 1.2 }}>Book a Free 30-Min<br /><span style={{ color: "#00e5c8" }}>Security Posture Review</span></h2>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, margin: "0 0 20px" }}>In 30 minutes, EDS will assess your current security posture, identify your top 3 compliance gaps, and give you a prioritized action plan — completely free. No sales pitch. Just answers.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {["Identify your CMMC / NIST gap score", "Pinpoint your highest-risk exposure areas", "Get a plain-language remediation roadmap", "No commitment required — just clarity"].map(i => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: "#00e5c8", fontSize: 14, flexShrink: 0 }}>✓</span>
                  <span style={{ color: "#64748b", fontSize: 14 }}>{i}</span>
                </div>
              ))}
            </div>
            {assessSubmitted ? (
              <div style={{ background: "rgba(0,229,200,0.05)", border: "1px solid rgba(0,229,200,0.2)", borderRadius: 16, padding: "28px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
                <div style={{ color: "#00e5c8", fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Request Received!</div>
                <div style={{ color: "#475569", fontSize: 13 }}>We'll reach out within one business day. Mission accepted.</div>
              </div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); setAssessSubmitted(true); }} style={{ background: "rgba(0,229,200,0.03)", border: "1px solid rgba(0,229,200,0.15)", borderRadius: 16, padding: "24px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ color: "#e2e8f0", fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Request Free Assessment</div>
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
                <button type="submit" style={{ ...css.btn, borderRadius: 8, width: "100%" }}>Book My Free Assessment →</button>
                <div style={{ color: "#334155", fontSize: 11, textAlign: "center" }}>🔒 Your information is encrypted and never shared.</div>
              </form>
            )}
          </div>

          {/* General Contact */}
          <div>
            <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 800, color: "#e2e8f0" }}>General Inquiry</h2>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "40px 20px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 16 }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
                <div style={{ color: "#22c55e", fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Message Received</div>
                <div style={{ color: "#475569", fontSize: 14 }}>We'll be in touch within one business day. Mission accepted.</div>
              </div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
                  <option>Penetration Testing &amp; Red Team</option>
                  <option>Security Awareness Training</option>
                  <option>Multiple Services / Not Sure Yet</option>
                </select>
                <textarea style={{ ...css.input, minHeight: 120, resize: "vertical" }} placeholder="Tell us about your security needs, compliance goals, or challenges you're facing..." value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} />
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <button type="submit" style={{ ...css.btn, borderRadius: 10, flex: 1 }}>Submit Inquiry →</button>
                  <div style={{ color: "#334155", fontSize: 12, flex: 1, minWidth: 160 }}>🔒 Encrypted & confidential. We never sell your data.</div>
                </div>
              </form>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 28 }}>
              {[
                { icon: "📞", label: "(540) 498-8350", href: "tel:5404988350" },
                { icon: "✉️", label: "cyber@eds-360.com", href: "mailto:cyber@eds-360.com" },
                { icon: "🌐", label: "emergingdefensesolutions.com", href: "https://emergingdefensesolutions.com", ext: true },
                { icon: "📍", label: "Spotsylvania, VA · Serving NoVA / MD / DC", href: null },
              ].map(c => (
                <div key={c.label} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 16 }}>{c.icon}</span>
                  {c.href ? (
                    <a href={c.href} target={c.ext ? "_blank" : undefined} rel={c.ext ? "noreferrer" : undefined} style={{ color: "#64748b", fontSize: 14, textDecoration: "none" }}>{c.label}</a>
                  ) : (
                    <span style={{ color: "#64748b", fontSize: 14 }}>{c.label}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <EDSFooter />
    </div>
  );
}