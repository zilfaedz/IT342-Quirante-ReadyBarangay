import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import { Lock, Radio, Mail, Eye, EyeOff, ArrowRight } from "lucide-react";
import AlertBanner from "../../shared/ui/AlertBanner";
import logo from "../../assets/ReadyBarangay_Logo.png";
import "./Login.css";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  const navigateAfterLogin = useCallback((user) => {
    if (user?.role === "Super Admin") {
      navigate("/admin/verifications?tab=overview");
    } else {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleGoogleCredential = useCallback(async (response) => {
    setGoogleLoading(true);
    setError("");

    try {
      const result = await loginWithGoogle(response.credential, true);
      if (result.success) {
        navigateAfterLogin(result.user);
      } else {
        setError(result.message || "Google login failed. Please try again.");
      }
    } catch (err) {
      setError("Google login failed. Please try again later.");
    } finally {
      setGoogleLoading(false);
    }
  }, [loginWithGoogle, navigateAfterLogin]);

  useEffect(() => {
    if (!googleClientId) {
      return;
    }

    const initializeGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 320,
      });
    };

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      initializeGoogleButton();
      existingScript.addEventListener("load", initializeGoogleButton, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleButton;
    script.onerror = () => setError("Google sign-in could not be loaded. Please check your connection.");
    document.body.appendChild(script);
  }, [googleClientId, handleGoogleCredential]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(form.email, form.password, true);
      if (result.success) {
        navigateAfterLogin(result.user);
      } else {
        setError(result.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AlertBanner message={error} onClose={() => setError("")} />

      {/* Background decorations */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-ring auth-ring-1" />
      <div className="auth-ring auth-ring-2" />
      <div className="auth-ring auth-ring-3" />

      {/* Nav */}
      <nav className="auth-nav">
        <a href="/" className="auth-nav-logo">
          <div className="auth-nav-logo-icon">
            <img src={logo} alt="Logo" className="auth-logo-img" />
          </div>
          <span className="auth-nav-logo-text">Ready<span>Barangay</span></span>
        </a>
      </nav>

      {/* Main layout */}
      <div className="auth-layout">

        {/* Left panel */}
        <div className="auth-left">
          <div className="auth-left-inner">
            <div className="auth-eyebrow">Barangay Emergency Platform</div>
            <h1 className="auth-banner-title">
              Welcome<br />Back to<br /><span className="t-red">Safety.</span>
            </h1>
            <p className="auth-banner-sub">
              Your community is counting on you. Log in to access real-time alerts,
              incident reports, and emergency coordination tools.
            </p>

            <div className="auth-stat-row">
              <div className="auth-stat">
                <div className="auth-stat-num">500+</div>
                <div className="auth-stat-label">Barangays</div>
              </div>
              <div className="auth-stat-divider" />
              <div className="auth-stat">
                <div className="auth-stat-num">24/7</div>
                <div className="auth-stat-label">Live Monitoring</div>
              </div>
              <div className="auth-stat-divider" />
              <div className="auth-stat">
                <div className="auth-stat-num">&lt;5s</div>
                <div className="auth-stat-label">Alert Delivery</div>
              </div>
            </div>

            <div className="auth-badge-row">
              <div className="auth-badge"><Lock size={14} style={{ marginRight: 6 }} /> Secure Login</div>
              <div className="auth-badge"><Radio size={14} style={{ marginRight: 6 }} /> Real-Time Sync</div>
              <div className="auth-badge">🇵🇭 PH Barangays</div>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="auth-right">
          <div className="auth-card">
            <div className="auth-card-header">
              <div className="auth-card-icon">
                <img src={logo} alt="Logo" className="auth-logo-img" />
              </div>
              <h2 className="auth-card-title">Log In</h2>
              <p className="auth-card-sub">Access your ReadyBarangay account</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field-group">
                <label className="auth-label" htmlFor="email">Email Address</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><Mail size={16} /></span>
                  <input
                    id="email"
                    type="email"
                    className="auth-input"
                    placeholder="you@barangay.ph"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <div className="auth-label-row">
                  <label className="auth-label" htmlFor="password">Password</label>
                  <button type="button" className="auth-forgot">Forgot password?</button>
                </div>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><Lock size={16} /></span>
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    className="auth-input"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className={`auth-submit-btn${loading ? " loading" : ""}`}>
                {loading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>Log In to ReadyBarangay <ArrowRight size={18} style={{ marginLeft: 8 }} /></>
                )}
              </button>
            </form>

            <div className="login-auth-divider">
              <span>or</span>
            </div>

            <div className={`login-google-wrap${googleLoading ? " loading" : ""}`}>
              {googleClientId ? (
                <>
                  <div ref={googleButtonRef} className="login-google-button" />
                  {googleLoading && <span className="login-google-loading">Verifying with Google...</span>}
                </>
              ) : (
                <button type="button" className="login-google-disabled" disabled>
                  Google login needs setup
                </button>
              )}
            </div>

            <div className="auth-card-footer">
              <span>New to ReadyBarangay?</span>
              <button onClick={() => navigate("/register")} className="auth-switch-link">
                Create a Free Account
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
