import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

function loadDotEnv() {
  const envPath = path.join(rootDir, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const [, key, rawValue = ""] = match;
    if (process.env[key] === undefined) {
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }
}

loadDotEnv();

export const MCP_SERVER_URL =
  process.env.MCP_SERVER_URL ?? "https://ck.4lima.de/wp-json/easy-mcp-ai/v1/mcp";

export const TOKEN_STORE_PATH = path.join(rootDir, ".mcp", "tokens.json");

export const OAUTH_CALLBACK_PORT = Number(process.env.MCP_OAUTH_CALLBACK_PORT ?? 8765);

// Static API token, e.g. a personal access token issued by the easy-mcp-ai
// plugin. Preferred over the OAuth flow when set.
export const STATIC_TOKEN = process.env.WORDPRESS_MCP_TOKEN || null;
