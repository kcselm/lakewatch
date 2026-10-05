"""The cormorant on the game's skeleton: its joints, each part's weights, and the landmarks the game measures from.

The joints sit at the cormorant's own anatomy, in body.py's coordinates (the waterline at z = WATERLINE; export.py
moves the whole bird down onto it):
- `root`, `body`: the body's middle on the water, where a swimmer pivots; `legs`: a quarter of the way up from the belly
  to the hips, where a swimmer's hidden legs gather;
- the neck chain: `neck` where the neck leaves the breast, then `neckMid` and `neck3`-`neck6` evenly along the neck's
  spine to `head` at the occiput (seven labels: authored.neck 7);
- `bill` at the bill's base; `tail` at the tail's root;
- `wingFoldL/R` at the folded wing's wrist; `wingL/R` at the shoulders; `handL/R` at the flight wing's wrist;
- the legs' hip, knee, and foot on each side; `curl` parked at the body's pivot, `plume` at the head.

The skin's weights fall off with distance from each skin bone's segment (the body, the tail, the neck chain, the head),
the three nearest blended, so the neck bends smoothly into the body; every other part is weighted to its own bones.
"""
import math
from mathutils import Vector
import body
import bill
import wings
import legs
import flight

W = body.WATERLINE


def neck_chain():
    """`neck` .. `neck6` and `head`: seven points evenly along the spine from the neck's base to the occiput."""
    pts = [Vector((x, 0, z)) for x, z, _, _ in body.samples()]
    base = min(range(len(pts)), key=lambda i: (pts[i] - Vector((0.118, 0, 0.080))).length)
    top = min(range(len(pts)), key=lambda i: (pts[i] - Vector((0.086, 0, 0.176))).length)
    run = pts[base:top + 1]
    lengths = [0.0]
    for a, b in zip(run, run[1:]):
        lengths.append(lengths[-1] + (b - a).length)
    out = []
    for k in range(7):
        want = lengths[-1] * k / 6
        i = next(i for i, l in enumerate(lengths) if l >= want - 1e-9)
        out.append(run[i].copy())
    return out


def joints():
    chain = neck_chain()
    hipL, kneeL, footL = legs.joints(1)
    hipR, kneeR, footR = legs.joints(-1)
    shL, wrL = flight.joints(1)
    shR, wrR = flight.joints(-1)
    pivot = Vector((0, 0, W))
    belly = -0.055
    J = {
        'root': pivot, 'body': pivot,
        'legs': Vector((hipR.x, 0, belly + 0.25 * (hipR.z - belly))),
        'neck': chain[0], 'neckMid': chain[1], 'neck3': chain[2], 'neck4': chain[3], 'neck5': chain[4], 'neck6': chain[5],
        'head': chain[6], 'bill': bill.BILL_BASE.copy(), 'tail': wings.TAIL_ROOT.copy(),
        'wingFoldL': fold_wrist(1), 'wingFoldR': fold_wrist(-1),
        'wingL': shL, 'wingR': shR, 'handL': wrL, 'handR': wrR,
        'tibiaL': hipL, 'tarsusL': kneeL, 'toesL': footL, 'tibiaR': hipR, 'tarsusR': kneeR, 'toesR': footR,
        'curl': pivot.copy(), 'plume': chain[6].copy(),
    }
    return {k: tuple(v) for k, v in J.items()}


def fold_wrist(side):
    """The folded wing's wrist: where its leading edge meets the body, 315 mm (the wing chord) ahead of its tip."""
    return Vector((wings.TIP_X + 0.315, side * 0.052, 0.042))


def segment_distance(p, a, b):
    ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-12)))
    return (a + ab * t - p).length


def skin_weights(J):
    """The skin's weights: each skin bone's segment, the three nearest blended by inverse distance to the fourth power."""
    V = {k: Vector(v) for k, v in J.items()}
    chain = ['neck', 'neckMid', 'neck3', 'neck4', 'neck5', 'neck6', 'head']
    segs = {
        'body': (Vector((-0.15, 0, W - 0.01)), V['neck'] + (V['neck'] - V['body']) * -0.15),
        'tail': (V['tail'], V['tail'] + Vector((-0.06, 0, 0))),
        'head': (V['head'], bill.BILL_BASE),
    }
    for a, b in zip(chain, chain[1:]):
        segs[a] = (V[a], V[b])

    def weights(p):
        d = sorted(((segment_distance(p, a, b) + 0.004) ** -4, bone) for bone, (a, b) in segs.items())[-3:]
        total = sum(w for w, _ in d)
        return {bone: w / total for w, bone in d}
    return weights


def leg_weights(J, side):
    s = 'L' if side > 0 else 'R'
    knee, foot = J['tarsus' + s][2], J['toes' + s][2]

    def weights(p):
        if p.z > knee:
            return {'tibia' + s: 1.0}
        if p.z > foot + 0.003:
            return {'tarsus' + s: 1.0}
        return {'toes' + s: 1.0}
    return weights


def flight_weights(side):
    s = 'L' if side > 0 else 'R'

    def weights(p):
        u = (abs(p.y) - flight.SHOULDER.y) / flight.SPAN
        k = max(0.0, min(1.0, (u - (flight.WRIST - 0.04)) / 0.08))
        return {'wing' + s: 1.0 - k, 'hand' + s: k} if 0 < k < 1 else ({'hand' + s: 1.0} if k >= 1 else {'wing' + s: 1.0})
    return weights


def marks(game_bill, game_fold_r):
    """The landmarks, from the built parts (Blender coordinates, before export moves the bird onto the water)."""
    tip = max((v.co for v in game_bill.data.vertices), key=lambda c: c.x)
    fold_tip = min((v.co for v in game_fold_r.data.vertices), key=lambda c: c.x)
    tail_tip = wings.TAIL_ROOT + Vector((-math.cos(wings.TAIL_PITCH), 0, -math.sin(-wings.TAIL_PITCH))) * wings.TAIL_LENGTH
    return {
        'billBase': tuple(bill.BILL_BASE), 'billTip': tuple(tip),
        'tailRoot': tuple(wings.TAIL_ROOT), 'tailTip': tuple(tail_tip),
        'wrist': tuple(fold_wrist(-1)), 'wingTip': tuple(fold_tip),
        'flightTip': tuple(flight.tip(-1)),
    }
