import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { label: "Services",     path: "/services"     },
  { label: "Compliance",   path: "/compliance"   },
  { label: "Case Studies", path: "/case-studies" },
  { label: "Pricing",      path: "/pricing"      },
  { label: "CI/CD",        path: "/cicd"         },
  { label: "About",        path: "/about"        },
  { label: "Contact",      path: "/contact"      },
];

export default function EDSNav() {
  const location = useLocation();

  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(7,21,32,0.96)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,229,200,0.12)", padding: "0 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="https://media.base44.com/images/public/69f1f1da68cbf198a19d2008/74f34baa5_2133.png" alt="EDS Logo" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, color: "#00e5c8", letterSpacing: 1 }}>Emerging Defense Solutions</div>
            <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, marginTop: -2 }}>PREMIER SOCaaS · cyber.eds-360.com</div>
          </div>
        </Link>
        <div style={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          {NAV_LINKS.map(l => (
            <Link
              key={l.label}
              to={l.path}
              style={{
                padding: "8px 11px",
                fontSize: 12,
                fontWeight: 500,
                color: location.pathname === l.path ? "#00e5c8" : "#94a3b8",
                textDecoration: "none",
                borderRadius: 8,
                background: location.pathname === l.path ? "rgba(0,229,200,0.08)" : "transparent",
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/contact" style={{ marginLeft: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: "#00e5c8", color: "#071520", textDecoration: "none", borderRadius: 8 }}>
            Free Assessment →
          </Link>
        </div>
      </div>
    </nav>
  );
}