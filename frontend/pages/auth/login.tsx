import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  username: string;
  email: string;
  password: string;
}

interface LoginForm {
  email: string;
  password: string;
}

interface FormErrors<T> {
  [K: string]: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const friendlyAuthError = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes("rate") && lower.includes("exceeded")) {
    return "Email rate limit reached. Wait about an hour, or disable email confirmation / configure SMTP in Supabase.";
  }
  return message;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  placeholder?: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Field: React.FC<FieldProps> = ({
  label,
  name,
  type = "text",
  value,
  placeholder,
  error,
  onChange,
}) => (
  <div style={styles.field}>
    <label style={styles.label}>{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      autoComplete="off"
      style={{
        ...styles.input,
        ...(error ? styles.inputError : value ? styles.inputOk : {}),
      }}
    />
    {error && (
      <span style={styles.errorMsg}>⚠ {error}</span>
    )}
  </div>
);

interface ToastProps {
  message: string;
  visible: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, visible }) => (
  <div
    style={{
      ...styles.toast,
      transform: visible
        ? "translateX(-50%) translateY(0)"
        : "translateX(-50%) translateY(70px)",
      opacity: visible ? 1 : 0,
    }}
  >
    {message}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AuthContainer: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [signupForm, setSignupForm] = useState<User>({
    username: "",
    email: "",
    password: "",
  });
  const [loginErrors, setLoginErrors] = useState<FormErrors<LoginForm>>({});
  const [signupErrors, setSignupErrors] = useState<FormErrors<User>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false });

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 3000);
  }, []);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
    setLoginErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupForm((prev) => ({ ...prev, [name]: value }));
    setSignupErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const switchMode = (nextMode: "login" | "signup") => {
    setMode(nextMode);
    setLoginErrors({});
    setSignupErrors({});
  };

  const handleLogin = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    const errs: FormErrors<LoginForm> = {};
    if (!loginForm.email.trim()) errs.email = "Email is required";
    else if (!EMAIL_RE.test(loginForm.email.trim())) errs.email = "Enter a valid email";
    if (!loginForm.password) errs.password = "Password is required";
    if (Object.keys(errs).length) {
      setLoginErrors(errs);
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn(loginForm.email.trim(), loginForm.password);
    setIsSubmitting(false);

    if (error) {
      showToast(friendlyAuthError(error.message || "Login failed"));
      return;
    }

    showToast("Welcome back!");
    setLoginForm({ email: "", password: "" });
    navigate("/dashboard", { replace: true });
  };

  const handleSignup = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    const errs: FormErrors<User> = {};
    if (!signupForm.username.trim()) errs.username = "Username is required";
    if (!signupForm.email.trim()) errs.email = "Email is required";
    else if (!EMAIL_RE.test(signupForm.email.trim())) errs.email = "Enter a valid email";
    if (!signupForm.password) errs.password = "Password is required";
    else if (signupForm.password.length < 6) errs.password = "Password must be at least 6 characters";
    if (Object.keys(errs).length) {
      setSignupErrors(errs);
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await signUp(
      signupForm.email.trim(),
      signupForm.password,
      signupForm.username.trim()
    );
    setIsSubmitting(false);

    if (error) {
      showToast(friendlyAuthError(error.message || "Sign up failed"));
      return;
    }

    if (data?.session) {
      showToast("Account created!");
      setSignupForm({ username: "", email: "", password: "" });
      navigate("/dashboard", { replace: true });
      return;
    }

    showToast("Account created. Check your email to confirm it, then log in.");
    setSignupForm({ username: "", email: "", password: "" });
    setMode("login");
  };

  return (
    <div style={styles.page}>
      {/* Background blobs */}
      <div style={{ ...styles.blob, ...styles.blob1 }} />
      <div style={{ ...styles.blob, ...styles.blob2 }} />

      <div style={styles.card}>
        {/* Corner accents */}
        <div style={{ ...styles.corner, ...styles.cornerTL }} />
        <div style={{ ...styles.corner, ...styles.cornerBR }} />

        {/* Brand */}
        <div style={styles.brand}>
          <div style={styles.brandIcon}>💬</div>
          <div>
            <div style={styles.brandName}>MoodChat</div>
            <div style={styles.brandTag}>Express · Connect · Vibe</div>
          </div>
        </div>

        <div style={styles.tabs}>
          <button
            type="button"
            style={{ ...styles.tabBtn, ...(mode === "login" ? styles.tabActive : {}) }}
            onClick={() => switchMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            style={{ ...styles.tabBtn, ...(mode === "signup" ? styles.tabActive : {}) }}
            onClick={() => switchMode("signup")}
          >
            Sign Up
          </button>
        </div>

        <form
          style={{ ...styles.formWrap, display: mode === "login" ? "flex" : "none" }}
          onSubmit={handleLogin}
        >
          <Field
            label="Email"
            name="email"
            type="email"
            value={loginForm.email}
            placeholder="you@example.com"
            error={loginErrors.email}
            onChange={handleLoginChange}
          />
          <Field
            label="Password"
            name="password"
            type="password"
            value={loginForm.password}
            placeholder="••••••••"
            error={loginErrors.password}
            onChange={handleLoginChange}
          />
          <div style={styles.sep} />
          <button style={styles.btn} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
          <div style={styles.switchText}>
            New here?{" "}
            <button type="button" style={styles.switchBtn} onClick={() => switchMode("signup")}>
              Create account
            </button>
          </div>
        </form>

        <form
          style={{ ...styles.formWrap, display: mode === "signup" ? "flex" : "none" }}
          onSubmit={handleSignup}
        >
          <Field
            label="Username"
            name="username"
            value={signupForm.username}
            placeholder="your_username"
            error={signupErrors.username}
            onChange={handleSignupChange}
          />
          <Field
            label="Email"
            name="email"
            type="email"
            value={signupForm.email}
            placeholder="you@example.com"
            error={signupErrors.email}
            onChange={handleSignupChange}
          />
          <Field
            label="Password"
            name="password"
            type="password"
            value={signupForm.password}
            placeholder="********"
            error={signupErrors.password}
            onChange={handleSignupChange}
          />
          <div style={styles.sep} />
          <button style={styles.btn} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Sign Up"}
          </button>
          <div style={styles.switchText}>
            Already have an account?{" "}
            <button type="button" style={styles.switchBtn} onClick={() => switchMode("login")}>
              Login
            </button>
          </div>
        </form>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
};

// ─── Inline styles (typed) ────────────────────────────────────────────────────

const LIME = "#c8f53d";
const LIME_DIM = "#a3cc2a";

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#080808",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Outfit', 'DM Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  blob: {
    position: "fixed",
    borderRadius: "50%",
    filter: "blur(80px)",
    pointerEvents: "none",
  },
  blob1: {
    width: 340,
    height: 340,
    background: "rgba(200,245,61,0.07)",
    top: -80,
    right: -60,
  },
  blob2: {
    width: 280,
    height: 280,
    background: "rgba(200,245,61,0.05)",
    bottom: -60,
    left: -40,
  },
  card: {
    position: "relative",
    zIndex: 10,
    width: 440,
    background: "#101010",
    border: "1px solid rgba(200,245,61,0.22)",
    borderRadius: 24,
    padding: "44px 40px 36px",
    boxShadow:
      "0 0 0 1px rgba(255,255,255,0.03), 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(200,245,61,0.1)",
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: LIME,
    borderStyle: "solid",
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderWidth: "2px 0 0 2px",
    borderRadius: "24px 0 0 0",
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderWidth: "0 2px 2px 0",
    borderRadius: "0 0 24px 0",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 32,
  },
  brandIcon: {
    width: 48,
    height: 48,
    background: `linear-gradient(135deg, ${LIME}, #8aaf1a)`,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    boxShadow: "0 0 28px rgba(200,245,61,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
    flexShrink: 0,
  },
  brandName: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 26,
    fontWeight: 800,
    color: LIME,
    letterSpacing: 0.5,
    textShadow: "0 0 20px rgba(200,245,61,0.35)",
    lineHeight: 1,
  },
  brandTag: {
    fontSize: 11,
    color: "#4a4a4a",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 2,
  },
  tabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 4,
    background: "#0a0a0a",
    borderRadius: 14,
    padding: 4,
    marginBottom: 28,
    border: "1px solid #1f1f1f",
  },
  tabBtn: {
    padding: "10px 0",
    border: "none",
    background: "transparent",
    fontFamily: "'Outfit', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: "#4a4a4a",
    cursor: "pointer",
    borderRadius: 10,
    transition: "all 0.22s ease",
  },
  tabActive: {
    background: `linear-gradient(135deg, ${LIME}, ${LIME_DIM})`,
    color: "#0a0a0a",
    boxShadow: "0 4px 20px rgba(200,245,61,0.3)",
  },
  formWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  field: {},
  label: {
    display: "block",
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: "1.8px",
    textTransform: "uppercase",
    color: "#4a4a4a",
    marginBottom: 7,
  },
  input: {
    width: "100%",
    background: "#161616",
    border: "1px solid #1f1f1f",
    borderRadius: 11,
    padding: "12px 15px",
    color: "#e6e6e6",
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14,
    outline: "none",
    transition: "all 0.2s ease",
  },
  inputError: {
    borderColor: "#ff5555",
    boxShadow: "0 0 0 3px rgba(255,85,85,0.1)",
  },
  inputOk: {
    borderColor: "rgba(200,245,61,0.4)",
  },
  errorMsg: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11.5,
    color: "#ff5555",
    marginTop: 6,
  },
  sep: {
    height: 1,
    background: "linear-gradient(90deg, transparent, #1e1e1e, transparent)",
    margin: "4px 0",
  },
  btn: {
    width: "100%",
    padding: 13,
    background: `linear-gradient(135deg, ${LIME} 0%, ${LIME_DIM} 100%)`,
    border: "none",
    borderRadius: 11,
    color: "#0a0a0a",
    fontFamily: "'Outfit', sans-serif",
    fontSize: 13.5,
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  switchText: {
    textAlign: "center",
    fontSize: 13,
    color: "#4a4a4a",
  },
  switchBtn: {
    background: "none",
    border: "none",
    color: LIME,
    fontFamily: "'Outfit', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: 3,
  },
  toast: {
    position: "fixed",
    bottom: 28,
    left: "50%",
    background: LIME,
    color: "#0a0a0a",
    padding: "11px 28px",
    borderRadius: 999,
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    zIndex: 999,
    whiteSpace: "nowrap",
    boxShadow: "0 8px 32px rgba(200,245,61,0.45)",
    transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s",
  },
};

export default AuthContainer;
