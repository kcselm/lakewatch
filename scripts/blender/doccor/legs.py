"""The cormorant's legs and feet, built standing under the floating body, as an amphibious bird's legs are.

A short black tarsus (65 mm) from a knee just under the belly's feathers, the tibia hidden in them but for a stub; set far
back, about 0.6 of the body from the breast. Totipalmate feet: four toes, all webbed, the outer the longest (86 mm), the
middle 72, the inner 55, and the hind toe (40) turned forward and inward and webbed to the inner (research sections 5.5
and 9; the middle, inner, and hind toes are its estimates).

build.py runs it: build() makes `doccor.legL` and `doccor.legR`. Blender coordinates, as body.py's: the waterline at
z = WATERLINE, the bird's left on +Y.
"""
import math
import bpy
import bmesh
from mathutils import Vector, Matrix

# the right leg's joints (the left mirrors y); the soles at SOLE
HIP = Vector((-0.070, -0.030, -0.010))
KNEE = Vector((-0.064, -0.036, -0.068))
FOOT = Vector((-0.068, -0.036, -0.133))
SOLE = -0.137
# each toe: its length, and its direction in the ground plane, radians from straight ahead toward the bird's left (the
# right foot's; the left foot mirrors them): the outer forward and out, the hind toe forward and in
TOES = [('outer', 0.086, -0.40), ('middle', 0.072, -0.05), ('inner', 0.055, 0.30), ('hind', 0.040, 0.95)]
TARSUS_R = 0.0042
TOE_R = 0.0022
WEB = 0.0008


def cylinder(bm, a, b, r0, r1, sides=8):
    """A closed tapering tube from a to b, into `bm`."""
    a, b = Vector(a), Vector(b)
    m = Matrix.Translation((a + b) / 2) @ Vector((0, 0, 1)).rotation_difference(b - a).to_matrix().to_4x4()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=sides, radius1=r0, radius2=r1,
                          depth=(b - a).length, matrix=m)


def foot(bm, side):
    """The toes and the webs between them: all four joined, totipalmate."""
    base = Vector((FOOT.x, FOOT.y if side < 0 else -FOOT.y, SOLE + TOE_R))
    tips = []
    for _, length, angle in TOES:
        a = angle if side < 0 else -angle
        tip = base + Vector((math.cos(a), math.sin(a), 0)) * length
        cylinder(bm, base, tip, TOE_R * 1.3, TOE_R * 0.6, sides=6)
        tips.append(tip)
    # a web between each pair of neighbouring toes: from the foot to a point most of the way along each, its free edge
    # dipping back between the tips
    for p, q in zip(tips, tips[1:]):
        mid = (p + q) / 2
        dip = base + (mid - base) * 0.82
        vs = [bm.verts.new(base + Vector((0, 0, WEB))), bm.verts.new(p * 0.97 + base * 0.03), bm.verts.new(dip), bm.verts.new(q * 0.97 + base * 0.03)]
        bm.faces.new(vs)
        under = [bm.verts.new(v.co - Vector((0, 0, 2 * WEB))) for v in vs]
        bm.faces.new(list(reversed(under)))
    return base


def leg(side):
    name = 'doccor.leg' + ('L' if side > 0 else 'R')
    flip = (lambda v: Vector((v.x, -v.y, v.z))) if side > 0 else (lambda v: v)
    bm = bmesh.new()
    # the tibia's stub, from inside the belly's feathers to the knee; the tarsus, flattened a little side to side
    cylinder(bm, flip(HIP), flip(KNEE), 0.008, 0.0055)
    cylinder(bm, flip(KNEE), flip(FOOT), TARSUS_R * 1.1, TARSUS_R)
    foot(bm, -1 if side < 0 else 1)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def joints(side):
    """The hip, knee, and foot joints for the rig, on the right (-1) or left (+1)."""
    f = (lambda v: Vector((v.x, -v.y, v.z))) if side > 0 else (lambda v: v.copy())
    return f(HIP), f(KNEE), f(FOOT)


def build():
    for o in [o for o in bpy.data.objects if o.name.startswith('doccor.leg')]:
        bpy.data.objects.remove(o, do_unlink=True)
    return leg(1), leg(-1)
