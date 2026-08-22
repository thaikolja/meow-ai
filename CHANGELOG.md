# Meow 🐾 — Changelog

All notable changes to this project are documented here.

## Unreleased

### Changed

- GitLab `deploy_production` logs into the server as `root` with `SSH_DEPLOY_PASSWORD` (`sshpass`) instead of
  `SSH_DEPLOY_KEY` / `ssh-add`. `SSH_DEPLOY_USER` still defaults to `root`.

### Fixed

- Deploy no longer fails with `Error loading key "(stdin)": error in libcrypto` from a malformed or File-type SSH key.

## v1.2.0 — 2026-06-30

### Added

- Auto-seeding of the model catalog — `.data/models.json` is populated with 4 default Gemini models on first request when the file is empty or missing
- Shared `Model` type in `shared/types/model.ts` as the single source of truth for both server and client
- `tests/models-storage.test.js` covering the seeding behavior (missing file, empty array, corrupt JSON, existing models, disk persistence)
- Persisted model selection in `localStorage` under `chat-yanawa-selected-model`
- "Default Meow-del" dropdown in `SettingsModal` for setting the user's preferred default model
- Per-chat model memory — each chat remembers which model it was created with, so existing conversations don't change when the default is switched
- Automatic deployment on push to `main` — `.gitlab-ci.yml` now SSHes into the production server and runs `scripts/deploy.sh` to pull, stop, rebuild, and restart the container

### Changed

- Simplified the app to use OpenRouter only — all chats are routed through `https://openrouter.ai/api`
- Default model is now `google/gemini-2.5-flash`
- Curated catalog of 4 Gemini models: `google/gemini-3-flash-preview`, `google/gemini-3.1-flash-lite-preview`, `google/gemini-3.5-flash`, `google/gemini-2.5-flash`
- Removed all multi-provider infrastructure: provider CRUD endpoints, encrypted provider storage, provider management UI, `ProviderList.vue`, `ProviderForm.vue`, `useProviders.ts`, and the Google/DeepSeek/Groq-specific code paths in `providerApi.ts`
- `server/api/chat.post.ts` now hardcodes the OpenRouter base URL and reads the API key from `NUXT_OPENROUTER_API_KEY`; provider lookup is no longer needed
- `ModelSelector.vue` simplified to a flat list (no provider grouping) and syncs with the persisted preference via a `watchEffect` that handles the SSR → client hydration race
- `isThinkingModel` moved to `shared/utils/models.ts` and imported directly by both server and client
- `.env`, `.env.example`, `docker-compose.yml`, and `nuxt.config.ts` simplified to only require `NUXT_OPENROUTER_API_KEY` (DeepSeek, OpenCode, Groq, and Google env vars removed)
- README and AGENTS docs rewritten to reflect the single-provider architecture

### Fixed

- Docker: `/app/.data` is now created with `node:node` ownership in the image so the mounted volume doesn't start with root permissions and cause `EACCES` errors
- Model dropdown showing only the env default on first load when the catalog was empty — the auto-seeding fills the catalog on first request
- Model selection no longer resets to the default on page refresh — the persisted value is restored once both the localStorage entry and the model catalog are available
- `docker build` now uses a clean Dockerfile without the `VOLUME` directive (which was discarding subsequent `chown` instructions)

## v1.1.0 — 2026-04-07

### Added

- In-app `AuthGate` access flow so the main app no longer depends on a phishing-like `/login` page
- One-time login challenge endpoint and proof-based verification flow
- Logout endpoint and top-right logout control beside the active username
- Cat-themed cold-start loading state, richer new-chat starter view, login confetti burst, and randomized thinking messages
- Theme-aware SVG favicon behavior plus a generated `favicon.ico` fallback
- Auth challenge tests covering username normalization, one-time use, and proof verification

### Changed

- Shared-password auth now keeps the secret in `.env` while sending only a client-side proof to the server
- Root app loading now happens in `app.vue`, with session warmup gated through `/api/auth/session`
- New chats keep the currently selected provider and model
- The model selector now explicitly reloads providers and the file-backed model catalog when it mounts
- Project metadata and developer docs now reflect the current auth, storage, and streaming architecture
- Production secret validation now happens when the server starts instead of during `nuxt build`, so local and Docker
  builds no longer require a baked-in password

### Fixed

- Prompt focus now returns to the chat textarea after sending a message
- Streaming chat views no longer hard-code a static `"Thinking..."` label
- Session-related auth responses now avoid cacheable behavior
- Docker now uses pinned Bun stages for build and production dependencies, excludes `.data/providers.json`, and runs the
  final Nitro server on a non-root Node runtime
- Preview and other built runtimes now keep reading the real persistent `.data` directory instead of resolving from
  `.output`, restoring the full model catalog from `.data/models.json`
- Static Nuxt assets and favicons now ship with cache headers for faster repeat loads

## v1.0.0 — 2026-04-04

### Added

- Initial Nuxt 4 application shell with `@nuxt/ui`, `@nuxt/icon`, and Tailwind CSS 4
- Core chat interface with message rendering and streaming-oriented layout
- Basic provider, model, and chat plumbing for remote LLM endpoints

### Improved

- Bun-based local development workflow
- Dark-mode-first visual styling

### Fixed

- Early hydration and alignment issues in the initial chat UI
