import { createServer } from "node:http";
import { randomBytes, createHash } from "node:crypto";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { MCP_SERVER_URL, TOKEN_STORE_PATH, OAUTH_CALLBACK_PORT } from "./config.js";

const REDIRECT_URI = `http://127.0.0.1:${OAUTH_CALLBACK_PORT}/callback`;
const SCOPE = "mcp";

function base64url(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function loadTokens() {
  if (!existsSync(TOKEN_STORE_PATH)) return null;
  return JSON.parse(readFileSync(TOKEN_STORE_PATH, "utf8"));
}

function saveTokens(data) {
  mkdirSync(path.dirname(TOKEN_STORE_PATH), { recursive: true });
  writeFileSync(TOKEN_STORE_PATH, JSON.stringify(data, null, 2));
}

// RFC 9728 (protected resource metadata) + RFC 8414 (authorization server metadata).
async function discoverEndpoints() {
  const probe = await fetch(MCP_SERVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 0, method: "ping" }),
  });

  let resourceMetadataUrl = new URL("/.well-known/oauth-protected-resource", MCP_SERVER_URL).toString();
  const wwwAuth = probe.headers.get("www-authenticate");
  const match = wwwAuth?.match(/resource_metadata="([^"]+)"/);
  if (match) resourceMetadataUrl = match[1];

  const resourceMetadata = await fetch(resourceMetadataUrl).then((r) => r.json());
  const authServer = resourceMetadata.authorization_servers?.[0];
  if (!authServer) throw new Error("No authorization_servers advertised by resource metadata");

  const authServerMetadata = await fetch(
    new URL("/.well-known/oauth-authorization-server", authServer).toString()
  ).then((r) => r.json());

  return { resourceMetadata, authServerMetadata };
}

async function registerClient(authServerMetadata) {
  const res = await fetch(authServerMetadata.registration_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "Kostenplan MCP Client",
      redirect_uris: [REDIRECT_URI],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    }),
  });
  if (!res.ok) {
    throw new Error(`Dynamic client registration failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function waitForCallback(expectedState) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, REDIRECT_URI);
      if (url.pathname !== "/callback") {
        res.writeHead(404).end();
        return;
      }
      const error = url.searchParams.get("error");
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        error
          ? `<p>Authorization failed: ${error}. You can close this tab.</p>`
          : "<p>Authorization successful. You can close this tab and return to the CLI.</p>"
      );
      server.close();

      if (error) return reject(new Error(`Authorization denied: ${error}`));
      if (state !== expectedState) return reject(new Error("OAuth state mismatch"));
      resolve(code);
    });
    server.listen(OAUTH_CALLBACK_PORT);
  });
}

export async function login() {
  const { authServerMetadata } = await discoverEndpoints();
  const client = await registerClient(authServerMetadata);

  const codeVerifier = base64url(randomBytes(48));
  const codeChallenge = base64url(createHash("sha256").update(codeVerifier).digest());
  const state = base64url(randomBytes(16));

  const authUrl = new URL(authServerMetadata.authorization_endpoint);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", client.client_id);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("scope", SCOPE);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("resource", MCP_SERVER_URL);

  console.log("Open this URL in a browser and log in / authorize access:\n");
  console.log(authUrl.toString());
  console.log(`\nWaiting for the OAuth callback on ${REDIRECT_URI} ...`);

  const code = await waitForCallback(state);

  const tokenRes = await fetch(authServerMetadata.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: client.client_id,
      code_verifier: codeVerifier,
      resource: MCP_SERVER_URL,
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`Token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
  }
  const tokens = await tokenRes.json();

  saveTokens({
    client_id: client.client_id,
    token_endpoint: authServerMetadata.token_endpoint,
    resource: MCP_SERVER_URL,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    obtained_at: Date.now(),
    expires_in: tokens.expires_in,
  });

  console.log("\nLogin successful. Tokens stored in .mcp/tokens.json");
}

async function refresh(stored) {
  const res = await fetch(stored.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: stored.refresh_token,
      client_id: stored.client_id,
      resource: stored.resource,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  const tokens = await res.json();
  const updated = {
    ...stored,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? stored.refresh_token,
    obtained_at: Date.now(),
    expires_in: tokens.expires_in,
  };
  saveTokens(updated);
  return updated;
}

export async function getValidAccessToken() {
  let stored = loadTokens();
  if (!stored) {
    throw new Error('No stored credentials found. Run "kostenplan-mcp login" first.');
  }
  const expiresAt = stored.obtained_at + (stored.expires_in ?? 0) * 1000;
  const isExpiringSoon = Date.now() > expiresAt - 30_000;
  if (isExpiringSoon && stored.refresh_token) {
    stored = await refresh(stored);
  }
  return stored.access_token;
}
