"""The cormorant's bill and eyes.

The bill is lofted from rings along its length, which is straight enough that no ring folds: the upper mandible ending
in a hook over the lower's tip. Each eye is a small sphere set into the head's side.

Run inside Blender after body.py: exec(open(path).read()).
"""
import math
import bpy
import bmesh
from mathutils import Vector, Matrix

BILL_BASE = Vector((0.160, 0.0, 0.190))
BILL_LENGTH = 0.057  # the culmen
BILL_PITCH = math.radians(15)  # swimming, the bill held about 15 degrees up
RINGS = 24
SIDES = 16
EYE = Vector((0.136, 0.0150, 0.197))  # 86 mm behind the bill tip, high in the face; the right eye mirrors onto -Y
EYE_RADIUS = 0.0055


# fraction of the culmen from the base: width, depth (mm), from the research's bill profile
PROFILE = [(0.0, 12, 17), (0.5, 9, 11), (0.7, 8, 10), (0.88, 6, 9), (1.0, 2, 6)]
HOOK = 0.006


def bill_section(t):
    """Half-width, top and bottom (from the bill's axis), and the axis's drop, at t from base (0) to tip (1)."""
    for (t0, w0, d0), (t1, w1, d1) in zip(PROFILE, PROFILE[1:]):
        if t <= t1:
            k = (t - t0) / (t1 - t0)
            w, d = w0 + (w1 - w0) * k, d0 + (d1 - d0) * k
            break
    w, d = w / 2000, d / 1000
    top, bottom = 0.45 * d, 0.55 * d
    drop = 0.0
    if t > 0.67:  # the nail, the outer third of the upper mandible: arched, hooking down over the lower's tip
        k = (t - 0.67) / 0.33
        drop = 0.5 * HOOK * k * k
        bottom *= 1 - 0.6 * k
    return w, top, bottom, drop


def build_bill():
    bm = bmesh.new()
    lower = bm.verts.layers.float.new('lower')  # 1 on the lower mandible, 0 on the upper
    rings = []
    for i in range(RINGS + 1):
        t = i / RINGS
        w, top, bottom, drop = bill_section(t)
        x = t * BILL_LENGTH
        ring = []
        for j in range(SIDES):
            a = 2 * math.pi * j / SIDES
            y = w * math.sin(a)
            # a flattened section, squarer on top: the culmen's ridge
            c = math.cos(a)
            z = (top if c > 0 else bottom) * c * (abs(c) ** -0.25 if c != 0 else 1)
            v = bm.verts.new((x, y, z - drop))
            # the cutting edge a little below the axis; the hook is all upper mandible
            v[lower] = 1.0 if c < -0.25 and t < 0.9 else 0.0
            ring.append(v)
        rings.append(ring)
    for i in range(RINGS):
        for j in range(SIDES):
            a, b = rings[i][j], rings[i][(j + 1) % SIDES]
            c, d = rings[i + 1][(j + 1) % SIDES], rings[i + 1][j]
            bm.faces.new((a, b, c, d))
    # cap the tip to a point, leave the base open inside the head
    tip = bm.verts.new((BILL_LENGTH + 0.0015, 0, -HOOK))
    for j in range(SIDES):
        bm.faces.new((rings[-1][j], rings[-1][(j + 1) % SIDES], tip))
    base = bm.verts.new((-0.004, 0, 0))
    for j in range(SIDES):
        bm.faces.new((rings[0][(j + 1) % SIDES], rings[0][j], base))
    bm.transform(Matrix.Translation(BILL_BASE) @ Matrix.Rotation(-BILL_PITCH, 4, 'Y'))  # -Y rotation raises +X
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('doccor.bill')
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new('doccor.bill', me)
    bpy.context.scene.collection.objects.link(ob)
    sub = ob.modifiers.new('subsurf', 'SUBSURF')
    sub.levels = sub.render_levels = 1
    return ob


def build_eyes():
    out = []
    for side, name in ((1, 'doccor.eyeL'), (-1, 'doccor.eyeR')):
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=EYE_RADIUS,
                                  matrix=Matrix.Translation((EYE.x, EYE.y * side, EYE.z)))
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        for p in me.polygons:
            p.use_smooth = True
        ob = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(ob)
        out.append(ob)
    return out


for o in [o for o in bpy.data.objects if o.name.startswith(('doccor.bill', 'doccor.eye'))]:
    bpy.data.objects.remove(o, do_unlink=True)
bill = build_bill()
eyes = build_eyes()
print('bill', tuple(round(d, 4) for d in bill.dimensions))
