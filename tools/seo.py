#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
seo.py — génère/normalise les métadonnées SEO du site ThaliasTraiteur.

Idempotent : relançable autant de fois que voulu, le résultat est stable.

    python3 tools/seo.py

⚠️  QUAND LE NOM DE DOMAINE SERA ACHETÉ : change SITE_URL ci-dessous,
    relance le script, et crée le fichier ThaliasTraiteur/CNAME.
"""

import io, json, os, re, sys
from datetime import date

# ─────────────────────────────────────────────────────────────────────────────
#  ⬇⬇⬇  LA SEULE LIGNE À CHANGER LE JOUR DU NOM DE DOMAINE  ⬇⬇⬇
SITE_URL = "https://dovrom.github.io/ThaliasTraiteur"
#  ex. plus tard :  SITE_URL = "https://thaliastraiteur.ca"
# ─────────────────────────────────────────────────────────────────────────────

ROOT    = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SITE    = os.path.join(ROOT, "ThaliasTraiteur")
LANG    = "fr-CA"
OG_IMG  = "img/banner-img.webp"

# title / description retravaillés pour cibler les requêtes réelles.
# desc ≈ 150-160 caractères (au-delà, Google tronque).
PAGES = {
    "index.html": dict(
        prio="1.0", freq="weekly",
        title="Traiteur ivoirien & africain au Québec | Thalia's Traiteur",
        desc="Traiteur ivoirien au Québec : tchep, attiéké, garba et cuisine du monde, faits maison pour mariages, réceptions et événements. Devis gratuit sous 24 h."),
    "menu.html": dict(
        prio="0.9", freq="monthly",
        title="Menu traiteur ivoirien : tchep, attiéké, garba | Thalia's",
        desc="Le menu complet de Thalia's Traiteur : tchep, attiéké, garba, alloco, poulet braisé et cuisine du monde. Plats faits maison pour vos événements au Québec."),
    "services.html": dict(
        prio="0.9", freq="monthly",
        title="Traiteur mariage, entreprise & réception | Thalia's Traiteur",
        desc="Service traiteur au Québec pour mariages, réceptions, fêtes de famille et repas d'entreprise. Cuisine ivoirienne faite maison, livraison et dressage sur place."),
    "commander.html": dict(
        prio="0.9", freq="monthly",
        title="Commander un traiteur ivoirien — devis gratuit | Thalia's",
        desc="Composez votre commande en ligne et recevez un devis traiteur gratuit sous 24 h. Cuisine ivoirienne faite maison, livrée partout au Québec."),
    "contact.html": dict(
        prio="0.8", freq="monthly",
        title="Contact & devis traiteur au Québec | Thalia's Traiteur",
        desc="Contactez Thalia's Traiteur pour vos commandes et événements au Québec. Réponse sous 24 h, devis gratuit et sans engagement."),
    "apropos.html": dict(
        prio="0.7", freq="yearly",
        title="À propos — traiteur ivoirien au Québec | Thalia's Traiteur",
        desc="L'histoire de Thalia's Traiteur : une passion familiale pour la cuisine ivoirienne, devenue service traiteur pour les événements au Québec."),
    "faq.html": dict(
        prio="0.7", freq="monthly",
        title="FAQ traiteur : délais, livraison, prix | Thalia's Traiteur",
        desc="Délais de commande, livraison, nombre de convives, allergies, paiement : toutes les réponses sur le service traiteur de Thalia's Traiteur au Québec."),
    "avis.html": dict(
        prio="0.6", freq="monthly",
        title="Avis clients — Thalia's Traiteur, traiteur ivoirien",
        desc="Ce que disent les clients de Thalia's Traiteur : cuisine ivoirienne faite maison, ponctualité et service soigné pour vos événements au Québec."),
    "mentions-legales.html": dict(prio="0.3", freq="yearly"),
    "confidentialite.html":  dict(prio="0.3", freq="yearly"),
    # credits.html : page orpheline (lien masqué dans le footer) → hors sitemap.
    "credits.html":          dict(prio=None, freq=None),
}

MARK_START = "<!-- seo.py:jsonld:start -->"
MARK_END   = "<!-- seo.py:jsonld:end -->"


def cfg(key, default=""):
    """Lit une valeur littérale dans ThaliasTraiteur/js/config.js."""
    src = io.open(os.path.join(SITE, "js", "config.js"), encoding="utf-8").read()
    m = re.search(r'^\s*%s\s*:\s*"([^"]*)"' % re.escape(key), src, re.M)
    return m.group(1) if m else default


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


def abs_url(path):
    return SITE_URL + "/" + path.lstrip("/")


def canonical_for(page):
    # index.html est canonique sur la racine du site (évite le contenu dupliqué
    # entre "/" et "/index.html").
    return SITE_URL + "/" if page == "index.html" else abs_url(page)


# ── JSON-LD ──────────────────────────────────────────────────────────────────

def business_node():
    same_as = [u for u in (cfg("FACEBOOK_URL"), cfg("INSTAGRAM_URL"),
                           cfg("TIKTOK_URL")) if u]
    node = {
        "@type": "Caterer",
        "@id": SITE_URL + "/#business",
        "name": "Thalia's Traiteur",
        "description": "Traiteur cuisine ivoirienne & du monde au Québec : "
                       "mariages, réceptions, entreprises. Fait maison.",
        "url": SITE_URL + "/",
        "logo": abs_url("img/logo.webp"),
        "image": abs_url(OG_IMG),
        "servesCuisine": ["Ivoirienne", "Africaine", "Cuisine du monde"],
        "priceRange": "$$",
        "currenciesAccepted": "CAD",
        "hasMenu": abs_url("menu.html"),
        # Zone de service = la province, pas une ville (choix de la cliente).
        "areaServed": {"@type": "AdministrativeArea",
                       "name": cfg("ZONE", "Québec")},
        "address": {"@type": "PostalAddress",
                    "addressRegion": "QC", "addressCountry": "CA"},
    }
    if cfg("PHONE_E164"):    node["telephone"] = cfg("PHONE_E164")
    if cfg("CONTACT_EMAIL"): node["email"] = cfg("CONTACT_EMAIL")
    if same_as:              node["sameAs"] = same_as
    return node


def faq_node():
    src = io.open(os.path.join(SITE, "faq.html"), encoding="utf-8").read()
    pairs = re.findall(r"<summary>(.*?)</summary>\s*<div class=\"faq-a\">(.*?)</div>",
                       src, re.S)
    strip = lambda t: re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", t)).strip()
    import html as _h
    return {
        "@type": "FAQPage",
        "@id": abs_url("faq.html") + "#faq",
        "mainEntity": [{
            "@type": "Question",
            "name": _h.unescape(strip(q)),
            "acceptedAnswer": {"@type": "Answer", "text": _h.unescape(strip(a))},
        } for q, a in pairs],
    }


def jsonld_for(page):
    """Données structurées statiques, uniquement là où elles servent."""
    if page == "index.html":
        return [business_node(),
                {"@type": "WebSite", "@id": SITE_URL + "/#website",
                 "name": "Thalia's Traiteur", "url": SITE_URL + "/",
                 "inLanguage": LANG,
                 "publisher": {"@id": SITE_URL + "/#business"}}]
    if page == "contact.html":
        return [business_node()]
    if page == "faq.html":
        return [business_node(), faq_node()]
    return None


# ── Réécriture d'une page ────────────────────────────────────────────────────

def process(page):
    path = os.path.join(SITE, page)
    src = io.open(path, encoding="utf-8").read()
    out, changes = src, []

    # 1. langue du document
    new = re.sub(r"<html\s+lang=\"[^\"]*\"", '<html lang="%s"' % LANG, out, count=1)
    if new != out: out, _ = new, changes.append("lang")

    # 2. <meta name="keywords"> : ignorée par Google depuis 2009 → retirée
    new = re.sub(r"[ \t]*<meta\s+name=\"keywords\"[^>]*>\s*\n", "", out)
    if new != out: out, _ = new, changes.append("keywords retirée")

    # 3. title / description (uniquement si un remplacement est défini)
    meta = PAGES.get(page, {})
    if meta.get("title"):
        new = re.sub(r"<title>.*?</title>",
                     "<title>%s</title>" % esc(meta["title"]), out, count=1, flags=re.S)
        if new != out: out, _ = new, changes.append("title")
    if meta.get("desc"):
        d = esc(meta["desc"])
        for pat, rep in (
            (r'(<meta\s+name="description"\s+content=")[^"]*(")',        r"\g<1>%s\g<2>"),
            (r'(<meta\s+property="og:description"\s+content=")[^"]*(")', r"\g<1>%s\g<2>"),
            (r'(<meta\s+name="twitter:description"\s+content=")[^"]*(")', r"\g<1>%s\g<2>"),
        ):
            out = re.sub(pat, rep % d.replace("\\", "\\\\"), out)
        changes.append("description")
    if meta.get("title"):
        t = esc(meta["title"])
        for pat in (r'(<meta\s+property="og:title"\s+content=")[^"]*(")',
                    r'(<meta\s+name="twitter:title"\s+content=")[^"]*(")'):
            out = re.sub(pat, r"\g<1>%s\g<2>" % t.replace("\\", "\\\\"), out)

    # 4. og:url / og:image / twitter:image → URL absolues
    new = re.sub(r'(<meta\s+property="og:url"\s+content=")[^"]*(")',
                 r"\g<1>%s\g<2>" % canonical_for(page), out)
    for pat in (r'(<meta\s+property="og:image"\s+content=")[^"]*(")',
                r'(<meta\s+name="twitter:image"\s+content=")[^"]*(")'):
        new = re.sub(pat, r"\g<1>%s\g<2>" % abs_url(OG_IMG), new)
    if new != out: out, _ = new, changes.append("og absolues")

    # 4b. commentaire d'origine devenu faux : les og: sont maintenant absolues,
    #     et son indentation avait pu dériver.
    out = re.sub(r"[ \t]*<!-- Favicon \+ SEO[^>]*-->",
                 "   <!-- Favicon + SEO / partage — og:url, og:image et canonical sont\n"
                 "        générées en absolu par tools/seo.py (SITE_URL). -->", out)

    # 5. canonical (retirée puis réinsérée juste après <title>)
    out = re.sub(r"[ \t]*<link\s+rel=\"canonical\"[^>]*>\s*\n", "", out)
    out = re.sub(r"(</title>\n)",
                 r'\1   <link rel="canonical" href="%s" />\n' % canonical_for(page),
                 out, count=1)
    changes.append("canonical")

    # 6. données structurées statiques (bloc délimité, donc remplaçable)
    out = re.sub(r"[ \t]*" + re.escape(MARK_START) + r".*?"
                 + re.escape(MARK_END) + r"[ \t]*\n", "", out, flags=re.S)
    nodes = jsonld_for(page)
    if nodes:
        graph = json.dumps({"@context": "https://schema.org", "@graph": nodes},
                           ensure_ascii=False, indent=3)
        graph = "\n".join("   " + l for l in graph.splitlines()).strip()
        block = ('   %s\n   <script type="application/ld+json">\n   %s\n   </script>\n'
                 '   %s\n' % (MARK_START, graph, MARK_END))
        out = re.sub(r"(<link rel=\"canonical\"[^>]*>\n)",
                     r"\1" + block.replace("\\", "\\\\"), out, count=1)
        changes.append("JSON-LD (%d noeud%s)" % (len(nodes), "s" if len(nodes) > 1 else ""))

    if out != src:
        io.open(path, "w", encoding="utf-8").write(out)
    return changes


# ── sitemap.xml + robots.txt ─────────────────────────────────────────────────

def write_sitemap():
    today = date.today().isoformat()
    rows = []
    for page, m in PAGES.items():
        if not m.get("prio"):
            continue
        rows.append("   <url>\n      <loc>%s</loc>\n      <lastmod>%s</lastmod>\n"
                    "      <changefreq>%s</changefreq>\n      <priority>%s</priority>\n"
                    "   </url>" % (canonical_for(page), today, m["freq"], m["prio"]))
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + "\n".join(rows) + "\n</urlset>\n")
    io.open(os.path.join(SITE, "sitemap.xml"), "w", encoding="utf-8").write(xml)
    return len(rows)


def write_robots():
    note = ""
    if ".github.io/" in SITE_URL:
        note = ("# NOTE : ce fichier n'est PAS lu par les moteurs tant que le site vit dans un\n"
                "#        sous-dossier de github.io — robots.txt n'est lu qu'à la racine d'un\n"
                "#        domaine. Il deviendra actif dès qu'un domaine propre sera branché.\n"
                "#        En attendant, soumets le sitemap directement dans Search Console.\n")
    txt = ("# Thalia's Traiteur\n" + note +
           "User-agent: *\n"
           "Allow: /\n\n"
           "Sitemap: %s/sitemap.xml\n" % SITE_URL)
    io.open(os.path.join(SITE, "robots.txt"), "w", encoding="utf-8").write(txt)


if __name__ == "__main__":
    print("SITE_URL = %s\n" % SITE_URL)
    for page in sorted(PAGES):
        if not os.path.exists(os.path.join(SITE, page)):
            print("  !! %s introuvable" % page); continue
        ch = process(page)
        print("  %-24s %s" % (page, ", ".join(ch) if ch else "—"))
    n = write_sitemap(); write_robots()
    print("\n  sitemap.xml              %d URL" % n)
    print("  robots.txt               écrit")
