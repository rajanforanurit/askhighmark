# Ask Property Data — Power BI Custom Visual

Conversational + quick-action visual for exploring `Reba_Product`: search a
property, find nearby properties on a relative-position map, and see a
side-by-side comparison table. Talks to the Property Intelligence API /
Ask AI backend built earlier.

## What's implemented right now

- **Quick action: "Find Nearby Properties"** — click it, type a property name
  when asked, and the visual calls the backend to resolve the name, fetch its
  nearest properties, and render a map + comparison table.
- **Free-text chat input** — anything typed (outside the quick-action flow)
  is sent to the backend's `/ask-ai` endpoint. The AI classifies intent
  (search / nearest / compare) and the visual renders whatever comes back —
  a map+table for a resolved property, a plain list for a search, or a
  comparison table for a multi-property compare.
- **Map** — a self-contained SVG "relative position" map (not a real
  basemap). No external tile server, no map API key, no extra domain
  whitelisting needed. Good enough to show spatial relationships; swap for a
  real tile provider later if you want actual streets/geography.
- **Footer** — "Powered by Anurit Innovation", editable in the Format pane.

## Project structure

```
AskPropDataVis/
├── src/
│   ├── visual.ts              Power BI entry point
│   ├── settings.ts            Parsed runtime settings (plain values)
│   ├── formattingModel.ts     Format pane card definitions
│   ├── api.ts                 Backend fetch calls
│   ├── App.tsx                Root React component / chat orchestration
│   └── components/
│       ├── Header.tsx
│       ├── Footer.tsx
│       ├── QuickActions.tsx
│       ├── ChatInputBar.tsx
│       ├── ChatMessage.tsx
│       ├── PropertyMap.tsx
│       └── PropertyComparison.tsx
├── capabilities.json
├── pbiviz.json
├── package.json
├── tsconfig.json
├── style/visual.less
└── assets/icon.png
```

## Setup

```bash
cd AskPropDataVis
npm install
npm run start
```

Then add the visual to a Power BI report (Developer visual in Power BI
Desktop, pointing at `https://localhost:8080`).

## Configuring the backend URL and API key

In the Format pane, under **Backend Configuration**:
- **Backend API URL** — defaults to your deployed pipeline:
  `https://askpropertydata-grheekb4hpenfsew.southcentralus-01.azurewebsites.net`
- **API Key** — defaults to `123456` as requested. **Replace this before any
  real deployment** — see the security note below.

If you point the visual at a *different* backend domain, you must also add
that domain to the `privileges` → `WebAccess` → `parameters` array in
`capabilities.json` and repackage. Power BI enforces this at the manifest
level — changing the URL in the Format pane alone will not unblock a new
domain; the sandbox blocks any fetch to a domain not explicitly listed here,
regardless of what CORS says.

## Required backend change: enable CORS

Your FastAPI backend currently has no CORS configuration. Power BI loads
custom visuals inside a sandboxed iframe with its own origin, so every
`fetch` call this visual makes will be blocked by the browser before it
reaches your API, until you add:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten this to Power BI's actual origins before production
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

Add this near the top of `main.py`, right after `app = FastAPI(...)`, then
redeploy. Without it, the visual will show "Something went wrong" on every
request even though the backend itself is healthy.

## Security notes before production

- **Rotate the API key** away from `123456`. Right now the backend doesn't
  actually check this header (see `main.py` from the earlier pipeline) — add
  a dependency that validates `x-api-key` against an expected value stored in
  an environment variable, and reject requests that don't match.
- **Tighten `allow_origins`** in the CORS config above instead of `"*"` once
  you know which Power BI domains will host this report.
- The visual sends the API key in both `x-api-key` and `Authorization:
  Bearer` headers so it's compatible with whatever auth scheme you land on —
  drop whichever one you don't end up using.

## Extending beyond "nearest"

The chat input already round-trips through `/ask-ai`, which supports
`search`, `nearest`, and `compare` intents on the backend. The map only
renders when the response includes a `target` with coordinates — a
multi-property `compare` response without a `nearest` search will show the
comparison table only (no map), since there's no single center point to plot
around. If you want the map to plot multiple independently-compared
properties too (not just one target + its nearest), that's a small addition
to `PropertyMap.tsx` — happy to add it once you're ready to expose "Compare
Properties" as its own quick action.
