# Meow AI 🐾

**Version [1.3.0](CHANGELOG.md)** — kitten-themed Nuxt 4 chat interface for focused German practice.
All requests are routed through OpenRouter, secrets stay server-side, chats are stored in the browser, and model
responses stream back through a small Nuxt API layer.

## Highlights

- **Safer shared-password access** via an in-app auth gate, a short-lived server challenge, and a client-side proof derived from `NUXT_APP_PASSWORD`
- **Signed sessions + logout** with `chat_session` and `chat_username` cookies
- **OpenRouter-only** with a curated catalog of 4 Gemini models in `.data/models.json`
- **Settings default overwrites `.env`** for new chats only (`NUXT_PUBLIC_DEFAULT_MODEL` is the fallback)
- **Per-chat model memory** — each thread stores the model it uses; the header picker retargets the open chat
- **One-shot image attach** (JPG, JPEG, PNG, WebP, AVIF, max 1 MB) sent once as vision input, never previewed or stored
- **Streaming chat UX** with OpenAI-compatible request/response handling
- **Local icon bundles** so layout icons (`mdi:paw`, `mdi:cat`, GitLab/GitHub, user, log-out) do not fetch Iconify at
  runtime
- **Cat-themed polish** including cold-start loading, a richer new-chat empty state, login confetti, random thinking messages, and theme-aware favicons with an `.ico` fallback

## Architecture overview

| Area                                 | What it does                                                                 |
|--------------------------------------|------------------------------------------------------------------------------|
| `app/`                               | Nuxt 4 frontend shell, chat pages, auth gate, and cat-themed UI components   |
| `app/composables/useChats.ts`        | Stores chat threads and messages in browser localStorage                     |
| `app/composables/useChatStream.ts`   | Consumes SSE responses from `/api/chat` (optional `image` sidecar)           |
| `app/composables/useAuthSession.ts`  | Tracks authenticated state, session checks, and logout                       |
| `app/composables/useSettings.ts`     | System prompt, max context, and new-chat model override                      |
| `app/composables/useSessionModel.ts` | Resolves Settings vs `.env` vs the open chat’s stamped model                 |
| `app/composables/useModels.ts`       | File-backed model catalog (loads from `/api/models`)                         |
| `app/components/ChatInput.vue`       | Composer plus one-shot image attach (button, drag-and-drop, Cmd/Ctrl+V)      |
| `server/api/chat.post.ts`            | Validates auth + CSRF, optional vision attach, proxies SSE to OpenRouter     |
| `server/api/auth/*`                  | Challenge, login, logout, and session endpoints for the shared-password flow |
| `server/api/models/index.get.ts`     | Reads the curated model catalog from `.data/models.json`                     |
| `.data/models.json`                  | Auto-seeded on first request with 4 default Gemini models                    |

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

1. The landing page creates a new local chat thread stamped with the effective default model (Settings, else `.env`).
2. The first prompt is passed to `/chat/[id]` via `sessionStorage`. An attached image, if any, is handed off in memory
   (`pending-chat-image`) and is never written to `localStorage` or `sessionStorage`.
3. `useChatStream()` posts `{ messages, model, image? }` to `/api/chat`.
4. The server validates auth + CSRF, optionally attaches the image as vision input on the last user message, uses the
   OpenRouter API key from runtime config, and returns SSE chunks. Image bytes are dropped after that request.
5. The client parses those chunks. The user bubble stores typed text only — no preview and no stored image.

## Image attach

- Formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`. Maximum decoded size: **1 MB**.
- Attach with the composer button, drag-and-drop onto the input, or Cmd/Ctrl+V.
- Oversized or unsupported files show a themed error on the composer; the image is not staged.
- AVIF is converted to JPEG in the browser before upload. The payload is raw base64 plus MIME type.
- One vision call per send: the image rides with that prompt, then is discarded. Regenerating a reply does not resend
  it. A later turn can attach a new image.
- Reloading during the `/` → `/chat/[id]` handoff drops a staged image (it only lives in memory).

## Model selection

- New chats use Settings **Default Meow-del** if set, otherwise `NUXT_PUBLIC_DEFAULT_MODEL` (fallback
  `google/gemini-2.5-flash`)
- Settings overwrites `.env` for new chats only; existing threads keep the model they were created with
- The header model picker retargets the open chat; on the landing page it sets the Settings default for new chats. The
  sidebar lists each chat’s model
- The catalog is file-backed in `.data/models.json` and routed through OpenRouter

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

`build` and `dev` set `TMPDIR=/tmp/meow-sockets` so Vite/Nuxt Unix sockets stay on a short path (macOS `sun_path` is
104 bytes).

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

## Deployment

Every push to `main` triggers a GitLab CI pipeline that redeploys the production container on the live server:

1. `lint` — `bun install` + typecheck
2. `build` — `bun install` + `bun run build` (artifacts)
3. `deploy` — SSHes into the server as root with `SSH_DEPLOY_PASSWORD` and runs `scripts/deploy.sh`, which:
   - Pulls the latest code from `origin/main`
   - Stops and removes the running container
   - Removes the old image and prunes the build cache
   - Rebuilds the image from scratch
   - Starts the new container and tails recent logs

You can also run the deploy script manually on the server for emergency redeploys:

```bash
./scripts/deploy.sh
```

The CI job requires these CI/CD variables to be set in GitLab (Settings > CI/CD > Variables):

- `SSH_DEPLOY_PASSWORD` — root password (Type: Variable; enable Mask and Protect; no quotes)
- `SSH_DEPLOY_HOST` — hostname or IP of the production server
- `SSH_DEPLOY_USER` — (optional) SSH username, defaults to `root`
- `SSH_DEPLOY_PORT` — (optional) SSH port, defaults to `22`

The production host must allow password SSH for that user (`PasswordAuthentication yes` and, for root, `PermitRootLogin yes`).

## Available scripts

| Command             | Purpose                                                                                  |
|---------------------|------------------------------------------------------------------------------------------|
| `bun run dev`       | Start the Nuxt dev server with `.env` loaded; uses `TMPDIR=/tmp/meow-sockets`            |
| `bun run build`     | Production bundle; secrets are enforced at server start; uses `TMPDIR=/tmp/meow-sockets` |
| `bun run generate`  | Generate a static build with the current env file                                        |
| `bun run preview`   | Preview the production bundle with the current env file                                  |
| `bun run typecheck` | Run `nuxt typecheck`                                                                     |
| `bun test`          | Run the Bun test suite                                                                   |

## Environment variables

| Variable                           | Purpose                                                                                             |
|------------------------------------|-----------------------------------------------------------------------------------------------------|
| `NUXT_APP_PASSWORD`                | Shared house secret used for login; required in production                                          |
| `NUXT_SESSION_SECRET`              | Signs session cookies; defaults to `NUXT_APP_PASSWORD`                                              |
| `NUXT_PUBLIC_DEFAULT_PROVIDER`     | Default provider ID for first load and new chats (default: `openrouter-default`)                    |
| `NUXT_PUBLIC_DEFAULT_MODEL`        | Env fallback model for new chats when Settings has no override (default: `google/gemini-2.5-flash`) |
| `NUXT_OPENROUTER_API_KEY`          | OpenRouter API key; required for chat to work                                                       |
| `NUXT_REDIS_URL`                   | Enables Redis-backed login rate limiting                                                            |
| `NUXT_ALLOW_PRIVATE_PROVIDER_URLS` | Allows private/internal provider hosts when set to `true`                                           |
| `NUXT_DATA_DIR`                    | Overrides the default `.data/` directory                                                            |

## Notes

- The OpenRouter API key never reaches the client.
- Chats, prompt overrides, context settings, and model selection stay in browser storage.
- Attached images exist in memory for one `/api/chat` request. They are never written to disk or browser storage.
- `chat_username` is UI-only; auth decisions rely on the signed session cookie and `/api/auth/session`.
- Layout icons are bundled via `@nuxt/icon` `clientBundle` (`scan` plus an explicit list in `nuxt.config.ts`). Dynamic
  `:name` bindings that still log `[Icon] failed to load` need to be added to that list.
- The SVG favicon switches paw color based on `prefers-color-scheme`, and `favicon.ico` is kept as a fallback.
- Production containers should inject `NUXT_APP_PASSWORD` and the OpenRouter key at runtime, not during image build.

## Testing

The project uses Bun tests plus Nuxt typechecking:

```bash
bun run typecheck
bun test
```

Coverage includes auth, branding, models, session-model resolution, image MIME/magic-byte/size checks, clipboard image
picking, provider request shaping (including vision attach), and runtime-config validation.
