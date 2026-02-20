import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getAuthenticatedClient } from "./auth.js";
import {
  listTodaysEvents,
  listEvents,
  searchEvents,
  createEvent,
} from "./calendar.js";

const server = new McpServer({
  name: "google-calendar",
  version: "1.0.0",
});

// ── list_todays_events ──────────────────────────────────────────────────────
server.tool(
  "list_todays_events",
  "Fetch all events for today from Google Calendar",
  {},
  async () => {
    const auth = await getAuthenticatedClient();
    const events = await listTodaysEvents(auth);
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
    maxResults: z
      .number()
      .optional()
      .describe("Maximum number of events to return (default 50)"),
  },
  async ({ startDate, endDate, maxResults }) => {
    const auth = await getAuthenticatedClient();
    const events = await listEvents(auth, startDate, endDate, maxResults);
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
    const auth = await getAuthenticatedClient();
    const events = await searchEvents(auth, query, startDate, endDate);
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

// ── create_event ────────────────────────────────────────────────────────────
server.tool(
  "create_event",
  "Create a new event on Google Calendar",
  {
    summary: z.string().describe("Event title"),
    startDateTime: z
      .string()
      .describe("Start date/time in ISO 8601 format"),
    endDateTime: z
      .string()
      .describe("End date/time in ISO 8601 format"),
    description: z.string().optional().describe("Event description"),
    location: z.string().optional().describe("Event location"),
    attendees: z
      .array(z.string())
      .optional()
      .describe("List of attendee email addresses"),
  },
  async ({ summary, startDateTime, endDateTime, description, location, attendees }) => {
    const auth = await getAuthenticatedClient();
    const event = await createEvent(auth, {
      summary,
      startDateTime,
      endDateTime,
      description,
      location,
      attendees,
    });
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(event, null, 2),
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
