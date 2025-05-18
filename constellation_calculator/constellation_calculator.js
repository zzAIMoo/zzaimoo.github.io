console.log("Constellation Calculator script loaded.");

// Data Definitions

const BASE_CONSTELLATION_EFFECTS = {
    "North Star": "+1 Gold Coin",
    "The Twins": "Two Trunks in Entrance",
    "The Slice": "+3 Steps",
    "Diamondus Minor": "+1 Gem",
    "The Southern Cross": "4-Door Rooms Appear More Frequently",
    "Farmer's Apple": "Apples Give +5 Steps",
    "Clavis the Key": "+1 Key",
    "Diamondus Major": "+5 Gems",
    "Draxus the Dead": "Dead-End Rooms Appear More Frequently",
    "The Sail": "Shops 50% Off",
    "Florealis": "Green Rooms Contain Gem Flowers",
    "Ink Well": "Spend Stars to Reroll Room Draft",
    "Spiral of Stars": `Adds a word to Spiral of Stars, then...\n
gain one key and one gem for each rank reached, then lose three steps for each rank reached, then gain one coin for each day spent, and then lose two stars.\n
If you have less than forty steps, gain one random item from the showroom.\n
If you have less than twenty steps, open all antechamber doors, then set your steps to forty. Also, your luck has been increased and you can no longer gain steps or gems or keys or gold and your day will immediately end if you ever attempt to add another word to Spiral of Stars.`
};

const CONSTELLATION_ID_MAP = {
    1: "North Star",
    2: "The Twins",
    3: "The Slice",
    4: "Diamondus Minor",
    5: "The Southern Cross",
    7: "Farmer's Apple",
    8: "Clavis the Key",
    11: "Diamondus Major",
    12: "Draxus the Dead",
    15: "The Sail",
    20: "Florealis",
    50: "Ink Well",
    100: "Spiral of Stars"
};

let starScheduleData = [];
let starScheduleReady = false;

async function loadStarSchedule() {
    try {
        const response = await fetch('StarSchedule.txt');
        if (!response.ok) {
            console.error('Failed to load StarSchedule.txt:', response.statusText);
            alert('Error: Could not load the constellation schedule file. Please try refreshing.');
            return;
        }
        const text = await response.text();
        starScheduleData = text.trim().split('\n').map(line => {
            return line.trim().split(',').map(s => s.trim()).filter(s => s !== '').map(Number);
        });
        starScheduleReady = true;
        console.log("StarSchedule.txt loaded and parsed.");
    } catch (error) {
        console.error('Error fetching or parsing StarSchedule.txt:', error);
        alert('Error: Could not process the constellation schedule data. Please check the console for details.');
    }
}

const FULL_SPIRAL_TEXT = BASE_CONSTELLATION_EFFECTS["Spiral of Stars"];
const SPIRAL_WORDS = FULL_SPIRAL_TEXT.split(/\s+/);

document.addEventListener('DOMContentLoaded', async () => {
    await loadStarSchedule();

    const dayNumberInput = document.getElementById('dayNumberInput');
    const findConstellationsBtn = document.getElementById('findConstellationsBtn');
    const resultsContainer = document.getElementById('constellationResultsContainer');
    const resultsTitle = document.getElementById('resultsTitle');
    const dailyNoteDisplay = document.getElementById('dailyNoteDisplay');
    const dailyNoteText = dailyNoteDisplay.querySelector('p');
    const constellationCardsList = document.getElementById('constellationCardsList');

    findConstellationsBtn.addEventListener('click', () => {
        if (!starScheduleReady) {
            alert("Constellation schedule is not loaded yet. Please wait or try refreshing.");
            return;
        }
        const day = parseInt(dayNumberInput.value);
        if (isNaN(day) || day < 1 || day > starScheduleData.length) {
            alert("Please enter a valid day number (1 or greater) and ensure the schedule is loaded.");
            return;
        }
        displayConstellationsForDay(day);
    });

    dayNumberInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            findConstellationsBtn.click();
        }
    });
});

function getConstellationInfoForDay(day) {
    if (!starScheduleReady) {
        return {
            activeConstellations: [],
            dailyNote: "Constellation schedule data is not yet loaded. Please wait or refresh."
        };
    }

    if (isNaN(day) || day < 1 || day > starScheduleData.length) {
        return {
            activeConstellations: [],
            dailyNote: `Constellation data for day ${day} is not available. Please enter a day between 1 and ${starScheduleData.length}.`
        };
    }

    const constellationIdsOnDay = starScheduleData[day - 1] || [];
    let activeConstellationNames = constellationIdsOnDay
        .map(id => CONSTELLATION_ID_MAP[id])
        .filter(name => name !== undefined);

    let dailyNote = "";

    let dynamicSpiralEffect = null;
    if (activeConstellationNames.includes("Spiral of Stars")) {
        const daysIntoSpiral = day - 100;

        if (daysIntoSpiral >= 0) {
            const prefixLength = 8;
            const numSuffixWordsToShow = daysIntoSpiral;
            const numWordsToDisplay = Math.min(prefixLength + numSuffixWordsToShow, SPIRAL_WORDS.length);
            dynamicSpiralEffect = SPIRAL_WORDS.slice(0, numWordsToDisplay).join(' ');
        } else {
            dynamicSpiralEffect = BASE_CONSTELLATION_EFFECTS["Spiral of Stars"];
        }
    }

    const activeConstellationsDetailed = activeConstellationNames.map(name => {
        let effect = BASE_CONSTELLATION_EFFECTS[name];
        if (name === "Spiral of Stars" && dynamicSpiralEffect !== null) {
            effect = dynamicSpiralEffect;
        }

        if (effect === undefined) {
            console.warn(`Effect details for constellation ID resulting in name "${name}" are not specified.`);
            effect = `Effect details for "${name}" are not specified`;
        }

        return {
            name: name,
            effect: effect
        };
    }).filter(c => c.name);

    return { activeConstellations: activeConstellationsDetailed, dailyNote: dailyNote };
}

function displayConstellationsForDay(day) {
    const { activeConstellations, dailyNote } = getConstellationInfoForDay(day);

    const resultsContainer = document.getElementById('constellationResultsContainer');
    const resultsTitle = document.getElementById('resultsTitle');
    const dailyNoteDisplay = document.getElementById('dailyNoteDisplay');
    const dailyNoteText = dailyNoteDisplay.querySelector('p');
    const constellationCardsList = document.getElementById('constellationCardsList');

    constellationCardsList.innerHTML = '';
    dailyNoteDisplay.style.display = 'none';
    dailyNoteText.textContent = '';
    resultsContainer.style.display = 'block';

    if (activeConstellations.length === 0) {
        resultsTitle.textContent = `Day ${day}`;
        const noDataCard = document.createElement('div');
        noDataCard.className = 'card';
        if (dailyNote) {
            noDataCard.innerHTML = `<p style="text-align:center;">${dailyNote}</p>`;
        } else {
            noDataCard.innerHTML = '<p style="text-align:center;">No specific constellations are active for this day.</p>';
        }
        constellationCardsList.appendChild(noDataCard);
    } else {
        resultsTitle.textContent = `Constellations for Day ${day}`;

        activeConstellations.forEach(constellation => {
            const card = document.createElement('div');
            card.className = 'card constellation-card';

            const title = document.createElement('h3');
            title.className = 'card-title';
            title.textContent = constellation.name;

            const effect = document.createElement('p');
            effect.textContent = constellation.effect;

            card.appendChild(title);
            card.appendChild(effect);
            constellationCardsList.appendChild(card);
        });
    }
}