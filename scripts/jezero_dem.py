"""Render the supplied 20 m Jezero GeoTIFF as a navigable shaded-relief PNG.

Uses only Python's standard library. TIFF metadata is checked against the source
product so an unrelated raster cannot quietly produce a mislabeled map.
"""
from array import array
from math import atan2, cos, degrees, isfinite, pi, sin, sqrt
from pathlib import Path
import json
import struct
import sys
import zlib

SOURCE = Path(sys.argv[1])
DEST = Path('public/jezero')
WIDTH, HEIGHT = 4456, 5067
NODATA = -3.4028234663852886e38
PIXEL_METRES = 20
ORIGIN_X, ORIGIN_Y = 4328999.999999998, 1143420.0000000028
RADIUS = 3396190.0
STANDARD_PARALLEL_DEGREES = 18.4663


def chunk(tag, data):
    return struct.pack('!I', len(data)) + tag + data + struct.pack('!I', zlib.crc32(tag + data))


def write_png(path, rows, width, height):
    compressor = zlib.compressobj(6)
    with path.open('wb') as out:
        out.write(b'\x89PNG\r\n\x1a\n')
        out.write(chunk(b'IHDR', struct.pack('!IIBBBBB', width, height, 8, 2, 0, 0, 0)))
        pending = bytearray()
        for row in rows:
            pending.extend(compressor.compress(b'\0' + row))
            if len(pending) > 65536:
                out.write(chunk(b'IDAT', pending))
                pending.clear()
        pending.extend(compressor.flush())
        if pending:
            out.write(chunk(b'IDAT', pending))
        out.write(chunk(b'IEND', b''))


def read_dem():
    with SOURCE.open('rb') as source:
        if source.read(4) != b'II*\0':
            raise ValueError('Expected a little-endian classic TIFF')
        source.seek(8)
        n = struct.unpack('<H', source.read(2))[0]
        tags = {}
        for _ in range(n):
            tag, kind, count, value = struct.unpack('<HHII', source.read(12))
            tags[tag] = (kind, count, value)
        assert tags[256][2] == WIDTH and tags[257][2] == HEIGHT
        assert tags[259][2] == 1 and tags[339][2] == 3
        kind, count, offsets_pos = tags[273]
        source.seek(offsets_pos)
        offsets = struct.unpack(f'<{count}I', source.read(count * 4))
        if len(offsets) != HEIGHT:
            raise ValueError('Expected one uncompressed row per TIFF strip')
        rows = []
        for offset in offsets:
            source.seek(offset)
            floats = array('f')
            floats.frombytes(source.read(WIDTH * 4))
            rows.append(floats)
    return rows


def valid(v):
    return isfinite(v) and v > -100000


def lonlat(x, y):
    lat = (ORIGIN_Y - y * PIXEL_METRES) / RADIUS
    lon = (ORIGIN_X + x * PIXEL_METRES) / (RADIUS * cos(STANDARD_PARALLEL_DEGREES * pi / 180))
    return [round(degrees(lon), 6), round(degrees(lat), 6)]


def main():
    rows = read_dem()
    samples = [v for row in rows[::16] for v in row[::16] if valid(v)]
    samples.sort()
    low = samples[int(len(samples) * .02)]
    high = samples[int(len(samples) * .98)]
    print('sample stats:', len(samples), 'valid, min', samples[0], 'p2', low, 'median', samples[len(samples)//2], 'p98', high, 'max', samples[-1], flush=True)
    DEST.mkdir(parents=True, exist_ok=True)
    # North-west light, height exaggeration tuned to reveal local 20 m texture.
    lx, ly, lz = -.42, -.48, .77
    def render():
        for y in range(HEIGHT):
            above = rows[max(0, y-1)]
            center = rows[y]
            below = rows[min(HEIGHT-1, y+1)]
            pixels = bytearray(WIDTH * 3)
            for x, z in enumerate(center):
                j = x * 3
                if not valid(z):
                    pixels[j:j+3] = b'\x16\x1a\x1d'
                    continue
                left = center[max(0, x-1)]
                right = center[min(WIDTH-1, x+1)]
                up = above[x]
                down = below[x]
                dx = ((right if valid(right) else z) - (left if valid(left) else z)) / 40
                dy = ((down if valid(down) else z) - (up if valid(up) else z)) / 40
                nx, ny, nz = -dx * 3, -dy * 3, 1
                shade = max(0, (nx*lx + ny*ly + nz*lz) / sqrt(nx*nx + ny*ny + nz*nz))
                t = max(0, min(1, (z-low)/(high-low)))
                # Clay and copper contour palette, with relief as luminance.
                base = (66 + 146*t, 48 + 100*t, 41 + 65*t)
                light = .48 + .63*shade
                pixels[j] = min(255, int(base[0]*light))
                pixels[j+1] = min(255, int(base[1]*light))
                pixels[j+2] = min(255, int(base[2]*light))
            if y % 500 == 0:
                print('rendered', y, '/', HEIGHT, flush=True)
            yield pixels
    write_png(DEST/'jezero-relief.png', render(), WIDTH, HEIGHT)
    info = {
        'width': WIDTH, 'height': HEIGHT, 'pixelMetres': PIXEL_METRES,
        'originProjectedMetres': [ORIGIN_X, ORIGIN_Y], 'marsRadiusMetres': RADIUS,
        'standardParallelDegrees': STANDARD_PARALLEL_DEGREES,
        'projection': 'Mars equirectangular, sphere radius 3396190 m',
        'northWest': lonlat(0, 0), 'southEast': lonlat(WIDTH, HEIGHT),
        'elevationDisplayRangeMetres': [round(low), round(high)],
        'image': '/jezero/jezero-relief.png',
        'source': SOURCE.name,
    }
    (DEST/'metadata.json').write_text(json.dumps(info, indent=2))
    Path('src/data/jezeroDem.json').write_text(json.dumps(info, indent=2))
    print(json.dumps(info, indent=2), flush=True)


if __name__ == '__main__':
    main()
