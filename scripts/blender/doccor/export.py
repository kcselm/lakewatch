"""Export the game's cormorant (bake.py's game.doccor) as a binary glTF, its baked maps inside.

Blender's +Z up becomes glTF's +Y; the bird faces +X, as the detailed builder's birds do, and its right side lands on +Z.
Run inside Blender after bake.py: exec(open(path).read()).
"""
import os
import bpy

OUT = r'C:/Users/kcsel/.t3/worktrees/lakewatch/t3code-06cbc325/public/models/doccor/doccor.glb'

game = bpy.data.objects['game.doccor']
for o in bpy.context.view_layer.objects:
    o.select_set(False)
game.select_set(True)
bpy.context.view_layer.objects.active = game
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format='GLB',
    use_selection=True,
    export_yup=True,
    export_apply=True,
    export_image_format='AUTO',
    export_materials='EXPORT',
)
print('exported', OUT, os.path.getsize(OUT) // 1024, 'KB')
