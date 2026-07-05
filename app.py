"""
QA Testing Tool — Mock Sign-in Code Lookup
==========================================
Demonstrates the full pattern: front-end form -> backend call -> parse JSON -> render.

The /api/action route is a MOCK. It returns sample data in the same shape your
real response uses, so you can build and test the UI without touching any live inbox.

To later point this at a real test-email provider you own (e.g. Mailosaur / MailSlurp),
replace the body of mock_action() with an outbound `requests.post(...)` to THAT provider's
API and return its JSON. Keep the request/response contract identical and the front-end
won't need to change.
"""

from flask import Flask, request, jsonify, render_template_string
from datetime import datetime, timezone
import random

app = Flask(__name__)

# ----------------------------------------------------------------------
# MOCK backend. Stands in for a real API call. Returns your response shape.
# ----------------------------------------------------------------------
def mock_action(email: str, action: str):
    countries = [
        ("Australia", "🇦🇺"), ("India", "🇮🇳"), ("United States", "🇺🇸"),
        ("Germany", "🇩🇪"), ("Japan", "🇯🇵"),
    ]
    country_name, flag = random.choice(countries)
    now = datetime.now(timezone.utc)

    return [
        {
            "to": email,
            "date": now.strftime(f"%a, {now.day} %b %Y %H:%M:%S +0000"),
            "relative_time": now.strftime("%H:%M") + " (just now)",
            "country": f"{country_name} {flag}",
            "code": f"{random.randint(1000, 9999)}",
            "link": None,
            "travel_code": None,
            "type": "sign_in" if action == "signin" else action,
        }
    ]


# ----------------------------------------------------------------------
# API route the front-end calls.
# ----------------------------------------------------------------------
@app.route("/api/action", methods=["POST"])
def action():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()
    act = (data.get("action") or "signin").strip()

    if not email or "@" not in email:
        return jsonify({"error": "A valid email is required."}), 400

    try:
        results = mock_action(email, act)
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": f"Lookup failed: {e}"}), 500


# ----------------------------------------------------------------------
# Front-end.
# ----------------------------------------------------------------------
PAGE = """
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QA Sign-in Code Lookup (Mock)</title>
<style>
  :root { --bg:#0f1115; --card:#1a1d24; --line:#2a2f3a; --txt:#e6e9ef; --mut:#9aa4b2; --acc:#4f8cff; --ok:#3ddc84; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
         background:var(--bg); color:var(--txt); min-height:100vh; display:flex;
         align-items:flex-start; justify-content:center; padding:48px 16px; }
  .wrap { width:100%; max-width:560px; }
  h1 { font-size:20px; margin:0 0 4px; }
  .badge { display:inline-block; font-size:11px; letter-spacing:.05em; text-transform:uppercase;
           color:var(--ok); border:1px solid var(--ok); border-radius:6px; padding:2px 8px; margin-bottom:20px; }
  .sub { color:var(--mut); font-size:13px; margin:0 0 24px; }
  form { display:flex; gap:8px; margin-bottom:8px; }
  input, select, button { font-size:14px; border-radius:8px; border:1px solid var(--line);
           background:var(--card); color:var(--txt); padding:10px 12px; }
  input { flex:1; }
  select { width:110px; }
  button { background:var(--acc); border-color:var(--acc); color:#fff; cursor:pointer; font-weight:600; }
  button:disabled { opacity:.5; cursor:default; }
  .status { font-size:13px; color:var(--mut); min-height:18px; margin:4px 2px 16px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px; margin-bottom:12px; }
  .code { font-size:32px; font-weight:700; letter-spacing:.08em; color:var(--ok); font-family:ui-monospace,monospace; }
  .row { display:flex; justify-content:space-between; font-size:13px; padding:6px 0; border-top:1px solid var(--line); }
  .row:first-of-type { border-top:none; }
  .k { color:var(--mut); }
  .err { color:#ff6b6b; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>Sign-in Code Lookup</h1>
    <span class="badge">Mock / QA</span>
    <p class="sub">Enter an email and fetch the latest sign-in code. Data here is generated
       locally by a mock backend — no live inbox is contacted.</p>

    <form id="f">
      <input id="email" type="email" placeholder="test@example.com" value="test@leapomi.cloud" required>
      <select id="action">
        <option value="signin">signin</option>
        <option value="signup">signup</option>
      </select>
      <button id="btn" type="submit">Fetch</button>
    </form>
    <div class="status" id="status"></div>
    <div id="results"></div>
  </div>

<script>
const f = document.getElementById('f');
const btn = document.getElementById('btn');
const statusEl = document.getElementById('status');
const results = document.getElementById('results');

f.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const action = document.getElementById('action').value;
  results.innerHTML = '';
  statusEl.textContent = 'Fetching…';
  btn.disabled = true;

  try {
    const res = await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, action })
    });
    const data = await res.json();

    if (!res.ok) {
      statusEl.innerHTML = '<span class="err">' + (data.error || 'Request failed') + '</span>';
      return;
    }
    if (!Array.isArray(data) || data.length === 0) {
      statusEl.textContent = 'No codes found for that email.';
      return;
    }
    statusEl.textContent = data.length + ' result(s):';
    results.innerHTML = data.map(r => `
      <div class="card">
        <div class="code">${r.code ?? '—'}</div>
        <div class="row"><span class="k">To</span><span>${r.to ?? ''}</span></div>
        <div class="row"><span class="k">Type</span><span>${r.type ?? ''}</span></div>
        <div class="row"><span class="k">Country</span><span>${r.country ?? ''}</span></div>
        <div class="row"><span class="k">Received</span><span>${r.relative_time ?? r.date ?? ''}</span></div>
        ${r.link ? `<div class="row"><span class="k">Link</span><span><a href="${r.link}">open</a></span></div>` : ''}
      </div>
    `).join('');
  } catch (err) {
    statusEl.innerHTML = '<span class="err">Network error: ' + err.message + '</span>';
  } finally {
    btn.disabled = false;
  }
});
</script>
</body>
</html>
"""

@app.route("/")
def index():
    return render_template_string(PAGE)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
