importScripts('mora_jai_utils.js');

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
    console.log(`[Worker/Solvability] Checking puzzle. Seed: ${generationSeed}, Max Steps: ${maxSolutionSteps}`);
    const initialState = [...gridToCheck];
    const targetCornerIndices = { tl: 0, tr: 2, bl: 6, br: 8 };

    let visited = new Set();
    let iterations = 0;

    function addToVisited(state) {
        visited.add(state.join(''));
    }

    function isVisited(state) {
        return visited.has(state.join(''));
    }

    function checkIsSolved(state) {
        return state[targetCornerIndices.tl] === targetsToCheck.tl &&
            state[targetCornerIndices.tr] === targetsToCheck.tr &&
            state[targetCornerIndices.bl] === targetsToCheck.bl &&
            state[targetCornerIndices.br] === targetsToCheck.br;
    }

    const shallowBfsDepthLimit = Math.min(maxSolutionSteps, workerMaxShallowBfsDepth);
    console.log(`[Worker/Solvability] Starting shallow BFS check (depth up to ${shallowBfsDepthLimit})`);

    visited = new Set();
    addToVisited(initialState);

    function bfsLimitedForChecker(limit) {
        const q = [{ state: initialState, path: [] }];
        let bfsIterations = 0;

        while (q.length > 0) {
            if (stopGenerationOrder) return { solvable: false, path: null, reason: 'Stopped by user' };
            bfsIterations++;
            if (bfsIterations > workerMaxIterations) {
                console.warn('[Worker/Solvability] BFS Exceeded local max iterations');
                return { solvable: false, path: null, reason: `BFS Limited (${limit}): Exceeded local max iterations`, iterations: bfsIterations };
            }
            if (iterations + bfsIterations > workerMaxIterations) {
                console.warn('[Worker/Solvability] BFS Exceeded global max iterations');
                return { solvable: false, path: null, reason: `BFS Limited (${limit}): Exceeded global max iterations`, iterations: bfsIterations };
            }

            const { state, path } = q.shift();
            if (checkIsSolved(state)) {
                console.log(`[Worker/Solvability] BFS Solved! Path length: ${path.length}, Iterations: ${bfsIterations}`);
                return { solvable: true, path: path, reason: `BFS Limited (${limit}): Solved`, iterations: bfsIterations };
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
        console.log(`[Worker/Solvability] BFS Exhausted for limit ${limit}. Iterations: ${bfsIterations}`);
        return { solvable: false, path: null, reason: `BFS Limited (${limit}): Exhausted`, iterations: bfsIterations };
    }

    let result = bfsLimitedForChecker(shallowBfsDepthLimit);
    iterations += result.iterations || 0;

    if (result.solvable) {
        console.log('[Worker/Solvability] Solved with shallow BFS.');
        return { ...result, totalIterations: iterations };
    }
    if (result.reason && result.reason.includes('Exceeded global max iterations')) {
        return { ...result, totalIterations: iterations };
    }

    console.log('[Worker/Solvability] Shallow BFS failed or depth too great. Trying IDDFS.');

    function dfsLimitedForChecker(state, path, depth, currentMaxDepth) {
        iterations++;
        if (stopGenerationOrder) return { solvable: false, path: null, reason: 'Stopped by user' };
        if (iterations > workerMaxIterations) {
            console.warn('[Worker/Solvability] IDDFS Exceeded max iterations');
            return { solvable: false, path: null, reason: 'IDDFS: Exceeded max iterations' };
        }

        if (checkIsSolved(state)) {
            console.log(`[Worker/Solvability] IDDFS Solved! Path length: ${path.length}, Depth: ${depth}, Iterations: ${iterations}`);
            return { solvable: true, path: path, reason: 'IDDFS: Solved' };
        }
        if (depth >= currentMaxDepth) {
            return { solvable: false, path: null, reason: 'IDDFS: Depth limit reached for current iteration' };
        }

        for (let i = 0; i < 9; i++) {
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
            console.log(`[Worker/Solvability] IDDFS: Trying depth limit: ${depthLimit} (Global iterations so far: ${iterations})`);
            visited = new Set();
            addToVisited(initialState);

            const iddfsResult = dfsLimitedForChecker(initialState, [], 0, depthLimit);
            if (iddfsResult.solvable) {
                console.log('[Worker/Solvability] Solved with IDDFS.');
                return { ...iddfsResult, totalIterations: iterations };
            }
            if (iddfsResult.reason && iddfsResult.reason.includes('Exceeded max iterations')) {
                return { ...iddfsResult, totalIterations: iterations };
            }
            depthLimit++;
        }
        console.log(`[Worker/Solvability] IDDFS: No solution within ${maxSolutionSteps} steps.`);
        return { solvable: false, path: null, reason: `IDDFS: No solution within ${maxSolutionSteps} steps`, totalIterations: iterations };
    }

    result = idDfsForChecker();
    console.log('[Worker/Solvability] Final check result:', result);
    return result;
}


function generatePuzzleInWorker(difficulty, userProvidedSeed, availableColorsObject, generationOptions, maxGenerationAttempts, workerMaxIterations, workerMaxShallowBfsDepth) {
    console.log(`[Worker/Generator] Starting puzzle generation. Difficulty: ${difficulty.label}, User Seed: ${userProvidedSeed || 'None'}`);
    console.log("[Worker/Generator] Generation Options Received:", generationOptions);
    stopGenerationOrder = false;
    const initialUserSeed = userProvidedSeed;
    let currentAttemptSeed = initialUserSeed;

    const { minSteps: minSolutionSteps, maxSteps: maxSolutionStepsForGeneration, label: difficultyLabel } = difficulty;

    let currentAllowedColors = generationOptions && generationOptions.allowedColors && generationOptions.allowedColors.length > 0
        ? generationOptions.allowedColors
        : Object.keys(availableColorsObject).filter(color => color !== 'gray');

    if (currentAllowedColors.length === 0) {
        console.warn('[Worker/Generator] No allowed colors specified or available after filtering gray. Defaulting to all functional colors from availableColorsObject.');
        currentAllowedColors = Object.keys(availableColorsObject).filter(color => color !== 'gray');
        if (currentAllowedColors.length === 0) {
            console.error('[Worker/Generator] CRITICAL: No functional colors available even from availableColorsObject.');
            return { error: 'Cannot generate puzzle: No functional colors defined in the system.' };
        }
    }
    console.log("[Worker/Generator] Effective allowed colors for generation:", currentAllowedColors);

    let attempts = 0;
    const useMaxAttempts = difficultyLabel !== 'Impossible';

    for (attempts = 0; useMaxAttempts ? attempts < maxGenerationAttempts : true; attempts++) {
        if (stopGenerationOrder) {
            console.log('[Worker/Generator] Stop order received, aborting generation attempts.');
            return { error: 'Puzzle generation cancelled by user.' };
        }
        if (attempts > 0) {
            currentAttemptSeed = initialUserSeed ? currentAttemptSeed : Date.now() + attempts;
            postProgress('Retrying puzzle generation...', { attempt: attempts + 1, seed: currentAttemptSeed });
            console.log(`[Worker/Generator] Attempt ${attempts + 1}/${maxGenerationAttempts}. New Seed: ${currentAttemptSeed}`);
        } else {
            currentAttemptSeed = initialUserSeed || Date.now();
            console.log(`[Worker/Generator] Attempt ${attempts + 1}/${maxGenerationAttempts}. Seed: ${currentAttemptSeed}`);
        }
        setSeed(currentAttemptSeed);

        const newTargetCorners = { tl: null, tr: null, bl: null, br: null };
        const cornerKeys = Object.keys(newTargetCorners);

        if (generationOptions && generationOptions.makeCornersUniform) {
            let uniformColor = null;
            if (generationOptions.uniformCornerColorTarget && currentAllowedColors.includes(generationOptions.uniformCornerColorTarget)) {
                uniformColor = generationOptions.uniformCornerColorTarget;
                console.log("[Worker/Generator] Using specified uniform corner color:", uniformColor);
            } else {
                if (generationOptions.uniformCornerColorTarget && !currentAllowedColors.includes(generationOptions.uniformCornerColorTarget)) {
                    console.warn(`[Worker/Generator] Specified uniform corner color '${generationOptions.uniformCornerColorTarget}' is not in the allowed list. Picking random allowed color instead.`);
                }
                const uniformColorIndex = Math.floor(seededRandom() * currentAllowedColors.length);
                uniformColor = currentAllowedColors[uniformColorIndex];
                console.log("[Worker/Generator] Making corners uniform with randomly selected allowed color:", uniformColor);
            }
            for (const corner of cornerKeys) {
                newTargetCorners[corner] = uniformColor;
            }
        } else {
            for (const corner of cornerKeys) {
                const randomIndex = Math.floor(seededRandom() * currentAllowedColors.length);
                newTargetCorners[corner] = currentAllowedColors[randomIndex];
            }
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
            if (placedColors.size < minDistinctColors && distinctAttempts < currentAllowedColors.length * 2) {
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

        const solvabilityResult = checkPuzzleSolvability(newGrid, newTargetCorners, maxSolutionStepsForGeneration, currentAttemptSeed, workerMaxIterations, workerMaxShallowBfsDepth);

        if (stopGenerationOrder) {
            console.log('[Worker/Generator] Stop order detected after solvability check. Aborting.');
            return { error: 'Puzzle generation cancelled by user.' };
        }

        if (solvabilityResult.solvable) {
            console.log(`[Worker/Generator] Attempt ${attempts + 1}: Puzzle IS solvable. Path length: ${solvabilityResult.path.length}, Min steps for difficulty: ${minSolutionSteps}`);
            if (solvabilityResult.path.length < minSolutionSteps) {
                console.log(`[Worker/Generator] Attempt ${attempts + 1}: Puzzle TRIVIAL for difficulty ${difficulty.label}. Solved in ${solvabilityResult.path.length} steps, needs >= ${minSolutionSteps}.`);
                if (initialUserSeed) {
                    console.log('[Worker/Generator] User-provided seed, returning trivial puzzle.');
                    return {
                        success: true,
                        puzzle: {
                            seed: currentAttemptSeed,
                            initialGrid: newGrid,
                            targetCorners: newTargetCorners,
                            solutionPath: solvabilityResult.path,
                            difficultyLabel: difficulty.label,
                            steps: solvabilityResult.path.length,
                            isTrivial: true
                        },
                        message: `Loaded puzzle from seed ${currentAttemptSeed}. It is solvable in ${solvabilityResult.path.length} steps (considered trivial for ${difficulty.label}).`
                    };
                }
                console.log('[Worker/Generator] Retrying due to trivial puzzle...');
                continue;
            }
            console.log(`[Worker/Generator] Attempt ${attempts + 1}: Puzzle SOLVABLE and NON-TRIVIAL. Seed: ${currentAttemptSeed}, Path: ${solvabilityResult.path.length} steps.`);
            return {
                success: true,
                puzzle: {
                    seed: currentAttemptSeed,
                    initialGrid: newGrid,
                    targetCorners: newTargetCorners,
                    solutionPath: solvabilityResult.path,
                    difficultyLabel: difficulty.label,
                    steps: solvabilityResult.path.length,
                    isTrivial: false
                },
                message: `Generated random puzzle (seed: ${currentAttemptSeed}). Solvable in ${solvabilityResult.path.length} steps.`
            };
        }
        console.log(`[Worker/Generator] Attempt ${attempts + 1}: Puzzle NOT solvable (Seed: ${currentAttemptSeed}). Reason: ${solvabilityResult.reason}`);
        if (initialUserSeed) {
            console.error(`[Worker/Generator] User-provided seed ${currentAttemptSeed} resulted in an unsolvable puzzle.`);
            return {
                error: `Puzzle from seed ${currentAttemptSeed} is not solvable within ${maxSolutionStepsForGeneration} steps. Reason: ${solvabilityResult.reason || 'Unknown'}`
            };
        }
    }

    console.error(`[Worker/Generator] Could not generate a suitable puzzle. Last seed tried: ${currentAttemptSeed}. Difficulty: ${difficultyLabel}`);
    return {
        error: `Could not generate a suitable puzzle. Last seed tried: ${currentAttemptSeed}. For ${difficultyLabel} difficulty.`
    };
}

self.onmessage = function (e) {
    const { type, data } = e.data;
    console.log('[Worker] Generic message received. Full event data:', JSON.stringify(e.data));

    if (type === 'startGeneration') {
        stopGenerationOrder = false;
        const { difficulty, userSeed, colors, generationOptions, MAX_GENERATION_ATTEMPTS, WORKER_MAX_ITERATIONS, WORKER_MAX_SHALLOW_BFS_DEPTH } = data;
        postProgress('Puzzle generation started in worker...', { seed: userSeed || 'New' });
        const result = generatePuzzleInWorker(difficulty, userSeed, colors, generationOptions, MAX_GENERATION_ATTEMPTS, WORKER_MAX_ITERATIONS, WORKER_MAX_SHALLOW_BFS_DEPTH);
        console.log('[Worker] Generation finished. Result:', result);
        if (stopGenerationOrder && result.error && result.error.includes('cancelled')) {
        } else if (result.success) {
            self.postMessage({ type: 'generationResult', puzzleData: result.puzzle, message: result.message });
        } else {
            self.postMessage({ type: 'generationError', error: result.error });
        }
    } else if (type === 'stopGeneration') {
        console.log('[Worker] Received stopGeneration command. Setting stopGenerationOrder to true.');
        stopGenerationOrder = true;
    }
};