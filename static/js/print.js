/**
 * Print functionality for MyIPReveal.com
 * Provides clean, formatted printing of IP information
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the print buttons
    initPrintButtons();
    
    // Add print-specific elements that will only show when printing
    addPrintElements();
});

/**
 * Initialize print buttons throughout the site
 */
function initPrintButtons() {
    // Find all print buttons
    const printButtons = document.querySelectorAll('.print-button');
    
    // Add click event listeners to each button
    printButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Optional: Prepare content for printing
            preparePrintView();
            
            // Print the page
            window.print();
        });
    });
}

/**
 * Add elements that will only be visible when printing
 */
function addPrintElements() {
    // Add print header (site name & logo)
    const printHeader = document.createElement('div');
    printHeader.className = 'print-header';
    printHeader.style.display = 'none'; // Hidden on screen, visible in print
    
    // Add site logo and name
    printHeader.innerHTML = `
        <div class="print-header-logo">
            <i class="fas fa-network-wired" style="font-size: 24pt;"></i>
        </div>
        <div>MyIPReveal.com</div>
    `;
    
    // Add printed date
    const printDate = document.createElement('div');
    printDate.className = 'print-date';
    printDate.style.display = 'none'; // Hidden on screen, visible in print
    printDate.innerHTML = `Printed on ${new Date().toLocaleDateString()}`;
    
    // Add footer with site URL
    const printFooter = document.createElement('div');
    printFooter.className = 'print-footer'; 
    printFooter.style.display = 'none'; // Hidden on screen, visible in print
    printFooter.innerHTML = `Source: MyIPReveal.com | ${window.location.href}`;
    
    // Add all elements to the body
    document.body.prepend(printHeader);
    document.body.prepend(printDate);
    document.body.appendChild(printFooter);
}

/**
 * Prepare the page for printing by making any necessary modifications
 */
function preparePrintView() {
    // You can add any dynamic modifications here before printing
    // For example, expand any collapsed elements that should be visible in print
    
    const collapsedElements = document.querySelectorAll('.collapse');
    collapsedElements.forEach(el => {
        if (!el.classList.contains('show')) {
            // For elements that should be expanded in print version
            if (!el.classList.contains('no-print-expand')) {
                el.classList.add('show');
                // Keep track so we can collapse it again after printing
                el.setAttribute('data-print-expanded', 'true');
            }
        }
    });
    
    // Listen for afterprint event to restore any changes
    window.addEventListener('afterprint', function() {
        // Collapse any elements we expanded just for printing
        document.querySelectorAll('[data-print-expanded="true"]').forEach(el => {
            el.classList.remove('show');
            el.removeAttribute('data-print-expanded');
        });
    }, {once: true}); // Only run this once
}