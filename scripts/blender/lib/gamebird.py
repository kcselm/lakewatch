"""What every authored bird shares: the game's skeleton, its parts, its landmarks, and the export.

A bird for the game is one mesh skinned to an armature whose bones are the detailed builder's (src/birds/detail/rig.ts:
BONE_NAMES and BONE_PARENT), each bone's head at its joint. The game reads each joint from its bone's head and ignores
the bone's tail and roll. Every vertex carries `_PART`, the part it belongs to (PARTS below), and empties named
`mark_<name>` mark the landmarks the game measures from. The glb holds no images: the game loads each version's
textures beside it.

Blender's axes: +X forward, +Z up, the bird's left on +Y. The glTF export turns them into the game's: +X forward, +Y up,
the bird's right on +Z.
"""
import bpy
import bmesh
from mathutils import Matrix, Vector

# src/birds/detail/rig.ts, in order: the game checks the glb's bones against these
BONE_NAMES = [
    'root', 'body', 'neck', 'neckMid', 'head', 'bill', 'tail',
    'wingL', 'wingR', 'wingFoldL', 'wingFoldR',
    'legs', 'tibiaL', 'tarsusL', 'toesL', 'tibiaR', 'tarsusR', 'toesR',
    'curl', 'neck3', 'neck4', 'neck5', 'neck6', 'plume', 'handL', 'handR',
]
BONE_PARENT = {
    'root': None, 'body': 'root', 'neck': 'body', 'neckMid': 'neck', 'head': 'neck6', 'bill': 'head', 'tail': 'body',
    'wingL': 'body', 'wingR': 'body', 'wingFoldL': 'body', 'wingFoldR': 'body',
    'legs': 'root', 'tibiaL': 'legs', 'tarsusL': 'tibiaL', 'toesL': 'tarsusL', 'tibiaR': 'legs', 'tarsusR': 'tibiaR',
    'toesR': 'tarsusR', 'curl': 'body', 'neck3': 'neckMid', 'neck4': 'neck3', 'neck5': 'neck4', 'neck6': 'neck5',
    'plume': 'head', 'handL': 'wingL', 'handR': 'wingR',
}
# src/birds/detail/authored.ts: AUTHORED_PARTS, in order; a vertex's _PART is its index here
PARTS = ['skin', 'bill', 'eye', 'wingFold', 'wingSpread', 'tail', 'legs']
# a bone with no length of its own (one parked at another's joint) still needs a tail in Blender
STUB = 0.005


def clear(prefix):
    for o in [o for o in bpy.data.objects if o.name.startswith(prefix)]:
        bpy.data.objects.remove(o, do_unlink=True)


def armature(name, joints):
    """An armature with every game bone, its head at `joints[bone]` (Blender coordinates)."""
    missing = [b for b in BONE_NAMES if b not in joints]
    if missing:
        raise ValueError(f'joints missing: {missing}')
    data = bpy.data.armatures.new(name)
    ob = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    for o in bpy.context.scene.objects:
        o.select_set(o is ob)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = {}
    for b in BONE_NAMES:
        e = data.edit_bones.new(b)
        e.head = Vector(joints[b])
        # the tail points at the first child with a joint of its own, else a stub straight up
        kids = [k for k, p in BONE_PARENT.items() if p == b and (Vector(joints[k]) - Vector(joints[b])).length > 1e-4]
        e.tail = Vector(joints[kids[0]]) if kids else Vector(joints[b]) + Vector((0, 0, STUB))
        e.use_deform = True
        eb[b] = e
    for b, p in BONE_PARENT.items():
        if p:
            eb[b].parent = eb[p]
            eb[b].use_connect = False
    bpy.ops.object.mode_set(mode='OBJECT')
    return ob


def tag(ob, part, weights):
    """Mark every vertex of `ob` as `part`, and weight it: `weights` is a bone name (all to it) or a function from a
    vertex's position to {bone: weight}."""
    if part not in PARTS:
        raise ValueError(f'unknown part {part}')
    me = ob.data
    attr = me.attributes.get('_PART') or me.attributes.new('_PART', 'FLOAT', 'POINT')
    for i in range(len(me.vertices)):
        attr.data[i].value = float(PARTS.index(part))
    groups = {}
    for v in me.vertices:
        w = {weights: 1.0} if isinstance(weights, str) else weights(ob.matrix_world @ v.co)
        for bone, x in w.items():
            if x <= 0:
                continue
            g = groups.get(bone) or ob.vertex_groups.get(bone) or ob.vertex_groups.new(name=bone)
            groups[bone] = g
            g.add([v.index], x, 'REPLACE')


def mark(name, at, collection_prefix='gamebird'):
    e = bpy.data.objects.new(f'mark_{name}', None)
    e.location = Vector(at)
    e.empty_display_size = 0.01
    bpy.context.scene.collection.objects.link(e)
    return e


def join(objects, name):
    for o in bpy.context.scene.objects:
        o.select_set(False)
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    ob = bpy.context.active_object
    ob.name = name
    ob.data.name = name
    return ob


def bind(mesh_ob, arm_ob):
    """Skin the mesh to the armature by its vertex groups (the weights `tag` gave)."""
    mesh_ob.parent = arm_ob
    mod = mesh_ob.modifiers.new('armature', 'ARMATURE')
    mod.object = arm_ob
    mod.use_vertex_groups = True


def export(path, objects):
    """Write the selected objects as a glb: the skinned mesh, its armature, and the landmarks; no images."""
    for o in bpy.context.scene.objects:
        o.select_set(False)
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        use_selection=True,
        export_yup=True,
        export_apply=False,
        export_skins=True,
        export_all_influences=False,
        export_attributes=True,
        export_materials='NONE',
        export_animations=False,
        export_extras=True,
    )


def cylinder(name, a, b, r0, r1=None, sides=12):
    """A closed cylinder from a to b (Blender coordinates)."""
    a, b = Vector(a), Vector(b)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=sides, radius1=r0, radius2=r1 if r1 is not None else r0,
                          depth=(b - a).length)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    # the cone stands on z, centred on the origin: turn it onto a to b and move it there
    me.transform(Matrix.Translation((a + b) / 2) @ Vector((0, 0, 1)).rotation_difference(b - a).to_matrix().to_4x4())
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def ellipsoid(name, at, size, segments=24, rings=12):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segments, v_segments=rings, radius=1)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(at), verts=bm.verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def plate(name, corners, thickness=0.002):
    """A thin closed plate through four corners (Blender coordinates), in order around it."""
    bm = bmesh.new()
    vs = [bm.verts.new(Vector(c)) for c in corners]
    f = bm.faces.new(vs)
    bmesh.ops.recalc_face_normals(bm, faces=[f])
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    moved = [e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=f.normal * -thickness, verts=moved)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob
