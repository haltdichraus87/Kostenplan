# Kostenplan

Node.js CLI/OAuth client for connecting to the `easy-mcp-ai` MCP endpoint
(`https://ck.4lima.de/wp-json/easy-mcp-ai/v1/mcp`), a remote WordPress MCP
server. It handles OAuth 2.1 discovery, dynamic client registration, and the
PKCE authorization-code flow, then talks MCP (JSON-RPC over HTTP) to list and
call tools exposed by the WordPress site.

## Use as a Claude Code MCP server

`.mcp.json` registers the endpoint as a project-scoped MCP server for Claude
Code. It reads the token from the `WORDPRESS_MCP_TOKEN` environment variable
(set it in your shell or `.env`, then export it before launching Claude
Code):

```bash
export WORDPRESS_MCP_TOKEN=your-api-token
claude
```

Equivalent one-off command (adds the same server via the CLI instead of the
committed `.mcp.json`):

```bash
claude mcp add --transport http wordpress https://ck.4lima.de/wp-json/easy-mcp-ai/v1/mcp \
  --header "Authorization: Bearer your-api-token"
```

## Standalone OAuth CLI

For use outside Claude Code (e.g. scripting), this repo also includes a
dependency-free OAuth 2.1 + MCP client.

### Setup

```bash
cp .env.example .env   # adjust MCP_SERVER_URL if needed
```

No dependencies to install — everything uses Node's built-in `fetch`,
`http`, and `crypto` modules (Node >= 18.17).

### Usage

```bash
node bin/kostenplan-mcp.js login   # opens an authorization URL to visit in a browser
node bin/kostenplan-mcp.js tools   # lists tools exposed by the MCP endpoint
node bin/kostenplan-mcp.js call <toolName> '{"arg":"value"}'
```

`login` starts a local callback server (default `http://127.0.0.1:8765/callback`,
configurable via `MCP_OAUTH_CALLBACK_PORT`), registers a public OAuth client
with the server on first run, and walks through the PKCE authorization-code
flow. Tokens are cached in `.mcp/tokens.json` (git-ignored) and refreshed
automatically when expired.
