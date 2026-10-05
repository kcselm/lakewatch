"""The authored test bird: a small swimmer of primitives on the game's skeleton, for the loader's tests.

Built floating, its waterline on z = 0 (the game's y = 0) and the middle of its body over the origin; its legs built
standing, as an amphibious bird's are; a six-joint neck chain and a flight wing. Every part is weighted wholly to one
bone, so a test can tell which bone moves which part.

  blender -b -P scripts/blender/testbird/build.py

writes src/birds/detail/testbird.glb.
"""
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'lib'))
import gamebird as g  # noqa: E402

OUT = os.path.join(HERE, '..', '..', '..', 'src', 'birds', 'detail', 'testbird.glb')

# Blender coordinates: +X forward, +Z up, the bird's left on +Y (the game's right side is Blender's -Y)
J = {
    'root': (0, 0, 0), 'body': (0, 0, 0),
    # a swimmer's hidden legs gather a quarter of the way up from the belly (-0.06) to the hips (-0.03)
    'legs': (0, 0, -0.0525),
    'neck': (0.12, 0, 0.03), 'neckMid': (0.125, 0, 0.07), 'neck3': (0.128, 0, 0.10), 'neck4': (0.13, 0, 0.125),
    'neck5': (0.135, 0, 0.145), 'neck6': (0.14, 0, 0.16), 'head': (0.15, 0, 0.17), 'bill': (0.18, 0, 0.17),
    'tail': (-0.15, 0, 0.02),
    'wingL': (0.04, 0.06, 0.04), 'wingR': (0.04, -0.06, 0.04),
    'handL': (0.04, 0.2, 0.04), 'handR': (0.04, -0.2, 0.04),
    'wingFoldL': (0.06, 0.055, 0.035), 'wingFoldR': (0.06, -0.055, 0.035),
    'tibiaL': (0, 0.03, -0.03), 'tarsusL': (0.01, 0.035, -0.10), 'toesL': (0, 0.035, -0.17),
    'tibiaR': (0, -0.03, -0.03), 'tarsusR': (0.01, -0.035, -0.10), 'toesR': (0, -0.035, -0.17),
    # no curl and no plume: parked at the body's pivot and the head, as the builder parks them
    'curl': (0, 0, 0), 'plume': (0.15, 0, 0.17),
}
MARKS = {
    'billBase': (0.18, 0, 0.17), 'billTip': (0.23, 0, 0.165),
    'tailRoot': (-0.15, 0, 0.02), 'tailTip': (-0.22, 0, 0.03),
    # the right side's (Blender's -Y): the folded wing's wrist and tip, and the flight wing's tip
    'wrist': (0.06, -0.055, 0.035), 'wingTip': (-0.12, -0.05, 0.04), 'flightTip': (0.0, -0.36, 0.04),
}


def neck_weights(p):
    """Each band of the neck to the joint below it."""
    chain = ['neck', 'neckMid', 'neck3', 'neck4', 'neck5', 'neck6']
    for name, nxt in zip(chain, chain[1:] + ['head']):
        if p.z < J[nxt][2]:
            return {name: 1.0}
    return {'neck6': 1.0}


def leg_weights(side):
    def w(p):
        if p.z > J['tarsus' + side][2]:
            return {'tibia' + side: 1.0}
        if p.z > J['toes' + side][2] + 0.004:
            return {'tarsus' + side: 1.0}
        return {'toes' + side: 1.0}
    return w


def build():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    parts = []
    body = g.ellipsoid('t.body', (0, 0, 0), (0.16, 0.07, 0.06))
    g.tag(body, 'skin', 'body')
    neck = g.cylinder('t.neck', J['neck'], J['head'], 0.022, 0.02)
    g.tag(neck, 'skin', neck_weights)
    head = g.ellipsoid('t.head', J['head'], (0.04, 0.028, 0.03))
    g.tag(head, 'skin', 'head')
    bill = g.cylinder('t.bill', MARKS['billBase'], MARKS['billTip'], 0.008, 0.002)
    g.tag(bill, 'bill', 'bill')
    eyes = [g.ellipsoid(f't.eye{s}', (0.165, y, 0.18), (0.006, 0.006, 0.006), 8, 6) for s, y in (('L', 0.025), ('R', -0.025))]
    for e in eyes:
        g.tag(e, 'eye', 'head')
    parts += [body, neck, head, bill, *eyes]
    for side, y in (('L', 1), ('R', -1)):
        fold = g.ellipsoid(f't.fold{side}', (-0.02, 0.06 * y, 0.03), (0.1, 0.008, 0.028))
        g.tag(fold, 'wingFold', 'wingFold' + side)
        inner = g.plate(f't.wing{side}', [(0.06, 0.06 * y, 0.04), (0.06, 0.2 * y, 0.04), (-0.04, 0.2 * y, 0.04), (-0.02, 0.06 * y, 0.04)])
        g.tag(inner, 'wingSpread', 'wing' + side)
        hand = g.plate(f't.hand{side}', [(0.06, 0.2 * y, 0.04), (0.0, 0.36 * y, 0.04), (-0.03, 0.34 * y, 0.04), (-0.04, 0.2 * y, 0.04)])
        g.tag(hand, 'wingSpread', 'hand' + side)
        leg = g.cylinder(f't.leg{side}', J['tibia' + side], J['tarsus' + side], 0.006)
        g.tag(leg, 'legs', leg_weights(side))
        shank = g.cylinder(f't.shank{side}', J['tarsus' + side], J['toes' + side], 0.004)
        g.tag(shank, 'legs', leg_weights(side))
        foot = g.plate(f't.foot{side}', [(0.04, 0.035 * y + 0.015, -0.168), (0.04, 0.035 * y - 0.015, -0.168), (-0.01, 0.035 * y - 0.005, -0.168), (-0.01, 0.035 * y + 0.005, -0.168)])
        g.tag(foot, 'legs', 'toes' + side)
        parts += [fold, inner, hand, leg, shank, foot]
    tail = g.plate('t.tail', [(-0.15, 0.03, 0.02), (-0.22, 0.04, 0.03), (-0.22, -0.04, 0.03), (-0.15, -0.03, 0.02)])
    g.tag(tail, 'tail', 'tail')
    parts.append(tail)
    mesh = g.join(parts, 'skin')
    arm = g.armature('testbird', J)
    g.bind(mesh, arm)
    marks = [g.mark(k, v) for k, v in MARKS.items()]
    for m in marks:
        m.parent = arm
    g.export(os.path.abspath(OUT), [arm, mesh, *marks])
    print('wrote', os.path.abspath(OUT), os.path.getsize(OUT), 'bytes')


build()
