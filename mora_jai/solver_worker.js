importScripts('mora_jai_utils.js');

const MAX_STEPS = 50;
const MAX_DEPTH_LIMIT = 50;
const MAX_ITERATIONS = 500000;

let workerStopSolving = false;

function solvePuzzle(initialGrid, targetCornersConfig) {
    const startTime = performance.now();
    const initialState = [...initialGrid];
    const targetCorners = { ...targetCornersConfig };
    const targetCornerIndices = { tl: 0, tr: 2, bl: 6, br: 8 };

    let visited = new Set();
    const maxSteps = MAX_STEPS;
    const maxIterations = MAX_ITERATIONS;
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
        if (!targetCorners.tl || !targetCorners.tr || !targetCorners.bl || !targetCorners.br) {
            console.warn("Worker: Target corners not fully defined.");
            return false;
        }
        return state[targetCornerIndices.tl] === targetCorners.tl &&
            state[targetCornerIndices.tr] === targetCorners.tr &&
            state[targetCornerIndices.bl] === targetCorners.bl &&
            state[targetCornerIndices.br] === targetCorners.br;
    }

    function bfs() {
        const queue = [{ state: initialState, path: [] }];
        addToVisited(initialState);
        while (queue.length > 0 && !workerStopSolving) {
            iterations++;
            if (iterations > maxIterations) {
                return { solved: false, reason: 'Exceeded maximum iterations' };
            }
            const { state, path } = queue.shift();
            if (isSolved(state)) {
                return { solved: true, path, iterations, time: (performance.now() - startTime) / 1000 };
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
        return { solved: false, reason: 'BFS exhausted or stopped', iterations, time: (performance.now() - startTime) / 1000 };
    }

    function idDfs() {
        let depthLimit = 1;
        const maxDepthLimit = MAX_DEPTH_LIMIT;

        while (depthLimit <= maxDepthLimit && !workerStopSolving) {
            updateProgress(`Trying depth limit: ${depthLimit} (IDDFS)`);
            visited = new Set();
            iterations = 0;
            const result = dfsLimited(initialState, [], 0, depthLimit);
            if (result.solved) {
                return { ...result, iterations, time: (performance.now() - startTime) / 1000 };
            }
            depthLimit++;
        }
        return { solved: false, reason: `No solution within ${maxDepthLimit} steps (IDDFS)`, iterations, time: (performance.now() - startTime) / 1000 };
    }

    function dfsLimited(state, path, depth, maxDepth) {
        iterations++;
        if (iterations > maxIterations) {
            return { solved: false, reason: 'Exceeded maximum iterations' };
        }
        if (workerStopSolving) {
            return { solved: false, reason: 'Solving stopped by user' };
        }
        if (isSolved(state)) {
            return { solved: true, path };
        }
        if (depth >= maxDepth) {
            return { solved: false, reason: 'Depth limit reached' };
        }
        if (iterations % 20000 === 0 && !workerStopSolving) {
            updateProgress(`Searching depth ${depth}/${maxDepth}... (${iterations.toLocaleString()} IDDFS iterations)`);
        }

        for (let i = 0; i < 9; i++) {
            const originalTileColor = state[i];
            const newState = performAction(state, i);
            const stateKey = newState.join('');
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

    updateProgress("Trying BFS for simple solutions...");
    let result = bfs();
    if (!result.solved && !workerStopSolving) {
        updateProgress("BFS exhausted or too complex. Switching to Iterative Deepening DFS...");
        result = idDfs();
    }

    result.iterations = iterations;
    result.time = (performance.now() - startTime) / 1000;

    return result;
}


self.onmessage = function (e) {
    const { type, data } = e.data;
    if (type === 'start') {
        const { initialGrid, targetCorners } = data;
        console.log('[Worker] Received start message', data);
        const solutionResult = solvePuzzle(initialGrid, targetCorners);
        self.postMessage({ type: 'result', data: solutionResult });
    } else if (type === 'stop') {
        console.log('[Worker] Received stop message');
        workerStopSolving = true;
    }
};