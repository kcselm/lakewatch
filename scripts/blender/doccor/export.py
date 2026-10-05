"""The cormorant's glb: the game mesh on its armature, and the landmarks; no images (bake.py writes each version's maps).

Built with its waterline at z = WATERLINE (body.py), the bird is moved down onto z = 0 here, as the game builds a
floating bird. The mesh's data, the joints, and the landmarks move, and every object stays at the origin: an armature
moved as an object moves its skinned mesh once as a child and again in the export, which bakes the armature's
transform into the vertices.

build.py runs it last.
"""
import os
import bpy
from mathutils import Matrix
import gamebird as g
import body


def export(game, J, marks, path):
    down = Matrix.Translation((0, 0, -body.WATERLINE))
    game.data.transform(down)
    J = {k: (x, y, z - body.WATERLINE) for k, (x, y, z) in J.items()}
    marks = {k: (x, y, z - body.WATERLINE) for k, (x, y, z) in marks.items()}
    arm = g.armature('doccor', J)
    g.bind(game, arm)
    empties = [g.mark(k, v) for k, v in marks.items()]
    for e in empties:
        e.parent = arm
    game.data.materials.clear()
    bpy.context.view_layer.update()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    g.export(path, [arm, game, *empties])
    print('wrote', path, os.path.getsize(path), 'bytes')
