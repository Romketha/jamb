// Game state
let gameState = {
    dice: [1, 2, 3, 4, 5],
    keptDice: [false, false, false, false, false],
    rollCount: 0,
    selectedCell: null,
    announced: null,
    kontraAnnounced: null,
    scores: {
        gd: {}, dg: {}, sl: {}, na: {}, kn: {}
    },
    currentColumn: null
};

// Column order restrictions
const columnOrder = {
    gd: ['1', '2', '3', '4', '5', '6', 'max', 'min', 'tris', 'dva-para', 'skala', 'full', 'poker', 'jamb'],
    dg: ['jamb', 'poker', 'full', 'skala', 'dva-para', 'tris', 'min', 'max', '6', '5', '4', '3', '2', '1']
};

// Initialize game
function initGame() {
    updateDiceDisplay();
    updateRollCounter();
    calculateAllSums();
    setupPreRollAnnounce();
}

// Setup pre-roll announce functionality
function setupPreRollAnnounce() {
    const kontraCheckbox = document.getElementById('kontraCheckbox');
    const kontraSelect = document.getElementById('kontraSelect');
    
    kontraCheckbox.addEventListener('change', function() {
        if (gameState.rollCount > 0) {
            // Prevent changing kontra after first roll
            this.checked = false;
            alert('Kontra najavu možete napraviti samo prije prvog bacanja!');
            return;
        }
        
        if (this.checked) {
            kontraSelect.disabled = false;
        } else {
            kontraSelect.disabled = true;
            kontraSelect.value = '';
            
            // Clear any existing kontra announcement
            if (gameState.kontraAnnounced) {
                const kontraCell = document.querySelector(`[data-row="${gameState.kontraAnnounced}"][data-col="kn"]`);
                if (kontraCell && !kontraCell.classList.contains('filled')) {
                    kontraCell.classList.remove('kontra-announced');
                    kontraCell.innerHTML = '';
                }
                gameState.kontraAnnounced = null;
                enableAllCells();
            }
            
            // Re-enable the checkbox itself and remove locked visual state
            this.disabled = false;
            document.querySelector('.kontra-announce-option').classList.remove('locked');
        }
    });
    
    kontraSelect.addEventListener('change', function() {
        if (gameState.rollCount > 0) {
            // Prevent changing kontra after first roll
            this.value = '';
            alert('Kontra najavu možete napraviti samo prije prvog bacanja!');
            return;
        }
        
        // Clear any previous kontra announcement
        if (gameState.kontraAnnounced && gameState.kontraAnnounced !== this.value) {
            const previousKontraCell = document.querySelector(`[data-row="${gameState.kontraAnnounced}"][data-col="kn"]`);
            if (previousKontraCell && !previousKontraCell.classList.contains('filled')) {
                previousKontraCell.classList.remove('kontra-announced');
                previousKontraCell.innerHTML = '';
            }
        }
        
        if (this.value) {
            gameState.kontraAnnounced = this.value;
            
            // Mark kontra announced cell
            const kontraCell = document.querySelector(`[data-row="${this.value}"][data-col="kn"]`);
            if (kontraCell && !kontraCell.classList.contains('filled')) {
                kontraCell.classList.add('kontra-announced');
                kontraCell.innerHTML = `<small>KONTRA<br>${getRowName(this.value)}</small>`;
            }
            
            // Disable the checkbox and add locked visual state
            kontraCheckbox.disabled = true;
            document.querySelector('.kontra-announce-option').classList.add('locked');
            
            alert(`Kontra najava: ${getRowName(this.value)}. Morate odigrati ovu kombinaciju u kolonu "Kontra Najava"!`);
            saveGameState(); // Save when kontra announcement is made
        } else {
            // Clear kontra announcement
            if (gameState.kontraAnnounced) {
                const kontraCell = document.querySelector(`[data-row="${gameState.kontraAnnounced}"][data-col="kn"]`);
                if (kontraCell && !kontraCell.classList.contains('filled')) {
                    kontraCell.classList.remove('kontra-announced');
                    kontraCell.innerHTML = '';
                }
                gameState.kontraAnnounced = null;
                enableAllCells();
            }
            
            // Re-enable the checkbox and remove locked visual state
            kontraCheckbox.disabled = false;
            document.querySelector('.kontra-announce-option').classList.remove('locked');
        }
    });
}

// Roll dice function
function rollDice() {
    if (gameState.rollCount >= 3) return;
    
    // Hide pre-roll announce section after first roll and disable kontra controls
    if (gameState.rollCount === 0) {
        document.getElementById('preRollAnnounce').style.display = 'none';
        
        // Disable kontra announcement controls after first roll
        const kontraCheckbox = document.getElementById('kontraCheckbox');
        const kontraSelect = document.getElementById('kontraSelect');
        kontraCheckbox.disabled = true;
        kontraSelect.disabled = true;
    }
    
    gameState.rollCount++;
    
    // Roll only non-kept dice
    for (let i = 0; i < 5; i++) {
        if (!gameState.keptDice[i]) {
            const diceElement = document.getElementById(`dice${i + 1}`);
            diceElement.classList.add('rolling');
            
            setTimeout(() => {
                gameState.dice[i] = Math.floor(Math.random() * 6) + 1;
                diceElement.textContent = gameState.dice[i];
                diceElement.classList.remove('rolling');
            }, 500);
        }
    }
    
    setTimeout(() => {
        updateDiceDisplay();
        updateRollCounter();
        
        // Save dice state after rolling
        saveGameState();
        
        // Show announce section after first roll (only if no kontra was made)
        if (gameState.rollCount === 1 && !gameState.kontraAnnounced) {
            document.getElementById('announceSection').style.display = 'block';
        }
        
        // Disable roll button after 3 rolls
        if (gameState.rollCount >= 3) {
            document.getElementById('rollButton').disabled = true;
        }
    }, 600);
}

// Update dice display
function updateDiceDisplay() {
    for (let i = 0; i < 5; i++) {
        const diceElement = document.getElementById(`dice${i + 1}`);
        const keepCheckbox = document.getElementById(`keep${i + 1}`);
        
        diceElement.textContent = gameState.dice[i];
        
        if (gameState.keptDice[i]) {
            diceElement.classList.add('kept');
        } else {
            diceElement.classList.remove('kept');
        }
        
        // Add click event to dice for keeping
        diceElement.onclick = () => toggleKeepDice(i);
        
        // Sync checkbox with dice state
        keepCheckbox.checked = gameState.keptDice[i];
        keepCheckbox.onchange = () => toggleKeepDice(i);
    }
}

// Toggle keep dice
function toggleKeepDice(index) {
    if (gameState.rollCount > 0) {
        gameState.keptDice[index] = !gameState.keptDice[index];
        updateDiceDisplay();
        saveGameState(); // Save when dice are kept/unkept
    }
}

// Update roll counter
function updateRollCounter() {
    document.getElementById('rollCount').textContent = gameState.rollCount;
    
    // Calculate round based on filled cells + 1
    const filledCells = document.querySelectorAll('.cell.filled').length;
    const currentRound = filledCells + 1;
    
    if (currentRound > 70) {
        document.getElementById('roundCount').textContent = "Igra završena";
    } else {
        document.getElementById('roundCount').textContent = currentRound;
    }
    
    if (gameState.rollCount >= 3) {
        document.getElementById('rollButton').disabled = true;
        document.getElementById('rollButton').textContent = 'Završeno bacanje';
    } else {
        document.getElementById('rollButton').disabled = false;
        document.getElementById('rollButton').textContent = `Baci kockice (${3 - gameState.rollCount} ostalo)`;
    }
}

// Make announcement
function makeAnnounce() {
    const announceSelect = document.getElementById('announceSelect');
    const selectedValue = announceSelect.value;
    
    if (selectedValue && gameState.rollCount === 1) {
        gameState.announced = selectedValue;
        
        // Mark announced cell as required
        const announceCell = document.querySelector(`[data-row="${selectedValue}"][data-col="na"]`);
        if (announceCell && !announceCell.classList.contains('filled')) {
            announceCell.classList.add('announced');
            announceCell.style.backgroundColor = '#ffc107';
            announceCell.style.color = '#212529';
            announceCell.style.fontWeight = 'bold';
            announceCell.innerHTML = `<small>NAJAVLJENO<br>${getRowName(selectedValue)}</small>`;
        }
        
        // Disable other cells until announcement is played
        disableNonAnnouncedCells();
        
        announceSelect.disabled = true;
        alert(`Najavili ste: ${getRowName(selectedValue)}. Sada MORATE odigrati ovu kombinaciju u kolonu "Najava"!`);
        saveGameState(); // Save when regular announcement is made
    }
}

// Disable cells that can't be played when there's an unfulfilled announcement
function disableNonAnnouncedCells() {
    // Handle regular announcement
    if (gameState.announced && gameState.scores['na'][gameState.announced] === undefined) {
        document.querySelectorAll('.cell').forEach(cell => {
            const row = cell.dataset.row;
            const col = cell.dataset.col;
            
            // Only allow the announced combination in "najava" column
            if (!(col === 'na' && row === gameState.announced)) {
                if (!cell.classList.contains('filled')) {
                    cell.classList.add('disabled');
                    cell.style.backgroundColor = '#f8f9fa';
                    cell.style.color = '#6c757d';
                    cell.style.cursor = 'not-allowed';
                }
            }
        });
    }
    
    // Handle kontra announcement
    if (gameState.kontraAnnounced && gameState.scores['kn'][gameState.kontraAnnounced] === undefined) {
        document.querySelectorAll('.cell').forEach(cell => {
            const row = cell.dataset.row;
            const col = cell.dataset.col;
            
            // Only allow the kontra announced combination in "kontra najava" column
            if (!(col === 'kn' && row === gameState.kontraAnnounced)) {
                if (!cell.classList.contains('filled')) {
                    cell.classList.add('disabled');
                    cell.style.backgroundColor = '#f8f9fa';
                    cell.style.color = '#6c757d';
                    cell.style.cursor = 'not-allowed';
                }
            }
        });
    }
}

// Enable all cells after announcement is fulfilled
function enableAllCells() {
    document.querySelectorAll('.cell.disabled').forEach(cell => {
        cell.classList.remove('disabled');
        cell.style.backgroundColor = '';
        cell.style.color = '';
        cell.style.cursor = 'pointer';
    });
}

// Get row name for display
function getRowName(row) {
    const names = {
        '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6',
        'max': 'Maximum', 'min': 'Minimum', 'tris': 'Tris', 'dva-para': 'Dva para', 'skala': 'Skala',
        'full': 'Full', 'poker': 'Poker', 'jamb': 'Jamb'
    };
    return names[row] || row;
}

// Select cell for scoring
function selectCell(cell) {
    if (gameState.rollCount === 0) {
        alert('Prvo morate baciti kockice!');
        return;
    }
    
    const row = cell.dataset.row;
    const col = cell.dataset.col;
    
    // Check if cell is already filled
    if (cell.classList.contains('filled')) {
        alert('Ova ćelija je već popunjena!');
        return;
    }
    
    // Check if cell is disabled due to unfulfilled announcement
    if (cell.classList.contains('disabled')) {
        if (gameState.announced) {
            alert(`Prvo morate odigrati najavljenu kombinaciju "${getRowName(gameState.announced)}" u kolonu Najava!`);
        } else if (gameState.kontraAnnounced) {
            alert(`Prvo morate odigrati kontra najavu "${getRowName(gameState.kontraAnnounced)}" u kolonu Kontra Najava!`);
        }
        return;
    }
    
    // Check column order restrictions
    if (!isValidMove(row, col)) {
        alert('Neispravan redoslijed za ovu kolonu!');
        return;
    }
    
    // Check announcement restrictions
    if (!isValidAnnouncement(row, col)) {
        return;
    }
    
    // Clear previous selection
    document.querySelectorAll('.cell.selected').forEach(c => c.classList.remove('selected'));
    
    // Select current cell
    cell.classList.add('selected');
    gameState.selectedCell = { row, col, element: cell };
    
    // Calculate and display score
    const score = calculateScore(row);
    cell.textContent = score;
    
    // Confirm placement
    setTimeout(() => {
        if (confirm(`Upisati ${score} bodova za ${getRowName(row)}?`)) {
            placeScore(row, col, score, cell);
        } else {
            cell.classList.remove('selected');
            // Restore announced text if it was an announced cell
            if (cell.classList.contains('announced')) {
                cell.innerHTML = `<small>NAJAVLJENO<br>${getRowName(row)}</small>`;
            } else if (cell.classList.contains('kontra-announced')) {
                cell.innerHTML = `<small>KONTRA<br>${getRowName(row)}</small>`;
            } else {
                cell.textContent = '';
            }
            gameState.selectedCell = null;
        }
    }, 100);
}

// Check if move is valid according to column order
function isValidMove(row, col) {
    if (col === 'sl' || col === 'na' || col === 'kn') return true; // Free column and announce columns
    
    const order = columnOrder[col];
    if (!order) return true;
    
    const rowIndex = order.indexOf(row);
    if (rowIndex === -1) return false;
    
    // Check if previous cells in order are filled (including 0 scores)
    for (let i = 0; i < rowIndex; i++) {
        const prevRow = order[i];
        if (gameState.scores[col][prevRow] === undefined) {
            return false;
        }
    }
    
    return true;
}

// Check announcement validity
function isValidAnnouncement(row, col) {
    // If there's an announcement, player MUST play in "najava" column first
    if (gameState.announced && gameState.scores['na'][gameState.announced] === undefined) {
        if (col !== 'na' || row !== gameState.announced) {
            alert(`Prvo morate odigrati najavljenu kombinaciju "${getRowName(gameState.announced)}" u kolonu Najava!`);
            return false;
        }
    }
    
    // If there's a kontra announcement, player MUST play it in "kontra najava" column
    if (gameState.kontraAnnounced && gameState.scores['kn'][gameState.kontraAnnounced] === undefined) {
        if (col !== 'kn' || row !== gameState.kontraAnnounced) {
            alert(`Prvo morate odigrati kontra najavu "${getRowName(gameState.kontraAnnounced)}" u kolonu Kontra Najava!`);
            return false;
        }
    }
    
    if (col === 'na') {
        if (gameState.announced !== row) {
            alert('Možete upisati samo ono što ste najavili!');
            return false;
        }
    }
    
    if (col === 'kn') {
        if (gameState.kontraAnnounced !== row) {
            alert('Možete upisati samo ono što ste kontra najavili!');
            return false;
        }
    }
    
    return true;
}

// Place score in cell
function placeScore(row, col, score, cell) {
    gameState.scores[col][row] = score;
    cell.classList.remove('selected', 'announced', 'kontra-announced');
    cell.classList.add('filled');
    
    // Calculate bonuses for special combinations
    let finalScore = score;
    let displayText = score.toString();
    
    if (['tris', 'dva-para', 'full', 'poker', 'jamb'].includes(row)) {
        const bonus = getBonusPoints(row, score);
        if (bonus > 0) {
            finalScore = score + bonus;
            displayText = `${finalScore}`;
            gameState.scores[col][row] = finalScore;
        }
    }
    
    cell.textContent = displayText;
    cell.style.fontWeight = 'bold';
    cell.style.backgroundColor = '#28a745';
    cell.style.color = 'white';
    
    // If this was the announced combination, enable all cells again
    if (col === 'na' && row === gameState.announced) {
        enableAllCells();
    }
    
    // If this was the kontra announced combination, enable all cells again
    if (col === 'kn' && row === gameState.kontraAnnounced) {
        enableAllCells();
    }
    
    calculateAllSums();
    saveGameState(); // Save to cookies
    
    // Check if game is finished (70 cells filled)
    const filledCells = document.querySelectorAll('.cell.filled').length;
    if (filledCells >= 70) {
        setTimeout(() => {
            alert(`🎉 Čestitamo! Igra je završena!\n\nUkupan rezultat: ${document.getElementById('grandTotal').textContent} bodova`);
        }, 500);
    }
    
    resetRoll();
}

// Calculate score for current dice combination
function calculateScore(row) {
    const dice = [...gameState.dice].sort((a, b) => a - b);
    const counts = {};
    
    dice.forEach(die => {
        counts[die] = (counts[die] || 0) + 1;
    });
    
    switch (row) {
        case '1': case '2': case '3': case '4': case '5': case '6':
            const num = parseInt(row);
            return dice.filter(d => d === num).length * num;
            
        case 'max':
            return dice.reduce((sum, die) => sum + die, 0);
            
        case 'min':
            return dice.reduce((sum, die) => sum + die, 0);
            
        case 'tris':
            for (let die in counts) {
                if (counts[die] >= 3) {
                    return parseInt(die) * 3; // Only count 3 dice of the same value
                }
            }
            return 0;
            
        case 'dva-para':
            const pairs = Object.keys(counts).filter(die => counts[die] >= 2);
            if (pairs.length >= 2) {
                // Count only the two pairs (2 dice each)
                pairs.sort((a, b) => b - a); // Sort descending to get highest pairs
                return (parseInt(pairs[0]) * 2) + (parseInt(pairs[1]) * 2);
            }
            return 0;
            
        case 'skala':
            const str1 = dice.join('');
            if (str1 === '12345') return 35;
            if (str1 === '23456') return 45;
            return 0;
            
        case 'full':
            const hasThree = Object.values(counts).includes(3);
            const hasTwo = Object.values(counts).includes(2);
            if (hasThree && hasTwo) {
                // Count 3 of one kind + 2 of another kind
                let threeKind = 0, twoKind = 0;
                for (let die in counts) {
                    if (counts[die] === 3) threeKind = parseInt(die) * 3;
                    if (counts[die] === 2) twoKind = parseInt(die) * 2;
                }
                return threeKind + twoKind;
            }
            return 0;
            
        case 'poker':
            for (let die in counts) {
                if (counts[die] >= 4) {
                    return parseInt(die) * 4; // Only count 4 dice of the same value
                }
            }
            return 0;
            
        case 'jamb':
            for (let die in counts) {
                if (counts[die] === 5) {
                    return parseInt(die) * 5; // All 5 dice of the same value
                }
            }
            return 0;
            
        default:
            return 0;
    }
}

// Get bonus points for special combinations
function getBonusPoints(row, baseScore) {
    if (baseScore === 0) return 0;
    
    const bonuses = {
        'tris': 10,
        'dva-para': 20,
        'full': 30,
        'poker': 40,
        'jamb': 50
    };
    
    return bonuses[row] || 0;
}

// Calculate all sums
function calculateAllSums() {
    ['gd', 'dg', 'sl', 'na', 'kn'].forEach(col => {
        // First part sum (1-6)
        let sum1 = 0;
        for (let i = 1; i <= 6; i++) {
            sum1 += gameState.scores[col][i] || 0;
        }
        if (sum1 >= 60) sum1 += 30; // Bonus for ≥60
        document.getElementById(`sum1-${col}`).textContent = sum1;
        
        // Second part (max - min)
        const maxScore = gameState.scores[col]['max'] || 0;
        const minScore = gameState.scores[col]['min'] || 0;
        const sum2 = maxScore - minScore;
        document.getElementById(`sum2-${col}`).textContent = sum2;
        
        // Third part sum
        let sum3 = 0;
        ['tris', 'dva-para', 'skala', 'full', 'poker', 'jamb'].forEach(row => {
            sum3 += gameState.scores[col][row] || 0;
        });
        document.getElementById(`sum3-${col}`).textContent = sum3;
        
        // Total
        const total = sum1 + sum2 + sum3;
        document.getElementById(`total-${col}`).textContent = total;
    });
    
    // Calculate grand total (sum of all columns)
    let grandTotal = 0;
    ['gd', 'dg', 'sl', 'na', 'kn'].forEach(col => {
        const colTotal = parseInt(document.getElementById(`total-${col}`).textContent) || 0;
        grandTotal += colTotal;
    });
    document.getElementById('grandTotal').textContent = grandTotal;
    
    // Update round counter based on filled cells
    updateRollCounter();
}

// Reset current roll
function resetRoll() {
    gameState.rollCount = 0;
    gameState.keptDice = [false, false, false, false, false];
    gameState.selectedCell = null;
    // Don't reset announced or kontraAnnounced - they should persist until fulfilled
    
    // Reset dice display
    for (let i = 0; i < 5; i++) {
        gameState.dice[i] = Math.floor(Math.random() * 6) + 1;
    }
    
    updateDiceDisplay();
    updateRollCounter();
    
    // Show pre-roll announce section if no announcements are active
    const noActiveAnnouncements = (!gameState.announced || gameState.scores['na'][gameState.announced] !== undefined) && 
                                  (!gameState.kontraAnnounced || gameState.scores['kn'][gameState.kontraAnnounced] !== undefined);
    
    if (noActiveAnnouncements) {
        document.getElementById('preRollAnnounce').style.display = 'block';
        document.getElementById('announceSection').style.display = 'none';
        document.getElementById('announceSelect').value = '';
        document.getElementById('announceSelect').disabled = false;
        
        // Reset kontra controls
        const kontraCheckbox = document.getElementById('kontraCheckbox');
        const kontraSelect = document.getElementById('kontraSelect');
        kontraCheckbox.checked = false;
        kontraCheckbox.disabled = false; // Make sure checkbox is enabled for new round
        kontraSelect.disabled = true;
        kontraSelect.value = '';
        document.querySelector('.kontra-announce-option').classList.remove('locked');
        
        gameState.announced = null;
        gameState.kontraAnnounced = null;
        enableAllCells();
        
        // Clear any kontra indications
        document.querySelectorAll('[data-col="kn"]').forEach(cell => {
            if (!cell.classList.contains('filled')) {
                cell.innerHTML = '';
                cell.style.backgroundColor = '';
                cell.classList.remove('kontra-announced');
            }
        });
    } else {
        // Keep pre-roll section hidden and maintain current announcement restrictions
        document.getElementById('preRollAnnounce').style.display = 'none';
        if (gameState.announced && gameState.scores['na'][gameState.announced] === undefined) {
            document.getElementById('announceSection').style.display = 'block';
        }
        disableNonAnnouncedCells();
    }
    
    // Re-enable roll button
    document.getElementById('rollButton').disabled = false;
    document.getElementById('rollButton').textContent = 'Baci kockice';
}

// Reset entire game
function resetGame() {
    if (confirm('Jeste li sigurni da želite početi novu igru? Ovo će obrisati sve upisane rezultate.')) {
        gameState = {
            dice: [1, 2, 3, 4, 5],
            keptDice: [false, false, false, false, false],
            rollCount: 0,
            selectedCell: null,
            announced: null,
            kontraAnnounced: null,
            scores: {
                gd: {}, dg: {}, sl: {}, na: {}, kn: {}
            },
            currentColumn: null
        };
        
        // Clear all cells
        document.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('filled', 'selected', 'announced', 'kontra-announced', 'disabled');
            cell.style.fontWeight = '';
            cell.style.backgroundColor = '';
            cell.style.color = '';
            cell.style.cursor = '';
        });
        
        // Reset sums
        document.querySelectorAll('.sum-cell, .total-cell').forEach(cell => {
            cell.textContent = '0';
        });
        
        // Reset grand total
        document.getElementById('grandTotal').textContent = '0';
        
        // Reset pre-roll announce section
        document.getElementById('preRollAnnounce').style.display = 'block';
        document.getElementById('announceSection').style.display = 'none';
        const kontraCheckbox = document.getElementById('kontraCheckbox');
        const kontraSelect = document.getElementById('kontraSelect');
        kontraCheckbox.checked = false;
        kontraCheckbox.disabled = false;
        kontraSelect.disabled = true;
        kontraSelect.value = '';
        document.querySelector('.kontra-announce-option').classList.remove('locked');
        
        clearGameState(); // Clear cookies
        resetRoll();
        initGame();
    }
}

// Initialize game on page load
window.onload = function() {
    loadGameState(); // Load from cookies first
    initGame();
};

// Save game state to cookies
function saveGameState() {
    const stateToSave = {
        scores: gameState.scores,
        announced: gameState.announced,
        kontraAnnounced: gameState.kontraAnnounced,
        dice: gameState.dice,
        keptDice: gameState.keptDice,
        rollCount: gameState.rollCount,
        timestamp: Date.now()
    };
    
    // Save for 30 days
    const expires = new Date();
    expires.setTime(expires.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    document.cookie = `jambGameState=${JSON.stringify(stateToSave)}; expires=${expires.toUTCString()}; path=/`;
    
    // Show save indicator
    const gameInfo = document.getElementById('gameInfo');
    if (gameInfo) {
        gameInfo.style.display = 'block';
        gameInfo.innerHTML = '<p>💾 Igra je automatski spremljena!</p>';
        setTimeout(() => {
            gameInfo.innerHTML = '<p>🎯 Igra je automatski spremljena i bit će vraćena kada osvježite stranicu</p>';
        }, 2000);
    }
}

// Load game state from cookies
function loadGameState() {
    const cookies = document.cookie.split(';');
    let gameStateCookie = null;
    
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'jambGameState') {
            gameStateCookie = value;
            break;
        }
    }
    
    if (gameStateCookie) {
        try {
            const savedState = JSON.parse(decodeURIComponent(gameStateCookie));
            
            // Check if saved state is not too old (30 days)
            if (savedState.timestamp && (Date.now() - savedState.timestamp) < (30 * 24 * 60 * 60 * 1000)) {
                gameState.scores = savedState.scores || { gd: {}, dg: {}, sl: {}, na: {}, kn: {} };
                gameState.announced = savedState.announced || null;
                gameState.kontraAnnounced = savedState.kontraAnnounced || null;
                
                // Restore dice state and roll count
                if (savedState.dice) {
                    gameState.dice = savedState.dice;
                }
                if (savedState.keptDice) {
                    gameState.keptDice = savedState.keptDice;
                }
                if (savedState.rollCount !== undefined) {
                    gameState.rollCount = savedState.rollCount;
                }
                
                restoreTableFromState();
                
                // Show that game was loaded
                const gameInfo = document.getElementById('gameInfo');
                if (gameInfo && (Object.keys(gameState.scores.gd).length > 0 || gameState.rollCount > 0)) {
                    gameInfo.style.display = 'block';
                    gameInfo.innerHTML = '<p>📂 Prethodna igra je učitana iz cookies-a!</p>';
                }
            }
        } catch (e) {
            console.log('Error loading game state:', e);
        }
    }
}

// Restore table display from loaded state
function restoreTableFromState() {
    ['gd', 'dg', 'sl', 'na', 'kn'].forEach(col => {
        Object.keys(gameState.scores[col]).forEach(row => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                const score = gameState.scores[col][row];
                
                // Check if this is a bonus combination
                let displayText = score.toString();
                if (['tris', 'dva-para', 'full', 'poker', 'jamb'].includes(row) && score > 0) {
                    const baseScore = calculateScore(row); // This would need the original dice, so we'll estimate
                    const bonus = getBonusPoints(row, baseScore);
                    if (bonus > 0 && score > baseScore) {
                        displayText = `${score - bonus}+${bonus}`;
                    }
                }
                
                cell.textContent = displayText;
                cell.classList.add('filled');
                cell.style.fontWeight = 'bold';
                cell.style.backgroundColor = '#28a745';
                cell.style.color = 'white';
            }
        });
    });
    
    // Restore dice display and UI state
    updateDiceDisplay();
    updateRollCounter();
    
    // Restore pre-roll announce section visibility based on roll count
    if (gameState.rollCount === 0) {
        document.getElementById('preRollAnnounce').style.display = 'block';
        document.getElementById('announceSection').style.display = 'none';
    } else {
        document.getElementById('preRollAnnounce').style.display = 'none';
        // Show announce section only if no kontra was made and rollCount is 1
        if (gameState.rollCount === 1 && !gameState.kontraAnnounced) {
            document.getElementById('announceSection').style.display = 'block';
        } else {
            document.getElementById('announceSection').style.display = 'none';
        }
    }
    
    // Restore announcement state if there's an unfulfilled announcement
    if (gameState.announced && gameState.scores['na'][gameState.announced] === undefined) {
        const announceCell = document.querySelector(`[data-row="${gameState.announced}"][data-col="na"]`);
        if (announceCell && !announceCell.classList.contains('filled')) {
            announceCell.classList.add('announced');
            announceCell.style.backgroundColor = '#ffc107';
            announceCell.style.color = '#212529';
            announceCell.style.fontWeight = 'bold';
            announceCell.innerHTML = `<small>NAJAVLJENO<br>${getRowName(gameState.announced)}</small>`;
            
            // Show announcement section and disable other cells
            document.getElementById('announceSection').style.display = 'block';
            document.getElementById('announceSelect').value = gameState.announced;
            document.getElementById('announceSelect').disabled = true;
            disableNonAnnouncedCells();
        }
    }
    
    // Restore kontra announcement state if there's an unfulfilled kontra announcement
    if (gameState.kontraAnnounced && gameState.scores['kn'][gameState.kontraAnnounced] === undefined) {
        const kontraCell = document.querySelector(`[data-row="${gameState.kontraAnnounced}"][data-col="kn"]`);
        if (kontraCell && !kontraCell.classList.contains('filled')) {
            kontraCell.classList.add('kontra-announced');
            kontraCell.innerHTML = `<small>KONTRA<br>${getRowName(gameState.kontraAnnounced)}</small>`;
            
            // Restore kontra UI state
            const kontraCheckbox = document.getElementById('kontraCheckbox');
            const kontraSelect = document.getElementById('kontraSelect');
            kontraCheckbox.checked = true;
            kontraCheckbox.disabled = true;
            kontraSelect.disabled = false;
            kontraSelect.value = gameState.kontraAnnounced;
            document.querySelector('.kontra-announce-option').classList.add('locked');
            
            // Hide pre-roll announce section and disable other cells
            document.getElementById('preRollAnnounce').style.display = 'none';
            disableNonAnnouncedCells();
        }
    }
    
    calculateAllSums();
}

// Clear game state cookies
function clearGameState() {
    document.cookie = 'jambGameState=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}
