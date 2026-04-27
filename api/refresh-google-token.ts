// Vercel serverless function: exchange a Google refresh_token for a fresh
// access token using the OAuth client_secret (which must never live in
// the browser). Called by the dashboard when a Calendar fetch hits 401.

interface VercelReq {
  method?: string;
  body?: { refresh_token?: string };
  headers: Record<string, string | string[] | undefined>;
}

interface VercelRes {
  status(code: number): VercelRes;
  json(payload: unknown): void;
  setHeader(name: string, value: string): void;
  end(): void;
}

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export default async function handler(req: VercelReq, res: VercelRes) {
  // CORS — allows local dev (localhost:5173) to hit the prod endpoint.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const refreshToken = req.body?.refresh_token;
  if (!refreshToken) {
    res.status(400).json({ error: "refresh_token required" });
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.status(500).json({ error: "Server not configured" });
    return;
  }

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const data = (await tokenRes.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenRes.ok || !data.access_token) {
    res.status(tokenRes.status || 500).json({
      error: data.error_description || data.error || "refresh failed",
    });
    return;
  }

  res.status(200).json({
    access_token: data.access_token,
    expires_in: data.expires_in,
    refresh_token: data.refresh_token, // Google sometimes rotates
  });
}
