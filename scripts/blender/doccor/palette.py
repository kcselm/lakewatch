"""Each version's colours, from docs/research/2026-10-04-double-crested-cormorant.md, section 9 (estimates sampled from
photos), as linear RGB for Blender's shaders.
"""
VERSIONS = ['adult', 'juvenile']


def lin(hex_):
    """An sRGB hex colour as linear RGB."""
    c = [int(hex_[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)


PALETTE = {
    'adult': {
        # head, neck, and underparts black with a faint green gloss
        'upper': lin('#1d1b1a'), 'pale': lin('#1d1b1a'), 'chin': lin('#1d1b1a'), 'belly': lin('#1c1c1c'),
        # the back, scapulars, and wing coverts: grey-brown to bronze centres, black edges
        'scale': lin('#5a5450'), 'edge': lin('#141418'),
        'flight': lin('#1c1b1a'),
        'skin': lin('#e0a020'), 'iris': lin('#3a9a88'),
        'billUpper': lin('#3a3530'), 'billLower': lin('#c8b890'),
        'legs': lin('#1a1a1a'),
        'gloss': (0.25, 0.45, 0.30),
    },
    'juvenile': {
        # the crown and hindneck grey-brown; the chin and throat pale buff; the foreneck and breast buff, shading through
        # olive-brown to a dark belly
        'upper': lin('#6e6250'), 'pale': lin('#d2b796'), 'chin': lin('#e3c8ab'), 'belly': lin('#3a362d'),
        'scale': lin('#8f8070'), 'edge': lin('#3a332b'),
        'flight': lin('#2e2b26'),
        'skin': lin('#f0c030'), 'iris': lin('#5f8f7a'),
        'billUpper': lin('#6a5a48'), 'billLower': lin('#e0cc98'),
        'legs': lin('#1a1a1a'),
        'gloss': (0.35, 0.35, 0.30),
    },
}
