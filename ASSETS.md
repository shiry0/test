# Asset sources

The optional 3D Mars view includes `public/mars/Mars.czml`, `public/mars/MarsPointsOfInterest.geojson`, and three GLB rover models copied from [CesiumGS/cesium Apps/SampleData](https://github.com/CesiumGS/cesium/tree/main/Apps/SampleData). Its terrain uses Cesium ion asset `3644333` and requires a token with access.

Selected imagery comes from [NASA Mars Trek WMTS](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars): MOLA elevation, seven regional CTX mosaics, and three regional HiRISE mosaics. Their exact layer IDs, bounds, and verified zoom limits are in `src/data/marsImagery.js`. `marsTileProxy.js` relays only those allowlisted products and verifies that the upstream response is a PNG or JPEG. HiRISE coverage is local, not planet-wide; the Syrtis Major point has no verified regional CTX or HiRISE mosaic in this selection. The point-of-interest panels load NASA images from the source URLs recorded in `src/data/marsLandmarks.js`, with the bundled Mars texture as a fallback. The six game waypoints are sampled from `PerseverancePath` in the bundled CZML; their educational science notes are not claims about discoveries at those exact coordinates.

All planet surfaces are equirectangular texture maps applied to actual 3D sphere meshes. No generated artwork is used.

The Mars 2D game uses an original procedural topographic map and hand-authored pixel sprite patterns drawn by Canvas 2D (`src/game/marsRenderer.js`). It contains no Pokémon assets, third-party creature artwork, or geographic Mars basemap. Its science note sources are recorded with each site in `src/game/marsModel.js`.

| Local asset | Source |
| --- | --- |
| `public/jezero/jezero-relief.png` | Shaded relief derived from the user-supplied `M20_JezeroCrater_CTXDEM_20m.tif` (20 m CTX elevation grid). Conversion: `scripts/jezero_dem.py`; georeferencing: `src/data/jezeroDem.json`. Elevation colors and hillshade are visualization, not optical imagery. The original TIFF is not bundled. |
| `src/data/marsRoutes.json` | Simplified Perseverance and Curiosity traverse geometry from NASA MMGIS (`scripts/data/rovers/`), downloaded 14 Nov 2026. The fictional Mark Watney route is extracted from the supplied Cesium `public/mars/Mars.czml`. Generated with `scripts/buildRoverRoutes.mjs`. |
| `public/mars/models/Mars/*.glb` | Rover model files from the supplied Cesium Mars sample. Curiosity and Perseverance are displayed at the latest waypoint in the bundled route snapshot. |
| `public/textures/earth.jpg` | https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg |
| `public/textures/clouds.png` | https://threejs.org/examples/textures/planets/earth_clouds_1024.png |
| `public/textures/moon.jpg` | https://threejs.org/examples/textures/planets/moon_1024.jpg |
| `public/textures/mars.jpg` | https://www.solarsystemscope.com/textures/download/2k_mars.jpg |

Three.js example assets are credited to their respective original authors; the repository's code license should not be assumed to cover all third-party imagery. Solar System Scope textures are published under CC BY 4.0; credit: Solar System Scope, https://www.solarsystemscope.com/textures/ .

Fonts: Manrope (Mikhail Sharanda and contributors) and Barlow Condensed (Jeremy Tribby), sourced from Google Fonts. Both use the SIL Open Font License. License text and attribution are included in `public/fonts/OFL-*.txt`.

Icons: Lucide, ISC license (via lucide-react).

Terrain runtime services:

- Satellite imagery: Esri World Imagery; provider attribution appears on the map. https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer
- DEM: Mapterhorn, 512 px Terrarium tiles. https://mapterhorn.com/attribution/ and https://mapterhorn.com/data-access/ . Its endpoint was checked for browser-compatible CORS response headers.

Facts and further reading:

- https://science.nasa.gov/earth/facts/
- https://science.nasa.gov/moon/facts/
- https://science.nasa.gov/mars/facts/
- https://nssdc.gsfc.nasa.gov/planetary/factsheet/

Mean diameter, approximate surface gravity, and rotation are rounded educational values. Solar day length differs from sidereal rotation, especially on the Moon.
