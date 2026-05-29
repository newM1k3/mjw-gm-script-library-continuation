# MJW GM Script Library

The **MJW GM Script Library** is a Vite, React, and TypeScript application for managing escape room game-master scripts, version history, hint ladders, pronunciation notes, staff acknowledgements, readiness checks, and exportable room packets. The current repository is stabilized as a frontend-first production handoff baseline. It keeps the existing UI behavior intact while adding a persistence adapter layer that can run in demo localStorage mode or production PocketBase mode.

## Current Status

This baseline runs as a static Vite application. Application data is accessed through `src/lib/dataAdapter.ts`, which preserves the current browser localStorage demo behavior and isolates all PocketBase SDK calls behind a production adapter. The built-in sample data can be restored from the Export Center when `VITE_DATA_MODE=demo`. PocketBase mode is wired for collection-based persistence, but the external PocketBase collections, authentication rules, and access policies still need to be created before production use.

| Area | Current State | Production Next Step |
|---|---|---|
| Frontend | React and TypeScript static app | Continue feature work in small Bolt.new prompts after this baseline |
| Persistence | Adapter layer with demo localStorage mode and isolated PocketBase mode | Create PocketBase collections, rules, and operational backup policy |
| AI features | Not implemented in this baseline | Add Netlify Function wrapper for OpenAI or Gemini |
| Deployment | Ready for Netlify static build via `netlify.toml` | Connect GitHub repo to Netlify and set environment variables |
| Testing | Vitest logic tests, TypeScript, ESLint, and production build checks | Add component/integration coverage around backend workflows |

## Local Development

Install dependencies, run the development server, and verify the project before handing it to Bolt.new or Netlify.

```bash
npm install
npm run dev
```

Use these commands before committing production changes.

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

The local development server is provided by Vite. The production build output is written to `dist`.

## Netlify Deployment

This repository includes a `netlify.toml` file with the deployment baseline:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

To deploy with Netlify, create a new Netlify site from the GitHub repository, use the `main` branch, and keep the detected build command as `npm run build` with the publish directory set to `dist`. The project is deployable as a static frontend in demo mode. For PocketBase mode, configure `VITE_DATA_MODE=pocketbase` and `VITE_POCKETBASE_URL` in Netlify after the external PocketBase collections and rules are ready.

## Environment Variables

Copy `.env.example` to `.env.local` for local development if you need to test configuration-dependent work. Do not commit `.env.local` or any real secret values.

| Variable | Scope | Safe in Browser? | Purpose |
|---|---:|---:|---|
| `VITE_DATA_MODE` | Frontend | Yes | Selects `demo` localStorage mode or `pocketbase` production adapter mode |
| `VITE_POCKETBASE_URL` | Frontend | Yes | Public URL of the PocketBase instance used when `VITE_DATA_MODE=pocketbase` |
| `VITE_APP_ENV` | Frontend | Yes | Optional deployment label for development, preview, or production |
| `AI_PROVIDER` | Netlify Function | No | Planned selector for `openai` or `gemini` server-side AI rewriting |
| `OPENAI_API_KEY` | Netlify Function | No | Planned OpenAI key for server-side AI operations |
| `GEMINI_API_KEY` | Netlify Function | No | Planned Gemini key for server-side AI operations |
| `PB_SERVICE_URL` | Netlify Function | No | Optional future server-side PocketBase service URL |
| `PB_SUPERUSER_TOKEN` | Netlify Function | No | Optional future PocketBase service/admin token; never expose client-side |

## Data Model Status

The TypeScript model in `src/types.ts` currently covers the core operational entities: rooms, scripts, script versions, hint ladders, pronunciation terms, staff members, acknowledgements, audit results, and app state. The adapter boundary preserves the existing `AppState` shape for components while mapping helpers allow backend records to evolve independently. For production, the external PocketBase schema still needs ownership fields, authentication rules, migration strategy, backup policy, and conflict-resolution behavior.

## Known Limitations

The current application should be treated as a polished prototype and deployment baseline, not as a complete production operations system. Demo mode data remains local to the browser, while PocketBase mode requires external collections and access rules before it can be used operationally. There is no user authentication, role-based access control, cloud backup policy, email notification workflow, AI rewrite endpoint, or component-level integration test suite. The export functionality is useful for handoff packets, but external integrations with RoomReady Ops, Puzzle Flow Visualizer, LockMap Studio, and other MJW tools are still future work.

## Recommended Next Prompts

After this adapter-layer commit, continue in small, verifiable prompts. The next prompt should create and verify the external PocketBase collections, authentication rules, and seed/import workflow against `VITE_DATA_MODE=pocketbase`. A later prompt should add Netlify Functions for AI-assisted script rewriting, with all API keys stored only in Netlify server-side environment variables.
