# Pyra — Setup Guide
## Supabase · Vercel · Cloudflare Pages

---

## 1 · Supabase (database, auth, storage)

### 1a — Create project
1. Go to **https://supabase.com** → **New project**
2. Pick a name (e.g. `pyra`), set a strong database password, choose a region
3. Wait ~60 s for provisioning

### 1b — Run the SQL setup
1. In your project dashboard, open **SQL Editor → New query**
2. Paste the contents of **`supabase-setup.sql`** (in this repo root)
3. Click **Run** — this creates the `profiles` table, RLS policies, avatar bucket, and the auto-profile trigger

### 1c — Copy your API keys
Go to **Project Settings → API**:

| Variable | Where to find it |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | "Project URL" |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | "anon public" key |

Paste them into `artifacts/workout-app/lib/supabase.ts` **or** add them as environment variables in Vercel / Cloudflare (recommended — never commit secrets).

### 1d — Enable Email auth
**Authentication → Providers → Email** — it's on by default.  
For production, configure a custom SMTP sender under **Auth → SMTP Settings** so confirmation emails come from your own domain.

---

## 2 · Install the Supabase package

```bash
cd artifacts/workout-app
pnpm add @supabase/supabase-js
```

---

## 3 · Deploy to Vercel (easiest)

### 3a — Push to GitHub
```bash
git add .
git commit -m "Add Supabase auth + profile pictures + day picker"
git push
```

### 3b — Import on Vercel
1. Go to **https://vercel.com** → **Add New Project** → Import your GitHub repo
2. Set these in the **Configure Project** step:

| Setting | Value |
|---|---|
| **Framework Preset** | Other |
| **Root Directory** | `artifacts/workout-app` |
| **Build Command** | `pnpm expo export --platform web` |
| **Output Directory** | `dist` |

3. Under **Environment Variables**, add:
   - `EXPO_PUBLIC_SUPABASE_URL` → your project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` → your anon key

4. Click **Deploy** — done! Vercel gives you a `*.vercel.app` URL instantly.

### 3c — Custom domain (optional)
Vercel Dashboard → your project → **Settings → Domains** → add your domain and follow the DNS instructions.

---

## 4 · Deploy to Cloudflare Pages (alternative)

### 4a — Connect repo
1. Go to **Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git**
2. Select your GitHub repo

### 4b — Build settings

| Setting | Value |
|---|---|
| **Framework preset** | None |
| **Build command** | `cd artifacts/workout-app && pnpm install && pnpm expo export --platform web` |
| **Build output directory** | `artifacts/workout-app/dist` |

### 4c — Environment variables
Under **Settings → Environment variables → Production**:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Click **Save and Deploy**.

> **Vercel vs Cloudflare Pages:**  
> Both are free for personal projects. Vercel is simpler for Expo web apps (better monorepo support). Cloudflare Pages has faster global edge delivery and no function cold-starts if you later add serverless functions.

---

## 5 · Local development

```bash
# Install deps
cd artifacts/workout-app
pnpm install

# Create a local .env file (git-ignored)
echo 'EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co' > .env.local
echo 'EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY' >> .env.local

# Run on web
pnpm expo start --web

# Run on iOS simulator
pnpm expo start --ios
```

---

## 6 · What was changed in the code

| File | What changed |
|---|---|
| `lib/supabase.ts` | *(new)* Supabase client singleton |
| `context/AuthContext.tsx` | *(new)* Auth state, sign-in/up/out, avatar upload |
| `app/_layout.tsx` | Wraps app in `AuthProvider`; redirects unauthenticated users to sign-in |
| `app/auth/sign-in.tsx` | *(new)* Sign-in screen |
| `app/auth/sign-up.tsx` | *(new)* Sign-up screen |
| `app/(tabs)/profile.tsx` | Avatar with upload, editable display name, sign-out button |
| `app/plan/[id].tsx` | **Fixed save bug** (persists before `router.back()`); **day-of-week toggle** replaces sequential Add Day |
| `supabase-setup.sql` | *(new)* One-click DB + storage setup script |

---

## Config Files (inline)

### app.json
```json
{
  "expo": {
    "name": "Pyra",
    "slug": "workout-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "pyra",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F0F0F"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.pyra.workouttracker"
    },
    "android": {
      "backgroundColor": "#0F0F0F",
      "package": "com.pyra.workouttracker"
    },
    "web": {
      "favicon": "./assets/images/icon.png"
    },
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://replit.com/"
        }
      ],
      "expo-font",
      "expo-web-browser",
      "expo-sqlite"
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    }
  }
}
```

### tsconfig.json
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo",
    "baseUrl": ".",
    "strict": true,
    "paths": {
      "@/*": [
        "./*"
      ]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ],
  "references": [
    {
      "path": "../../lib/api-client-react"
    }
  ]
}
```

### babel.config.js
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
  };
};
```

### metro.config.js
```js
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
```
