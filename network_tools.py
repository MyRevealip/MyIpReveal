import subprocess
import re
import socket
import concurrent.futures
import ipaddress
from functools import lru_cache
import requests
from flask import current_app
import time
import json
import dns.resolver
import dns.reversename
import dns.exception

def validate_hostname(hostname):
    """
    Validate if a hostname or IP address is valid.
    Returns True if valid, False otherwise.
    """
    # Check if it's a valid IP address
    try:
        ipaddress.ip_address(hostname)
        return True
    except ValueError:
        pass
    
    # Check if it's a valid hostname
    if len(hostname) > 255:
        return False
    if hostname[-1] == ".":
        hostname = hostname[:-1]
    allowed = re.compile(r"(?!-)[A-Z\d-]{1,63}(?<!-)$", re.IGNORECASE)
    return all(allowed.match(x) for x in hostname.split("."))

@lru_cache(maxsize=100)  # Cache results to prevent abuse
def run_traceroute(target, max_hops=30):
    """
    Run a traceroute to the target and return the results.
    
    Args:
        target (str): The hostname or IP address to trace
        max_hops (int): Maximum number of hops to trace
        
    Returns:
        list: List of dictionaries containing hop information
    """
    if not validate_hostname(target):
        return {"error": "Invalid hostname or IP address"}
    
    try:
        # Use different commands based on OS
        command = ["traceroute", "-m", str(max_hops), "-q", "1", "-n", target]
        
        # Run the traceroute command
        process = subprocess.Popen(
            command, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = process.communicate(timeout=30)
        
        if process.returncode != 0:
            return {"error": f"Traceroute failed: {stderr}"}
        
        # Parse the output
        hops = []
        for line in stdout.strip().split('\n')[1:]:  # Skip the first line (header)
            match = re.match(r'^\s*(\d+)\s+([\d*.]+)(?:\s+(\d+.\d+) ms)?(?:\s+(\d+.\d+) ms)?(?:\s+(\d+.\d+) ms)?', line)
            if match:
                hop_num = int(match.group(1))
                ip = match.group(2)
                
                # Get times, filtering out None values and converting to float
                times = [float(t) for t in [match.group(3), match.group(4), match.group(5)] if t]
                avg_time = sum(times) / len(times) if times else None
                
                # Get location data for the IP
                location = None
                if ip != "*" and not ip.startswith("192.168.") and not ip.startswith("10.") and not ip.startswith("172."):
                    location = get_ip_location(ip)
                
                hops.append({
                    "hop": hop_num,
                    "ip": ip,
                    "avg_ms": avg_time,
                    "location": location
                })
        
        return {"target": target, "hops": hops}
        
    except subprocess.TimeoutExpired:
        return {"error": "Traceroute timed out"}
    except Exception as e:
        return {"error": f"Error running traceroute: {str(e)}"}

@lru_cache(maxsize=100)  # Cache results to reduce API calls
def get_ip_location(ip):
    """Get location data for an IP address"""
    if ip == "*":
        return None
        
    try:
        # Import the function from app.py
        from app import get_ip_details
        return get_ip_details(ip)
    except ImportError:
        # Fallback to a minimal implementation if we can't import
        try:
            response = requests.get(f"https://ipapi.co/{ip}/json/", timeout=5)
            if response.status_code == 200:
                data = response.json()
                return {
                    "country": data.get("country_name"),
                    "city": data.get("city"),
                    "region": data.get("region"),
                    "org": data.get("org")
                }
        except:
            pass
    
    return None

def scan_port(target, port, timeout=1):
    """
    Scan a single port on a target.
    
    Args:
        target (str): The hostname or IP address to scan
        port (int): The port to scan
        timeout (float): Connection timeout in seconds
        
    Returns:
        tuple: (port, is_open, service_name)
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    
    try:
        result = sock.connect_ex((target, port))
        is_open = (result == 0)
        
        service = ""
        if is_open:
            try:
                service = socket.getservbyport(port)
            except:
                if port == 80:
                    service = "http"
                elif port == 443:
                    service = "https"
                else:
                    service = "unknown"
    except:
        is_open = False
        service = ""
    finally:
        sock.close()
    
    return (port, is_open, service)

def scan_common_ports(target, timeout=1, max_workers=10):
    """
    Scan common ports on a target.
    
    Args:
        target (str): The hostname or IP address to scan
        timeout (float): Connection timeout in seconds
        max_workers (int): Maximum number of concurrent workers
        
    Returns:
        list: List of dictionaries containing port information
    """
    if not validate_hostname(target):
        return {"error": "Invalid hostname or IP address"}
    
    # Common ports to scan
    common_ports = [
        21, 22, 23, 25, 53, 80, 110, 115, 135, 139, 
        143, 194, 443, 445, 1433, 3306, 3389, 5632, 5900, 
        8080, 8443, 9090, 9100
    ]
    
    results = []
    
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit scan tasks
            future_to_port = {
                executor.submit(scan_port, target, port, timeout): port 
                for port in common_ports
            }
            
            # Process results as they complete
            for future in concurrent.futures.as_completed(future_to_port):
                port, is_open, service = future.result()
                if is_open:
                    results.append({
                        "port": port,
                        "state": "open",
                        "service": service
                    })
        
        # Sort by port number
        results.sort(key=lambda x: x["port"])
        
        return {
            "target": target,
            "timestamp": time.time(),
            "ports": results
        }
        
    except Exception as e:
        return {"error": f"Error scanning ports: {str(e)}"}

# Cache scan results for rate limiting
_scan_cache = {}
_scan_timestamps = {}

def rate_limited_port_scan(target, client_ip, timeout=1):
    """
    Rate-limited port scan to prevent abuse.
    
    Args:
        target (str): The hostname or IP address to scan
        client_ip (str): The IP of the client making the request
        timeout (float): Connection timeout in seconds
        
    Returns:
        dict: Port scan results or error message
    """
    # Check if we've scanned this target recently for this client
    cache_key = f"{client_ip}:{target}"
    current_time = time.time()
    
    # If we've scanned this recently, return cached result
    if cache_key in _scan_timestamps:
        last_scan_time = _scan_timestamps[cache_key]
        if current_time - last_scan_time < 60:  # 1 minute rate limit
            if cache_key in _scan_cache:
                return _scan_cache[cache_key]
            else:
                return {"error": "Rate limit exceeded. Please try again later."}
    
    # Check if client has made too many scans recently
    client_scans = sum(1 for key, timestamp in _scan_timestamps.items() 
                      if key.startswith(f"{client_ip}:") and current_time - timestamp < 300)  # 5 minutes
    
    if client_scans >= 5:  # Limit to 5 scans per 5 minutes
        return {"error": "Rate limit exceeded. Please try again later."}
    
    # Perform the scan
    result = scan_common_ports(target, timeout)
    
    # Cache the result
    _scan_cache[cache_key] = result
    _scan_timestamps[cache_key] = current_time
    
    # Clean old cache entries
    for key in list(_scan_timestamps.keys()):
        if current_time - _scan_timestamps[key] > 300:  # 5 minutes
            _scan_timestamps.pop(key, None)
            _scan_cache.pop(key, None)
    
    return result

# Cache traceroute results for rate limiting
_traceroute_cache = {}
_traceroute_timestamps = {}

def rate_limited_traceroute(target, client_ip, max_hops=30):
    """
    Rate-limited traceroute to prevent abuse.
    
    Args:
        target (str): The hostname or IP address to trace
        client_ip (str): The IP of the client making the request
        max_hops (int): Maximum number of hops to trace
        
    Returns:
        dict: Traceroute results or error message
    """
    # Check if we've traced this target recently for this client
    cache_key = f"{client_ip}:{target}"
    current_time = time.time()
    
    # If we've traced this recently, return cached result
    if cache_key in _traceroute_timestamps:
        last_trace_time = _traceroute_timestamps[cache_key]
        if current_time - last_trace_time < 60:  # 1 minute rate limit
            if cache_key in _traceroute_cache:
                return _traceroute_cache[cache_key]
            else:
                return {"error": "Rate limit exceeded. Please try again later."}
    
    # Check if client has made too many traces recently
    client_traces = sum(1 for key, timestamp in _traceroute_timestamps.items() 
                       if key.startswith(f"{client_ip}:") and current_time - timestamp < 300)  # 5 minutes
    
    if client_traces >= 5:  # Limit to 5 traces per 5 minutes
        return {"error": "Rate limit exceeded. Please try again later."}
    
    # Perform the traceroute
    result = run_traceroute(target, max_hops)
    
    # Cache the result
    _traceroute_cache[cache_key] = result
    _traceroute_timestamps[cache_key] = current_time
    
    # Clean old cache entries
    for key in list(_traceroute_timestamps.keys()):
        if current_time - _traceroute_timestamps[key] > 300:  # 5 minutes
            _traceroute_timestamps.pop(key, None)
            _traceroute_cache.pop(key, None)
    
    return result

# Cache DNS lookup results for rate limiting
_dns_cache = {}
_dns_timestamps = {}

def perform_dns_lookup(domain, record_type='A'):
    """
    Perform a DNS lookup for the specified domain and record type.
    
    Args:
        domain (str): The domain name to look up
        record_type (str): The DNS record type to query (A, AAAA, MX, TXT, NS, CNAME, SOA, or ALL)
        
    Returns:
        dict: DNS lookup results or error message
    """
    if not validate_hostname(domain):
        return {"error": "Invalid domain name"}
    
    # Ensure the domain doesn't have a trailing dot
    domain = domain.rstrip('.')
    
    results = []
    
    try:
        # Create resolver
        resolver = dns.resolver.Resolver()
        
        # Set timeout to prevent hanging
        resolver.timeout = 5
        resolver.lifetime = 5
        
        # Determine which record types to query
        record_types = []
        if record_type == 'ALL':
            record_types = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA']
        else:
            record_types = [record_type]
        
        # Query each record type
        for rt in record_types:
            try:
                answers = resolver.resolve(domain, rt)
                
                for answer in answers:
                    record = {
                        "type": rt,
                        "ttl": answers.ttl
                    }
                    
                    # Process based on record type
                    if rt == 'MX':
                        record["priority"] = answer.preference
                        record["value"] = str(answer.exchange)
                    elif rt == 'SOA':
                        record["value"] = {
                            "mname": str(answer.mname),
                            "rname": str(answer.rname),
                            "serial": answer.serial,
                            "refresh": answer.refresh,
                            "retry": answer.retry,
                            "expire": answer.expire,
                            "minimum": answer.minimum
                        }
                    else:
                        record["value"] = str(answer)
                    
                    results.append(record)
            except dns.resolver.NoAnswer:
                continue
            except dns.resolver.NXDOMAIN:
                return {"error": f"Domain {domain} does not exist"}
            except dns.resolver.NoNameservers:
                return {"error": f"No nameservers available for {domain}"}
            except Exception as e:
                # Continue with other record types even if one fails
                continue
        
        return {
            "domain": domain,
            "records": results
        }
        
    except Exception as e:
        return {"error": f"Error performing DNS lookup: {str(e)}"}

def rate_limited_dns_lookup(domain, record_type, client_ip):
    """
    Rate-limited DNS lookup to prevent abuse.
    
    Args:
        domain (str): The domain name to look up
        record_type (str): The DNS record type to query
        client_ip (str): The IP of the client making the request
        
    Returns:
        dict: DNS lookup results or error message
    """
    # Check if we've performed this lookup recently for this client
    cache_key = f"{client_ip}:{domain}:{record_type}"
    current_time = time.time()
    
    # If we've done this lookup recently, return cached result
    if cache_key in _dns_timestamps:
        last_lookup_time = _dns_timestamps[cache_key]
        if current_time - last_lookup_time < 60:  # 1 minute rate limit
            if cache_key in _dns_cache:
                return _dns_cache[cache_key]
            else:
                return {"error": "Rate limit exceeded. Please try again later."}
    
    # Check if client has made too many lookups recently
    client_lookups = sum(1 for key, timestamp in _dns_timestamps.items() 
                        if key.startswith(f"{client_ip}:") and current_time - timestamp < 300)  # 5 minutes
    
    if client_lookups >= 10:  # Limit to 10 lookups per 5 minutes
        return {"error": "Rate limit exceeded. Please try again later."}
    
    # Perform the DNS lookup
    result = perform_dns_lookup(domain, record_type)
    
    # Cache the result
    _dns_cache[cache_key] = result
    _dns_timestamps[cache_key] = current_time
    
    # Clean old cache entries
    for key in list(_dns_timestamps.keys()):
        if current_time - _dns_timestamps[key] > 300:  # 5 minutes
            _dns_timestamps.pop(key, None)
            _dns_cache.pop(key, None)
    
    return result

# Cache ping results for rate limiting
_ping_cache = {}
_ping_timestamps = {}

def run_ping(target, count=5):
    """
    Run ping command to the target and return the results.
    
    Args:
        target (str): The hostname or IP address to ping
        count (int): Number of packets to send
        
    Returns:
        dict: Ping results or error message
    """
    if not validate_hostname(target):
        return {"error": "Invalid hostname or IP address"}
    
    # Validate count
    try:
        count = int(count)
        if count < 1 or count > 20:  # Limit to reasonable values
            count = 5
    except:
        count = 5
    
    try:
        # Use ping command
        command = ["ping", "-c", str(count), "-w", "10", target]  # Timeout after 10 seconds
        
        # Run the ping command
        process = subprocess.Popen(
            command, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = process.communicate(timeout=15)  # Allow extra time for timeout
        
        # Check if ping was successful
        is_success = process.returncode == 0
        
        # Parse the output
        output = stdout
        
        # Extract statistics
        avg_ms = None
        min_ms = None
        max_ms = None
        packet_loss = 100  # Default to 100% loss
        
        # Parse statistics
        stats_match = re.search(r'(\d+)% packet loss', stdout)
        if stats_match:
            packet_loss = int(stats_match.group(1))
        
        times_match = re.search(r'min/avg/max/mdev = ([\d.]+)/([\d.]+)/([\d.]+)/([\d.]+)', stdout)
        if times_match:
            min_ms = float(times_match.group(1))
            avg_ms = float(times_match.group(2))
            max_ms = float(times_match.group(3))
        
        return {
            "target": target,
            "success": is_success,
            "packet_loss": packet_loss,
            "min_ms": min_ms,
            "avg_ms": avg_ms,
            "max_ms": max_ms,
            "output": output
        }
        
    except subprocess.TimeoutExpired:
        return {
            "target": target,
            "success": False,
            "packet_loss": 100,
            "output": "Ping timed out"
        }
    except Exception as e:
        return {
            "target": target,
            "success": False,
            "error": f"Error running ping: {str(e)}",
            "output": f"Error: {str(e)}"
        }

def rate_limited_ping(target, count, client_ip):
    """
    Rate-limited ping to prevent abuse.
    
    Args:
        target (str): The hostname or IP address to ping
        count (int): Number of packets to send
        client_ip (str): The IP of the client making the request
        
    Returns:
        dict: Ping results or error message
    """
    # Check if we've pinged this target recently for this client
    cache_key = f"{client_ip}:{target}:{count}"
    current_time = time.time()
    
    # If we've pinged this recently, return cached result
    if cache_key in _ping_timestamps:
        last_ping_time = _ping_timestamps[cache_key]
        if current_time - last_ping_time < 60:  # 1 minute rate limit
            if cache_key in _ping_cache:
                return _ping_cache[cache_key]
            else:
                return {"error": "Rate limit exceeded. Please try again later."}
    
    # Check if client has made too many pings recently
    client_pings = sum(1 for key, timestamp in _ping_timestamps.items() 
                      if key.startswith(f"{client_ip}:") and current_time - timestamp < 300)  # 5 minutes
    
    if client_pings >= 10:  # Limit to 10 pings per 5 minutes
        return {"error": "Rate limit exceeded. Please try again later."}
    
    # Perform the ping
    result = run_ping(target, count)
    
    # Cache the result
    _ping_cache[cache_key] = result
    _ping_timestamps[cache_key] = current_time
    
    # Clean old cache entries
    for key in list(_ping_timestamps.keys()):
        if current_time - _ping_timestamps[key] > 300:  # 5 minutes
            _ping_timestamps.pop(key, None)
            _ping_cache.pop(key, None)
    
    return result