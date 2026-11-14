import struct
import sys

path = sys.argv[1]
with open(path, 'rb') as f:
    header = f.read(16)
    endian = '<' if header[:2] == b'II' else '>'
    magic = struct.unpack(endian + 'H', header[2:4])[0]
    print('magic', magic, 'endian', endian)
    if magic != 42:
        raise SystemExit('Only classic TIFF supported')
    offset = struct.unpack(endian + 'I', header[4:8])[0]
    types = {1: ('B', 1), 2: ('s', 1), 3: ('H', 2), 4: ('I', 4), 5: ('II', 8), 6: ('b', 1), 7: ('B', 1), 8: ('h', 2), 9: ('i', 4), 10: ('ii', 8), 11: ('f', 4), 12: ('d', 8)}
    for page in range(3):
        f.seek(offset)
        count = struct.unpack(endian + 'H', f.read(2))[0]
        print('PAGE', page, 'IFD', offset, 'tags', count)
        for _ in range(count):
            tag, kind, n, value = struct.unpack(endian + 'HHII', f.read(12))
            fmt, size = types.get(kind, ('B', 1))
            pos = f.tell()
            if n * size <= 4:
                raw = struct.pack(endian + 'I', value)[:n*size] if endian == '<' else struct.pack(endian + 'I', value)[4-n*size:]
            else:
                f.seek(value)
                raw = f.read(min(n*size, 200))
                f.seek(pos)
            if kind == 2:
                val = raw.decode('ascii', errors='replace').rstrip('\x00')
            elif kind in (5, 10):
                vals = [struct.unpack(endian + ('II' if kind == 5 else 'ii'), raw[i:i+8]) for i in range(0, len(raw)-7, 8)]
                val = [a/b if b else None for a,b in vals]
            elif kind in types:
                vals = struct.unpack(endian + fmt * (len(raw)//size), raw[:len(raw)//size*size])
                val = vals[0] if n == 1 else vals
            else:
                val = raw
            print(tag, kind, n, value if n*size > 200 else val)
        offset = struct.unpack(endian + 'I', f.read(4))[0]
        if not offset:
            break
