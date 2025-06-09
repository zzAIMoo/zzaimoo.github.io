class Ability {
    constructor(id, name, description, type, rarity = 'common') {
        this.id = id;
        this.name = name;
        this.description = description;
        this.type = type; // 'active', 'passive', 'immediate'
        this.rarity = rarity;
        this.used = false;
        this.count = 1;
    }

    canUse(gauntlet) {
        return !this.used && this.type === 'active';
    }

    activate(gauntlet) {
        throw new Error('activate() must be implemented by subclass');
    }

    onMove(gauntlet, moveIndex) {
        // Override in subclasses for passive effects
    }

    onPuzzleStart(gauntlet) {
        // Override in subclasses for puzzle start effects
    }

    onPuzzleComplete(gauntlet) {
        // Override in subclasses for puzzle completion effects
    }

    getIcon() {
        return this.icon || '';
    }

    markUsed() {
        this.used = true;
    }

    reset() {
        this.used = false;
    }

    incrementCount() {
        this.count++;
    }
}

class UndoAbility extends Ability {
    constructor() {
        super('undo', 'Undo', 'Let\'s you undo your last move.', 'active', 'common');
        this.icon = '<path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.38 11.96 17.34 8 12.5 8z"/>';
    }

    canUse(gauntlet) {
        return gauntlet.moveHistory.length > 0;
    }

    activate(gauntlet) {
        if (gauntlet.moveHistory.length > 0) {
            gauntlet.currentGrid = gauntlet.moveHistory.pop();
            gauntlet.moveCount--;

            const gridCells = document.querySelectorAll('#gauntlet-grid .cell');
            gridCells.forEach((cell, i) => {
                cell.style.backgroundColor = colors[gauntlet.currentGrid[i]]?.hex || colors.gray.hex;
            });

            const undoBtn = document.getElementById('ability-btn-undo');
            if (undoBtn) {
                undoBtn.disabled = true;
            }

            showNotification("Move undone", "info");
            return true;
        }
        return false;
    }
}

class InsightAbility extends Ability {
    constructor() {
        super('insight', 'Insight', 'Once per puzzle, click a tile to see its correct final color.', 'active', 'uncommon');
        this.icon = '<path fill="#fff" d="M21.92 11.6C19.9 6.91 16.1 4 12 4s-7.9 2.91-9.92 7.6a1 1 0 0 0 0 .8C4.1 17.09 7.9 20 12 20s7.9-2.91 9.92-7.6a1 1 0 0 0 0-.8M12 18c-3.17 0-6.17-2.29-7.9-6C5.83 8.29 8.83 6 12 6s6.17 2.29 7.9 6c-1.73 3.71-4.73 6-7.9 6m0-10a4 4 0 1 0 4 4a4 4 0 0 0-4-4m0 6a2 2 0 1 1 2-2a2 2 0 0 1-2 2"/>';
    }

    activate(gauntlet) {
        if (gauntlet.isInsightModeActive) {
            gauntlet.isInsightModeActive = false;
            document.getElementById('gauntlet-grid').classList.remove('insight-mode-active');
            document.getElementById('ability-btn-insight').classList.remove('is-active');
        } else {
            gauntlet.isInsightModeActive = true;
            document.getElementById('gauntlet-grid').classList.add('insight-mode-active');
            document.getElementById('ability-btn-insight').classList.add('is-active');
            showNotification("Insight: Click a tile to reveal its final color", "info");
        }
        return true;
    }
}

class GuidanceAbility extends Ability {
    constructor() {
        super('guidance', 'Guidance', 'Once per puzzle, reveals the next correct tile to press.', 'active', 'uncommon');
        this.icon = '<path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>';
    }

    activate(gauntlet) {
        const puzzleIndex = gauntlet.currentPuzzle - 1;
        const currentPuzzle = gauntlet.puzzles[puzzleIndex];

        if (!currentPuzzle || !currentPuzzle.solutionPath) {
            showNotification("No guidance available", "error");
            return false;
        }

        // Recalculate solution from current state instead of relying on moveCount
        this.recalculateGuidanceSolution(gauntlet, (freshSolutionPath) => {
            if (!freshSolutionPath || freshSolutionPath.length === 0) {
                showNotification("No more steps needed - puzzle solved!", "success");
                return;
            }

            // Use index 0 of the fresh solution to get the correct next move
            const nextStep = freshSolutionPath[0];
            const correctNextIndex = nextStep.index;
            const tile = document.querySelector(`#gauntlet-grid .cell[data-index='${correctNextIndex}']`);

            if (tile) {
                highlightTile(tile);
            }
        });

        return true;
    }

    recalculateGuidanceSolution(gauntlet, callback) {
        if (!window.guidanceSolverWorker) {
            window.guidanceSolverWorker = new Worker('solver_worker.js');

            window.guidanceSolverWorker.onmessage = function (e) {
                const { type, data } = e.data;
                if (type === 'result') {
                    callback(data.path || []);
                    window.guidanceSolverWorker.terminate();
                    window.guidanceSolverWorker = null;
                }
            };

            window.guidanceSolverWorker.onerror = function (error) {
                console.error("Guidance Solver Worker Error:", error);
                callback([]);
                window.guidanceSolverWorker.terminate();
                window.guidanceSolverWorker = null;
            };
        }

        const MAX_STEPS = 25;
        const MAX_DEPTH_LIMIT = 25;
        const MAX_ITERATIONS = 5_000_000;

        window.guidanceSolverWorker.postMessage({
            type: 'start',
            data: {
                initialGrid: [...gauntlet.currentGrid],
                targetCorners: { ...gauntlet.currentTargets },
                MAX_STEPS,
                MAX_DEPTH_LIMIT,
                MAX_ITERATIONS
            }
        });
    }
}

class ClarityAbility extends Ability {
    constructor() {
        super('clarity', 'Clarity', 'Reduces the pool of possible colors for all subsequent puzzles.', 'passive', 'epic');
        this.icon = '<path fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.992 18h6m-8.58-7.657a4 4 0 1 0 5.657-5.657a4 4 0 0 0-5.657 5.657m0 0l-8.485 8.485l2.121 2.122M6.755 16l2.122 2.121"/>';
    }
}

class OracleAbility extends Ability {
    constructor() {
        super('oracle', 'Oracle\'s Glimpse', 'Every 5 moves, 3 tiles are highlighted. One of them is a correct next step.', 'passive', 'rare');
        this.icon = '<path fill="#fff" d="m20.713 7.128l-.246.566a.506.506 0 0 1-.934 0l-.246-.566a4.36 4.36 0 0 0-2.22-2.25l-.759-.339a.53.53 0 0 1 0-.963l.717-.319A4.37 4.37 0 0 0 19.276.931L19.53.32a.506.506 0 0 1 .942 0l.253.61a4.37 4.37 0 0 0 2.25 2.327l.718.32a.53.53 0 0 1 0 .962l-.76.338a4.36 4.36 0 0 0-2.219 2.251M9 2a8 8 0 0 1 7.934 6.965l2.25 3.539c.148.233.118.58-.225.728L17 14.07V17a2 2 0 0 1-2 2h-1.999L13 22H4v-3.694c0-1.18-.436-2.297-1.244-3.305A8 8 0 0 1 9 2m0 2a6 6 0 0 0-4.684 9.75C5.41 15.114 6 16.667 6 18.306V20h5l.002-3H15v-4.248l1.55-.664l-1.543-2.425l-.057-.442A6 6 0 0 0 9 4m10.49 12.993l1.664 1.11A10.95 10.95 0 0 0 23 12q-.001-1.025-.181-2l-1.943.5q.123.733.124 1.5a8.96 8.96 0 0 1-1.51 4.993"/>';
    }

    onMove(gauntlet) {
        console.log("Oracle onMove called");
        if (gauntlet.moveCount > 0 && gauntlet.moveCount % 5 === 0) {
            this.triggerOracle(gauntlet);
        }

        return {
            updateCounter: true,
            counterValue: this.getCounterValue(gauntlet)
        };
    }

    getCounterValue(gauntlet) {
        return 5 - (gauntlet.moveCount % 5);
    }

    triggerOracle(gauntlet) {
        this.recalculateOracleSolution(gauntlet, (freshSolutionPath) => {
            if (!freshSolutionPath || freshSolutionPath.length === 0) {
                showNotification("No further steps in solution path found, a reset is recommended.", "warning");
                return;
            }

            const nextStep = freshSolutionPath[0];
            const correctNextIndex = nextStep.index;

            if (correctNextIndex !== undefined) {
                let options = [correctNextIndex];
                let allIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
                let otherIndices = allIndices.filter(i => i !== correctNextIndex);
                otherIndices.sort(() => 0.5 - Math.random());
                options.push(otherIndices[0], otherIndices[1]);
                options.sort(() => 0.5 - Math.random());

                options.forEach((i, delay) => {
                    const tile = document.querySelector(`#gauntlet-grid .cell[data-index='${i}']`);
                    if (tile) {
                        setTimeout(() => highlightTile(tile), delay * 150);
                    }
                });

                showNotification("Oracle's Glimpse activated: Next possible move out of 3 highlighted.", "info");
            }
        });
    }

    //TODO: maybe i can create an helper method to avoid duplicating the code? can't be bothered right now
    recalculateOracleSolution(gauntlet, callback) {
        if (!window.oracleSolverWorker) {
            window.oracleSolverWorker = new Worker('solver_worker.js');

            window.oracleSolverWorker.onmessage = function (e) {
                const { type, data } = e.data;
                if (type === 'result') {
                    callback(data.path || []);
                    window.oracleSolverWorker.terminate();
                    window.oracleSolverWorker = null;
                }
            };

            window.oracleSolverWorker.onerror = function (error) {
                console.error("Oracle Solver Worker Error:", error);
                callback([]);
                window.oracleSolverWorker.terminate();
                window.oracleSolverWorker = null;
            };
        }

        const MAX_STEPS = 25;
        const MAX_DEPTH_LIMIT = 25;
        const MAX_ITERATIONS = 5_000_000;

        window.oracleSolverWorker.postMessage({
            type: 'start',
            data: {
                initialGrid: [...gauntlet.currentGrid],
                targetCorners: { ...gauntlet.currentTargets },
                MAX_STEPS,
                MAX_DEPTH_LIMIT,
                MAX_ITERATIONS
            }
        });
    }
}

class LeewayAbility extends Ability {
    constructor() {
        super('leeway', 'Leeway', 'On the final puzzle, your first wrong move is forgiven and undone (has a 12-move cooldown).', 'passive_final', 'epic');
        this.icon = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>';
        this.lastUse = -Infinity;
    }

    onMove(gauntlet) {
        if (gauntlet.currentPuzzle === 5) { // Final puzzle only
            const cooldownLeft = (this.lastUse + 11) - gauntlet.moveCount;

            if (gauntlet.moveCount > this.lastUse + 10) { // Cooldown check
                const solutionPath = gauntlet.puzzles[gauntlet.currentPuzzle - 1]?.solutionPath;
                if (solutionPath && solutionPath.length > 0) {
                    const correctNextIndex = solutionPath[0].index;
                    if (gauntlet.moveHistory.length > 0 && window.lastClickedIndex !== correctNextIndex) {
                        this.lastUse = gauntlet.moveCount;
                        gauntlet.currentGrid = gauntlet.moveHistory.pop();
                        gauntlet.moveCount--;

                        const gridCells = document.querySelectorAll('#gauntlet-grid .cell');
                        gridCells.forEach((cell, i) => {
                            cell.style.transition = 'background-color 1.2s ease';
                            cell.style.backgroundColor = colors[gauntlet.currentGrid[i]]?.hex || colors.gray.hex;
                        });

                        setTimeout(() => {
                            gridCells.forEach((cell, i) => {
                                cell.style.transition = '';
                            });
                        }, 1200);

                        showNotification("Leeway activated: Move reverted!", "error");
                    }
                }
            }

            return {
                updateCounter: true,
                counterValue: this.getCounterValue(gauntlet),
                showCounter: this.shouldShowCounter(gauntlet)
            };
        }

        return { updateCounter: false };
    }

    getCounterValue(gauntlet) {
        return Math.max(0, (this.lastUse + 12) - gauntlet.moveCount);
    }

    shouldShowCounter(gauntlet) {
        const cooldownLeft = this.getCounterValue(gauntlet);
        return this.lastUse > -Infinity && cooldownLeft > 0;
    }
}

class HeadstartAbility extends Ability {
    constructor() {
        super('headstart', 'Headstart', 'Subsequent puzzles will have a solution that is 1 step shorter.', 'passive', 'rare');
        this.icon = '<path fill="#fff" d="M3 18q-.425 0-.712-.288T2 17V7q0-.425.288-.712T3 6t.713.288T4 7v10q0 .425-.288.713T3 18m15.175-5H7q-.425 0-.712-.288T6 12t.288-.712T7 11h11.175L15.3 8.1q-.275-.275-.288-.687T15.3 6.7q.275-.275.7-.275t.7.275l4.6 4.6q.15.15.213.325t.062.375t-.062.375t-.213.325l-4.6 4.6q-.275.275-.687.275T15.3 17.3q-.3-.3-.3-.712t.3-.713z"/>';
    }
}

class ChronomancerAbility extends Ability {
    constructor() {
        super('chronomancer', 'Chronomancer', 'Immediately gain +1 to your maximum number of available resets.', 'immediate', 'common');
        this.icon = '<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>';
    }

    activate(gauntlet) {
        gauntlet.resetsRemaining++;
        return true;
    }
}

class PrecisionAbility extends Ability {
    constructor() {
        super('precision', 'Precision', 'If you solve a puzzle in the minimum possible moves, gain an extra reset.', 'passive', 'uncommon');
        this.icon = '<path d="M12 2L13.09 8.26L22 9L17 14L18.18 22L12 19.27L5.82 22L7 14L2 9L10.91 8.26L12 2Z"/>';
    }

    onPuzzleComplete(gauntlet) {
        const currentPuzzle = gauntlet.puzzles[gauntlet.currentPuzzle - 1];
        if (currentPuzzle && gauntlet.moveCount === currentPuzzle.minSteps) {
            gauntlet.resetsRemaining++;
            showNotification("Precision! Solved in minimum moves - gained an extra reset!", "success");
        }
    }
}

class GuardianAngelAbility extends Ability {
    constructor() {
        super('guardian_angel', 'Guardian Angel', 'When you make a wrong move, 10% chance it gets automatically undone.', 'passive', 'legendary');
        this.icon = '<path d="M11 2v2.07A8 8 0 0 0 4.07 11H2v2h2.07A8 8 0 0 0 11 19.93V22h2v-2.07A8 8 0 0 0 19.93 13H22v-2h-2.07A8 8 0 0 0 13 4.07V2m-2 4.08V8h2V6.09c2.5.41 4.5 2.41 4.92 4.91H16v2h1.91c-.41 2.5-2.41 4.5-4.91 4.92V16h-2v1.91C8.5 17.5 6.5 15.5 6.08 13H8v-2H6.09C6.5 8.5 8.5 6.5 11 6.08M12 11a1 1 0 0 0-1 1a1 1 0 0 0 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1"/>';
    }

    onWrongMove(gauntlet) {
        if (Math.random() < 0.1) {
            if (gauntlet.moveHistory.length > 0) {
                gauntlet.currentGrid = gauntlet.moveHistory.pop();
                gauntlet.moveCount--;

                const gridCells = document.querySelectorAll('#gauntlet-grid .cell');
                gridCells.forEach((cell, i) => {
                    cell.style.backgroundColor = colors[gauntlet.currentGrid[i]]?.hex || colors.gray.hex;
                });

                showNotification("Guardian Angel protected you! Move undone automatically.", "success");
                return true;
            }
        }
        return false;
    }
}

class CheckpointAbility extends Ability {
    constructor() {
        super('checkpoint', 'Checkpoint', 'Save your current puzzle state and reload it once per puzzle.', 'active', 'legendary');
        this.icon = '<path d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h11.175q.4 0 .763.15t.637.425l2.85 2.85q.275.275.425.638t.15.762V19q0 .825-.587 1.413T19 21zM19 7.85L16.15 5H5v14h14zM12 18q1.25 0 2.125-.875T15 15t-.875-2.125T12 12t-2.125.875T9 15t.875 2.125T12 18m-5-8h7q.425 0 .713-.288T15 9V7q0-.425-.288-.712T14 6H7q-.425 0-.712.288T6 7v2q0 .425.288.713T7 10M5 7.85V19V5z"/>';
        this.hasSavedState = false;
        this.savedGrid = null;
        this.savedMoveCount = 0;
        this.savedMoveHistory = [];
    }

    canUse(gauntlet) {
        return !this.used && this.type === 'active';
    }

    activate(gauntlet) {
        if (!this.hasSavedState) {
            this.savedGrid = [...gauntlet.currentGrid];
            this.savedMoveCount = gauntlet.moveCount;
            this.savedMoveHistory = gauntlet.moveHistory.map(state => [...state]);
            this.hasSavedState = true;

            showNotification("Checkpoint saved! Use again to restore.", "info");

            const button = document.getElementById('ability-btn-checkpoint');
            if (button) {
                button.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                button.querySelector('svg').style.fill = '#fff';
            }

            return { success: true, shouldMarkUsed: false };
        } else {
            gauntlet.currentGrid = [...this.savedGrid];
            gauntlet.moveCount = this.savedMoveCount;
            gauntlet.moveHistory = this.savedMoveHistory.map(state => [...state]);

            const gridCells = document.querySelectorAll('#gauntlet-grid .cell');
            gridCells.forEach((cell, i) => {
                cell.style.backgroundColor = colors[gauntlet.currentGrid[i]]?.hex || colors.gray.hex;
            });

            showNotification("Checkpoint restored!", "success");
            return { success: true, shouldMarkUsed: true };
        }
    }

    onPuzzleStart(gauntlet) {
        this.hasSavedState = false;
        this.savedGrid = null;
        this.savedMoveCount = 0;
        this.savedMoveHistory = [];
    }

    reset() {
        super.reset();
        this.hasSavedState = false;
        this.savedGrid = null;
        this.savedMoveCount = 0;
        this.savedMoveHistory = [];
    }
}

class FlowStateAbility extends Ability {
    constructor() {
        super('flow_state', 'Flow State', 'When you solve a puzzle quickly (under minimum + 2 moves), gain +1 reset for the next puzzle.', 'passive', 'uncommon');
        this.icon = '<path d="M10.45 15.5q.6.6 1.55.588t1.4-.688L19 7l-8.4 5.6q-.675.45-.712 1.375t.562 1.525M12 4q1.475 0 2.838.412T17.4 5.65l-1.9 1.2q-.825-.425-1.712-.637T12 6Q8.675 6 6.337 8.338T4 14q0 1.05.288 2.075T5.1 18h13.8q.575-.95.838-1.975T20 13.9q0-.9-.213-1.75t-.637-1.65l1.2-1.9q.75 1.175 1.188 2.5T22 13.85t-.325 2.725t-1.025 2.475q-.275.45-.75.7t-1 .25H5.1q-.525 0-1-.25t-.75-.7q-.65-1.125-1-2.387T2 14q0-2.075.788-3.887t2.15-3.175t3.187-2.15T12 4m.175 7.825"/>';
    }

    onPuzzleComplete(gauntlet) {
        const currentPuzzle = gauntlet.puzzles[gauntlet.currentPuzzle - 1];
        if (currentPuzzle) {
            const fastThreshold = currentPuzzle.minSteps + 2;
            if (gauntlet.moveCount <= fastThreshold) {
                gauntlet.resetsRemaining++;
                showNotification(`Flow State! Solved quickly (${gauntlet.moveCount}≤${fastThreshold}) - gained an extra reset!`, "success");
            }
        }
    }
}

class EchoAbility extends Ability {
    constructor() {
        super('echo', 'Echo', '30% chance that using active abilities doesn\'t consume the use.', 'passive', 'legendary');
        this.icon = '<path d="M20.5 9.25a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0v-4a.75.75 0 0 1 .75-.75m-4-4a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75m-4.5-3a.75.75 0 0 1 .75.75v18a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75m-4.5 3a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75m-4 4a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0v-4a.75.75 0 0 1 .75-.75"/>';
    }

    onAbilityUsed(gauntlet, abilityId) {
        if (Math.random() < 0.3) {
            const ability = gauntlet.abilityInstances.find(a => a.id === abilityId);
            if (ability && ability.type === 'active' && ability.used) {
                ability.used = false;

                const abilityBtn = document.getElementById(`ability-btn-${abilityId}`);
                if (abilityBtn) {
                    abilityBtn.disabled = false;
                }

                showNotification(`Echo! ${ability.name} use was preserved.`, "success");
                return true;
            }
        }
        return false;
    }
}

// Ability factory to create instances
const AbilityFactory = {
    create(id) {
        switch (id) {
            case 'undo': return new UndoAbility();
            case 'insight': return new InsightAbility();
            case 'guidance': return new GuidanceAbility();
            case 'clarity': return new ClarityAbility();
            case 'oracle': return new OracleAbility();
            case 'leeway': return new LeewayAbility();
            case 'headstart': return new HeadstartAbility();
            case 'chronomancer': return new ChronomancerAbility();
            case 'precision': return new PrecisionAbility();
            case 'guardian_angel': return new GuardianAngelAbility();
            case 'checkpoint': return new CheckpointAbility();
            case 'flow_state': return new FlowStateAbility();
            case 'echo': return new EchoAbility();
            default:
                throw new Error(`Unknown ability: ${id}`);
        }
    },

    getAll() {
        return [
            'undo', 'insight', 'guidance', 'clarity',
            'oracle', 'leeway', 'headstart', 'chronomancer',
            'precision', 'guardian_angel', 'checkpoint', 'flow_state', 'echo'
        ].map(id => this.create(id));
    }
};