import os
import requests
import json
import time
from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for, session, flash, make_response, current_app
from functools import lru_cache, wraps
from datetime import datetime, timedelta
from assets import init_assets
from network_tools import (
    rate_limited_traceroute, rate_limited_port_scan, rate_limited_dns_lookup, 
    rate_limited_ping, validate_hostname
)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key")

# Initialize assets for minification
assets = init_assets(app)

# Cache control setup
def cache_control(max_age=3600, public=True):
    """Add Cache-Control headers to the response."""
    def decorator(view_func):
        @wraps(view_func)
        def wrapped(*args, **kwargs):
            response = make_response(view_func(*args, **kwargs))
            if public:
                directive = f"public, max-age={max_age}"
            else:
                directive = f"private, max-age={max_age}"
            response.headers["Cache-Control"] = directive
            # Also add Expires header for older clients
            expires_time = datetime.utcnow() + timedelta(seconds=max_age)
            expires_str = expires_time.strftime("%a, %d %b %Y %H:%M:%S GMT")
            response.headers["Expires"] = expires_str
            return response
        return wrapped
    return decorator

# Simple in-memory storage for email leads (in production, use a database)
email_subscribers = []

def get_user_ip():
    """Get the user's IP address using multiple services with fallback"""
    try:
        # Try ipify first
        try:
            ip_response = requests.get("https://api.ipify.org?format=json", timeout=5)
            if ip_response.status_code == 200:
                return ip_response.json().get("ip")
        except Exception:
            pass
            
        # Try the IPv6 compatible endpoint
        try:
            ip_response = requests.get("https://api64.ipify.org?format=json", timeout=5)
            if ip_response.status_code == 200:
                return ip_response.json().get("ip")
        except Exception:
            pass
            
        # Try one more service
        try:
            ip_response = requests.get("https://ifconfig.me/ip", timeout=5)
            if ip_response.status_code == 200:
                return ip_response.text.strip()
        except Exception:
            pass
            
        return None
    except Exception:
        return None


@lru_cache(maxsize=128, typed=False)
def get_ip_details(ip):
    """Get detailed information about a specific IP (cached to reduce API calls)"""
    if not ip:
        return {
            "error": True,
            "message": "No IP address provided"
        }
        
    try:
        # Try ip-api.com first
        try:
            geo_response = requests.get(f"http://ip-api.com/json/{ip}", timeout=5)
            if geo_response.status_code == 200:
                data = geo_response.json()
                # Format the response to match our expected structure
                return {
                    "ip": ip,
                    "version": "IPv6" if ":" in ip else "IPv4",
                    "city": data.get("city", "Unknown"),
                    "region": data.get("regionName", "Unknown"),
                    "country_name": data.get("country", "Unknown"),
                    "country_code": data.get("countryCode", "Unknown"),
                    "latitude": data.get("lat", 0),
                    "longitude": data.get("lon", 0),
                    "org": data.get("isp", "Unknown"),
                    "asn": data.get("as", "Unknown"),
                    "timezone": data.get("timezone", "Unknown"),
                }
        except Exception:
            pass
            
        # Try ipapi.co as a fallback
        try:
            fallback_response = requests.get(f"https://ipapi.co/{ip}/json/", timeout=5)
            if fallback_response.status_code == 200:
                data = fallback_response.json()
                return {
                    "ip": ip, 
                    "version": "IPv6" if ":" in ip else "IPv4",
                    "city": data.get("city", "Unknown"),
                    "region": data.get("region", "Unknown"),
                    "country_name": data.get("country_name", "Unknown"),
                    "country_code": data.get("country_code", "Unknown"),
                    "latitude": data.get("latitude", 0),
                    "longitude": data.get("longitude", 0),
                    "org": data.get("org", "Unknown"),
                    "asn": data.get("asn", "Unknown"),
                    "timezone": data.get("timezone", "Unknown"),
                }
        except Exception:
            pass
        
        # If all APIs failed, return a basic response with just the IP
        return {
            "ip": ip,
            "version": "IPv6" if ":" in ip else "IPv4",
            "city": "Unknown",
            "region": "Unknown",
            "country_name": "Unknown",
            "error": True,
            "message": "Limited information available"
        }
            
    except Exception as e:
        return {
            "error": True,
            "message": f"Error fetching IP data: {str(e)}"
        }


def get_ip_info(ip=None):
    """Main function to get IP information, with caching"""
    # If no IP specified, get the user's current IP
    if not ip:
        ip = get_user_ip()
        
    # If we couldn't determine the IP at all, return an error
    if not ip:
        return {
            "error": True,
            "message": "Could not determine IP address. Please try again later."
        }
        
    # Get the detailed information (this call is cached)
    return get_ip_details(ip)

@app.route('/')
def index():
    ip_info = get_ip_info()
    return render_template('index.html', ip_info=ip_info)

@app.route('/ip-address-lookup')
def ip_address_lookup():
    ip_info = get_ip_info()
    return render_template('ip-address-lookup.html', ip_info=ip_info)

@app.route('/my-ip-address-location')
def my_ip_address_location():
    ip_info = get_ip_info()
    return render_template('my-ip-address-location.html', ip_info=ip_info)

@app.route('/ipv6-check')
def ipv6_check():
    ip_info = get_ip_info()
    return render_template('ipv6-check.html', ip_info=ip_info)

@app.route('/ip-locator')
def ip_locator():
    ip_info = get_ip_info()
    return render_template('ip-locator.html', ip_info=ip_info)

@app.route('/current-ip-address')
def current_ip_address():
    ip_info = get_ip_info()
    return render_template('current-ip-address.html', ip_info=ip_info)

@app.route('/ip-vs-mac-address')
def ip_vs_mac_address():
    ip_info = get_ip_info()
    return render_template('ip-vs-mac-address.html', ip_info=ip_info)

@app.route('/api/lookup', methods=['POST'])
def lookup_ip():
    """API endpoint to look up an IP address"""
    data = request.get_json()
    ip = data.get('ip', '')
    if not ip:
        return jsonify({"error": True, "message": "No IP address provided"})
    
    ip_info = get_ip_info(ip)
    return jsonify(ip_info)

@app.route('/robots.txt')
@cache_control(max_age=86400)  # Cache for 24 hours
def robots():
    """Serve robots.txt file"""
    return send_from_directory('static', 'robots.txt')

@app.route('/sitemap.xml')
@cache_control(max_age=86400)  # Cache for 24 hours
def sitemap():
    """Serve sitemap.xml file"""
    return send_from_directory('static', 'sitemap.xml')

@app.route('/static/css/<path:filename>')
@cache_control(max_age=2592000)  # Cache for 30 days
def serve_css(filename):
    """Serve CSS files with long cache time"""
    return send_from_directory('static/css', filename)

@app.route('/static/js/<path:filename>')
@cache_control(max_age=2592000)  # Cache for 30 days
def serve_js(filename):
    """Serve JS files with long cache time"""
    return send_from_directory('static/js', filename)

@app.route('/static/images/<path:filename>')
@cache_control(max_age=2592000)  # Cache for 30 days
def serve_images(filename):
    """Serve image files with long cache time"""
    return send_from_directory('static/images', filename)

@app.route('/static/fonts/<path:filename>')
@cache_control(max_age=2592000)  # Cache for 30 days
def serve_fonts(filename):
    """Serve font files with long cache time"""
    return send_from_directory('static/fonts', filename)

@app.route('/downloads/privacy-guide', methods=['GET', 'POST'])
def privacy_guide():
    """Handle privacy guide download with lead capture"""
    if request.method == 'POST':
        email = request.form.get('email', '')
        if not email or '@' not in email:
            flash('Please enter a valid email address to download the guide.', 'error')
            return redirect(url_for('privacy_guide'))
            
        # In a production app, you'd validate the email properly and store in a database
        subscriber = {
            'email': email,
            'ip_address': get_user_ip(),
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'source': 'privacy_guide'
        }
        
        if email not in [sub['email'] for sub in email_subscribers]:
            email_subscribers.append(subscriber)
        
        # Set a session flag to remember this user has subscribed
        session['subscribed'] = True
        session['email'] = email
        
        # Redirect to the actual download
        return redirect(url_for('download_privacy_pdf'))
    
    ip_info = get_ip_info()
    # Check if user is already subscribed
    is_subscribed = session.get('subscribed', False)
    return render_template('privacy-guide.html', ip_info=ip_info, is_subscribed=is_subscribed)

@app.route('/download/privacy.pdf')
def download_privacy_pdf():
    """Now redirects to email subscription instead of direct PDF access"""
    # Redirect to the subscription page to get the guide via email
    flash('The privacy guide is now exclusively available through our email newsletter. Please subscribe to receive your free copy.', 'info')
    return redirect(url_for('privacy_guide'))

@app.route('/api/subscribe', methods=['POST'])
def subscribe():
    """API endpoint to handle email subscriptions"""
    data = request.get_json()
    email = data.get('email', '')
    source = data.get('source', 'website')
    
    if not email or '@' not in email:
        return jsonify({"success": False, "message": "Please enter a valid email address."})
    
    subscriber = {
        'email': email,
        'ip_address': get_user_ip(),
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'source': source
    }
    
    # Don't add duplicates
    if email not in [sub['email'] for sub in email_subscribers]:
        email_subscribers.append(subscriber)
    
    session['subscribed'] = True
    session['email'] = email
    
    return jsonify({"success": True, "message": "Thank you for subscribing!"})

@app.route('/privacy-policy')
@cache_control(max_age=86400)  # Cache for 24 hours
def privacy_policy():
    """Privacy Policy page"""
    ip_info = get_ip_info()
    return render_template('privacy-policy.html', ip_info=ip_info)

@app.route('/terms-of-service')
@cache_control(max_age=86400)  # Cache for 24 hours
def terms_of_service():
    """Terms of Service page"""
    ip_info = get_ip_info()
    return render_template('terms-of-service.html', ip_info=ip_info)

@app.route('/cookie-policy')
@cache_control(max_age=86400)  # Cache for 24 hours
def cookie_policy():
    """Cookie Policy page"""
    ip_info = get_ip_info()
    return render_template('cookie-policy.html', ip_info=ip_info)

@app.route('/about')
@cache_control(max_age=86400)  # Cache for 24 hours
def about():
    """About page"""
    ip_info = get_ip_info()
    return render_template('about.html', ip_info=ip_info)

@app.route('/traceroute')
def traceroute_tool():
    """Traceroute tool page"""
    ip_info = get_ip_info()
    return render_template('traceroute.html', ip_info=ip_info)

@app.route('/api/traceroute', methods=['POST'])
def traceroute_api():
    """API endpoint to run a traceroute"""
    data = request.get_json()
    target = data.get('target', '')
    
    # Validate the input
    if not target or not validate_hostname(target):
        return jsonify({
            "error": True,
            "message": "Please enter a valid hostname or IP address"
        })
    
    # Get the client's IP for rate limiting
    client_ip = get_user_ip() or request.remote_addr
    
    # Run the traceroute with rate limiting
    result = rate_limited_traceroute(target, client_ip)
    
    return jsonify(result)

@app.route('/port-scanner')
def port_scanner_tool():
    """Port Scanner tool page"""
    ip_info = get_ip_info()
    return render_template('port-scanner.html', ip_info=ip_info)

@app.route('/api/port-scan', methods=['POST'])
def port_scan_api():
    """API endpoint to scan ports on a target"""
    data = request.get_json()
    target = data.get('target', '')
    
    # Validate the input
    if not target or not validate_hostname(target):
        return jsonify({
            "error": True,
            "message": "Please enter a valid hostname or IP address"
        })
    
    # Get the client's IP for rate limiting
    client_ip = get_user_ip() or request.remote_addr
    
    # Run the port scan with rate limiting
    result = rate_limited_port_scan(target, client_ip)
    
    return jsonify(result)

@app.route('/dns-lookup')
def dns_lookup_tool():
    """DNS Lookup tool page"""
    ip_info = get_ip_info()
    return render_template('dns-lookup.html', ip_info=ip_info)

@app.route('/api/dns-lookup', methods=['POST'])
def dns_lookup_api():
    """API endpoint to perform DNS lookups"""
    data = request.get_json()
    domain = data.get('domain', '')
    record_type = data.get('record_type', 'A')
    
    # Validate the input
    if not domain or not validate_hostname(domain):
        return jsonify({
            "error": True,
            "message": "Please enter a valid domain name"
        })
    
    # Get the client's IP for rate limiting
    client_ip = get_user_ip() or request.remote_addr
    
    # Run the DNS lookup with rate limiting
    result = rate_limited_dns_lookup(domain, record_type, client_ip)
    
    return jsonify(result)

@app.route('/ping-tool')
def ping_tool():
    """Ping tool page"""
    ip_info = get_ip_info()
    return render_template('ping-tool.html', ip_info=ip_info)

@app.route('/api/ping', methods=['POST'])
def ping_api():
    """API endpoint to ping a target"""
    data = request.get_json()
    target = data.get('target', '')
    count = data.get('count', 5)
    
    # Validate the input
    if not target or not validate_hostname(target):
        return jsonify({
            "error": True,
            "message": "Please enter a valid hostname or IP address"
        })
    
    # Get the client's IP for rate limiting
    client_ip = get_user_ip() or request.remote_addr
    
    # Run the ping with rate limiting
    result = rate_limited_ping(target, count, client_ip)
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
