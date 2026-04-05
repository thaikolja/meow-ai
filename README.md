# 🐾 Meow — The Furry-Fi AI Interface

Welcome to **Meow**, the AI-powered chat interface that is simply... *purr-fect* for connecting to your remote LLM
endpoints.

![Cat Mascot](https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=2048&auto=format&fit=crop) *(Pretend this is a cool cyber-cat!)*

## 🐱 What's the Meow?

This application lets you talk to AI models via your own API endpoints. No more cat-and-mouse games with complex setups!

- **Multi-Model Support**: Connect to any API that speaks "Human."
- **Sleek UI**: Built with Nuxt 4 and Tailwind CSS for a smooth, high-fidelity experience.
- **Privacy First**: Your keys, your rules. No stray cats allowed.

## 🧶 How to Play (Developer Setup)

1. **Paws-it the Repo**: clone your Meow repository
2. **Set the Secret Snacks**: copy `.env.example` to `.env` and fill in your provider API keys
3. **Cat-nip Installation**: `bun install`
4. **Start the Purr**: `bun run dev`
5. **Bask in the Light**: Open [http://localhost:3000](http://localhost:3000) locally or
   visit [https://meow.yanawa.io](https://meow.yanawa.io) in production

### 🔐 Environment Variables

The default providers read their API keys from `.env` via Nuxt runtime config:

- `NUXT_DEEPSEEK_API_KEY`
- `NUXT_GROQ_API_KEY`
- `NUXT_GOOGLE_API_KEY`
- `NUXT_PUBLIC_DEFAULT_PROVIDER`
- `NUXT_PUBLIC_DEFAULT_MODEL`

The Gemini default pair is:

- `NUXT_PUBLIC_DEFAULT_PROVIDER=gemini-default`
- `NUXT_PUBLIC_DEFAULT_MODEL=models/gemini-3.1-flash-lite-preview`

`.env` is gitignored, so you can keep provider secrets local.

## 📦 Purr-duction Checklist

To keep this project stable and avoid a *cat-astrophe*, we use GitLab CI:

- **Lint Stage**: Running typechecks to keep the fur balls at bay.
- **Build Stage**: Compiling the app for a smooth landing.
- **Deploy Stage**: Ready for a manual jump into production.

## 🛠️ The Scratchpad (Built With)

- [Nuxt.js 4](https://nuxt.com)
- [Bun](https://bun.sh)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Vue.js](https://vuejs.org)

## 🖋️ Contributing

If you have a paw-some idea, please open a Merge Request! We're always looking for new ways to make this project the *cat's pajamas*.

---

*Stay Curious, Stay Furry.* 🐈‍⬛
