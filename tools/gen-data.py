#!/usr/bin/env python3
"""Generates src/js/data.js — sample data for the League Snooker prototypes.

Real: league names, Cambridge & District Division 1 team names, club names and
postcodes, and Division 1 results for weeks 1-3 (as published on
leaguesnooker.co.uk on 15 October 2026). Everything else is invented sample
data and is labelled as such in the prototypes. Player names are invented.

Run: python3 tools/gen-data.py
"""
import json, random, datetime, itertools, os

random.seed(1903)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------- leagues
# x/y are positions on a schematic map of Great Britain (0-100 each way).
L = [
 # id, name, sport, town, region, night, format, flags, x, y
 ("andover","Andover & District Snooker League","Snooker","Andover","South","Tue","Team",[],52,82),
 ("basingstoke","Basingstoke & District Snooker League","Snooker","Basingstoke","South","Wed","Team",[],55,80),
 ("bishops-stortford","Bishops Stortford & District Snooker League","Snooker","Bishop's Stortford","East of England","Thu","Team",[],68,70),
 ("bolton","Bolton & District Snooker League","Snooker","Bolton","North West","Tue","Team",[],44,52),
 ("bury-st-edmunds-billiards","Bury St Edmunds & District Billiards League","Billiards","Bury St Edmunds","East of England","Mon","Team",[],72,66),
 ("bury-st-edmunds","Bury St Edmunds & District Snooker League","Snooker","Bury St Edmunds","East of England","Wed","Team",[],72,65),
 ("cambridge-billiards","Cambridge & District Billiards League","Billiards","Cambridge","East of England","Tue","Team",[],67,66),
 ("cambridge","Cambridge & District Snooker League","Snooker","Cambridge","East of England","Fri","Team",[],66,67),
 ("crowborough","Crowborough & District Billiards & Snooker League","Snooker","Crowborough","South East","Wed","Team",[],66,84),
 ("east-dorset","East Dorset Snooker League","Snooker","Wimborne","South West","Thu","Team",[],47,86),
 ("eccles","Eccles & District Snooker League","Snooker","Eccles","North West","Mon","Team",[],44,54),
 ("exeter","Exeter & District Snooker League","Snooker","Exeter","South West","Wed","Team",[],36,87),
 ("folkestone","Folkestone Snooker League","Snooker","Folkestone","South East","Tue","Team",[],75,83),
 ("folkestone-veterans","Folkestone Veterans Snooker League","Snooker","Folkestone","South East","Thu","Team",["veterans"],76,82),
 ("formby-handicap","Formby & District Handicap Snooker League","Snooker","Formby","North West","Wed","Team",["handicap"],39,52),
 ("fylde-thursday","Fylde Private Clubs Snooker League - Thursday","Snooker","Blackpool","North West","Thu","Team",[],39,48),
 ("fylde-tuesday","Fylde Private Clubs Snooker League - Tuesday","Snooker","Blackpool","North West","Tue","Team",[],40,47),
 ("gloucester","Gloucester Snooker League","Snooker","Gloucester","South West","Mon","Team",[],44,73),
 ("guildford","Guildford & District Snooker League","Snooker","Guildford","South East","Tue","Team",[],60,81),
 ("kings-lynn","Kings Lynn Snooker League","Snooker","King's Lynn","East of England","Thu","Team",[],68,60),
 ("liverpool-conservative","Liverpool Conservative Snooker League","Snooker","Liverpool","North West","Wed","Team",[],40,54),
 ("malvern","Malvern & District Snooker League","Snooker","Malvern","West Midlands","Tue","Team",[],43,69),
 ("newbury","Newbury Snooker League","Snooker","Newbury","South","Thu","Team",[],53,78),
 ("newcastle-east-end","Newcastle East End Snooker League","Snooker","Newcastle upon Tyne","North East","Mon","Team",[],50,30),
 ("norwich-billiards","Norwich & District Billiards League","Billiards","Norwich","East of England","Mon","Team",[],77,61),
 ("norwich-handicap","Norwich & District Handicap League","Snooker","Norwich","East of England","Wed","Team",["handicap"],78,62),
 ("okehampton","Okehampton & District Snooker League","Snooker","Okehampton","South West","Tue","Team",[],32,87),
 ("ormskirk","Ormskirk & District Amateur Snooker League","Snooker","Ormskirk","North West","Thu","Team",[],41,52),
 ("plymouth","Plymouth & District Snooker League (Tue)","Snooker","Plymouth","South West","Tue","Team",[],31,90),
 ("plymouth-billiards","Plymouth Billiards League","Billiards","Plymouth","South West","Wed","Team",[],30,91),
 ("preston-veterans","Preston & District Veterans Snooker League","Snooker","Preston","North West","Wed","Team",["veterans"],42,48),
 ("reading","Reading & District Billiards & Snooker League","Snooker","Reading","South","Mon","Team",[],56,78),
 ("rugby","Rugby & District Snooker League","Snooker","Rugby","West Midlands","Thu","Team",[],53,66),
 ("southport-summer","Southport Summer Snooker League","Snooker","Southport","North West","Tue","Team",["summer"],39,50),
 ("stourbridge","Stourbridge & District Snooker League","Snooker","Stourbridge","West Midlands","Mon","Team",[],45,65),
 ("swaffham-veterans","Swaffham Veterans Billiards League","Billiards","Swaffham","East of England","Thu","Team",["veterans"],71,61),
 ("thames-valley","Thames Valley Snooker League","Snooker","Maidenhead","South","Wed","Team",[],59,77),
 ("torbay-summer","Torbay & District Summer League","Snooker","Torquay","South West","Thu","Team",["summer"],36,90),
 ("torbay-champions","Torbay Snooker Champions League","Snooker","Torquay","South West","Sun","Singles",[],37,89),
 ("tunbridge-wells","Tunbridge Wells & District Snooker League","Snooker","Tunbridge Wells","South East","Thu","Team",[],67,82),
 ("widnes","Widnes & District Snooker League","Snooker","Widnes","North West","Mon","Team",[],42,55),
 ("wirral","Wirral Amateur Snooker League","Snooker","Birkenhead","North West","Tue","Team",[],39,55),
]
leagues = []
for (i, n, sp, town, reg, night, fmt, flags, x, y) in L:
    leagues.append(dict(id=i, name=n, sport=sp, town=town, region=reg, night=night, format=fmt,
                        handicap="handicap" in flags or random.random() < .3,
                        veterans="veterans" in flags, summer="summer" in flags,
                        divisions=1 if fmt == "Singles" else random.choice([1, 2, 2, 3, 4]),
                        teams=random.randint(8, 30), x=x, y=y))
for l in leagues:
    if l["id"] == "cambridge":
        l.update(divisions=2, teams=20, handicap=True)

# Outward postcodes to schematic positions, for the postcode search
POSTCODES = {"CB": (66, 67), "PE": (66, 62), "NR": (77, 61), "IP": (74, 67), "CO": (72, 70), "L": (40, 54),
             "M": (45, 54), "BL": (44, 52), "PR": (42, 48), "FY": (39, 48), "WA": (42, 55), "CH": (39, 55),
             "PL": (31, 90), "EX": (36, 87), "TQ": (36, 90), "BH": (47, 86), "RG": (56, 78), "GU": (60, 81),
             "SP": (51, 82), "TN": (67, 82), "CT": (75, 83), "GL": (44, 73), "WR": (43, 69), "DY": (45, 65),
             "CV": (53, 66), "NE": (50, 30), "SG": (66, 70), "CM": (68, 71), "SL": (59, 77), "B": (47, 65),
             "LS": (50, 46), "S": (51, 52), "OX": (54, 74)}

# ---------------------------------------------------------------- Cambridge
div1 = ["Whittlesford 2", "Cheveley Road (Thurs)", "JP's", "Bluntisham", "Whittlesford",
        "East Road Social Club OAPs", "Histon RBL", "Sawston 3", "Newton 2", "Newton 1"]
div2 = ["Cottenham Con", "Waterbeach", "Saffron A", "Newnham Croft", "Salisbury Club",
        "NCI", "Arrington", "147 Huntingdon", "Cambridge Snooker Centre", "New Astley"]
club_of = {"Whittlesford 2": "whittlesford", "Whittlesford": "whittlesford", "Cheveley Road (Thurs)": "cheveley-road",
           "JP's": "jps", "Bluntisham": "bluntisham", "East Road Social Club OAPs": "cambridge-wmc",
           "Histon RBL": "histon-rbl", "Sawston 3": "sawston", "Newton 2": "newton", "Newton 1": "newton",
           "Cottenham Con": "cottenham", "Waterbeach": "waterbeach", "Saffron A": "saffron",
           "Newnham Croft": "newnham-croft", "Salisbury Club": "salisbury", "NCI": "nci", "Arrington": "arrington",
           "147 Huntingdon": "147-huntingdon", "Cambridge Snooker Centre": "cambridge-snooker-centre",
           "New Astley": "new-astley"}
clubs = [
 ("147-huntingdon","147 Huntingdon Snooker Centre","PE29 3PN","01480 411640",8),
 ("arrington","Arrington Club","SG8 0AH","01223 207913",1),
 ("bluntisham","Bluntisham Ex-Servicemens Club","PE28 3LE","01480 350920",2),
 ("cambridge-snooker-centre","Cambridge Snooker Centre","CB1 3EW","01223 249661",12),
 ("cambridge-wmc","Cambridge Working Mens Club","CB1 1DB","01223 353786",3),
 ("cheveley-road","Cheveley Road","CB8 8AD","01638 662891",2),
 ("cottenham","Cottenham Conservative Club","CB4 4RX","01954 251457",2),
 ("histon-rbl","Histon Royal British Legion","CB4 9LJ","01223 233447",2),
 ("jps","JP's","PE16 6BA","01354 699967",4),
 ("nci","N.C.I. Sports & Social Club","CB4 3DL","01223 352342",2),
 ("new-astley","New Astley Club","CB8 8NT","07876 768444",1),
 ("newnham-croft","Newnham Croft Club","CB3 9JA","01223 361469",1),
 ("newton","Newton Sports & Social Club","CB22 7PA","01223 871898",2),
 ("saffron","Saffron Snooker Club","CB11 3AQ","01799 513094",6),
 ("salisbury","Salisbury Club","CB1 3NF","01223 248734",2),
 ("sawston","Sawston C.I","CB22 3HJ","01223 834645",2),
 ("waterbeach","Waterbeach Social Club","CB25 9NJ","01223 860033",1),
 ("whittlesford","Whittlesford Social Club","CB22 4LT","01223 832231",2),
]
clubs = [dict(id=a, name=b, postcode=c, phone=d, tables=e,
              teams=[t for t in div1 + div2 if club_of[t] == a]) for (a, b, c, d, e) in clubs]

FIRST = ["Alan","Barry","Chris","Dave","Ed","Frank","Gary","Harry","Ian","Jack","Kev","Lee","Mark","Neil","Owen",
         "Paul","Ray","Steve","Tony","Wes","Dan","Rob","Phil","Sam","Mo","Tom","Joe","Gav","Ken","Rich","Liam","Aaron",
         "Ben","Carl","Darren","Jordan","Kieran","Nathan","Ollie","Ryan","Shaun","Vic","Jas","Amir","Pete","Graham"]
LAST = ["Abbott","Barker","Cole","Dawson","Ellis","Fenwick","Gibbs","Harding","Ingram","Jarvis","Keane","Lowe",
        "Marsh","Nolan","Osborne","Pike","Quinn","Rowe","Shaw","Turner","Vaughan","Walsh","Yates","Begum","Okafor",
        "Moss","Hale","Doyle","Price","Fisher","Lamb","Riley","Sutton","Webb","Kerr","Bishop","Clarke","Dunn","Ford",
        "Grant","Hayes","Irwin","Joyce","Knight","Lyons","Mercer","Norris","Pearce","Reeves","Stone","Tate","Wade",
        "Bond","Carter","Daly","Ennis","Frost","Gough","Holt","Iles","Judd","Kemp","Lord","Mann","Nash","Oakes",
        "Parr","Rudd","Sharp","Toms","Underwood","Vine","Wren","Young"]
used = set()
def name():
    while True:
        n = random.choice(FIRST) + " " + random.choice(LAST)
        if n not in used:
            used.add(n); return n
def slug(s): return "".join(c if c.isalnum() else "-" for c in s.lower()).strip("-").replace("--", "-")

players, team_players = {}, {}
for t in div1 + div2:
    team_players[t] = []
    for k in range(6):
        n = name(); pid = slug(n)
        hcp = random.choice([None, None, -10, -20, -30, 0, 10, 20, 30, 40, -40, -55]) if True else None
        players[pid] = dict(id=pid, name=n, team=t, division=1 if t in div1 else 2,
                            hcp=hcp, since=random.randint(2006, 2025))
        team_players[t].append(pid)
# the featured player used across the prototypes
feat = team_players["Sawston 3"][0]
players[feat].update(name="Lewis Fenwick", hcp=-10, since=2017)
players["lewis-fenwick"] = players.pop(feat); players["lewis-fenwick"]["id"] = "lewis-fenwick"
team_players["Sawston 3"][0] = "lewis-fenwick"
riv = team_players["JP's"][0]
players[riv].update(name="Dan Okafor", hcp=-20, since=2012)
players["dan-okafor"] = players.pop(riv); players["dan-okafor"]["id"] = "dan-okafor"
team_players["JP's"][0] = "dan-okafor"

# ---------------------------------------------------------------- fixtures
start = datetime.date(2026, 9, 25)
skip = {datetime.date(2026, 12, 25), datetime.date(2027, 1, 1)}
cup_weeks = {6: "Tony Mitchell Cup, round 1", 11: "Ted Newton Snooker Handicap", 15: "NCI Centenary Cup, quarter-finals"}
def week_dates(n):
    d, out = start, []
    while len(out) < n:
        if d not in skip: out.append(d)
        d += datetime.timedelta(days=7)
    return out

REAL = {  # Division 1, weeks 1-3, as published (home, away, home frames, away frames)
 1: [("Sawston 3","JP's",4,6),("Bluntisham","Cheveley Road (Thurs)",5,5),("Newton 1","Whittlesford 2",1,9),
     ("Histon RBL","Newton 2",5,5),("Whittlesford","East Road Social Club OAPs",6,4)],
 2: [("Cheveley Road (Thurs)","Sawston 3",6,4),("JP's","Newton 1",None,None),("Whittlesford","Bluntisham",6,4),
     ("Newton 2","Whittlesford 2",3,7),("East Road Social Club OAPs","Histon RBL",6,4)],
 3: [("JP's","Newton 2",10,0),("Whittlesford 2","East Road Social Club OAPs",7,3),("Histon RBL","Bluntisham",3,7),
     ("Cheveley Road (Thurs)","Whittlesford",8,2),("Newton 1","Sawston 3",6,4)],
}

def complete_rr(teams, fixed_rounds):
    used = {frozenset((h, a)) for r in fixed_rounds for (h, a) in r}
    def matchings(left):
        if not left:
            yield []; return
        a = left[0]
        opts = [b for b in left[1:] if frozenset((a, b)) not in used]
        random.shuffle(opts)
        for b in opts:
            for rest in matchings([x for x in left if x not in (a, b)]):
                yield [(a, b) if random.random() < .5 else (b, a)] + rest
    def solve(rounds):
        if len(rounds) == len(teams) - 1: return rounds
        for m in matchings(list(teams)):
            for (h, a) in m: used.add(frozenset((h, a)))
            res = solve(rounds + [m])
            if res: return res
            for (h, a) in m: used.discard(frozenset((h, a)))
        return None
    return solve([list(r) for r in fixed_rounds])

def schedule(teams, fixed):
    first = complete_rr(teams, fixed)
    second = [[(a, h) for (h, a) in r] for r in first]
    return first + second

def gen_match(home, away, hf=None, af=None, played=True):
    hp, ap = team_players[home][:], team_players[away][:]
    random.shuffle(hp); random.shuffle(ap)
    if hf is None:
        hf = sum(random.random() < .5 for _ in range(10)); af = 10 - hf
    # split frames across five pairings, two frames each
    splits = [0] * 5; rem = hf
    order = list(range(5)); random.shuffle(order)
    while rem:
        i = random.choice([j for j in order if splits[j] < 2]); splits[i] += 1; rem -= 1
    games = []
    for i in range(5):
        hb, ab = [], []
        for _ in range(2):
            r = random.random()
            if r < .35: hb.append(random.randint(20, 45))
            if r > .65: ab.append(random.randint(20, 45))
        if random.random() < .06: (hb if splits[i] else ab).append(random.choice([101, 104, 108, 112, 116, 122]))
        games.append(dict(h=hp[i], a=ap[i], hf=splits[i], af=2 - splits[i], hb=sorted(hb, reverse=True), ab=sorted(ab, reverse=True)))
    return dict(hf=hf, af=af, games=games)

TODAY = datetime.date(2026, 10, 15)
fixtures = []
mid = 0
for div, teams, fixed in [(1, div1, [[(h, a) for (h, a, *_r) in REAL[w]] for w in (1, 2, 3)]), (2, div2, [])]:
    rounds = schedule(teams, fixed)
    weeks = []
    dates = week_dates(len(rounds) + 6)
    w = 0; di = 0
    for r in rounds:
        while (di + 1) in cup_weeks: di += 1
        weeks.append((di + 1, dates[di], r)); di += 1
    for (wk, d, r) in weeks:
        for (h, a) in r:
            mid += 1
            f = dict(id=f"m{mid}", div=div, week=wk, date=d.isoformat(), home=h, away=a,
                     venue=club_of[h], status="fixture")
            if d <= TODAY:
                real = next((x for x in REAL.get(wk, []) if x[0] == h and x[1] == a), None) if div == 1 else None
                if real and real[2] is None:
                    f["status"] = "due"
                else:
                    m = gen_match(h, a, real[2] if real else None, real[3] if real else None)
                    f.update(status="result", **m)
            fixtures.append(f)

# Lewis Fenwick's 104 at Cheveley Road on 2 October (the featured match card)
for f in fixtures:
    if f["div"] == 1 and f["week"] == 2 and f["home"] == "Cheveley Road (Thurs)":
        gi = next((i for i, g in enumerate(f["games"]) if g["a"] == "lewis-fenwick"), None)
        if gi is None:
            gi = next(i for i, g in enumerate(f["games"]) if g["af"] >= 1)
            f["games"][gi]["a"] = "lewis-fenwick"
        elif f["games"][gi]["af"] == 0:
            j = next(i for i, g in enumerate(f["games"]) if g["af"] >= 1)
            f["games"][gi]["a"], f["games"][j]["a"] = f["games"][j]["a"], f["games"][gi]["a"]; gi = j
        f["games"][gi]["ab"] = [104] + [b for b in f["games"][gi]["ab"] if b < 100]
        # keep each away player unique within the match
        names = [g["a"] for g in f["games"]]
        if names.count("lewis-fenwick") > 1:
            spare = [x for x in team_players["Sawston 3"] if x not in names]
            for i, g in enumerate(f["games"]):
                if g["a"] == "lewis-fenwick" and i != gi: g["a"] = spare.pop()
        FEATURED = f["id"]

# a live match on week 4 night is shown in the live prototype; nothing stored here
cupweeks = [dict(week=k, date=week_dates(30)[k - 1].isoformat(), label=v) for k, v in cup_weeks.items()]

# ---------------------------------------------------------------- tables
def table(div):
    teams = div1 if div == 1 else div2
    rows = {t: dict(team=t, p=0, w=0, d=0, l=0, f=0, a=0, form=[]) for t in teams}
    hist = []
    for f in sorted([f for f in fixtures if f["div"] == div and f["status"] == "result"], key=lambda f: f["week"]):
        for t, us, them in ((f["home"], f["hf"], f["af"]), (f["away"], f["af"], f["hf"])):
            r = rows[t]; r["p"] += 1; r["f"] += us; r["a"] += them
            res = "W" if us > them else "L" if us < them else "D"
            r[{"W": "w", "L": "l", "D": "d"}[res]] += 1; r["form"].append(res)
    return rows

def ordered(rows):  # this league ranks on frames for, then against
    return sorted(rows.values(), key=lambda r: (-r["f"], r["a"], r["team"]))

tables = {}
for div in (1, 2):
    rows = table(div)
    order = ordered(rows)
    # movement since last week: recompute excluding latest week
    last = max(f["week"] for f in fixtures if f["div"] == div and f["status"] == "result")
    prev = {t: dict(f=0, a=0) for t in rows}
    for f in fixtures:
        if f["div"] == div and f["status"] == "result" and f["week"] < last:
            prev[f["home"]]["f"] += f["hf"]; prev[f["home"]]["a"] += f["af"]
            prev[f["away"]]["f"] += f["af"]; prev[f["away"]]["a"] += f["hf"]
    porder = [t for t, _ in sorted(prev.items(), key=lambda kv: (-kv[1]["f"], kv[1]["a"], kv[0]))]
    for i, r in enumerate(order):
        r["pos"] = i + 1; r["move"] = porder.index(r["team"]) + 1 - (i + 1)
        r["form"] = r["form"][-5:]
    tables[div] = order

# ---------------------------------------------------------------- player stats (this season)
for p in players.values():
    p.update(pl=0, w=0, d=0, l=0, ff=0, fa=0, hb=None, breaks=[])
for f in fixtures:
    if f["status"] != "result": continue
    for g in f["games"]:
        for pid, us, them, bs, opp in ((g["h"], g["hf"], g["af"], g["hb"], g["a"]), (g["a"], g["af"], g["hf"], g["ab"], g["h"])):
            p = players[pid]; p["pl"] += 1; p["ff"] += us; p["fa"] += them
            p["w" if us > them else "l" if us < them else "d"] += 1
            for b in bs:
                p["breaks"].append(dict(b=b, match=f["id"], date=f["date"], opp=opp))
                p["hb"] = max(p["hb"] or 0, b)

# ---------------------------------------------------------------- careers (sample)
SEASONS = []
y = 2005
while y <= 2026:
    if y != 2020:  # no 2020/21 season was listed on the live site
        SEASONS.append(f"{y}/{str(y + 1)[2:]}")
    y += 1
for p in players.values():
    hist = []
    start_season = max(p["since"], 2005)
    hcp = (p["hcp"] or 0) + random.choice([-10, 0, 10, 20])
    for s in SEASONS[:-1]:
        if int(s[:4]) < start_season: continue
        fr = random.choice([20, 24, 28, 32, 36])
        won = int(fr * random.uniform(.3, .75))
        hist.append(dict(season=s, team=p["team"] if random.random() < .7 else random.choice(div1 + div2),
                         league="Cambridge & District Snooker League", frames=fr, won=won,
                         hb=random.randint(30, 95) if random.random() < .9 else random.choice([101, 108, 117, 124]),
                         hcp=hcp))
        hcp += random.choice([-10, -5, 0, 0, 5])
    p["career"] = hist[-12:]
fen = players["lewis-fenwick"]
fen["career"].insert(0, dict(season="2016/17", team="Saffron A", league="Bury St Edmunds & District Snooker League",
                             frames=30, won=14, hb=67, hcp=10))
fen["aliases"] = ["Lewis Fenwick (-10)", "L Fenwick K", "Lewis Fenwick [-15]"]
fen["centuries"] = [dict(b=104, date="2026-10-02", note="v Cheveley Road (Thurs)"),
                    dict(b=117, date="2025-02-14", note="v Histon RBL"), dict(b=108, date="2024-11-08", note="v Newton 1")]
okf = players["dan-okafor"]
okf["aliases"] = ["Dan Okafor -20", "D Okafor"]
H2H = [dict(date="2026-09-25", season="2026/27", a=1, b=1, hb_a=31, hb_b=None),
       dict(date="2026-02-20", season="2025/26", a=2, b=0, hb_a=72, hb_b=40),
       dict(date="2025-10-17", season="2025/26", a=0, b=2, hb_a=None, hb_b=55),
       dict(date="2025-03-07", season="2024/25", a=1, b=1, hb_a=117, hb_b=48),
       dict(date="2024-11-29", season="2024/25", a=2, b=0, hb_a=38, hb_b=None),
       dict(date="2023-12-01", season="2023/24", a=0, b=2, hb_a=None, hb_b=63)]

# ---------------------------------------------------------------- hall of fame (sample, all leagues)
hall = []
for _ in range(60):
    lg = random.choice(leagues)
    b = random.choice([100, 101, 102, 104, 105, 107, 108, 110, 112, 115, 117, 120, 124, 127, 131, 135, 138, 140, 143])
    s = random.choice(SEASONS[-8:])
    hall.append(dict(player=name(), league=lg["name"], lid=lg["id"], b=b, season=s))
hall += [dict(player=name(), league="Thames Valley Snooker League", lid="thames-valley", b=147, season="2015/16"),
         dict(player=name(), league="Stourbridge & District Snooker League", lid="stourbridge", b=147, season="2025/26")]
hall += [dict(player="Lewis Fenwick", league="Cambridge & District Snooker League", lid="cambridge", b=c["b"],
              season={"2026": "2026/27", "2025": "2024/25", "2024": "2024/25"}[c["date"][:4]], pid="lewis-fenwick")
         for c in fen["centuries"]]
hall.sort(key=lambda h: -h["b"])

# ---------------------------------------------------------------- cups (sample)
mitchell = [pid for t in div1 + div2 for pid in team_players[t][:1]][:16]
mitchell[0] = "lewis-fenwick"
cups = dict(
  mitchell=dict(name="Tony Mitchell Cup", kind="Singles knockout", rounds=["Last 16", "Quarter-finals", "Semi-finals", "Final"],
                entrants=mitchell, next="Last 16 to be played week 6, Friday 30 October, at the higher-placed player's club"),
  nci=dict(name="NCI Centenary Cup", kind="Team knockout", rounds=["Quarter-finals", "Semi-finals", "Final"],
           entrants=div1[:8], next="Quarter-finals week 15, Friday 8 January, at neutral clubs"),
  newton=dict(name="Ted Newton Snooker Handicap", kind="Handicap singles", rounds=[], entrants=[], next="Week 11, Friday 4 December"),
  daily=dict(name="The Cambridge Daily News Cup", kind="Pairs knockout", rounds=[], entrants=[], next="Draw in January"))

# ---------------------------------------------------------------- archive (sample winners)
archive = []
for s in SEASONS[:-1][::-1]:
    archive.append(dict(season=s, div1=random.choice(div1), div2=random.choice(div2),
                        hb=random.randint(96, 137), teams=random.randint(16, 26)))

out = dict(today=TODAY.isoformat(), leagues=leagues, postcodes=POSTCODES, clubs=clubs, div={"1": div1, "2": div2},
           players=players, teamPlayers=team_players, fixtures=fixtures, cupWeeks=cupweeks,
           tables={str(k): v for k, v in tables.items()}, seasons=SEASONS, h2h=H2H, hall=hall, cups=cups,
           archive=archive, featuredMatch=FEATURED)
with open(os.path.join(ROOT, "src", "js", "data.js"), "w") as fh:
    fh.write("/* Sample data for the League Snooker prototypes. Generated by tools/gen-data.py; do not edit by hand.\n"
             "   Real: league, team and club names, club postcodes, Division 1 results for weeks 1-3.\n"
             "   Invented: player names, all other results, breaks, careers, cups and archive winners. */\n")
    fh.write("window.LS = " + json.dumps(out, separators=(",", ":")) + ";\n")
print("players", len(players), "fixtures", len(fixtures), "results", sum(f["status"] == "result" for f in fixtures))
print([ (r["team"], r["f"], r["a"], r["move"]) for r in tables[1]])
