# portfolio_backend/sitemap.py
"""
sitemap.xml du site public (domaine du frontend), avec chaque projet et article publié.
Vercel réécrit /sitemap.xml vers cette vue (voir frontend/vercel.json).
"""
from xml.sax.saxutils import escape

from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.cache import cache_page

from blog.models import Article
from projects.models import Project

STATIC_PAGES = [
    ('/', 'weekly', '1.0'),
    ('/projects', 'weekly', '0.9'),
    ('/experience', 'monthly', '0.8'),
    ('/skills', 'monthly', '0.7'),
    ('/blog', 'weekly', '0.7'),
    ('/contact', 'yearly', '0.6'),
]


def _url(loc, changefreq, priority, lastmod=None):
    parts = [f'<loc>{escape(loc)}</loc>']
    if lastmod:
        parts.append(f'<lastmod>{lastmod:%Y-%m-%d}</lastmod>')
    parts.append(f'<changefreq>{changefreq}</changefreq><priority>{priority}</priority>')
    return f'  <url>{"".join(parts)}</url>'


@cache_page(60 * 60)
def sitemap_xml(request):
    base = settings.SITE_URL.rstrip('/')
    urls = [_url(base + path, freq, prio) for path, freq, prio in STATIC_PAGES]

    for slug, updated in Project.objects.exclude(status='archived').values_list('slug', 'updated_at'):
        urls.append(_url(f'{base}/projects/{slug}', 'monthly', '0.8', updated))

    for slug, updated in Article.objects.filter(status='published').values_list('slug', 'updated_at'):
        urls.append(_url(f'{base}/blog/{slug}', 'monthly', '0.6', updated))

    body = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + '\n'.join(urls)
        + '\n</urlset>\n'
    )
    return HttpResponse(body, content_type='application/xml')
