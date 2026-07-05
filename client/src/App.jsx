import { useEffect, useState } from "react";
import { Mail, X, Smartphone, KeyRound, Users, LogIn, ArrowRight, Clock, MessageSquare } from "lucide-react";
import { ThemeProvider } from "./ThemeContext.jsx";
import TopNav, { PillButton } from "./TopNav.jsx";
import WelcomeCard from "./WelcomeCard.jsx";
import Toast from "./Toast.jsx";
import { openSupportChat } from "./support.js";

const RECENT_EMAILS_KEY = "qa-recent-emails";
const MAX_RECENT = 5;

const VERIFICATION_TYPES = [
  { key: "signin", label: "Sign In", icon: Smartphone, action: "signin", wired: true },
  { key: "reset", label: "Reset", icon: KeyRound, action: "reset", wired: false },
  { key: "household", label: "Household", icon: Users, action: "household", wired: true },
  { key: "verify", label: "Verify Code", icon: LogIn, action: "verify_code", wired: false },
];

const EMPTY_RESULT_MESSAGES = {
  signin: "No sign-in codes from the past 15 minutes detected. Please trigger the code inside Netflix first.",
  household: "No household update requests found. Tap 'Update Netflix Household' on your TV or device first.",
};

function loadRecentEmails() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_EMAILS_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function NoticeCard({ title = "Nothing Found", message, onSupport }) {
  return (
    <div className="notice-card">
      <div className="notice-head">
        <Clock size={18} className="notice-icon" />
        <div className="notice-title">{title}</div>
      </div>
      <p className="notice-message">{message}</p>
      <PillButton icon={<MessageSquare size={14} />} onClick={onSupport}>
        Need support?
      </PillButton>
    </div>
  );
}

function LookupSection({ onSupportUnavailable }) {
  const [email, setEmail] = useState("makasa@leapomi.cloud");
  const [verificationType, setVerificationType] = useState("signin");
  const [recentEmails, setRecentEmails] = useState(loadRecentEmails);
  const [status, setStatus] = useState("idle"); // idle | loading | error | done
  const [notice, setNotice] = useState(null); // { title, message } | null
  const [results, setResults] = useState([]);

  function rememberEmail(value) {
    setRecentEmails((prev) => {
      const next = [value, ...prev.filter((e) => e !== value)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_EMAILS_KEY, JSON.stringify(next));
      return next;
    });
  }

  function removeRecentEmail(value) {
    setRecentEmails((prev) => {
      const next = prev.filter((e) => e !== value);
      localStorage.setItem(RECENT_EMAILS_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    setNotice(null);
    setResults([]);

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setStatus("error");
      setNotice({ title: "Invalid Email", message: "Please enter a valid Netflix account email to continue." });
      return;
    }

    const type = VERIFICATION_TYPES.find((t) => t.key === verificationType);

    if (!type.wired) {
      setStatus("error");
      setNotice({
        title: "Nothing Found",
        message: `${type.label} isn't available yet. Please use Sign In or Household instead.`,
      });
      return;
    }

    setStatus("loading");
    rememberEmail(trimmedEmail);

    try {
      const res = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, action: type.action }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setNotice({ title: "Nothing Found", message: data.error || "Request failed." });
        return;
      }

      const list = Array.isArray(data) ? data : [data];
      if (list.length === 0) {
        setStatus("error");
        setNotice({ title: "Nothing Found", message: EMPTY_RESULT_MESSAGES[type.key] || "No results found." });
        return;
      }

      setResults(list);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setNotice({ title: "Nothing Found", message: `Network error: ${err.message}` });
    }
  }

  return (
    <>
      <form className="lookup-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Netflix Account Email</label>
          <div className="email-input">
            <Mail size={16} className="email-input-icon" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@leapomi.cloud"
            />
          </div>
        </div>

        {recentEmails.length > 0 && (
          <div className="recent-row">
            <span className="recent-label">Recent:</span>
            {recentEmails.map((e) => (
              <span key={e} className="chip" onClick={() => setEmail(e)}>
                {e}
                <X
                  size={13}
                  className="chip-remove"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    removeRecentEmail(e);
                  }}
                />
              </span>
            ))}
          </div>
        )}

        <div className="field">
          <label>Verification Type</label>
          <div className="verify-tabs">
            {VERIFICATION_TYPES.map(({ key, label, icon: Icon }) => (
              <button
                type="button"
                key={key}
                className={`verify-tab${verificationType === key ? " verify-tab-active" : ""}`}
                onClick={() => setVerificationType(key)}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="retrieve-btn" disabled={status === "loading"}>
          {status === "loading" ? "Retrieving…" : "Retrieve Access Info"}
          <ArrowRight size={16} />
        </button>
      </form>

      {status === "error" && notice && (
        <NoticeCard title={notice.title} message={notice.message} onSupport={() => openSupportChat(onSupportUnavailable)} />
      )}

      {results.length > 0 && (
        <div className="results">
          {results.map((r, i) => (
            <ResultCard key={i} result={r} />
          ))}
        </div>
      )}
    </>
  );
}

function ResultCard({ result }) {
  const r = result || {};
  return (
    <div className="card result-card">
      {r.code && <div className="code">{r.code}</div>}
      <Row label="To" value={r.to} />
      <Row label="Type" value={r.type} />
      <Row label="Country" value={r.country} />
      <Row label="Received" value={r.relative_time || r.date} />
      {r.link && (
        <Row
          label="Link"
          value={
            <a href={r.link} target="_blank" rel="noreferrer">
              open
            </a>
          }
        />
      )}
    </div>
  );
}

function Row({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="row">
      <span className="k">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function AccessGate({ onSuccess }) {
  const [name, setName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedCode = accessCode.trim();
    if (!trimmedName || !trimmedCode) return;

    if (trimmedCode !== import.meta.env.VITE_ACCESS_CODE) {
      setError("Invalid access key. Please reach out to support.");
      return;
    }

    setError("");
    onSuccess(trimmedName);
  }

  return (
    <div className="page">
      <div className="status-strip" />
      <div className="wrap">
        <div className="portal-title">Secure Portal Access</div>
        <header className="header">
          <div className="badge">QA · Sign-in Lookup</div>
          <h1>Who's visiting?</h1>
          <p className="sub">Enter your name and access key to continue to the sign-in code lookup tool.</p>
        </header>
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="visitor-name">Your name</label>
            <input
              id="visitor-name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div className="field field-narrow">
            <label htmlFor="access-code">Access key</label>
            <input
              id="access-code"
              type="password"
              required
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="••••"
            />
          </div>
          <button type="submit">Continue</button>
        </form>

        {error && (
          <NoticeCard title="Access Denied" message={error} onSupport={() => openSupportChat(setError)} />
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [visitorName, setVisitorName] = useState(
    () => localStorage.getItem("qa-visitor-name") || ""
  );
  const [active, setActive] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((r) => r.json())
      .then(() => {
        if (!cancelled) setActive(true);
      })
      .catch(() => {
        if (!cancelled) setActive(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  function handleAccessGranted(name) {
    localStorage.setItem("qa-visitor-name", name);
    setVisitorName(name);
  }

  function handleLogout() {
    localStorage.removeItem("qa-visitor-name");
    setVisitorName("");
    setToast("Session cleared locally.");
  }

  if (!visitorName) {
    return (
      <ThemeProvider>
        <AccessGate onSuccess={handleAccessGranted} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="page">
        <div className="status-strip" />
        <div className="wrap">
          <TopNav onChangeAccessCode={setToast} onLogout={handleLogout} />

          <div className="portal-title">Secure Portal Access</div>

          <WelcomeCard username={visitorName} active={active} />

          <header className="header">
            <div className="badge">QA · Sign-in Lookup</div>
            <h1>Sign-in Code Lookup</h1>
            <p className="sub">
              Authenticates against the mail provider, then fetches the latest
              code delivered to the given inbox.
            </p>
          </header>

          <LookupSection onSupportUnavailable={setToast} />
        </div>
        <Toast message={toast} onClose={() => setToast("")} />
      </div>
    </ThemeProvider>
  );
}
