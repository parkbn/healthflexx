import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  listTodaysEvents,
  listEvents,
  searchEvents,
} from "./calendar.js";

const server = new McpServer({
  name: "google-calendar",
  version: "2.0.0",
});

// ── list_todays_events ──────────────────────────────────────────────────────
server.tool(
  "list_todays_events",
  "Fetch all events for today from Google Calendar",
  {},
  async () => {
    const events = await listTodaysEvents();
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(events, null, 2),
        },
      ],
    };
  }
);

// ── list_events ─────────────────────────────────────────────────────────────
server.tool(
  "list_events",
  "Fetch events in a date range from Google Calendar",
  {
    startDate: z
      .string()
      .describe("Start date/time (ISO 8601, e.g. 2026-02-20)"),
    endDate: z
      .string()
      .describe("End date/time (ISO 8601, e.g. 2026-02-27)"),
  },
  async ({ startDate, endDate }) => {
    const events = await listEvents(startDate, endDate);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(events, null, 2),
        },
      ],
    };
  }
);

// ── search_events ───────────────────────────────────────────────────────────
server.tool(
  "search_events",
  "Search Google Calendar events by keyword",
  {
    query: z.string().describe("Search query string"),
    startDate: z
      .string()
      .optional()
      .describe("Optional start date to narrow search (ISO 8601)"),
    endDate: z
      .string()
      .optional()
      .describe("Optional end date to narrow search (ISO 8601)"),
  },
  async ({ query, startDate, endDate }) => {
    const events = await searchEvents(query, startDate, endDate);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(events, null, 2),
        },
      ],
    };
  }
);

// ── Start server ────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
