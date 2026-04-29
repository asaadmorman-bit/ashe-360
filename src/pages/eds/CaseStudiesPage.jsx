import { useState } from "react";
import EDSNav from "../../components/eds/EDSNav";
import EDSFooter from "../../components/eds/EDSFooter";
import { Link } from "react-router-dom";

const CASE_STUDIES = [
  { icon: "🏗️", color: "#00e5c8", tag: "Defense Contractor", title: "CMMC L2 Achieved in 90 Days", client: "Mid-size DoD subcontractor, 80 employees", challenge: "Failed pre-assessment with 47 open findings. Contract at risk. CUI handling gaps across 3 sites.", solution: "EDS deployed agentless SCAP scanning, remediated all CAT I STIGs, implemented CUI data flow mapping, and built the SSP from scratch.", result: "CMMC Level 2 certification achieved in 87 days. $4.2M contract retained. Zero CAT I findings at final assessment.", metrics: [{ v: "87", u: "days" }, { v: "47→0", u: "findings" }, { v: "$4.2M", u: "contract saved" }] },
  { icon: "🏫", color: "#38bdf8", tag: "K-12 Education", title: "Ransomware Contained in 38 Minutes", client: "County school district, 14,000 students", challenge: "LockBit variant deployed via phishing. 3 servers encrypted. No IR plan. IT team of 2.", solution: "EDS SOCaaS detected lateral movement via Suricata at T+4 min. Network isolation triggered. Forensic imaging, IOC extraction, and recovery playbook executed.", result: "38-minute containment. No student data exfiltrated. Schools online next morning. Full IOC report delivered to FBI CISA.", metrics: [{ v: "38", u: "min containment" }, { v: "0", u: "records stolen" }, { v: "100%", u: "recovery" }] },
  { icon: "🏛️", color: "#2dd4bf", tag: "Municipal Government", title: "FISMA ATO Package — 6 Weeks", client: "Regional metro authority, 400 endpoints", challenge: "FY audit approaching. No existing ATO documentation. Legacy systems with unknown asset inventory. $180K in potential funding at risk.", solution: "EDS conducted full asset discovery via agentless scanning, built the system security plan, conducted risk assessment, and authored the complete ATO package.", result: "ATO granted on first submission. Audit passed. $180K federal funding secured. Ongoing ISSO retainer established.", metrics: [{ v: "6", u: "weeks to ATO" }, { v: "1st", u: "submission pass" }, { v: "$180K", u: "funding secured" }] },
  { icon: "🏥", color: "#a78bfa", tag: "Healthcare", title: "HIPAA + NIST CSF Alignment in 60 Days", client: "Regional hospital system, 1,200 employees", challenge: "OCR audit notice received. No formal risk assessment on file. Unencrypted PHI found on 3 workstations.", solution: "EDS performed a full HIPAA Security Rule gap analysis, encrypted all endpoints, implemented access logging, and authored the required risk analysis documentation.", result: "OCR audit passed with no corrective action plan required. $2.1M in potential penalties avoided. Ongoing quarterly review retainer established.", metrics: [{ v: "60", u: "days" }, { v: "$2.1M", u: "penalties avoided" }, { v: "0", u: "CAP required" }] },
  { icon: "🏢", color: "#38bdf8", tag: "Financial Services", title: "PCI DSS SAQ-D Passed First Submission", client: "Regional credit union, 22 branches", challenge: "Failed internal PCI scoping review. Card data environment boundary undefined. No WAF. Penetration test overdue by 18 months.", solution: "EDS scoped the CDE, deployed WAF, conducted internal/external pen test, remediated all critical findings, and authored the SAQ-D response.", result: "PCI DSS SAQ-D completed and passed on first submission. Pen test findings reduced from 18 to 0 critical. Card processing license retained.", metrics: [{ v: "1st", u: "submission pass" }, { v: "18→0", u: "critical findings" }, { v: "100%", u: "license retained" }] },
  { icon: "🚀", color: "#00e5c8", tag: "Aerospace Startup", title: "FedRAMP Ready Designation in 4 Months", client: "SaaS startup, 45 employees, targeting DoD market", challenge: "Product ready for DoD market but no FedRAMP documentation. ATO required for $6M contract. No dedicated security staff.", solution: "EDS acted as full-time vCISO and ISSO. Authored boundary documentation, SSP, all 17 NIST 800-53 control families, and coordinated 3PAO engagement.", result: "FedRAMP Ready designation granted. 3PAO assessment scheduled. $6M contract pipeline unlocked. EDS retained as ISSO going forward.", metrics: [{ v: "4", u: "months" }, { v: "$6M", u: "pipeline unlocked" }, { v: "Ready", u: "designation" }] },
];

const css = {
  page: { background: "linear-gradient(160deg, #071520 0%, #0a2030 40%, #082828 100%)", minHeight: "100vh", fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif", color: "#e2e8f0" },
  badge: (color) => ({ background: `${color}15`, color, border: `1px solid ${color}30`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700, display: "inline-block" }),
};

export default function CaseStudiesPage() {
  const [openCase, setOpenCase] = useState(null);

  return (
    <div style={css.page}>
      <EDSNav />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <img src="https://media.base44.com/images/public/69f1f1da68cbf198a19d2008/74f34baa5_2133.png" alt="EDS" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(0,229,200,0.3)", marginBottom: 16 }} />
          <h1 style={{ margin: "0 0 12px", fontSize: 36, fontWeight: 900, color: "#e2e8f0" }}>Case Studies</h1>
          <p style={{ color: "#64748b", fontSize: 16, maxWidth: 600, margin: "0 auto" }}>Real results. Real organizations. Anonymized to protect our clients.</p>
          <div style={{ width: 48, height: 3, background: "#2dd4bf", borderRadius: 2, margin: "14px auto 0" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
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
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
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

        <div style={{ textAlign: "center", marginTop: 48 }}>
          <Link to="/contact" style={{ padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700, background: "#2dd4bf", color: "#071520", textDecoration: "none" }}>Start Your Success Story →</Link>
        </div>
      </div>
      <EDSFooter />
    </div>
  );
}