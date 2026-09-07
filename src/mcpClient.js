import { MCP_SERVER_URL, STATIC_TOKEN } from "./config.js";
import { getValidAccessToken } from "./oauth.js";

let sessionId = null;
let nextId = 1;

function getAccessToken() {
  return STATIC_TOKEN ? Promise.resolve(STATIC_TOKEN) : getValidAccessToken();
}

async function parseResponseBody(res) {
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();

  if (contentType.includes("text/event-stream")) {
    const dataLines = text
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter(Boolean);
    return dataLines.map((line) => JSON.parse(line)).pop();
  }

  return text ? JSON.parse(text) : null;
}

async function rpc(method, params) {
  const accessToken = await getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${accessToken}`,
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;

  const res = await fetch(MCP_SERVER_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  });

  const returnedSessionId = res.headers.get("mcp-session-id");
  if (returnedSessionId) sessionId = returnedSessionId;

  if (!res.ok) {
    throw new Error(`MCP request "${method}" failed: ${res.status} ${await res.text()}`);
  }

  const body = await parseResponseBody(res);
  if (body?.error) {
    throw new Error(`MCP error ${body.error.code}: ${body.error.message}`);
  }
  return body?.result;
}

export async function initialize() {
  return rpc("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "kostenplan-mcp", version: "0.1.0" },
  });
}

export async function listTools() {
  await initialize();
  return rpc("tools/list", {});
}

export async function callTool(name, args = {}) {
  await initialize();
  return rpc("tools/call", { name, arguments: args });
}
