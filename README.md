# Meow 🐾

Meow is a cat-themed Nuxt 4 chat interface for focused German practice with your own LLM providers. It keeps provider secrets on the server, stores chats in the browser, and streams model responses back through a small Nuxt API layer.

## Highlights

- **Safer shared-password access** via an in-app auth gate, a short-lived server challenge, and a client-side proof derived from `NUXT_APP_PASSWORD`
- **Signed sessions + logout** with `chat_session` and `chat_username` cookies
- **Server-side provider storage** with AES-256-GCM encrypted API keys in `.data/providers.json`
- **Separate model catalog** in `.data/models.json` for curated model labels and availability
- **Streaming chat UX** with OpenAI-compatible and Google/Gemini normalization
- **Cat-themed polish** including cold-start loading, a richer new-chat empty state, login confetti, random thinking messages, and theme-aware favicons with an `.ico` fallback

## Architecture overview

| Area | What it does |
| --- | --- |
| `app/` | Nuxt 4 frontend shell, chat pages, auth gate, and cat-themed UI components |
| `app/composables/useChats.ts` | Stores chat threads and messages in browser localStorage |
| `app/composables/useChatStream.ts` | Consumes SSE responses from `/api/chat` |
| `app/composables/useAuthSession.ts` | Tracks authenticated state, session checks, and logout |
| `server/api/chat.post.ts` | Validates auth + CSRF, resolves the provider, and proxies streamed completions |
| `server/api/auth/*` | Challenge, login, logout, and session endpoints for the shared-password flow |
| `server/api/providers/*` | CRUD for providers without exposing API keys to the client |
| `server/api/models/index.get.ts` | Reads the curated model catalog from `.data/models.json` |
| `server/api/models.post.ts` | Syncs live model IDs into provider storage |
| `.data/providers.json` | Encrypted provider definitions and cached provider model IDs |
| `.data/models.json` | Human-managed model metadata used by the selector UI |

## Auth flow

There is no longer a dedicated `/login` experience for normal access.

1. `app.vue` checks `/api/auth/session` on load.
2. If the session is missing, the app shows `AuthGate.vue` directly inside the main shell.
3. The browser fetches a one-time challenge from `GET /api/auth/challenge`.
4. The browser signs that challenge with the shared secret from `NUXT_APP_PASSWORD` and sends only the proof to `POST /api/auth/login`.
5. The server verifies the proof, sets the signed cookies, and the UI triggers a confetti burst before entering the app.

The shared password still lives in `.env`, but it is no longer posted directly to the server.

## Chat flow

1. The landing page creates a new local chat thread.
2. The first prompt is carried into `/chat/[id]` through `sessionStorage`.
3. `useChatStream()` posts messages to `/api/chat`.
4. The server resolves the provider key, forwards the request upstream, and returns SSE chunks.
5. The client parses those chunks and keeps the prompt focused so the next message can be drafted immediately.

## Setup

```bash
bun install
cp .env.example .env
bun run dev
```

Open `http://localhost:3000`.

## Available scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the Nuxt dev server with `.env` loaded |
| `bun run build` | Build the production bundle |
| `bun run generate` | Generate a static build with the current env file |
| `bun run preview` | Preview the production bundle with the current env file |
| `bun run typecheck` | Run `nuxt typecheck` |
| `bun test` | Run the Bun test suite |

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NUXT_APP_PASSWORD` | Shared house secret used for login; required in production |
| `NUXT_SESSION_SECRET` | Signs session cookies and derives the provider-encryption key; defaults to `NUXT_APP_PASSWORD` |
| `NUXT_PUBLIC_DEFAULT_PROVIDER` | Default provider ID for first load and new chats |
| `NUXT_PUBLIC_DEFAULT_MODEL` | Default model ID for first load and new chats |
| `NUXT_DEEPSEEK_API_KEY` | Optional server-side key for the DeepSeek default provider |
| `NUXT_GROQ_API_KEY` | Optional server-side key for the Groq default provider |
| `NUXT_GOOGLE_API_KEY` | Optional server-side key for the Gemini default provider |
| `NUXT_REDIS_URL` | Enables Redis-backed login rate limiting |
| `NUXT_ALLOW_PRIVATE_PROVIDER_URLS` | Allows private/internal provider hosts when set to `true` |
| `NUXT_DATA_DIR` | Overrides the default `.data/` directory |

## Notes

- Provider API keys never reach the client.
- Chats, prompt overrides, and context settings stay in browser storage.
- `chat_username` is UI-only; auth decisions rely on the signed session cookie and `/api/auth/session`.
- The SVG favicon switches paw color based on `prefers-color-scheme`, and `favicon.ico` is kept as a fallback.

## Testing

The project currently uses Bun tests plus Nuxt typechecking:

```bash
bun run typecheck
bun test
```
