const NEIGHBOR_MAP = {
    0: [1, 3],        // Top Left
    1: [0, 2, 4],     // Top
    2: [1, 5],        // Top Right
    3: [0, 4, 6],     // Left
    4: [1, 3, 5, 7],  // Center
    5: [2, 4, 8],     // Right
    6: [3, 7],        // Bottom Left
    7: [4, 6, 8],     // Bottom
    8: [5, 7]         // Bottom Right
};

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
            break;
        case 'blue':
            const middleIndex = 4;
            const middleColorAction = newState[middleIndex];

            switch (middleColorAction) {
                case 'gray':
                    break;
                case 'black':
                    const activeBlueRow_b = row;
                    const originalBlueCol_b = col;
                    const rowOriginalColors_b = [];
                    for (let c_idx = 0; c_idx < cols; c_idx++) {
                        rowOriginalColors_b.push(newState[activeBlueRow_b * cols + c_idx]);
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
                            newState[currentIndexInRow_b] = 'blue';
                        } else {
                            newState[currentIndexInRow_b] = rowShiftedColors_b[c_idx];
                        }
                    }
                    break;
                case 'red':
                    for (let i = 0; i < newState.length; i++) {
                        if (i === index) continue;
                        if (newState[i] === 'white') newState[i] = 'black';
                        else if (newState[i] === 'black') newState[i] = 'red';
                    }
                    break;
                case 'green':
                    const oppositeRow_g = rows - 1 - row;
                    const oppositeCol_g = cols - 1 - col;
                    const oppositeIndex_g = oppositeRow_g * cols + oppositeCol_g;
                    if (index !== oppositeIndex_g) {
                        const colorAtOpposite_g = newState[oppositeIndex_g];
                        newState[oppositeIndex_g] = 'blue';
                        newState[index] = colorAtOpposite_g;
                    }
                    break;
                case 'yellow':
                    if (row > 0) {
                        const upIndex_y = (row - 1) * cols + col;
                        const colorAbove_y = newState[upIndex_y];
                        newState[upIndex_y] = 'blue';
                        newState[index] = colorAbove_y;
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
                        const lastColorInRotation_pi = newState[indicesToRotate_pi[indicesToRotate_pi.length - 1]];
                        for (let i = indicesToRotate_pi.length - 1; i > 0; i--) {
                            newState[indicesToRotate_pi[i]] = newState[indicesToRotate_pi[i - 1]];
                        }
                        if (indicesToRotate_pi.length > 0) {
                            newState[indicesToRotate_pi[0]] = lastColorInRotation_pi;
                        }
                    }
                    break;
                case 'purple':
                    if (row < rows - 1) {
                        const downIndex_pu = (row + 1) * cols + col;
                        const colorBelow_pu = newState[downIndex_pu];
                        newState[downIndex_pu] = 'blue';
                        newState[index] = colorBelow_pu;
                    }
                    break;
                case 'orange':
                    const adjacent_o = [];
                    if (row > 0) adjacent_o.push(newState[(row - 1) * cols + col]);
                    if (col < cols - 1) adjacent_o.push(newState[row * cols + (col + 1)]);
                    if (row < rows - 1) adjacent_o.push(newState[(row + 1) * cols + col]);
                    if (col > 0) adjacent_o.push(newState[row * cols + (col - 1)]);
                    if (adjacent_o.length > 0) {
                        const colorCounts_o = {};
                        adjacent_o.forEach(adjColor => { colorCounts_o[adjColor] = (colorCounts_o[adjColor] || 0) + 1; });
                        let majorityColor_o = newState[index];
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
                            newState[index] = majorityColor_o;
                        }
                    }
                    break;
                case 'white':
                    const blueNeighborIndices = NEIGHBOR_MAP[index];
                    for (const neighborIdx of blueNeighborIndices) {
                        const neighborColor = newState[neighborIdx];
                        if (neighborColor === 'gray') {
                            newState[neighborIdx] = 'blue';
                        } else if (neighborColor === 'blue') {
                            newState[neighborIdx] = 'gray';
                        }
                    }
                    newState[index] = 'gray';
                    break;
                case 'blue':
                    break;
            }
            break;
    }
    return newState;
}