"""The adult cormorant's plumage, bill and eyes, as procedural materials (baked to textures for the game later).

Where each colour goes is a colour attribute, `plum`, painted per vertex from the anatomy: red the bare orange skin
(the gular pouch and the lores), green the scaled feathers (the mantle, the scapulars and the folded wing's coverts),
blue the plain flight feathers. Everywhere else is the glossy greenish black of the head, neck and underparts.

Run inside Blender after body.py, bill.py and wings.py: exec(open(path).read()).
"""
import math
import bpy
from mathutils import Vector

GLOSS_BLACK = (0.0123, 0.011, 0.0103)  # the research's colours, sRGB hex as linear: black #1d1b1a
BRONZE = (0.030, 0.024, 0.014)  # under the laid feathers (feathers.py): only a dark bronze shows between them
EDGE_BLACK = (0.006, 0.006, 0.005)
PRIMARY = (0.0116, 0.011, 0.0103)  # #1c1b1a
SKIN = (0.7454, 0.3515, 0.0144)  # the gular skin and lores, orange-yellow #e0a020
BILL_LOWER = (0.578, 0.479, 0.279)  # the lower mandible, pale grey-yellow #c8b890
BILL = (0.0423, 0.0356, 0.0296)  # the upper mandible, dark grey #3a3530
IRIS = (0.0423, 0.3231, 0.2462)  # green-turquoise #3a9a88


def smooth(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def paint_body(ob):
    me = ob.data
    attr = me.color_attributes.get('plum') or me.color_attributes.new('plum', 'FLOAT_COLOR', 'POINT')
    for v in me.vertices:
        p = v.co
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
        attr.data[v.index].color = (skin, mantle, 0.0, 1.0)


def paint_wing(ob, tip_x=-0.17):
    me = ob.data
    attr = me.color_attributes.get('plum') or me.color_attributes.new('plum', 'FLOAT_COLOR', 'POINT')
    for v in me.vertices:
        # the coverts and scapulars scaled to the wing's back third, the primaries plain beyond it
        primary = smooth(tip_x + 0.03, tip_x - 0.01, v.co.x)
        attr.data[v.index].color = (0.0, 1.0 - primary, primary, 1.0)


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


def plumage():
    mat = bpy.data.materials.get('doccor.plumage') or bpy.data.materials.new('doccor.plumage')
    mat.use_nodes = True
    t = mat.node_tree
    t.nodes.clear()
    out = node(t, 'ShaderNodeOutputMaterial', (1200, 0))
    bsdf = node(t, 'ShaderNodeBsdfPrincipled', (900, 0))
    t.links.new(bsdf.outputs[0], out.inputs['Surface'])
    attr = node(t, 'ShaderNodeAttribute', (-800, 300))
    attr.attribute_name = 'plum'
    sep = node(t, 'ShaderNodeSeparateColor', (-600, 300))
    t.links.new(attr.outputs['Color'], sep.inputs[0])

    # the scaled feathers: cells of a Voronoi in object space, stretched along the body, each with a black margin
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
    sc_a.default_value = (*EDGE_BLACK, 1)
    sc_b.default_value = (*BRONZE, 1)
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

    # gloss black -> scaled -> primaries -> skin, by the attribute's channels
    b_f, b_a, b_b, b_out = mix(t, (100, 200))
    b_a.default_value = (*GLOSS_BLACK, 1)
    t.links.new(sep.outputs['Green'], b_f)
    t.links.new(sc_out, b_b)
    p_f, p_a, p_b, p_out = mix(t, (300, 200))
    p_b.default_value = (*PRIMARY, 1)
    t.links.new(sep.outputs['Blue'], p_f)
    t.links.new(b_out, p_a)
    s_f, s_a, s_b, s_out = mix(t, (500, 200))
    s_b.default_value = (*SKIN, 1)
    t.links.new(sep.outputs['Red'], s_f)
    t.links.new(p_out, s_a)
    t.links.new(s_out, bsdf.inputs['Base Color'])

    # glossy feathers, a dull scaled back, the bare skin a little wet
    rough = node(t, 'ShaderNodeMapRange', (500, -100))
    rough.inputs['From Min'].default_value = 0
    rough.inputs['From Max'].default_value = 1
    rough.inputs['To Min'].default_value = 0.55
    rough.inputs['To Max'].default_value = 0.68
    t.links.new(sep.outputs['Green'], rough.inputs['Value'])
    t.links.new(rough.outputs['Result'], bsdf.inputs['Roughness'])
    bsdf.inputs['Specular IOR Level'].default_value = 0.35
    bsdf.inputs['Sheen Weight'].default_value = 0.3
    bsdf.inputs['Sheen Tint'].default_value = (0.25, 0.45, 0.30, 1)  # the oily green sheen on the black
    bsdf.inputs['Sheen Roughness'].default_value = 0.35

    # relief: each scale's margin sits under the next feather, and the small feathers' edges everywhere
    bump_scale = node(t, 'ShaderNodeBump', (500, -400))
    bump_scale.inputs['Strength'].default_value = 0.35
    bump_scale.inputs['Distance'].default_value = 0.0015
    gate = node(t, 'ShaderNodeMath', (300, -400))
    gate.operation = 'MULTIPLY'
    t.links.new(edge.outputs['Result'], gate.inputs[0])
    t.links.new(sep.outputs['Green'], gate.inputs[1])
    t.links.new(gate.outputs[0], bump_scale.inputs['Height'])
    bump_fine = node(t, 'ShaderNodeBump', (700, -400))
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


plum = plumage()
body = bpy.data.objects['doccor.body']
paint_body(body)
assign(body, plum)
for side in 'LR':
    w = bpy.data.objects['doccor.wingFold' + side]
    paint_wing(w)
    assign(w, plum)
tail = bpy.data.objects['doccor.tail']
paint_wing(tail, tip_x=1.0)  # all plain flight feathers
assign(tail, plum)
def bill_material():
    mat = simple('doccor.bill', BILL, 0.35)
    t = mat.node_tree
    b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    attr = node(t, 'ShaderNodeAttribute', (-500, 200))
    attr.attribute_name = 'lower'
    f, a, bb, out = mix(t, (-250, 200))
    a.default_value = (*BILL, 1)
    bb.default_value = (*BILL_LOWER, 1)
    t.links.new(attr.outputs['Fac'], f)
    t.links.new(out, b.inputs['Base Color'])
    return mat


assign(bpy.data.objects['doccor.bill'], bill_material())
eye = simple('doccor.eye', IRIS, 0.05, **{'Coat Weight': 1.0, 'Coat Roughness': 0.02})
for side in 'LR':
    assign(bpy.data.objects['doccor.eye' + side], eye)
print('materials set')
