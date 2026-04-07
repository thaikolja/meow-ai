# Meow 🐾 — Changelog

All notable changes to this project are documented here.

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
- Project metadata and developer docs now reflect the current auth, storage, and streaming architecture

### Fixed

- Prompt focus now returns to the chat textarea after sending a message
- Streaming chat views no longer hard-code a static `"Thinking..."` label
- Session-related auth responses now avoid cacheable behavior

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
