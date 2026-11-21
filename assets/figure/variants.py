# Run inside Blender with figure.blend open (Scripting tab, or `blender figure.blend --background --python variants.py`).
# Re-colours the shared toon materials per character, swaps hair and accessories, and renders
# the same layer stack as the original figure into <name>/render and <name>/render-front.
import os

import bpy

ROOT = os.path.dirname(bpy.data.filepath)

HOOD = ['hood', 'string_R', 'string_L', 'aglet_R', 'aglet_L']
SWAPPABLE = ['hair', 'fringe', 'bob_blunt', 'bob_swept', 'curls', 'glasses', 'lashes'] + HOOD
# Each colour is the middle toon band; the dark and light bands are derived unless given.
VARIANTS = {
    'raka': dict(show=['hair', 'fringe'] + HOOD, colors={}),
    'ayu': dict(show=['bob_blunt', 'lashes'], colors={
        'Hair': ('#2a2220', '#1b1514', '#40332f'), 'Skin': ('#e9b996',), 'Hoodie': ('#2f7d62',),
        'HoodieDeep': ('#276a53',), 'Pants': ('#3d3a45',)}),
    'sekar': dict(show=['bob_swept', 'lashes'] + HOOD, colors={
        'Hair': ('#5a3222', '#3d2117', '#7a4630'), 'Skin': ('#c98e68',), 'Hoodie': ('#c8553d',),
        'HoodieDeep': ('#a8452f',), 'Pants': ('#2c3f6b',)}),
    'bima': dict(show=['curls', 'glasses'], colors={
        'Hair': ('#211915',), 'Skin': ('#a8704f',), 'Hoodie': ('#6b4f9a',),
        'HoodieDeep': ('#5a4185',), 'Pants': ('#9a7b52',)}),
}
SIDE = [('seat', ['seat']), ('torso', ['torso']), ('arms', ['arms']), ('head', ['head'])]
FRONT = [('base', ['seat']), ('upper', ['torso', 'arms']), ('head', ['head'])]


def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c] + [1.0]


def scaled(h, k):
    return '#%02x%02x%02x' % tuple(min(255, round(int(h[i:i + 2], 16) * k)) for i in (1, 3, 5))


def toward_white(h, t):
    return '#%02x%02x%02x' % tuple(round(int(h[i:i + 2], 16) * (1 - t) + 255 * t) for i in (1, 3, 5))


def nodes(mat):
    nt = bpy.data.materials[mat].node_tree
    return next(n for n in nt.nodes if n.type == 'VALTORGB'), next(n for n in nt.nodes if n.type == 'MIX')


ORIGINAL = {}
for name in ['Hair', 'Skin', 'Pants', 'Hoodie', 'HoodieDeep']:
    ramp, mix = nodes(name)
    ORIGINAL[name] = ([tuple(e.color) for e in ramp.color_ramp.elements], tuple(mix.inputs[7].default_value))


def apply(variant):
    for name, (bands, rim) in ORIGINAL.items():
        ramp, mix = nodes(name)
        for e, c in zip(ramp.color_ramp.elements, bands):
            e.color = c
        mix.inputs[7].default_value = rim
    v = VARIANTS[variant]
    for n in SWAPPABLE:
        o = bpy.data.objects[n]
        o.hide_render = n not in v['show']
        o.hide_set(o.hide_render)
    for name, (mid, *rest) in v['colors'].items():
        ramp, mix = nodes(name)
        dark, light = rest if rest else (scaled(mid, 0.72), scaled(mid, 1.2))
        for e, c in zip(ramp.color_ramp.elements, [dark, mid, light]):
            e.color = lin(c)
        mix.inputs[7].default_value = lin(toward_white(mid, 0.5))


def layers(variant, cam, plan, outdir, res):
    sc, vl = bpy.context.scene, bpy.context.view_layer
    os.makedirs(outdir, exist_ok=True)
    apply(variant)
    sc.camera = bpy.data.objects[cam]
    sc.render.resolution_x = sc.render.resolution_y = res
    # the front view is at webcam height, where the desk would hide the body
    desk = [o for o in bpy.data.objects if cam == 'OrthoFront' and o.name.startswith(('desk', 'laptop', 'mug'))]
    for o in desk:
        o.hide_render = True
    lcs = {lc.name: lc for lc in vl.layer_collection.children}
    below = []
    for layer, groups in plan:
        # groups drawn under this layer cut it where they sit in front; groups drawn above are left out
        for name, lc in lcs.items():
            lc.exclude = not (name in groups or name in below)
            lc.holdout = name in below
        sc.render.filepath = f'{outdir}/{layer}.png'
        bpy.ops.render.render(write_still=True)
        below += groups
    for lc in lcs.values():
        lc.exclude = lc.holdout = False
    for o in desk:
        o.hide_render = False
    sc.render.resolution_x = sc.render.resolution_y = 1200
    sc.camera = bpy.data.objects['Ortho']


for name in ['ayu', 'sekar', 'bima']:
    layers(name, 'Ortho', SIDE, f'{ROOT}/{name}/render', 1200)
    layers(name, 'OrthoFront', FRONT, f'{ROOT}/{name}/render-front', 800)
apply('raka')
