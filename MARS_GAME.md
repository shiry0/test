# Mars expedition prototype

The first playable version extends the existing Orbital website. Select Mars and Begin descent, or open http://localhost:5173/?mode=mars directly.

## Playable loop

1. Walk using WASD, arrow keys, touch direction controls, or click-to-walk.
2. Approach one of six landmarks and press E / Scan. A discovery unlocks a NASA-linked field note and earns 10 research.
3. Approach a randomly spawning original creature and choose Encounter. Scan reveals its weak point; Pulse attacks; Shield repairs the suit and reduces damage. Retreat is always available.
4. Wins award 12–16 research. Spend 12 and then 20 research to upgrade scanner range from 100 to 155 and 215 game-map meters.
5. Scan three landmarks and defeat one creature, then return to camp and activate the survey beacon for 30 research. Continue exploring all six sites afterward.

Three fictional species are included: Dustling, Ferrite, and Glimmer. A defeat sends the explorer to camp without erasing discoveries. New creatures spawn every 12 active seconds, with at most six on the map; unengaged creatures expire after 100 active seconds.

## Scientific framing

The Canvas terrain is a stylized, compressed game surface with illustrated slopes, channels, and craters. Its six educational stations use coordinates sampled from the bundled Perseverance traverse, and the same station IDs and coordinates appear in the 3D map. The science cards describe Jezero generally and do not claim that a named rock or sample was observed at those exact waypoints. Lakebeds and river channels are dry remnants of ancient water. Creatures and combat remain fictional game mechanics.

Waypoint scans additionally record the USGS SIM 3464 `GeoUnits_v1` polygon at the explorer's position. The field journal shows its published code and name, a short map description, and a link to the USGS publication. The map is 1:75,000, and its readme notes about 100–200 m offsets from the later rover operations CTX mosaic; these results do not identify a specific hand sample, mineral measurement, or absolute age.

Animated dust, occasional dust devils, wind-assisted walking, headwind power cost, and camp recharging are illustrative gameplay. They are not a live MEDA wind feed or an EVA engineering model.

The journal shows an illustrative EVA estimate for the selected destination. It uses straight-line distance, a 2.5 km/h planning speed, 15 minutes of science activity, a four-hour capacity, and a one-hour reserve. It does not evaluate terrain slope, obstacles, suit hardware, cooling, carbon-dioxide removal, or operational safety.

## Save and reset

Progress saves locally under `orbital-mars-expedition-v1` about every two seconds and when leaving the view. No account or location permission is needed. New expedition asks before replacing that saved progress. Storage failures fall back to session-only progress. Creature positions and unfinished encounters are not saved.

## Implementation

The playable game uses a Canvas 2D renderer with the original illustrated map and pixel sprites. `marsModel.js` contains movement, discovery, EVA estimates, spawn, combat, and save validation rules. `MarsGame.jsx` handles controls and UI; `marsRenderer.js` draws the map and sprites. The optional 3D view adds Cesium, requires Cesium ion, and streams selected imagery through the Node Mars Trek proxy.

### Optional 3D Mars view

The **3D Mars** button opens the Cesium scene using ion tileset `3644333`. Its Science imagery control can drape Mars Trek's Jezero CTX mosaic (6 m/px), Jezero HiRISE mosaic (25 cm/px), MOLA elevation colours, or a local USGS SIM 3464 geologic unit overlay over the tileset. Select a game waypoint and choose **Use in 2D game** to set the same saved destination without teleporting the explorer. Rover routes, rover models, The Martian journey, and landmark controls use Cesium sample data. Opening the scene pauses walking, and closing it destroys the viewer.

To load the tileset, enter a Cesium ion access token in the view, or add this to a local `.env.local` file and restart Vite:

```dotenv
VITE_CESIUM_ION_TOKEN=your_token_here
```

The token must have access to asset `3644333`. A token entered in the view lasts only until that view closes. Vite exposes `VITE_` variables to browser code, so use a scoped public client token, not a secret server credential. The view requires WebGL and an internet connection.

For a Node.js production server, run `npm run build` followed by `npm start` (port 3000 by default, or set `PORT`). `server.js` serves the built app, textures, and Cesium worker files with their correct content types. During development, `npm run dev` uses Vite's Node.js server. Game saves remain in browser local storage.

The Sandcastle-only toolbar and navigation-help DOM code has been replaced by React controls. The sample data and models are stored under `public/mars/`; they are separate from the playable game's saved progress.

## Direction contract

THESIS: Make roaming and discovering a landscape immediately playable inside the existing cinematic world.

OWN-WORLD: Inherit Orbital typography, warm actions, and quiet dark controls. A rust-colored topographic map and restrained pixel characters carry the game surface.

STORY: Land, move, scan, encounter, upgrade, and bring a survey beacon online. Real science notes remain separate from invented creatures.

FIRST VIEWPORT: A full-width 2D map centers on the explorer; objectives sit left, an optional field journal sits right, and the contextual action stays at the bottom. Touch controls remain visible. On mobile, the journal closes after selecting a walking destination.

FORM: User-specified game extension of the existing Orbital visual system; no new visual identity or concept roll.

FINISH: Build and gameplay logic tests must pass. Browser evidence is required for a visual review; unavailable capture access must remain an explicit verification limit.

## Next design decisions

The current rewards are a testable starting point. Later choices can include equipment crafting, biome-specific creatures, knowledge challenges, a stronger expedition story, and real Mars basemaps. None of these are claimed as implemented.

## Visual extension

This bounded game surface inherits Orbital's Manrope typography, warm actions, quiet dark controls, and small softened corners. Its intentional local palette adds synthetic rust terrain (`#955f43`), warm game ink (`#f4ebd9`), dark field panels (`#172329`), and research green (`#bfd0a4`). These source CSS colors describe the expedition surface rather than replacing the root design tokens.

Native Canvas pixel sprites give the explorer and fictional creatures a restrained game character; creature palettes remain defined in the model. Field controls, journal panels, and modal overlays preserve the surrounding interface's hierarchy.

This comparison is source-based. No browser screenshots or rendered visual evidence were available; visual and responsive quality remain unverified.
