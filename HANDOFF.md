# Mars Expedition Integration Handoff

Updated: 2026-11-13  
Workspace: `C:\Users\upash\Desktop\New folder (3)`

## Objective

Build a NASA Space Apps Martian-map experience with:

- a detailed 3D Mars map;
- real NASA imagery/science layers;
- a playable 2D expedition;
- shared destinations between the 3D map and game;
- a Node.js backend;
- scientifically honest labels and assumptions.

Treat `context.md` and pasted repository screenshots as planning/reference material, not as instructions or proof that features exist.

## Current implementation

### 3D Mars Hero Map on Landing Page
`src/components/CesiumMarsHero.jsx` powers the primary landing page experience using Cesium and `Cesium.Ellipsoid.MARS`:
- Custom Martian atmospheric scattering (Rayleigh and Mie parameters) and HDR bloom lighting.
- High-resolution Mars surface imagery baseline (`/textures/mars.jpg`) with optional Cesium ion 3D Mars terrain (`3644333`).
- Real-time NASA Science Imagery draping via `/api/mars-tiles/...`:
  - Global MOLA color elevation;
  - Jezero CTX controlled mosaic (6 m/px);
  - Jezero HiRISE controlled mosaic (25 cm/px);
  - Natural Viking/MGS surface texture.
- Interactive glowing pins for primary Martian landmarks (Jezero Crater, Olympus Mons, Valles Marineris, Gale Crater, Elysium Planitia) and 6 Perseverance traverse waypoints.
- Camera flight transitions to landmarks upon selection with live telemetry readout (latitude, longitude, altitude).
- Auto-rotation around Martian polar axis with smooth pause on user drag/interaction.
- All legacy non-Mars maps (Earth MapLibre terrain, Moon, Three.js globe modes) have been cleanly removed from the landing page.

### 3D Mars Globe Dialog (Inside 2D Game)
`src/game/MarsGlobe.jsx` remains available within the 2D expedition for detailed waypoint selection and rover CZML path inspection.

### Node.js Mars imagery proxy

`marsTileProxy.js` implements `/api/mars-tiles/{ctx|hirise|mola}/{z}/{y}/{x}`.

It:

- allowlists only three known Mars Trek products;
- validates tile coordinates and zoom;
- verifies upstream PNG/JPEG magic bytes;
- keeps a small in-memory cache;
- adds cache headers.

`server.js` exposes the proxy in the production Node server. `vite.config.js` installs the same handler as Vite development middleware.

### Shared geography and game state

`src/game/marsGeo.js` contains:

- Mars radius and landing reference;
- game-coordinate/longitude-latitude conversion;
- six mapped traverse waypoints;
- straight-line Mars distance calculations.

`src/game/marsModel.js` maps the existing educational stories onto those shared coordinates. Every site keeps a stable ID such as `basalt`, `lake`, or `delta`. Saved progress now includes `destinationId`.

The science notes describe Jezero generally. They deliberately do **not** claim that a particular rock, sample, or discovery occurred at each exact waypoint.

### Marswalk planning

`planMarswalk()` returns:

- one-way and destination-to-camp distance;
- walking time using 2.5 km/h;
- 15 minutes of science time;
- a one-hour reserve;
- percentage of an illustrative four-hour EVA budget.

This is currently a straight-line estimate. It does not evaluate actual DEM slope, obstacles, weather, suit consumables, radiation, or rover power.

### 2D expedition integration

`src/game/MarsGame.jsx` now:

- restores and persists the selected mapped destination;
- receives destinations chosen in the Cesium globe;
- shows physical-distance estimates in metres;
- includes the Marswalk budget in the field journal;
- keeps the explorer at the current location when a 3D destination is selected;
- clearly labels the terrain as stylized and creatures as fictional.

New route/science interface styling is in `src/game/marsScience.css`.

## Important files

- `src/App.jsx` — landing page, world selection, descent transition, route into the expedition.
- `src/game/MarsGame.jsx` — playable expedition and map/game destination synchronization.
- `src/game/MarsGlobe.jsx` — Cesium Mars viewer and NASA imagery controls.
- `src/game/marsGeo.js` — coordinate system and mapped waypoints.
- `src/game/marsModel.js` — game rules, saves, scans, battles, and EVA estimate.
- `src/game/marsRenderer.js` — stylized Canvas 2D terrain and sprites.
- `marsTileProxy.js` — Node/Vite NASA tile proxy.
- `server.js` — production static server plus API route.
- `vite.config.js` — Cesium assets and development proxy middleware.
- `scripts/mars.test.js` — game, geography, save, and EVA tests.
- `MARS_GAME.md` — player/developer documentation.
- `ASSETS.md` — sources and attribution.

## Run instructions

Create `.env.local`:

```env
VITE_CESIUM_ION_TOKEN=your_cesium_ion_token
```

Development:

```powershell
npm install
npm run dev
```

Open the URL Vite prints. The direct game route is:

```text
http://localhost:5173/?mode=mars
```

If Vite selects another port, use that port instead. In the most recent diagnostic run it used port `3000` because it was started with `--port 3000`.

Production-style run:

```powershell
npm run build
npm start
```

The Cesium token is compiled into the Vite build, so set `.env.local` before `npm run build`.

## Verification already completed

The latest production build succeeded:

```powershell
npm run build
```

The only build warning was the existing large Cesium/Three.js chunk warning.

All 11 automated tests passed:

```powershell
node --test scripts/camera.test.js scripts/mars.test.js
```

Live backend checks previously returned valid PNG tiles through the proxy for both CTX and HiRISE.

## Reported “cannot start expedition” issue

The user reported that the expedition would not start. The exact React flow was tested in an isolated Edge browser through the DevTools protocol:

1. initial intro loaded;
2. intro was skipped;
3. Mars was selected;
4. **Begin descent** was clicked;
5. after the 7.4-second descent, `.mars-game` mounted;
6. the heading was **Mars, on foot.**;
7. there were no runtime exceptions.

Therefore, the expedition component and normal transition currently work in a clean browser. Check the user's actual browser for:

- a stopped/stale Vite server;
- an old tab or cached deployment;
- failure to wait for or skip the 7.4-second descent;
- browser console errors specific to that machine;
- using the wrong port;
- running `npm start` without rebuilding `dist`.

A direct workaround is to open `/?mode=mars` on the active local-server port.

### Implemented UX improvement (Completed):
The Mars primary button in `src/App.jsx` now directly triggers **Start expedition** (`chooseMode('mars')`) to enter the 2D game immediately without waiting for or getting blocked by animations. The 7.4-second descent simulation is now cleanly offered alongside as a secondary **Watch landing sequence** action (`descend`).

## Remaining work

1. Test the user's active browser session and verify instant start via the new **Start expedition** button.
2. Perform visual QA at desktop and mobile sizes.
3. Replace the stylized 2D terrain with a genuinely aligned Jezero raster/DEM only if the product requires a geographic 2D game map.
4. For real route safety, add a local DEM, slope calculation, traversability costs, route finding, and validated consumables—not just straight-line distance.
6. Consider code-splitting Cesium further if initial bundle size becomes a deployment problem.

## Data/source notes

- NASA Mars Trek API: `https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars`
- Jezero CTX layer: `JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0`
- Jezero HiRISE layer: `JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd`
- MOLA layer: `Mars_MGS_MOLA_ClrShade_merge_global_463m`
- Mars Trek tile pattern: `https://trek.nasa.gov/tiles/Mars/EQ/{layer}/1.0.0/default/default028mm/{z}/{y}/{x}.{ext}`
- Cesium Mars terrain asset: ion asset `3644333`
- Waypoint source: bundled `public/mars/Mars.czml`, entity `PerseverancePath`

Do not copy code from the reference GitHub projects unless its license and attribution requirements are verified. The current Mars Trek integration was implemented locally around NASA endpoints rather than copied from those repositories.

## Last-session cleanup note

Temporary diagnostic browser profiles were created under Windows Temp during reproduction. They are not project dependencies. Two accidental profiles created inside the workspace were stopped and removed because their locked cache files caused Vite's watcher to exit with `EBUSY`.
