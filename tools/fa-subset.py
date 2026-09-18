#!/usr/bin/env python3
"""
Régénère un subset FontAwesome minimal pour le site Thalia's Traiteur.

Il scanne le HTML **et** les JS applicatifs pour lister les icônes réellement
utilisées (y compris celles injectées dynamiquement), puis :
  - sous-ensemble les 3 polices (solid / regular / brands) aux seuls glyphes utiles,
  - génère css/all.min.css (règles + @font-face) au lieu des 455 Ko d'origine,
  - applique un cache-busting (?v=hash) sur le CSS et les polices, réécrit dans le HTML,
    pour qu'une régénération soit toujours prise en compte par les navigateurs.

Fiabilité : chaque icône est incluse dans TOUTES les familles dont la police
contient le glyphe → aucune ambiguïté fas/far/fab, aucune icône « carré vide ».

Usage :
    python3 tools/fa-subset.py

Prérequis : fonttools (`pip install fonttools brotli`). Les polices complètes et
le CSS FontAwesome d'origine vivent dans tools/fa-src/ (hors dossier déployé).
"""
import os, re, sys, glob, hashlib, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = os.path.join(ROOT, "ThaliasTraiteur")
SRC  = os.path.join(HERE, "fa-src")            # polices + CSS complets (non déployés)
WF   = os.path.join(SITE, "webfonts")
OUT_CSS = os.path.join(SITE, "css", "all.min.css")

# famille -> (ttf source, woff2 subset, font-family CSS, weight)
FAMILIES = [
    ("solid",   "fa-solid-900.ttf",   "fa-solid-900.subset.woff2",   "Font Awesome 6 Pro",    900),
    ("regular", "fa-regular-400.ttf", "fa-regular-400.subset.woff2", "Font Awesome 6 Pro",    400),
    ("brands",  "fa-brands-400.ttf",  "fa-brands-400.subset.woff2",  "Font Awesome 6 Brands", 400),
]

# classes FA qui ne sont PAS des icônes (styles/modificateurs) -> à ignorer
MODIFIERS = {
    "fa", "fas", "far", "fab", "fal", "fat", "fad",
    "fa-solid", "fa-regular", "fa-brands", "fa-light", "fa-thin", "fa-duotone", "fa-sharp",
    "fa-fw", "fa-ul", "fa-li", "fa-border", "fa-pull-left", "fa-pull-right",
    "fa-spin", "fa-spin-pulse", "fa-spin-reverse", "fa-pulse",
    "fa-beat", "fa-fade", "fa-beat-fade", "fa-bounce", "fa-flip", "fa-shake",
    "fa-inverse", "fa-stack", "fa-stack-1x", "fa-stack-2x", "fa-layers", "fa-rotate-by",
    "fa-flip-horizontal", "fa-flip-vertical", "fa-flip-both",
    "fa-rotate-90", "fa-rotate-180", "fa-rotate-270",
    "fa-2xs", "fa-xs", "fa-sm", "fa-lg", "fa-xl", "fa-2xl",
    "fa-1x", "fa-2x", "fa-3x", "fa-4x", "fa-5x", "fa-6x", "fa-7x", "fa-8x", "fa-9x", "fa-10x",
}

def log(m): print(m)

def collect_icons():
    """Tous les tokens fa-xxx présents dans le HTML + JS applicatifs (hors *.min.js)."""
    files = glob.glob(os.path.join(SITE, "*.html"))
    files += [f for f in glob.glob(os.path.join(SITE, "js", "*.js")) if not f.endswith(".min.js")]
    tok = re.compile(r"fa-[a-z][a-z0-9-]*")
    icons = set()
    for path in files:
        with open(path, encoding="utf-8", errors="ignore") as fh:
            for t in tok.findall(fh.read()):
                if t not in MODIFIERS:
                    icons.add(t)
    return icons

def parse_codepoints(css_text):
    """nom_icone -> codepoint hex, en gérant les sélecteurs groupés/alias."""
    m = {}
    rule = re.compile(r'((?:\.fa-[a-z0-9-]+:before\s*,?\s*)+)\{content:"\\([0-9a-fA-F]+)"\}')
    for sel, cp in rule.findall(css_text):
        for name in re.findall(r'\.(fa-[a-z0-9-]+):before', sel):
            m[name] = cp.lower()
    return m

def font_codepoints(ttf_path):
    from fontTools.ttLib import TTFont
    f = TTFont(ttf_path)
    cps = set()
    for t in f["cmap"].tables:
        cps |= set(t.cmap.keys())
    return cps

def main():
    if not os.path.isdir(SRC):
        sys.exit("ERREUR : sources absentes -> " + SRC)
    full_css = open(os.path.join(SRC, "all.min.css"), encoding="utf-8").read()
    name_cp = parse_codepoints(full_css)

    icons = collect_icons()
    resolved, unknown = {}, []
    for ic in sorted(icons):
        cp = name_cp.get(ic)
        if cp is None:
            unknown.append(ic)
        else:
            resolved[ic] = int(cp, 16)
    if unknown:
        log("Ignorés (pas d'icône FA connue) : " + ", ".join(unknown))
    log("Icônes utilisées : %d" % len(resolved))

    # codepoints par famille : on inclut chaque glyphe dans TOUTES les familles qui l'ont
    fam_cmap = {key: font_codepoints(os.path.join(SRC, ttf)) for key, ttf, *_ in FAMILIES}
    fam_cps = {key: set() for key, *_ in FAMILIES}
    for ic, cp in resolved.items():
        for key in fam_cps:
            if cp in fam_cmap[key]:
                fam_cps[key].add(cp)

    # 1) subset des polices
    font_bytes = b""
    used_fams = []
    for key, ttf, sub, family, weight in FAMILIES:
        cps = fam_cps[key]
        if not cps:
            continue
        src = os.path.join(SRC, ttf)
        out = os.path.join(WF, sub)
        unicodes = ",".join("U+%04X" % c for c in sorted(cps))
        subprocess.run([sys.executable, "-m", "fontTools.subset", src,
                        "--unicodes=" + unicodes, "--flavor=woff2",
                        "--output-file=" + out, "--no-hinting", "--desubroutinize"],
                       check=True)
        font_bytes += open(out, "rb").read()
        used_fams.append((key, sub, family, weight, len(cps)))
        log("  %-7s %2d glyphes -> %s (%d o)" % (key, len(cps), sub, os.path.getsize(out)))

    # 2) CSS (avec placeholder de version pour le cache-busting)
    lines = ["/* FontAwesome — subset auto-généré par tools/fa-subset.py (NE PAS éditer à la main) */"]
    for key, sub, family, weight, n in used_fams:
        lines.append('@font-face{font-family:"%s";font-style:normal;font-weight:%d;'
                     'font-display:swap;src:url(../webfonts/%s?v=__V__) format("woff2")}'
                     % (family, weight, sub))
    lines.append('.fa,.fas,.far,.fab,.fa-solid,.fa-regular,.fa-brands{'
                 '-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;'
                 'display:var(--fa-display,inline-block);font-style:normal;font-variant:normal;'
                 'line-height:1;text-rendering:auto}')
    lines.append('.fas,.fa-solid{font-family:"Font Awesome 6 Pro";font-weight:900}')
    lines.append('.far,.fa-regular{font-family:"Font Awesome 6 Pro";font-weight:400}')
    lines.append('.fab,.fa-brands{font-family:"Font Awesome 6 Brands";font-weight:400}')
    lines.append('.fa-fw{text-align:center;width:1.25em}.fa-lg{font-size:1.25em;line-height:.05em;vertical-align:-.075em}')
    lines.append('.fa-2x{font-size:2em}.fa-3x{font-size:3em}')
    lines.append('.fa-spin{animation:fa-spin 2s linear infinite}.fa-pulse{animation:fa-spin 1s steps(8) infinite}'
                 '@keyframes fa-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}')
    for ic in sorted(resolved):
        lines.append('.%s:before{content:"\\%s"}' % (ic, ("%x" % resolved[ic])))
    css_body = "\n".join(lines) + "\n"

    # 3) version = hash(contenu CSS + polices) -> change dès qu'une icône change
    version = hashlib.sha256((css_body + str(len(font_bytes))).encode() + font_bytes).hexdigest()[:8]
    open(OUT_CSS, "w", encoding="utf-8").write(css_body.replace("__V__", version))
    log("CSS écrit : %s (%d o), version %s" % (OUT_CSS, os.path.getsize(OUT_CSS), version))

    # 4) cache-busting du lien all.min.css dans tout le HTML
    link = re.compile(r'(href=")css/all\.min\.css(?:\?v=[0-9a-f]+)?(")')
    changed = 0
    for html in glob.glob(os.path.join(SITE, "*.html")):
        s = open(html, encoding="utf-8").read()
        ns = link.sub(r'\1css/all.min.css?v=' + version + r'\2', s)
        if ns != s:
            open(html, "w", encoding="utf-8").write(ns); changed += 1
    log("Liens HTML mis à jour (?v=%s) : %d page(s)" % (version, changed))
    log("OK ✔  (%d icônes, %d police(s))" % (len(resolved), len(used_fams)))

if __name__ == "__main__":
    main()
