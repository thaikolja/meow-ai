# Meow 🐾 — Changelog

All notable changes to this project are documented here.

## v1.4.0 — 2026-09-23

### feat

- feat(chat): generate a public cat-sentence address for each new chat (`/chat/cat-sits-on-sofa`) with `google/gemini-3.5-flash-lite`
- feat(chat): keep the random hash as the internal id so old `/chat/<hash>` links still open
- feat(chat): fall back to a local 4- or 5-word cat sentence when the slug model fails, times out, or returns an unusable phrase
- feat(models): switch the model inside an open chat; the next message and the refresh button use that model
- feat(models): start new chats from the saved default (`chat-yanawa-selected-model`, otherwise `NUXT_PUBLIC_DEFAULT_MODEL`)
- feat(models): replace the catalog with Gemini 2.5 Flash, Gemini 3 Flash, Gemini 3.5 Flash, Gemini 3.5 Flash Lite, Gemini 3.6 Flash, Gemini 3.7 Flash, Gemini 3.8 Flash, and DeepSeek V4.1 Flash (`deepseek-flash`)
- feat(deepseek): send `deepseek-flash` to `https://api.deepseek.com/chat/completions` with `NUXT_DEEPSEEK_API_KEY`
- feat(deepseek): map retired ids `deepseek-v4-flash` and `deepseek/…` to `deepseek-flash`, with thinking disabled so the reply streams as normal text

### fix

- fix(app): keep `<NuxtLayout>` and `<NuxtPage>` mounted and cover them with the auth gate, removing `NUXT_E4011`, `NUXT_E4007`, and the Vite `import.meta.hot.send()` warning
- fix(deploy): enter `/var/www/vhosts/yanawa.io/meow.yanawa.io` before looking for `docker-compose.yml`
- fix(deploy): allow root password SSH (`PermitRootLogin yes`) so `sshpass` is not rejected
- fix(ci): log in as root with `SSH_DEPLOY_PASSWORD` instead of `ssh-add`, which failed with `error in libcrypto`
- fix(docker): create `/tmp/meow-sockets` before `bun run build` and bind-mount `.data/models.json` read-only

### chore

- chore(headers): remove the `@email` line from source file headers
- chore(repo): stop tracking `.serena/` and delete the unused `gitlab-ci.yml` template
- chore(security): rewrite history to remove API keys that had been committed in `app/composables/useProviders.ts`
- chore(deps): refresh Nuxt, Nuxt UI, and related package ranges
- chore(test): add `tests/chat-slug.test.js` and `tests/session-model.test.js`

## v1.3.0 — 2026-08-23

### feat

- feat(chat): stamp new chats with Settings **Default Meow-del**, or `NUXT_PUBLIC_DEFAULT_MODEL` when Settings has no override
- feat(models): persist the preferred model in `localStorage` under `chat-yanawa-selected-model`

### fix

- fix(ci): log into the server as root with `SSH_DEPLOY_PASSWORD` and `sshpass` instead of `ssh-add`
- fix(deploy): stop failing with `Error loading key "(stdin)": error in libcrypto`

### chore

- chore(build): set `TMPDIR=/tmp/meow-sockets` on `build` and `dev` so Vite sockets stay under the macOS `sun_path` limit

## v1.2.0 — 2026-06-30

### feat

- feat(models): seed `.data/models.json` with four Gemini models when the file is missing, empty, or corrupt
- feat(models): add `shared/types/model.ts` as the shared catalog type
- feat(models): add Settings **Default Meow-del** and remember each chat's model from creation
- feat(ci): deploy on push to `main` by SSHing to the server and running `scripts/deploy.sh`

### fix

- fix(models): fill an empty catalog on first load so the dropdown is not stuck on the env default
- fix(models): restore the saved model after refresh once the catalog has loaded
- fix(docker): create `/app/.data` as `node:node` so the volume is writable
- fix(docker): drop the `VOLUME` instruction that discarded the later `chown`

### chore

- chore(chat): route every completion through OpenRouter and `NUXT_OPENROUTER_API_KEY`
- chore(models): set the env fallback to `google/gemini-2.5-flash`
- chore(models): ship `google/gemini-3-flash-preview`, `google/gemini-3.1-flash-lite-preview`, `google/gemini-3.5-flash`, and `google/gemini-2.5-flash`
- chore(providers): remove provider CRUD, encrypted provider storage, and the provider management UI
- chore(models): move `isThinkingModel` to `shared/utils/models.ts`
- chore(test): add `tests/models-storage.test.js`

## v1.1.0 — 2026-04-07

### feat

- feat(auth): add the in-app `AuthGate`, one-time challenge, and proof login
- feat(auth): add logout and a username control in the header
- feat(ui): add the cold-start loader, starter prompts, login confetti, and randomized thinking copy
- feat(ui): add a theme-aware SVG favicon and a `favicon.ico` fallback

### fix

- fix(chat): return focus to the composer after send
- fix(chat): stop hard-coding `"Thinking..."` while a reply streams
- fix(auth): keep session responses uncacheable
- fix(docker): pin the Bun build stages, skip `.data/providers.json`, and run Nitro as non-root Node
- fix(data): read the persistent `.data` directory from preview and other built runtimes
- fix(assets): send cache headers for static files and favicons

### chore

- chore(auth): keep `NUXT_APP_PASSWORD` on the server and post only the browser proof
- chore(auth): check the session from `app.vue` through `/api/auth/session`
- chore(build): validate `NUXT_APP_PASSWORD` when the server starts, not during `nuxt build`
- chore(test): cover cat-name rules, one-time challenges, and proof checks

## v1.0.0 — 2026-04-04

### feat

- feat(app): start the Nuxt 4 shell with Nuxt UI and Tailwind CSS 4
- feat(chat): add the message list and a streaming layout
- feat(chat): add the first provider, model, and chat calls to remote LLMs

### chore

- chore(dx): use Bun for local development
- chore(ui): ship a dark-mode-first layout

### fix

- fix(app): correct the first hydration and alignment bugs in the chat UI
