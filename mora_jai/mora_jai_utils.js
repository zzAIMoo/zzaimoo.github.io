const GRID_SIZE = 3;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

const NEIGHBOR_MAP = {
    0: [1, 3],
    1: [0, 2, 4],
    2: [1, 5],
    3: [0, 4, 6],
    4: [1, 3, 5, 7],
    5: [2, 4, 8],
    6: [3, 7],
    7: [4, 6, 8],
    8: [5, 7]
};

function performAction(state, index) {
    const color = state[index];
    let newState = [...state];
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;

    switch (color) {
        case 'gray':
            break;
        case 'black':
            performBlackAction(newState, row);
            break;
        case 'red':
            performRedAction(newState);
            break;
        case 'green':
            performGreenAction(newState, index, row, col);
            break;
        case 'yellow':
            performYellowAction(newState, index, row, col);
            break;
        case 'pink':
            performPinkAction(newState, index, row, col);
            break;
        case 'purple':
            performPurpleAction(newState, index, row, col);
            break;
        case 'orange':
            performOrangeAction(newState, index, row, col);
            break;
        case 'white':
            performWhiteAction(newState, index);
            break;
        case 'blue':
            performBlueAction(newState, index, row, col);
            break;
    }
    return newState;
}

function performBlackAction(newState, row) {
    const rowStart = GRID_SIZE * row;
    const rowEnd = GRID_SIZE * (row + 1);
    const lastTileInRow = newState[rowEnd - 1];
    for (let i = rowEnd - 1; i > rowStart; i--) {
        newState[i] = newState[i - 1];
    }
    newState[rowStart] = lastTileInRow;
}

function performRedAction(newState) {
    for (let i = 0; i < newState.length; i++) {
        if (newState[i] === 'white') newState[i] = 'black';
        else if (newState[i] === 'black') newState[i] = 'red';
    }
}

function performGreenAction(newState, index, row, col) {
    const oppositeRow = GRID_SIZE - 1 - row;
    const oppositeCol = GRID_SIZE - 1 - col;
    const oppositeIndex = oppositeRow * GRID_SIZE + oppositeCol;
    [newState[index], newState[oppositeIndex]] = [newState[oppositeIndex], newState[index]];
}

function performYellowAction(newState, index, row, col) {
    if (row > 0) {
        const upIndex = (row - 1) * GRID_SIZE + col;
        [newState[index], newState[upIndex]] = [newState[upIndex], newState[index]];
    }
}

function performPinkAction(newState, index, row, col) {
    const surroundingPositions = getSurroundingPositions(row, col);
    if (surroundingPositions.length > 0) {
        const positions = surroundingPositions.map(pos => pos.r * GRID_SIZE + pos.c);
        rotatePositionsClockwise(newState, positions);
    }
}

function performPurpleAction(newState, index, row, col) {
    if (row < GRID_SIZE - 1) {
        const downIndex = (row + 1) * GRID_SIZE + col;
        [newState[index], newState[downIndex]] = [newState[downIndex], newState[index]];
    }
}

function performOrangeAction(newState, index, row, col) {
    const adjacent = getAdjacentColors(newState, row, col);
    if (adjacent.length > 0) {
        const majorityColor = getMajorityColor(adjacent);
        if (majorityColor) {
            newState[index] = majorityColor;
        }
    }
}

function performWhiteAction(newState, index) {
    const neighborIndices = NEIGHBOR_MAP[index];
    for (const neighborIdx of neighborIndices) {
        const neighborColor = newState[neighborIdx];
        if (neighborColor === 'gray') {
            newState[neighborIdx] = 'white';
        } else if (neighborColor === 'white') {
            newState[neighborIdx] = 'gray';
        }
    }
    newState[index] = 'gray';
}

function performBlueAction(newState, index, row, col) {
    const middleIndex = 4;
    const middleColorAction = newState[middleIndex];

    switch (middleColorAction) {
        case 'gray':
            break;
        case 'black':
            performBlueBlackAction(newState, row, col);
            break;
        case 'red':
            performBlueRedAction(newState, index);
            break;
        case 'green':
            performBlueGreenAction(newState, index, row, col);
            break;
        case 'yellow':
            performBlueYellowAction(newState, index, row, col);
            break;
        case 'pink':
            performBluePinkAction(newState, index, row, col);
            break;
        case 'purple':
            performBluePurpleAction(newState, index, row, col);
            break;
        case 'orange':
            performBlueOrangeAction(newState, index, row, col);
            break;
        case 'white':
            performBlueWhiteAction(newState, index, row, col);
            break;
    }
}

function performBlueBlackAction(newState, row, col) {
    const rowOriginalColors = [];
    for (let c = 0; c < GRID_SIZE; c++) {
        rowOriginalColors.push(newState[row * GRID_SIZE + c]);
    }

    const rowShiftedColors = [];
    rowShiftedColors[0] = rowOriginalColors[GRID_SIZE - 1];
    for (let c = 1; c < GRID_SIZE; c++) {
        rowShiftedColors[c] = rowOriginalColors[c - 1];
    }

    const blueTileNewCol = (col + 1) % GRID_SIZE;
    for (let c = 0; c < GRID_SIZE; c++) {
        const currentIndex = row * GRID_SIZE + c;
        newState[currentIndex] = (c === blueTileNewCol) ? 'blue' : rowShiftedColors[c];
    }
}

function performBlueRedAction(newState, index) {
    for (let i = 0; i < newState.length; i++) {
        if (i === index) continue;
        if (newState[i] === 'white') newState[i] = 'black';
        else if (newState[i] === 'black') newState[i] = 'red';
    }
}

function performBlueGreenAction(newState, index, row, col) {
    const oppositeRow = GRID_SIZE - 1 - row;
    const oppositeCol = GRID_SIZE - 1 - col;
    const oppositeIndex = oppositeRow * GRID_SIZE + oppositeCol;
    if (index !== oppositeIndex) {
        const colorAtOpposite = newState[oppositeIndex];
        newState[oppositeIndex] = 'blue';
        newState[index] = colorAtOpposite;
    }
}

function performBlueYellowAction(newState, index, row, col) {
    if (row > 0) {
        const upIndex = (row - 1) * GRID_SIZE + col;
        const colorAbove = newState[upIndex];
        newState[upIndex] = 'blue';
        newState[index] = colorAbove;
    }
}

function performBluePinkAction(newState, index, row, col) {
    const surroundingPositions = getSurroundingPositions(row, col);
    if (surroundingPositions.length > 0) {
        const positions = surroundingPositions.map(pos => pos.r * GRID_SIZE + pos.c);
        rotatePositionsClockwise(newState, positions);
    }
}

function performBluePurpleAction(newState, index, row, col) {
    if (row < GRID_SIZE - 1) {
        const downIndex = (row + 1) * GRID_SIZE + col;
        const colorBelow = newState[downIndex];
        newState[downIndex] = 'blue';
        newState[index] = colorBelow;
    }
}

function performBlueOrangeAction(newState, index, row, col) {
    const adjacent = getAdjacentColors(newState, row, col);
    if (adjacent.length > 0) {
        const majorityColor = getMajorityColor(adjacent);
        if (majorityColor) {
            newState[index] = majorityColor;
        }
    }
}

function performBlueWhiteAction(newState, index, row, col) {
    const middleIndex = 4;
    const middleNeighbors = NEIGHBOR_MAP[middleIndex];
    let shouldExpand = false;

    for (const neighborIdx of middleNeighbors) {
        if (newState[neighborIdx] === 'gray') {
            shouldExpand = true;
            break;
        }
    }

    if (shouldExpand) {
        const blueNeighbors = NEIGHBOR_MAP[index];
        for (const neighborIdx of blueNeighbors) {
            if (newState[neighborIdx] === 'gray') {
                newState[neighborIdx] = 'blue';
            }
        }
        newState[index] = 'gray';
    } else {
        newState[index] = 'gray';
    }
}

function getSurroundingPositions(row, col) {
    const positions = [];
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, 1], [1, 1], [1, 0],
        [1, -1], [0, -1]
    ];

    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
            positions.push({ r: newRow, c: newCol });
        }
    }
    return positions;
}

function rotatePositionsClockwise(newState, positions) {
    if (positions.length === 0) return;

    const lastColor = newState[positions[positions.length - 1]];
    for (let i = positions.length - 1; i > 0; i--) {
        newState[positions[i]] = newState[positions[i - 1]];
    }
    newState[positions[0]] = lastColor;
}

function getAdjacentColors(state, row, col) {
    const adjacent = [];
    const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];

    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
            adjacent.push(state[newRow * GRID_SIZE + newCol]);
        }
    }
    return adjacent;
}

function getMajorityColor(colors) {
    const colorCounts = {};
    for (const color of colors) {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
    }

    let majorityColor = null;
    let maxCount = 0;
    let tie = false;

    for (const [color, count] of Object.entries(colorCounts)) {
        if (count > maxCount) {
            maxCount = count;
            majorityColor = color;
            tie = false;
        } else if (count === maxCount) {
            tie = true;
        }
    }

    return (!tie && majorityColor && maxCount > 0) ? majorityColor : null;
}