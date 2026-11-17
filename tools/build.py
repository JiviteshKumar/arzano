"""
ARZANO site build: a tiny static-site generator, no dependencies.

  python tools/build.py

Reads   tools/pages/**.html      page sources (JSON front matter between --- lines)
        tools/partials/*.html    shared head / header / footer / concierge
        tools/templates/piece.html
        tools/catalogue.json     collections + pieces (single source of truth)
        tools/images.json        responsive image sizes (written by make_images.py)
Writes  *.html, ar/*.html, pieces/*.html, sitemap.xml  at the site root.

Every page is plain static HTML, so search engines and AI crawlers can read
the full catalogue without running JavaScript.
"""
import html, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS = os.path.join(ROOT, 'tools')
SITE = 'https://www.arzano.com/'          # production origin used for canonical / OG URLs

cat = json.load(open(os.path.join(TOOLS, 'catalogue.json'), encoding='utf-8'))
imgs = json.load(open(os.path.join(TOOLS, 'images.json'), encoding='utf-8'))
COLS, PIECES = cat['collections'], cat['pieces']
BY_ID = {p['id']: p for p in PIECES}
esc = lambda s: html.escape(str(s), quote=True)


def partial(name):
    with open(os.path.join(TOOLS, 'partials', name + '.html'), encoding='utf-8') as f:
        return f.read()


def render(text, v):
    # {{> partial}} includes first (they may contain {{vars}}), then {{var}} substitution
    for _ in range(3):
        text = re.sub(r'\{\{>\s*([\w-]+)\s*\}\}', lambda m: partial(m.group(1)), text)
    return re.sub(r'\{\{(\w+)\}\}', lambda m: str(v.get(m.group(1), '')), text)


def picture(name, alt, root, sizes='100vw', cls='', eager=False, extra=''):
    m = imgs[name]
    base = f'{root}assets/img/r/{name}'
    srcset = lambda ext: ', '.join(f'{base}-{w}.{ext} {w}w' for w in m['widths'])
    load = 'fetchpriority="high" decoding="async"' if eager else 'loading="lazy" decoding="async"'
    c = f' class="{cls}"' if cls else ''
    return (f'<picture><source type="image/avif" srcset="{srcset("avif")}" sizes="{sizes}">'
            f'<source type="image/webp" srcset="{srcset("webp")}" sizes="{sizes}">'
            f'<img src="{base}.jpg" width="{m["w"]}" height="{m["h"]}" alt="{esc(alt)}"{c} {load}{extra}></picture>')


def expand_pics(text, root):
    """<img data-pic="name" alt=".." data-sizes=".." data-eager class=".."> -> responsive <picture>"""
    def rep(m):
        attrs = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(0)))
        return picture(attrs['data-pic'], html.unescape(attrs.get('alt', '')), root, attrs.get('data-sizes', '100vw'),
                       attrs.get('class', ''), 'data-eager' in m.group(0))
    return re.sub(r'<img [^>]*data-pic="[^"]+"[^>]*>', rep, text)


CARD_SIZES = '(max-width:520px) 100vw, (max-width:1080px) 50vw, 33vw'

def card(p, root):
    badge = f'<span class="card__badge">{esc(p["badge"])}</span>' if p.get('badge') else ''
    return (f'<article class="card reveal" data-cat="{" ".join(p["cat"])}" data-col="{p["collection"]}">'
            f'<a href="{root}pieces/{p["id"]}.html" class="card__link">'
            f'<div class="card__img">{picture(p["img"], p["alt"], root, CARD_SIZES)}{badge}<span class="card__quick">View the piece</span></div>'
            f'<div class="card__meta"><div><h3>{esc(p["name"])}</h3><p>{esc(COLS[p["collection"]]["name"])}</p></div>'
            f'<span class="por">Price on request</span></div></a></article>')


def jsonld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False) + '</script>'


def crumbs_ld(items):
    return {'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': SITE + u} for i, (n, u) in enumerate(items)]}


ORG = {'@type': 'Organization', '@id': SITE + '#org', 'name': 'Arzano', 'url': SITE,
       'logo': SITE + 'assets/favicon.svg', 'slogan': 'Rare Masterpieces',
       'description': 'High jewellery house of the Zaveri family, set with GIA-certified diamonds and GRS-certified gemstones.',
       'foundingDate': '1952', 'sameAs': ['https://www.instagram.com/arzanojewels/']}

written = []

def write(rel, text):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    written.append(rel.replace(os.sep, '/'))


def base_vars(front, rel):
    depth = rel.count('/')
    root = '../' * depth
    path = '' if rel == 'index.html' else ('ar/' if rel == 'ar/index.html' else rel)
    v = {'root': root, 'site': SITE, 'path': path, 'lang': 'en', 'dir': 'ltr', 'og_locale': 'en_GB',
         'og_image': 'hero-drop-earring', 'hreflang': '', 'preload': '', 'jsonld': ''}
    v.update(front)
    v['title'] = esc(v['title']); v['description'] = esc(v['description'])
    if v.get('preload_img'):
        name = v['preload_img']; w = imgs[name]['widths']
        v['preload'] = (f'<link rel="preload" as="image" type="image/avif" fetchpriority="high" '
                        f'imagesrcset="{", ".join(f"{root}assets/img/r/{name}-{x}.avif {x}w" for x in w)}" imagesizes="{v.get("preload_sizes", "100vw")}">')
    return v


# ---------- pages ----------
pages_dir = os.path.join(TOOLS, 'pages')
for dirpath, _, files in os.walk(pages_dir):
    for fn in files:
        rel = os.path.relpath(os.path.join(dirpath, fn), pages_dir).replace(os.sep, '/')
        raw = open(os.path.join(dirpath, fn), encoding='utf-8').read()
        _, front, body = raw.split('---', 2)
        v = base_vars(json.loads(front), rel)
        root = v['root']
        if rel in ('index.html', 'ar/index.html'):
            v['hreflang'] = (f'<link rel="alternate" hreflang="en" href="{SITE}">'
                             f'<link rel="alternate" hreflang="ar" href="{SITE}ar/">'
                             f'<link rel="alternate" hreflang="x-default" href="{SITE}">')
            v['jsonld'] = jsonld({'@context': 'https://schema.org', '@graph': [ORG, {
                '@type': 'WebSite', 'name': 'Arzano', 'url': SITE, 'inLanguage': ['en', 'ar'], 'publisher': {'@id': SITE + '#org'}}]})
        if rel == 'collection.html':
            v['grid'] = '\n'.join(card(p, root) for p in PIECES)
            v['count'] = len(PIECES)
            v['col_options'] = ''.join(f'<option value="{k}">{esc(c["name"])}</option>' for k, c in COLS.items())
            v['jsonld'] = jsonld({'@context': 'https://schema.org', '@graph': [
                crumbs_ld([('Arzano', ''), ('High Jewellery', 'collection.html')]),
                {'@type': 'ItemList', 'name': 'Arzano High Jewellery', 'itemListElement': [
                    {'@type': 'ListItem', 'position': i + 1, 'url': f'{SITE}pieces/{p["id"]}.html', 'name': p['name']}
                    for i, p in enumerate(PIECES)]}]})
        if rel == 'boutiques.html':
            v['jsonld'] = jsonld({'@context': 'https://schema.org', '@graph': [crumbs_ld([('Arzano', ''), ('Find Arzano', 'boutiques.html')])]})
        write(rel, expand_pics(render(body, v), root))

# ---------- piece pages ----------
tpl = open(os.path.join(TOOLS, 'templates', 'piece.html'), encoding='utf-8').read()
_, tfront, tbody = tpl.split('---', 2)
for p in PIECES:
    rel = f'pieces/{p["id"]}.html'
    col = COLS[p['collection']]
    front = json.loads(tfront)
    front.update({'title': f'{p["name"]} | {col["name"]} | Arzano',
                  'description': f'{p["desc"]} GIA-certified. Price on request; private viewings across the GCC.'[:300],
                  'og_image': p['img'], 'preload_img': p['img'], 'preload_sizes': '(max-width:860px) 100vw, 55vw'})
    v = base_vars(front, rel)
    root = v['root']
    spec = p['spec'] + [['Price', 'On request'], ['Comes with', 'GIA report & Arzano certificate']]
    v.update({
        'id': p['id'], 'name': esc(p['name']), 'desc': esc(p['desc']), 'col_id': p['collection'],
        'col_name': esc(col['name']), 'col_blurb': esc(col['blurb']), 'badge': esc(p.get('badge', '')),
        'image': picture(p['img'], p['alt'], root, '(max-width:860px) 100vw, 55vw', 'zoom__img', eager=True),
        'spec': ''.join(f'<div><dt>{esc(k)}</dt><dd>{esc(val)}</dd></div>' for k, val in spec),
        'related': '\n'.join(card(BY_ID[r], root) for r in p['related']),
        'wa_msg': esc(f'Hello Arzano, I would like to know more about the {p["name"]} ({col["name"]}).'),
        'jsonld': jsonld({'@context': 'https://schema.org', '@graph': [
            crumbs_ld([('Arzano', ''), ('High Jewellery', 'collection.html'), (p['name'], rel)]),
            {'@type': 'Product', 'name': p['name'], 'description': p['desc'], 'url': SITE + rel,
             'image': f'{SITE}assets/img/r/{p["img"]}.jpg', 'brand': {'@type': 'Brand', 'name': 'Arzano'},
             'category': ', '.join(p['cat']), 'isRelatedTo': [{'@type': 'Product', 'name': BY_ID[r]['name'],
             'url': f'{SITE}pieces/{r}.html'} for r in p['related']],
             'additionalProperty': [{'@type': 'PropertyValue', 'name': k, 'value': val} for k, val in p['spec']]}]}),
    })
    write(rel, expand_pics(render(tbody, v), root))

# ---------- sitemap ----------
urls = []
for rel in written:
    if rel == '404.html':
        continue
    loc = SITE + ('' if rel == 'index.html' else 'ar/' if rel == 'ar/index.html' else rel)
    alt = ''
    if rel in ('index.html', 'ar/index.html'):
        alt = (f'<xhtml:link rel="alternate" hreflang="en" href="{SITE}"/>'
               f'<xhtml:link rel="alternate" hreflang="ar" href="{SITE}ar/"/>')
    urls.append(f'  <url><loc>{loc}</loc>{alt}</url>')
write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
      'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + '\n'.join(urls) + '\n</urlset>\n')

print('built', len(written), 'files:', ', '.join(written))
