# DNA Web

This project contains the DNA Web front-end built with [Next.js](https://nextjs.org/).

## Getting started

Follow these steps to bring the app online in about 5–10 minutes:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the example environment file and adjust it for local development:
   ```bash
   cp .env.local.example .env.local
   ```
3. Edit `.env.local` so the front-end can talk to your backend API (the local default is `http://localhost:2080/api`):
   ```ini
   NEXT_PUBLIC_API_BASE_URL=http://localhost:2080/api
   ```
4. Start the development server (runs on port `4001`):
   ```bash
   npm run dev
   ```

After the initial setup you can simply run everything in one go:

```bash
npm install && npm run dev
```

Once the server is running, open [http://localhost:4001](http://localhost:4001) in your browser.

### First-time user flow

On a fresh database you will be prompted to:

1. Register a new account.
2. Log in with the newly created credentials.
3. Claim your initial monster to start playing.

These steps appear automatically the first time you land on the site.

## Production build

To create an optimized production build and preview it locally:

```bash
npm run build
npm run start
```

The preview server also listens on [http://localhost:4001](http://localhost:4001).
