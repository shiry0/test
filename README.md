# Orbital — Space Apps concept demo

A cinematic, working test website combining the four requested approaches in one React app.

## Run locally

```sh
npm install
npm run dev
```

Open **http://localhost:5173**. On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`.

```sh
npm run build
npm run preview
```

For the Node.js production server, run `npm run build` then `npm start` and open **http://localhost:3000**. Set `PORT` to change the port.

## Explore

- **Rocket intro:** a replayable 3D rocket sequence. Begin descent on Earth transitions into terrain. Skip intro is always available.
- **Orbital view:** textured Earth, Moon, and Mars, atmosphere, clouds, stars, and orbit paths in React Three Fiber.
- **3D terrain:** MapLibre GL with satellite imagery and real DEM elevation. Choose the Himalayas, Alps, or Grand Canyon and adjust terrain height.
- **Simple globe:** a separate imperative Three.js implementation for a simpler comparison.
- **R3F demo:** the planet scene adds an orbiting 3D rocket and surface wireframe.
- **Mars expedition:** the site opens on the interactive Mars globe. Select **Start expedition** to enter the original illustrated 2D game. Walk, scan six geology sites, encounter three original fictional creature types, earn research, upgrade your scanner, and activate the survey beacon. See [MARS_GAME.md](MARS_GAME.md) for the prototype loop and scientific framing.
- **Mars imagery:** choose a point of interest on the landing globe to view regional CTX imagery where available. Jezero, Gale, and Elysium also offer localized HiRISE imagery. The Syrtis Major point has a NASA image in its information panel, but no verified regional high-resolution draping layer in this demo. MOLA elevation and the natural surface remain available globally. Detailed imagery requires an internet connection.
- Drag to rotate, scroll/pinch to zoom, pause rotation, reset, and enter fullscreen. Keys 1/2/3 switch worlds.
- Ambient sound is optional and starts only when enabled. Reduced-motion preferences are respected.

## Demo scope

The landing hero has direct links to visit Perseverance or Curiosity and to trace Mark Watney’s explicitly fictional *The Martian* journey. The **Rovers & Stories** selector also switches routes. Each rover’s panel includes an interactive 3D model preview, **Fly to rover on Mars**, and **Fit full rover route**. Perseverance’s path appears on the 2D Jezero map. The bundled rover routes are a NASA MMGIS snapshot downloaded 14 Nov 2026 (Perseverance through sol 2022; Curiosity through sol 5073), not live positions. The side panels link to NASA’s live rover maps. Curiosity’s linked 2019 proposed Mount Sharp route is presented as additional context, separate from its driven path. To refresh the bundled snapshot, download the four NASA MMGIS files named in `scripts/data/rovers/`, then run `node scripts/buildRoverRoutes.mjs`.

The Jezero Crater point of interest opens a dedicated 2D regional map through **Open detailed 2D terrain map**. It labels Jezero, three valleys, Nili Planum, and nearby named craters. Drag or use arrow keys to pan; scroll or use the buttons to zoom. **Go to 1 m detail** centers the view within the HiRISE mosaic at approximately 1 m per screen pixel. NASA Mars Trek CTX and HiRISE tiles provide orbital detail where those mosaics cover the map; the user-supplied 20 m CTX DEM provides the locally bundled elevation layer. The 20 m DEM itself cannot supply 1 m detail. Orbital tiles require an internet connection. The on-foot game has its separate illustrated slope and crater terrain.

**USGS SIM 3464 geology:** The landing globe, optional expedition 3D map, and 2D Jezero map can display a local, transparent overlay derived from the `GeoUnits_v1` polygons in the [official USGS database](https://pubs.usgs.gov/publication/sim3464). The colors are a website palette, not the USGS sheet symbology. The source map is 1:75,000. Its readme warns of roughly 100–200 m random offsets from the later rover operations CTX mosaic, so polygon lookups are regional context rather than a verified outcrop, mineral, age, or sample identification. Scanning a waypoint stores the mapped unit at the player's position and links to the publication. Wind, dust, and suit-power effects in the game are illustrative simulations, not live MEDA measurements.

The checked-in overlay image and compact local polygon lookup were generated with `scripts/build-sim3464.py`. To rebuild them, download `sim3464_database.zip` from the USGS publication, extract `sim3464_JezeroNili_FINAL/Geodatabase/Nili.gdb` under `.gis-source/`, install Python packages `pyogrio shapely pyproj pillow`, and run `python scripts/build-sim3464.py`.

This is an independent prototype for a NASA Space Apps project. It does not use live mission telemetry. Rocket altitude, lighting, orbit paths, and planet display scales are illustrative. Planet facts are rounded, and rotation periods are sidereal. The globe textures and fonts are local files; Earth terrain and the optional Cesium Mars view require an internet connection. The playable 2D expedition needs no account or API key.

No pre-existing website was supplied. Components are separated under `src/components/` for later integration into your real website.

## Assets and attribution

See [ASSETS.md](ASSETS.md). Map attribution is displayed in the terrain view. NASA Science links are available in Field notes.

## Verification

The production build passes and the localhost server responds with HTTP 200. npm reports zero dependency vulnerabilities after upgrading MapLibre. Browser inspection was unavailable in this session, so desktop/mobile layout and WebGL rendering still need a visual check on your device.

Run gameplay and camera tests with `node --test scripts/camera.test.js scripts/mars.test.js`. These cover zoom direction, bounded walking, discovery proximity and duplicate rewards, scanner range, random spawns, combat, and saved-progress validation. Visual review remains pending because screenshots could not be captured.
