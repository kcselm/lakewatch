"""The Double-crested Cormorant's body, neck and head as one closed surface.

A dense chain of ellipsoids along a spline through the stations below, voxel-remeshed into one shell and smoothed, so
no section can fold the way a lofted ring can. Blender units are metres; +X is forward, +Z up, the bird's right on -Y
(glTF's export turns Blender's -Y into three.js's +Z). Built floating: the body's middle at the origin.

build.py runs it: build() makes `doccor.body`.
"""
import bpy
import bmesh
from mathutils import Vector, Matrix

# x, z of the spine; half-width (y) and half-height of the section there (fore and aft, where the neck stands up).
# From docs/research/2026-10-04-double-crested-cormorant.md: swimming, bill tip to tail tip 0.60 m; the body 0.38 m from
# breast to tail base, 0.13 m deep and 0.12 m wide; the neck an upright column 56-66 mm thick; the head 0.165 m from
# occiput to bill tip, its crown 0.165 m above the water (WATERLINE), the back 25 mm above it.
WATERLINE = 0.040
STATIONS = [
    (-0.215, 0.030, 0.025, 0.018),  # tail root
    (-0.170, 0.020, 0.045, 0.045),
    (-0.100, 0.008, 0.058, 0.060),
    (-0.020, 0.000, 0.060, 0.065),
    (0.060, 0.000, 0.058, 0.062),
    (0.120, 0.008, 0.050, 0.055),
    (0.145, 0.035, 0.042, 0.045),  # breast, under the water ahead of the neck
    (0.118, 0.080, 0.034, 0.034),  # neck base
    (0.095, 0.115, 0.027, 0.031),
    (0.084, 0.150, 0.025, 0.030),
    (0.086, 0.176, 0.024, 0.028),  # occiput
    (0.108, 0.190, 0.023, 0.023),  # crown
    (0.132, 0.193, 0.018, 0.019),  # the eye's section
    (0.155, 0.193, 0.011, 0.013),  # bill base
]
STEP = 0.004  # metres between ellipsoids along the spine
VOXEL = 0.003


def catmull(p0, p1, p2, p3, t):
    t2, t3 = t * t, t * t * t
    return [0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
            for a, b, c, d in zip(p0, p1, p2, p3)]


def samples():
    pts = [STATIONS[0]] + STATIONS + [STATIONS[-1]]
    out = []
    for i in range(1, len(pts) - 2):
        for k in range(40):
            out.append(catmull(pts[i - 1], pts[i], pts[i + 1], pts[i + 2], k / 40))
    out.append(list(STATIONS[-1]))
    # resample at an even spacing along the spine
    even = [out[0]]
    for s in out[1:]:
        if (Vector((s[0], s[1])) - Vector((even[-1][0], even[-1][1]))).length >= STEP:
            even.append(s)
    return even


def build():
    for o in [o for o in bpy.data.objects if o.name.startswith('doccor.body')]:
        bpy.data.objects.remove(o, do_unlink=True)
    bm = bmesh.new()
    ss = samples()
    for i, (x, z, w, h) in enumerate(ss):
        a, b = ss[max(i - 1, 0)], ss[min(i + 1, len(ss) - 1)]
        tangent = Vector((b[0] - a[0], 0, b[1] - a[1])).normalized()
        up = Vector((0, 1, 0)).cross(tangent).normalized()  # perpendicular in the XZ plane
        if up.z < 0:
            up = -up
        side = tangent.cross(up)
        rot = Matrix((tangent, side, up)).transposed().to_4x4()
        m = Matrix.Translation((x, 0, z)) @ rot @ Matrix.Diagonal((0.02, w, h, 1))
        bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=1, matrix=m)
    # the bare throat skin under the bill's base, hanging 10-15 mm below the lower mandible
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=1,
                              matrix=Matrix.Translation((0.142, 0, 0.176)) @ Matrix.Diagonal((0.022, 0.010, 0.010, 1)))
    me = bpy.data.meshes.new('doccor.body')
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new('doccor.body', me)
    bpy.context.scene.collection.objects.link(ob)
    rm = ob.modifiers.new('remesh', 'REMESH')
    rm.mode = 'VOXEL'
    rm.voxel_size = VOXEL
    sm = ob.modifiers.new('smooth', 'LAPLACIANSMOOTH')
    sm.iterations = 20
    sm.lambda_factor = 0.8
    sm.use_volume_preserve = True
    bpy.context.view_layer.objects.active = ob
    for mod in list(ob.modifiers):
        with bpy.context.temp_override(object=ob):
            bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in me.polygons:
        p.use_smooth = True
    return ob

