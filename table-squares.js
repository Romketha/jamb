/**
 * Dynamic Table Cell Square Adjuster
 * Makes table cells perfectly square by adjusting height to match width
 * Handles responsive design and mobile optimizations
 */

function makeTableCellsSquare() {
    const table = document.getElementById('scoreTable');
    if (!table) return;
    
    // Get current screen width for responsive handling
    const screenWidth = window.innerWidth;
    
    // Apply dynamic sizing on all screen sizes now
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        
        // Find the second cell to determine the square size
        const secondCell = cells[1];
        if (!secondCell) return;
        
        const squareSize = secondCell.offsetWidth;
        
        cells.forEach(cell => {
            if (cell.cellIndex === 0) {
                // First column stays rectangular - keep its current width but adjust height to match squares
                if (screenWidth <= 480) {
                    // On mobile, use !important to override CSS
                    cell.style.setProperty('height', squareSize + 'px', 'important');
                    cell.style.setProperty('min-height', squareSize + 'px', 'important');
                    cell.style.setProperty('max-height', squareSize + 'px', 'important');
                } else {
                    cell.style.height = squareSize + 'px';
                    cell.style.minHeight = squareSize + 'px';
                    cell.style.maxHeight = squareSize + 'px';
                }
            } else {
                // All other cells should be perfect squares based on second cell width
                if (screenWidth <= 480) {
                    // On mobile, use !important to override CSS
                    cell.style.setProperty('height', squareSize + 'px', 'important');
                    cell.style.setProperty('min-height', squareSize + 'px', 'important');
                    cell.style.setProperty('max-height', squareSize + 'px', 'important');
                } else {
                    cell.style.height = squareSize + 'px';
                    cell.style.minHeight = squareSize + 'px';
                    cell.style.maxHeight = squareSize + 'px';
                }
            }
        });
    });
}

function makeTableCellsSquareWithDelay() {
    // Small delay to ensure DOM is fully rendered
    setTimeout(makeTableCellsSquare, 10);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', makeTableCellsSquareWithDelay);
} else {
    makeTableCellsSquareWithDelay();
}

// Recalculate on window resize with throttling
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(makeTableCellsSquare, 100);
});

// Recalculate when table content changes
const tableObserver = new MutationObserver(() => {
    makeTableCellsSquareWithDelay();
});

// Start observing when table is available
function startTableObserver() {
    const table = document.getElementById('scoreTable');
    if (table) {
        tableObserver.observe(table, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    } else {
        // If table not found, try again after a short delay
        setTimeout(startTableObserver, 100);
    }
}

startTableObserver();

// Export for manual triggering if needed
window.makeTableCellsSquare = makeTableCellsSquare;
