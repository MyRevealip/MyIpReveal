from flask_assets import Bundle, Environment

def init_assets(app):
    """Initialize Flask-Assets for minifying and bundling CSS and JS files."""
    assets = Environment(app)
    assets.url = app.static_url_path
    assets.debug = app.debug

    # CSS bundles
    css_bundle = Bundle(
        'css/bootstrap.min.css',
        'css/style.css',
        filters='cssmin',
        output='css/min/all.min.css'
    )

    # JS bundles
    js_bundle = Bundle(
        'js/bootstrap.bundle.min.js',
        'js/app.js',
        filters='jsmin',
        output='js/min/all.min.js'
    )

    # Extra JS for specific pages (don't bundle with common JS)
    ip_lookup_js = Bundle(
        'js/ip-lookup.js',
        filters='jsmin',
        output='js/min/ip-lookup.min.js'
    )

    # Register bundles
    assets.register('css_all', css_bundle)
    assets.register('js_all', js_bundle)
    assets.register('js_ip_lookup', ip_lookup_js)

    return assets