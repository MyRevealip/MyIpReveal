/**
 * Network Tools Tutorial System for MyIPReveal.com
 * Provides interactive step-by-step tutorials for network tools
 */

class NetworkToolsTutorial {
  constructor() {
    this.currentStep = 0;
    this.tutorialActive = false;
    this.tutorialSteps = [];
    this.toolType = null;
    this.tutorialContainer = null;
    this.tutorialOverlay = null;
    this.tutorialContent = null;
    this.tutorialNav = null;
    this.targetElement = null;
  }

  /**
   * Initialize the tutorial system
   */
  init() {
    // Check if we're on a network tool page
    this.detectToolType();
    
    if (!this.toolType) {
      return; // Not a supported tutorial page
    }
    
    // Create tutorial button
    this.createTutorialButton();
    
    // Listen for tutorial button click
    document.addEventListener('click', (e) => {
      if (e.target.closest('.start-tutorial-btn')) {
        this.startTutorial();
      }
    });
    
    console.log(`Tutorial system initialized for: ${this.toolType}`);
  }
  
  /**
   * Detect which tool page we're on
   */
  detectToolType() {
    const path = window.location.pathname;
    
    if (path.includes('/traceroute')) {
      this.toolType = 'traceroute';
      this.tutorialSteps = this.getTracerouteTutorialSteps();
    } else if (path.includes('/port-scanner')) {
      this.toolType = 'port-scanner';
      this.tutorialSteps = this.getPortScannerTutorialSteps();
    } else if (path.includes('/dns-lookup')) {
      this.toolType = 'dns-lookup';
      this.tutorialSteps = this.getDnsLookupTutorialSteps();
    } else if (path.includes('/ping-tool')) {
      this.toolType = 'ping';
      this.tutorialSteps = this.getPingTutorialSteps();
    }
  }
  
  /**
   * Create tutorial button in the page
   */
  createTutorialButton() {
    console.log('Creating tutorial button...');
    
    // Find the card container - try different selectors to be more robust
    const cardContainers = document.querySelectorAll('.content-card .card-body, .card.content-card .card-body');
    if (cardContainers.length === 0) {
      console.error('No card container found for tutorial button');
      return;
    }
    
    // Use the first content card, which should contain the tool form
    const cardContainer = cardContainers[0];
    console.log('Found card container:', cardContainer);
    
    // Add the tutorial button
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'tutorial-button-container text-center mb-4 mt-3';
    buttonDiv.innerHTML = `
      <button class="btn btn-outline-primary start-tutorial-btn">
        <i class="fas fa-graduation-cap me-2"></i> Start Interactive Tutorial
      </button>
      <div class="small text-muted mt-2">New to network tools? Learn how to use this tool step by step.</div>
    `;
    
    // Check if button already exists to avoid duplicates
    if (cardContainer.querySelector('.tutorial-button-container')) {
      console.log('Tutorial button already exists');
      return;
    }
    
    // Try to insert after various elements in order of preference
    const infoAlert = cardContainer.querySelector('.alert-info');
    const form = cardContainer.querySelector('form');
    const heading = cardContainer.querySelector('h2, .h2, h3, .h3');
    
    if (infoAlert) {
      console.log('Inserting button after info alert');
      infoAlert.after(buttonDiv);
    } else if (heading && !form) {
      // Only insert after heading if we don't have a form
      // (to avoid inserting before the form)
      console.log('Inserting button after heading');
      heading.after(buttonDiv);
    } else if (form) {
      // Insert before the form
      console.log('Inserting button before form');
      form.before(buttonDiv);
    } else {
      // Last resort: insert at the beginning of card body
      console.log('Inserting button at beginning of card');
      const firstChild = cardContainer.firstChild;
      cardContainer.insertBefore(buttonDiv, firstChild);
    }
    
    console.log('Tutorial button created and inserted');
  }
  
  /**
   * Start the tutorial experience
   */
  startTutorial() {
    if (this.tutorialActive) return;
    
    this.tutorialActive = true;
    this.currentStep = 0;
    
    // Create tutorial overlay and container
    this.createTutorialElements();
    
    // Show first step
    this.showStep(0);
    
    console.log('Tutorial started');
  }
  
  /**
   * Create tutorial UI elements
   */
  createTutorialElements() {
    // Create the tutorial overlay
    this.tutorialOverlay = document.createElement('div');
    this.tutorialOverlay.className = 'tutorial-overlay';
    
    // Create the tutorial container
    this.tutorialContainer = document.createElement('div');
    this.tutorialContainer.className = 'tutorial-container';
    
    // Create tutorial content
    this.tutorialContent = document.createElement('div');
    this.tutorialContent.className = 'tutorial-content';
    
    // Create tutorial navigation
    this.tutorialNav = document.createElement('div');
    this.tutorialNav.className = 'tutorial-nav';
    
    // Assemble the elements
    this.tutorialContainer.appendChild(this.tutorialContent);
    this.tutorialContainer.appendChild(this.tutorialNav);
    
    // Add to the document
    document.body.appendChild(this.tutorialOverlay);
    document.body.appendChild(this.tutorialContainer);
    
    // Add event listeners for navigation
    this.tutorialNav.addEventListener('click', (e) => {
      if (e.target.classList.contains('tutorial-next')) {
        this.nextStep();
      } else if (e.target.classList.contains('tutorial-prev')) {
        this.prevStep();
      } else if (e.target.classList.contains('tutorial-close')) {
        this.endTutorial();
      }
    });
  }
  
  /**
   * Show a specific tutorial step
   * @param {number} stepIndex - The step index to show
   */
  showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.tutorialSteps.length) {
      return;
    }
    
    const step = this.tutorialSteps[stepIndex];
    this.currentStep = stepIndex;
    
    // Update content
    this.tutorialContent.innerHTML = `
      <div class="tutorial-step">
        <div class="tutorial-step-header">
          <div class="tutorial-step-number">Step ${stepIndex + 1} of ${this.tutorialSteps.length}</div>
          <div class="tutorial-step-title">${step.title}</div>
        </div>
        <div class="tutorial-step-description">${step.description}</div>
        ${step.image ? `<div class="tutorial-step-image"><img src="${step.image}" alt="${step.title}"></div>` : ''}
      </div>
    `;
    
    // Update navigation
    this.tutorialNav.innerHTML = `
      <button class="btn btn-sm btn-outline-secondary tutorial-prev" ${stepIndex === 0 ? 'disabled' : ''}>
        <i class="fas fa-arrow-left me-1"></i> Previous
      </button>
      <button class="btn btn-sm btn-danger tutorial-close">
        <i class="fas fa-times me-1"></i> Close Tutorial
      </button>
      <button class="btn btn-sm btn-primary tutorial-next" ${stepIndex === this.tutorialSteps.length - 1 ? 'disabled' : ''}>
        Next <i class="fas fa-arrow-right ms-1"></i>
      </button>
    `;
    
    // Position tutorial container near the target element if specified
    if (step.target) {
      this.targetElement = document.querySelector(step.target);
      if (this.targetElement) {
        this.positionTutorialNearTarget();
        this.highlightElement(this.targetElement);
      } else {
        this.resetPosition();
      }
    } else {
      this.resetPosition();
    }
  }
  
  /**
   * Position the tutorial container near the target element
   */
  positionTutorialNearTarget() {
    if (!this.targetElement || !this.tutorialContainer) return;
    
    const rect = this.targetElement.getBoundingClientRect();
    const containerHeight = this.tutorialContainer.offsetHeight;
    const windowHeight = window.innerHeight;
    
    // Scroll to make the target visible if needed
    if (rect.top < 0 || rect.bottom > windowHeight) {
      this.targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Position based on target location in viewport
    if (rect.top > windowHeight / 2) {
      // If target is in the bottom half, position above
      this.tutorialContainer.style.top = `${Math.max(10, rect.top - containerHeight - 20)}px`;
    } else {
      // If target is in the top half, position below
      this.tutorialContainer.style.top = `${rect.bottom + 20}px`;
    }
    
    // Horizontal positioning
    const containerWidth = this.tutorialContainer.offsetWidth;
    const left = Math.max(10, Math.min(
      window.innerWidth - containerWidth - 10,
      rect.left + (rect.width / 2) - (containerWidth / 2)
    ));
    
    this.tutorialContainer.style.left = `${left}px`;
  }
  
  /**
   * Reset tutorial container to center position
   */
  resetPosition() {
    if (!this.tutorialContainer) return;
    
    this.tutorialContainer.style.left = '50%';
    this.tutorialContainer.style.top = '50%';
    this.tutorialContainer.style.transform = 'translate(-50%, -50%)';
  }
  
  /**
   * Highlight an element on the page
   * @param {HTMLElement} element - The element to highlight
   */
  highlightElement(element) {
    // Remove any existing highlights
    const existingHighlight = document.querySelector('.tutorial-highlight');
    if (existingHighlight) {
      existingHighlight.remove();
    }
    
    // Create highlight element
    const highlight = document.createElement('div');
    highlight.className = 'tutorial-highlight';
    
    // Position highlight
    const rect = element.getBoundingClientRect();
    highlight.style.top = `${rect.top + window.scrollY}px`;
    highlight.style.left = `${rect.left + window.scrollX}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
    
    // Add to document
    document.body.appendChild(highlight);
  }
  
  /**
   * Go to the next tutorial step
   */
  nextStep() {
    if (this.currentStep < this.tutorialSteps.length - 1) {
      this.showStep(this.currentStep + 1);
    }
  }
  
  /**
   * Go to the previous tutorial step
   */
  prevStep() {
    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1);
    }
  }
  
  /**
   * End the tutorial
   */
  endTutorial() {
    this.tutorialActive = false;
    
    // Remove tutorial elements
    if (this.tutorialContainer) {
      this.tutorialContainer.remove();
      this.tutorialContainer = null;
    }
    
    if (this.tutorialOverlay) {
      this.tutorialOverlay.remove();
      this.tutorialOverlay = null;
    }
    
    // Remove any highlights
    const existingHighlight = document.querySelector('.tutorial-highlight');
    if (existingHighlight) {
      existingHighlight.remove();
    }
    
    console.log('Tutorial ended');
  }
  
  /**
   * Get tutorial steps for Traceroute tool
   * @returns {Array} Array of tutorial step objects
   */
  getTracerouteTutorialSteps() {
    return [
      {
        title: "Welcome to Traceroute",
        description: "Traceroute shows the path that internet traffic takes to reach a website or server. It's like a roadmap of the internet, showing each 'hop' along the way. This tutorial will show you how to use this tool.",
        target: null
      },
      {
        title: "Enter a Target",
        description: "Start by entering a domain name (like google.com) or IP address in this field. This is the destination you want to trace the route to.",
        target: "#target"
      },
      {
        title: "Run the Traceroute",
        description: "Click the 'Start Traceroute' button to begin tracing the route to your target. This will send packets across the internet and record their journey.",
        target: "#trace-button"
      },
      {
        title: "Understanding Results: Hops",
        description: "Each row in the results represents a 'hop' - a router or server that your data passes through on its way to the destination. The first hop is usually your local network or ISP.",
        target: ".traceroute-results"
      },
      {
        title: "Understanding Results: Response Time",
        description: "The response time shows how long it took for data to reach that hop and return (in milliseconds). Higher times can indicate network congestion or greater physical distance.",
        target: ".response-time"
      },
      {
        title: "Understanding Results: Location",
        description: "The location column shows the geographic location of each server or router. This helps you visualize the physical path your data takes across countries and continents.",
        target: ".location"
      },
      {
        title: "Reading Asterisks (*)",
        description: "Some hops might show asterisks (*) instead of response times. This usually means the router is configured not to respond to traceroute requests for security reasons, but your data still passes through it.",
        target: null
      },
      {
        title: "Practical Uses",
        description: "You can use traceroute to:<ul><li>Troubleshoot connection problems</li><li>Identify slow points in the network</li><li>See how many networks your data crosses</li><li>Understand the geographical path of your internet traffic</li></ul>",
        target: null
      },
      {
        title: "Try an Example",
        description: "Try running a trace to a major website like Google (8.8.8.8) or GitHub to see a typical internet path. Different targets will show different routes across the internet.",
        target: ".interactive-card"
      },
      {
        title: "Tutorial Complete!",
        description: "You now know how to use the traceroute tool and interpret its results. Feel free to experiment with different targets to see how internet routes differ. If you need this tutorial again, just click the 'Start Interactive Tutorial' button.",
        target: null
      }
    ];
  }
  
  /**
   * Get tutorial steps for Port Scanner tool
   * @returns {Array} Array of tutorial step objects
   */
  getPortScannerTutorialSteps() {
    return [
      {
        title: "Welcome to Port Scanner",
        description: "A port scanner checks which ports (communication channels) are open on a server or website. This helps identify which services are running and accessible. This tutorial will show you how to use this tool safely and effectively.",
        target: null
      },
      {
        title: "Enter a Target",
        description: "Start by entering a domain name (like example.com) or IP address in this field. This is the server you want to scan for open ports. Remember to only scan servers you own or have permission to scan.",
        target: "#target"
      },
      {
        title: "Run the Port Scan",
        description: "Click the 'Scan Ports' button to check which ports are open on the target server. The scan will check common ports used for web servers, email, file transfers, and other services.",
        target: "#scan-button"
      },
      {
        title: "Understanding Results: Port Numbers",
        description: "Each row shows a port number. These are standardized - for example, port 80 is used for HTTP (web traffic), port 443 for HTTPS (secure web traffic), and port 22 for SSH (secure administration).",
        target: "#port-results-table"
      },
      {
        title: "Understanding Results: Service",
        description: "The service column identifies what type of service typically uses that port. For example, seeing 'HTTP' means the server is likely running a web server.",
        target: null
      },
      {
        title: "Understanding Results: Status",
        description: "Open ports are marked with a green badge. These ports are accepting connections and indicate an active service. Closed ports aren't shown in the results.",
        target: null
      },
      {
        title: "Common Ports and Their Meanings",
        description: "Here are some common ports and what they mean:<ul><li>Port 80/443: Web server</li><li>Port 22: SSH (secure administration)</li><li>Port 21: FTP (file transfers)</li><li>Port 25/587/465: Email (SMTP)</li><li>Port 3306: MySQL database</li><li>Port 3389: Remote Desktop</li></ul>",
        target: null
      },
      {
        title: "Security Considerations",
        description: "When analyzing port scan results:<ul><li>Only necessary ports should be open</li><li>Unexpected open ports could indicate security risks</li><li>Critical servers should have a minimal number of open ports</li><li>Firewalls should restrict access to sensitive ports</li></ul>",
        target: null
      },
      {
        title: "Try an Example",
        description: "Try scanning a major website like cloudflare.com to see which ports are typically open on a secure website. Most websites will have at least ports 80 and 443 open for web traffic.",
        target: ".interactive-card"
      },
      {
        title: "Tutorial Complete!",
        description: "You now know how to use the port scanner tool and interpret its results. Remember to use this tool responsibly and only scan servers you own or have permission to scan. If you need this tutorial again, just click the 'Start Interactive Tutorial' button.",
        target: null
      }
    ];
  }
  
  /**
   * Get tutorial steps for DNS Lookup tool
   * @returns {Array} Array of tutorial step objects
   */
  getDnsLookupTutorialSteps() {
    return [
      {
        title: "Welcome to DNS Lookup",
        description: "DNS (Domain Name System) translates human-friendly domain names into IP addresses that computers use to identify each other. This tool lets you look up various DNS records for any domain. This tutorial will show you how to use it.",
        target: null
      },
      {
        title: "Enter a Domain",
        description: "Start by entering a domain name (like example.com) in this field. This is the domain you want to look up DNS records for.",
        target: "#domain"
      },
      {
        title: "Select Record Type",
        description: "Choose which type of DNS record you want to look up. If you're not sure, select 'ALL' to see all available record types. Each record type serves a different purpose in the DNS system.",
        target: "#record-type"
      },
      {
        title: "Run the DNS Lookup",
        description: "Click the 'Lookup DNS' button to query the DNS system for information about the domain you entered.",
        target: "#lookup-button"
      },
      {
        title: "Understanding A Records",
        description: "A records map a domain to IPv4 addresses. These are the most common records and point the domain to a server's IP address. For example, example.com might point to 93.184.216.34.",
        target: null
      },
      {
        title: "Understanding AAAA Records",
        description: "AAAA records are similar to A records but for IPv6 addresses. These longer addresses (like 2606:2800:220:1:248:1893:25c8:1946) are the newer IP address format with more available addresses.",
        target: null
      },
      {
        title: "Understanding MX Records",
        description: "MX (Mail Exchange) records specify the mail servers responsible for receiving email for the domain. They include a priority value - lower numbers have higher priority.",
        target: null
      },
      {
        title: "Understanding TXT Records",
        description: "TXT records hold text information and are used for various purposes including: <ul><li>SPF records (email sender verification)</li><li>DKIM (email authentication)</li><li>Domain verification for services</li><li>Information for specific applications</li></ul>",
        target: null
      },
      {
        title: "Understanding NS Records",
        description: "NS (Name Server) records indicate which DNS servers are authoritative for the domain. These servers contain the master DNS records for the domain.",
        target: null
      },
      {
        title: "Understanding CNAME Records",
        description: "CNAME (Canonical Name) records create an alias from one domain to another. For example, www.example.com might be a CNAME pointing to example.com.",
        target: null
      },
      {
        title: "Practical Uses",
        description: "You can use DNS Lookup to:<ul><li>Troubleshoot email delivery issues</li><li>Verify domain configuration</li><li>Check if DNS changes have propagated</li><li>Find a website's hosting provider</li><li>Verify SPF and DKIM records for email</li></ul>",
        target: null
      },
      {
        title: "Try an Example",
        description: "Try looking up records for a major website like google.com to see how complex DNS configurations work. Different record types will show different aspects of how the domain is configured.",
        target: null
      },
      {
        title: "Tutorial Complete!",
        description: "You now know how to use the DNS Lookup tool and interpret different types of DNS records. This knowledge is valuable for website administration, troubleshooting, and understanding how the internet works at a deeper level. If you need this tutorial again, just click the 'Start Interactive Tutorial' button.",
        target: null
      }
    ];
  }
  
  /**
   * Get tutorial steps for Ping tool
   * @returns {Array} Array of tutorial step objects
   */
  getPingTutorialSteps() {
    return [
      {
        title: "Welcome to Ping Tool",
        description: "Ping is one of the most basic and useful network diagnostic tools. It sends small data packets to a target and measures how long they take to return, telling you if a server is reachable and responsive. This tutorial will show you how to use this tool.",
        target: null
      },
      {
        title: "Enter a Target",
        description: "Start by entering a domain name (like google.com) or IP address in this field. This is the server you want to send ping requests to.",
        target: "#target"
      },
      {
        title: "Set Packet Count",
        description: "You can adjust how many ping packets to send. The default is typically 5, which is enough to get a good average response time without waiting too long.",
        target: "#count"
      },
      {
        title: "Run the Ping",
        description: "Click the 'Start Ping' button to begin sending ping packets to your target. The tool will show the results as they come in.",
        target: "#ping-button"
      },
      {
        title: "Understanding Results: Summary",
        description: "The summary shows key statistics from the ping test:<ul><li>Packets sent and received</li><li>Packet loss percentage</li><li>Minimum, average, and maximum response times</li></ul>",
        target: null
      },
      {
        title: "Understanding Results: Response Time",
        description: "Response time (measured in milliseconds) tells you how long it took for each packet to reach the destination and return. Lower times mean better connection quality.<ul><li><20ms: Excellent</li><li>20-50ms: Very good</li><li>50-100ms: Good</li><li>100-300ms: Fair</li><li>>300ms: Poor</li></ul>",
        target: null
      },
      {
        title: "Understanding Results: Packet Loss",
        description: "Packet loss shows the percentage of packets that didn't return. Ideally, this should be 0%. Any packet loss indicates network problems:<ul><li>0%: Perfect connection</li><li>1-2%: Minor issues</li><li>3-10%: Moderate problems</li><li>>10%: Significant connection problems</li></ul>",
        target: null
      },
      {
        title: "Reading TTL Values",
        description: "TTL (Time To Live) indicates how many network hops a packet can traverse before being discarded. Different operating systems use different starting TTL values:<ul><li>Windows: 128</li><li>Unix/Linux: 64</li><li>macOS: 64</li></ul>A lower than expected TTL can indicate the packet traveled through many routers.",
        target: null
      },
      {
        title: "Practical Uses",
        description: "Ping is useful for:<ul><li>Checking if a server is online</li><li>Testing network connectivity</li><li>Measuring connection quality and latency</li><li>Troubleshooting network issues</li><li>Monitoring network performance over time</li></ul>",
        target: null
      },
      {
        title: "Interpreting Timeouts",
        description: "If you see 'Request timed out' messages, it could mean:<ul><li>The target server is down</li><li>The target is blocking ping requests (common for security)</li><li>There's a network issue between you and the target</li><li>A firewall is blocking the packets</li></ul>",
        target: null
      },
      {
        title: "Try an Example",
        description: "Try pinging a reliable service like 8.8.8.8 (Google's DNS) to see what good ping results look like. Then try a distant server to see how geography affects latency.",
        target: null
      },
      {
        title: "Tutorial Complete!",
        description: "You now know how to use the ping tool and interpret its results. This simple but powerful tool is often the first step in diagnosing network issues. If you need this tutorial again, just click the 'Start Interactive Tutorial' button.",
        target: null
      }
    ];
  }
}

// Initialize the tutorial system when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Network tutorial system loading...');
  const tutorial = new NetworkToolsTutorial();
  tutorial.init();
  
  // Make tutorial accessible globally
  window.networkTutorial = tutorial;
  console.log('Network tutorial system initialized');
});