import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, ClipboardList, Map, Megaphone, ShieldAlert,
  BarChart3, Smartphone, Bell, MapPin, Users, Home, Star,
  Building2, Radio, Lock, ArrowDown, ArrowRight, UserPlus,
  CheckCircle2, Facebook, Twitter, Instagram
} from "lucide-react";
import logo from "../../assets/ReadyBarangay_Logo.png";
import "./LandingPage.css";

// ─── DATA ───────────────────────────────────────────────────────────────────

const features = [
  { icon: <AlertTriangle size={24} />, title: "Real-Time Alerts", body: "Push notifications reach all registered residents the moment an emergency is declared — no delay, no missed warnings." },
  { icon: <ClipboardList size={24} />, title: "Incident Reporting", body: "Any resident can file an emergency report with photos, GPS location, and severity level directly from their phone." },
  { icon: <Map size={24} />, title: "Evacuation Centers", body: "A live map shows open evacuation centers, current capacity, and the fastest route from your location." },
  { icon: <Megaphone size={24} />, title: "Official Broadcasts", body: "Barangay officials send verified announcements, weather updates, and health advisories to the entire community." },
  { icon: <ShieldAlert size={24} />, title: "Responder Dispatch", body: "Coordinate tanod, health workers, and fire volunteers from a single interface with live deployment status." },
  { icon: <BarChart3 size={24} />, title: "Incident Logs", body: "Every report, alert, and response is automatically logged — creating a reliable record for DRRM documentation." },
];

const steps = [
  { num: "1", icon: <Smartphone size={24} />, title: "Register", body: "Sign up with your barangay. Residents, officials, and the captain each have a dedicated account type." },
  { num: "2", icon: <Bell size={24} />, title: "Receive Alerts", body: "Get instant notifications whenever an emergency is declared or an official advisory is posted." },
  { num: "3", icon: <MapPin size={24} />, title: "Report or Locate", body: "File incident reports or find the nearest open evacuation center with live capacity information." },
  { num: "4", icon: <Users size={24} />, title: "Coordinate", body: "Officials manage response teams and track the situation from a centralized command dashboard." },
];

const roles = [
  {
    cls: "res", icon: <Home size={28} />, name: "Resident", sub: "Community Member",
    items: ["Receive real-time emergency alerts", "Report incidents with GPS location", "Find nearest open evacuation centers", "Access official announcements"],
    btn: "solid", btnLabel: "Sign Up as Resident", route: "/register"
  },
  {
    cls: "off", icon: <ShieldAlert size={28} />, name: "Official", sub: "Barangay Staff & Tanod",
    items: ["Manage and respond to incident reports", "Dispatch responders to emergencies", "Send verified advisories to residents", "Monitor evacuation center status"],
    btn: "outline", btnLabel: "Official Registration", route: "/register"
  },
  {
    cls: "cap", icon: <Star size={28} />, name: "Captain", sub: "Barangay Captain",
    items: ["Full command dashboard access", "Declare and lift community alert levels", "Oversee all operations and teams", "Generate official situation reports"],
    btn: "dark", btnLabel: "Captain's Portal", route: "/register-barangay"
  },
];

const stripItems = [
  "Real-Time Alerts", "Incident Reporting", "Evacuation Mapping",
  "Responder Dispatch", "Community Safety", "Disaster Preparedness",
  "Emergency Coordination", "Barangay Management",
];

const bannerPills = [
  { icon: <AlertTriangle size={14} />, label: "Emergency Alerts", sub: "Instant push notifications" },
  { icon: <ClipboardList size={14} />, label: "Incident Reports", sub: "File from your phone" },
  { icon: <Map size={14} />, label: "Evacuation Centers", sub: "Live capacity & maps" },
  { icon: <ShieldAlert size={14} />, label: "Responder Dispatch", sub: "Coordinate your team" },
];

const aboutItems = [
  { icon: <Building2 size={20} />, label: "Community-First Design", sub: "Built for Philippine barangays" },
  { icon: <Radio size={20} />, label: "Real-Time Communication", sub: "Alerts delivered in seconds" },
  { icon: <Lock size={20} />, label: "Role-Based Access", sub: "Residents, officials & captain" },
  { icon: <MapPin size={20} />, label: "GPS-Powered Reporting", sub: "Know exactly where help is needed" },
];

const footerCols = [
  { h: "Platform", links: ["Features", "How It Works", "For Residents", "For Officials"] },
  { h: "Account", links: ["Register", "Log In", "About Us", "Contact"] },
  { h: "Help", links: ["FAQ", "Emergency: 911", "info@readybrgy.ph", "Privacy Policy"] },
];

// ─── DIVIDER COMPONENT ──────────────────────────────────────────────────────

function SectionDivider({ color }) {
  return <div style={{ height: 0, borderTop: `4px solid ${color}` }} />;
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Scroll-reveal observer
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); }
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="lp">

      {/* ══════════════════════════════════════
          NAV
      ══════════════════════════════════════ */}
      <nav className="lp-nav">
        <a href="/" className="lp-nav-logo">
          <div className="lp-nav-logo-icon">
            <img src={logo} alt="Logo" className="auth-logo-img" />
          </div>
          <span className="lp-nav-logo-text">Ready<span>Barangay</span></span>
        </a>

        <ul className="lp-nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#how">How It Works</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#roles">Who It's For</a></li>
        </ul>

        <div className="lp-nav-actions">
          <button onClick={() => navigate("/login")} className="lp-btn-nav-ghost">Log In</button>
          <button onClick={() => navigate("/register")} className="lp-btn-nav">Sign Up</button>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          banner
      ══════════════════════════════════════ */}
      <section className="lp-banner">
        {/* Floating circle orbs */}
        <div className="banner-orb banner-orb-1" />
        <div className="banner-orb banner-orb-2" />
        <div className="banner-orb banner-orb-3" />
        {/* Decorative concentric rings */}
        <div className="banner-ring banner-ring-1" />
        <div className="banner-ring banner-ring-2" />
        <div className="banner-ring banner-ring-3" />

        <div className="lp-banner-content">
          <div className="banner-launch-tag">
            <div className="banner-launch-dot" />
            Now Live — Sign Up Free
          </div>

          <h1 className="lp-banner-title">
            Your<br />
            Barangay's<br />
            <span className="t-amber">Safety</span><br />
            <span className="t-red">System.</span>
          </h1>

          <p className="lp-banner-sub">
            ReadyBarangay connects residents, barangay officials, and the captain
            in one platform — for faster emergency alerts, coordinated response,
            and a safer community.
          </p>

          <div className="lp-banner-ctas">
            <button onClick={() => navigate("/register")} className="btn-banner-primary">
              Get Started Free <ArrowRight size={18} style={{ marginLeft: 8 }} />
            </button>
            <button className="btn-banner-ghost">See How It Works <ArrowDown size={18} style={{ marginLeft: 8 }} /></button>
          </div>
        </div>

        {/* Right-side pill badges */}
        <div className="lp-banner-right">
          {bannerPills.map((p, i) => (
            <div key={i} className="banner-pill">
              <div className="banner-pill-icon">{p.icon}</div>
              <div>
                <div className="banner-pill-label">{p.label}</div>
                <div className="banner-pill-sub">{p.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Circular scroll indicator */}
        <div className="lp-banner-scroll">
          <div className="scroll-circle"><ArrowDown size={18} /></div>
          Scroll
        </div>
      </section>

      <SectionDivider color="#B71C1C" />

      {/* ══════════════════════════════════════
          SCROLLING STRIP
      ══════════════════════════════════════ */}
      <div className="lp-strip">
        <div className="lp-strip-track">
          {[...stripItems, ...stripItems].map((item, i) => (
            <span key={i} className="lp-strip-item">
              <span className="strip-dot" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <SectionDivider color="#ffffff" />

      {/* ══════════════════════════════════════
          ABOUT
      ══════════════════════════════════════ */}
      <section id="about" className="lp-about">
        {/* Decorative background rings */}
        <div className="about-bg-circle" />
        <div className="about-bg-circle-2" />

        <div className="about-inner">
          {/* Left — dark card */}
          <div className="reveal">
            <div className="about-card">
              <div className="about-card-circle" />
              <div className="about-card-heading">Platform Overview</div>
              <div className="about-card-items">
                {aboutItems.map((item, i) => (
                  <div key={i} className="about-card-item">
                    <div className="about-item-icon">{item.icon}</div>
                    <div>
                      <div className="about-item-label">{item.label}</div>
                      <div className="about-item-sub">{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — text */}
          <div>
            <div className="eyebrow reveal">What is ReadyBarangay?</div>
            <h2 className="section-h about-heading reveal reveal-delay-1">
              Disaster<br />Preparedness<br />Made Simple.
            </h2>
            <div className="about-tagline reveal reveal-delay-2">
              One platform. Every role. Any emergency.
            </div>
            <p className="about-text-body reveal reveal-delay-3">
              ReadyBarangay is a community-based emergency response management
              system designed specifically for Philippine barangays. It bridges
              the gap between residents and local government during disasters —
              making communication faster, response smarter, and communities safer.
            </p>
            <button
              onClick={() => navigate("/register-barangay")}
              className="btn-primary reveal reveal-delay-4"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              Register Your Barangay
              <ArrowRight size={18} style={{ marginLeft: 8 }} />
            </button>
          </div>
        </div>
      </section>

      <SectionDivider color="#F5F5F5" />

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section id="how" className="lp-how">
        {/* Decorative rings */}
        <div className="how-bg-ring how-bg-ring-1" />
        <div className="how-bg-ring how-bg-ring-2" />

        <div className="lp-how-inner">
          <div className="lp-how-header">
            <div className="eyebrow how-eyebrow reveal">How It Works</div>
            <h2 className="section-h how-heading reveal reveal-delay-1">
              Four Steps to a Safer Barangay.
            </h2>
            <p className="how-sub reveal reveal-delay-2">
              Simple enough for every resident. Powerful enough for your response team.
            </p>
          </div>

          <div className="lp-how-grid">
            <div className="how-connector" />
            {steps.map((s, i) => (
              <div key={i} className={`how-card reveal reveal-delay-${i}`}>
                <div className="how-card-num">{s.num}</div>
                <div className="how-card-icon">{s.icon}</div>
                <div className="how-card-title">{s.title}</div>
                <div className="how-card-body">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider color="#212121" />

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section id="features" className="lp-features">
        {/* Circle orb decorations */}
        <div className="feat-orb feat-orb-1" />
        <div className="feat-orb feat-orb-2" />
        <div className="feat-bg-word">READY</div>

        <div className="lp-features-inner">
          <div className="lp-features-top">
            <div>
              <div className="eyebrow light reveal">Platform Features</div>
              <h2 className="section-h feat-heading reveal reveal-delay-1">
                Everything<br />Your Barangay<br />Needs.
              </h2>
            </div>
            <p className="feat-sub reveal">
              Purpose-built tools for every stage of disaster preparedness and community emergency response.
            </p>
          </div>

          <div className="lp-features-grid">
            {features.map((f, i) => (
              <div key={i} className={`feat-card reveal reveal-delay-${i % 3}`}>
                <div className="feat-card-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider color="#ffffff" />

      {/* ══════════════════════════════════════
          ROLES
      ══════════════════════════════════════ */}
      <section id="roles" className="lp-roles">
        {/* Decorative rings */}
        <div className="roles-bg-circle roles-bg-circle-1" />
        <div className="roles-bg-circle roles-bg-circle-2" />

        <div className="lp-roles-inner">
          <div className="lp-roles-header">
            <div className="eyebrow roles-eyebrow reveal">Who It's For</div>
            <h2 className="section-h roles-heading reveal reveal-delay-1">
              A Role for Everyone.
            </h2>
            <p className="roles-sub reveal reveal-delay-2">
              Whether you're a resident, a tanod, or the barangay captain —
              ReadyBarangay is built around your specific responsibilities.
            </p>
          </div>

          <div className="lp-roles-grid">
            {roles.map((r, i) => (
              <div key={i} className={`role-card reveal reveal-delay-${i}`}>
                <div className={`role-card-top ${r.cls}`}>
                  <div className="role-icon-wrap">{r.icon}</div>
                  <div className="role-name">{r.name}</div>
                  <div className="role-sub">{r.sub}</div>
                </div>
                <div className="role-card-body">
                  <ul className="role-list">
                    {r.items.map((item, j) => (
                      <li key={j}>
                        <span className="role-list-dot" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => navigate(r.route)} className={`btn-role ${r.btn}`}>
                    {r.btnLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider color="#212121" />

      {/* ══════════════════════════════════════
          CTA
      ══════════════════════════════════════ */}
      <section id="contact" className="lp-cta">
        {/* Concentric circle rings */}
        <div className="cta-circles">
          <div className="cta-circle cta-circle-1" />
          <div className="cta-circle cta-circle-2" />
          <div className="cta-circle cta-circle-3" />
          <div className="cta-circle cta-circle-4" />
        </div>
        <div className="cta-orb" />

        <div className="cta-inner">
          <div className="cta-badge reveal">
            <span className="cta-badge-dot" />
            Free for Philippine Barangays
          </div>

          <h2 className="cta-title reveal reveal-delay-1">
            Protect Your<br /><span>Barangay</span><br />Today.
          </h2>

          <p className="cta-sub reveal reveal-delay-2">
            ReadyBarangay is free to join. Register your barangay and start
            building a safer, better-prepared community — no setup cost, no commitment.
          </p>

          <div className="reveal reveal-delay-3">
            {!submitted ? (
              <>
                <div className="cta-form">
                  <input
                    className="cta-input"
                    type="email"
                    placeholder="Enter your email for updates"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button className="btn-cta" onClick={() => email && setSubmitted(true)}>
                    Notify Me
                  </button>
                </div>
                <p className="cta-note">No spam. Just updates when new features ship.</p>
                <div className="cta-divider">or register now</div>
                <button onClick={() => navigate("/register-barangay")} className="btn-cta-outline">
                  Create Your Account <UserPlus size={18} style={{ marginLeft: 8 }} />
                </button>
              </>
            ) : (
              <div className="cta-success">
                <div className="cta-success-icon"><CheckCircle2 size={48} color="var(--green-600)" /></div>
                <div className="cta-success-title">You're on the list!</div>
                <div className="cta-success-sub">We'll let you know when new features are available.</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="lp-footer">
        <div className="footer-top">
          <div>
            <a href="/" className="footer-brand">
              <div className="footer-brand-icon">
                <img src={logo} alt="Logo" className="auth-logo-img" />
              </div>
              <span className="footer-brand-name">Ready<span>Barangay</span></span>
            </a>
            <p className="footer-tagline">
              Community-based disaster preparedness and emergency response
              management for Philippine barangays.
            </p>
            <div className="footer-social">
              {[<Facebook size={20} />, <Twitter size={20} />, <Instagram size={20} />].map((s, i) => (
                <a key={i} href="/" className="footer-social-btn">{s}</a>
              ))}
            </div>
          </div>

          {footerCols.map((col, i) => (
            <div key={i} className="footer-col">
              <h4>{col.h}</h4>
              <ul>
                {col.links.map((l, j) => (
                  <li key={j}><a href="/">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <span>© 2026 ReadyBarangay. Built for Filipino communities.</span>
          <span><a href="/">Terms</a> · <a href="/">Privacy</a></span>
        </div>
      </footer>

    </div>
  );
}