import { Link } from "react-router-dom";

export default function EDSFooter() {
  return (
    <footer style={{ background: "#040d14", borderTop: "1px solid rgba(0,229,200,0.1)", padding: "28px 24px", textAlign: "center" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <img src="https://media.base44.com/images/public/69f1f1da68cbf198a19d2008/74f34baa5_2133.png" alt="EDS Logo" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(0,229,200,0.25)" }} />
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: "#00e5c8" }}>Emerging Defense Solutions</div>
            <div style={{ fontSize: 11, color: "#334155" }}>Premier SOCaaS · cyber.eds-360.com</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
          {["/services", "/compliance", "/case-studies", "/pricing", "/cicd", "/about", "/contact"].map((path, i) => (
            <Link key={path} to={path} style={{ color: "#334155", fontSize: 12, textDecoration: "none" }}>
              {["Services", "Compliance", "Case Studies", "Pricing", "CI/CD", "About", "Contact"][i]}
            </Link>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 14, flexWrap: "wrap" }}>
          {["Confidentiality", "Integrity", "Availability"].map((v, i) => (
            <span key={v} style={{ color: ["#00e5c8", "#38bdf8", "#2dd4bf"][i], fontSize: 13, fontWeight: 700 }}>● {v}</span>
          ))}
        </div>
        <div style={{ color: "#1e293b", fontSize: 12, marginBottom: 6 }}>
          <a href="https://emergingdefensesolutions.com" target="_blank" rel="noreferrer" style={{ color: "#334155", textDecoration: "none" }}>emergingdefensesolutions.com</a>
          {" · "}
          <a href="https://cyber.eds-360.com" target="_blank" rel="noreferrer" style={{ color: "#334155", textDecoration: "none" }}>cyber.eds-360.com</a>
        </div>
        <div style={{ color: "#1e293b", fontSize: 12 }}>© 2026 Created, Owned and Powered by Emerging Defense Solutions</div>
      </div>
    </footer>
  );
}