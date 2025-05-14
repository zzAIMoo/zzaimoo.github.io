const colors = {
    gray: { name: 'Gray', hex: '#aaaaaa', function: 'Empty space' },
    black: { name: 'Black', hex: '#000000', function: 'Moves row right' },
    red: { name: 'Red', hex: '#ff0000', function: 'White→Black, Black→Red' },
    green: { name: 'Green', hex: '#00ff00', function: 'Swaps with opposite tile' },
    yellow: { name: 'Yellow', hex: '#ffff00', function: 'Changes place with tile above' },
    pink: { name: 'Pink', hex: '#ff69b4', function: 'Rotates adjacent tiles clockwise' },
    purple: { name: 'Purple', hex: '#800080', function: 'Changes place with tile below' },
    orange: { name: 'Orange', hex: '#ffa500', function: 'Matches majority of adjacent tiles' },
    white: { name: 'White', hex: '#ffffff', function: 'Expands or disappears (or does both :P)' },
    blue: { name: 'Blue', hex: '#4387d9', function: 'Copies middle tile behaviour' }
};

let selectedColor = null;
let grid = Array(9).fill('gray');
let targetCorners = { tl: null, tr: null, bl: null, br: null };
let solvingInProgress = false;
let stopSolving = false;
let useWrittenNotation = false;

const positionNotations = [
    'TOP LEFT', 'TOP', 'TOP RIGHT',
    'LEFT', 'MID', 'RIGHT',
    'BOTTOM LEFT', 'BOTTOM', 'BOTTOM RIGHT'
];

document.addEventListener('DOMContentLoaded', function () {
    initGrid();
    initColorPalette();
    initEventListeners();
    updateCornerSymbolsDisplay();
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
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
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

function showNotification(message, type) {
    const notificationArea = document.getElementById('notification-area');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notificationArea.innerHTML = '';
    notificationArea.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function solvePuzzle() {
    const startTime = performance.now();
    const initialState = [...grid];
    const targetCornerIndices = { tl: 0, tr: 2, bl: 6, br: 8 };
    let solution = [];
    let visited = new Set();
    const maxSteps = 100; // This might be too high for typical puzzle box limits but meh
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
                    if (!tie && majorityColor && maxCount > adjacent.length / 2) {
                        newState[index] = majorityColor;
                    }
                }
                break;
            case 'white':
                let expanded = false;
                if (row > 0 && newState[(row - 1) * cols + col] === 'gray') {
                    newState[(row - 1) * cols + col] = 'white';
                    expanded = true;
                }
                if (col < cols - 1 && newState[row * cols + (col + 1)] === 'gray') {
                    newState[row * cols + (col + 1)] = 'white';
                    expanded = true;
                }
                if (row < rows - 1 && newState[(row + 1) * cols + col] === 'gray') {
                    newState[(row + 1) * cols + col] = 'white';
                    expanded = true;
                }
                if (col > 0 && newState[row * cols + (col - 1)] === 'gray') {
                    newState[row * cols + (col - 1)] = 'white';
                    expanded = true;
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
                            if (!tie_o && maxCount_o > adjacent_o.length / 2) {
                                tempStateForBlueAction[index] = majorityColor_o;
                            }
                        }
                        break;
                    case 'white':
                        const middleTileRow_w = Math.floor(middleIndex / cols);
                        const middleTileCol_w = middleIndex % cols;
                        let middleWhiteWouldExpand_w = false;
                        if (middleTileRow_w > 0 && tempStateForBlueAction[(middleTileRow_w - 1) * cols + middleTileCol_w] === 'gray') middleWhiteWouldExpand_w = true;
                        if (!middleWhiteWouldExpand_w && middleTileCol_w < cols - 1 && tempStateForBlueAction[middleTileRow_w * cols + (middleTileCol_w + 1)] === 'gray') middleWhiteWouldExpand_w = true;
                        if (!middleWhiteWouldExpand_w && middleTileRow_w < rows - 1 && tempStateForBlueAction[(middleTileRow_w + 1) * cols + middleTileCol_w] === 'gray') middleWhiteWouldExpand_w = true;
                        if (!middleWhiteWouldExpand_w && middleTileCol_w > 0 && tempStateForBlueAction[middleTileRow_w * cols + (middleTileCol_w - 1)] === 'gray') middleWhiteWouldExpand_w = true;

                        if (middleWhiteWouldExpand_w) {
                            if (row > 0 && tempStateForBlueAction[(row - 1) * cols + col] === 'gray') {
                                tempStateForBlueAction[(row - 1) * cols + col] = 'blue';
                            }
                            if (col < cols - 1 && tempStateForBlueAction[row * cols + (col + 1)] === 'gray') {
                                tempStateForBlueAction[row * cols + (col + 1)] = 'blue';
                            }
                            if (row < rows - 1 && tempStateForBlueAction[(row + 1) * cols + col] === 'gray') {
                                tempStateForBlueAction[(row + 1) * cols + col] = 'blue';
                            }
                            if (col > 0 && tempStateForBlueAction[row * cols + (col - 1)] === 'gray') {
                                tempStateForBlueAction[row * cols + (col - 1)] = 'blue';
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
        const maxDepthLimit = 15; // Sensible max depth for puzzle boxes ig

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

        html += `
            <div class="solution-step">
                <h4>Press Tiles in This Order:</h4>
                <p>${result.path.map(step => `(${getPositionNotation(step.index)} - ${colors[step.triggeredBy].name})`).join(' <span style="color:var(--primary-color);">→</span> ')}</p>
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
            const { index, color, triggeredBy } = step; // `color` is the color of tile when it was part of `state`; `triggeredBy` is the color of the tile at `index` *before* action
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
                        ${currentDisplayState.map(c => `
                            <div style="background-color: ${colors[c].hex};"></div>
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