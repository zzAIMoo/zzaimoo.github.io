console.log("Constellation Calculator script loaded.");

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
        const response = await fetch('star_schedule.txt');
        if (!response.ok) {
            console.error('Failed to load star_schedule.txt:', response.statusText);
            alert('Error: Could not load the constellation schedule file. Please try refreshing.');
            return;
        }
        const text = await response.text();
        starScheduleData = text.trim().split('\n').map(line => {
            return line.trim().split(',').map(s => s.trim()).filter(s => s !== '').map(Number);
        });
        starScheduleReady = true;
        console.log("star_schedule.txt loaded and parsed.");
    } catch (error) {
        console.error('Error fetching or parsing star_schedule.txt:', error);
        alert('Error: Could not process the constellation schedule data. Please check the console for details.');
    }
}

const FULL_SPIRAL_TEXT = BASE_CONSTELLATION_EFFECTS["Spiral of Stars"];
const SPIRAL_WORDS = FULL_SPIRAL_TEXT.split(/\s+/);

document.addEventListener('DOMContentLoaded', async () => {
    await loadStarSchedule();

    const starNumberInput = document.getElementById('starNumberInput');
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
        const star = parseInt(starNumberInput.value);
        if (isNaN(star) || star < 1 || star > 1000) {
            alert("Please enter a valid star number (1-1000). For stars 201-1000, constellations are randomly chosen from a pool derived from stars 197-200.");
            return;
        }
        displayConstellationsForStar(star);
    });

    starNumberInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            findConstellationsBtn.click();
        }
    });

    animateCardsOnLoad();
});

function animateCardsOnLoad() {
    const cards = document.querySelectorAll('.card.animate-on-load');
    cards.forEach((card, index) => {
        if (!card.classList.contains('is-visible')) {
            setTimeout(() => {
                card.classList.add('is-visible');
            }, index * 150);
        }
    });
}

function getActualConstellationsForStar(star) {
    if (!starScheduleReady) {
        return {
            activeConstellations: [],
            dailyNote: "Constellation schedule data is not yet loaded. Please wait or refresh."
        };
    }

    if (isNaN(star) || star < 1 || star > 200) {
        console.warn(`Invalid star number ${star} passed to getActualConstellationsForStar`);
        return {
            activeConstellations: [],
            dailyNote: "Internal error: Invalid star number for detailed lookup."
        };
    }

    if (starScheduleData.length === 0) {
        console.error("Star schedule data is empty. This can happen if star_schedule.txt is empty or failed to load correctly.");
        return {
            activeConstellations: [],
            dailyNote: "Error: Constellation schedule data is missing or empty. Please try refreshing."
        };
    }

    const effectiveStarIndex = (star - 1) % starScheduleData.length;
    const baseConstellationIds = starScheduleData[effectiveStarIndex] || [];

    let currentConstellationIds = new Set(baseConstellationIds.map(id => Number(id)));

    let activeConstellationNames = Array.from(currentConstellationIds)
        .map(id => CONSTELLATION_ID_MAP[id])
        .filter(name => name !== undefined);

    let dailyNote = "";

    let dynamicSpiralEffect = null;
    if (activeConstellationNames.includes("Spiral of Stars")) {
        const starsIntoSpiral = star - 100;

        if (starsIntoSpiral >= 0) {
            const prefixLength = 8;
            const numSuffixWordsToShow = starsIntoSpiral;
            const numWordsToDisplay = Math.min(prefixLength + numSuffixWordsToShow, SPIRAL_WORDS.length);
            dynamicSpiralEffect = SPIRAL_WORDS.slice(0, numWordsToDisplay).join(' ');
            if (numWordsToDisplay < SPIRAL_WORDS.length) {
                dynamicSpiralEffect += "...";
            }
        } else {
            dynamicSpiralEffect = BASE_CONSTELLATION_EFFECTS["Spiral of Stars"];
        }
    }

    let activeConstellationsDetailed = activeConstellationNames.map(name => {
        let effect = BASE_CONSTELLATION_EFFECTS[name];
        if (name === "Spiral of Stars" && dynamicSpiralEffect !== null) {
            effect = dynamicSpiralEffect;
        }

        if (effect === undefined) {
            console.warn(`Effect details for constellation ID resulting in name "${name}" are not specified.`);
            effect = `Effect details for "${name}" are not specified`;
        }

        return { name: name, effect: effect };
    }).filter(c => c.name);

    const spiralIndex = activeConstellationsDetailed.findIndex(c => c.name === "Spiral of Stars");
    if (spiralIndex > 0) {
        const spiralConstellation = activeConstellationsDetailed.splice(spiralIndex, 1)[0];
        activeConstellationsDetailed.unshift(spiralConstellation);
    }

    return { activeConstellations: activeConstellationsDetailed, dailyNote: dailyNote };
}

function getConstellationInfoForStar(star) {
    if (star >= 1 && star <= 200) {
        return { isPool: false, ...getActualConstellationsForStar(star) };
    } else if (star > 200 && star <= 1000) {
        const sourceStars = [197, 198, 199, 200];
        const sourceStarConstellations = [];

        for (const sourceStar of sourceStars) {
            const { activeConstellations: constellationsFromSource } = getActualConstellationsForStar(sourceStar);
            const filteredConstellations = constellationsFromSource.filter(
                constellation => constellation.name !== "Spiral of Stars"
            );
            sourceStarConstellations.push({
                starNumber: sourceStar,
                constellations: filteredConstellations
            });
        }

        const dailyNote = "For stars 201-1000, the game randomly applies the full set of active constellations from one of the following base Stars (197, 198, 199, or 200). 'Spiral of Stars' is excluded from the lists below if it would have been active.";
        return {
            isPool: true,
            sourceStarConstellations: sourceStarConstellations,
            dailyNote: dailyNote
        };
    } else {
        return {
            isPool: false,
            activeConstellations: [],
            dailyNote: "Please enter a valid star number (1-1000)."
        };
    }
}

function displayConstellationsForStar(star) {
    const resultData = getConstellationInfoForStar(star);
    const { activeConstellations, dailyNote, isPool, sourceStarConstellations } = resultData;

    const resultsContainer = document.getElementById('constellationResultsContainer');
    const resultsTitle = document.getElementById('resultsTitle');
    const dailyNoteDisplay = document.getElementById('dailyNoteDisplay');
    const dailyNoteText = dailyNoteDisplay.querySelector('p');
    const constellationCardsList = document.getElementById('constellationCardsList');

    const existingCardsAndHeadings = constellationCardsList.querySelectorAll('.card.animate-on-load, .pool-source-star-heading');
    existingCardsAndHeadings.forEach(el => el.classList.remove('is-visible'));
    if (dailyNoteDisplay.classList.contains('animate-on-load')) {
        dailyNoteDisplay.classList.remove('is-visible');
    }

    setTimeout(() => {
        constellationCardsList.innerHTML = '';
        dailyNoteDisplay.style.display = 'none';
        dailyNoteText.textContent = '';
        resultsContainer.style.display = 'block';

        if (star > 200 && star <= 1000 && isPool) {
            resultsTitle.textContent = `Possible Constellation Sets for Star ${star}`;
        } else {
            resultsTitle.innerHTML = `Constellations for <span class="star-number">Star ${star}</span>`;
        }

        if (dailyNote) {
            dailyNoteText.textContent = dailyNote;
            dailyNoteDisplay.style.display = 'block';
            if (!dailyNoteDisplay.classList.contains('animate-on-load')) {
                dailyNoteDisplay.classList.add('animate-on-load');
            }
        }

        if (isPool && sourceStarConstellations) {
            sourceStarConstellations.forEach((source, index) => {
                const heading = document.createElement('h4');
                heading.className = 'pool-source-star-heading card animate-on-load';
                heading.textContent = `Option ${index + 1}: Simulating Star ${source.starNumber}`;
                constellationCardsList.appendChild(heading);

                if (source.constellations.length === 0) {
                    const noDataCard = document.createElement('div');
                    noDataCard.className = 'card animate-on-load';
                    noDataCard.innerHTML = '<p style="text-align:center;">No other constellations active for this option (excluding Spiral of Stars).</p>';
                    constellationCardsList.appendChild(noDataCard);
                } else {
                    source.constellations.forEach(constellation => {
                        const card = document.createElement('div');
                        card.className = 'card constellation-card animate-on-load';
                        if (constellation.name === "Spiral of Stars") {
                            card.classList.add("constellation-card-spiral");
                        }

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
            });
        } else if (activeConstellations && activeConstellations.length > 0) {
            activeConstellations.forEach(constellation => {
                const card = document.createElement('div');
                card.className = 'card constellation-card animate-on-load';
                if (constellation.name === "Spiral of Stars") {
                    card.classList.add("constellation-card-spiral");
                }

                const title = document.createElement('h3');
                title.className = 'card-title';
                title.textContent = constellation.name;

                const effect = document.createElement('p');
                effect.textContent = constellation.effect;

                card.appendChild(title);
                card.appendChild(effect);
                constellationCardsList.appendChild(card);
            });
        } else {
            if (!isPool || !dailyNote) {
                const noDataCard = document.createElement('div');
                noDataCard.className = 'card animate-on-load';
                if (dailyNote && dailyNoteDisplay.style.display === 'none') {
                    noDataCard.innerHTML = `<p style="text-align:center;">${dailyNote}</p>`;
                } else if (!dailyNote) {
                    noDataCard.innerHTML = '<p style="text-align:center;">No specific constellations are active for this star.</p>';
                }
                if (noDataCard.innerHTML.trim() !== '') {
                    constellationCardsList.appendChild(noDataCard);
                }
            }
        }
        animateCardsOnLoad();
    }, 50);
}