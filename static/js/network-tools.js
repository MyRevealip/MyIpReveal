/**
 * Network Tools Functionality for MyIPReveal.com
 * Handles loading spinners and form submission for network tools
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the network tool forms
  initNetworkTools();
});

/**
 * Initialize all network tool forms with loading spinners
 */
function initNetworkTools() {
  // Find all network tool forms
  const networkForms = document.querySelectorAll('.network-tool-form');
  
  // Process each form
  networkForms.forEach(form => {
    setupFormWithLoader(form);
  });
}

/**
 * Set up a form with loading spinner functionality
 * @param {HTMLFormElement} form - The form element to enhance
 */
function setupFormWithLoader(form) {
  // Create loading spinner if it doesn't exist
  let spinnerContainer = form.querySelector('.loading-spinner-container');
  if (!spinnerContainer) {
    spinnerContainer = createSpinner();
    
    // Find the results container or create one if it doesn't exist
    let resultsContainer = document.querySelector('#results-container');
    if (!resultsContainer) {
      resultsContainer = document.createElement('div');
      resultsContainer.id = 'results-container';
      resultsContainer.className = 'results-container';
      form.after(resultsContainer);
    }
    
    // Insert spinner before results container
    resultsContainer.before(spinnerContainer);
  }
  
  // Add submit event listener
  form.addEventListener('submit', function(e) {
    // Show spinner
    spinnerContainer.classList.add('visible');
    
    // Add loading class to results container if it exists
    const resultsContainer = document.querySelector('#results-container');
    if (resultsContainer) {
      resultsContainer.classList.add('loading');
    }
    
    // If it's an AJAX form (has data-ajax attribute), handle the submission
    if (form.hasAttribute('data-ajax')) {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(form);
      const formDataObj = {};
      
      formData.forEach((value, key) => {
        formDataObj[key] = value;
      });
      
      // Get the endpoint from the form action
      const endpoint = form.action;
      
      // Submit the form via fetch
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(formDataObj)
      })
      .then(response => response.json())
      .then(data => {
        // Hide spinner
        spinnerContainer.classList.remove('visible');
        
        // Remove loading class from results container
        if (resultsContainer) {
          resultsContainer.classList.remove('loading');
        }
        
        // Display the results
        if (resultsContainer) {
          displayResults(resultsContainer, data);
        }
      })
      .catch(error => {
        // Hide spinner
        spinnerContainer.classList.remove('visible');
        
        // Remove loading class from results container
        if (resultsContainer) {
          resultsContainer.classList.remove('loading');
          resultsContainer.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
        
        console.error('Error:', error);
      });
    }
  });
}

/**
 * Create a loading spinner element
 * @returns {HTMLElement} - The spinner container element
 */
function createSpinner() {
  const container = document.createElement('div');
  container.className = 'loading-spinner-container';
  
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  
  const text = document.createElement('div');
  text.className = 'loading-text';
  text.textContent = 'Processing...';
  
  container.appendChild(spinner);
  container.appendChild(text);
  
  return container;
}

/**
 * Display results in the results container
 * @param {HTMLElement} container - The container to display results in
 * @param {Object} data - The results data
 */
function displayResults(container, data) {
  // Clear previous results
  container.innerHTML = '';
  
  if (data.error) {
    // Display error message
    const errorAlert = document.createElement('div');
    errorAlert.className = 'alert alert-danger';
    errorAlert.textContent = data.message || 'An error occurred';
    container.appendChild(errorAlert);
    return;
  }
  
  // Display successful results based on the tool type
  if (data.tool === 'traceroute') {
    displayTracerouteResults(container, data);
  } else if (data.tool === 'port-scan') {
    displayPortScanResults(container, data);
  } else if (data.tool === 'dns-lookup') {
    displayDnsLookupResults(container, data);
  } else if (data.tool === 'ping') {
    displayPingResults(container, data);
  } else {
    // Generic display for other tools
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(data, null, 2);
    container.appendChild(pre);
  }
}

/**
 * Display traceroute results
 * @param {HTMLElement} container - The results container
 * @param {Object} data - Traceroute results data
 */
function displayTracerouteResults(container, data) {
  // Create a table for traceroute results
  const table = document.createElement('table');
  table.className = 'table table-striped table-hover';
  
  // Create table header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th scope="col">Hop</th>
      <th scope="col">IP Address</th>
      <th scope="col">Hostname</th>
      <th scope="col">Response Time</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // Create table body
  const tbody = document.createElement('tbody');
  
  // Add rows for each hop
  data.hops.forEach((hop, index) => {
    const tr = document.createElement('tr');
    
    // Hop number
    const hopCell = document.createElement('td');
    hopCell.textContent = hop.hop || (index + 1);
    tr.appendChild(hopCell);
    
    // IP Address
    const ipCell = document.createElement('td');
    ipCell.textContent = hop.ip || '*';
    tr.appendChild(ipCell);
    
    // Hostname
    const hostnameCell = document.createElement('td');
    hostnameCell.textContent = hop.hostname || '*';
    tr.appendChild(hostnameCell);
    
    // Response Time
    const timeCell = document.createElement('td');
    timeCell.textContent = hop.time ? `${hop.time} ms` : '*';
    tr.appendChild(timeCell);
    
    tbody.appendChild(tr);
  });
  
  table.appendChild(tbody);
  container.appendChild(table);
  
  // Add summary if available
  if (data.target) {
    const summary = document.createElement('div');
    summary.className = 'alert alert-info mt-3';
    summary.innerHTML = `<strong>Target:</strong> ${data.target}`;
    container.appendChild(summary);
  }
}

/**
 * Display port scan results
 * @param {HTMLElement} container - The results container
 * @param {Object} data - Port scan results data
 */
function displayPortScanResults(container, data) {
  // Create a table for port scan results
  const table = document.createElement('table');
  table.className = 'table table-striped table-hover';
  
  // Create table header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th scope="col">Port</th>
      <th scope="col">Status</th>
      <th scope="col">Service</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // Create table body
  const tbody = document.createElement('tbody');
  
  // Add rows for each port
  data.ports.forEach(port => {
    const tr = document.createElement('tr');
    
    // Port number
    const portCell = document.createElement('td');
    portCell.textContent = port.port;
    tr.appendChild(portCell);
    
    // Status
    const statusCell = document.createElement('td');
    if (port.open) {
      statusCell.innerHTML = '<span class="badge bg-success">Open</span>';
    } else {
      statusCell.innerHTML = '<span class="badge bg-secondary">Closed</span>';
    }
    tr.appendChild(statusCell);
    
    // Service
    const serviceCell = document.createElement('td');
    serviceCell.textContent = port.service || 'Unknown';
    tr.appendChild(serviceCell);
    
    tbody.appendChild(tr);
  });
  
  table.appendChild(tbody);
  container.appendChild(table);
  
  // Add summary if available
  if (data.target) {
    const summary = document.createElement('div');
    summary.className = 'alert alert-info mt-3';
    summary.innerHTML = `<strong>Target:</strong> ${data.target}`;
    container.appendChild(summary);
  }
}

/**
 * Display DNS lookup results
 * @param {HTMLElement} container - The results container
 * @param {Object} data - DNS lookup results data
 */
function displayDnsLookupResults(container, data) {
  // Add domain information
  const domainInfo = document.createElement('div');
  domainInfo.className = 'alert alert-info mb-4';
  domainInfo.innerHTML = `<strong>Domain:</strong> ${data.domain}`;
  container.appendChild(domainInfo);
  
  // Create a table for each record type
  Object.keys(data.records).forEach(recordType => {
    const records = data.records[recordType];
    
    if (records && records.length > 0) {
      // Section header
      const sectionTitle = document.createElement('h5');
      sectionTitle.className = 'mt-3 mb-2';
      sectionTitle.textContent = `${recordType} Records`;
      container.appendChild(sectionTitle);
      
      // Create table
      const table = document.createElement('table');
      table.className = 'table table-striped table-sm';
      
      // Table header structure depends on record type
      const thead = document.createElement('thead');
      let headerHTML = '<tr>';
      
      // Different headers based on record type
      if (recordType === 'MX') {
        headerHTML += `<th scope="col">Priority</th><th scope="col">Exchange</th>`;
      } else if (recordType === 'SOA') {
        headerHTML += `<th scope="col">Primary NS</th><th scope="col">Email</th><th scope="col">Serial</th><th scope="col">Refresh</th><th scope="col">Retry</th>`;
      } else if (recordType === 'TXT') {
        headerHTML += `<th scope="col">Text</th>`;
      } else {
        headerHTML += `<th scope="col">Value</th><th scope="col">TTL</th>`;
      }
      
      headerHTML += '</tr>';
      thead.innerHTML = headerHTML;
      table.appendChild(thead);
      
      // Create table body
      const tbody = document.createElement('tbody');
      
      // Add rows for each record
      records.forEach(record => {
        const tr = document.createElement('tr');
        
        // Different cell structure based on record type
        if (recordType === 'MX') {
          // Priority
          const priorityCell = document.createElement('td');
          priorityCell.textContent = record.priority || '0';
          tr.appendChild(priorityCell);
          
          // Exchange
          const exchangeCell = document.createElement('td');
          exchangeCell.textContent = record.exchange || record.value || '';
          tr.appendChild(exchangeCell);
        } else if (recordType === 'SOA') {
          // Primary NS
          const nsCell = document.createElement('td');
          nsCell.textContent = record.mname || '';
          tr.appendChild(nsCell);
          
          // Email
          const emailCell = document.createElement('td');
          emailCell.textContent = record.rname || '';
          tr.appendChild(emailCell);
          
          // Serial
          const serialCell = document.createElement('td');
          serialCell.textContent = record.serial || '';
          tr.appendChild(serialCell);
          
          // Refresh
          const refreshCell = document.createElement('td');
          refreshCell.textContent = record.refresh || '';
          tr.appendChild(refreshCell);
          
          // Retry
          const retryCell = document.createElement('td');
          retryCell.textContent = record.retry || '';
          tr.appendChild(retryCell);
        } else if (recordType === 'TXT') {
          // Text
          const txtCell = document.createElement('td');
          txtCell.textContent = record.value || '';
          txtCell.style.wordBreak = 'break-word';
          tr.appendChild(txtCell);
        } else {
          // Value
          const valueCell = document.createElement('td');
          valueCell.textContent = record.value || '';
          tr.appendChild(valueCell);
          
          // TTL
          const ttlCell = document.createElement('td');
          ttlCell.textContent = record.ttl || '';
          tr.appendChild(ttlCell);
        }
        
        tbody.appendChild(tr);
      });
      
      table.appendChild(tbody);
      container.appendChild(table);
    }
  });
  
  // If no records found
  if (Object.keys(data.records).length === 0) {
    const noRecords = document.createElement('div');
    noRecords.className = 'alert alert-warning';
    noRecords.textContent = 'No DNS records found for this domain.';
    container.appendChild(noRecords);
  }
}

/**
 * Display ping results
 * @param {HTMLElement} container - The results container
 * @param {Object} data - Ping results data
 */
function displayPingResults(container, data) {
  // Add target information
  const targetInfo = document.createElement('div');
  targetInfo.className = 'alert alert-info mb-4';
  targetInfo.innerHTML = `<strong>Target:</strong> ${data.target}`;
  container.appendChild(targetInfo);
  
  // Create ping summary
  const summary = document.createElement('div');
  summary.className = 'card mb-3';
  
  const summaryBody = document.createElement('div');
  summaryBody.className = 'card-body';
  
  // Create summary content
  let summaryHTML = '';
  if (data.success) {
    summaryHTML += `
      <h5 class="card-title">Ping Summary</h5>
      <ul class="list-group list-group-flush">
        <li class="list-group-item"><strong>Packets Sent:</strong> ${data.packets_transmitted || 0}</li>
        <li class="list-group-item"><strong>Packets Received:</strong> ${data.packets_received || 0}</li>
        <li class="list-group-item"><strong>Packet Loss:</strong> ${data.packet_loss || '0%'}</li>
    `;
    
    if (data.min_time !== undefined) {
      summaryHTML += `<li class="list-group-item"><strong>Min Time:</strong> ${data.min_time} ms</li>`;
    }
    if (data.avg_time !== undefined) {
      summaryHTML += `<li class="list-group-item"><strong>Avg Time:</strong> ${data.avg_time} ms</li>`;
    }
    if (data.max_time !== undefined) {
      summaryHTML += `<li class="list-group-item"><strong>Max Time:</strong> ${data.max_time} ms</li>`;
    }
    
    summaryHTML += `</ul>`;
  } else {
    summaryHTML = `
      <h5 class="card-title">Ping Failed</h5>
      <p class="card-text text-danger">${data.message || 'Failed to ping target.'}</p>
    `;
  }
  
  summaryBody.innerHTML = summaryHTML;
  summary.appendChild(summaryBody);
  container.appendChild(summary);
  
  // Display individual ping responses if available
  if (data.responses && data.responses.length > 0) {
    const responsesTitle = document.createElement('h5');
    responsesTitle.className = 'mt-4 mb-2';
    responsesTitle.textContent = 'Ping Responses';
    container.appendChild(responsesTitle);
    
    const responseList = document.createElement('div');
    responseList.className = 'list-group';
    
    data.responses.forEach((response, index) => {
      const responseItem = document.createElement('div');
      responseItem.className = 'list-group-item';
      
      if (response.success) {
        responseItem.innerHTML = `
          <strong>Reply from ${response.ip || data.target}:</strong> time=${response.time}ms TTL=${response.ttl || 'N/A'}
        `;
      } else {
        responseItem.innerHTML = `
          <strong>Request timed out.</strong>
        `;
        responseItem.classList.add('text-muted');
      }
      
      responseList.appendChild(responseItem);
    });
    
    container.appendChild(responseList);
  }
}