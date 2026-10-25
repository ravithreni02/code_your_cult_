# AgriSetu

AgriSetu is a farmer-first platform for finding farm equipment, hiring labour, requesting finance, sharing community knowledge, and getting crop recommendations.

## Features

- Equipment and labour marketplaces
- Role-based dashboards for farmers and providers
- AgriGenie crop recommendations using soil, weather, and climate inputs
- English, Hindi, and Telugu interfaces
- Voice assistance where supported by the device
- Supabase Auth, Postgres, and Row Level Security
- Capacitor configuration for Android and iOS builds

## Run locally

1. Install Node.js 18 or newer.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with the client-safe Supabase values:

   ```text
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Validate the project:

   ```bash
   npm run lint
   npm run build
   npm test
   ```

The publishable key is intended for browser use. Never put a Supabase service-role key in `.env` or client code.

## Mobile build

Build the web app and sync the bundled `dist/` output into Capacitor:

```bash
npm run build
npx cap sync android
npx cap open android
```

## Project structure

- `src/pages/` contains user-facing flows.
- `src/components/` contains reusable UI and navigation.
- `src/lib/agrigenie.ts` contains the crop recommendation engine.
- `supabase/migrations/` contains append-only database migrations.

## Product notes

AgriGenie is an explainable browser-side recommendation model, not a general-purpose conversational AI. Recommendations depend on the available soil and weather inputs and should be treated as decision support, not a guarantee of yield.
