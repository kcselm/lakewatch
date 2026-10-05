"""The cormorant's flight wing: laid flat and straight out from each shoulder at rest, as the pelican's is; the game opens
it to dry (PoseState.dry) and, in round 2, to fly.

The half-span runs 0.56 m from the shoulder (the research's 1.20 m span less the body's width), its chord from the
research's planform (wing area 0.18 m², aspect ratio 8: about 0.17 m at the root, rounded at the tip), bending at the
wrist, 0.45 of the way out. The game's part is a thin plate (`doccor.flightL/R`); laid on it for the bake are the
primaries and secondaries, black-brown, and the coverts over their bases (`doccor.remigesL/R`).

build.py runs it after body.py: build() makes them; paint(version) colours them. Blender coordinates, as body.py's.
"""
import math
import random
import bpy
import bmesh
from mathutils import Vector
from palette import PALETTE
import feathers

SHOULDER = Vector((0.075, 0.045, 0.058))  # the left shoulder; the right mirrors y
SPAN = 0.56
WRIST = 0.45
# [s along the half-span from the shoulder (0) to the tip (1), the leading edge and the trailing edge there, metres ahead
# of the shoulder]: broad and nearly straight-edged to the wrist, the hand narrowing to a rounded tip
OUTLINE = [(0.0, 0.02, -0.15), (0.45, 0.035, -0.14), (0.75, 0.015, -0.125), (0.92, -0.012, -0.10), (1.0, -0.05, -0.07)]
NS, NC = 16, 4
THICK = 0.003


def edges(s):
    for (s0, l0, t0), (s1, l1, t1) in zip(OUTLINE, OUTLINE[1:]):
        if s <= s1:
            k = (s - s0) / (s1 - s0)
            return l0 + (l1 - l0) * k, t0 + (t1 - t0) * k
    return OUTLINE[-1][1:]


def at(s, c, side):
    """The point s along the span and c (0 leading .. 1 trailing) across the chord, on the left (+1) or right (-1) wing."""
    lead, trail = edges(s)
    return Vector((SHOULDER.x + lead + (trail - lead) * c, side * (SHOULDER.y + s * SPAN), SHOULDER.z))


def plate(side):
    name = 'doccor.flight' + ('L' if side > 0 else 'R')
    bm = bmesh.new()
    # spanwise stations closer at the wrist, where the wing bends
    ss = sorted(set([i / NS for i in range(NS + 1)] + [WRIST - 0.03, WRIST + 0.03]))
    grid = [[bm.verts.new(at(s, j / NC, side)) for j in range(NC + 1)] for s in ss]
    for i in range(len(ss) - 1):
        for j in range(NC):
            f = [grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]]
            bm.faces.new(f if side < 0 else list(reversed(f)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # the upper side faces up
    if sum(f.normal.z for f in bm.faces) < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    so = ob.modifiers.new('thick', 'SOLIDIFY')
    so.thickness = THICK
    so.offset = -1
    return ob


def remiges(side):
    """The flight feathers and coverts laid on the plate's upper side, for the bake."""
    name = 'doccor.remiges' + ('L' if side > 0 else 'R')
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('UVMap')
    up = Vector((0, 0, 1))
    # secondaries: straight back from the inner wing's leading third, overlapping, each to past the trailing edge
    for k in range(15):
        s = 0.03 + (WRIST - 0.05) * k / 14
        base = at(s, 0.3, side)
        lead, trail = edges(s)
        feathers.card(bm, uv, base + up * (0.0004 + 0.00005 * k), up, Vector((-1, 0, 0)), (trail - lead) * 0.75, 0.0004, ratio=0.22)
    # primaries: from the hand's leading third, fanning from back to nearly along the span at the tip
    for k in range(10):
        s = WRIST + (1 - WRIST) * k / 9.5
        base = at(s, 0.25, side)
        turn = math.radians(10 + 60 * k / 9)
        back = Vector((-math.cos(turn), side * math.sin(turn), 0))
        lead, trail = edges(min(s, 0.98))
        feathers.card(bm, uv, base + up * (0.0008 + 0.0001 * k), up, back, max(0.06, (trail - lead) * 0.85 + 0.02 * k / 9), 0.0004, ratio=0.2)
    # coverts: three rows over the remiges' bases, small near the leading edge
    random.seed(11 if side > 0 else 12)
    for row, (c, length) in enumerate([(0.05, 0.022), (0.15, 0.03), (0.28, 0.04)]):
        n = int(SPAN * 0.8 / (length * 0.55))
        for k in range(n):
            s = (k + 0.5 * (row % 2)) / n * 0.95
            base = at(s, c, side)
            feathers.card(bm, uv, base + up * (0.0016 + 0.0003 * (3 - row)), up, Vector((-1, side * 0.15 * s, 0)), length * random.uniform(0.9, 1.1), 0.0004)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def joints(side):
    """The shoulder and the wrist (on the line through the shoulder the wing hinges along), for the rig, on the left (+1) or right (-1)."""
    return Vector((SHOULDER.x, side * SHOULDER.y, SHOULDER.z)), at(WRIST, 0.2, side)


def tip(side):
    """The wing's tip, for mark_flightTip."""
    return at(1.0, 0.5, side)


def build():
    for o in [o for o in bpy.data.objects if o.name.startswith(('doccor.flight', 'doccor.remiges'))]:
        bpy.data.objects.remove(o, do_unlink=True)
    return [plate(1), plate(-1)], [remiges(1), remiges(-1)]


def paint(version):
    C = PALETTE[version]
    plate_mat = bpy.data.materials.get('doccor.flightPlate') or bpy.data.materials.new('doccor.flightPlate')
    plate_mat.use_nodes = True
    b = next(n for n in plate_mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (*C['flight'], 1)
    b.inputs['Roughness'].default_value = 0.6
    remex = feathers.feather_material(version, name='doccor.remex', centre_color=tuple(x * 1.6 for x in C['flight']), edge_color=C['flight'])
    covert = feathers.feather_material(version, name='doccor.covert')
    for side in 'LR':
        p = bpy.data.objects['doccor.flight' + side]
        p.data.materials.clear(); p.data.materials.append(plate_mat)
        r = bpy.data.objects['doccor.remiges' + side]
        r.data.materials.clear(); r.data.materials.append(remex); r.data.materials.append(covert)
        # the coverts (laid last, after the 25 remiges, 48 faces each) take the covert material
        for i, poly in enumerate(r.data.polygons):
            poly.material_index = 1 if i >= 25 * 48 else 0
