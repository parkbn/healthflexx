import { google } from "googleapis";
import { OAuth2Client, Credentials } from "google-auth-library";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import open from "open";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

const TOKEN_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || "~",
  ".healthflexx"
);
const TOKEN_PATH = path.join(TOKEN_DIR, "tokens.json");
const REDIRECT_PORT = 3199;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/oauth2callback`;

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables. " +
        "Set these in your .mcp.json or shell environment."
    );
  }

  return { clientId, clientSecret };
}

function createOAuth2Client(): OAuth2Client {
  const { clientId, clientSecret } = getClientCredentials();
  return new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
}

async function loadTokens(): Promise<Credentials | null> {
  try {
    const data = await fs.readFile(TOKEN_PATH, "utf-8");
    return JSON.parse(data) as Credentials;
  } catch {
    return null;
  }
}

async function saveTokens(tokens: Credentials): Promise<void> {
  await fs.mkdir(TOKEN_DIR, { recursive: true });
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2), "utf-8");
}

/**
 * Runs a local HTTP server to capture the OAuth2 callback, opens the browser
 * for user consent, and returns the authorization code.
 */
function getAuthCodeViaBrowser(authUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", `http://localhost:${REDIRECT_PORT}`);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("<h1>Authorization denied.</h1><p>You can close this tab.</p>");
        server.close();
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (code) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          "<h1>Authorization successful!</h1><p>You can close this tab and return to Claude Code.</p>"
        );
        server.close();
        resolve(code);
        return;
      }

      res.writeHead(404);
      res.end();
    });

    server.listen(REDIRECT_PORT, () => {
      open(authUrl).catch(() => {
        // If open fails, the user will need to manually visit the URL
        console.error(
          `Could not open browser. Please visit this URL manually:\n${authUrl}`
        );
      });
    });

    server.on("error", reject);

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error("OAuth authorization timed out after 5 minutes."));
    }, 5 * 60 * 1000);
  });
}

/**
 * Returns an authenticated OAuth2 client. Will trigger a browser-based
 * consent flow if no saved tokens are found.
 */
export async function getAuthenticatedClient(): Promise<OAuth2Client> {
  const client = createOAuth2Client();
  const tokens = await loadTokens();

  if (tokens) {
    client.setCredentials(tokens);

    // Set up automatic token refresh persistence
    client.on("tokens", async (newTokens) => {
      const merged = { ...tokens, ...newTokens };
      await saveTokens(merged);
    });

    return client;
  }

  // No tokens — run the interactive OAuth flow
  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  const code = await getAuthCodeViaBrowser(authUrl);
  const { tokens: newTokens } = await client.getToken(code);
  client.setCredentials(newTokens);
  await saveTokens(newTokens);

  client.on("tokens", async (refreshedTokens) => {
    const merged = { ...newTokens, ...refreshedTokens };
    await saveTokens(merged);
  });

  return client;
}
