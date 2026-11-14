# Orbital Mars maps and markers

A focused, standalone extraction of the Mars map surfaces:

- **Regional 2D Jezero map:** pan and zoom, switch imagery/relief/geology, inspect named landmarks, and view Perseverance's recorded traverse.
- **Game map:** explore a stylized terrain map with a closer camera, circular local minimap, pulsing rover quest diamond, and a landing site marker toggle. The overview keeps the full traverse available as a subdued trace.

## Run

```sh
npm install
npm run dev
```

Open `http://localhost:5173`. For the production build, run `npm run build` followed by `npm start`.

## Data and scope

The Perseverance traverse snapshot is in `src/data/marsRoutes.json`, sourced from NASA MMGIS. The regional relief is the local 20 m CTX DEM image in `public/jezero`; live imagery tiles are proxied from NASA Mars Trek by `marsTileProxy.js`. The USGS SIM 3464 overlay is a regional geology layer. The game terrain, wind, and creatures are illustrative. The rover diamond points to the latest position in the bundled route snapshot; consult the [NASA live location map](https://science.nasa.gov/mission/mars-2020-perseverance/location-map/) for newer rover drives.
