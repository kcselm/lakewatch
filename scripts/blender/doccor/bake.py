"""The game's cormorant: one low-poly mesh, its colour, normal and roughness baked from the detailed model.

The detailed parts (body.py's 50k-vertex shell, the folded wings, the tail, bill and eyes, and feathers.py's laid
feathers) are the source. The game mesh is their copy, decimated to a real-time budget (the body only; the other
parts are light already), unwrapped onto one atlas, and baked from them in Cycles.

Run inside Blender after the other scripts: exec(open(path).read()). Writes the atlas PNGs beside the export.
"""
import os
import bpy

OUT = r'C:/Users/kcsel/.t3/worktrees/lakewatch/t3code-06cbc325/public/models/doccor'
SIZE = 2048
BODY_TRIS = 7000
PARTS = ['doccor.body', 'doccor.wingFoldL', 'doccor.wingFoldR', 'doccor.tail', 'doccor.bill', 'doccor.eyeL', 'doccor.eyeR']
SOURCES = PARTS + ['doccor.feathersL', 'doccor.feathersR']


def low_copy(name):
    src = bpy.data.objects[name]
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(src.evaluated_get(dg))
    ob = bpy.data.objects.new(name.replace('doccor.', 'game.'), me)
    bpy.context.scene.collection.objects.link(ob)
    if name == 'doccor.body':
        dec = ob.modifiers.new('decimate', 'DECIMATE')
        dec.ratio = BODY_TRIS / max(1, sum(len(p.vertices) - 2 for p in me.polygons))
        with bpy.context.temp_override(object=ob):
            bpy.ops.object.modifier_apply(modifier=dec.name)
    ob['part'] = name.replace('doccor.', '')  # each part keeps its name, for the rig's weights
    return ob


def build_game_mesh():
    for o in [o for o in bpy.data.objects if o.name.startswith('game.')]:
        bpy.data.objects.remove(o, do_unlink=True)
    parts = [low_copy(n) for n in PARTS]
    # a vertex group per part before joining, so the rig can weight each part by name
    for ob in parts:
        g = ob.vertex_groups.new(name='part:' + ob['part'])
        g.add(range(len(ob.data.vertices)), 1.0, 'REPLACE')
        ob.data.materials.clear()
        for p in ob.data.polygons:
            p.use_smooth = True
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for ob in parts:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    game = bpy.context.active_object
    game.name = 'game.doccor'
    game.data.name = 'game.doccor'
    for a in list(game.data.color_attributes):
        game.data.color_attributes.remove(a)
    while game.data.uv_layers:
        game.data.uv_layers.remove(game.data.uv_layers[0])
    game.data.uv_layers.new(name='UVMap')
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.004, area_weight=0.0)
    bpy.ops.uv.pack_islands(margin=0.004)
    bpy.ops.object.mode_set(mode='OBJECT')
    return game


def image(name, color_space):
    img = bpy.data.images.get(name)
    if img:
        bpy.data.images.remove(img)
    img = bpy.data.images.new(name, SIZE, SIZE, alpha=False, float_buffer=False)
    img.colorspace_settings.name = color_space
    return img


def bake(game):
    sc = bpy.context.scene
    engine = sc.render.engine
    try:
        sc.render.engine = 'CYCLES'
    except TypeError as e:
        raise RuntimeError(f'baking needs Cycles: {e}')
    sc.cycles.samples = 16
    sc.cycles.device = 'CPU'
    mat = bpy.data.materials.new('game.doccor')
    mat.use_nodes = True
    game.data.materials.append(mat)
    t = mat.node_tree
    bsdf = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    imgs = {
        'color': image('doccor_color', 'sRGB'),
        'normal': image('doccor_normal', 'Non-Color'),
        'rough': image('doccor_rough', 'Non-Color'),
    }
    nodes = {}
    for i, (k, img) in enumerate(imgs.items()):
        n = t.nodes.new('ShaderNodeTexImage')
        n.image = img
        n.location = (-600, 300 - 300 * i)
        nodes[k] = n
    for o in bpy.context.view_layer.objects:
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
    passes = [('color', 'DIFFUSE'), ('normal', 'NORMAL'), ('rough', 'ROUGHNESS')]
    for key, kind in passes:
        for n in nodes.values():
            n.select = False
        nodes[key].select = True
        t.nodes.active = nodes[key]
        kw = {'type': kind}
        if kind == 'DIFFUSE':
            bk.use_pass_direct = False
            bk.use_pass_indirect = False
            bk.use_pass_color = True
            kw.update(pass_filter={'COLOR'})
        bpy.ops.object.bake(**kw)
    os.makedirs(OUT, exist_ok=True)
    for k, img in imgs.items():
        img.filepath_raw = os.path.join(OUT, f'{k}.png')
        img.file_format = 'PNG'
        img.save()
    # the game material: the maps wired as the glTF exporter reads them
    t.links.new(nodes['color'].outputs['Color'], bsdf.inputs['Base Color'])
    t.links.new(nodes['rough'].outputs['Color'], bsdf.inputs['Roughness'])
    nm = t.nodes.new('ShaderNodeNormalMap')
    nm.location = (-250, -300)
    t.links.new(nodes['normal'].outputs['Color'], nm.inputs['Color'])
    t.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    sc.render.engine = engine
    return mat


game = build_game_mesh()
print('game mesh', len(game.data.vertices), 'verts', sum(len(p.vertices) - 2 for p in game.data.polygons), 'tris')
bake(game)
print('baked to', OUT)
