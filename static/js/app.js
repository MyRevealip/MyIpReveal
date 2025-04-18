document.addEventListener('DOMContentLoaded', function() {
  // Handle IP lookup form submission
  const lookupForm = document.getElementById('ip-lookup-form');
  if (lookupForm) {
    lookupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const ipInput = document.getElementById('ip-input');
      const ip = ipInput.value.trim();
      
      if (ip) {
        lookupIP(ip);
      } else {
        showError('Please enter a valid IP address');
      }
    });
  }
  
  // Function to lookup IP address
  function lookupIP(ip) {
    // Show loading state
    document.getElementById('results-container').innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    fetch('/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ip: ip })
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        showError(data.message);
      } else {
        displayResults(data);
      }
    })
    .catch(error => {
      showError('Failed to lookup IP address: ' + error.message);
    });
  }
  
  // Function to display lookup results
  function displayResults(data) {
    const resultsContainer = document.getElementById('results-container');
    
    // Create HTML for the results
    let html = `
      <div class="card ip-card mt-4">
        <div class="card-body">
          <h2 class="ip-display text-center">${data.ip || 'Unknown'}</h2>
          <div class="row g-3">
            <div class="col-md-6">
              <p><span class="ip-info-label">Location:</span> <span class="ip-info-value">${data.city || 'Unknown'}, ${data.region || ''}, ${data.country_name || 'Unknown'}</span></p>
              <p><span class="ip-info-label">ISP:</span> <span class="ip-info-value">${data.org || 'Unknown'}</span></p>
            </div>
            <div class="col-md-6">
              <p><span class="ip-info-label">Latitude/Longitude:</span> <span class="ip-info-value">${data.latitude || 'Unknown'}/${data.longitude || 'Unknown'}</span></p>
              <p><span class="ip-info-label">Timezone:</span> <span class="ip-info-value">${data.timezone || 'Unknown'}</span></p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    resultsContainer.innerHTML = html;
  }
  
  // Function to show error messages
  function showError(message) {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = `
      <div class="alert alert-danger mt-3" role="alert">
        ${message}
      </div>
    `;
  }
});
