"""The scaled feathers of the cormorant's back: the mantle, the scapulars and the folded wing's coverts, laid as
overlapping cards on the surface, each pointing back, in staggered rows like shingles.

Every feather has its own 0..1 UV, so one material gives each its bronze centre, dark shaft and black margin. These are
the high-detail source: baked to the game mesh's colour and normal maps, not exported themselves.

Run inside Blender after body.py and wings.py: exec(open(path).read()).
"""
import math
import random
import bpy
import bmesh
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

random.seed(7)

# where the scaled feathers go, in the side view (x forward, z up): a band along the back and down over the wing
X_FRONT, X_BACK = 0.090, -0.200
ROW_STEP = 0.0095  # metres between rows, down the side
ROWS = 17  # rows from the back's midline to the wing's lower edge
COL_STEP = 0.013  # metres between feathers along a row


def feather_size(x):
    """Small coverts at the shoulder, long scapulars and tertials toward the back."""
    u = (X_FRONT - x) / (X_FRONT - X_BACK)
    return 0.016 + 0.020 * u  # length; the width is 0.72 of it


def card(bm, uv, at, normal, back, length, lift):
    """One feather: a rounded blade from its base (hidden under the feathers before it) back to its tip."""
    side = normal.cross(back).normalized()
    back = side.cross(normal).normalized()
    width = 0.72 * length
    n_l, n_w = 8, 6
    grid = []
    for i in range(n_l + 1):
        s = i / n_l
        row = []
        for j in range(n_w + 1):
            t = j / n_w * 2 - 1
            # a rounded tip: the width closes over the last half
            taper = 1.0 if s < 0.45 else math.sqrt(max(0.0, 1 - ((s - 0.45) / 0.55) ** 2)) * 0.98 + 0.02
            w = t * width / 2 * taper
            cup = -0.05 * width * (t * t) * taper  # the vane curves down at its edges onto the feather below
            rise = 0.0004 + lift * s  # the base tucked under the feather before it, the tip lying over the one behind
            p = at + back * (s * length) + side * w + normal * (rise + cup)
            row.append(bm.verts.new(p))
        grid.append(row)
    for i in range(n_l):
        for j in range(n_w):
            # wound so the face points out along the surface's normal
            corners = ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))
            f = bm.faces.new([grid[a][b] for a, b in corners])
            for loop, (a, b) in zip(f.loops, corners):
                loop[uv].uv = (b / n_w, a / n_l)


def axis_z(x):
    """The body's axis in the side view, which the feathers are cast in toward."""
    return 0.0


def scatter(targets, side):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    trees = [BVHTree.FromObject(o, depsgraph) for o in targets]
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('UVMap')
    count = 0
    # rows by angle around the body's axis, from beside the back's midline down the side to the wing's lower edge
    for row in range(ROWS):
        theta = math.radians(86) - row * ROW_STEP / 0.072
        # the front edge curves back down the side, and frays: the mantle's feathers give way to the neck's
        front = X_FRONT - 0.035 * (row / ROWS) ** 1.5 + random.uniform(-0.006, 0.006)
        x = front + (COL_STEP / 2 if row % 2 else 0)
        while x > X_BACK:
            jx, jt = random.uniform(-0.002, 0.002), random.uniform(-0.02, 0.02)
            out = Vector((0, side * math.cos(theta + jt), math.sin(theta + jt)))
            axis = Vector((x + jx, 0, axis_z(x)))
            best = None
            for tree in trees:
                hit = tree.ray_cast(axis + out * 0.3, -out)
                if hit[0] is not None and (best is None or hit[3] < best[3]):
                    best = hit
            # on the back and wings only: not up the neck's column
            if best is not None and best[1].dot(out) > 0.2 and best[0].z < 0.07:
                normal = best[1].normalized()
                length = feather_size(x) * random.uniform(0.9, 1.1)
                back = Vector((-1, 0, -0.15))
                back = (back - normal * back.dot(normal)).normalized()
                # each feather's tip lies over the one behind it, and each row over the row below, as shingles do
                card(bm, uv, best[0] + normal * (0.0006 + 0.00008 * (ROWS - row)), normal, back, length, 0.0005)
                count += 1
            x -= COL_STEP
    name = 'doccor.feathers' + ('L' if side > 0 else 'R')
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob, count


def feather_material():
    mat = bpy.data.materials.get('doccor.feather') or bpy.data.materials.new('doccor.feather')
    mat.use_nodes = True
    t = mat.node_tree
    t.nodes.clear()
    out = t.nodes.new('ShaderNodeOutputMaterial')
    out.location = (900, 0)
    bsdf = t.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (600, 0)
    t.links.new(bsdf.outputs[0], out.inputs['Surface'])
    # in a feather's UV: x across (0..1, the shaft at 0.5), y from base (0) to tip (1); the margin's distance from the
    # outline, approximated as the nearer of the side edges and the tip
    uvn = t.nodes.new('ShaderNodeUVMap')
    uvn.location = (-900, 0)
    sep = t.nodes.new('ShaderNodeSeparateXYZ')
    sep.location = (-700, 0)
    t.links.new(uvn.outputs['UV'], sep.inputs[0])

    def math_node(op, a, b=None, loc=(0, 0), clamp=False):
        n = t.nodes.new('ShaderNodeMath')
        n.operation = op
        n.location = loc
        n.use_clamp = clamp
        for k, v in enumerate((a, b)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[k].default_value = v
            else:
                t.links.new(v, n.inputs[k])
        return n.outputs[0]

    across = math_node('ABSOLUTE', math_node('SUBTRACT', sep.outputs['X'], 0.5, (-500, 100)), None, (-350, 100))
    # the outline's half-width at y: full to 0.6, closing to the tip
    edge = math_node('SUBTRACT', 0.5, across, (-200, 100))
    tip = math_node('SUBTRACT', 1.0, sep.outputs['Y'], (-500, -100))
    margin = math_node('MINIMUM', edge, math_node('MULTIPLY', tip, 0.9, (-350, -100)), (-50, 0))
    # bronze inside, black toward the edge (a bold margin, as the field marks show it); a soft dark shaft down the middle
    inside = math_node('MULTIPLY', math_node('SUBTRACT', margin, 0.19, (100, 0)), 9.0, (250, 0), clamp=True)
    shaft = math_node('MULTIPLY', math_node('SUBTRACT', 0.035, across, (100, 200)), 40.0, (250, 200), clamp=True)
    tone = math_node('MULTIPLY', inside, math_node('SUBTRACT', 1.0, math_node('MULTIPLY', shaft, 0.6, (300, 300)), (400, 300)), (450, 100))
    mix = t.nodes.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    mix.location = (450, -100)
    ins = {s.identifier: s for s in mix.inputs}
    ins['A_Color'].default_value = (*(0.007, 0.007, 0.0091), 1)  # black edges #141418
    ins['B_Color'].default_value = (*(0.1022, 0.0887, 0.0802), 1)  # grey-brown to bronze centres #5a5450
    t.links.new(tone, ins['Factor_Float'])
    t.links.new({s.identifier: s for s in mix.outputs}['Result_Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.55
    bsdf.inputs['Specular IOR Level'].default_value = 0.3
    return mat


for o in [o for o in bpy.data.objects if o.name.startswith('doccor.feathers')]:
    bpy.data.objects.remove(o, do_unlink=True)
fm = feather_material()
body = bpy.data.objects['doccor.body']
made = []
for side, wing in ((1, 'doccor.wingFoldL'), (-1, 'doccor.wingFoldR')):
    ob, n = scatter([body, bpy.data.objects[wing]], side)
    ob.data.materials.append(fm)
    made.append(n)
print('feathers', made)
