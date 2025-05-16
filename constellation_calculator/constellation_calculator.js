console.log("Constellation Calculator script loaded.");

// Data Definitions

const BASE_CONSTELLATION_EFFECTS = {
    "North Star": "+1 Gold Coin",
    "The Twins": "Two Trunks in Entrance",
    "The Slice": "+3 Steps",
    "Diamondus Minor": "+1 Gem",
    "The Southern Cross": "4-Door Rooms Appear More Frequently",
    "Farmer\'s Apple": "Apples Give +5 Steps",
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

const DAILY_RULES_BASE_CYCLE = [
    { constellations: ["North Star"], notes: "" },
    { constellations: ["The Twins"], notes: "" },
    { constellations: ["The Slice"], notes: "" },
    { constellations: ["Diamondus Minor"], notes: "" },
    { constellations: ["The Southern Cross"], notes: "" },
    { constellations: ["The Twins", "Diamondus Minor"], notes: "" },
    { constellations: ["Farmer\'s Apple"], notes: "Apples Give +5 Steps" },
    { constellations: ["Clavis the Key"], notes: "" },
    { constellations: ["Diamondus Minor", "The Southern Cross"], notes: "" },
    { constellations: ["The Slice", "Farmer\'s Apple"], notes: "" },
    { constellations: ["Diamondus Major"], notes: "" },
    { constellations: ["Draxus the Dead"], notes: "" },
    { constellations: ["The Southern Cross", "Clavis the Key"], notes: "" },
    { constellations: ["The Slice", "Diamondus Minor", "Farmer\'s Apple"], notes: "" },
    { constellations: ["The Sail"], notes: "" },
    { constellations: ["The Southern Cross", "Diamondus Major"], notes: "" },
    { constellations: ["The Twins", "Farmer\'s Apple", "Clavis the Key"], notes: "" },
    { constellations: ["The Slice", "The Sail"], notes: "" },
    { constellations: ["Clavis the Key", "Diamondus Major"], notes: "" },
    { constellations: ["Florealis"], notes: "" },
    { constellations: ["The Slice", "Farmer\'s Apple", "Diamondus Major"], notes: "" },
    { constellations: ["The Twins", "Clavis the Key", "Draxus the Dead"], notes: "" },
    { constellations: ["Clavis the Key", "The Sail"], notes: "" },
    { constellations: ["Diamondus Minor", "Florealis"], notes: "" },
    { constellations: ["The Twins", "The Slice", "The Southern Cross", "Farmer\'s Apple", "Clavis the Key"], notes: "" },
    { constellations: ["Diamondus Major", "Clavis the Key", "Farmer\'s Apple"], notes: "Apples Give +5 Steps" },
    { constellations: ["The Sail", "Draxus the Dead"], notes: "Dead-End Rooms Appear More Frequently and Shops 50% off" },
    { constellations: ["Florealis", "Clavis the Key"], notes: "" },
    { constellations: ["Diamondus Minor", "Diamondus Major", "The Twins", "Farmer\'s Apple", "The Southern Cross"], notes: "" },
    { constellations: ["The Sail", "Farmer\'s Apple", "Clavis the Key"], notes: "Shops 50% off, apples give 5 steps" },
    { constellations: ["Florealis", "Diamondus Major"], notes: "" },
    { constellations: ["The Sail", "Draxus the Dead", "The Southern Cross"], notes: "Shops 50% off, dead end rooms more common, rooms with 4 doors more common" },
    { constellations: ["The Twins", "The Southern Cross", "Clavis the Key", "Farmer\'s Apple", "Diamondus Major"], notes: "Two trunks in entrance, 4 door rooms more common, apples give 5 steps" },
    { constellations: ["The Slice", "Diamondus Minor", "Farmer\'s Apple", "Florealis"], notes: "Apples give 5 steps, special flowers in green rooms" },
    { constellations: ["Florealis", "The Sail"], notes: "" },
    { constellations: ["Diamondus Major", "The Southern Cross", "The Slice", "Clavis the Key", "Farmer\'s Apple", "The Twins"], notes: "" },
    { constellations: ["The Slice", "The Twins", "Florealis", "Draxus the Dead"], notes: "" },
    { constellations: ["Clavis the Key", "Diamondus Major", "The Sail", "Diamondus Minor"], notes: "" },
    { constellations: ["Clavis the Key", "Farmer\'s Apple", "Florealis", "Diamondus Minor"], notes: "" },
    { constellations: ["The Twins", "The Slice", "Diamondus Minor", "The Southern Cross", "Farmer\'s Apple", "Clavis the Key", "Diamondus Major"], notes: "" },
    { constellations: ["Diamondus Major", "Farmer\'s Apple", "Florealis", "The Slice"], notes: "" },
    { constellations: ["Draxus the Dead", "Clavis the Key", "The Sail", "Farmer\'s Apple"], notes: "" },
    { constellations: ["Clavis the Key", "Florealis", "The Sail"], notes: "" },
    { constellations: ["Clavis the Key", "Florealis", "Diamondus Minor", "The Slice", "Farmer\'s Apple", "The Twins"], notes: "" },
    { constellations: ["The Twins", "The Southern Cross", "Clavis the Key", "Farmer\'s Apple", "Diamondus Major", "Draxus the Dead"], notes: "" },
    { constellations: ["The Southern Cross", "Farmer\'s Apple", "Clavis the Key", "Diamondus Major", "The Sail"], notes: "" },
    { constellations: ["Florealis", "Draxus the Dead", "The Sail"], notes: "" },
    { constellations: ["Diamondus Major", "The Sail", "Farmer\'s Apple", "Diamondus Minor", "The Slice", "Clavis the Key"], notes: "" },
    { constellations: ["The Twins", "The Slice", "Diamondus Major", "The Southern Cross", "Farmer\'s Apple", "Clavis the Key", "Florealis"], notes: "" }
];

const FULL_SPIRAL_TEXT = BASE_CONSTELLATION_EFFECTS["Spiral of Stars"];
const SPIRAL_WORDS = FULL_SPIRAL_TEXT.split(/\s+/);

document.addEventListener('DOMContentLoaded', () => {
    const dayNumberInput = document.getElementById('dayNumberInput');
    const findConstellationsBtn = document.getElementById('findConstellationsBtn');
    const resultsContainer = document.getElementById('constellationResultsContainer');
    const resultsTitle = document.getElementById('resultsTitle');
    const dailyNoteDisplay = document.getElementById('dailyNoteDisplay');
    const dailyNoteText = dailyNoteDisplay.querySelector('p');
    const constellationCardsList = document.getElementById('constellationCardsList');

    findConstellationsBtn.addEventListener('click', () => {
        const day = parseInt(dayNumberInput.value);
        if (isNaN(day) || day < 1) {
            alert("Please enter a valid day number (1 or greater).");
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
    let activeConstellationNames = [];
    let dailyNote = "";
    let cycleDayIndex = (day - 1) % 50;

    if (cycleDayIndex < DAILY_RULES_BASE_CYCLE.length) {
        const baseRule = DAILY_RULES_BASE_CYCLE[cycleDayIndex];
        if (baseRule) {
            activeConstellationNames = [...baseRule.constellations];
            dailyNote = baseRule.notes || "";
        }
    }

    if (day === 50) {
        activeConstellationNames = ["Ink Well"];
        dailyNote = BASE_CONSTELLATION_EFFECTS["Ink Well"] ? "" : "Effect for Ink Well to be confirmed.";
    } else if (day >= 51 && day <= 99) {
        if (!activeConstellationNames.includes("Ink Well")) {
            activeConstellationNames.push("Ink Well");
        }
    } else if (day === 100) {
        activeConstellationNames = ["Spiral of Stars"];
        dailyNote = "";
    } else if (day >= 101 && day <= 149) {
        if (!activeConstellationNames.includes("Spiral of Stars")) {
            activeConstellationNames.push("Spiral of Stars");
        }
    } else if (day >= 150 && day <= 199) {
        if (!activeConstellationNames.includes("Ink Well")) {
            activeConstellationNames.push("Ink Well");
        }
        if (!activeConstellationNames.includes("Spiral of Stars")) {
            activeConstellationNames.push("Spiral of Stars");
        }
    } else if (day > 199) {
        return {
            activeConstellations: [],
            dailyNote: "Constellation data beyond day 199 is not yet implemented since it's random (or the pattern hasn't been found yet). Waiting for another way to obtain it"
        };
    }

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
        let normalizedName = name;
        if (name === "Clavis") normalizedName = "Clavis the Key";
        if (name === "Diamond Major") normalizedName = "Diamondus Major";

        let effect = BASE_CONSTELLATION_EFFECTS[normalizedName];
        if (name === "Spiral of Stars" && dynamicSpiralEffect !== null) {
            effect = dynamicSpiralEffect;
        }

        if (effect === undefined) {
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

    if (activeConstellations.length === 0 && !dailyNote) {
        resultsTitle.textContent = `No Special Constellations or Notes for Day ${day}`;
        const noDataCard = document.createElement('div');
        noDataCard.className = 'card';
        noDataCard.innerHTML = '<p style="text-align:center;">No specific constellations appear to be active for this day based on current rules.</p>';
        constellationCardsList.appendChild(noDataCard);
    } else {
        resultsTitle.textContent = `Constellations & Notes for Day ${day}`;

        if (dailyNote) {
            dailyNoteText.textContent = dailyNote;
            dailyNoteDisplay.style.display = 'block';
        }

        if (activeConstellations.length > 0) {
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
        } else if (!dailyNote) {
            const noDataCard = document.createElement('div');
            noDataCard.className = 'card';
            noDataCard.innerHTML = '<p style="text-align:center;">No specific constellations are active for this day.</p>';
            constellationCardsList.appendChild(noDataCard);
        }
    }
}