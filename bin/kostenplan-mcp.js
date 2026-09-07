#!/usr/bin/env node
import { login } from "../src/oauth.js";
import { listTools, callTool } from "../src/mcpClient.js";

const [, , command, ...rest] = process.argv;

async function main() {
  switch (command) {
    case "login":
      await login();
      break;

    case "tools": {
      const result = await listTools();
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case "call": {
      const [toolName, jsonArgs] = rest;
      if (!toolName) {
        throw new Error('Usage: kostenplan-mcp call <toolName> [\'{"json":"args"}\']');
      }
      const args = jsonArgs ? JSON.parse(jsonArgs) : {};
      const result = await callTool(toolName, args);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    default:
      console.log(
        [
          "Usage:",
          "  kostenplan-mcp login              Authorize via OAuth (opens a URL to visit)",
          "  kostenplan-mcp tools               List tools exposed by the MCP endpoint",
          "  kostenplan-mcp call <name> [args]  Call a tool with optional JSON arguments",
        ].join("\n")
      );
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
