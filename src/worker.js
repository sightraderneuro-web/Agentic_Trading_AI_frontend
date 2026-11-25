/**
 * Sightrader Worker
 *
 * Static files in /public are served automatically by Workers Static Assets.
 * This script only runs for requests that don't match a file, which is how
 * POST /api/subscribe reaches it. Signups are stored in the D1 database bound as DB.
 *
 * Keep the allowed values below in sync with the step-two form in public/index.html.
 */

const ROLES = new Set(["retail", "quant", "institution", "research", "curious"]);
const AGENT_USE = new Set(["not_yet", "experimenting", "live"]);
const MARKETS = new Set(["stocks", "futures", "fx", "crypto", "options"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_BODY = 4000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/subscribe") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "method_not_allowed" }, 405, { Allow: "POST" });
      }
      try {
        return await subscribe(request, env);
      } catch (err) {
        console.error("subscribe failed", err);
        return json({ ok: false, error: "server_error" }, 500);
      }
    }

    // Anything else that isn't a file: let the assets layer return its 404.
    return env.ASSETS.fetch(request);
  },
};

async function subscribe(request, env) {
  // Only accept posts from this site's own pages.
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json({ ok: false, error: "forbidden" }, 403);
  }
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) {
    return json({ ok: false, error: "unsupported_media_type" }, 415);
  }

  const text = await request.text();
  if (text.length > MAX_BODY) return json({ ok: false, error: "too_large" }, 413);

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }
  if (!body || typeof body !== "object") return json({ ok: false, error: "bad_request" }, 400);

  // Honeypot: real visitors never see or fill this field. Pretend success to bots.
  if (body.company) return json({ ok: true });

  const email = String(body.email || "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: "invalid_email" }, 400);
  }

  const role = ROLES.has(body.role) ? body.role : null;
  const agentUse = AGENT_USE.has(body.agent_use) ? body.agent_use : null;
  const markets = Array.isArray(body.markets)
    ? [...new Set(body.markets.filter((m) => MARKETS.has(m)))].join(",") || null
    : null;
  const source = clean(body.source, 64);
  const referrer = clean(body.referrer, 128);
  const country = request.cf?.country || null; // two-letter code from Cloudflare, no IP stored
  const now = new Date().toISOString();

  // First signup creates the row. A later post (the optional questions) fills in answers.
  // source/referrer/country keep their first-touch values.
  await env.DB.prepare(
    `INSERT INTO signups (email, role, agent_use, markets, source, referrer, country, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)
     ON CONFLICT(email) DO UPDATE SET
       role       = COALESCE(excluded.role, signups.role),
       agent_use  = COALESCE(excluded.agent_use, signups.agent_use),
       markets    = COALESCE(excluded.markets, signups.markets),
       updated_at = excluded.updated_at`
  )
    .bind(email, role, agentUse, markets, source, referrer, country, now)
    .run();

  return json({ ok: true });
}

function clean(value, max) {
  if (typeof value !== "string") return null;
  const v = value.replace(/[^\w.\-:/ ]/g, "").trim().slice(0, max);
  return v || null;
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}
