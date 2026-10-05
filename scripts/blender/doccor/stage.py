"""A preview stage: a soft overcast sky, a low September sun, a dark lake plane, and a camera on the bird.

render(path, azimuth, elevation, distance) writes one still. Only for looking at the model; nothing here is exported.
Run inside Blender: exec(open(path).read()).
"""
import math
import bpy
from mathutils import Vector

TARGET = Vector((-0.03, 0, 0.09))


def stage():
    sc = bpy.context.scene
    w = sc.world or bpy.data.worlds.new('World')
    sc.world = w
    w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs['Color'].default_value = (0.55, 0.62, 0.72, 1)
    bg.inputs['Strength'].default_value = 0.9
    sun = bpy.data.objects.get('doccor.sun')
    if not sun:
        sun = bpy.data.objects.new('doccor.sun', bpy.data.lights.new('doccor.sun', 'SUN'))
        sc.collection.objects.link(sun)
    sun.data.energy = 3.5
    sun.data.angle = math.radians(3)
    sun.rotation_euler = (math.radians(55), 0, math.radians(-40))
    old = bpy.data.objects.get('Light')
    if old:
        old.hide_render = True
        old.hide_viewport = True
    lake = bpy.data.objects.get('doccor.lake')
    if lake:
        lake.location.z = 0.040
    else:
        bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0, 0.040))  # body.py's WATERLINE
        lake = bpy.context.active_object
        lake.name = 'doccor.lake'
        m = bpy.data.materials.new('doccor.lake')
        m.use_nodes = True
        b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        b.inputs['Base Color'].default_value = (0.03, 0.05, 0.05, 1)
        b.inputs['Roughness'].default_value = 0.08
        lake.data.materials.append(m)
    cam = sc.camera or bpy.data.objects.get('Camera')
    sc.camera = cam
    cam.data.lens = 85
    sc.render.resolution_x, sc.render.resolution_y = 1600, 1000
    sc.render.film_transparent = False
    return cam


def aim(cam, azimuth, elevation, distance, target=None):
    target = target or TARGET
    a, e = math.radians(azimuth), math.radians(elevation)
    cam.location = target + Vector((math.cos(e) * math.cos(a), math.cos(e) * math.sin(a), math.sin(e))) * distance
    cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()


def render(path, azimuth=-90, elevation=8, distance=2.2, lake=True, target=None):
    cam = stage()
    bpy.data.objects['doccor.lake'].hide_render = not lake
    aim(cam, azimuth, elevation, distance, target)
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
