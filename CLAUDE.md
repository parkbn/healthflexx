# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Firebase Hosting for HealthFlexx's auth-adjacent web pages. It is **not** the mobile app.

| Path | What it is |
|---|---|
| `web/` | Hosting root, deployed to `healthflexx-421f3.web.app` (project in `.firebaserc`) |
| `web/reset-password.html` | Supabase password-reset landing page, served at `/reset-password` |
| `web/auth/confirmed.html` | Email-confirmation landing page |
| `firebase.json` | Hosting config: clean URLs, the reset-password rewrite, no-cache on HTML |
| `research/`, `tasks/`, `companion_feature_migration.sql` | Local only (gitignored or untracked). Not part of what ships. Migrations live in the app repo's `supabase/migrations` |

The rest of the product lives in sibling repos:

| Folder | Repo | Role |
|---|---|---|
| `C:/Users/benpa/healthflexx-app` | HealthFlexxinc/HealthFlexx-app | Flutter app (steps, sleep, nutrition, coach chat) |
| `C:/Users/benpa/behavior_change` | HealthFlexxinc/behavior-change | FastAPI coach backend on Render |

## Data

No health data. `reset-password.html` receives a Supabase auth token from the reset
email link (handled by supabase-js, pinned on jsdelivr); `confirmed.html` is static. Do
not add logging, analytics, or other third-party scripts to either page.

## Deploy

`firebase deploy --only hosting` from the repo root. Deploying changes a live page that
users land on from auth emails, so confirm with Ben before running it.
