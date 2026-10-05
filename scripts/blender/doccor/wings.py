"""The cormorant's folded wings and tail.

Each folded wing is a grid laid in the side view and dropped onto the body along Y, standing off the surface by the
wing's thickness, so it hugs whatever shape body.py made. Past the body's end its primaries run on free, tapering to
the tip over the tail. The tail is twelve stiff rectrices fanned a little from the tail root.

build.py runs it after body.py: build() makes `doccor.wingFoldL`, `doccor.wingFoldR`, and `doccor.tail`.
"""
import math
import bpy
import bmesh
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

# the folded wing in the side view: its front (shoulder) and back (tip), its top edge along the back, its lower edge
SHOULDER_X, TIP_X = 0.110, -0.240  # the folded primaries end over the tail's root
COLS, ROWS = 40, 10
THICK = 0.004  # the wing's stand-off at its front edge; it thickens toward the back, where the feathers stack


def top_z(x):
    """The wing's upper edge: close under the back's ridge, leaving the mantle between the wings."""
    return 0.045 + 0.006 * max(0.0, min(1.0, (x + 0.1) / 0.2))


def low_z(x):
    """The wing's lower edge: a curve from the shoulder down along the flank and up to the tip."""
    u = (SHOULDER_X - x) / (SHOULDER_X - TIP_X)
    return 0.030 - 0.060 * math.sin(math.pi * min(1.0, u * 1.25)) ** 0.7 + 0.03 * max(0.0, u - 0.8) / 0.2


def folded_wing(body, side):
    bvh = BVHTree.FromObject(body, bpy.context.evaluated_depsgraph_get())
    bm = bmesh.new()
    grid = []
    last_free = None
    for i in range(COLS + 1):
        u = i / COLS
        x = SHOULDER_X + (TIP_X - SHOULDER_X) * u
        row = []
        for j in range(ROWS + 1):
            v = j / ROWS
            z = top_z(x) + (low_z(x) - top_z(x)) * v
            hit = bvh.ray_cast(Vector((x, 0.3 * side, z)), Vector((0, -side, 0)))
            stand = THICK * (1 + 1.5 * u)
            if hit[0] is not None:
                p = hit[0] + hit[1] * stand
                last_free = None
            else:
                # off the body: the primaries ride over the tail, closing toward the midline at the tip
                p = Vector((x, side * (0.012 + 0.02 * (1 - u)), z + 0.006))
            row.append(bm.verts.new(p))
        grid.append(row)
    for i in range(COLS):
        for j in range(ROWS):
            f = (grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1])
            bm.faces.new(f if side > 0 else tuple(reversed(f)))
    # the trailing column collapses to a point: the wing tip
    bmesh.ops.pointmerge(bm, verts=grid[-1], merge_co=grid[-1][ROWS // 2].co.copy())
    name = 'doccor.wingFold' + ('L' if side > 0 else 'R')
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    so = ob.modifiers.new('thick', 'SOLIDIFY')
    so.thickness = 0.003
    so.offset = -1
    sm = ob.modifiers.new('smooth', 'SMOOTH')
    sm.iterations = 6
    sm.factor = 0.5
    return ob


TAIL_ROOT = Vector((-0.210, 0.0, 0.034))
TAIL_LENGTH = 0.165
TAIL_FEATHERS = 12
TAIL_FAN = math.radians(26)  # the spread across the whole tail, outer feather to outer feather
TAIL_PITCH = math.radians(-1)  # swimming, the tail lies flat on the water


def rectrix(bm, yaw, length, lift):
    """One tail feather: a stiff blade, broad at its root and rounded at its tip, its vane cupped a little down."""
    segs, half = 10, 0.011
    verts = []
    for i in range(segs + 1):
        t = i / segs
        w = half * (0.75 + 0.25 * math.sin(math.pi * min(1.0, t * 1.3))) * (1 if t < 0.85 else math.sqrt(max(0.0, 1 - ((t - 0.85) / 0.15) ** 2)))
        row = []
        for k in (-1, 0, 1):
            row.append(bm.verts.new((-t * length, k * w, -abs(k) * 0.0015 + lift)))
        verts.append(row)
    faces = []
    for i in range(segs):
        for k in range(2):
            faces.append(bm.faces.new((verts[i][k], verts[i][k + 1], verts[i + 1][k + 1], verts[i + 1][k])))
    m = Matrix.Translation(TAIL_ROOT) @ Matrix.Rotation(TAIL_PITCH, 4, 'Y') @ Matrix.Rotation(yaw, 4, 'Z')
    bmesh.ops.transform(bm, matrix=m, verts=[v for r in verts for v in r])


def tail():
    bm = bmesh.new()
    order = sorted(range(TAIL_FEATHERS), key=lambda k: abs(k - (TAIL_FEATHERS - 1) / 2))
    for rank, k in enumerate(order):
        s = (k - (TAIL_FEATHERS - 1) / 2) / ((TAIL_FEATHERS - 1) / 2)
        # the central pair longest and on top; each pair out a little shorter and lower
        length = TAIL_LENGTH * (1 - 0.08 * abs(s) ** 1.5)
        rectrix(bm, s * TAIL_FAN / 2, length, -0.0012 * rank)
    me = bpy.data.meshes.new('doccor.tail')
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new('doccor.tail', me)
    bpy.context.scene.collection.objects.link(ob)
    so = ob.modifiers.new('thick', 'SOLIDIFY')
    so.thickness = 0.0012
    return ob


def build():
    for o in [o for o in bpy.data.objects if o.name.startswith(('doccor.wingFold', 'doccor.tail'))]:
        bpy.data.objects.remove(o, do_unlink=True)
    body = bpy.data.objects['doccor.body']
    return [folded_wing(body, 1), folded_wing(body, -1)], tail()
