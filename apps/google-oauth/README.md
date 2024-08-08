# Google OAuth example in Astro

Uses SQLite (in-memory) database.

```
pnpm i
pnpm dev
```

## Setup

Create a Google OAuth app with the callback set to `http://localhost:4321/login/google/callback` and create an `.env` file.

```bash
OAUTH_GOOGLE_ID=
OAUTH_GOOGLE_SECRET=
OAUTH_GOOGLE_REDIRECT=
```
