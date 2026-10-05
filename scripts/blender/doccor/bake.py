"""The game's cormorant: one low-poly mesh, each part tagged and weighted for the game, and each version's colour, normal,
and roughness baked from the detailed model onto one atlas.

The detailed parts are the source: body.py's 50k-vertex shell, the bill and eyes, the folded wings and tail, the legs,
the flight wing's plates, and the laid feathers and remiges (bake only). The game mesh is their copy, each part decimated
to its share of the budget (BUDGET, 9,000 triangles in all), tagged with its `_PART` and its weights (rig.py), joined,
and unwrapped onto one atlas. Each version is baked in Cycles at SIZE pixels and written as WebP beside the glb.

build.py runs it: game_mesh() once, then bake(game, version) for each version.
"""
import os
import bpy
import gamebird as g
import rig

SIZE = 1024
# each part's triangles at most, and its part, and its weights (a bone, or a function of a rig's joints)
BUDGET = {
    'doccor.body': 5100, 'doccor.bill': 420, 'doccor.eyeL': 80, 'doccor.eyeR': 80,
    'doccor.wingFoldL': 450, 'doccor.wingFoldR': 450, 'doccor.tail': 480,
    'doccor.legL': 360, 'doccor.legR': 360, 'doccor.flightL': 320, 'doccor.flightR': 320,
}
PART = {
    'doccor.body': 'skin', 'doccor.bill': 'bill', 'doccor.eyeL': 'eye', 'doccor.eyeR': 'eye',
    'doccor.wingFoldL': 'wingFold', 'doccor.wingFoldR': 'wingFold', 'doccor.tail': 'tail',
    'doccor.legL': 'legs', 'doccor.legR': 'legs', 'doccor.flightL': 'wingSpread', 'doccor.flightR': 'wingSpread',
}
# baked from: every detailed part, and what is laid on them
SOURCES = list(BUDGET) + ['doccor.feathersL', 'doccor.feathersR', 'doccor.remigesL', 'doccor.remigesR']


def weights_for(name, J):
    if name == 'doccor.body':
        return rig.skin_weights(J)
    if name == 'doccor.bill':
        return 'bill'
    if name.startswith('doccor.eye'):
        return 'head'
    if name.startswith('doccor.wingFold'):
        return name[len('doccor.'):]
    if name == 'doccor.tail':
        return 'tail'
    if name.startswith('doccor.leg'):
        return rig.leg_weights(J, 1 if name.endswith('L') else -1)
    if name.startswith('doccor.flight'):
        return rig.flight_weights(1 if name.endswith('L') else -1)
    raise ValueError(name)


def triangles(me):
    return sum(len(p.vertices) - 2 for p in me.polygons)


def low_copy(name, J):
    src = bpy.data.objects[name]
    me = bpy.data.meshes.new_from_object(src.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    ob = bpy.data.objects.new('game.' + name[len('doccor.'):], me)
    bpy.context.scene.collection.objects.link(ob)
    if triangles(me) > BUDGET[name]:
        dec = ob.modifiers.new('decimate', 'DECIMATE')
        dec.ratio = BUDGET[name] / triangles(me)
        with bpy.context.temp_override(object=ob, active_object=ob):
            bpy.ops.object.modifier_apply(modifier=dec.name)
    for a in list(me.color_attributes):
        me.color_attributes.remove(a)
    while me.uv_layers:
        me.uv_layers.remove(me.uv_layers[0])
    me.materials.clear()
    g.tag(ob, PART[name], weights_for(name, J))
    for p in me.polygons:
        p.use_smooth = True
    return ob


def game_mesh(J):
    """The joined, tagged, weighted, unwrapped game mesh, `game.doccor`."""
    g.clear('game.')
    parts = [low_copy(n, J) for n in BUDGET]
    game = g.join(parts, 'game.doccor')
    game.data.uv_layers.new(name='UVMap')
    with bpy.context.temp_override(object=game, active_object=game, selected_objects=[game]):
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.003, area_weight=0.0)
        bpy.ops.uv.pack_islands(margin=0.003)
        bpy.ops.object.mode_set(mode='OBJECT')
    print('game mesh', len(game.data.vertices), 'vertices', triangles(game.data), 'triangles')
    return game


def image(name, color_space):
    old = bpy.data.images.get(name)
    if old:
        bpy.data.images.remove(old)
    img = bpy.data.images.new(name, SIZE, SIZE, alpha=False, float_buffer=False)
    img.colorspace_settings.name = color_space
    return img


def bake(game, version, out_dir):
    """Bake one version's colour, normal, and roughness onto the game mesh's atlas; write them as WebP."""
    sc = bpy.context.scene
    try:
        sc.render.engine = 'CYCLES'
    except TypeError as e:
        raise RuntimeError(f'baking needs Cycles: {e}')
    sc.cycles.samples = 16
    sc.cycles.device = 'CPU'
    game.data.materials.clear()
    mat = bpy.data.materials.get('game.doccor') or bpy.data.materials.new('game.doccor')
    mat.use_nodes = True
    game.data.materials.append(mat)
    t = mat.node_tree
    for n in [n for n in t.nodes if n.type == 'TEX_IMAGE']:
        t.nodes.remove(n)
    imgs = {'color': image(f'{version}.color', 'sRGB'), 'normal': image(f'{version}.normal', 'Non-Color'), 'rough': image(f'{version}.rough', 'Non-Color')}
    nodes = {}
    for k, img in imgs.items():
        n = t.nodes.new('ShaderNodeTexImage')
        n.image = img
        nodes[k] = n
    for o in sc.objects:
        o.select_set(False)
    for n in SOURCES:
        bpy.data.objects[n].select_set(True)
    game.select_set(True)
    bpy.context.view_layer.objects.active = game
    bk = sc.render.bake
    bk.use_selected_to_active = True
    bk.cage_extrusion = 0.006
    bk.max_ray_distance = 0.014
    bk.margin = 8
    for key, kind in (('color', 'DIFFUSE'), ('normal', 'NORMAL'), ('rough', 'ROUGHNESS')):
        for n in nodes.values():
            n.select = False
        nodes[key].select = True
        t.nodes.active = nodes[key]
        kw = {'type': kind}
        if kind == 'DIFFUSE':
            bk.use_pass_direct = False
            bk.use_pass_indirect = False
            bk.use_pass_color = True
            kw['pass_filter'] = {'COLOR'}
        bpy.ops.object.bake(**kw)
    os.makedirs(out_dir, exist_ok=True)
    for k, img in imgs.items():
        img.file_format = 'WEBP'
        path = os.path.join(out_dir, f'{version}.{k}.webp')
        img.filepath_raw = path
        img.save(filepath=path, quality=85 if k == 'color' else 90)
        print('wrote', path, os.path.getsize(path), 'bytes')
