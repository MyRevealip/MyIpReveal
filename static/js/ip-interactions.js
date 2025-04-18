/**
 * IP Interaction Enhancements for MyIPReveal.com
 * Provides interactive features for IP results: hover effects, copy-to-clipboard, sharing
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing IP interactions');
  
  // Initialize the IP result items with copy icons and interactivity
  initializeIpResultItems();
  
  // Initialize share buttons and generate shareable links
  initializeShareLinks();
  
  // Force initialization after a short delay to ensure all elements are loaded
  setTimeout(function() {
    console.log('Re-initializing IP interactions after delay');
    initializeIpResultItems();
    initializeShareLinks();
  }, 500);
});

/**
 * Initializes all IP result items with interactive features
 */
function initializeIpResultItems() {
  // Find all IP info containers
  const ipItems = document.querySelectorAll('.ip-info-item, .ip-result-item');
  
  console.log('Found ' + ipItems.length + ' IP items to make interactive');
  
  // Apply the ip-result-item class to make them interactive
  ipItems.forEach(item => {
    // Only apply to items that have a value that can be copied
    const value = item.querySelector('.ip-info-value');
    if (!value || !value.textContent.trim()) {
      // For main IP display that doesn't have .ip-info-value
      if (item.classList.contains('ip-display')) {
        // Create and add the copy icon
        const copyIcon = document.createElement('i');
        copyIcon.className = 'fas fa-copy copy-icon';
        copyIcon.setAttribute('title', window.i18n?.translate('Copy') || 'Copy');
        copyIcon.setAttribute('aria-label', window.i18n?.translate('Copy') || 'Copy');
        item.appendChild(copyIcon);
        
        // Add click event to copy the value
        item.addEventListener('click', function() {
          const textToCopy = item.textContent.trim();
          copyToClipboard(textToCopy, item);
        });
      }
      return;
    }
    
    // Ensure the item has the interactive class
    if (!item.classList.contains('ip-result-item')) {
      item.classList.add('ip-result-item');
    }
    
    // Check if we already added a copy icon
    if (!item.querySelector('.copy-icon')) {
      // Create and add the copy icon
      const copyIcon = document.createElement('i');
      copyIcon.className = 'fas fa-copy copy-icon';
      copyIcon.setAttribute('title', window.i18n?.translate('Copy') || 'Copy');
      copyIcon.setAttribute('aria-label', window.i18n?.translate('Copy') || 'Copy');
      item.appendChild(copyIcon);
    }
    
    // Add click event to copy the value if not already added
    const existingClickListeners = item._hasClickListener;
    if (!existingClickListeners) {
      item.addEventListener('click', function() {
        const textToCopy = value.textContent.trim();
        copyToClipboard(textToCopy, item);
      });
      item._hasClickListener = true;
    }
  });
}

/**
 * Initializes share links and buttons
 */
function initializeShareLinks() {
  // Find the IP info container
  const ipInfoContainer = document.querySelector('.ip-info-container');
  if (!ipInfoContainer) return;
  
  // Add share controls
  const shareContainer = document.createElement('div');
  shareContainer.className = 'share-controls mt-4';
  
  // Create share button
  const shareButton = document.createElement('button');
  shareButton.className = 'btn btn-sm btn-outline-primary';
  shareButton.innerHTML = '<i class="fas fa-share-alt me-2"></i>' + 
                          (window.i18n?.translate('Share Results') || 'Share Results');
  
  // Create print button
  const printButton = document.createElement('button');
  printButton.className = 'btn btn-sm btn-outline-secondary ms-2';
  printButton.innerHTML = '<i class="fas fa-print me-2"></i>' + 
                          (window.i18n?.translate('Print Results') || 'Print Results');
  
  // Add buttons to container
  shareContainer.appendChild(shareButton);
  shareContainer.appendChild(printButton);
  
  // Add the container after the IP info
  ipInfoContainer.after(shareContainer);
  
  // Share button click event
  shareButton.addEventListener('click', function() {
    showShareOptions(ipInfoContainer);
  });
  
  // Print button click event
  printButton.addEventListener('click', function() {
    window.print();
  });
}

/**
 * Show sharing options for the IP results
 * @param {HTMLElement} container - The IP info container
 */
function showShareOptions(container) {
  // Check if share dialog already exists
  const existingDialog = document.querySelector('.share-link-container');
  if (existingDialog) {
    existingDialog.remove();
    return;
  }
  
  // Create share dialog
  const shareDialog = document.createElement('div');
  shareDialog.className = 'share-link-container mt-3 p-3 border rounded bg-light';
  
  // Get IP information for sharing
  const ipDetails = {};
  container.querySelectorAll('.ip-info-item').forEach(item => {
    const label = item.querySelector('.ip-info-label');
    const value = item.querySelector('.ip-info-value');
    if (label && value) {
      const key = label.textContent.trim().replace(':', '').toLowerCase().replace(/\s+/g, '_');
      ipDetails[key] = value.textContent.trim();
    }
  });
  
  // Create shareable URL with IP info
  const url = new URL(window.location.href);
  if (ipDetails.ip_address) {
    url.searchParams.set('ip', ipDetails.ip_address);
  }
  const shareableLink = url.toString();
  
  // Create link input
  const linkLabel = document.createElement('p');
  linkLabel.className = 'mb-2 fw-bold';
  linkLabel.textContent = window.i18n?.translate('Share this IP information:') || 'Share this IP information:';
  
  const linkInput = document.createElement('input');
  linkInput.type = 'text';
  linkInput.className = 'share-link-input';
  linkInput.value = shareableLink;
  linkInput.readOnly = true;
  
  // Create copy button
  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn btn-sm btn-primary';
  copyBtn.innerHTML = '<i class="fas fa-copy me-1"></i>' + 
                      (window.i18n?.translate('Copy Link') || 'Copy Link');
  
  // Create copied message
  const copiedMsg = document.createElement('span');
  copiedMsg.className = 'copied-message';
  copiedMsg.textContent = window.i18n?.translate('Copied!') || 'Copied!';
  
  // Add elements to dialog
  shareDialog.appendChild(linkLabel);
  shareDialog.appendChild(linkInput);
  shareDialog.appendChild(copyBtn);
  shareDialog.appendChild(copiedMsg);
  
  // Add dialog after container
  container.after(shareDialog);
  
  // Copy button event
  copyBtn.addEventListener('click', function() {
    copyToClipboard(shareableLink);
    
    // Show copied message
    copiedMsg.classList.add('visible');
    setTimeout(() => {
      copiedMsg.classList.remove('visible');
    }, 2000);
  });
  
  // Focus and select the input
  linkInput.focus();
  linkInput.select();
}

/**
 * Copy text to clipboard and show feedback
 * @param {string} text - Text to copy
 * @param {HTMLElement} element - Optional element to highlight when copied
 */
function copyToClipboard(text, element = null) {
  // Create temporary textarea to copy from
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  
  // Select and copy
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  
  // Show visual feedback if element provided
  if (element) {
    // Add copied class
    element.classList.add('copied');
    
    // Remove it after a delay
    setTimeout(() => {
      element.classList.remove('copied');
    }, 1500);
  }
}

// When the page loads with an IP parameter, auto-look it up
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const ipParam = urlParams.get('ip');
  
  if (ipParam && validateIp(ipParam)) {
    // Find IP lookup form
    const ipForm = document.querySelector('#ip-lookup-form');
    if (ipForm) {
      // Set the IP in the form
      const ipInput = ipForm.querySelector('input[name="ip"]');
      if (ipInput) {
        ipInput.value = ipParam;
        // Submit the form
        ipForm.dispatchEvent(new Event('submit'));
      }
    }
  }
});

/**
 * Validate an IP address
 * @param {string} ip - IP address to validate
 * @returns {boolean} - Whether the IP is valid
 */
function validateIp(ip) {
  // Simple regex for IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  
  // Simple regex for IPv6
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})$|^:((:[0-9a-fA-F]{1,4}){1,7}|:)$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}