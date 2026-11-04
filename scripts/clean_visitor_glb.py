"""Remove the disconnected staff geometry from the licensed CC0 visitor GLB.

All original skeleton nodes, animation tracks, textures and joint weights stay intact.
This is a build-time geometry cleanup, not a new derivative asset distributed separately.
Raises if the source structure changes, preventing accidental damage.
"""
import json
import struct
import sys
from collections import defaultdict

path = sys.argv[1] if len(sys.argv) > 1 else "assets/visitor-rig.glb"
data = bytearray(open(path, "rb").read())
if data[:4] != b"glTF" or struct.unpack_from("<I", data, 4)[0] != 2:
    raise SystemExit("Expected a GLB 2.0 asset")
json_len, json_tag = struct.unpack_from("<II", data, 12)
if json_tag != 0x4E4F534A:
    raise SystemExit("Missing GLB JSON chunk")
doc = json.loads(data[20:20 + json_len].decode("utf-8"))
binary_offset = 20 + json_len + 8
primitive = doc["meshes"][0]["primitives"][0]
positions = doc["accessors"][primitive["attributes"]["POSITION"]]
indices = doc["accessors"][primitive["indices"]]
if positions["componentType"] != 5126 or indices["componentType"] != 5123 or positions["count"] < 4000:
    raise SystemExit("Source topology changed; accessory cleanup refused")
vview = doc["bufferViews"][positions["bufferView"]]
iview = doc["bufferViews"][indices["bufferView"]]
pos_offset = binary_offset + vview.get("byteOffset", 0) + positions.get("byteOffset", 0)
stride = vview.get("byteStride", 12)
idx_offset = binary_offset + iview.get("byteOffset", 0) + indices.get("byteOffset", 0)
verts = [struct.unpack_from("<fff", data, pos_offset + i * stride) for i in range(positions["count"])]
inds = [struct.unpack_from("<H", data, idx_offset + 2 * i)[0] for i in range(indices["count"])]
if len(inds) % 3:
    raise SystemExit("Unexpected triangle index count")
parent = list(range(len(verts)))

def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x

def merge(a, b):
    ra, rb = find(a), find(b)
    if ra != rb:
        parent[ra] = rb

for k in range(0, len(inds), 3):
    a, b, c = inds[k:k + 3]
    merge(a, b)
    merge(b, c)

matching_coords = {}
for i, (x, y, z) in enumerate(verts):
    key = (round(x, 5), round(y, 5), round(z, 5))
    if key in matching_coords:
        merge(i, matching_coords[key])
    else:
        matching_coords[key] = i

components = defaultdict(list)
for i in range(len(verts)):
    components[find(i)].append(i)

accessory = set()
for members in components.values():
    xs = [verts[i][0] for i in members]
    ys = [verts[i][1] for i in members]
    center_x = sum(xs) / len(xs)
    center_y = sum(ys) / len(ys)
    if center_x < -0.05 and 0.025 < center_y < 0.08 and max(xs) - min(xs) < 0.018 and max(ys) - min(ys) < 0.036:
        accessory.update(members)

removed = 0
for k in range(0, len(inds), 3):
    a, b, c = inds[k:k + 3]
    if a in accessory and b in accessory and c in accessory:
        struct.pack_into("<HHH", data, idx_offset + k * 2, a, a, a)
        removed += 1
if not 450 <= removed <= 600:
    raise SystemExit(f"Unexpected accessory topology: {removed} triangles; GLB unchanged")
with open(path, "wb") as f:
    f.write(data)
print(f"Visitor GLB cleaned: {removed} staff triangles suppressed; skeleton and animations retained")
