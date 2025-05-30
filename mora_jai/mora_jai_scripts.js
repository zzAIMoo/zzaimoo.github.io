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
let selectedUniformCornerColor = null;

let SOLVER_MAX_STEPS = 70;
let SOLVER_MAX_DEPTH_LIMIT = 70;
let SOLVER_MAX_ITERATIONS = 3000000;

let GENERATOR_WORKER_MAX_ITERATIONS = 3000000;
let GENERATOR_WORKER_MAX_SHALLOW_BFS_DEPTH = 70;
let GENERATOR_MAX_GENERATION_ATTEMPTS = 100;

const positionNotations = [
    'TOP LEFT', 'TOP', 'TOP RIGHT',
    'LEFT', 'MID', 'RIGHT',
    'BOTTOM LEFT', 'BOTTOM', 'BOTTOM RIGHT'
];

const loadingPhrases = [
    "Mora Jai-ing stuff...",
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
let loadingTitleIntervalId = null;

let currentSolverWorker = null;
let currentGeneratorWorker = null;

const difficultySettings = {
    1: { label: 'Easy', minSteps: 3, maxSteps: 6 },
    2: { label: 'Medium', minSteps: 7, maxSteps: 10 },
    3: { label: 'Hard', minSteps: 11, maxSteps: 29 },
    4: { label: 'Impossible', minSteps: 30, maxSteps: 60 }
};
let currentDifficulty = difficultySettings[2];

const LOCAL_STORAGE_HISTORY_KEY = 'sandboxPuzzleHistory';
const MAX_HISTORY_ITEMS = 10;
const SANDBOX_SETTINGS_KEY = 'sandboxGenerationSettings';

document.addEventListener('DOMContentLoaded', function () {
    initGrid();
    initColorPalette();
    initEventListeners();
    updateCornerSymbolsDisplay();
    initSandbox();
    initDifficultySlider();
    initGeneratorWorker();
    initSandboxGenerationOptions();
    loadSandboxGenerationSettings();
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

    const cancelGenerationBtn = document.getElementById('cancel-generation-btn');
    if (cancelGenerationBtn) {
        console.log("[Main] Attaching event listener to cancel-generation-btn.");
        cancelGenerationBtn.addEventListener('click', function () {
            console.log("[Main] Cancel button clicked.");
            if (currentGeneratorWorker) {
                console.log("[Main] currentGeneratorWorker exists. Terminating worker.");
                currentGeneratorWorker.terminate();
                currentGeneratorWorker = null;
                console.log("[Main] Generator Worker terminated. Will re-initialize on next request or if init is called.");
            } else {
                console.error("[Main] currentGeneratorWorker is null or undefined. Cannot terminate.");
            }
            hideLoadingModal();
            showNotification("Puzzle generation cancelled by user.", "info");
        });
    } else {
        console.error("[Main] cancel-generation-btn not found in DOM.");
    }

    populateSandboxHistoryUI();
    initClearHistoryButton();
    checkInitialSandboxStateForModal();
    initSpoilerMode();
    initSolutionStepSpoilers('solution-output');
    initSolutionStepSpoilers('sandbox-solution-display');
    animateCardsInActiveTab();
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
    const initialActiveTab = document.querySelector('.tab.active');
    if (initialActiveTab && initialActiveTab.dataset.tab === 'sandbox') {
        const historyPanel = document.getElementById('sandbox-history-panel');
        if (historyPanel) {
            historyPanel.style.display = 'flex';
            adjustHistoryPanelHeight();
        }
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
        if (!validateInputs()) {
            return;
        }

        solvingInProgress = true;
        document.getElementById('solve-btn').disabled = true;
        document.getElementById('stop-btn').disabled = false;
        document.getElementById('solution-output').innerHTML = '<p>Initializing solver worker...</p>';

        if (currentSolverWorker) {
            currentSolverWorker.terminate();
        }
        currentSolverWorker = new Worker('solver_worker.js');

        if (window.APP_CONFIG) {
            console.log("[Main] APP_CONFIG found. Applying configuration to solver worker.");
            SOLVER_MAX_STEPS = window.APP_CONFIG.MAX_STEPS !== undefined ? window.APP_CONFIG.MAX_STEPS : SOLVER_MAX_STEPS;
            SOLVER_MAX_DEPTH_LIMIT = window.APP_CONFIG.MAX_DEPTH_LIMIT !== undefined ? window.APP_CONFIG.MAX_DEPTH_LIMIT : SOLVER_MAX_DEPTH_LIMIT;
            SOLVER_MAX_ITERATIONS = window.APP_CONFIG.MAX_ITERATIONS !== undefined ? window.APP_CONFIG.MAX_ITERATIONS : SOLVER_MAX_ITERATIONS;
        } else {
            console.log("[Main] No APP_CONFIG found. Using default configuration.");
        }

        currentSolverWorker.postMessage({
            type: 'start',
            data: {
                initialGrid: [...grid],
                targetCorners: { ...targetCorners },
                MAX_STEPS: SOLVER_MAX_STEPS,
                MAX_DEPTH_LIMIT: SOLVER_MAX_DEPTH_LIMIT,
                MAX_ITERATIONS: SOLVER_MAX_ITERATIONS
            }
        });

        document.getElementById('solution-output').innerHTML = '<p>Solving puzzle... This may take a moment.</p>';

        currentSolverWorker.onmessage = function (e) {
            const { type, data, message } = e.data;
            if (type === 'progress') {
                updateProgressUI(message);
            } else if (type === 'result') {
                console.log("[Main] Worker Result:", data);
                displaySolution(data);
                solvingInProgress = false;
                document.getElementById('solve-btn').disabled = false;
                document.getElementById('stop-btn').disabled = true;
                if (currentSolverWorker) {
                    currentSolverWorker.terminate();
                    currentSolverWorker = null;
                }
            }
        };

        currentSolverWorker.onerror = function (error) {
            console.error("Solver worker error:", error);
            document.getElementById('solution-output').innerHTML = `
                <div class="solution-step">
                    <h3>Error Occurred in Solver Worker</h3>
                    <p>${error.message || 'Unknown worker error'}</p>
                </div>
            `;
            solvingInProgress = false;
            document.getElementById('solve-btn').disabled = false;
            document.getElementById('stop-btn').disabled = true;
            if (currentSolverWorker) {
                currentSolverWorker.terminate();
                currentSolverWorker = null;
            }
        };
    });

    document.getElementById('stop-btn').addEventListener('click', function () {
        if (currentSolverWorker) {
            currentSolverWorker.postMessage({ type: 'stop' });
            showNotification('Stopping solver... worker will terminate after current check.', 'info');
        }
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

function updateProgressUI(message) {
    const solutionOutput = document.getElementById('solution-output');
    if (solutionOutput) {
        solutionOutput.innerHTML = `<p style="color: var(--text-secondary);">${message}</p>`;
    }
}

function displaySolution(result) {
    const solutionOutput = document.getElementById('solution-output');

    const timeTaken = result.time !== undefined ? result.time.toFixed(2) : 'N/A';
    const iterationsDisplay = result.iterations !== undefined ? result.iterations.toLocaleString() : 'N/A';

    if (!result.solved) {
        solutionOutput.innerHTML = `
                <div class="solution-step">
                    <h3>No Solution Found</h3>
                    <p>Reason: ${result.reason || 'Unknown'}</p>
                <p>Total Iterations: ${iterationsDisplay}</p>
                    <p>Time: ${timeTaken} seconds</p>
                </div>
            `;
        return;
    }

    lastSolutionResult = result;

    let html = `
            <div class="solution-step">
                <h3>Solution Found!</h3>
                <p>Steps: ${result.path.length}</p>
            <p>Total Iterations: ${iterationsDisplay}</p>
                <p>Time: ${timeTaken} seconds</p>
            </div>
        `;

    let stepsInteractiveHtml = '<div class="solution-steps-interactive-container">';
    result.path.forEach((step, i) => {
        const stepText = `(${getPositionNotation(step.index)} - ${colors[step.triggeredBy] ? colors[step.triggeredBy].name : step.triggeredBy})`;
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
                <div style="display:flex; align-items:center; gap:10px;">
                    <h4>Press Tiles in This Order (click to reveal):</h4>
                    <button id="reveal-all-steps-btn" class="button button-small button-secondary">Reveal All</button>
                </div>
                ${stepsInteractiveHtml}
            </div>
        `;

    let currentDisplayState = [...grid];
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
                <h4>Step ${i + 1}: Activate ${colors[triggeredBy] ? colors[triggeredBy].name : triggeredBy} at ${positionNotation}</h4>
                <p><strong>Effect:</strong> ${colors[triggeredBy] ? colors[triggeredBy].function : 'N/A'}</p>

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
    document.getElementById('reveal-all-steps-btn').addEventListener('click', function () {
        const isHidden = document.getElementById('reveal-all-steps-btn').textContent === 'Hide Steps';
        document.querySelectorAll('.solution-step-spoiler').forEach(el => {
            el.click();
        });
        document.getElementById('reveal-all-steps-btn').textContent = isHidden ? 'Reveal All' : 'Hide Steps';
    });

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
            requestPuzzleGenerationFromWorker(seedAsNumber);
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

            const uniformCornersCheckbox = document.getElementById('sandbox-uniform-corners-checkbox');
            if (uniformCornersCheckbox) uniformCornersCheckbox.checked = false;
            document.querySelectorAll('#sandbox-allowed-colors-container input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = true;
                checkbox.disabled = false;
                if (checkbox.parentElement) checkbox.parentElement.classList.remove('forced-color-checkbox-label');
                const colorName = checkbox.dataset.colorName || checkbox.value;
                checkbox.parentElement.title = `Allow ${colorName} in random generation`;
            });

            selectedUniformCornerColor = null;
            const uniformColorSelectContainer = document.getElementById('sandbox-uniform-corner-color-select-container');
            if (uniformColorSelectContainer) uniformColorSelectContainer.style.display = 'none';
            document.querySelectorAll('#uniform-corner-color-options .color-swatch-selectable').forEach(swatch => {
                swatch.classList.remove('selected');
            });

            const anyColorSwatch = document.querySelector('#uniform-corner-color-options [data-color="__RANDOM_UNIFORM__"');
            if (anyColorSwatch) anyColorSwatch.classList.add('selected');

            const noGraysCheckbox = document.getElementById('sandbox-no-initial-grays-checkbox');
            if (noGraysCheckbox) noGraysCheckbox.checked = false;
            const minDistinctInput = document.getElementById('sandbox-min-distinct-colors');
            if (minDistinctInput) minDistinctInput.value = 3;
            const maxDistinctInput = document.getElementById('sandbox-max-distinct-colors');
            if (maxDistinctInput) maxDistinctInput.value = 7;

            const modal = document.getElementById('sandbox-victory-modal');
            if (modal && modal.classList.contains('visible')) {
                modal.classList.remove('visible');
            }
            document.querySelectorAll('#sandbox-color-palette .color-option').forEach(el => el.classList.remove('selected'));
            renderSandboxGrid();
            updateSandboxCornerSymbolsDisplay();
            showNotification('Sandbox has been reset.', 'success');
            saveSandboxGenerationSettings();
        });
    }

    if (restartSandboxPuzzleBtn) {
        restartSandboxPuzzleBtn.addEventListener('click', function () {
            restartSandboxPuzzle();
        });
    }

    if (generateRandomSandboxPuzzleBtn) {
        generateRandomSandboxPuzzleBtn.addEventListener('click', function () {
            requestPuzzleGenerationFromWorker();
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

function showLoadingModal(initialPhrase, title) {
    if (!loadingModalElement) loadingModalElement = document.getElementById('sandbox-loading-modal');
    if (!loadingPhraseElement) loadingPhraseElement = document.getElementById('loading-phrase');
    if (!loadingModalTitleElement) loadingModalTitleElement = document.getElementById('loading-modal-title');

    if (loadingModalElement && loadingPhraseElement && loadingModalTitleElement) {
        if (loadingTitleIntervalId) {
            clearInterval(loadingTitleIntervalId);
            loadingTitleIntervalId = null;
        }

        loadingModalTitleElement.style.opacity = '0';
        setTimeout(() => {
            loadingModalTitleElement.textContent = loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)];
            loadingModalTitleElement.style.opacity = '1';
        }, 50);

        loadingTitleIntervalId = setInterval(() => {
            if (loadingModalTitleElement && loadingModalElement.classList.contains('visible')) {
                loadingModalTitleElement.style.opacity = '0';
                setTimeout(() => {
                    loadingModalTitleElement.textContent = loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)];
                    loadingModalTitleElement.style.opacity = '1';
                }, 250);
            }
        }, 2800);

        loadingPhraseElement.textContent = initialPhrase || loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)];

        loadingModalElement.classList.add('visible');
    }
}

function updateLoadingPhrase(phrase) {
    if (loadingPhraseElement && loadingModalElement && loadingModalElement.classList.contains('visible')) {
        loadingPhraseElement.textContent = phrase;
    }
}

function hideLoadingModal() {
    if (loadingTitleIntervalId) {
        clearInterval(loadingTitleIntervalId);
        loadingTitleIntervalId = null;
    }
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
            <div style="display:flex; align-items:center; gap:10px;">
                <h4>Press Tiles in This Order (click to reveal):</h4>
                <button id="reveal-all-steps-btn" class="button button-small button-secondary">Reveal All</button>
            </div>
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

    document.getElementById('reveal-all-steps-btn').addEventListener('click', function () {
        const isHidden = document.getElementById('reveal-all-steps-btn').textContent === 'Hide Steps';
        document.querySelectorAll('.solution-step-spoiler').forEach(el => {
            el.click();
        });
        document.getElementById('reveal-all-steps-btn').textContent = isHidden ? 'Reveal All' : 'Hide Steps';
    });
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
    const disclaimerDisplay = document.getElementById('sandbox-difficulty-disclaimer');

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
        if (disclaimerDisplay) {
            disclaimerDisplay.style.display = currentDifficulty.label === 'Impossible' ? 'block' : 'none';
        }

        slider.addEventListener('input', function () {
            const selectedValue = parseInt(this.value);
            if (difficultySettings[selectedValue]) {
                currentDifficulty = difficultySettings[selectedValue];
                valueDisplay.textContent = currentDifficulty.label;
                console.log(`[Sandbox] Difficulty changed to: ${currentDifficulty.label} (Min steps: ${currentDifficulty.minSteps}, Max steps: ${currentDifficulty.maxSteps})`);
                if (disclaimerDisplay) {
                    disclaimerDisplay.style.display = currentDifficulty.label === 'Impossible' ? 'block' : 'none';
                }
                saveSandboxGenerationSettings();
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
            ${item.isTrivial ? '<p><span class="history-trivial-note" style="font-size:0.8em; color:var(--accent-color-darker)">Note: Puzzle is trivial for this difficulty.</span></p>' : ''}
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
    document.querySelectorAll('.tab-content .card.animate-on-load').forEach(card => {
        card.classList.remove('is-visible');
    });

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const newActiveTabButton = document.querySelector(`.tab[data-tab='${tabId}']`);
    if (newActiveTabButton) newActiveTabButton.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const activeTabContent = document.getElementById(tabId);
    if (activeTabContent) {
        activeTabContent.classList.add('active');
        animateCardsInActiveTab();
    }

    const historyPanel = document.getElementById('sandbox-history-panel');
    if (historyPanel) {
        if (tabId === 'sandbox' && activeTabContent && historyPanel.style.display !== 'flex') {
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

function initGeneratorWorker() {
    if (window.Worker) {
        currentGeneratorWorker = new Worker('generator_worker.js');
        currentGeneratorWorker.onmessage = handleGeneratorWorkerMessage;
        currentGeneratorWorker.onerror = handleGeneratorWorkerError;
        console.log("[Main] Generator Worker initialized.");
    } else {
        console.error("[Main] Web Workers not supported in this browser.");
        showNotification("Web Workers are not supported. Puzzle generation might be slow or unresponsive.", "error", 5000);
    }
}

function initSandboxGenerationOptions() {
    const allowedColorsContainer = document.getElementById('sandbox-allowed-colors-container');
    const uniformCornersCheckbox = document.getElementById('sandbox-uniform-corners-checkbox');
    const uniformColorSelectContainer = document.getElementById('sandbox-uniform-corner-color-select-container');
    const uniformColorOptionsDiv = document.getElementById('uniform-corner-color-options');

    if (!allowedColorsContainer || !uniformCornersCheckbox || !uniformColorSelectContainer || !uniformColorOptionsDiv) {
        console.error("One or more sandbox generation option elements not found.");
        return;
    }

    uniformCornersCheckbox.checked = false;
    uniformColorSelectContainer.style.display = 'none';
    selectedUniformCornerColor = null;

    allowedColorsContainer.innerHTML = '';
    const availableColorsForGrid = Object.entries(colors).filter(([key]) => key !== 'gray');
    availableColorsForGrid.forEach(([key, color]) => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = key;
        checkbox.id = `sandbox-color-checkbox-${key}`;
        checkbox.checked = true;
        checkbox.setAttribute('data-color-name', color.name);
        checkbox.addEventListener('change', saveSandboxGenerationSettings);

        const swatch = document.createElement('span');
        swatch.className = 'color-swatch-small';
        swatch.style.backgroundColor = color.hex;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = color.name;

        label.appendChild(checkbox);
        label.appendChild(swatch);
        label.appendChild(nameSpan);
        label.title = `Allow ${color.name} in random generation`;
        allowedColorsContainer.appendChild(label);
    });

    const selectAllBtn = document.getElementById('sandbox-allowed-colors-select-all');
    const deselectAllBtn = document.getElementById('sandbox-allowed-colors-deselect-all');

    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            document.querySelectorAll('#sandbox-allowed-colors-container input[type="checkbox"]').forEach(cb => {
                if (!cb.disabled) {
                    cb.checked = true;
                }
            });
            saveSandboxGenerationSettings();
        });
    }

    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', () => {
            document.querySelectorAll('#sandbox-allowed-colors-container input[type="checkbox"]').forEach(cb => {
                if (!cb.disabled) {
                    cb.checked = false;
                }
            });
            saveSandboxGenerationSettings();
        });
    }

    uniformColorOptionsDiv.innerHTML = '';

    const anyColorSwatch = document.createElement('div');
    anyColorSwatch.className = 'color-swatch-selectable any-color-swatch';
    anyColorSwatch.textContent = 'Random Color';
    anyColorSwatch.title = 'Let generator pick a random uniform corner color';
    anyColorSwatch.dataset.color = '__RANDOM_UNIFORM__';
    anyColorSwatch.addEventListener('click', function () {
        document.querySelectorAll('#uniform-corner-color-options .color-swatch-selectable').forEach(s => s.classList.remove('selected'));
        this.classList.add('selected');
        selectedUniformCornerColor = null;
        clearForcedAllowedColor();
        saveSandboxGenerationSettings();
    });
    uniformColorOptionsDiv.appendChild(anyColorSwatch);

    const availableColorsForUniformCorner = Object.entries(colors).filter(([key]) => key !== 'gray');
    availableColorsForUniformCorner.forEach(([key, color]) => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch-selectable';
        swatch.style.backgroundColor = color.hex;
        swatch.dataset.color = key;
        swatch.title = `Set uniform corners to ${color.name}`;
        swatch.addEventListener('click', function () {
            document.querySelectorAll('#uniform-corner-color-options .color-swatch-selectable').forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
            selectedUniformCornerColor = this.dataset.color;
            setForcedAllowedColor(selectedUniformCornerColor);
            saveSandboxGenerationSettings();
        });
        uniformColorOptionsDiv.appendChild(swatch);
    });

    uniformCornersCheckbox.addEventListener('change', function () {
        if (this.checked) {
            uniformColorSelectContainer.style.display = 'flex';
            const randomSwatch = uniformColorOptionsDiv.querySelector('[data-color="__RANDOM_UNIFORM__"');
            if (randomSwatch) {
                document.querySelectorAll('#uniform-corner-color-options .color-swatch-selectable.selected').forEach(s => s.classList.remove('selected'));
                randomSwatch.classList.add('selected');
                selectedUniformCornerColor = null;
                clearForcedAllowedColor();
            } else {
                selectedUniformCornerColor = null;
                clearForcedAllowedColor();
            }
        } else {
            uniformColorSelectContainer.style.display = 'none';
        }
        saveSandboxGenerationSettings();
    });

    if (!allowedColorsContainer || !uniformCornersCheckbox || !uniformColorSelectContainer || !uniformColorOptionsDiv) {
        console.error("One or more sandbox generation option elements not found.");
        return;
    }
}

function requestPuzzleGenerationFromWorker(userSeed = null) {
    if (!currentGeneratorWorker) {
        console.log("[Main] Generator worker is not available (null). Attempting to initialize.");
        initGeneratorWorker();
        if (!currentGeneratorWorker) {
            showNotification("Generator worker could not be initialized. Cannot generate puzzle.", "error");
            hideLoadingModal();
            return;
        }
        console.log("[Main] Generator worker initialized for new request.");
    }

    showLoadingModal("Warming up the puzzle generator...", "Generating Puzzle");

    const difficultySlider = document.getElementById('sandbox-difficulty-slider');
    if (difficultySlider) {
        const selectedValue = parseInt(difficultySlider.value);
        if (difficultySettings[selectedValue]) {
            currentDifficulty = difficultySettings[selectedValue];
        }
    }

    if (window.APP_CONFIG) {
        GENERATOR_WORKER_MAX_ITERATIONS = window.APP_CONFIG.GENERATOR_WORKER_MAX_ITERATIONS !== undefined ? window.APP_CONFIG.GENERATOR_WORKER_MAX_ITERATIONS : GENERATOR_WORKER_MAX_ITERATIONS;
        GENERATOR_WORKER_MAX_SHALLOW_BFS_DEPTH = window.APP_CONFIG.GENERATOR_WORKER_MAX_SHALLOW_BFS_DEPTH !== undefined ? window.APP_CONFIG.GENERATOR_WORKER_MAX_SHALLOW_BFS_DEPTH : GENERATOR_WORKER_MAX_SHALLOW_BFS_DEPTH;
        GENERATOR_MAX_GENERATION_ATTEMPTS = window.APP_CONFIG.GENERATOR_MAX_GENERATION_ATTEMPTS !== undefined ? window.APP_CONFIG.GENERATOR_MAX_GENERATION_ATTEMPTS : GENERATOR_MAX_GENERATION_ATTEMPTS;
    }

    const uniformCornersCheckbox = document.getElementById('sandbox-uniform-corners-checkbox');
    const makeCornersUniform = uniformCornersCheckbox ? uniformCornersCheckbox.checked : false;

    const allowedColorCheckboxes = document.querySelectorAll('#sandbox-allowed-colors-container input[type="checkbox"]:checked');
    let allowedColorsForGeneration = Array.from(allowedColorCheckboxes).map(cb => cb.value);

    if (allowedColorsForGeneration.length === 0) {
        allowedColorsForGeneration = Object.keys(colors).filter(key => key !== 'gray');
        document.querySelectorAll('#sandbox-allowed-colors-container input[type="checkbox"]').forEach(checkbox => checkbox.checked = true);
        showNotification('No colors selected for generation. Defaulting to all available colors.', 'warning');
    }

    const genOptions = {
        allowedColors: allowedColorsForGeneration,
        makeCornersUniform: makeCornersUniform
    };

    if (makeCornersUniform && selectedUniformCornerColor) {
        genOptions.uniformCornerColorTarget = selectedUniformCornerColor;
    }

    currentGeneratorWorker.postMessage({
        type: 'startGeneration',
        data: {
            difficulty: currentDifficulty,
            userSeed: userSeed,
            colors: colors,
            generationOptions: genOptions,
            WORKER_MAX_ITERATIONS: GENERATOR_WORKER_MAX_ITERATIONS,
            WORKER_MAX_SHALLOW_BFS_DEPTH: GENERATOR_WORKER_MAX_SHALLOW_BFS_DEPTH,
            MAX_GENERATION_ATTEMPTS: GENERATOR_MAX_GENERATION_ATTEMPTS
        }
    });
}

function handleGeneratorWorkerMessage(e) {
    const { type, puzzleData, message, error, details } = e.data;

    if (type === 'progress') {
        updateLoadingPhrase(message + (details && details.seed ? ` (Seed: ${details.seed})` : ''));
        return;
    }

    hideLoadingModal();

    if (type === 'generationResult' && puzzleData) {
        console.log("[Main] Generator Worker Result:", puzzleData);

        sandboxTargetCorners = { ...puzzleData.targetCorners };
        updateSandboxCornerSymbolsDisplay();
        sandboxGrid = [...puzzleData.initialGrid];
        renderSandboxGrid();
        sandboxInPlayMode = false;
        sandboxPuzzleSolved = false;
        sandboxInitialPlayGrid = [...puzzleData.initialGrid];
        currentSandboxSolutionPath = puzzleData.solutionPath;

        const seedInput = document.getElementById('sandbox-seed-input');
        if (seedInput) {
            seedInput.value = puzzleData.seed;
        }

        savePuzzleToHistory({
            seed: puzzleData.seed,
            initialGrid: puzzleData.initialGrid,
            targetCorners: puzzleData.targetCorners,
            solutionPath: puzzleData.solutionPath,
            difficultyLabel: puzzleData.difficultyLabel,
            steps: puzzleData.steps,
            isTrivial: puzzleData.isTrivial || false
        });

        let notificationMessage = message || `Puzzle generated (Seed: ${puzzleData.seed}). Steps: ${puzzleData.steps}.`;
        if (puzzleData.isTrivial && !puzzleData.userSeed) {
            notificationMessage += ` Note: This puzzle is simpler than typical for ${puzzleData.difficultyLabel} difficulty.`;
        }
        showNotification(notificationMessage, 'success', 5000);

        if (sandboxTestSolveBtn) sandboxTestSolveBtn.textContent = 'Show Solution Steps';
        document.getElementById('sandbox-solution-display').innerHTML = '';
        document.getElementById('sandbox-solution-display').style.display = 'none';

    } else if (type === 'generationError' && error) {
        console.error("[Main] Generator Worker Error:", error);
        console.error("[Main] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
        showNotification(`Puzzle Generation Failed: ${error}`, 'error', 7000);
        currentSandboxSolutionPath = null;
        if (sandboxTestSolveBtn) sandboxTestSolveBtn.textContent = 'Test Solve This Puzzle';
        document.getElementById('sandbox-solution-display').style.display = 'none';

        if (currentGeneratorWorker) {
            currentGeneratorWorker.terminate();
            currentGeneratorWorker = null;
            console.log("[Main] Generator Worker terminated due to error.");
        }
    } else {
        console.warn("[Main] Unknown message type from Generator Worker or missing data:", e.data);
    }
}

function handleGeneratorWorkerError(error) {
    console.error("[Main] Error in Generator Worker:", error);
    console.error("[Main] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    hideLoadingModal();
    showNotification(`An unexpected error occurred in the puzzle generator: ${error.message || 'Unknown error'}`, 'error', 7000);
    currentSandboxSolutionPath = null;
    if (sandboxTestSolveBtn) sandboxTestSolveBtn.textContent = 'Test Solve This Puzzle';
    document.getElementById('sandbox-solution-display').style.display = 'none';

    if (currentGeneratorWorker) {
        currentGeneratorWorker.terminate();
        currentGeneratorWorker = null;
        console.log("[Main] Generator Worker terminated due to error.");
    }
}

function animateCardsInActiveTab() {
    const activeTabContent = document.querySelector('.tab-content.active');
    if (activeTabContent) {
        const cards = activeTabContent.querySelectorAll('.card.animate-on-load');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('is-visible');
            }, index * 150);
        });
    }
}

function clearForcedAllowedColor() {
    document.querySelectorAll('#sandbox-allowed-colors-container input[type="checkbox"]').forEach(cb => {
        if (cb.dataset.forced === 'true') {
            cb.disabled = false;
            cb.dataset.forced = 'false';
            if (cb.parentElement) {
                cb.parentElement.classList.remove('forced-color-checkbox-label');
                const colorName = cb.dataset.colorName || cb.value;
                cb.parentElement.title = `Allow ${colorName} in random generation`;
            }
        }
    });
}

function setForcedAllowedColor(colorKey) {
    clearForcedAllowedColor();
    const targetCheckbox = document.getElementById(`sandbox-color-checkbox-${colorKey}`);
    if (targetCheckbox) {
        targetCheckbox.checked = true;
        targetCheckbox.disabled = true;
        targetCheckbox.dataset.forced = 'true';
        if (targetCheckbox.parentElement) {
            targetCheckbox.parentElement.classList.add('forced-color-checkbox-label');
            targetCheckbox.parentElement.title = 'This color is required as it is selected for uniform corners.';
        }
    }
}

function saveSandboxGenerationSettings() {
    const settings = {
        difficulty: document.getElementById('sandbox-difficulty-slider')?.value || '2',
        uniformCorners: document.getElementById('sandbox-uniform-corners-checkbox')?.checked || false,
        selectedUniformColor: selectedUniformCornerColor,
        allowedColors: {}
    };
    document.querySelectorAll('#sandbox-allowed-colors-container input[type="checkbox"]').forEach(cb => {
        settings.allowedColors[cb.value] = cb.checked;
    });

    try {
        localStorage.setItem(SANDBOX_SETTINGS_KEY, JSON.stringify(settings));
        console.log("[Main] Sandbox generation settings saved.", settings);
    } catch (e) {
        console.error("[Main] Failed to save sandbox settings to localStorage:", e);
    }
}

function loadSandboxGenerationSettings() {
    try {
        const savedSettingsJSON = localStorage.getItem(SANDBOX_SETTINGS_KEY);
        if (!savedSettingsJSON) {
            console.log("[Main] No saved sandbox settings found. Applying defaults and saving.");
            if (document.getElementById('sandbox-difficulty-slider')) document.getElementById('sandbox-difficulty-slider').value = '2';
            if (document.getElementById('sandbox-difficulty-slider')) document.getElementById('sandbox-difficulty-slider').dispatchEvent(new Event('input'));

            if (document.getElementById('sandbox-uniform-corners-checkbox')) document.getElementById('sandbox-uniform-corners-checkbox').checked = false;
            if (document.getElementById('sandbox-uniform-corners-checkbox')) document.getElementById('sandbox-uniform-corners-checkbox').dispatchEvent(new Event('change'));
            document.querySelectorAll('#uniform-corner-color-options .color-swatch-selectable.selected').forEach(s => s.classList.remove('selected'));
            const anySwatchDefault = document.querySelector('#uniform-corner-color-options [data-color="__RANDOM_UNIFORM__"');
            if (anySwatchDefault) anySwatchDefault.classList.add('selected');
            selectedUniformCornerColor = null;
            document.querySelectorAll('#sandbox-allowed-colors-container input[type="checkbox"]').forEach(cb => cb.checked = true);

            saveSandboxGenerationSettings();
            return;
        }

        const settings = JSON.parse(savedSettingsJSON);
        console.log("[Main] Loading sandbox settings:", settings);

        const difficultySlider = document.getElementById('sandbox-difficulty-slider');
        if (difficultySlider && settings.difficulty) {
            difficultySlider.value = settings.difficulty;
            difficultySlider.dispatchEvent(new Event('input'));
        }

        const uniformCornersCheckbox = document.getElementById('sandbox-uniform-corners-checkbox');
        if (uniformCornersCheckbox && typeof settings.uniformCorners === 'boolean') {
            uniformCornersCheckbox.checked = settings.uniformCorners;
            selectedUniformCornerColor = settings.selectedUniformColor || null;
            uniformCornersCheckbox.dispatchEvent(new Event('change'));

            if (settings.uniformCorners && selectedUniformCornerColor) {
                document.querySelectorAll('#uniform-corner-color-options .color-swatch-selectable').forEach(s => s.classList.remove('selected'));
                const specificColorSwatch = document.querySelector(`#uniform-corner-color-options [data-color="${selectedUniformCornerColor}"]`);
                if (specificColorSwatch) specificColorSwatch.classList.add('selected');
            } else if (settings.uniformCorners) {
                document.querySelectorAll('#uniform-corner-color-options .color-swatch-selectable').forEach(s => s.classList.remove('selected'));
                const anySwatch = document.querySelector('#uniform-corner-color-options [data-color="__RANDOM_UNIFORM__"');
                if (anySwatch) anySwatch.classList.add('selected');
            }
        } else if (uniformCornersCheckbox) {
            uniformCornersCheckbox.checked = false;
            selectedUniformCornerColor = null;
            uniformCornersCheckbox.dispatchEvent(new Event('change'));
        }

        saveSandboxGenerationSettings();
    } catch (e) {
        console.error("[Main] Error loading sandbox settings:", e);
    }
}
