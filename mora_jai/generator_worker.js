importScripts('mora_jai_utils.js');

const TARGET_CORNER_INDICES = { tl: 0, tr: 2, bl: 6, br: 8 };
const MIN_DISTINCT_COLORS = 3;

let currentSeed = null;
let stopGenerationOrder = false;

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

function postProgress(message, details) {
    self.postMessage({ type: 'progress', message, details });
}

function checkPuzzleSolvability(gridToCheck, targetsToCheck, maxSolutionSteps, generationSeed, workerMaxIterations, workerMaxShallowBfsDepth) {
    const initialState = [...gridToCheck];
    let visited = new Set();
    let iterations = 0;

    function addToVisited(state) {
        visited.add(state.join(''));
    }

    function isVisited(state) {
        return visited.has(state.join(''));
    }

    function checkIsSolved(state) {
        return Object.keys(TARGET_CORNER_INDICES).every(corner =>
            state[TARGET_CORNER_INDICES[corner]] === targetsToCheck[corner]
        );
    }

    const shallowBfsDepthLimit = Math.min(maxSolutionSteps, workerMaxShallowBfsDepth);

    visited = new Set();
    addToVisited(initialState);

    function bfsLimitedForChecker(limit) {
        const q = [{ state: initialState, path: [] }];
        let bfsIterations = 0;

        while (q.length > 0) {
            if (stopGenerationOrder) return { solvable: false, path: null, reason: 'Stopped by user' };

            bfsIterations++;
            if (bfsIterations > workerMaxIterations || iterations + bfsIterations > workerMaxIterations) {
                return { solvable: false, path: null, reason: `BFS Limited (${limit}): Exceeded max iterations`, iterations: bfsIterations };
            }

            const { state, path } = q.shift();
            if (checkIsSolved(state)) {
                return { solvable: true, path: path, reason: `BFS Limited (${limit}): Solved`, iterations: bfsIterations };
            }

            if (path.length >= limit) {
                continue;
            }

            for (let i = 0; i < TOTAL_CELLS; i++) {
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

        return { solvable: false, path: null, reason: `BFS Limited (${limit}): Exhausted`, iterations: bfsIterations };
    }

    let result = bfsLimitedForChecker(shallowBfsDepthLimit);
    iterations += result.iterations || 0;

    if (result.solvable) {
        return { ...result, totalIterations: iterations };
    }

    if (result.reason && result.reason.includes('Exceeded global max iterations')) {
        return { ...result, totalIterations: iterations };
    }

    function dfsLimitedForChecker(state, path, depth, currentMaxDepth) {
        iterations++;
        if (stopGenerationOrder) return { solvable: false, path: null, reason: 'Stopped by user' };
        if (iterations > workerMaxIterations) {
            return { solvable: false, path: null, reason: 'IDDFS: Exceeded max iterations' };
        }

        if (checkIsSolved(state)) {
            return { solvable: true, path: path, reason: 'IDDFS: Solved' };
        }

        if (depth >= currentMaxDepth) {
            return { solvable: false, path: null, reason: 'IDDFS: Depth limit reached for current iteration' };
        }

        for (let i = 0; i < TOTAL_CELLS; i++) {
            const originalTileColor = state[i];
            const newState = performAction(state, i);
            const stateKey = newState.join('');
            if (!visited.has(stateKey)) {
                visited.add(stateKey);
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
            if (stopGenerationOrder) return { solvable: false, path: null, reason: 'Stopped by user' };

            visited = new Set();
            addToVisited(initialState);

            const iddfsResult = dfsLimitedForChecker(initialState, [], 0, depthLimit);
            if (iddfsResult.solvable) {
                return { ...iddfsResult, totalIterations: iterations };
            }
            if (iddfsResult.reason && iddfsResult.reason.includes('Exceeded max iterations')) {
                return { ...iddfsResult, totalIterations: iterations };
            }
            depthLimit++;
        }

        return { solvable: false, path: null, reason: `IDDFS: No solution within ${maxSolutionSteps} steps`, totalIterations: iterations };
    }

    result = idDfsForChecker();
    return result;
}

function generatePuzzleInWorker(difficulty, userProvidedSeed, availableColorsObject, generationOptions, maxGenerationAttempts, workerMaxIterations, workerMaxShallowBfsDepth) {
    stopGenerationOrder = false;
    const initialUserSeed = userProvidedSeed;
    let currentAttemptSeed = initialUserSeed;

    const { minSteps: minSolutionSteps, maxSteps: maxSolutionStepsForGeneration, label: difficultyLabel } = difficulty;

    let currentAllowedColors = getEffectiveAllowedColors(generationOptions, availableColorsObject);
    if (currentAllowedColors.length === 0) {
        return { error: 'Cannot generate puzzle: No functional colors defined in the system.' };
    }

    let attempts = 0;
    const useMaxAttempts = difficultyLabel !== 'Impossible';

    for (attempts = 0; useMaxAttempts ? attempts < maxGenerationAttempts : true; attempts++) {
        if (stopGenerationOrder) {
            return { error: 'Puzzle generation cancelled by user.' };
        }

        currentAttemptSeed = getAttemptSeed(initialUserSeed, attempts);
        if (attempts > 0) {
            postProgress('Retrying puzzle generation...', { attempt: attempts + 1, seed: currentAttemptSeed });
        }

        setSeed(currentAttemptSeed);

        const { newGrid, newTargetCorners } = generateRandomPuzzle(generationOptions, currentAllowedColors);
        const solvabilityResult = checkPuzzleSolvability(newGrid, newTargetCorners, maxSolutionStepsForGeneration, currentAttemptSeed, workerMaxIterations, workerMaxShallowBfsDepth);

        if (stopGenerationOrder) {
            return { error: 'Puzzle generation cancelled by user.' };
        }

        if (solvabilityResult.solvable) {
            const isTrivial = solvabilityResult.path.length < minSolutionSteps;

            if (isTrivial && !initialUserSeed) {
                continue;
            }

            return {
                success: true,
                puzzle: {
                    seed: currentAttemptSeed,
                    initialGrid: newGrid,
                    targetCorners: newTargetCorners,
                    solutionPath: solvabilityResult.path,
                    difficultyLabel: difficulty.label,
                    steps: solvabilityResult.path.length,
                    isTrivial
                },
                message: createSuccessMessage(currentAttemptSeed, solvabilityResult.path.length, difficulty.label, isTrivial)
            };
        }

        if (initialUserSeed) {
            return {
                error: `Puzzle from seed ${currentAttemptSeed} is not solvable within ${maxSolutionStepsForGeneration} steps. Reason: ${solvabilityResult.reason || 'Unknown'}`
            };
        }
    }

    return {
        error: `Could not generate a suitable puzzle. Last seed tried: ${currentAttemptSeed}. For ${difficultyLabel} difficulty.`
    };
}

function getEffectiveAllowedColors(generationOptions, availableColorsObject) {
    let colors = generationOptions && generationOptions.allowedColors && generationOptions.allowedColors.length > 0
        ? generationOptions.allowedColors
        : Object.keys(availableColorsObject).filter(color => color !== 'gray');

    if (colors.length === 0) {
        colors = Object.keys(availableColorsObject).filter(color => color !== 'gray');
    }

    return colors;
}

function getAttemptSeed(initialUserSeed, attempt) {
    if (attempt === 0) {
        return initialUserSeed || Date.now();
    }
    return initialUserSeed ? initialUserSeed : Date.now() + attempt;
}

function generateRandomPuzzle(generationOptions, currentAllowedColors) {
    const newTargetCorners = generateTargetCorners(generationOptions, currentAllowedColors);
    const newGrid = generateGrid(newTargetCorners, currentAllowedColors);

    return { newGrid, newTargetCorners };
}

function generateTargetCorners(generationOptions, currentAllowedColors) {
    const corners = { tl: null, tr: null, bl: null, br: null };
    const cornerKeys = Object.keys(corners);

    if (generationOptions && generationOptions.makeCornersUniform) {
        const uniformColor = getUniformCornerColor(generationOptions, currentAllowedColors);
        cornerKeys.forEach(corner => corners[corner] = uniformColor);
    } else {
        cornerKeys.forEach(corner => {
            const randomIndex = Math.floor(seededRandom() * currentAllowedColors.length);
            corners[corner] = currentAllowedColors[randomIndex];
        });
    }

    return corners;
}

function getUniformCornerColor(generationOptions, currentAllowedColors) {
    if (generationOptions.uniformCornerColorTarget && currentAllowedColors.includes(generationOptions.uniformCornerColorTarget)) {
        return generationOptions.uniformCornerColorTarget;
    }

    const uniformColorIndex = Math.floor(seededRandom() * currentAllowedColors.length);
    return currentAllowedColors[uniformColorIndex];
}

function generateGrid(targetCorners, currentAllowedColors) {
    let newGrid = Array(TOTAL_CELLS).fill(null);
    let placedColors = new Set();
    let requiredCornerColors = new Set(Object.values(targetCorners));
    let availableGridSpots = Array.from({ length: TOTAL_CELLS }, (_, i) => i);

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

    let distinctAttempts = 0;
    while (availableGridSpots.length > 0) {
        const spot = availableGridSpots.pop();
        let chosenColor = null;

        if (placedColors.size < MIN_DISTINCT_COLORS && distinctAttempts < currentAllowedColors.length * 2) {
            let potentialNewColors = currentAllowedColors.filter(c => !placedColors.has(c));
            if (potentialNewColors.length > 0) {
                shuffleArray(potentialNewColors);
                chosenColor = potentialNewColors[0];
            }
            distinctAttempts++;
        }

        if (!chosenColor) {
            const randomIndex = Math.floor(seededRandom() * currentAllowedColors.length);
            chosenColor = currentAllowedColors[randomIndex];
        }

        newGrid[spot] = chosenColor;
        placedColors.add(chosenColor);
    }

    for (let i = 0; i < newGrid.length; i++) {
        if (newGrid[i] === null) {
            newGrid[i] = currentAllowedColors[Math.floor(seededRandom() * currentAllowedColors.length)];
        }
    }

    return newGrid;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function createSuccessMessage(seed, steps, difficulty, isTrivial) {
    const baseMessage = `Generated random puzzle (seed: ${seed}). Solvable in ${steps} steps.`;
    if (isTrivial) {
        return `Loaded puzzle from seed ${seed}. It is solvable in ${steps} steps (considered trivial for ${difficulty}).`;
    }
    return baseMessage;
}

self.onmessage = function (e) {
    try {
        const { type, data } = e.data;

        if (type === 'startGeneration') {
            stopGenerationOrder = false;
            const { difficulty, userSeed, colors, generationOptions, MAX_GENERATION_ATTEMPTS, WORKER_MAX_ITERATIONS, WORKER_MAX_SHALLOW_BFS_DEPTH } = data;

            if (!difficulty || !colors) {
                self.postMessage({ type: 'generationError', error: 'Missing required parameters' });
                return;
            }

            postProgress('Puzzle generation started in worker...', { seed: userSeed || 'New' });

            try {
                const result = generatePuzzleInWorker(
                    difficulty,
                    userSeed,
                    colors,
                    generationOptions,
                    MAX_GENERATION_ATTEMPTS || 100,
                    WORKER_MAX_ITERATIONS || 3000000,
                    WORKER_MAX_SHALLOW_BFS_DEPTH || 70
                );

                if (stopGenerationOrder && result.error && result.error.includes('cancelled')) {
                    return;
                } else if (result.success) {
                    self.postMessage({ type: 'generationResult', puzzleData: result.puzzle, message: result.message });
                } else if (result.error) {
                    self.postMessage({ type: 'generationError', error: result.error });
                } else {
                    self.postMessage({ type: 'generationError', error: 'Unknown error occurred during puzzle generation' });
                }

            } catch (generationError) {
                self.postMessage({ type: 'generationError', error: `Generation failed: ${generationError.message}` });
            }

        } else if (type === 'stopGeneration') {
            stopGenerationOrder = true;
        } else {
            self.postMessage({ type: 'generationError', error: `Unknown message type: ${type}` });
        }

    } catch (messageError) {
        self.postMessage({ type: 'generationError', error: `Message processing failed: ${messageError.message}` });
    }
};

self.onerror = function (error) {
    self.postMessage({
        type: 'generationError',
        error: `Worker error: ${error.message} at ${error.filename}:${error.lineno}`
    });
};

self.onunhandledrejection = function (event) {
    self.postMessage({
        type: 'generationError',
        error: `Worker promise rejection: ${event.reason}`
    });
};