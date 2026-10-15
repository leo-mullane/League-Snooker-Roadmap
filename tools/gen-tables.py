#!/usr/bin/env python3
"""Generates the snooker table illustrations used as image placeholders.

Geometry is ported from the Snooker & Pool Layout Board (September 2026),
which draws a full-size table to scale: 3,569 x 1,778 mm playing area, 52.5 mm
balls, baulk line 737 mm from the bottom cushion, D of 292 mm radius, corner
pockets 89 mm at the fall with jaws cut along the diagonal, middle pockets
108 mm with rounded jaws, 50 mm cushions. Units below are millimetres.

Writes src/assets/table-<layout>[-portrait].svg for three layouts:
  break     the break-off position
  frame     mid-frame: reds spread, colours on their spots
  clearance the last colours, a break in progress

Run: python3 tools/gen-tables.py
"""
import math, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "assets")
os.makedirs(OUT, exist_ok=True)

L, W, R = 3569.0, 1778.0, 26.25
MIDX, MIDY = L / 2, W / 2
BAULK, DR = 737.0, 292.0
C, RAIL, RAIL_R, CHALK, SPOT_R = 50.0, 125.0, 70.0, 3.0, 6.0
CORNER = dict(nose=97.0, fall=89.0, jaw=12.0, hole=52.0)
MIDDLE = dict(nose=122.0, fall=108.0, jaw=24.0, hole=58.0)
M = C + RAIL

SPOTS = {"yellow": (BAULK, MIDY + DR), "green": (BAULK, MIDY - DR), "brown": (BAULK, MIDY),
         "blue": (MIDX, MIDY), "pink": ((MIDX + L) / 2, MIDY), "black": (L - 324, MIDY)}
COLOURS = {"red": "#C4122F", "yellow": "#F1C517", "green": "#0E6E3C", "brown": "#6A3A1C",
           "blue": "#1B4FB5", "pink": "#EE7FA6", "black": "#141414", "white": "#F4F0E4"}


def shade(hexc, amt):
    n = int(hexc[1:], 16)
    r, g, b = n >> 16, (n >> 8) & 255, n & 255
    f = lambda v: max(0, min(255, round(v * (1 + amt) if amt < 0 else v + (255 - v) * amt)))
    return "#%02X%02X%02X" % (f(r), f(g), f(b))


def rounded_path(pts):
    """pts: (x, y, radius); rounds each corner with a fillet of that radius."""
    n, d = len(pts), []
    for i, (x, y, r) in enumerate(pts):
        if not r:
            d.append(("L" if i else "M") + "%.2f %.2f" % (x, y)); continue
        p, q = pts[(i - 1) % n], pts[(i + 1) % n]
        ax, ay, bx, by = p[0] - x, p[1] - y, q[0] - x, q[1] - y
        la, lb = math.hypot(ax, ay), math.hypot(bx, by)
        ax, ay, bx, by = ax / la, ay / la, bx / lb, by / lb
        th = math.acos(max(-1, min(1, ax * bx + ay * by)))
        t = r / math.tan(th / 2)
        t1, t2 = (x + ax * t, y + ay * t), (x + bx * t, y + by * t)
        cross = (x - p[0]) * (q[1] - y) - (y - p[1]) * (q[0] - x)
        d.append(("L" if i else "M") + "%.2f %.2f A%s %s 0 0 %d %.2f %.2f" % (t1[0], t1[1], r, r, 1 if cross > 0 else 0, t2[0], t2[1]))
    return " ".join(d) + " Z"


def defs():
    out = ['<defs>']
    for k, c in COLOURS.items():
        out.append('<radialGradient id="b-%s" cx="0.36" cy="0.34" r="0.72"><stop offset="0" stop-color="%s"/><stop offset="0.18" stop-color="%s"/>'
                   '<stop offset="0.62" stop-color="%s"/><stop offset="1" stop-color="%s"/></radialGradient>' % (k, shade(c, .55), shade(c, .18), c, shade(c, -.45)))
    out.append('<radialGradient id="cloth" cx="0.5" cy="0.5" r="0.75"><stop offset="0" stop-color="#23974A"/><stop offset="0.7" stop-color="#1B8540"/><stop offset="1" stop-color="#146E33"/></radialGradient>')
    out.append('<radialGradient id="hole"><stop offset="0" stop-color="#000"/><stop offset="0.7" stop-color="#0A0806"/><stop offset="1" stop-color="#2A1B10"/></radialGradient>')
    out.append('<linearGradient id="wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5A301C"/><stop offset="0.5" stop-color="#3E1F11"/><stop offset="1" stop-color="#57301B"/></linearGradient>')
    # Light from the lamps over the table: brighter down the middle, falling away to the cushions
    out.append('<radialGradient id="lamp" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stop-color="#fff" stop-opacity="0.10"/><stop offset="0.6" stop-color="#fff" stop-opacity="0.03"/><stop offset="1" stop-color="#000" stop-opacity="0.18"/></radialGradient>')
    out.append('<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>')
    out.append('<filter id="tableshadow" x="-10%" y="-10%" width="120%" height="130%"><feGaussianBlur stdDeviation="28"/></filter>')
    out.append('</defs>')
    return "".join(out)


def table(balls):
    s = []
    co, mi = CORNER, MIDDLE
    # shadow of the whole table on the floor
    s.append('<rect x="%g" y="%g" width="%g" height="%g" rx="%g" fill="#000" fill-opacity=".55" filter="url(#tableshadow)"/>' % (-M + 20, -M + 50, L + 2 * M - 40, W + 2 * M - 30, RAIL_R))
    s.append('<rect x="%g" y="%g" width="%g" height="%g" rx="%g" fill="url(#wood)"/>' % (-M, -M, L + 2 * M, W + 2 * M, RAIL_R))
    s.append('<rect x="%g" y="%g" width="%g" height="%g" rx="%g" fill="none" stroke="#7A4527" stroke-opacity=".5" stroke-width="2.5"/>' % (-M + 8, -M + 8, L + 2 * M - 16, W + 2 * M - 16, RAIL_R - 7))
    s.append('<rect x="%g" y="%g" width="%g" height="%g" fill="url(#cloth)"/>' % (-C, -C, L + 2 * C, W + 2 * C))
    cxN, cxF = co["nose"] / math.sqrt(2), co["fall"] / math.sqrt(2) - C
    mxN, mxF = MIDX - mi["nose"] / 2, MIDX - mi["fall"] / 2
    A, B, Cc = 2, 2 * (cxF - C), cxF * cxF + C * C - co["hole"] ** 2
    ck = (-B + math.sqrt(B * B - 4 * A * Cc)) / (2 * A)
    mk = math.sqrt(max(0, mi["hole"] ** 2 - (mi["fall"] / 2) ** 2))
    for (x, y, r) in [(-ck, -ck, co["hole"]), (L + ck, -ck, co["hole"]), (-ck, W + ck, co["hole"]), (L + ck, W + ck, co["hole"]),
                      (MIDX, -C - mk, mi["hole"]), (MIDX, W + C + mk, mi["hole"])]:
        s.append('<circle cx="%.2f" cy="%.2f" r="%.2f" fill="#20140C"/><circle cx="%.2f" cy="%.2f" r="%.2f" fill="url(#hole)"/>' % (x, y, r + 8, x, y, r))
    top = [(cxF, -C, 0), (cxN, 0, co["jaw"]), (mxN, 0, mi["jaw"]), (mxF, -C, 0)]
    side = [(-C, cxF, 0), (0, cxN, co["jaw"]), (0, W - cxN, co["jaw"]), (-C, W - cxF, 0)]
    fx = lambda p: (L - p[0], p[1], p[2])
    fy = lambda p: (p[0], W - p[1], p[2])
    fxy = lambda p: (L - p[0], W - p[1], p[2])
    for pts in [top, [fx(p) for p in top], [fy(p) for p in top], [fxy(p) for p in top], side, [fx(p) for p in side]]:
        s.append('<path d="%s" fill="#12692F" stroke="#0B4F24" stroke-width="1.5"/>' % rounded_path(pts))
    s.append('<rect x="0" y="0" width="%g" height="%g" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="2"/>' % (L, W))
    s.append('<rect x="0" y="0" width="%g" height="%g" fill="url(#lamp)"/>' % (L, W))
    ch = 'stroke="#E9F3EA" stroke-opacity=".75" stroke-width="%g" fill="none"' % CHALK
    s.append('<line x1="%g" y1="0" x2="%g" y2="%g" %s/>' % (BAULK, BAULK, W, ch))
    s.append('<path d="M%g %g A%g %g 0 0 0 %g %g" %s/>' % (BAULK, MIDY - DR, DR, DR, BAULK, MIDY + DR, ch))
    for (x, y) in SPOTS.values():
        s.append('<circle cx="%.2f" cy="%.2f" r="%g" fill="#0C3D1E" fill-opacity=".85" stroke="#E9F3EA" stroke-opacity=".6" stroke-width="1.5"/>' % (x, y, SPOT_R))
    for (k, x, y) in balls:
        s.append('<circle cx="%.2f" cy="%.2f" r="%g" fill="#000" fill-opacity=".45" filter="url(#soft)"/>' % (x + R * .23, y + R * .3, R))
        s.append('<circle cx="%.2f" cy="%.2f" r="%g" fill="url(#b-%s)"/>' % (x, y, R, k))
    return "".join(s)


def break_off():
    b = [("white", BAULK - 12, MIDY + DR * 0.55)]
    b += [(k, SPOTS[k][0], SPOTS[k][1]) for k in ["yellow", "green", "brown", "blue", "pink", "black"]]
    apex, gap = SPOTS["pink"][0] + 2 * R + 1.5, 0.25
    dx = (2 * R + gap) * math.sqrt(3) / 2
    for row in range(5):
        for j in range(row + 1):
            b.append(("red", apex + row * dx, MIDY + (j - row / 2) * (2 * R + gap)))
    return b


def mid_frame():
    reds = [(2890, 610), (3010, 1210), (2760, 960), (3140, 820), (2560, 1330), (2380, 520), (3320, 1050), (1980, 1180), (2700, 1500)]
    b = [("red", x, y) for x, y in reds]
    b += [(k, SPOTS[k][0], SPOTS[k][1]) for k in ["yellow", "green", "brown", "blue", "pink"]]
    b += [("black", SPOTS["black"][0], SPOTS["black"][1]), ("white", 2930, 980)]
    return b


def clearance():
    return [("pink", 2840, 700), ("black", SPOTS["black"][0], SPOTS["black"][1]), ("blue", 1580, 1040), ("white", 2470, 860)]


def svg(balls, portrait=False):
    pad = 70
    vx, vy, vw, vh = -M - pad, -M - pad, L + 2 * M + 2 * pad, W + 2 * M + 2 * pad
    body = table(balls)
    if portrait:  # baulk at the bottom, black end at the top
        body = '<g transform="matrix(0 -1 1 0 0 %g)">%s</g>' % (L, body)
        vx, vy, vw, vh = -M - pad, -M - pad, W + 2 * M + 2 * pad, L + 2 * M + 2 * pad
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%g %g %g %g" role="img" aria-label="A snooker table seen from above">%s%s</svg>'
            % (vx, vy, vw, vh, defs(), body))


LAYOUTS = {"break": break_off(), "frame": mid_frame(), "clearance": clearance()}
for name, balls in LAYOUTS.items():
    for portrait in (False, True):
        fn = "table-%s%s.svg" % (name, "-portrait" if portrait else "")
        with open(os.path.join(OUT, fn), "w") as fh:
            fh.write(svg(balls, portrait))
        print(fn, os.path.getsize(os.path.join(OUT, fn)))
