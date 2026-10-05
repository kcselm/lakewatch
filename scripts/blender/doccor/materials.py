"""The cormorant's plumage, bill and eyes in each version, as procedural materials, baked to the game's maps by bake.py.

Where each colour goes is painted per vertex from the anatomy, once (prepare): `plum`, red the bare orange skin (the
gular pouch and the lores), green the scaled feathers (the mantle, the scapulars and the folded wing's coverts), blue the
plain flight feathers; and `zone`, the juvenile's regions, red its pale foreneck and breast, green its paler chin and
throat, blue its dark belly. The adult's zones are all its glossy greenish black. paint(version) sets each material's
colours from palette.py.

build.py runs it after body.py, bill.py, wings.py, legs.py, and flight.py.
"""
import bpy
from mathutils import Vector
from palette import PALETTE

ROUGH = (0.55, 0.68)  # glossy feathers to the dull scaled back


def smooth(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def paint_body(ob):
    me = ob.data
    plum = me.color_attributes.get('plum') or me.color_attributes.new('plum', 'FLOAT_COLOR', 'POINT')
    zone = me.color_attributes.get('zone') or me.color_attributes.new('zone', 'FLOAT_COLOR', 'POINT')
    for v in me.vertices:
        p, n = v.co, v.normal
        # the bare skin, in the side view: a band from the bill's base back through the lores and under the eye, and
        # the throat below it, its rear edge a straight line across the throat level with the back of the eye
        behind = smooth(0.126, 0.131, p.x)
        lores = smooth(0.0075, 0.0055, abs(p.z - (0.190 + 0.10 * (p.x - 0.150)))) * smooth(0.004, 0.008, abs(p.y))
        gular = smooth(0.193, 0.188, p.z - 0.25 * (p.x - 0.150)) * smooth(0.164, 0.168, p.z)
        bare = max(lores, gular) * behind
        # the eye's ring of skin, its lower half
        ring = smooth(0.0095, 0.0075, (Vector((p.x, abs(p.y), p.z)) - Vector((0.136, 0.015, 0.195))).length)
        skin = max(bare, ring)
        # the mantle between the wings: the back of the body, top only
        mantle = smooth(0.020, 0.040, p.z) * smooth(0.080, 0.065, p.z) * smooth(0.100, 0.070, p.x) * smooth(-0.215, -0.170, p.x)
        plum.data[v.index].color = (skin, mantle, 0.0, 1.0)
        # the juvenile's pale front: the foreneck (facing forward) from the throat down, and the breast below the neck's
        # base; the chin and throat paler still, just behind the bare skin; the belly dark, under and behind
        front = smooth(0.1, 0.55, n.x) * smooth(0.02, 0.09, p.x)
        breast = smooth(0.05, 0.12, p.x) * smooth(0.3, -0.3, n.z) * smooth(0.09, 0.06, p.z)
        pale = max(front, breast) * smooth(0.19, 0.17, p.z)
        chin = smooth(0.15, 0.17, p.z) * smooth(0.0, 0.5, n.x) * smooth(0.11, 0.125, p.x)
        belly = smooth(-0.2, -0.6, n.z) * smooth(0.08, 0.0, p.x)
        zone.data[v.index].color = (pale, chin, belly, 1.0)


def paint_wing(ob, tip_x=-0.17):
    me = ob.data
    attr = me.color_attributes.get('plum') or me.color_attributes.new('plum', 'FLOAT_COLOR', 'POINT')
    zone = me.color_attributes.get('zone') or me.color_attributes.new('zone', 'FLOAT_COLOR', 'POINT')
    for v in me.vertices:
        # the coverts and scapulars scaled to the wing's back third, the primaries plain beyond it
        primary = smooth(tip_x + 0.03, tip_x - 0.01, v.co.x)
        attr.data[v.index].color = (0.0, 1.0 - primary, primary, 1.0)
        zone.data[v.index].color = (0.0, 0.0, 0.0, 1.0)


def node(tree, kind, loc, **inputs):
    n = tree.nodes.new(kind)
    n.location = loc
    for k, val in inputs.items():
        n.inputs[k].default_value = val
    return n


def mix(tree, loc):
    """A colour Mix node and its colour sockets (the node has float and vector sockets of the same names)."""
    n = tree.nodes.new('ShaderNodeMix')
    n.location = loc
    n.data_type = 'RGBA'
    ins = {s.identifier: s for s in n.inputs}
    outs = {s.identifier: s for s in n.outputs}
    return ins['Factor_Float'], ins['A_Color'], ins['B_Color'], outs['Result_Color']


def plumage(version):
    C = PALETTE[version]
    mat = bpy.data.materials.get('doccor.plumage') or bpy.data.materials.new('doccor.plumage')
    mat.use_nodes = True
    t = mat.node_tree
    t.nodes.clear()
    out = node(t, 'ShaderNodeOutputMaterial', (1400, 0))
    bsdf = node(t, 'ShaderNodeBsdfPrincipled', (1100, 0))
    t.links.new(bsdf.outputs[0], out.inputs['Surface'])
    attr = node(t, 'ShaderNodeAttribute', (-800, 300))
    attr.attribute_name = 'plum'
    sep = node(t, 'ShaderNodeSeparateColor', (-600, 300))
    t.links.new(attr.outputs['Color'], sep.inputs[0])
    zattr = node(t, 'ShaderNodeAttribute', (-800, 600))
    zattr.attribute_name = 'zone'
    zsep = node(t, 'ShaderNodeSeparateColor', (-600, 600))
    t.links.new(zattr.outputs['Color'], zsep.inputs[0])

    # the scaled feathers' ground between the laid feathers (feathers.py): a dark cell pattern
    tc = node(t, 'ShaderNodeTexCoord', (-1000, -200))
    mp = node(t, 'ShaderNodeMapping', (-800, -200))
    mp.inputs['Scale'].default_value = (55, 80, 80)
    t.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    vor = node(t, 'ShaderNodeTexVoronoi', (-600, -200))
    vor.feature = 'DISTANCE_TO_EDGE'
    vor.inputs['Randomness'].default_value = 0.35
    t.links.new(mp.outputs['Vector'], vor.inputs['Vector'])
    edge = node(t, 'ShaderNodeMapRange', (-400, -200))
    edge.inputs['From Min'].default_value = 0.03
    edge.inputs['From Max'].default_value = 0.12
    t.links.new(vor.outputs['Distance'], edge.inputs['Value'])
    sc_f, sc_a, sc_b, sc_out = mix(t, (-200, -100))
    sc_a.default_value = (*C['edge'], 1)
    sc_b.default_value = tuple(x * 0.4 for x in C['scale']) + (1,)
    t.links.new(edge.outputs['Result'], sc_f)

    # small feathers everywhere else (head, neck, underparts): finer cells, felt in the relief only
    mp2 = node(t, 'ShaderNodeMapping', (-800, -500))
    mp2.inputs['Scale'].default_value = (170, 240, 240)
    t.links.new(tc.outputs['Object'], mp2.inputs['Vector'])
    small = node(t, 'ShaderNodeTexVoronoi', (-600, -500))
    small.feature = 'DISTANCE_TO_EDGE'
    small.inputs['Randomness'].default_value = 0.5
    t.links.new(mp2.outputs['Vector'], small.inputs['Vector'])
    small_edge = node(t, 'ShaderNodeMapRange', (-400, -500))
    small_edge.inputs['From Min'].default_value = 0.0
    small_edge.inputs['From Max'].default_value = 0.15
    t.links.new(small.outputs['Distance'], small_edge.inputs['Value'])

    # the base by zone: upper -> pale front -> paler chin -> dark belly; then the scaled back, the primaries, the skin
    z1f, z1a, z1b, z1o = mix(t, (-100, 500))
    z1a.default_value = (*C['upper'], 1); z1b.default_value = (*C['pale'], 1)
    t.links.new(zsep.outputs['Red'], z1f)
    z2f, z2a, z2b, z2o = mix(t, (100, 500))
    z2b.default_value = (*C['chin'], 1)
    t.links.new(zsep.outputs['Green'], z2f); t.links.new(z1o, z2a)
    z3f, z3a, z3b, z3o = mix(t, (300, 500))
    z3b.default_value = (*C['belly'], 1)
    t.links.new(zsep.outputs['Blue'], z3f); t.links.new(z2o, z3a)
    b_f, b_a, b_b, b_out = mix(t, (500, 200))
    t.links.new(z3o, b_a)
    t.links.new(sep.outputs['Green'], b_f)
    t.links.new(sc_out, b_b)
    p_f, p_a, p_b, p_out = mix(t, (700, 200))
    p_b.default_value = (*C['flight'], 1)
    t.links.new(sep.outputs['Blue'], p_f)
    t.links.new(b_out, p_a)
    s_f, s_a, s_b, s_out = mix(t, (900, 200))
    s_b.default_value = (*C['skin'], 1)
    t.links.new(sep.outputs['Red'], s_f)
    t.links.new(p_out, s_a)
    t.links.new(s_out, bsdf.inputs['Base Color'])

    rough = node(t, 'ShaderNodeMapRange', (900, -100))
    rough.inputs['To Min'].default_value = ROUGH[0]
    rough.inputs['To Max'].default_value = ROUGH[1]
    t.links.new(sep.outputs['Green'], rough.inputs['Value'])
    t.links.new(rough.outputs['Result'], bsdf.inputs['Roughness'])
    bsdf.inputs['Specular IOR Level'].default_value = 0.35
    bsdf.inputs['Sheen Weight'].default_value = 0.3
    bsdf.inputs['Sheen Tint'].default_value = (*C['gloss'], 1)
    bsdf.inputs['Sheen Roughness'].default_value = 0.35

    # relief: each scale's margin sits under the next feather, and the small feathers' edges everywhere
    bump_scale = node(t, 'ShaderNodeBump', (900, -400))
    bump_scale.inputs['Strength'].default_value = 0.35
    bump_scale.inputs['Distance'].default_value = 0.0015
    gate = node(t, 'ShaderNodeMath', (700, -400))
    gate.operation = 'MULTIPLY'
    t.links.new(edge.outputs['Result'], gate.inputs[0])
    t.links.new(sep.outputs['Green'], gate.inputs[1])
    t.links.new(gate.outputs[0], bump_scale.inputs['Height'])
    bump_fine = node(t, 'ShaderNodeBump', (1000, -400))
    bump_fine.inputs['Strength'].default_value = 0.12
    bump_fine.inputs['Distance'].default_value = 0.0008
    t.links.new(small_edge.outputs['Result'], bump_fine.inputs['Height'])
    t.links.new(bump_scale.outputs['Normal'], bump_fine.inputs['Normal'])
    t.links.new(bump_fine.outputs['Normal'], bsdf.inputs['Normal'])
    return mat


def simple(name, color, rough, **extra):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    b = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    for k, v in extra.items():
        b.inputs[k].default_value = v
    return mat


def assign(ob, mat):
    ob.data.materials.clear()
    ob.data.materials.append(mat)


def bill_material(version):
    C = PALETTE[version]
    mat = bpy.data.materials.get('doccor.bill')
    if mat:
        bpy.data.materials.remove(mat)
    mat = simple('doccor.bill', C['billUpper'], 0.35)
    t = mat.node_tree
    b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    attr = node(t, 'ShaderNodeAttribute', (-500, 200))
    attr.attribute_name = 'lower'
    f, a, bb, out = mix(t, (-250, 200))
    a.default_value = (*C['billUpper'], 1)
    bb.default_value = (*C['billLower'], 1)
    t.links.new(attr.outputs['Fac'], f)
    t.links.new(out, b.inputs['Base Color'])
    return mat


def eye_material(version):
    """The iris, with a dark pupil where the eye looks out (its outward pole, along y)."""
    C = PALETTE[version]
    mat = bpy.data.materials.get('doccor.eye')
    if mat:
        bpy.data.materials.remove(mat)
    mat = simple('doccor.eye', C['iris'], 0.05, **{'Coat Weight': 1.0, 'Coat Roughness': 0.02})
    t = mat.node_tree
    b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    geo = node(t, 'ShaderNodeNewGeometry', (-700, 200))
    sep = node(t, 'ShaderNodeSeparateXYZ', (-500, 200))
    t.links.new(geo.outputs['Normal'], sep.inputs[0])
    absy = node(t, 'ShaderNodeMath', (-300, 200))
    absy.operation = 'ABSOLUTE'
    t.links.new(sep.outputs['Y'], absy.inputs[0])
    ramp = node(t, 'ShaderNodeMapRange', (-150, 200))
    ramp.inputs['From Min'].default_value = 0.93
    ramp.inputs['From Max'].default_value = 0.96
    t.links.new(absy.outputs[0], ramp.inputs['Value'])
    f, a, bb, out = mix(t, (50, 200))
    a.default_value = (*C['iris'], 1)
    bb.default_value = (0.004, 0.004, 0.004, 1)
    t.links.new(ramp.outputs['Result'], f)
    t.links.new(out, b.inputs['Base Color'])
    return mat


def prepare():
    """Paint the regions on the parts, once."""
    paint_body(bpy.data.objects['doccor.body'])
    for side in 'LR':
        paint_wing(bpy.data.objects['doccor.wingFold' + side])
    paint_wing(bpy.data.objects['doccor.tail'], tip_x=1.0)  # all plain flight feathers


def paint(version):
    """Every part's material in a version (the laid feathers' and the flight wing's are their own scripts')."""
    plum = plumage(version)
    for name in ['doccor.body', 'doccor.wingFoldL', 'doccor.wingFoldR', 'doccor.tail']:
        assign(bpy.data.objects[name], plum)
    assign(bpy.data.objects['doccor.bill'], bill_material(version))
    eye = eye_material(version)
    for side in 'LR':
        assign(bpy.data.objects['doccor.eye' + side], eye)
