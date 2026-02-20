# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HealthFlexx** is a personal productivity system owned by Ben Park, MD, CEO. It provides daily briefings and task management through custom Claude Code slash commands that integrate with Google Calendar.

## Custom Slash Commands

The project implements three slash commands (located in `.claude/commands/`):

- **`/morning`** — Morning briefing: checks Google Calendar, surfaces today's tasks, and provides a daily overview
- **`/evening`** — Evening review: summarizes the day's accomplishments, flags incomplete tasks, and prepares for tomorrow
- **`/weekly-review`** — Weekly review: aggregates the week's activity, highlights patterns, and sets priorities for the upcoming week

## Architecture

Slash commands are Markdown files in `.claude/commands/` that define prompts for Claude Code. They integrate with Google Calendar via a local MCP server to pull scheduling data and surface actionable information.

## MCP Servers

### Google Calendar (`mcp-servers/google-calendar/`)

A local MCP server (stdio transport) that provides Google Calendar tools to Claude Code.

**Tools:**
- `list_todays_events` — Fetch all events for today (primary use for `/morning`)
- `list_events` — Fetch events in a date range
- `search_events` — Search events by keyword
- `create_event` — Create a new calendar event

**Setup:**

1. Create a Google Cloud project with the Calendar API enabled
2. Create OAuth2 credentials (Desktop app type) and note the client ID and secret
3. Set environment variables:
   ```
   export GOOGLE_CLIENT_ID="your-client-id"
   export GOOGLE_CLIENT_SECRET="your-client-secret"
   ```
4. Build the server:
   ```
   cd mcp-servers/google-calendar && npm install && npm run build
   ```
5. On first use, the server will open a browser window for Google OAuth consent. Tokens are saved to `~/.healthflexx/tokens.json`.

**Registration:** The server is registered in `.mcp.json` at the project root and will be available to Claude Code automatically.
