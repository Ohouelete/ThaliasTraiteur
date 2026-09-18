# ThaliasTraiteur

Site web pour **Thalia's Traiteur — Cuisine Ivoirienne** (Québec).

Basé sur le template HTML **Sarab** (restaurant / fast food) adapté aux couleurs
et au menu de Thalia's Traiteur.

## Structure

- `ThaliasTraiteur/` — site (HTML/CSS/JS + assets) — **seul dossier publié sur GitHub Pages**
- `tools/` — outils de build (non publiés), voir ci-dessous
- `Documentation/` — documentation du template d'origine
- `sarab_ressources/` — logo et menu de Thalia's Traiteur

## Développement

Ouvrir `ThaliasTraiteur/index.html` dans un navigateur, ou servir le dossier :

```bash
cd ThaliasTraiteur && python3 -m http.server 8000
```

## Icônes (FontAwesome subset)

Pour la performance, seules les icônes réellement utilisées sont embarquées
(`css/all.min.css` ≈ 3,5 Ko + `webfonts/*.subset.woff2` ≈ 12 Ko, au lieu de ~1,2 Mo).

**➡️ Après avoir ajouté ou retiré une icône `<i class="fas fa-…">` (dans le HTML *ou* un JS
de `ThaliasTraiteur/js/`), relance :**

```bash
python3 tools/fa-subset.py      # prérequis : pip install fonttools brotli
```

Le script :
- rescanne le HTML **et** les JS applicatifs (icônes injectées comprises) ;
- régénère `all.min.css` + les polices subset ;
- applique un cache-busting (`?v=hash`) pour que le changement soit pris en compte
  immédiatement (sinon le navigateur garde l'ancienne version en cache).

Les polices FontAwesome complètes (source du subset) sont dans `tools/fa-src/` — ne pas
les supprimer, elles sont nécessaires à la régénération et ne sont pas publiées.

## SEO (métadonnées, sitemap, données structurées)

Les balises `canonical`, `og:*`, `title`/`description`, le `sitemap.xml`, le
`robots.txt` et les données structurées JSON-LD sont **générés** par un script.
Ne les édite pas à la main dans les `.html` : édite le script et relance-le.

```bash
python3 tools/seo.py      # aucune dépendance, idempotent
```

**Le jour où un nom de domaine est acheté**, une seule chose à faire :

1. changer `SITE_URL` en haut de `tools/seo.py` ;
2. relancer `python3 tools/seo.py` ;
3. créer `ThaliasTraiteur/CNAME` contenant le domaine (ex. `thaliastraiteur.ca`) ;
4. pointer le DNS du domaine vers GitHub Pages.

⚠️ **Tant que le site vit sur `dovrom.github.io/ThaliasTraiteur/`, le
`robots.txt` n'est pas lu par les moteurs** : ils ne lisent ce fichier qu'à la
racine d'un domaine (`dovrom.github.io/robots.txt`), qui n'appartient pas à ce
dépôt. Le fichier est en place et deviendra actif dès qu'un domaine propre sera
branché. En attendant, le sitemap se soumet directement dans Google Search
Console.

Titres et descriptions de chaque page sont centralisés dans le dictionnaire
`PAGES` de `tools/seo.py`.

## Crédits

Template d'origine **Sarab** © [Bestwpware](https://bestwpware.com/),
distribué par [ThemeWagon](https://themewagon.com) sous licence MIT.
