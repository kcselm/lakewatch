"""Build the Double-crested Cormorant for the game, headless, from an empty scene:

  blender -b --factory-startup -P scripts/blender/doccor/build.py

writes public/models/doccor/doccor.glb and each version's <version>.color.webp, .normal.webp, and .rough.webp. Takes a
few minutes (the body's voxel remesh, and a bake per version).

The parts, in order: body.py (the body, neck, and head, one shell), bill.py (the bill and eyes), wings.py (the folded
wings and tail), legs.py, flight.py (the flight wing and its feathers), feathers.py (the scaled back's laid feathers);
materials.py paints them; rig.py places the joints and weights; bake.py makes the game mesh and bakes each version;
export.py writes the glb.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path[:0] = [HERE, os.path.join(HERE, '..', 'lib')]

import bpy  # noqa: E402
import body  # noqa: E402
import bill  # noqa: E402
import wings  # noqa: E402
import legs  # noqa: E402
import flight  # noqa: E402
import feathers  # noqa: E402
import materials  # noqa: E402
import rig  # noqa: E402
import bake  # noqa: E402
import export  # noqa: E402
from palette import VERSIONS, PALETTE  # noqa: E402

OUT = os.path.abspath(os.path.join(HERE, '..', '..', '..', 'public', 'models', 'doccor'))


def main():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    sc = bpy.context.scene
    sc.unit_settings.system = 'METRIC'
    body.build()
    bill.build()
    wings.build()
    legs.build()
    flight.build()
    feathers.build()
    materials.prepare()
    J = rig.joints()
    game = bake.game_mesh(J)
    marks = rig.marks(bpy.data.objects['doccor.bill'], bpy.data.objects['doccor.wingFoldR'])
    for version in VERSIONS:
        materials.paint(version)
        feathers.paint(version)
        flight.paint(version)
        black = materials.simple('doccor.legs', PALETTE[version]['legs'], 0.5)
        for side in 'LR':
            materials.assign(bpy.data.objects['doccor.leg' + side], black)
        bake.bake(game, version, OUT)
    # the Blender that built it, in the glb's scene extras
    sc['builtWith'] = f'Blender {bpy.app.version_string}'
    export.export(game, J, marks, os.path.join(OUT, 'doccor.glb'))
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT) if f.endswith(('.glb', '.webp')))
    print(f'doccor: {total / 1024:.0f} KB in all; Blender {bpy.app.version_string}')


main()
