# DNA Web

This project contains the DNA Web front-end built with [Next.js](https://nextjs.org/).

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a local environment file:
   ```bash
   cp .env.local.example .env.local
   ```
3. Update `.env.local` to point to your backend. For local development the API usually runs at `http://localhost:2080/api`:
   ```ini
   NEXT_PUBLIC_API_BASE_URL=http://localhost:2080/api
   ```

## Development server

Run the development server on port `4001`:

```bash
npm run dev
```

Then open [http://localhost:4001](http://localhost:4001) in your browser.

## Production build

To create an optimized production build and preview it locally:

```bash
npm run build
npm run start
```

The preview server also listens on [http://localhost:4001](http://localhost:4001).
