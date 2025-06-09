importScripts('mora_jai_utils.js');

const TARGET_CORNER_INDICES = { tl: 0, tr: 2, bl: 6, br: 8 };
const PROGRESS_UPDATE_INTERVAL = {
    BFS: 10000,
    IDDFS: 20000
};

let workerStopSolving = false;

function solvePuzzle(initialGrid, targetCornersConfig, maxSteps, maxDepthLimit, maxIterations) {
    const startTime = performance.now();
    const initialState = [...initialGrid];
    const targetCorners = { ...targetCornersConfig };

    let visited = new Set();
    let iterations = 0;
    workerStopSolving = false;

    function updateProgress(message) {
        self.postMessage({ type: 'progress', message: message });
    }

    function addToVisited(state) {
        visited.add(state.join(''));
    }

    function isVisited(state) {
        return visited.has(state.join(''));
    }

    function isSolved(state) {
        if (!isValidTargetCorners(targetCorners)) {
            console.warn("Worker: Target corners not fully defined.");
            return false;
        }
        return Object.keys(TARGET_CORNER_INDICES).every(corner =>
            state[TARGET_CORNER_INDICES[corner]] === targetCorners[corner]
        );
    }

    function isValidTargetCorners(corners) {
        return corners.tl && corners.tr && corners.bl && corners.br;
    }

    function createSolutionStep(index, state) {
        return { index, color: state[index], triggeredBy: state[index] };
    }

    function bfs() {
        const queue = [{ state: initialState, path: [] }];
        addToVisited(initialState);

        while (queue.length > 0 && !workerStopSolving) {
            iterations++;

            if (iterations > maxIterations) {
                return createResult(false, null, 'Exceeded maximum iterations');
            }

            const { state, path } = queue.shift();

            if (isSolved(state)) {
                return createResult(true, path);
            }

            if (path.length >= maxSteps) {
                continue;
            }

            for (let i = 0; i < TOTAL_CELLS; i++) {
                const newState = performAction(state, i);
                if (!isVisited(newState)) {
                    addToVisited(newState);
                    queue.push({
                        state: newState,
                        path: [...path, createSolutionStep(i, state)]
                    });
                }
            }

            if (iterations % PROGRESS_UPDATE_INTERVAL.BFS === 0) {
                updateProgress(`Searching (BFS)... ${iterations.toLocaleString()} iterations, ${queue.length.toLocaleString()} states`);
            }
        }

        return createResult(false, null, 'BFS exhausted or stopped');
    }

    function idDfs() {
        let depthLimit = 1;

        while (depthLimit <= maxDepthLimit && !workerStopSolving) {
            updateProgress(`Trying depth limit: ${depthLimit} (IDDFS)`);
            visited = new Set();
            iterations = 0;

            const result = dfsLimited(initialState, [], 0, depthLimit);
            if (result.solved) {
                return result;
            }
            depthLimit++;
        }

        return createResult(false, null, `No solution within ${maxDepthLimit} steps (IDDFS)`);
    }

    function dfsLimited(state, path, depth, maxDepth) {
        iterations++;

        if (iterations > maxIterations) {
            return createResult(false, null, 'Exceeded maximum iterations');
        }

        if (workerStopSolving) {
            return createResult(false, null, 'Solving stopped by user');
        }

        if (isSolved(state)) {
            return createResult(true, path);
        }

        if (depth >= maxDepth) {
            return createResult(false, null, 'Depth limit reached');
        }

        if (iterations % PROGRESS_UPDATE_INTERVAL.IDDFS === 0 && !workerStopSolving) {
            updateProgress(`Searching depth ${depth}/${maxDepth}... (${iterations.toLocaleString()} IDDFS iterations)`);
        }

        for (let i = 0; i < TOTAL_CELLS; i++) {
            const newState = performAction(state, i);
            const stateKey = newState.join('');

            if (!visited.has(stateKey)) {
                visited.add(stateKey);
                const result = dfsLimited(
                    newState,
                    [...path, createSolutionStep(i, state)],
                    depth + 1,
                    maxDepth
                );

                if (result.solved) {
                    return result;
                }
            }
        }

        return createResult(false, null);
    }

    function createResult(solved, path, reason = null) {
        return {
            solved,
            path,
            reason,
            iterations,
            time: (performance.now() - startTime) / 1000
        };
    }

    updateProgress("Trying BFS for simple solutions...");
    let result = bfs();

    if (!result.solved && !workerStopSolving) {
        updateProgress("BFS exhausted or too complex. Switching to Iterative Deepening DFS...");
        result = idDfs();
    }

    return result;
}

self.onmessage = function (e) {
    const { type, data } = e.data;

    if (type === 'start') {
        const { initialGrid, targetCorners, MAX_STEPS, MAX_DEPTH_LIMIT, MAX_ITERATIONS } = data;
        const solutionResult = solvePuzzle(initialGrid, targetCorners, MAX_STEPS, MAX_DEPTH_LIMIT, MAX_ITERATIONS);
        self.postMessage({ type: 'result', data: solutionResult });
    } else if (type === 'stop') {
        workerStopSolving = true;
    }
};