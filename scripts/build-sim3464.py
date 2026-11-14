"""Build compact web assets from the official USGS SIM 3464 file geodatabase.

Source: https://pubs.usgs.gov/sim/3464/sim3464_database.zip
Requires pyogrio, shapely, pyproj, and Pillow in the Python environment.
"""

import json
import os
import sys
from pathlib import Path

import pyogrio
from PIL import Image, ImageDraw
from pyproj import CRS, Transformer
from shapely import from_wkb
from shapely.geometry import box, mapping
from shapely.ops import transform


ROOT = Path(__file__).resolve().parents[1]
DATABASE = ROOT / ".gis-source/sim3464_JezeroNili_FINAL/Geodatabase/Nili.gdb"
IMAGE = ROOT / "public/jezero/sim3464-geology.png"
UNITS = ROOT / "src/data/sim3464Units.json"
SIZE = 4096
COLORS = {
    "Njf": "#986b82", "NHjf1": "#668a83", "NHjf2": "#9fc0a0",
    "Aeb": "#d2a76f", "Nue": "#b6a17f", "Nle": "#847e78",
    "Nnp1": "#b68573", "Nnp2": "#8a6e79", "Nrb": "#a7a9a0",
    "cr": "#d6b6a0", "ce": "#c18d77", "ci": "#bc9b84",
    "su": "#b0a498", "Hnpf": "#82918a",
}
GAME_BOUNDS = (77.40, 18.405, 77.50, 18.47)


def rings(geometry):
    polygons = [geometry] if geometry.geom_type == "Polygon" else geometry.geoms
    for polygon in polygons:
        yield polygon.exterior.coords, [hole.coords for hole in polygon.interiors]


def main():
    if not DATABASE.exists():
        raise SystemExit(f"Extract the official USGS geodatabase to {DATABASE}")
    meta, _, shapes, fields = pyogrio.raw.read(
        DATABASE, layer="GeoUnits_v1", columns=["name", "symbol"]
    )
    source = CRS.from_wkt(meta["crs"])
    mars_lonlat = CRS.from_proj4("+proj=longlat +a=3396190 +b=3396190 +no_defs")
    to_lonlat = Transformer.from_crs(source, mars_lonlat, always_xy=True).transform
    names, symbols = fields
    features = []
    for blob, name, symbol in zip(shapes, names, symbols):
        if blob is None or symbol is None:
            continue
        shape = from_wkb(blob).simplify(16, preserve_topology=True)
        if shape.is_empty:
            continue
        features.append((transform(to_lonlat, shape), str(name), str(symbol)))

    west = min(shape.bounds[0] for shape, _, _ in features)
    south = min(shape.bounds[1] for shape, _, _ in features)
    east = max(shape.bounds[2] for shape, _, _ in features)
    north = max(shape.bounds[3] for shape, _, _ in features)
    bounds = [round(v, 7) for v in (west, south, east, north)]
    image = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    def pixel(point):
        return (round((point[0] - west) / (east - west) * (SIZE - 1)),
                round((north - point[1]) / (north - south) * (SIZE - 1)))

    for shape, _, symbol in features:
        color = COLORS.get(symbol, "#928678")
        for outer, holes in rings(shape):
            draw.polygon([pixel(point) for point in outer], fill=color)
            for hole in holes:
                draw.polygon([pixel(point) for point in hole], fill=(0, 0, 0, 0))
    for shape, _, _ in features:
        for outer, _ in rings(shape):
            draw.line([pixel(point) for point in outer], fill=(35, 37, 41, 180), width=2, joint="curve")

    IMAGE.parent.mkdir(parents=True, exist_ok=True)
    image.save(IMAGE, optimize=True)
    game_box = box(*GAME_BOUNDS)
    local = []
    for shape, name, symbol in features:
        if not shape.intersects(game_box):
            continue
        clipped = shape.intersection(game_box)
        if clipped.is_empty:
            continue
        local.append({"type": "Feature", "properties": {"name": name, "symbol": symbol},
                      "geometry": mapping(clipped)})
    UNITS.parent.mkdir(parents=True, exist_ok=True)
    UNITS.write_text(json.dumps({"type": "FeatureCollection", "source": "USGS SIM 3464, Sun and Stack (2020)",
                                 "bounds": bounds, "features": local}, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {IMAGE} ({IMAGE.stat().st_size // 1024} KiB), {UNITS} ({len(local)} local polygons), bounds {bounds}")


if __name__ == "__main__":
    main()
