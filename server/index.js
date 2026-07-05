import "dotenv/config";
import express from "express";
import cors from "cors";

const { OPOMAIL_BASE, OPOMAIL_KEY, PORT = 5174 } = process.env;

if (!OPOMAIL_BASE || !OPOMAIL_KEY) {
  console.error("Missing OPOMAIL_BASE or OPOMAIL_KEY in server/.env");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

async function callOpomail(path, body) {
  const res = await fetch(`${OPOMAIL_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

// Step 1: authenticate against the upstream provider.
app.get("/api/health", async (_req, res) => {
  try {
    const login = await callOpomail("/api/web/login", { key: OPOMAIL_KEY });
    res.status(login.ok ? 200 : 502).json(login.data);
  } catch (err) {
    res.status(502).json({ error: `Auth check failed: ${err.message}` });
  }
});

// Step 2: authenticate, then fetch the sign-in code for the given inbox.
app.post("/api/action", async (req, res) => {
  const email = (req.body?.email || "").trim();
  const action = (req.body?.action || "signin").trim();

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email is required." });
  }

  try {
    const login = await callOpomail("/api/web/login", { key: OPOMAIL_KEY });
    if (!login.ok) {
      return res.status(502).json({ error: "Authentication with the mail provider failed.", detail: login.data });
    }

    const result = await callOpomail("/api/web/action", { key: OPOMAIL_KEY, email, action });
    if (!result.ok) {
      return res.status(502).json({ error: "Lookup failed.", detail: result.data });
    }

    res.status(200).json(result.data);
  } catch (err) {
    res.status(500).json({ error: `Lookup failed: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`QA sign-in proxy listening on http://localhost:${PORT}`);
});
