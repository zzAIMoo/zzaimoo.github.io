const colors = {
    gray: { name: 'Gray', hex: '#aaaaaa', function: 'Empty space' },
    black: { name: 'Black', hex: '#000000', function: 'Moves row right' },
    red: { name: 'Red', hex: '#ff0000', function: 'White→Black, Black→Red' },
    green: { name: 'Green', hex: '#00ff00', function: 'Swaps with opposite tile' },
    yellow: { name: 'Yellow', hex: '#ffff00', function: 'Changes place with tile above' },
    pink: { name: 'Pink', hex: '#ff69b4', function: 'Rotates adjacent tiles clockwise' },
    purple: { name: 'Purple', hex: '#800080', function: 'Changes place with tile below' },
    orange: { name: 'Orange', hex: '#ffa500', function: 'Matches most frequent unique adjacent color' },
    white: { name: 'White', hex: '#ffffff', function: 'Toggles itself and all neighbouring tiles between grey and white' },
    blue: { name: 'Blue', hex: '#4387d9', function: 'Copies middle tile behaviour when clicked' }
};

let selectedColor = null;
let grid = Array(9).fill('gray');
let targetCorners = { tl: null, tr: null, bl: null, br: null };
let solvingInProgress = false;
let stopSolving = false;
let useWrittenNotation = false;

let sandboxGrid = Array(9).fill('gray');
let sandboxSelectedColor = null;
let sandboxTargetCorners = { tl: null, tr: null, bl: null, br: null };
let sandboxInPlayMode = false;
let sandboxPuzzleSolved = false;
let sandboxInitialPlayGrid = null;
let currentSandboxSolutionPath = null;

const positionNotations = [
    'TOP LEFT', 'TOP', 'TOP RIGHT',
    'LEFT', 'MID', 'RIGHT',
    'BOTTOM LEFT', 'BOTTOM', 'BOTTOM RIGHT'
];

const loadingPhrases = [
    "Mora Jai-ing stuff ...",
    "Thinking really hard...",
    "Putting squares in circles...",
    "Woah colors are hard guys...",
    "Herbert gotta listen to me...",
    "I swear i know how to solve these things..."
];

let loadingModalElement = null;
let loadingPhraseElement = null;
let loadingModalTitleElement = null;
let sandboxTestSolveBtn = null;
let spoilerFreeToggle = null;

const difficultySettings = {
    1: { label: 'Easy', minSteps: 3, maxSteps: 6 },    // Trivial if < 6 steps
    2: { label: 'Medium', minSteps: 7, maxSteps: 10 }, // Trivial if < 7 steps
    3: { label: 'Hard', minSteps: 11, maxSteps: 20 }   // Trivial if < 11 steps
};
let currentDifficulty = difficultySettings[2];

const LOCAL_STORAGE_HISTORY_KEY = 'sandboxPuzzleHistory';
const MAX_HISTORY_ITEMS = 10;

document.addEventListener('DOMContentLoaded', function () {
    initGrid();
    initColorPalette();
    initEventListeners();
    updateCornerSymbolsDisplay();
    initSandbox();
    initDifficultySlider();
    const victoryModalResetBtn = document.getElementById('sandbox-victory-reset-btn');
    if (victoryModalResetBtn) {
        victoryModalResetBtn.addEventListener('click', function () {
            const modal = document.getElementById('sandbox-victory-modal');
            if (modal) {
                modal.classList.remove('visible');
            }
            document.getElementById('reset-sandbox-btn').click();
        });
    }

    const victoryModalRestartBtn = document.getElementById('sandbox-restart-puzzle-modal-btn');
    if (victoryModalRestartBtn) {
        victoryModalRestartBtn.addEventListener('click', function () {
            restartSandboxPuzzle();
        });
    }

    populateSandboxHistoryUI();
    initClearHistoryButton();
    checkInitialSandboxStateForModal();
    initSpoilerMode();
    initSolutionStepSpoilers('solution-output');
    initSolutionStepSpoilers('sandbox-solution-display');
});

function initGrid() {
    const gridElement = document.getElementById('puzzle-grid');
    gridElement.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.style.backgroundColor = colors.gray.hex;
        gridElement.appendChild(cell);
    }
}

//completely made up by AI btw, no idea how svg works lol
function getIconForColor(colorName, tileHex) {
    let iconFillColor = '#e0e0e0';
    let iconStrokeColor = 'none';
    let svgPath = '';

    const lightTileBackgrounds = ['#ffff00', '#ffffff'];
    if (lightTileBackgrounds.includes(tileHex.toLowerCase())) {
        iconFillColor = '#333333';
    }

    switch (colorName.toLowerCase()) {
        case 'orange': // Corarica
            iconFillColor = '#FFFFFF';
            svgPath = '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>';
            break;
        case 'red': // Fenn Aries
            iconFillColor = '#FFFFFF';
            svgPath = '<polygon points="12,2 22.8,9.2 18.2,22.8 5.8,22.8 1.2,9.2"/>';
            break;
        case 'purple': // Eraja
            iconFillColor = '#FFFFFF';
            svgPath = '<path d="M6 2h12v5l-4 4 4 4v5H6v-5l4-4-4-4V2zm2 1h8v3.24L12 10.5 7.99 6.24H8V3zm0 18h8v-3.24L12 13.5 7.99 17.76H8v3z"/>';
            break;
        case 'black': // Orina Aries
            iconFillColor = '#E0E0E0';
            svgPath = '<path d="M9 20 C9 18, 7 18, 7 16 L7 8 C7 6, 9 6, 9 4 A4 4 0 0 1 15 4 C15 6, 17 6, 17 8 L17 16 C17 18, 15 18, 15 20 A3 3 0 0 1 9 20 Z"/>';
            break;
        case 'green': // Nuance?
            iconFillColor = '#FFFFFF';
            svgPath = '<polygon points="12,2 22,12 12,22 2,12"/>';
            break;
        case 'pink': // Verra? (i forgor)
            iconFillColor = '#AEAEAE';
            iconStrokeColor = '#333333';
            svgPath = '<path d="M4,18 L8,7 L18,11 A5.85,5.85 0 0 1 14,22 Z" stroke-width="1.2"/>';
            break;
        case 'yellow': // Arch Aries
            iconFillColor = '#333333';
            svgPath = '<path d="M3 18h18l-5-8-4 4-4-3-5 7z"/>';
            break;
        case 'white': // Mora Jai
            const strokeColorForRainbow = '#555555';
            return '<svg viewBox="0 0 24 24" fill="none" stroke-width="2">' +
                `<path d="M5 18A7 7 0 0 1 19 18" stroke="${strokeColorForRainbow}"/>` +
                `<path d="M3.5 18A8.5 8.5 0 0 1 20.5 18" stroke="${strokeColorForRainbow}"/>` +
                `<path d="M2 18A10 10 0 0 1 22 18" stroke="${strokeColorForRainbow}"/>` +
                '</svg>';
        case 'blue': // Holly Leaf Blue Prince damn wth 4th wall break
            iconFillColor = '#E0E0E0';
            svgPath = '<path d="M12 2 C15 5, 18 6, 21 10 C19 12, 17 12.5, 15 14.5 C17 16.5, 19 17, 21 20 C18 22, 15 22, 12 22 C9 22, 6 22, 3 20 C5 17, 7 16.5, 9 14.5 C7 12.5, 5 12, 3 10 C6 6, 9 5, 12 2 Z"/>';
            break;
        case 'gray': // Nothing
        default:
            return ''; // No icon
    }

    if (svgPath) {
        return `<svg viewBox="0 0 24 24" fill="${iconFillColor}" ${iconStrokeColor !== 'none' ? `stroke="${iconStrokeColor}"` : ''}>${svgPath}</svg>`;
    }
    return '';
}

function initColorPalette() {
    const paletteElement = document.getElementById('color-palette');
    paletteElement.innerHTML = '';
    for (const [key, color] of Object.entries(colors)) {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.dataset.color = key;
        colorOption.style.backgroundColor = color.hex;
        colorOption.title = `${color.name}: ${color.function}`;

        const iconSvgString = getIconForColor(key, color.hex);
        if (iconSvgString) {
            colorOption.innerHTML = iconSvgString;
        }

        paletteElement.appendChild(colorOption);
    }
}

function initEventListeners() {
    const colorPalette = document.getElementById('color-palette');
    const puzzleGrid = document.getElementById('puzzle-grid');
    const cornerSymbolDivs = {
        tl: document.getElementById('symbol-tl'),
        tr: document.getElementById('symbol-tr'),
        bl: document.getElementById('symbol-bl'),
        br: document.getElementById('symbol-br'),
    };

    colorPalette.addEventListener('click', function (event) {
        if (event.target.classList.contains('color-option')) {
            document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
            event.target.classList.add('selected');
            selectedColor = event.target.dataset.color;
            Object.values(cornerSymbolDivs).forEach(div => div.classList.remove('active-corner'));
        }
    });

    puzzleGrid.addEventListener('click', function (event) {
        if (event.target.classList.contains('cell') && selectedColor) {
            const index = parseInt(event.target.dataset.index);
            grid[index] = selectedColor;
            event.target.style.backgroundColor = colors[selectedColor].hex;
        }
    });

    for (const id in cornerSymbolDivs) {
        cornerSymbolDivs[id].addEventListener('click', function () {
            if (selectedColor) {
                targetCorners[id] = selectedColor;
                updateCornerSymbolsDisplay();
            } else {
                showNotification('Select a color from the palette first, then click a corner symbol.', 'error');
            }
        });
    }

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function () {
            const tabId = this.dataset.tab;
            switchTab(tabId);
        });
    });

    document.getElementById('reset-btn').addEventListener('click', function () {
        grid = Array(9).fill('gray');
        document.querySelectorAll('.cell').forEach(cell => {
            cell.style.backgroundColor = colors.gray.hex;
        });
        targetCorners = { tl: null, tr: null, bl: null, br: null };
        selectedColor = null;
        document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
        updateCornerSymbolsDisplay();
        Object.values(cornerSymbolDivs).forEach(div => div.classList.remove('active-corner'));
        showNotification('Grid and target corners have been reset', 'success');
    });

    document.getElementById('proceed-btn').addEventListener('click', function () {
        if (!validateInputs()) {
            return;
        }
        document.querySelectorAll('.tab')[1].click();
    });

    document.getElementById('solve-btn').addEventListener('click', async function () {
        if (solvingInProgress) return;
        solvingInProgress = true;
        stopSolving = false;
        document.getElementById('solve-btn').disabled = true;
        document.getElementById('stop-btn').disabled = false;
        document.getElementById('solution-output').innerHTML = '<p>Solving puzzle... This may take a moment.</p>';
        setTimeout(() => {
            solvePuzzle();
        }, 100);
    });

    document.getElementById('stop-btn').addEventListener('click', function () {
        stopSolving = true;
        showNotification('Stopping solver...', 'error');
    });

    document.getElementById('toggle-notation-btn').addEventListener('click', function () {
        togglePositionNotation();
    });

    const toggleBtn = document.getElementById('toggle-notation-btn');
    toggleBtn.textContent = useWrittenNotation ?
        'Use Numeric Notation (1-9)' :
        'Use Written Notation (TL, TOP, etc)';

    if (sandboxTestSolveBtn) {
        sandboxTestSolveBtn.addEventListener('click', function () {
            if (currentSandboxSolutionPath && sandboxInitialPlayGrid) {
                displaySandboxSolution(currentSandboxSolutionPath, sandboxInitialPlayGrid, sandboxTargetCorners);
                document.getElementById('sandbox-solution-display').style.display = 'block';
            } else {
                if (!validateSandboxTargets()) {
                    return;
                }
                grid = [...sandboxGrid];
                targetCorners = { ...sandboxTargetCorners };
                document.querySelectorAll('.tab').forEach(tabElement => {
                    if (tabElement.dataset.tab === 'solve') {
                        tabElement.click();
                    }
                });
                setTimeout(() => {
                    document.getElementById('solve-btn').click();
                }, 100);
                showNotification('Sandbox puzzle sent to main solver. Check the \'Solve\' tab for results.', 'info');
            }
        });
    }
}

function validateInputs() {
    for (const corner in targetCorners) {
        if (!targetCorners[corner]) {
            showNotification('Please select all target corner colors', 'error');
            return false;
        }
    }
    return true;
}

function showNotification(message, type = 'info', duration = 3000) {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        console.error('Toast container not found!');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const messageElement = document.createElement('span');
    messageElement.textContent = message;
    toast.appendChild(messageElement);

    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close-btn';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => toast.remove(), 300);
    };
    toast.appendChild(closeButton);

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-fade-in');
    }, 10);

    const autoRemoveTimeout = setTimeout(() => {
        toast.classList.remove('toast-fade-in');
        toast.classList.add('toast-fade-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);

    closeButton.addEventListener('click', () => {
        clearTimeout(autoRemoveTimeout);
    });
}

function performAction(state, index) {
    const color = state[index];
    let newState = [...state];
    const rows = 3;
    const cols = 3;
    const row = Math.floor(index / cols);
    const col = index % cols;

    switch (color) {
        case 'gray':
            break;
        case 'black':
            const rowStart = rows * row;
            const rowEnd = rows * (row + 1);
            const lastTileInRow = newState[rowEnd - 1];
            for (let i = rowEnd - 1; i > rowStart; i--) {
                newState[i] = newState[i - 1];
            }
            newState[rowStart] = lastTileInRow;
            break;
        case 'red':
            for (let i = 0; i < newState.length; i++) {
                if (newState[i] === 'white') newState[i] = 'black';
                else if (newState[i] === 'black') newState[i] = 'red';
            }
            break;
        case 'green':
            const oppositeRow = rows - 1 - row;
            const oppositeCol = cols - 1 - col;
            const oppositeIndex = oppositeRow * cols + oppositeCol;
            [newState[index], newState[oppositeIndex]] = [newState[oppositeIndex], newState[index]];
            break;
        case 'yellow':
            if (row > 0) {
                const upIndex = (row - 1) * cols + col;
                [newState[index], newState[upIndex]] = [newState[upIndex], newState[index]];
            }
            break;
        case 'pink':
            const surroundingPositions = [];
            if (row > 0 && col > 0) surroundingPositions.push({ r: row - 1, c: col - 1 });
            if (row > 0) surroundingPositions.push({ r: row - 1, c: col });
            if (row > 0 && col < cols - 1) surroundingPositions.push({ r: row - 1, c: col + 1 });
            if (col < cols - 1) surroundingPositions.push({ r: row, c: col + 1 });
            if (row < rows - 1 && col < cols - 1) surroundingPositions.push({ r: row + 1, c: col + 1 });
            if (row < rows - 1) surroundingPositions.push({ r: row + 1, c: col });
            if (row < rows - 1 && col > 0) surroundingPositions.push({ r: row + 1, c: col - 1 });
            if (col > 0) surroundingPositions.push({ r: row, c: col - 1 });
            if (surroundingPositions.length > 0) {
                const positions = surroundingPositions.map(pos => pos.r * cols + pos.c);
                const lastColor = newState[positions[positions.length - 1]];
                for (let i = positions.length - 1; i > 0; i--) {
                    newState[positions[i]] = newState[positions[i - 1]];
                }
                if (positions.length > 0) {
                    newState[positions[0]] = lastColor;
                }
            }
            break;
        case 'purple':
            if (row < rows - 1) {
                const downIndex = (row + 1) * cols + col;
                [newState[index], newState[downIndex]] = [newState[downIndex], newState[index]];
            }
            break;
        case 'orange':
            const adjacent = [];
            if (row > 0) adjacent.push(newState[(row - 1) * cols + col]);
            if (col < cols - 1) adjacent.push(newState[row * cols + (col + 1)]);
            if (row < rows - 1) adjacent.push(newState[(row + 1) * cols + col]);
            if (col > 0) adjacent.push(newState[row * cols + (col - 1)]);
            if (adjacent.length > 0) {
                const colorCounts = {};
                for (const adjColor of adjacent) {
                    colorCounts[adjColor] = (colorCounts[adjColor] || 0) + 1;
                }
                let majorityColor = null;
                let maxCount = 0;
                let tie = false;
                for (const [c, count] of Object.entries(colorCounts)) {
                    if (count > maxCount) {
                        maxCount = count;
                        majorityColor = c;
                        tie = false;
                    } else if (count === maxCount) {
                        tie = true;
                    }
                }
                if (!tie && majorityColor && maxCount > 0) {
                    newState[index] = majorityColor;
                }
            }
            break;
        case 'white':
            const initialNeighborStates = [];
            if (row > 0) initialNeighborStates.push({ idx: (row - 1) * cols + col, color: newState[(row - 1) * cols + col] });
            if (col < cols - 1) initialNeighborStates.push({ idx: row * cols + (col + 1), color: newState[row * cols + (col + 1)] });
            if (row < rows - 1) initialNeighborStates.push({ idx: (row + 1) * cols + col, color: newState[(row + 1) * cols + col] });
            if (col > 0) initialNeighborStates.push({ idx: row * cols + (col - 1), color: newState[row * cols + (col - 1)] });

            for (const neighbor of initialNeighborStates) {
                if (neighbor.color === 'gray') {
                    newState[neighbor.idx] = 'white';
                } else if (neighbor.color === 'white') {
                    newState[neighbor.idx] = 'gray';
                }
            }
            newState[index] = 'gray';
            break;
        case 'blue':
            const middleIndex = 4;
            const middleColorAction = newState[middleIndex];
            let tempStateForBlueAction = [...newState];

            switch (middleColorAction) {
                case 'gray':
                    break;
                case 'black':
                    const activeBlueRow_b = row;
                    const originalBlueCol_b = col;
                    const rowOriginalColors_b = [];
                    for (let c_idx = 0; c_idx < cols; c_idx++) {
                        rowOriginalColors_b.push(tempStateForBlueAction[activeBlueRow_b * cols + c_idx]);
                    }
                    const rowShiftedColors_b = [];
                    rowShiftedColors_b[0] = rowOriginalColors_b[cols - 1];
                    for (let c_idx = 1; c_idx < cols; c_idx++) {
                        rowShiftedColors_b[c_idx] = rowOriginalColors_b[c_idx - 1];
                    }
                    const blueTileNewColInRow_b = (originalBlueCol_b + 1) % cols;
                    for (let c_idx = 0; c_idx < cols; c_idx++) {
                        const currentIndexInRow_b = activeBlueRow_b * cols + c_idx;
                        if (c_idx === blueTileNewColInRow_b) {
                            tempStateForBlueAction[currentIndexInRow_b] = 'blue';
                        } else {
                            tempStateForBlueAction[currentIndexInRow_b] = rowShiftedColors_b[c_idx];
                        }
                    }
                    break;
                case 'red':
                    for (let i = 0; i < tempStateForBlueAction.length; i++) {
                        if (i === index) continue;
                        if (tempStateForBlueAction[i] === 'white') tempStateForBlueAction[i] = 'black';
                        else if (tempStateForBlueAction[i] === 'black') tempStateForBlueAction[i] = 'red';
                    }
                    break;
                case 'green':
                    const oppositeRow_g = rows - 1 - row;
                    const oppositeCol_g = cols - 1 - col;
                    const oppositeIndex_g = oppositeRow_g * cols + oppositeCol_g;
                    if (index !== oppositeIndex_g) {
                        const colorAtOpposite_g = tempStateForBlueAction[oppositeIndex_g];
                        tempStateForBlueAction[oppositeIndex_g] = 'blue';
                        tempStateForBlueAction[index] = colorAtOpposite_g;
                    }
                    break;
                case 'yellow':
                    if (row > 0) {
                        const upIndex_y = (row - 1) * cols + col;
                        const colorAbove_y = tempStateForBlueAction[upIndex_y];
                        tempStateForBlueAction[upIndex_y] = 'blue';
                        tempStateForBlueAction[index] = colorAbove_y;
                    }
                    break;
                case 'pink':
                    const surroundingPositions_pi = [];
                    if (row > 0 && col > 0) surroundingPositions_pi.push({ r: row - 1, c: col - 1 });
                    if (row > 0) surroundingPositions_pi.push({ r: row - 1, c: col });
                    if (row > 0 && col < cols - 1) surroundingPositions_pi.push({ r: row - 1, c: col + 1 });
                    if (col < cols - 1) surroundingPositions_pi.push({ r: row, c: col + 1 });
                    if (row < rows - 1 && col < cols - 1) surroundingPositions_pi.push({ r: row + 1, c: col + 1 });
                    if (row < rows - 1) surroundingPositions_pi.push({ r: row + 1, c: col });
                    if (row < rows - 1 && col > 0) surroundingPositions_pi.push({ r: row + 1, c: col - 1 });
                    if (col > 0) surroundingPositions_pi.push({ r: row, c: col - 1 });
                    if (surroundingPositions_pi.length > 0) {
                        const indicesToRotate_pi = surroundingPositions_pi.map(pos => pos.r * cols + pos.c);
                        const lastColorInRotation_pi = tempStateForBlueAction[indicesToRotate_pi[indicesToRotate_pi.length - 1]];
                        for (let i = indicesToRotate_pi.length - 1; i > 0; i--) {
                            tempStateForBlueAction[indicesToRotate_pi[i]] = tempStateForBlueAction[indicesToRotate_pi[i - 1]];
                        }
                        if (indicesToRotate_pi.length > 0) {
                            tempStateForBlueAction[indicesToRotate_pi[0]] = lastColorInRotation_pi;
                        }
                    }
                    break;
                case 'purple':
                    if (row < rows - 1) {
                        const downIndex_pu = (row + 1) * cols + col;
                        const colorBelow_pu = tempStateForBlueAction[downIndex_pu];
                        tempStateForBlueAction[downIndex_pu] = 'blue';
                        tempStateForBlueAction[index] = colorBelow_pu;
                    }
                    break;
                case 'orange':
                    const adjacent_o = [];
                    if (row > 0) adjacent_o.push(tempStateForBlueAction[(row - 1) * cols + col]);
                    if (col < cols - 1) adjacent_o.push(tempStateForBlueAction[row * cols + (col + 1)]);
                    if (row < rows - 1) adjacent_o.push(tempStateForBlueAction[(row + 1) * cols + col]);
                    if (col > 0) adjacent_o.push(tempStateForBlueAction[row * cols + (col - 1)]);
                    if (adjacent_o.length > 0) {
                        const colorCounts_o = {};
                        adjacent_o.forEach(adjColor => { colorCounts_o[adjColor] = (colorCounts_o[adjColor] || 0) + 1; });
                        let majorityColor_o = tempStateForBlueAction[index];
                        let maxCount_o = 0;
                        let tie_o = false;
                        for (const [c, count] of Object.entries(colorCounts_o)) {
                            if (count > maxCount_o) {
                                maxCount_o = count;
                                majorityColor_o = c;
                                tie_o = false;
                            } else if (count === maxCount_o) {
                                tie_o = true;
                            }
                        }
                        if (!tie_o && majorityColor_o && maxCount_o > 0) {
                            tempStateForBlueAction[index] = majorityColor_o;
                        }
                    }
                    break;
                case 'white':
                    const blueInitialNeighborStates = [];
                    if (row > 0) blueInitialNeighborStates.push({ idx: (row - 1) * cols + col, color: tempStateForBlueAction[(row - 1) * cols + col] });
                    if (col < cols - 1) blueInitialNeighborStates.push({ idx: row * cols + (col + 1), color: tempStateForBlueAction[row * cols + (col + 1)] });
                    if (row < rows - 1) blueInitialNeighborStates.push({ idx: (row + 1) * cols + col, color: tempStateForBlueAction[(row + 1) * cols + col] });
                    if (col > 0) blueInitialNeighborStates.push({ idx: row * cols + (col - 1), color: tempStateForBlueAction[row * cols + (col - 1)] });

                    for (const neighbor of blueInitialNeighborStates) {
                        if (neighbor.color === 'gray') {
                            tempStateForBlueAction[neighbor.idx] = 'blue';
                        } else if (neighbor.color === 'white' || neighbor.color === 'blue') {
                            tempStateForBlueAction[neighbor.idx] = 'gray';
                        }
                    }
                    tempStateForBlueAction[index] = 'gray';
                    break;
                case 'blue':
                    break;
            }
            newState = tempStateForBlueAction;
            break;
    }
    return newState;
}

function solvePuzzle() {
    const startTime = performance.now();
    const initialState = [...grid];
    const targetCornerIndices = { tl: 0, tr: 2, bl: 6, br: 8 };
    let solution = [];
    let visited = new Set();
    const maxSteps = 100;
    const maxIterations = 1000000;
    let iterations = 0;

    function addToVisited(state) {
        visited.add(JSON.stringify(state));
    }

    function isVisited(state) {
        return visited.has(JSON.stringify(state));
    }

    function isSolved(state) {
        return state[targetCornerIndices.tl] === targetCorners.tl &&
            state[targetCornerIndices.tr] === targetCorners.tr &&
            state[targetCornerIndices.bl] === targetCorners.bl &&
            state[targetCornerIndices.br] === targetCorners.br;
    }

    function bfs() {
        const queue = [{ state: initialState, path: [] }];
        addToVisited(initialState);
        while (queue.length > 0 && !stopSolving) {
            iterations++;
            if (iterations > maxIterations) {
                return { solved: false, reason: 'Exceeded maximum iterations' };
            }
            const { state, path } = queue.shift();
            if (isSolved(state)) {
                return { solved: true, path };
            }
            if (path.length >= maxSteps) {
                continue;
            }
            for (let i = 0; i < 9; i++) {
                const newState = performAction(state, i);
                if (!isVisited(newState)) {
                    addToVisited(newState);
                    queue.push({
                        state: newState,
                        path: [...path, { index: i, color: state[i], triggeredBy: state[i] }]
                    });
                }
            }
            if (iterations % 10000 === 0) {
                updateProgress(`Searching (BFS)... ${iterations.toLocaleString()} iterations, ${queue.length.toLocaleString()} states`);
            }
        }
        return { solved: false, reason: 'BFS exhausted or stopped' };
    }

    function idDfs() {
        let depthLimit = 1; // Start with a small depth limit
        const maxDepthLimit = 30;//  Max depth for IDDFS; bigger number becomes slower

        while (depthLimit <= maxDepthLimit && !stopSolving) {
            updateProgress(`Trying depth limit: ${depthLimit} (IDDFS)`);
            visited = new Set();
            iterations = 0;
            const result = dfsLimited(initialState, [], 0, depthLimit);
            if (result.solved) {
                return result;
            }
            depthLimit++;
        }
        return { solved: false, reason: `No solution within ${maxDepthLimit} steps (IDDFS)` };
    }

    function dfsLimited(state, path, depth, maxDepth) {
        iterations++;
        if (iterations > maxIterations) {
            return { solved: false, reason: 'Exceeded maximum iterations' };
        }
        if (stopSolving) {
            return { solved: false, reason: 'Solving stopped by user' };
        }
        if (isSolved(state)) {
            return { solved: true, path };
        }
        if (depth >= maxDepth) {
            return { solved: false, reason: 'Depth limit reached' };
        }
        if (iterations % 20000 === 0 && !stopSolving) {
            updateProgress(`Searching depth ${depth}/${maxDepth}... (${iterations.toLocaleString()} iterations)`);
        }

        for (let i = 0; i < 9; i++) {
            const originalTileColor = state[i];
            const newState = performAction(state, i);
            const stateKey = JSON.stringify(newState);
            if (!visited.has(stateKey)) {
                visited.add(stateKey);
                const result = dfsLimited(newState, [...path, { index: i, color: originalTileColor, triggeredBy: originalTileColor }], depth + 1, maxDepth);
                if (result.solved) {
                    return result;
                }
            }
        }
        return { solved: false };
    }

    function updateProgress(message) {
        const solutionOutput = document.getElementById('solution-output');
        solutionOutput.innerHTML = `<p style="color: var(--text-secondary);">${message}</p>`;
    }

    let lastSolutionResult = null;

    function displaySolution(result) {
        lastSolutionResult = result;
        const solutionOutput = document.getElementById('solution-output');
        const endTime = performance.now();
        const timeTaken = ((endTime - startTime) / 1000).toFixed(2);

        if (!result.solved) {
            solutionOutput.innerHTML = `
                <div class="solution-step">
                    <h3>No Solution Found</h3>
                    <p>Reason: ${result.reason || 'Unknown'}</p>
                    <p>Total Iterations (last attempt): ${iterations.toLocaleString()}</p>
                    <p>Time: ${timeTaken} seconds</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="solution-step">
                <h3>Solution Found!</h3>
                <p>Steps: ${result.path.length}</p>
                <p>Total Iterations (last attempt): ${iterations.toLocaleString()}</p>
                <p>Time: ${timeTaken} seconds</p>
            </div>
        `;

        let stepsInteractiveHtml = '<div class="solution-steps-interactive-container">';
        result.path.forEach((step, i) => {
            const stepText = `(${getPositionNotation(step.index)} - ${colors[step.triggeredBy].name})`;
            stepsInteractiveHtml += `
                <div class="solution-step-spoiler" role="button" tabindex="0" aria-pressed="false" aria-label="Reveal step ${i + 1}">
                    <span class="spoiler-placeholder">[Step ${i + 1}]</span>
                    <span class="spoiler-content">${stepText}</span>
                </div>
            `;
            if (i < result.path.length - 1) {
                stepsInteractiveHtml += '<span class="solution-step-arrow">→</span>';
            }
        });
        stepsInteractiveHtml += '</div>';

        html += `
            <div class="solution-step">
                <h4>Press Tiles in This Order (click to reveal):</h4>
                ${stepsInteractiveHtml}
            </div>
        `;

        let currentDisplayState = [...initialState];
        html += `
            <div class="solution-step">
                <h4>Initial State</h4>
                <div class="grid-representation">
                    ${currentDisplayState.map(color => `
                        <div style="background-color: ${colors[color].hex};"></div>
                    `).join('')}
                </div>
            </div>
        `;

        result.path.forEach((step, i) => {
            const { index, color, triggeredBy } = step;
            const positionNotation = getPositionNotation(index);
            let stateBeforeMove = [...currentDisplayState];
            currentDisplayState = performAction(currentDisplayState, index);

            html += `
                <div class="solution-step">
                    <h4>Step ${i + 1}: Activate ${colors[triggeredBy].name} at ${positionNotation}</h4>
                    <p><strong>Effect:</strong> ${colors[triggeredBy].function}</p>

                    <p style="margin-top:10px;">State Before:</p>
                    <div class="grid-representation">
                        ${stateBeforeMove.map((c, tileIdx) => `
                            <div style="background-color: ${colors[c].hex};" class="${tileIdx === index ? 'highlighted-action' : ''}"></div>
                        `).join('')}
                    </div>
                    <p style="margin-top:10px;">State After:</p>
                    <div class="grid-representation">
                        ${currentDisplayState.map(color => `
                            <div style="background-color: ${colors[color].hex};"></div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        solutionOutput.innerHTML = html;
    }

    const runSolve = async () => {
        try {
            updateProgress("Trying BFS for simple solutions (up to ~7 steps)...");
            let result = bfs();
            if (!result.solved && !stopSolving) {
                updateProgress("BFS exhausted or too complex. Switching to Iterative Deepening DFS...");
                result = idDfs();
            }
            displaySolution(result);
        } catch (error) {
            console.error("Solver error:", error);
            document.getElementById('solution-output').innerHTML = `
                <div class="solution-step">
                    <h3>Error Occurred During Solving</h3>
                    <p>${error.message}</p>
                </div>
            `;
        } finally {
            solvingInProgress = false;
            document.getElementById('solve-btn').disabled = false;
            document.getElementById('stop-btn').disabled = true;
        }
    };
    runSolve();
}

function getPositionNotation(index) {
    const displayIndex = index + 1;
    return useWrittenNotation ? positionNotations[index] : displayIndex;
}

function togglePositionNotation() {
    useWrittenNotation = !useWrittenNotation;
    if (lastSolutionResult) {
        displaySolution(lastSolutionResult);
    }
    const toggleBtn = document.getElementById('toggle-notation-btn');
    toggleBtn.textContent = useWrittenNotation ?
        'Use Numeric Notation (1-9)' :
        'Use Written Notation (TL, TOP, etc)';
}

function updateCornerSymbolsDisplay() {
    const cornerSymbolDivs = {
        tl: document.getElementById('symbol-tl'),
        tr: document.getElementById('symbol-tr'),
        bl: document.getElementById('symbol-bl'),
        br: document.getElementById('symbol-br'),
    };
    for (const id in cornerSymbolDivs) {
        const symbolDiv = cornerSymbolDivs[id];
        if (targetCorners[id]) {
            symbolDiv.style.backgroundColor = colors[targetCorners[id]].hex;
            symbolDiv.textContent = '';
            symbolDiv.classList.remove('active-corner');
        } else {
            symbolDiv.style.backgroundColor = 'var(--symbol-background)';
            symbolDiv.textContent = id.toUpperCase();
        }
    }
}

function initSandbox() {
    initSandboxGrid();
    initSandboxColorPalette();
    initSandboxEventListeners();
    updateSandboxCornerSymbolsDisplay();
    renderSandboxGrid();
}

function initSandboxGrid() {
    const gridElement = document.getElementById('sandbox-grid');
    gridElement.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        gridElement.appendChild(cell);
    }
}

function renderSandboxGrid() {
    const gridCells = document.querySelectorAll('#sandbox-grid .cell');
    gridCells.forEach((cell, i) => {
        cell.style.backgroundColor = colors[sandboxGrid[i]].hex;
    });
}

function initSandboxColorPalette() {
    const paletteElement = document.getElementById('sandbox-color-palette');
    paletteElement.innerHTML = '';
    for (const [key, color] of Object.entries(colors)) {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.dataset.color = key;
        colorOption.style.backgroundColor = color.hex;
        colorOption.title = `${color.name}`;

        const iconSvgString = getIconForColor(key, color.hex);
        if (iconSvgString) {
            colorOption.innerHTML = iconSvgString;
        }
        paletteElement.appendChild(colorOption);
    }
}

function updateSandboxCornerSymbolsDisplay() {
    const cornerSymbolDivs = {
        tl: document.getElementById('symbol-tl-sandbox'),
        tr: document.getElementById('symbol-tr-sandbox'),
        bl: document.getElementById('symbol-bl-sandbox'),
        br: document.getElementById('symbol-br-sandbox'),
    };
    for (const id in cornerSymbolDivs) {
        const symbolDiv = cornerSymbolDivs[id];
        if (symbolDiv) {
            if (sandboxTargetCorners[id]) {
                symbolDiv.style.backgroundColor = colors[sandboxTargetCorners[id]].hex;
                symbolDiv.textContent = '';
            } else {
                symbolDiv.style.backgroundColor = 'var(--symbol-background)';
                symbolDiv.textContent = id.toUpperCase();
            }
        }
    }
}

function initSandboxEventListeners() {
    const sandboxPaletteElement = document.getElementById('sandbox-color-palette');
    const sandboxGridElement = document.getElementById('sandbox-grid');
    const sandboxCornerSymbolDivs = {
        tl: document.getElementById('symbol-tl-sandbox'),
        tr: document.getElementById('symbol-tr-sandbox'),
        bl: document.getElementById('symbol-bl-sandbox'),
        br: document.getElementById('symbol-br-sandbox'),
    };
    const resetSandboxBtn = document.getElementById('reset-sandbox-btn');
    const restartSandboxPuzzleBtn = document.getElementById('restart-sandbox-puzzle-btn');
    const generateRandomSandboxPuzzleBtn = document.getElementById('generate-random-sandbox-puzzle-btn');
    sandboxTestSolveBtn = document.getElementById('sandbox-test-solve-btn');

    const loadSeedBtn = document.getElementById('sandbox-load-seed-btn');
    const seedInput = document.getElementById('sandbox-seed-input');

    if (loadSeedBtn && seedInput) {
        loadSeedBtn.addEventListener('click', function () {
            const userProvidedSeed = seedInput.value.trim();
            if (userProvidedSeed === "") {
                showNotification('Please enter a seed value.', 'error');
                return;
            }
            const seedAsNumber = parseInt(userProvidedSeed);
            if (isNaN(seedAsNumber)) {
                showNotification('Invalid seed format. Please enter a numeric seed.', 'error');
                return;
            }

            console.log(`[Sandbox] Attempting to load puzzle with user-provided seed: ${seedAsNumber}`);
            generateRandomSandboxPuzzle(seedAsNumber);
            seedInput.value = '';
        });
    }

    sandboxPaletteElement.addEventListener('click', function (event) {
        if (event.target.classList.contains('color-option')) {
            if (currentSandboxSolutionPath) {
                document.getElementById('sandbox-solution-display').style.display = 'none';
                currentSandboxSolutionPath = null;
                if (sandboxTestSolveBtn) sandboxTestSolveBtn.textContent = 'Test Solve This Puzzle';
            }
            if (event.target.classList.contains('selected')) {
                event.target.classList.remove('selected');
                sandboxSelectedColor = null;
            } else {
                document.querySelectorAll('#sandbox-color-palette .color-option').forEach(el => el.classList.remove('selected'));
                event.target.classList.add('selected');
                sandboxSelectedColor = event.target.dataset.color;
            }
        }
    });

    sandboxGridElement.addEventListener('click', function (event) {
        if (sandboxPuzzleSolved) return;

        if (event.target.classList.contains('cell')) {
            const index = parseInt(event.target.dataset.index);
            if (sandboxSelectedColor) {
                if (sandboxInPlayMode) {
                    showNotification('Cannot change grid colors while in play mode. Reset or Restart puzzle.', 'error');
                    return;
                }
                sandboxGrid[index] = sandboxSelectedColor;
                renderSandboxGrid();
                if (currentSandboxSolutionPath) {
                    document.getElementById('sandbox-solution-display').style.display = 'none';
                    currentSandboxSolutionPath = null;
                    if (sandboxTestSolveBtn) sandboxTestSolveBtn.textContent = 'Test Solve This Puzzle';
                }
            } else {
                if (!sandboxInPlayMode) {
                    sandboxInPlayMode = true;
                    sandboxInitialPlayGrid = [...sandboxGrid];
                    console.log('[Sandbox] Play mode started. Initial grid stored:', sandboxInitialPlayGrid);
                    document.getElementById('sandbox-color-palette').classList.add('disabled-palette');
                }

                const currentState = [...sandboxGrid];
                const actionColor = currentState[index];
                if (actionColor === 'gray') return;

                sandboxGrid = performAction(currentState, index);
                renderSandboxGrid();
                checkSandboxWinCondition();
            }
        }
    });

    for (const id in sandboxCornerSymbolDivs) {
        const symbolDiv = sandboxCornerSymbolDivs[id];
        if (symbolDiv) {
            symbolDiv.addEventListener('click', function () {
                if (sandboxSelectedColor) {
                    sandboxTargetCorners[id] = sandboxSelectedColor;
                    updateSandboxCornerSymbolsDisplay();
                    if (currentSandboxSolutionPath) {
                        document.getElementById('sandbox-solution-display').style.display = 'none';
                        currentSandboxSolutionPath = null;
                        if (sandboxTestSolveBtn) sandboxTestSolveBtn.textContent = 'Test Solve This Puzzle';
                    }
                } else {
                    showNotification('Select a color from the palette first, then click a sandbox corner symbol.', 'error');
                }
            });
        }
    }

    if (resetSandboxBtn) {
        resetSandboxBtn.addEventListener('click', function () {
            sandboxGrid = Array(9).fill('gray');
            sandboxTargetCorners = { tl: null, tr: null, bl: null, br: null };
            sandboxSelectedColor = null;
            sandboxInPlayMode = false;
            sandboxPuzzleSolved = false;
            sandboxInitialPlayGrid = null;
            currentSandboxSolutionPath = null;
            document.getElementById('sandbox-solution-display').style.display = 'none';
            if (sandboxTestSolveBtn) sandboxTestSolveBtn.textContent = 'Test Solve This Puzzle';
            document.getElementById('sandbox-color-palette').classList.remove('disabled-palette');
            document.getElementById('sandbox-grid').classList.remove('grid-disabled');

            const modal = document.getElementById('sandbox-victory-modal');
            if (modal && modal.classList.contains('visible')) {
                modal.classList.remove('visible');
            }
            document.querySelectorAll('#sandbox-color-palette .color-option').forEach(el => el.classList.remove('selected'));
            renderSandboxGrid();
            updateSandboxCornerSymbolsDisplay();
            showNotification('Sandbox has been reset.', 'success');
        });
    }

    if (restartSandboxPuzzleBtn) {
        restartSandboxPuzzleBtn.addEventListener('click', function () {
            restartSandboxPuzzle();
        });
    }

    if (generateRandomSandboxPuzzleBtn) {
        generateRandomSandboxPuzzleBtn.addEventListener('click', function () {
            generateRandomSandboxPuzzle();
        });
    }

    if (sandboxTestSolveBtn) {
        sandboxTestSolveBtn.addEventListener('click', function () {
            if (currentSandboxSolutionPath && sandboxInitialPlayGrid) {
                displaySandboxSolution(currentSandboxSolutionPath, sandboxInitialPlayGrid, sandboxTargetCorners);
                document.getElementById('sandbox-solution-display').style.display = 'block';
            } else {
                if (!validateSandboxTargets()) {
                    return;
                }
                grid = [...sandboxGrid];
                targetCorners = { ...sandboxTargetCorners };
                document.querySelectorAll('.tab').forEach(tabElement => {
                    if (tabElement.dataset.tab === 'solve') {
                        tabElement.click();
                    }
                });
                setTimeout(() => {
                    document.getElementById('solve-btn').click();
                }, 100);
                showNotification('Sandbox puzzle sent to main solver. Check the \'Solve\' tab for results.', 'info');
            }
        });
    }
}

function validateSandboxTargets() {
    for (const corner in sandboxTargetCorners) {
        if (!sandboxTargetCorners[corner]) {
            showNotification('Please set all target corner colors in the sandbox first (e.g., by generating a random puzzle).', 'error');
            return false;
        }
    }
    return true;
}

let currentSeed = null;

function seededRandom() {
    if (currentSeed === null) {
        currentSeed = Date.now();
    }
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    currentSeed = (a * currentSeed + c) % m;
    return currentSeed / m;
}

function setSeed(seed) {
    currentSeed = seed;
}

function showLoadingModal(initialPhrase) {
    if (!loadingModalElement) loadingModalElement = document.getElementById('sandbox-loading-modal');
    if (!loadingPhraseElement) loadingPhraseElement = document.getElementById('loading-phrase');

    if (loadingModalElement && loadingPhraseElement) {
        loadingPhraseElement.textContent = loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)];
        loadingModalElement.classList.add('visible');
    }
}

function updateLoadingPhrase() {
    if (loadingPhraseElement) {
        loadingPhraseElement.textContent = loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)];
    }
}

function hideLoadingModal() {
    if (loadingModalElement) {
        loadingModalElement.classList.remove('visible');
    }
}

function restartSandboxPuzzle() {
    if (sandboxInitialPlayGrid) {
        sandboxGrid = [...sandboxInitialPlayGrid];
        sandboxInPlayMode = false;
        sandboxPuzzleSolved = false;

        const sandboxPaletteElement = document.getElementById('sandbox-color-palette');
        if (sandboxPaletteElement) {
            sandboxPaletteElement.classList.remove('disabled-palette');
        }
        const sandboxGridElement = document.getElementById('sandbox-grid');
        if (sandboxGridElement) {
            sandboxGridElement.classList.remove('grid-disabled');
        }

        renderSandboxGrid();

        const victoryModal = document.getElementById('sandbox-victory-modal');
        if (victoryModal && victoryModal.classList.contains('visible')) {
            victoryModal.classList.remove('visible');
        }

        if (solutionDisplay && solutionDisplay.style.display !== 'none') {
            solutionDisplay.style.display = 'none';
        }

        if (currentSandboxSolutionPath && sandboxTestSolveBtn) {
            sandboxTestSolveBtn.textContent = 'Show Solution Steps';
        } else if (sandboxTestSolveBtn) {
            sandboxTestSolveBtn.textContent = 'Test Solve This Puzzle';
        }

        showNotification('Sandbox puzzle has been restarted to its initial play state.', 'success');
        console.log('[Sandbox] Puzzle restarted to initial play grid:', sandboxInitialPlayGrid);
    } else {
        showNotification('No initial puzzle state to restart to. Reset sandbox or generate a new puzzle.', 'error');
        console.log('[Sandbox] Restart attempted but no sandboxInitialPlayGrid was set.');
    }
}

function generateRandomSandboxPuzzle(userSeed) {
    const initialUserSeed = userSeed;
    let currentAttemptSeed = initialUserSeed;

    const { minSteps: minSolutionSteps, maxSteps: maxSolutionStepsForGeneration } = currentDifficulty;

    showLoadingModal(`Creating a ${currentDifficulty.label.toLowerCase()} puzzle...`);

    const MAX_GENERATION_ATTEMPTS = 100;
    let attempts = 0;

    setTimeout(async () => {
        let puzzleGeneratedAndSolvable = false;
        let finalSolvabilityResult = null;
        let finalNewGrid = null;
        let finalNewTargetCorners = null;

        for (attempts = 0; attempts < MAX_GENERATION_ATTEMPTS; attempts++) {
            if (attempts > 0) {
                updateLoadingPhrase();
                currentAttemptSeed = initialUserSeed ? currentAttemptSeed : Date.now() + attempts;
            } else if (!initialUserSeed) {
                currentAttemptSeed = Date.now();
            }

            setSeed(currentAttemptSeed);
            if (attempts === 0 && initialUserSeed) {
                console.log("[Sandbox] Attempting puzzle generation with user-provided seed:", currentAttemptSeed);
            } else if (attempts === 0) {
                console.log("[Sandbox] First attempt, new puzzle generated with seed:", currentAttemptSeed);
            }

            const availableColors = Object.keys(colors).filter(color => color !== 'gray');
            if (availableColors.length === 0) {
                hideLoadingModal();
                showNotification('Cannot generate puzzle: No functional colors defined.', 'error');
                return;
            }
            const newTargetCorners = { tl: null, tr: null, bl: null, br: null };
            const cornerKeys = Object.keys(newTargetCorners);
            for (const corner of cornerKeys) {
                const randomIndex = Math.floor(seededRandom() * availableColors.length);
                newTargetCorners[corner] = availableColors[randomIndex];
            }

            let newGrid = Array(9).fill(null);
            let placedColors = new Set();
            let requiredCornerColors = new Set(Object.values(newTargetCorners));
            let availableGridSpots = Array.from({ length: 9 }, (_, i) => i);
            function shuffleArray(array) {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(seededRandom() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
            }
            shuffleArray(availableGridSpots);
            let colorsToPlace = Array.from(requiredCornerColors);
            shuffleArray(colorsToPlace);
            for (const colorToPlace of colorsToPlace) {
                if (availableGridSpots.length > 0) {
                    const spot = availableGridSpots.pop();
                    newGrid[spot] = colorToPlace;
                    placedColors.add(colorToPlace);
                }
            }
            const minDistinctColors = 3;
            let distinctAttempts = 0;
            while (availableGridSpots.length > 0) {
                const spot = availableGridSpots.pop();
                let chosenColor = null;
                if (placedColors.size < minDistinctColors && distinctAttempts < availableColors.length * 2) {
                    let potentialNewColors = availableColors.filter(c => !placedColors.has(c));
                    if (potentialNewColors.length > 0) {
                        shuffleArray(potentialNewColors);
                        chosenColor = potentialNewColors[0];
                    }
                    distinctAttempts++;
                }
                if (!chosenColor) {
                    const randomIndex = Math.floor(seededRandom() * availableColors.length);
                    chosenColor = availableColors[randomIndex];
                }
                newGrid[spot] = chosenColor;
                placedColors.add(chosenColor);
            }
            for (let i = 0; i < newGrid.length; i++) {
                if (newGrid[i] === null) {
                    newGrid[i] = availableColors[Math.floor(seededRandom() * availableColors.length)];
                }
            }

            const solvabilityResult = isPuzzleSolvable(newGrid, newTargetCorners, maxSolutionStepsForGeneration, currentAttemptSeed);

            if (solvabilityResult.solvable) {
                if (solvabilityResult.path.length < minSolutionSteps) {
                    const trivialReason = solvabilityResult.path.length === 0 ? "ALREADY SOLVED" : `solvable in ${solvabilityResult.path.length} STEP(S)`;
                    console.log(`[Sandbox] Attempt ${attempts + 1} (Seed: ${currentAttemptSeed}): Puzzle TRIVIAL (${trivialReason}). Requires > ${minSolutionSteps - 1} steps for ${currentDifficulty.label}.`);
                    if (initialUserSeed) {
                        puzzleGeneratedAndSolvable = true;
                        finalSolvabilityResult = solvabilityResult;
                        finalNewGrid = newGrid;
                        finalNewTargetCorners = newTargetCorners;
                        break;
                    }
                    continue;
                }

                console.log(`[Sandbox] Attempt ${attempts + 1}: Puzzle IS solvable and NON-TRIVIAL. Seed: ${currentAttemptSeed}, Path: ${solvabilityResult.path.length} steps.`);
                puzzleGeneratedAndSolvable = true;
                finalSolvabilityResult = solvabilityResult;
                finalNewGrid = newGrid;
                finalNewTargetCorners = newTargetCorners;
                break;
            } else {
                console.log(`[Sandbox] Attempt ${attempts + 1}: Puzzle NOT solvable (Seed: ${currentAttemptSeed}). Reason: ${solvabilityResult.reason}`);
            }

            if (initialUserSeed) break;
        }

        hideLoadingModal();

        if (puzzleGeneratedAndSolvable) {
            sandboxTargetCorners = finalNewTargetCorners;
            updateSandboxCornerSymbolsDisplay();
            sandboxGrid = finalNewGrid;
            renderSandboxGrid();
            sandboxInPlayMode = false;
            sandboxPuzzleSolved = false;
            sandboxInitialPlayGrid = [...finalNewGrid];
            currentSandboxSolutionPath = finalSolvabilityResult.path;

            if (!initialUserSeed) {
                const seedInput = document.getElementById('sandbox-seed-input');
                if (seedInput) {
                    seedInput.value = currentAttemptSeed;
                }
            }

            savePuzzleToHistory({
                seed: currentAttemptSeed,
                initialGrid: finalNewGrid,
                targetCorners: finalNewTargetCorners,
                solutionPath: finalSolvabilityResult.path,
                difficultyLabel: currentDifficulty.label,
                steps: finalSolvabilityResult.path.length
            });

            let note = "";
            if (finalSolvabilityResult.path.length === 0) {
                note = "Puzzle is already solved (0 steps).";
            } else if (finalSolvabilityResult.path.length === 1) {
                note = `Puzzle is solvable in 1 step.`;
            } else {
                note = `Puzzle solvable in ${finalSolvabilityResult.path.length} steps.`;
            }

            let mainMessage;
            if (initialUserSeed) {
                mainMessage = `Loaded puzzle from seed ${currentAttemptSeed}. ${note}`;
            } else {
                mainMessage = `Generated random puzzle (seed: ${currentAttemptSeed}). ${note}`;
            }
            showNotification(`${mainMessage} Triviality check performed. Local history next.`, 'success');

            if (sandboxTestSolveBtn) sandboxTestSolveBtn.textContent = 'Show Solution Steps';
            document.getElementById('sandbox-solution-display').innerHTML = '';
            document.getElementById('sandbox-solution-display').style.display = 'none';

        } else {
            let lastAttemptInfo = "No solvable puzzle found.";
            if (solvabilityResult) {
                if (!solvabilityResult.solvable) {
                    lastAttemptInfo = `Last attempt (seed ${currentAttemptSeed}) not solvable: ${solvabilityResult.reason}.`;
                } else if (solvabilityResult.path.length <= 1) {
                    lastAttemptInfo = `Last attempt (seed ${currentAttemptSeed}) was trivial (length ${solvabilityResult.path.length}). Generation requires more than 1 step.`;
                }
            }

            let finalFailureMessage;
            if (initialUserSeed) {
                finalFailureMessage = `Puzzle from seed ${initialUserSeed} is not solvable within ${MAX_GENERATED_PUZZLE_STEPS} steps. ${lastAttemptInfo}`;
            } else {
                finalFailureMessage = `Could not generate a suitable (solvable, >1 step) puzzle after ${attempts} attempts. ${lastAttemptInfo}`;
            }
            showNotification(finalFailureMessage, 'error');
            currentSandboxSolutionPath = null;
            if (sandboxTestSolveBtn) sandboxTestSolveBtn.textContent = 'Test Solve This Puzzle';
            document.getElementById('sandbox-solution-display').style.display = 'none';
        }
    }, 10);
}

function isPuzzleSolvable(gridToCheck, targetsToCheck, maxSolutionSteps, generationSeed) {
    console.log(`[Sandbox Solver] Checking solvability for seed: ${generationSeed}`);
    const initialState = [...gridToCheck];
    const targetCornerIndices = { tl: 0, tr: 2, bl: 6, br: 8 };

    let visited = new Set();
    const maxSolverIterations = 500000;
    let iterations = 0;

    function addToVisited(state) {
        visited.add(JSON.stringify(state));
    }

    function isVisited(state) {
        return visited.has(JSON.stringify(state));
    }

    function checkIsSolved(state) {
        return state[targetCornerIndices.tl] === targetsToCheck.tl &&
            state[targetCornerIndices.tr] === targetsToCheck.tr &&
            state[targetCornerIndices.bl] === targetsToCheck.bl &&
            state[targetCornerIndices.br] === targetsToCheck.br;
    }

    function bfsForCheck() {
        const queue = [{ state: initialState, path: [] }];
        addToVisited(initialState);
        iterations = 0;

        while (queue.length > 0) {
            iterations++;
            if (iterations > maxSolverIterations) {
                console.log('[Sandbox Solver] BFS exceeded max iterations');
                return { solvable: false, path: null, reason: 'BFS: Exceeded maximum iterations' };
            }

            const { state, path } = queue.shift();

            if (checkIsSolved(state)) {
                console.log('[Sandbox Solver] BFS found solution.');
                return { solvable: true, path: path, reason: 'BFS: Solved' };
            }

            if (path.length >= maxSolutionSteps) {
                continue;
            }

            for (let i = 0; i < 9; i++) {
                const newState = performAction(state, i);
                if (!isVisited(newState)) {
                    addToVisited(newState);
                    queue.push({
                        state: newState,
                        path: [...path, { index: i, color: state[i], triggeredBy: state[i] }]
                    });
                }
            }
        }
        console.log('[Sandbox Solver] BFS exhausted.');
        return { solvable: false, path: null, reason: 'BFS: Exhausted, no solution found' };
    }

    const shallowBfsDepthLimit = Math.min(maxSolutionSteps, 7);
    console.log(`[Sandbox Solver] Starting shallow BFS check (depth up to ${shallowBfsDepthLimit})`);

    visited = new Set();
    addToVisited(initialState);

    function bfsLimitedForChecker(limit) {
        const q = [{ state: initialState, path: [] }];
        let bfsIterations = 0;

        while (q.length > 0) {
            bfsIterations++;
            if (bfsIterations > maxSolverIterations) {
                return { solvable: false, path: null, reason: `BFS Limited (${limit}): Exceeded local max iterations` };
            }
            if (iterations + bfsIterations > maxSolverIterations) {
                return { solvable: false, path: null, reason: `BFS Limited (${limit}): Exceeded global max iterations` };
            }

            const { state, path } = q.shift();
            if (checkIsSolved(state)) {
                return { solvable: true, path: path, reason: `BFS Limited (${limit}): Solved` };
            }
            if (path.length >= limit) {
                continue;
            }
            for (let i = 0; i < 9; i++) {
                const newState = performAction(state, i);
                if (!isVisited(newState)) {
                    addToVisited(newState);
                    q.push({
                        state: newState,
                        path: [...path, { index: i, color: state[i], triggeredBy: state[i] }]
                    });
                }
            }
        }
        return { solvable: false, path: null, reason: `BFS Limited (${limit}): Exhausted` };
    }

    let result = bfsLimitedForChecker(shallowBfsDepthLimit);
    iterations += result.localIterations || 0;

    if (result.solvable) {
        console.log('[Sandbox Solver] Solved with shallow BFS.');
        return result;
    }
    if (result.reason && result.reason.includes('Exceeded global max iterations')) {
        return result;
    }

    console.log('[Sandbox Solver] Shallow BFS failed or depth too great. Trying IDDFS.');

    function dfsLimitedForChecker(state, path, depth, currentMaxDepth) {
        iterations++;
        if (iterations > maxSolverIterations) {
            return { solvable: false, path: null, reason: 'IDDFS: Exceeded max iterations' };
        }

        if (checkIsSolved(state)) {
            return { solvable: true, path: path, reason: 'IDDFS: Solved' };
        }
        if (depth >= currentMaxDepth) {
            return { solvable: false, path: null, reason: 'IDDFS: Depth limit reached for current iteration' };
        }

        for (let i = 0; i < 9; i++) {
            const originalTileColor = state[i];
            const newState = performAction(state, i);
            if (!isVisited(newState)) {
                addToVisited(newState);
                const dfsResult = dfsLimitedForChecker(newState, [...path, { index: i, color: originalTileColor, triggeredBy: originalTileColor }], depth + 1, currentMaxDepth);
                if (dfsResult.solvable) {
                    return dfsResult;
                }
            }
        }
        return { solvable: false, path: null, reason: 'IDDFS: Branch exhausted' };
    }

    function idDfsForChecker() {
        let depthLimit = 1;
        while (depthLimit <= maxSolutionSteps) {
            console.log(`[Sandbox Solver] IDDFS: Trying depth limit: ${depthLimit} (Global iterations: ${iterations})`);
            visited = new Set();
            addToVisited(initialState);

            const iddfsResult = dfsLimitedForChecker(initialState, [], 0, depthLimit);
            if (iddfsResult.solvable) {
                console.log('[Sandbox Solver] Solved with IDDFS.');
                return iddfsResult;
            }
            if (iddfsResult.reason && iddfsResult.reason.includes('Exceeded max iterations')) {
                return iddfsResult;
            }
            depthLimit++;
        }
        console.log(`[Sandbox Solver] IDDFS: No solution within ${maxSolutionSteps} steps.`);
        return { solvable: false, path: null, reason: `IDDFS: No solution within ${maxSolutionSteps} steps` };
    }

    result = idDfsForChecker();
    return result;
}

function displaySandboxSolution(path, initialGridState, solutionTargetCorners) {
    const solutionOutput = document.getElementById('sandbox-solution-display');
    if (!solutionOutput) return;

    let html = `
        <div class="solution-step">
            <h4>Generated Puzzle Solution</h4>
            <p>Steps: ${path.length}</p>
        </div>
    `;

    let stepsInteractiveHtml = '<div class="solution-steps-interactive-container">';
    path.forEach((step, i) => {
        const stepText = `(${getPositionNotation(step.index)} - ${colors[step.triggeredBy].name})`;
        stepsInteractiveHtml += `
            <div class="solution-step-spoiler" role="button" tabindex="0" aria-pressed="false" aria-label="Reveal step ${i + 1}">
                <span class="spoiler-placeholder">[Step ${i + 1}]</span>
                <span class="spoiler-content">${stepText}</span>
            </div>
        `;
        if (i < path.length - 1) {
            stepsInteractiveHtml += '<span class="solution-step-arrow">→</span>';
        }
    });
    stepsInteractiveHtml += '</div>';

    html += `
        <div class="solution-step">
            <h4>Press Tiles in This Order (click to reveal):</h4>
            ${stepsInteractiveHtml}
        </div>
    `;

    let currentDisplayState = [...initialGridState];
    html += `
        <div class="solution-step">
            <h4>Initial State (for this solution)</h4>
            <div class="grid-representation">
                ${currentDisplayState.map(color => `
                    <div style="background-color: ${colors[color].hex};"></div>
                `).join('')}
            </div>
        </div>
    `;

    path.forEach((step, i) => {
        const { index, color, triggeredBy } = step;
        const positionNotation = getPositionNotation(index);
        let stateBeforeMove = [...currentDisplayState];
        currentDisplayState = performAction(currentDisplayState, index);

        html += `
            <div class="solution-step">
                <h4>Step ${i + 1}: Activate ${colors[triggeredBy].name} at ${positionNotation}</h4>
                <p><strong>Effect:</strong> ${colors[triggeredBy].function}</p>

                <p style="margin-top:10px;">State Before:</p>
                <div class="grid-representation">
                    ${stateBeforeMove.map((c, tileIdx) => `
                        <div style="background-color: ${colors[c].hex};" class="${tileIdx === index ? 'highlighted-action' : ''}"></div>
                    `).join('')}
                </div>
                <p style="margin-top:10px;">State After:</p>
                <div class="grid-representation">
                    ${currentDisplayState.map(color => `
                        <div style="background-color: ${colors[color].hex};"></div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    solutionOutput.innerHTML = html;
    solutionOutput.style.display = 'block';
}

function checkSandboxWinCondition() {
    if (sandboxPuzzleSolved) return;

    const cornerIndices = { tl: 0, tr: 2, bl: 6, br: 8 };
    let allTargetsSetAndMatch = true;
    let atLeastOneTargetSet = false;

    for (const corner in sandboxTargetCorners) {
        if (sandboxTargetCorners[corner]) {
            atLeastOneTargetSet = true;
            if (sandboxGrid[cornerIndices[corner]] !== sandboxTargetCorners[corner]) {
                allTargetsSetAndMatch = false;
                break;
            }
        }
    }

    if (atLeastOneTargetSet && allTargetsSetAndMatch) {
        sandboxPuzzleSolved = true;
        const victoryModal = document.getElementById('sandbox-victory-modal');
        if (victoryModal) {
            victoryModal.classList.add('visible');
        }
        const sandboxGridElement = document.getElementById('sandbox-grid');
        if (sandboxGridElement) {
            sandboxGridElement.classList.add('grid-disabled');
        }
        showNotification('Sandbox Puzzle Solved!', 'success');
        console.log('[Sandbox] Win condition met!');
        const sandboxPaletteElement = document.getElementById('sandbox-color-palette');
        if (sandboxPaletteElement && !sandboxPaletteElement.classList.contains('disabled-palette')) {
            sandboxPaletteElement.classList.add('disabled-palette');
        }
    }
}

function initDifficultySlider() {
    const slider = document.getElementById('sandbox-difficulty-slider');
    const valueDisplay = document.getElementById('sandbox-difficulty-value');

    if (slider && valueDisplay) {
        const initialDifficultyValue = parseInt(slider.value);
        if (difficultySettings[initialDifficultyValue]) {
            currentDifficulty = difficultySettings[initialDifficultyValue];
            valueDisplay.textContent = currentDifficulty.label;
        } else {
            currentDifficulty = difficultySettings[2];
            valueDisplay.textContent = currentDifficulty.label;
            slider.value = "2";
            console.warn('[Sandbox] Difficulty slider had an unexpected initial value. Reset to Medium.');
        }

        slider.addEventListener('input', function () {
            const selectedValue = parseInt(this.value);
            if (difficultySettings[selectedValue]) {
                currentDifficulty = difficultySettings[selectedValue];
                valueDisplay.textContent = currentDifficulty.label;
                console.log(`[Sandbox] Difficulty changed to: ${currentDifficulty.label} (Min steps: ${currentDifficulty.minSteps}, Max steps: ${currentDifficulty.maxSteps})`);
            }
        });
    }
}

function savePuzzleToHistory(puzzleData) {
    if (!puzzleData || !puzzleData.seed) {
        console.warn("[History] Attempted to save invalid puzzle data.");
        return;
    }
    let history = JSON.parse(localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY)) || [];

    const historyEntry = { ...puzzleData, timestamp: Date.now() };
    history.unshift(historyEntry);

    if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
    }

    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
    console.log("[History] Puzzle saved. History count:", history.length);
    populateSandboxHistoryUI();
}

function formatHistoryTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function populateSandboxHistoryUI() {
    const historyList = document.getElementById('sandbox-history-list');
    const clearHistoryBtn = document.getElementById('sandbox-clear-history-btn');
    if (!historyList) return;

    const history = JSON.parse(localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY)) || [];
    historyList.innerHTML = '';

    if (history.length === 0) {
        historyList.innerHTML = '<li><p style="text-align:center; color:var(--text-secondary);">No puzzles in history yet.</p></li>';
        if (clearHistoryBtn) clearHistoryBtn.style.display = 'none';
        return;
    }

    if (clearHistoryBtn) clearHistoryBtn.style.display = 'block';

    history.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'history-item';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'history-item-info';
        infoDiv.innerHTML = `
            <p>Seed: <span class="history-seed">${item.seed}</span></p>
            <p>Difficulty: <span class="history-difficulty">${item.difficultyLabel || 'N/A'}</span></p>
            <p>Steps: <span class="history-steps">${item.steps !== undefined ? item.steps : 'N/A'}</span></p>
            <p>Date: <span class="history-date">${formatHistoryTimestamp(item.timestamp)}</span></p>
        `;

        const loadButton = document.createElement('button');
        loadButton.className = 'history-load-btn button button-small';
        loadButton.textContent = 'Load';
        loadButton.dataset.historyIndex = index;
        loadButton.addEventListener('click', function () {
            const historyIndex = parseInt(this.dataset.historyIndex);
            const loadedPuzzle = history[historyIndex];
            if (!loadedPuzzle) return;

            console.log("[History] Loading puzzle:", loadedPuzzle);

            sandboxGrid = [...loadedPuzzle.initialGrid];
            sandboxTargetCorners = { ...loadedPuzzle.targetCorners };
            sandboxInitialPlayGrid = [...loadedPuzzle.initialGrid];
            currentSandboxSolutionPath = loadedPuzzle.solutionPath || null;

            const seedInput = document.getElementById('sandbox-seed-input');
            if (seedInput) {
                seedInput.value = loadedPuzzle.seed;
            }

            const difficultySlider = document.getElementById('sandbox-difficulty-slider');
            const difficultyValueDisplay = document.getElementById('sandbox-difficulty-value');
            let matchedDifficultyValue = "2";
            for (const [key, value] of Object.entries(difficultySettings)) {
                if (value.label === loadedPuzzle.difficultyLabel) {
                    matchedDifficultyValue = key;
                    currentDifficulty = value;
                    break;
                }
            }
            if (difficultySlider) difficultySlider.value = matchedDifficultyValue;
            if (difficultyValueDisplay) difficultyValueDisplay.textContent = currentDifficulty.label;

            sandboxInPlayMode = false;
            sandboxPuzzleSolved = false;

            renderSandboxGrid();
            updateSandboxCornerSymbolsDisplay();

            const solutionDisplay = document.getElementById('sandbox-solution-display');
            if (solutionDisplay) solutionDisplay.style.display = 'none';

            if (currentSandboxSolutionPath && sandboxTestSolveBtn) {
                sandboxTestSolveBtn.textContent = 'Show Solution Steps';
            } else if (sandboxTestSolveBtn) {
                sandboxTestSolveBtn.textContent = 'Test Solve This Puzzle';
            }
            showNotification(`Loaded puzzle (Seed: ${loadedPuzzle.seed}) from history.`, 'success');
        });

        listItem.appendChild(infoDiv);
        listItem.appendChild(loadButton);
        historyList.appendChild(listItem);
    });
}

function initClearHistoryButton() {
    const clearHistoryBtn = document.getElementById('sandbox-clear-history-btn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function () {
            if (confirm('Are you sure you want to clear the entire puzzle history? This cannot be undone.')) {
                localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
                populateSandboxHistoryUI();
                showNotification('Puzzle history cleared.', 'info');
                this.style.display = 'none';
            }
        });
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-tab='${tabId}']`).classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const activeTabContent = document.getElementById(tabId);
    if (activeTabContent) {
        activeTabContent.classList.add('active');
    }

    const historyPanel = document.getElementById('sandbox-history-panel');
    if (historyPanel) {
        if (tabId === 'sandbox' && activeTabContent) {
            historyPanel.style.display = 'flex';
            adjustHistoryPanelHeight();
        } else {
            historyPanel.style.display = 'none';
        }
    }
}

function adjustHistoryPanelHeight() {
    const historyPanel = document.getElementById('sandbox-history-panel');
    const sandboxTabContent = document.getElementById('sandbox');
    const mainContainer = document.querySelector('.container');

    if (historyPanel && sandboxTabContent && sandboxTabContent.classList.contains('active') && mainContainer) {
        const sandboxMainContent = sandboxTabContent.querySelector('.sandbox-main-content');
        if (sandboxMainContent) {
            const mainContainerRect = mainContainer.getBoundingClientRect();
            const sandboxContentRect = sandboxMainContent.getBoundingClientRect();

            const panelTop = mainContainerRect.top;
            historyPanel.style.top = `${panelTop}px`;

            historyPanel.style.maxHeight = `${sandboxContentRect.height}px`;
            historyPanel.style.height = `${sandboxContentRect.height}px`;
        }
    }
}

window.addEventListener('resize', () => {
    const sandboxTab = document.querySelector('.tab[data-tab="sandbox"]');
    if (sandboxTab && sandboxTab.classList.contains('active')) {
        adjustHistoryPanelHeight();
    }
});

function applySpoilerMode(isSpoilerFree) {
    if (isSpoilerFree) {
        document.body.classList.add('spoilers-hidden');
    } else {
        document.body.classList.remove('spoilers-hidden');
    }
}

function handleSpoilerToggleChange() {
    if (!spoilerFreeToggle) return;
    const isSpoilerFree = spoilerFreeToggle.checked;
    applySpoilerMode(isSpoilerFree);
    localStorage.setItem('spoilerFreeEnabled', isSpoilerFree.toString());
}

function initSpoilerMode() {
    spoilerFreeToggle = document.getElementById('spoiler-free-toggle');
    if (!spoilerFreeToggle) {
        return;
    }

    let spoilerFreeEnabled = localStorage.getItem('spoilerFreeEnabled');
    if (spoilerFreeEnabled === null) {
        spoilerFreeEnabled = true;
    } else {
        spoilerFreeEnabled = spoilerFreeEnabled === 'true';
    }

    spoilerFreeToggle.checked = spoilerFreeEnabled;
    applySpoilerMode(spoilerFreeEnabled);

    spoilerFreeToggle.addEventListener('change', handleSpoilerToggleChange);
}

function checkInitialSandboxStateForModal() {
    console.log("Initial sandbox state checked.");
}

function initSolutionStepSpoilers(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Spoiler container #${containerId} not found.`);
        return;
    }

    container.addEventListener('click', function (event) {
        const spoiler = event.target.closest('.solution-step-spoiler');
        if (spoiler) {
            spoiler.classList.toggle('revealed');
            const isRevealed = spoiler.classList.contains('revealed');
            spoiler.setAttribute('aria-pressed', isRevealed.toString());
        }
    });

    container.addEventListener('keydown', function (event) {
        const spoiler = event.target.closest('.solution-step-spoiler');
        if (spoiler && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            spoiler.click();
        }
    });
}