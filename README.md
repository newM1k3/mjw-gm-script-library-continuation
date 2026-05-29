# MJW GM Script Library

The **MJW GM Script Library** is a Vite, React, and TypeScript application for managing escape room game-master scripts, version history, hint ladders, pronunciation notes, staff acknowledgements, readiness checks, and exportable room packets. The current repository is stabilized as a frontend-first production handoff baseline. It keeps the existing UI behavior intact while preparing the project for Netlify deployment and future production persistence.

## Current Status

This baseline runs as a static Vite application. Application data currently uses browser storage through the local storage adapter in `src/lib/storage.ts`, and the built-in sample data can be restored from the Export Center. A PocketBase integration file exists as a forward-compatible scaffold, but the production backend collections, authentication rules, and sync behavior have not yet been implemented.

| Area | Current State | Production Next Step |
|---|---|---|
| Frontend | React and TypeScript static app | Continue feature work in small Bolt.new prompts after this baseline |
| Persistence | Local browser storage with seeded demo data | Implement PocketBase collections and data adapter |
| AI features | Not implemented in this baseline | Add Netlify Function wrapper for OpenAI or Gemini |
| Deployment | Ready for Netlify static build via `netlify.toml` | Connect GitHub repo to Netlify and set environment variables |
| Testing | TypeScript, ESLint, and production build checks | Add automated unit and integration tests in a later prompt |

## Local Development

Install dependencies, run the development server, and verify the project before handing it to Bolt.new or Netlify.

```bash
npm install
npm run dev
```

Use these commands before committing production changes.

```bash
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

To deploy with Netlify, create a new Netlify site from the GitHub repository, use the `main` branch, and keep the detected build command as `npm run build` with the publish directory set to `dist`. The project is currently deployable as a static frontend; backend persistence and AI endpoints should be added through future prompts before operational production use.

## Environment Variables

Copy `.env.example` to `.env.local` for local development if you need to test configuration-dependent work. Do not commit `.env.local` or any real secret values.

| Variable | Scope | Safe in Browser? | Purpose |
|---|---:|---:|---|
| `VITE_DATA_MODE` | Frontend | Yes | Selects `demo` local storage mode now, with `pocketbase` planned for future persistence |
| `VITE_POCKETBASE_URL` | Frontend | Yes | Public URL of the future PocketBase instance |
| `VITE_APP_ENV` | Frontend | Yes | Optional deployment label for development, preview, or production |
| `AI_PROVIDER` | Netlify Function | No | Planned selector for `openai` or `gemini` server-side AI rewriting |
| `OPENAI_API_KEY` | Netlify Function | No | Planned OpenAI key for server-side AI operations |
| `GEMINI_API_KEY` | Netlify Function | No | Planned Gemini key for server-side AI operations |
| `PB_SERVICE_URL` | Netlify Function | No | Optional future server-side PocketBase service URL |
| `PB_SUPERUSER_TOKEN` | Netlify Function | No | Optional future PocketBase service/admin token; never expose client-side |

## Data Model Status

The TypeScript model in `src/types.ts` currently covers the core operational entities: rooms, scripts, script versions, hint ladders, pronunciation terms, staff members, acknowledgements, audit results, and app state. This is sufficient for frontend prototyping and static export workflows. For production, the model still needs a backend schema, ownership fields, authentication rules, migration strategy, and conflict-resolution behavior.

## Known Limitations

The current application should be treated as a polished prototype and deployment baseline, not as a complete production operations system. Data remains local to the browser. There is no user authentication, role-based access control, cloud backup, multi-device sync, email notification workflow, AI rewrite endpoint, or formal automated test suite. The export functionality is useful for handoff packets, but external integrations with RoomReady Ops, Puzzle Flow Visualizer, LockMap Studio, and other MJW tools are still future work.

## Recommended Next Prompts

After this stabilization commit, continue in small, verifiable prompts. The next prompt should implement the PocketBase backend schema and data adapter. A later prompt should add Netlify Functions for AI-assisted script rewriting, with all API keys stored only in Netlify server-side environment variables.
