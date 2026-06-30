# Meow AI 🐾

**Meow AI** is a kitten-themed Nuxt 4 chat interface for focused German practice. All requests are routed through
OpenRouter, secrets stay server-side, chats are stored in the browser, and model responses stream back through a
small Nuxt API layer.

## Highlights

- **Safer shared-password access** via an in-app auth gate, a short-lived server challenge, and a client-side proof derived from `NUXT_APP_PASSWORD`
- **Signed sessions + logout** with `chat_session` and `chat_username` cookies
- **OpenRouter-only** with a curated catalog of 4 Gemini models in `.data/models.json`
- **Persisted model selection** in the browser so your preferred model survives reloads
- **Per-chat model memory** — existing conversations keep the model they were created with
- **Streaming chat UX** with OpenAI-compatible request/response handling
- **Cat-themed polish** including cold-start loading, a richer new-chat empty state, login confetti, random thinking messages, and theme-aware favicons with an `.ico` fallback

## Architecture overview

| Area | What it does |
| --- | --- |
| `app/` | Nuxt 4 frontend shell, chat pages, auth gate, and cat-themed UI components |
| `app/composables/useChats.ts` | Stores chat threads and messages in browser localStorage |
| `app/composables/useChatStream.ts` | Consumes SSE responses from `/api/chat` |
| `app/composables/useAuthSession.ts` | Tracks authenticated state, session checks, and logout |
| `app/composables/useSettings.ts` | System prompt, max context, and persisted model selection |
| `app/composables/useModels.ts` | File-backed model catalog (loads from `/api/models`) |
| `server/api/chat.post.ts` | Validates auth + CSRF and proxies streamed completions to OpenRouter |
| `server/api/auth/*` | Challenge, login, logout, and session endpoints for the shared-password flow |
| `server/api/models/index.get.ts` | Reads the curated model catalog from `.data/models.json` |
| `.data/models.json` | Auto-seeded on first request with 4 default Gemini models |

## Auth flow

There is no longer a dedicated `/login` experience for normal access.

1. `app.vue` checks `/api/auth/session` on load.
2. If the session is missing, the app shows `AuthGate.vue` directly inside the main shell.
3. The browser fetches a one-time challenge from `GET /api/auth/challenge`.
4. The browser signs the challenge with the shared secret from `NUXT_APP_PASSWORD` and sends only the proof to
   `POST /api/auth/login`.
5. The server verifies the proof, sets the signed cookies, and the UI triggers a confetti burst before the app loads.

The shared password still lives in `.env`, but it is no longer posted directly to the server.

## Chat flow

1. The landing page creates a new local chat thread.
2. The first prompt is passed to `/chat/[id]` via `sessionStorage`.
3. `useChatStream()` posts messages to `/api/chat`.
4. The server uses the OpenRouter API key from runtime config, forwards the request upstream, and returns SSE chunks.
5. The client parses those chunks and keeps the prompt focused so the next message can be drafted immediately.

## Model selection

- The default model is `google/gemini-2.5-flash` (override via `NUXT_PUBLIC_DEFAULT_MODEL`)
- The catalog contains 4 Gemini models, all routed through OpenRouter: Gemini 3 Flash, Gemini 3.1 Flash Lite, Gemini 3.5 Flash, and Gemini 2.5 Flash
- The header `ModelSelector` and the "Default Meow-del" dropdown in Settings stay in sync
- Your preferred model is saved to `localStorage` under `chat-yanawa-selected-model` and persists across reloads
- Each chat remembers which model it was created with, so existing conversations don't change when you switch the default

## Setup

```bash
bun install
cp .env.example .env
bun run dev
```

Open `http://localhost:3000`.

## Production builds

`bun run build` no longer requires baking `NUXT_APP_PASSWORD` into the build step. The production secret is validated
when the Nitro server starts, which makes local builds and container builds work without copying a real `.env` into the
image.

## Docker

The Docker setup is multi-stage: Bun builds the app, and the final image runs Nitro on Node as a non-root user. It
intentionally excludes `.env` and `.data/` from the build context, so pass secrets at runtime instead:

```bash
docker compose build
docker compose up -d
```

Secrets go in `.env` (or a runtime-injected equivalent):

```bash
NUXT_APP_PASSWORD=replace-me
NUXT_SESSION_SECRET=replace-me-too
NUXT_OPENROUTER_API_KEY=sk-or-v1-...
```

## Available scripts

| Command             | Purpose                                                                  |
|---------------------|--------------------------------------------------------------------------|
| `bun run dev`       | Start the Nuxt dev server with `.env` loaded                             |
| `bun run build`     | Build the production bundle; secrets are enforced when the server starts |
| `bun run generate`  | Generate a static build with the current env file                        |
| `bun run preview`   | Preview the production bundle with the current env file                  |
| `bun run typecheck` | Run `nuxt typecheck`                                                     |
| `bun test`          | Run the Bun test suite                                                   |

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NUXT_APP_PASSWORD` | Shared house secret used for login; required in production |
| `NUXT_SESSION_SECRET` | Signs session cookies; defaults to `NUXT_APP_PASSWORD` |
| `NUXT_PUBLIC_DEFAULT_PROVIDER` | Default provider ID for first load and new chats (default: `openrouter-default`) |
| `NUXT_PUBLIC_DEFAULT_MODEL` | Default model ID for first load and new chats (default: `google/gemini-2.5-flash`) |
| `NUXT_OPENROUTER_API_KEY` | OpenRouter API key; required for chat to work |
| `NUXT_REDIS_URL` | Enables Redis-backed login rate limiting |
| `NUXT_ALLOW_PRIVATE_PROVIDER_URLS` | Allows private/internal provider hosts when set to `true` |
| `NUXT_DATA_DIR` | Overrides the default `.data/` directory |

## Notes

- The OpenRouter API key never reaches the client.
- Chats, prompt overrides, context settings, and model selection stay in browser storage.
- `chat_username` is UI-only; auth decisions rely on the signed session cookie and `/api/auth/session`.
- The SVG favicon switches paw color based on `prefers-color-scheme`, and `favicon.ico` is kept as a fallback.
- Production containers should inject `NUXT_APP_PASSWORD` and the OpenRouter key at runtime, not during image build.

## Testing

The project uses Bun tests plus Nuxt typechecking:

```bash
bun run typecheck
bun test
```
