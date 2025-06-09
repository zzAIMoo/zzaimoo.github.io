if (!window.APP_CONFIG.IS_LOCAL_DEV) {
    console.log = () => { };
    console.warn = () => { };
    console.error = console.error;
}

const GAUNTLET_STATE_KEY = 'moraJaiGauntletState';
const TARGET_CORNER_INDICES = { tl: 0, tr: 2, bl: 6, br: 8 };

const colors = {
    gray: { name: 'Gray', hex: '#aaaaaa' },
    black: { name: 'Black', hex: '#000000' },
    red: { name: 'Red', hex: '#ff0000' },
    green: { name: 'Green', hex: '#00ff00' },
    yellow: { name: 'Yellow', hex: '#ffff00' },
    pink: { name: 'Pink', hex: '#ff69b4' },
    purple: { name: 'Purple', hex: '#800080' },
    orange: { name: 'Orange', hex: '#ffa500' },
    white: { name: 'White', hex: '#ffffff' },
    blue: { name: 'Blue', hex: '#4387d9' }
};

const GAUNTLET_DIFFICULTY = {
    1: { label: 'Gauntlet-1', minSteps: 3, maxSteps: 5 },
    2: { label: 'Gauntlet-2', minSteps: 4, maxSteps: 6 },
    3: { label: 'Gauntlet-3', minSteps: 7, maxSteps: 10 },
    4: { label: 'Gauntlet-4', minSteps: 8, maxSteps: 12 },
    5: { label: 'Gauntlet-5', minSteps: 10, maxSteps: 15 },
    6: { label: 'Gauntlet-6', minSteps: 12, maxSteps: 18 },
    7: { label: 'Gauntlet-7', minSteps: 13, maxSteps: 18 },
    8: { label: 'Gauntlet-8', minSteps: 15, maxSteps: 20 },
};

const GOLD_REWARDS = {
    BASE_MIN: 70,
    BASE_MAX: 180,
    BASE_VARIANCE: 0.15,
    MINIMUM_MOVES_BONUS: 0.35,
    UNDER_PAR_BONUS: 0.15,
    NO_RESETS_BONUS: 0.12,
    BONUS_VARIANCE: 0.25
};

window.abilities = {};
AbilityFactory.getAll().forEach(ability => {
    window.abilities[ability.id] = ability;
});

const UPGRADES_POOL = {
    'insight': { id: 'insight', name: 'Insight', description: 'Once per puzzle, click a tile to see its correct final color.', type: 'active' },
    'guidance': { id: 'guidance', name: 'Guidance', description: 'Once per puzzle, reveals the next correct tile to press.', type: 'active' },
    'undo': { id: 'undo', name: 'Undo', description: 'Let\'s you undo your last move.', type: 'active' },
    'clarity': { id: 'clarity', name: 'Clarity', description: 'Reduces the pool of possible colors for all subsequent puzzles.', type: 'passive' },
    'oracle': { id: 'oracle', name: 'Oracle\'s Glimpse', description: 'Every 5 moves, 3 tiles are highlighted. One of them is a correct next step.', type: 'passive' },
    'leeway': { id: 'leeway', name: 'Leeway', description: 'On the final puzzle, your first wrong move is forgiven and undone (has a 12-move cooldown).', type: 'passive_final' },
    'headstart': { id: 'headstart', name: 'Headstart', description: 'Subsequent puzzles have a chance to require fewer steps to solve.', type: 'passive' },
    'chronomancer': { id: 'chronomancer', name: 'Chronomancer', description: 'Immediately gain +1 to your maximum number of available resets.', type: 'immediate' },
    'precision': { id: 'precision', name: 'Precision', description: 'If you solve a puzzle in the minimum possible moves, gain an extra reset.', type: 'passive' },
    'guardian_angel': { id: 'guardian_angel', name: 'Guardian Angel', description: 'When you make a wrong move, 10% chance it gets automatically undone.', type: 'passive' },
    'checkpoint': { id: 'checkpoint', name: 'Checkpoint', description: 'Save your current puzzle state and reload it once per puzzle.', type: 'active' },
    'flow_state': { id: 'flow_state', name: 'Flow State', description: 'When you solve a puzzle quickly (under minimum + 2 moves), gain +1 reset for the next puzzle.', type: 'passive' },
    'echo': { id: 'echo', name: 'Echo', description: '30% chance that using active abilities doesn\'t consume the use.', type: 'passive' },
};

const SHOP_ITEMS = {
    'extra_reset': {
        id: 'extra_reset',
        name: 'Extra Reset',
        description: 'Immediately gain +1 reset for this gauntlet run.',
        basePrice: 160,
        priceVariance: 0.25,
        type: 'consumable',
        icon: '<path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>'
    },
    'hint_scroll': {
        id: 'hint_scroll',
        name: 'Hint Scroll',
        description: 'Temporarily gain an Insight ability for the next puzzle.',
        basePrice: 180,
        priceVariance: 0.3,
        type: 'consumable',
        icon: '<path d="M21.92 11.6C19.9 6.91 16.1 4 12 4s-7.9 2.91-9.92 7.6a1 1 0 0 0 0 .8C4.1 17.09 7.9 20 12 20s7.9-2.91 9.92-7.6a1 1 0 0 0 0-.8M12 18c-3.17 0-6.17-2.29-7.9-6C5.83 8.29 8.83 6 12 6s6.17 2.29 7.9 6c-1.73 3.71-4.73 6-7.9 6m0-10a4 4 0 1 0 4 4a4 4 0 0 0-4-4m0 6a2 2 0 1 1 2-2a2 2 0 0 1-2 2"/>'
    },
    'guidance_scroll': {
        id: 'guidance_scroll',
        name: 'Guidance Scroll',
        description: 'Temporarily gain a Guidance ability for the next puzzle.',
        basePrice: 160,
        priceVariance: 0.25,
        type: 'consumable',
        icon: '<path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>'
    },
    'lucky_coin': {
        id: 'lucky_coin',
        name: 'Lucky Coin',
        description: 'Next puzzle completion grants 50% bonus gold.',
        basePrice: 140,
        priceVariance: 0.2,
        type: 'temporary_buff',
        icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>'
    },
    'time_saver': {
        id: 'time_saver',
        name: 'Time Saver',
        description: 'Next puzzle will have 1-2 fewer minimum steps required.',
        basePrice: 250,
        priceVariance: 0.3,
        type: 'temporary_buff',
        icon: '<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>'
    },
    'gold_magnet': {
        id: 'gold_magnet',
        name: 'Gold Magnet',
        description: 'Guarantees minimum moves bonus for the next puzzle.',
        basePrice: 200,
        priceVariance: 0.25,
        type: 'temporary_buff',
        icon: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>'
    },
    'guardian_charm': {
        id: 'guardian_charm',
        name: 'Guardian Charm',
        description: 'Next puzzle has 20% chance of undoing wrong moves.',
        basePrice: 350,
        priceVariance: 0.35,
        type: 'temporary_buff',
        icon: '<path d="M12 2C11.5 2 11 2.19 10.59 2.59L2.59 10.59C1.8 11.37 1.8 12.63 2.59 13.41L10.59 21.41C11.37 22.2 12.63 22.2 13.41 21.41L21.41 13.41C22.2 12.63 22.2 11.37 21.41 10.59L13.41 2.59C13 2.19 12.5 2 12 2M12 6C13.1 6 14 6.9 14 8S13.1 10 12 10 10 9.1 10 8 10.9 6 12 6M12 12C13.1 12 14 12.9 14 14S13.1 16 12 16 10 15.1 10 14 10.9 12 12 12Z"/>'
    }
};

const BOSS_MESSAGES = [
    "The darkness grows...",
    "Your resolve wavers...",
    "The shadows whisper doubt...",
    "Time slips through your fingers...",
    "The final test reveals your weakness...",
    "Even legends fall to this challenge...",
    "The puzzle hungers for your failure...",
    "Your mind fractures under pressure...",
    "The void stares back at you...",
    "Few have conquered what you now face...",
    "The crimson path grows treacherous...",
    "Your every move echoes in eternity...",
    "The challenge feeds on hesitation...",
    "Perfection demands sacrifice...",
    "The abyss beckons..."
];

let gauntletState = null;
let generatorWorker = null;
let solverWorker = null;
let stopSolving = false;
let previouslyClickedColor = null;
let bossEffectsEnabled = true;
let lastClickedIndex = -1;
let erajanWords = [];

let startScreen, activeScreen, startNewBtn, resumeBtn, upgradeModal, upgradeOptionsContainer;
let confirmationModal, confirmTitle, confirmMessage, confirmAcceptBtn, confirmCancelBtn;
let gauntletCompleteModal, gauntletCompleteOkBtn;
let devModeBtn, bossEffectsBtn, loadingModal;
let shopModal, shopItemsContainer, shopContinueBtn;

const RARITY_COLORS = {
    'common': '#9CA3AF',      // Gray
    'uncommon': '#10B981',    // Green
    'rare': '#3B82F6',        // Blue
    'epic': '#8B5CF6',        // Purple
    'legendary': '#F59E0B',   // Orange/Gold
    'mythic': '#EF4444'       // Red (for future use??)
};

const CATEGORY_INFO = {
    'efficiency': {
        name: 'Efficiency',
        icon: '<path d="M12 2L13.09 8.26L22 9L17 14L18.18 22L12 19.27L5.82 22L7 14L2 9L10.91 8.26L12 2Z"/>',
        color: '#10B981'
    },
    'safety': {
        name: 'Safety',
        icon: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>',
        color: '#3B82F6'
    },
    'information': {
        name: 'Information',
        icon: '<path d="M21.92 11.6C19.9 6.91 16.1 4 12 4s-7.9 2.91-9.92 7.6a1 1 0 0 0 0 .8C4.1 17.09 7.9 20 12 20s7.9-2.91 9.92-7.6a1 1 0 0 0 0-.8M12 18c-3.17 0-6.17-2.29-7.9-6C5.83 8.29 8.83 6 12 6s6.17 2.29 7.9 6c-1.73 3.71-4.73 6-7.9 6m0-10a4 4 0 1 0 4 4a4 4 0 0 0-4-4m0 6a2 2 0 1 1 2-2a2 2 0 0 1-2 2"/>',
        color: '#8B5CF6'
    },
    'meta': {
        name: 'Meta',
        icon: '<path d="m20.713 7.128l-.246.566a.506.506 0 0 1-.934 0l-.246-.566a4.36 4.36 0 0 0-2.22-2.25l-.759-.339a.53.53 0 0 1 0-.963l.717-.319A4.37 4.37 0 0 0 19.276.931L19.53.32a.506.506 0 0 1 .942 0l.253.61a4.37 4.37 0 0 0 2.25 2.327l.718.32a.53.53 0 0 1 0 .962l-.76.338a4.36 4.36 0 0 0-2.219 2.251"/>',
        color: '#F59E0B'
    },
    'utility': {
        name: 'Utility',
        icon: '<path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.38 11.96 17.34 8 12.5 8z"/>',
        color: '#6B7280'
    }
};

const UPGRADE_CATEGORIES = {
    'undo': 'utility',
    'insight': 'information',
    'guidance': 'information',
    'clarity': 'meta',
    'oracle': 'meta',
    'leeway': 'safety',
    'headstart': 'efficiency',
    'chronomancer': 'efficiency',
    'precision': 'efficiency',
    'guardian_angel': 'safety',
    'checkpoint': 'safety',
    'flow_state': 'efficiency',
    'echo': 'meta'
};

const RARITY_WEIGHTS = {
    'common': 38,
    'uncommon': 25,
    'rare': 20,
    'epic': 12,
    'legendary': 5
};

function getIconForUpgrade(upgradeId) {
    const icons = {
        'insight': '<path d="M21.92 11.6C19.9 6.91 16.1 4 12 4s-7.9 2.91-9.92 7.6a1 1 0 0 0 0 .8C4.1 17.09 7.9 20 12 20s7.9-2.91 9.92-7.6a1 1 0 0 0 0-.8M12 18c-3.17 0-6.17-2.29-7.9-6C5.83 8.29 8.83 6 12 6s6.17 2.29 7.9 6c-1.73 3.71-4.73 6-7.9 6m0-10a4 4 0 1 0 4 4a4 4 0 0 0-4-4m0 6a2 2 0 1 1 2-2a2 2 0 0 1-2 2"/>',
        'guidance': '<path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>',
        'undo': '<path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.38 11.96 17.34 8 12.5 8z"/>',
        'clarity': '<path fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.992 18h6m-8.58-7.657a4 4 0 1 0 5.657-5.657a4 4 0 0 0-5.657 5.657m0 0l-8.485 8.485l2.121 2.122M6.755 16l2.122 2.121"/>',
        'oracle': '<path d="m20.713 7.128l-.246.566a.506.506 0 0 1-.934 0l-.246-.566a4.36 4.36 0 0 0-2.22-2.25l-.759-.339a.53.53 0 0 1 0-.963l.717-.319A4.37 4.37 0 0 0 19.276.931L19.53.32a.506.506 0 0 1 .942 0l.253.61a4.37 4.37 0 0 0 2.25 2.327l.718.32a.53.53 0 0 1 0 .962l-.76.338a4.36 4.36 0 0 0-2.219 2.251M9 2a8 8 0 0 1 7.934 6.965l2.25 3.539c.148.233.118.58-.225.728L17 14.07V17a2 2 0 0 1-2 2h-1.999L13 22H4v-3.694c0-1.18-.436-2.297-1.244-3.305A8 8 0 0 1 9 2m0 2a6 6 0 0 0-4.684 9.75C5.41 15.114 6 16.667 6 18.306V20h5l.002-3H15v-4.248l1.55-.664l-1.543-2.425l-.057-.442A6 6 0 0 0 9 4m10.49 12.993l1.664 1.11A10.95 10.95 0 0 0 23 12q-.001-1.025-.181-2l-1.943.5q.123.733.124 1.5a8.96 8.96 0 0 1-1.51 4.993"/>',
        'leeway': '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>',
        'headstart': '<path d="M3 18q-.425 0-.712-.288T2 17V7q0-.425.288-.712T3 6t.713.288T4 7v10q0 .425-.288.713T3 18m15.175-5H7q-.425 0-.712-.288T6 12t.288-.712T7 11h11.175L15.3 8.1q-.275-.275-.288-.687T15.3 6.7q.275-.275.7-.275t.7.275l4.6 4.6q.15.15.213.325t.062.375t-.062.375t-.213.325l-4.6 4.6q-.275.275-.687.275T15.3 17.3q-.3-.3-.3-.712t.3-.713z"/>',
        'chronomancer': '<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>',
        'precision': '<path d="M11 2v2.07A8 8 0 0 0 4.07 11H2v2h2.07A8 8 0 0 0 11 19.93V22h2v-2.07A8 8 0 0 0 19.93 13H22v-2h-2.07A8 8 0 0 0 13 4.07V2m-2 4.08V8h2V6.09c2.5.41 4.5 2.41 4.92 4.91H16v2h1.91c-.41 2.5-2.41 4.5-4.91 4.92V16h-2v1.91C8.5 17.5 6.5 15.5 6.08 13H8v-2H6.09C6.5 8.5 8.5 6.5 11 6.08M12 11a1 1 0 0 0-1 1a1 1 0 0 0 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1"/>',
        'guardian_angel': '<path d="M12 22q-3.475-.875-5.738-3.988T4 11.1V5l8-3l8 3v6.1q0 3.8-2.262 6.913T12 22m0-2.1q2.6-.825 4.3-3.3t1.7-5.5V6.375l-6-2.25l-6 2.25V11.1q0 3.025 1.7 5.5t4.3 3.3m0-7.9"/>',
        'checkpoint': '<path d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h11.175q.4 0 .763.15t.637.425l2.85 2.85q.275.275.425.638t.15.762V19q0 .825-.587 1.413T19 21zM19 7.85L16.15 5H5v14h14zM12 18q1.25 0 2.125-.875T15 15t-.875-2.125T12 12t-2.125.875T9 15t.875 2.125T12 18m-5-8h7q.425 0 .713-.288T15 9V7q0-.425-.288-.712T14 6H7q-.425 0-.712.288T6 7v2q0 .425.288.713T7 10M5 7.85V19V5z"/>',
        'flow_state': '<path d="M10.45 15.5q.6.6 1.55.588t1.4-.688L19 7l-8.4 5.6q-.675.45-.712 1.375t.562 1.525M12 4q1.475 0 2.838.412T17.4 5.65l-1.9 1.2q-.825-.425-1.712-.637T12 6Q8.675 6 6.337 8.338T4 14q0 1.05.288 2.075T5.1 18h13.8q.575-.95.838-1.975T20 13.9q0-.9-.213-1.75t-.637-1.65l1.2-1.9q.75 1.175 1.188 2.5T22 13.85t-.325 2.725t-1.025 2.475q-.275.45-.75.7t-1 .25H5.1q-.525 0-1-.25t-.75-.7q-.65-1.125-1-2.387T2 14q0-2.075.788-3.887t2.15-3.175t3.187-2.15T12 4m.175 7.825"/>',
        'echo': '<path d="M20.5 9.25a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0v-4a.75.75 0 0 1 .75-.75m-4-4a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75m-4.5-3a.75.75 0 0 1 .75.75v18a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75m-4.5 3a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75m-4 4a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0v-4a.75.75 0 0 1 .75-.75"/>',
    };
    const path = icons[upgradeId] || '';
    return `<svg viewBox="0 0 24 24">${path}</svg>`;
}

document.addEventListener('DOMContentLoaded', initializeGauntlet);

async function loadErajanWords() {
    try {
        const response = await fetch('random_erajan_words.txt');
        const text = await response.text();
        erajanWords = text.split('\n')
            .map(word => word.trim())
            .filter(word => word.length > 0);
        console.log(`Loaded ${erajanWords.length} Erajan words`);
    } catch (error) {
        console.error('Failed to load Erajan words:', error);
        erajanWords = ['Oveldajiris', 'Ulelddau', 'Uleldnai', 'Uleldmora', 'Ovulelgift', 'Eldhew'];
    }
}

function getRandomErajanStageName() {
    if (erajanWords.length < 2) {
        console.warn('Erajan words not loaded, using fallback stage name');
        return `Stage ${gauntletState?.currentPuzzle || '?'}`;
    }

    const word1Index = Math.floor(Math.random() * erajanWords.length);
    let word2Index = Math.floor(Math.random() * erajanWords.length);

    while (word2Index === word1Index && erajanWords.length > 1) {
        word2Index = Math.floor(Math.random() * erajanWords.length);
    }

    const stageName = `${erajanWords[word1Index]} ${erajanWords[word2Index]}`;
    console.log(`Generated Erajan stage name: ${stageName}`);
    return stageName;
}

function getRandomizedValue(baseValue, variance) {
    const randomFactor = 1 + (Math.random() - 0.5) * 2 * variance;
    return Math.max(1, Math.floor(baseValue * randomFactor));
}

function getRandomizedShopPrice(itemId) {
    const item = SHOP_ITEMS[itemId];
    if (!item) return 0;

    return getRandomizedValue(item.basePrice, item.priceVariance);
}

function addGoldVariance(amount, isBonus = false) {
    const variance = isBonus ? GOLD_REWARDS.BONUS_VARIANCE : GOLD_REWARDS.BASE_VARIANCE;
    return getRandomizedValue(amount, variance);
}

function getRandomShopItems(availableItems, count = 3) {
    const shuffled = [...availableItems].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

function initializeGauntlet() {
    console.log("window.APP_CONFIG", window.APP_CONFIG);
    if (typeof window.APP_CONFIG === 'undefined') {
        console.warn('APP_CONFIG not loaded, falling back to defaults');
        window.APP_CONFIG = { IS_LOCAL_DEV: true };
    }

    initializeDOMElements();
    updateButtonVisibility();

    loadErajanWords();

    attachEventListeners();
    loadGauntlet();
}

function initializeDOMElements() {
    startScreen = document.getElementById('gauntlet-start-screen');
    activeScreen = document.getElementById('gauntlet-active-screen');
    startNewBtn = document.getElementById('start-new-gauntlet-btn');
    resumeBtn = document.getElementById('resume-gauntlet-btn');
    upgradeModal = document.getElementById('upgrade-modal');
    upgradeOptionsContainer = document.getElementById('upgrade-options-container');
    confirmationModal = document.getElementById('confirmation-modal');
    confirmTitle = document.getElementById('confirmation-title');
    confirmMessage = document.getElementById('confirmation-message');
    confirmAcceptBtn = document.getElementById('confirm-accept-btn');
    confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    gauntletCompleteModal = document.getElementById('gauntlet-complete-modal');
    gauntletCompleteOkBtn = document.getElementById('gauntlet-complete-ok-btn');
    devModeBtn = document.getElementById('dev-mode-btn');
    bossEffectsBtn = document.getElementById('boss-effects-btn');
    loadingModal = document.getElementById('loading-modal');
    shopModal = document.getElementById('shop-modal');
    shopItemsContainer = document.getElementById('shop-items-container');
    shopContinueBtn = document.getElementById('shop-continue-btn');
}

function attachEventListeners() {
    startNewBtn.addEventListener('click', startNewGauntlet);
    resumeBtn.addEventListener('click', resumeGauntlet);
    confirmCancelBtn.addEventListener('click', () => confirmationModal.style.display = 'none');
    gauntletCompleteOkBtn.addEventListener('click', handleGauntletComplete);
    devModeBtn.addEventListener('click', activateDevMode);
    bossEffectsBtn.addEventListener('click', toggleBossEffects);
    shopContinueBtn.addEventListener('click', () => {
        shopModal.style.display = 'none';
        advanceToNextPuzzle();
    });
}

function handleGauntletComplete() {
    gauntletCompleteModal.style.display = 'none';
    clearGauntletState();
    activeScreen.style.display = 'none';
    resumeBtn.style.display = 'none';
    startScreen.style.display = 'block';
    updateButtonVisibility();
}

function loadGauntlet() {
    const savedState = localStorage.getItem(GAUNTLET_STATE_KEY);
    if (savedState) {
        gauntletState = JSON.parse(savedState);

        if (gauntletState.abilityInstances && gauntletState.abilityInstances.length > 0) {
            const recreatedInstances = [];
            gauntletState.abilityInstances.forEach(savedAbility => {
                const newInstance = AbilityFactory.create(savedAbility.id);
                newInstance.used = savedAbility.used || false;
                newInstance.count = savedAbility.count || 1;
                if (savedAbility.lastUse !== undefined) {
                    newInstance.lastUse = savedAbility.lastUse;
                }
                recreatedInstances.push(newInstance);
            });
            gauntletState.abilityInstances = recreatedInstances;
        } else if (gauntletState.upgrades && gauntletState.upgrades.length > 0) {
            gauntletState.abilityInstances = [];
            gauntletState.upgrades.forEach(upgrade => {
                const newInstance = AbilityFactory.create(upgrade.id);
                gauntletState.abilityInstances.push(newInstance);
            });
            console.log('Recreated ability instances from upgrades:', gauntletState.abilityInstances);
        }

        console.log('Found existing gauntlet state:', gauntletState);
        if (gauntletState.currentPuzzle > 0 && gauntletState.currentPuzzle <= 8) {
            resumeBtn.style.display = 'inline-block';
        } else {
            clearGauntletState();
        }
    } else {
        console.log('No existing gauntlet state found.');
    }
}

function saveGauntletState() {
    if (gauntletState) {
        localStorage.setItem(GAUNTLET_STATE_KEY, JSON.stringify(gauntletState));
        console.log('Gauntlet state saved.');
    }
}

function clearGauntletState() {
    localStorage.removeItem(GAUNTLET_STATE_KEY);
    gauntletState = null;
    console.log('Gauntlet state cleared.');
}

function getDefaultGauntletState() {
    return {
        gauntletSeed: Date.now(),
        currentPuzzle: 1,
        puzzleSolved: false,
        moveCount: 0,
        moveHistory: [],
        abilityInstances: [],
        lastLeewayUse: -Infinity,
        resetsRemaining: 5,
        resetsUsed: 0,
        upgrades: [],
        puzzles: [],
        currentGrid: [],
        currentTargets: {},
        isInsightModeActive: false,
        bossClickCount: 0,
        gold: 0,
        totalGoldEarned: 0,
        shopItems: [],
        temporaryBuffs: []
    };
}

function startNewGauntlet() {
    console.log('Starting new gauntlet...');
    if (gauntletState && gauntletState.currentPuzzle > 0) {
        showConfirmationModal(
            'Start New Gauntlet?',
            'This will overwrite your existing gauntlet progress. Are you sure?',
            () => {
                gauntletState = getDefaultGauntletState();
                saveGauntletState();
                startScreen.style.display = 'none';
                activeScreen.style.display = 'block';
                generatePuzzleForCurrentStage();
            }
        );
    } else {
        gauntletState = getDefaultGauntletState();
        saveGauntletState();
        startScreen.style.display = 'none';
        activeScreen.style.display = 'block';
        generatePuzzleForCurrentStage();
    }
}

function resumeGauntlet() {
    console.log('Resuming gauntlet...');
    startScreen.style.display = 'none';
    activeScreen.style.display = 'block';

    updateButtonVisibility();

    const currentPuzzleData = gauntletState.puzzles[gauntletState.currentPuzzle - 1];

    if (!gauntletState.currentGrid || gauntletState.currentGrid.length === 0 || !currentPuzzleData) {
        console.log('Missing puzzle data, generating puzzle for current stage...');
        generatePuzzleForCurrentStage();
    } else {
        console.log('Puzzle data exists, rendering UI...');
        renderActiveGauntletUI();
    }
}

function renderActiveGauntletUI() {
    const isFinalBoss = gauntletState.currentPuzzle === 8;
    const puzzleTitle = getPuzzleTitle(gauntletState.currentPuzzle);

    const bossStyling = isFinalBoss && bossEffectsEnabled;

    updateButtonVisibility();

    const filteredUpgrades = gauntletState.upgrades.filter(function (upgrade, position, self) {
        return self.findIndex(t => t.id === upgrade.id) === position;
    });

    activeScreen.innerHTML = `
        <div class="gauntlet-header">
            <span class="gold-display">💰 ${gauntletState.gold} gold</span>
            <h1 class="gauntlet-title ${bossStyling ? 'final-boss-title' : ''}">${puzzleTitle}</h2>
            <div class="gauntlet-status-panel card ${bossStyling ? 'final-boss-panel' : ''}">
            <div class="gauntlet-progress-bar">
                ${[1, 2, 3, 4, 'shop1', 5, 6, 7, 'shop2', 8].map((step, index) => {
        if (step === 'shop1' || step === 'shop2') {
            const shopNumber = step === 'shop1' ? 4 : 7;
            const isCompleted = gauntletState.currentPuzzle > shopNumber;
            const isActive = gauntletState.currentPuzzle === shopNumber && gauntletState.puzzleSolved;

            return `<div class="progress-shop ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><g fill="none"><path d="M39 32H13L8 12h36z"/><path stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M3 6h3.5L8 12m0 0l5 20h26l5-20z"/><circle cx="13" cy="39" r="3" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"/><circle cx="39" cy="39" r="3" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"/></g></svg>
                    </div>`;
        }

        const p = step;
        const isFinalStep = p === 8;
        const isCompleted = p < gauntletState.currentPuzzle;
        const isActive = p === gauntletState.currentPuzzle;
        const stepContent = isFinalStep ?
            '<img src="../favicon.png" alt="Final Boss" class="final-boss-icon">' :
            p;

        let stepClasses = 'progress-step';
        if (isFinalStep && bossEffectsEnabled) stepClasses += ' final-boss';
        if (isCompleted) {
            stepClasses += bossEffectsEnabled && isFinalBoss ? ' final-boss-completed' : ' completed';
        }
        if (isActive) stepClasses += ' active';

        return `<div class="${stepClasses}">${stepContent}</div>`;
    }).join('<div class="progress-connector"></div>')}
            </div>
            <div class="gauntlet-info">
                ${isFinalBoss && bossEffectsEnabled ? '<p class="final-boss-subtitle">The ultimate test awaits... are you read̷y̴ ̷t̷o̴ ̸t̸a̶k̵e̴ ö̴̺̰͂n̸̝̳̤̋ ̵͍͝t̷͎̘̏ͅḫ̶͍̦̂̈e̴͈̩̍͋ ̶̟̬̞͝  <span style="color:var(--accent-color)"> ̴̶̵̡̛̛͎̠͈̖͇̤̠͚͈̯̫͚͛͗̍̽̓̄́̐̓̎̌̎͒̔̓͘̕͘ͅB̵̶̸̡̛̛̛̝̟̜̤͕͔̆́͊̇͒̾͑̔̀́͋̄̑̆̈́̋͜͝͝l̷̶̴̢̛̝̙̥̠͙̲̜̩͓̠̥̭͔̥̣̪̲͆́̍̋͐̐̾̃͘ư̴̶̵̘̙̥͔͔̞̱̦͓͖̝̜̫͔̄̾͗͆̃̇̈́̿͊͐͝͠ȩ̶̶̷̨̡̠͉̭̼̥̜̺̝̝̘̭̝̲̤͔̼̭̥̜͙̖̣͐̍̉̇͛͑̓́̒̒̀̋͋̅̚͠͝  </span> P̵̢̖̥̺̤̻̿͆̃̎̈́͛̕͘͝ŗ̸̙̽i̷̺̙̲͑n̶͍̓̽̆̀̎͘͜͝c̴̗̘̬̩̹͎͐̒͊ͅė̷̘̟̣̘̝̲̻̮͉͒̈́̅̇̍̔' : ''}
            </div>
        </div>

        <div class="gauntlet-container">
            <div id="gauntlet-grid-container" class="grid-container ${bossStyling ? 'final-boss-card' : ''}">
                <div id="gauntlet-grid" class="grid ${bossStyling ? 'final-boss-grid' : ''}">
                    ${gauntletState.currentGrid.map((color, index) =>
        `<div class="cell" data-index="${index}" style="background-color: ${colors[color]?.hex || colors.gray.hex};"></div>`
    ).join('')}
                </div>
                <div class="symbol top-left-symbol ${bossStyling ? 'final-boss-symbol' : ''}" id="symbol-tl-gauntlet">TL</div>
                <div class="symbol top-right-symbol ${bossStyling ? 'final-boss-symbol' : ''}" id="symbol-tr-gauntlet">TR</div>
                <div class="symbol bottom-left-symbol ${bossStyling ? 'final-boss-symbol' : ''}" id="symbol-bl-gauntlet">BL</div>
                <div class="symbol bottom-right-symbol ${bossStyling ? 'final-boss-symbol' : ''}" id="symbol-br-gauntlet">BR</div>
            </div>

            <div class="side-panel">
                <div class="card ${bossStyling ? 'final-boss-card' : ''}">
                    <h2 class="card-title ${bossStyling ? 'final-boss-section-title' : ''}">Abilities</h2>
                    <div class="controls" id="gauntlet-abilities-container">
                        <div class="ability-button-wrapper">
                            ${(gauntletState.resetsRemaining > 0) ? `<div class="ability-counter">${gauntletState.resetsRemaining}</div>` : ``}
                            <button id="gauntlet-reset-btn" class="ability-button reset-button" ${gauntletState.resetsRemaining <= 0 ? 'disabled' : ''}>
                                <svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
                            </button>
                            <div class="ability-tooltip">
                                <strong>Reset Puzzle</strong>
                                <p>Reset the current puzzle to its initial state.</p>
                            </div>
                            <span class="ability-name">Reset</span>
                        </div>
                        ${filteredUpgrades.map(ability => {
        const abilityInstance = gauntletState.abilityInstances.find(instance => instance.id === ability.id);
        const isUsed = abilityInstance ? abilityInstance.used : false;
        const isPassive = ability.type !== 'active';

        let counterHtml = '';
        if (ability.id === 'oracle') {
            const count = Math.max(0, 5 - (gauntletState.moveCount % 5));
            counterHtml = `<div class="ability-counter">${count}</div>`;
        } else if (ability.id === 'leeway' && gauntletState.currentPuzzle === 8) {
            const cooldownLeft = Math.max(0, (gauntletState.lastLeewayUse + 12) - gauntletState.moveCount);
            const displayStyle = (cooldownLeft > 0) ? '' : 'style="display: none;"';
            counterHtml = `<div class="ability-counter" ${displayStyle}>${cooldownLeft > 0 ? cooldownLeft : 'used'}</div>`;
        } else if (ability.id === 'chronomancer') {
            const numberOfChronomancers = gauntletState.upgrades.filter(u => u.id === 'chronomancer').length;
            const displayStyle = (numberOfChronomancers > 1) ? '' : 'style="display: none;"';
            counterHtml = `<div class="ability-counter" ${displayStyle}>${numberOfChronomancers}</div>`;
        }

        return `
                                <div class="ability-button-wrapper">
                                    ${counterHtml}
                                    <button
                                        id="ability-btn-${ability.id}"
                                        class="ability-button ${isPassive ? '' : 'active-ability'}"
                                        ${isUsed && ability.id !== 'undo' ? 'disabled' : ''}
                                        ${isPassive ? 'disabled' : ''}
                                    >
                                        ${getIconForUpgrade(ability.id)}
                                    </button>
                                    <div class="ability-tooltip">
                                        <strong>${ability.name}</strong>
                                        <p>${ability.description}</p>
                                    </div>
                                    <span class="ability-name">${ability.name}</span>
                                </div>
                            `;
    }).join('')}
                        ${gauntletState.shopItems.map(shopItem => {
        let iconSvg;
        if (SHOP_ITEMS[shopItem.id]) {
            iconSvg = `<svg viewBox="0 0 24 24">${SHOP_ITEMS[shopItem.id].icon}</svg>`;
        } else {
            iconSvg = getIconForUpgrade(shopItem.id);
        }

        return `
                                <div class="ability-button-wrapper">
                                    <button
                                        id="ability-btn-${shopItem.id}-shop"
                                        class="ability-button active-ability shop-ability"
                                    >
                                        ${iconSvg}
                                    </button>
                                    <div class="ability-tooltip">
                                        <strong>${shopItem.name}</strong>
                                        <p>Temporary ability from shop purchase</p>
                                    </div>
                                    <span class="ability-name">${shopItem.name}</span>
                                </div>
                            `;
    }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    if (isFinalBoss && bossEffectsEnabled) {
        activeScreen.classList.add('final-boss-screen');
        document.body.classList.add('final-boss-body');
        document.querySelector('.modal-content').classList.add('final-boss-modal');
        document.querySelector('.gauntlet-title').classList.add('final-boss-title');

        document.querySelector('.container').classList.add('final-boss-container');
    } else {
        activeScreen.classList.remove('final-boss-screen');
        document.body.classList.remove('final-boss-body');
        document.querySelector('.gauntlet-title').classList.remove('final-boss-title');
        document.querySelector('.container').classList.remove('final-boss-container');
    }

    document.getElementById('gauntlet-grid').addEventListener('click', handleGridClick);
    document.getElementById('gauntlet-reset-btn').addEventListener('click', handleResetClick);

    gauntletState.upgrades.filter(u => u.type === 'active').forEach(ability => {
        const abilityBtn = document.getElementById(`ability-btn-${ability.id}`);
        if (abilityBtn) {
            abilityBtn.addEventListener('click', () => handleAbilityClick(ability.id));
        }
    });

    gauntletState.shopItems.forEach(shopItem => {
        const abilityBtn = document.getElementById(`ability-btn-${shopItem.id}-shop`);
        if (abilityBtn) {
            abilityBtn.addEventListener('click', () => handleShopAbilityClick(shopItem.id));
        }
    });

    const undoBtn = document.getElementById('ability-btn-undo');
    if (undoBtn) {
        undoBtn.disabled = true;
    }

    manageBossScreenOverlay();
    updateGauntletCornerSymbols();
    console.log('Gauntlet UI rendered');
}

function handleGridClick(event) {
    if (event.target.classList.contains('cell')) {
        const index = parseInt(event.target.dataset.index);
        lastClickedIndex = index;

        if (gauntletState.isInsightModeActive) {
            handleInsightClick(index);
            return;
        }

        gauntletState.moveHistory.push(JSON.parse(JSON.stringify(gauntletState.currentGrid)));
        previouslyClickedColor = gauntletState.currentGrid[index];

        const previousGrid = [...gauntletState.currentGrid];
        gauntletState.currentGrid = performAction(gauntletState.currentGrid, index);

        gauntletState.moveCount++;

        console.log("moveCount", gauntletState.moveCount);

        const isWrongMove = gauntletState.currentGrid.every((value, idx) => value === previousGrid[idx]);

        if (isWrongMove) {
            const guardianAngel = gauntletState.abilityInstances.find(ability => ability.id === 'guardian_angel');
            if (guardianAngel && guardianAngel.onWrongMove) {
                const wasUndone = guardianAngel.onWrongMove(gauntletState);
                if (wasUndone) {
                    showNotification("Guardian Angel undid the move", "info");
                    return;
                }
            }
        }

        let shouldProcessAbilities = true;
        //TODO: maybe improve this with things like (making the pink only skip the ability processing if pressed twice in a row and things like that)
        if (gauntletState.moveHistory.length > 0) {
            const previousGridFromHistory = gauntletState.moveHistory[gauntletState.moveHistory.length - 1]

            if ((previouslyClickedColor === 'blue' && (previousGridFromHistory[4] === 'green' || previousGridFromHistory[4] === 'black' || previousGridFromHistory[4] === 'pink')) ||
                (previouslyClickedColor === 'black' || previouslyClickedColor === 'pink' || previouslyClickedColor === 'green') ||
                gauntletState.currentGrid.every((value, idx) => value === previousGridFromHistory[idx])) {

                console.log("Possible infinite loop detected. Not updating ability counters to avoid cheating.");
                if (gauntletState.moveCount > 0) {
                    gauntletState.moveCount--;
                }
                shouldProcessAbilities = false;
            }
        }

        if (shouldProcessAbilities) {
            console.log("shouldProcessAbilities", gauntletState.abilityInstances);
            gauntletState.abilityInstances.forEach(ability => {
                if (ability.onMove) {
                    const result = ability.onMove(gauntletState);
                    console.log("result", result);
                    if (result && result.updateCounter) {
                        const wrapper = document.getElementById(`ability-btn-${ability.id}`)?.parentElement;
                        if (wrapper) {
                            const counterEl = wrapper.querySelector('.ability-counter');
                            if (counterEl) {
                                if (ability.id === 'oracle') {
                                    counterEl.textContent = result.counterValue;
                                } else if (ability.id === 'leeway') {
                                    if (result.showCounter) {
                                        counterEl.textContent = result.counterValue;
                                        counterEl.style.display = 'flex';
                                    } else {
                                        counterEl.style.display = 'none';
                                    }
                                }
                            }
                        }
                    }
                } else {
                    console.log("ability.id", ability.id, "did not return updateCounter");
                }
            });
        }

        const gridCells = document.querySelectorAll('#gauntlet-grid .cell');
        gridCells.forEach((cell, i) => {
            cell.style.backgroundColor = colors[gauntletState.currentGrid[i]]?.hex || colors.gray.hex;
        });

        if (gauntletState.currentPuzzle === 8) {
            gauntletState.bossClickCount++;

            const messageInterval = 4 + Math.floor(Math.random() * 2);
            if (bossEffectsEnabled && gauntletState.bossClickCount % messageInterval === 0) {
                const randomMessage = BOSS_MESSAGES[Math.floor(Math.random() * BOSS_MESSAGES.length)];
                showNotification(randomMessage, "boss", 4000);
            }
        }
        const undoBtn = document.getElementById('ability-btn-undo');
        if (undoBtn) {
            undoBtn.disabled = false;
        }

        updateAbilityCounters();
        checkWinCondition();
        saveGauntletState();
    }
}

function handleResetClick() {
    if (!gauntletState || gauntletState.resetsRemaining <= 0) {
        console.log("No resets remaining!");
        return;
    }

    const initialPuzzleState = gauntletState.puzzles[gauntletState.currentPuzzle - 1];
    if (!initialPuzzleState) {
        console.log("No puzzle data available for reset. Regenerating puzzle...");
        showNotification("Regenerating puzzle for reset...", "info");
        generatePuzzleForCurrentStage();
        return;
    }

    showConfirmationModal(
        'Use Reset?',
        `You have <strong>${gauntletState.resetsRemaining}</strong> resets left. Are you sure you want to use one to restart this puzzle?`,
        () => {
            gauntletState.resetsRemaining--;
            gauntletState.resetsUsed++;

            const shopItemsBackup = [...gauntletState.shopItems];
            const temporaryBuffsBackup = [...gauntletState.temporaryBuffs];
            console.log('Backing up shop items:', shopItemsBackup);
            console.log('Backing up temporary buffs:', temporaryBuffsBackup);

            gauntletState.currentGrid = [...initialPuzzleState.initialGrid];
            gauntletState.moveCount = 0;
            gauntletState.moveHistory = [];

            gauntletState.abilityInstances.forEach(ability => {
                ability.reset();
            });

            gauntletState.shopItems = shopItemsBackup;
            gauntletState.temporaryBuffs = temporaryBuffsBackup;
            console.log('Restored shop items:', gauntletState.shopItems);
            console.log('Restored temporary buffs:', gauntletState.temporaryBuffs);

            gauntletState.puzzleSolved = false;
            gauntletState.lastLeewayUse = -Infinity;
            gauntletState.bossClickCount = 0;
            gauntletState.isInsightModeActive = false;

            saveGauntletState();
            console.log('State saved after reset with shop items:', gauntletState.shopItems.length);

            recalculateSolution();
            resetAbilityCounters();
            renderActiveGauntletUI();

            console.log('Shop items after UI render:', gauntletState.shopItems);
        }
    );
}

function checkWinCondition() {
    if (!gauntletState) return;

    const cornerIndices = { tl: 0, tr: 2, bl: 6, br: 8 };
    const targets = gauntletState.currentTargets;

    const isSolved = Object.keys(targets).every(corner => {
        return targets[corner] && gauntletState.currentGrid[cornerIndices[corner]] === targets[corner];
    });

    if (isSolved) {
        handlePuzzleSolved();
    }
}

function handlePuzzleSolved() {
    if (gauntletState.puzzleSolved) return; // prevent re-entry
    gauntletState.puzzleSolved = true;

    const gridElement = document.getElementById('gauntlet-grid');
    if (gridElement) {
        gridElement.classList.add('disabled-grid');
    }

    gauntletState.abilityInstances.forEach(ability => {
        if (ability.onPuzzleComplete) {
            ability.onPuzzleComplete(gauntletState);
        }
    });

    const goldData = calculateGoldReward();
    gauntletState.gold += goldData.total;
    gauntletState.totalGoldEarned += goldData.total;

    const minSteps = GAUNTLET_DIFFICULTY[gauntletState.currentPuzzle].minSteps;
    const threshold = (minSteps * 2) + Math.floor(minSteps / 10);
    if (gauntletState.moveCount <= threshold) {
        gauntletState.resetsRemaining++;
        console.log(`Solved in ${gauntletState.moveCount} moves (<= ${threshold}). Earned a reset!`);
        showNotification("You earned a reset because you solved the puzzle in less than " + threshold + " moves!", "success");
    }

    if (gauntletState.currentPuzzle >= 8) {
        showGauntletCompleteModal();
    } else {
        if (gauntletState.currentPuzzle === 4 || gauntletState.currentPuzzle === 7) {
            showShop(goldData);
        } else {
            showUpgradeSelection(goldData);
        }
    }

}

function calculateGoldReward() {
    const difficulty = GAUNTLET_DIFFICULTY[gauntletState.currentPuzzle];
    const minSteps = difficulty.minSteps;

    // base gold: 70-180 based on puzzle difficulty, with randomization
    const baseGold = GOLD_REWARDS.BASE_MIN +
        (GOLD_REWARDS.BASE_MAX - GOLD_REWARDS.BASE_MIN) *
        ((gauntletState.currentPuzzle - 1) / 7);

    let totalGold = addGoldVariance(Math.floor(baseGold), false);
    let bonusText = [];

    // random luck factor (rare chance for extra base gold)
    if (Math.random() < 0.08) {
        const luckBonus = Math.floor(totalGold * (0.15 + Math.random() * 0.25));
        totalGold += luckBonus;
        bonusText.push(`Lucky Find: +${luckBonus} gold`);
    }

    const hasGoldMagnet = gauntletState.temporaryBuffs.includes('gold_magnet');

    if (hasGoldMagnet || gauntletState.moveCount === minSteps) {
        const baseBonus = Math.floor(totalGold * GOLD_REWARDS.MINIMUM_MOVES_BONUS);
        const bonus = addGoldVariance(baseBonus, true);
        totalGold += bonus;
        if (hasGoldMagnet) {
            bonusText.push(`Gold Magnet: +${bonus} gold`);
            gauntletState.temporaryBuffs = gauntletState.temporaryBuffs.filter(buff => buff !== 'gold_magnet');
        } else {
            bonusText.push(`Minimum moves: +${bonus} gold`);
        }
    }
    else if (gauntletState.moveCount <= minSteps + 2) {
        const baseBonus = Math.floor(totalGold * GOLD_REWARDS.UNDER_PAR_BONUS);
        const bonus = addGoldVariance(baseBonus, true);
        totalGold += bonus;
        bonusText.push(`Under par: +${bonus} gold`);
    }

    if (gauntletState.resetsUsed === 0) {
        const baseBonus = Math.floor(totalGold * GOLD_REWARDS.NO_RESETS_BONUS);
        const bonus = addGoldVariance(baseBonus, true);
        totalGold += bonus;
        bonusText.push(`No resets: +${bonus} gold`);
    }

    const hasLuckyCoin = gauntletState.temporaryBuffs.includes('lucky_coin');
    if (hasLuckyCoin) {
        const baseBonus = Math.floor(totalGold * (0.35 + Math.random() * 0.1));
        const bonus = addGoldVariance(baseBonus, true);
        totalGold += bonus;
        bonusText.push(`Lucky Coin: +${bonus} gold`);
        gauntletState.temporaryBuffs = gauntletState.temporaryBuffs.filter(buff => buff !== 'lucky_coin');
    }

    return { total: totalGold, bonuses: bonusText };
}

function getRandomUpgrades(availableUpgrades, count = 3) {
    if (availableUpgrades.length <= count) {
        return availableUpgrades;
    }

    const selectedUpgrades = [];
    const upgradePool = [...availableUpgrades];

    for (let i = 0; i < count; i++) {
        if (upgradePool.length === 0) break;

        const selectedUpgrade = selectUpgradeByRarity(upgradePool);
        selectedUpgrades.push(selectedUpgrade);

        const index = upgradePool.indexOf(selectedUpgrade);
        upgradePool.splice(index, 1);
    }

    return selectedUpgrades;
}

function selectUpgradeByRarity(availableUpgrades) {
    const weightedPool = [];
    const progressionBonus = Math.floor(gauntletState.currentPuzzle / 2);

    availableUpgrades.forEach(upgrade => {
        const rarity = getUpgradeRarity(upgrade.id);
        let weight = RARITY_WEIGHTS[rarity] || RARITY_WEIGHTS.common;

        // slightly increase chances of higher rarity as you progress
        if (rarity === 'rare') {
            weight += progressionBonus;
        } else if (rarity === 'epic') {
            weight += Math.floor(progressionBonus / 2);
        } else if (rarity === 'legendary') {
            weight += Math.floor(progressionBonus / 4);
        }

        for (let i = 0; i < weight; i++) {
            weightedPool.push(upgrade);
        }
    });

    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    return weightedPool[randomIndex];
}

function getUpgradesByRarity(availableUpgrades) {
    const rarityPools = {
        'common': [],
        'uncommon': [],
        'rare': [],
        'epic': [],
        'legendary': []
    };

    availableUpgrades.forEach(upgrade => {
        const rarity = getUpgradeRarity(upgrade.id);
        if (rarityPools[rarity]) {
            rarityPools[rarity].push(upgrade);
        }
    });

    return rarityPools;
}

function showUpgradeSelection(goldData) {
    const upgradeModal = document.getElementById('upgrade-modal');
    const upgradeOptionsContainer = document.getElementById('upgrade-options-container');
    upgradeOptionsContainer.innerHTML = '';

    const modalContent = upgradeModal.querySelector('.modal-content');
    const existingTitle = modalContent.querySelector('h2');

    let goldEarnedHtml = `<div style="color: #ffd700; font-size: 0.9em; margin: 10px 0;">
        <strong>+${goldData.total} gold earned!</strong>`;

    if (goldData.bonuses.length > 0) {
        goldEarnedHtml += `<br><small style="color: #ffec8b;">${goldData.bonuses.join(' • ')}</small>`;
    }

    goldEarnedHtml += `</div>`;

    existingTitle.innerHTML = `Puzzle Complete! Choose Your Upgrade
        ${goldEarnedHtml}
        <div style="font-size: 0.8em; color: #ffd700; margin-top: 5px;">💰 ${gauntletState.gold} gold total</div>`;

    const availableUpgrades = Object.values(UPGRADES_POOL).filter(upgrade =>
        !gauntletState.upgrades.some(owned => owned.id === upgrade.id && upgrade.id !== 'chronomancer')
    );

    const selectedUpgrades = getRandomUpgrades(availableUpgrades, 3);

    selectedUpgrades.forEach(upgrade => {
        const rarity = getUpgradeRarity(upgrade.id);
        const category = getUpgradeCategory(upgrade.id);
        const rarityColor = getRarityColor(rarity);
        const categoryInfo = getCategoryInfo(category);

        const card = document.createElement('div');
        card.className = `upgrade-option-card rarity-${rarity}`;
        card.style.borderColor = rarityColor;
        card.style.boxShadow = `0 0 10px ${rarityColor}40`;

        card.innerHTML = `
            <div class="upgrade-header">
                <div class="upgrade-category" style="color: ${categoryInfo.color};">
                    <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: ${categoryInfo.color};">
                        ${categoryInfo.icon}
                    </svg>
                    <span>${categoryInfo.name}</span>
                </div>
                <div class="upgrade-rarity" style="color: ${rarityColor}; font-weight: bold; text-transform: uppercase; font-size: 0.75em;">
                    ${rarity}
                </div>
            </div>
            <div class="upgrade-icon">${getIconForUpgrade(upgrade.id)}</div>
            <h3 style="color: ${rarityColor};">${upgrade.name}</h3>
            <p>${upgrade.description}</p>
        `;
        card.addEventListener('click', () => selectUpgrade(upgrade.id));
        upgradeOptionsContainer.appendChild(card);
    });

    upgradeModal.style.display = 'flex';
}

function selectUpgrade(upgradeId) {
    const abilityInstance = addAbilityInstance(upgradeId);

    if (abilityInstance) {
        gauntletState.upgrades.push(UPGRADES_POOL[upgradeId]);

        upgradeModal.style.display = 'none';

        if (gauntletState.currentPuzzle >= 8) {
            showGauntletCompleteModal();
        } else {
            advanceToNextPuzzle();
        }

        saveGauntletState();
    }
}

function updateGauntletCornerSymbols() {
    if (!gauntletState || !gauntletState.currentTargets) return;
    const targets = gauntletState.currentTargets;
    const cornerSymbolDivs = {
        tl: document.getElementById('symbol-tl-gauntlet'),
        tr: document.getElementById('symbol-tr-gauntlet'),
        bl: document.getElementById('symbol-bl-gauntlet'),
        br: document.getElementById('symbol-br-gauntlet'),
    };
    for (const id in cornerSymbolDivs) {
        const symbolDiv = cornerSymbolDivs[id];
        if (symbolDiv) {
            if (targets[id]) {
                symbolDiv.style.backgroundColor = colors[targets[id]].hex;
                symbolDiv.textContent = '';
            } else {
                symbolDiv.style.backgroundColor = 'var(--symbol-background)';
                symbolDiv.textContent = id.toUpperCase();
            }
        }
    }
}

function initGeneratorWorker() {
    if (window.Worker) {
        try {
            generatorWorker = new Worker('generator_worker.js');
            generatorWorker.onmessage = handleGeneratorWorkerMessage;
            generatorWorker.onerror = (err) => {
                console.error("Generator Worker Error:", err);
                hideLoadingModal();
                showNotification("Worker error occurred. Retrying...", "error");
                generatorWorker = null;
                setTimeout(() => {
                    initGeneratorWorker();
                }, 2000);
            };
            console.log("Generator Worker initialized for Gauntlet.");
        } catch (error) {
            console.error("Failed to initialize generator worker:", error);
            showNotification("Failed to initialize puzzle generator.", "error");
        }
    } else {
        console.error("Web Workers not supported in this browser.");
        showNotification("Web Workers not supported in this browser.", "error");
    }
}

function generatePuzzleForCurrentStage() {
    if (!gauntletState) return;
    if (!generatorWorker) {
        console.log('Initializing generator worker...');
        initGeneratorWorker();
    }

    console.log('Generating puzzle for current stage');

    const stage = gauntletState.currentPuzzle;
    const difficulty = { ...GAUNTLET_DIFFICULTY[stage] };

    showLoadingModal();
    console.log(`Requesting puzzle for stage ${stage}...`);

    setTimeout(() => {
        if (document.getElementById('loading-modal') && document.getElementById('loading-modal').style.display !== 'none') {
            console.error('Puzzle generation timeout - worker may be stuck');
            hideLoadingModal();
            showNotification("Puzzle generation timed out. Retrying...", "error");
            setTimeout(() => {
                generatePuzzleForCurrentStage();
            }, 1000);
        }
    }, 15000);

    let allowedColors = Object.keys(colors).filter(c => c !== 'gray');
    if (gauntletState.upgrades.some(u => u.id === 'clarity')) {
        if (allowedColors.length > 5) { // safety check
            allowedColors.splice(Math.floor(Math.random() * allowedColors.length), 1);
            console.log("Clarity upgrade applied. New color pool size:", allowedColors.length);
        }
    }

    if (gauntletState.upgrades.some(u => u.id === 'headstart')) {
        if (Math.random() < 0.5) {
            difficulty.minSteps = Math.max(1, difficulty.minSteps - 1);
            difficulty.maxSteps = Math.max(1, difficulty.maxSteps - 1);
            console.log("Headstart upgrade applied. New step range:", difficulty.minSteps, "-", difficulty.maxSteps);
        } else {
            console.log("Headstart upgrade available but didn't trigger this puzzle.");
        }
    }

    const hasTimeSaver = gauntletState.temporaryBuffs.includes('time_saver');
    if (hasTimeSaver) {
        const reduction = Math.floor(Math.random() * 2) + 1; // 1-2 steps reduction
        difficulty.minSteps = Math.max(1, difficulty.minSteps - reduction);
        difficulty.maxSteps = Math.max(1, difficulty.maxSteps - reduction);
        console.log(`Time Saver buff applied. Reduced steps by ${reduction}. New step range:`, difficulty.minSteps, "-", difficulty.maxSteps);
        showNotification(`Time Saver activated! Puzzle difficulty reduced by ${reduction} steps.`, "success");
        gauntletState.temporaryBuffs = gauntletState.temporaryBuffs.filter(buff => buff !== 'time_saver');
    }

    const generationOptions = {
        allowedColors: allowedColors,
        makeCornersUniform: false
    };

    try {
        console.log('Sending message to generator worker:', {
            type: 'startGeneration',
            data: {
                difficulty: difficulty,
                userSeed: null,
                colors: colors,
                generationOptions: generationOptions,
                MAX_GENERATION_ATTEMPTS: 100,
                WORKER_MAX_ITERATIONS: 3000000,
                WORKER_MAX_SHALLOW_BFS_DEPTH: 70
            }
        });

        generatorWorker.postMessage({
            type: 'startGeneration',
            data: {
                difficulty: difficulty,
                userSeed: null,
                colors: colors,
                generationOptions: generationOptions,
                MAX_GENERATION_ATTEMPTS: 100,
                WORKER_MAX_ITERATIONS: 3000000,
                WORKER_MAX_SHALLOW_BFS_DEPTH: 70
            }
        });
        console.log('Message sent to generator worker successfully');
    } catch (error) {
        console.error('Error sending message to generator worker:', error);
        hideLoadingModal();
        showNotification("Error starting puzzle generation. Please try again.", "error");
    }
}

function handleGeneratorWorkerMessage(e) {
    console.log('Received message from generator worker:', e.data);
    const { type, puzzleData, message, error } = e.data;

    if (type === 'generationResult' && puzzleData) {
        hideLoadingModal();
        console.log("Received puzzle from worker:", puzzleData);

        try {
            const currentPuzzleData = {
                initialGrid: [...puzzleData.initialGrid],
                solutionPath: [...puzzleData.solutionPath],
                originalSolutionPath: [...puzzleData.solutionPath],
                targetCorners: { ...puzzleData.targetCorners },
                seed: puzzleData.seed,
            };

            gauntletState.puzzles[gauntletState.currentPuzzle - 1] = currentPuzzleData;

            gauntletState.currentGrid = [...puzzleData.initialGrid];
            gauntletState.currentTargets = { ...puzzleData.targetCorners };
            gauntletState.moveCount = 0;
            gauntletState.moveHistory = [];

            if (!gauntletState.abilityInstances || gauntletState.abilityInstances.length === 0) {
                gauntletState.abilityInstances = [];
            }

            gauntletState.puzzleSolved = false;

            saveGauntletState();
            renderActiveGauntletUI();

            recalculateSolution();

            console.log('Puzzle generation and UI rendering completed successfully');
        } catch (processingError) {
            console.error("Error processing generated puzzle:", processingError);
            showNotification("Error processing generated puzzle. Retrying...", "error");
            setTimeout(() => {
                generatePuzzleForCurrentStage();
            }, 1000);
        }

    } else if (type === 'generationError') {
        hideLoadingModal();
        console.error("Puzzle Generation Failed:", error);
        showNotification("Puzzle generation failed. Retrying...", "error");
        setTimeout(() => {
            generatePuzzleForCurrentStage();
        }, 2000);
    } else if (type === 'progress') {
        console.log("Generation progress:", message);
    } else {
        console.warn("Unknown message type from generator worker:", type, e.data);
    }
}

function handleAbilityClick(abilityId) {
    console.log(`Attempting to use ability: ${abilityId}`);
    const abilityInstance = getAbilityInstance(abilityId);
    console.log(`Found ability instance:`, abilityInstance);

    if (!abilityInstance) {
        console.log(`No ability instance found for ${abilityId}`);
        return;
    }

    if (!abilityInstance.canUse(gauntletState)) {
        console.log(`Ability ${abilityId} cannot be used:`, abilityInstance.used, abilityInstance.type);
        return;
    }

    console.log(`Activating ability: ${abilityId}`);
    const result = abilityInstance.activate(gauntletState);
    console.log(`Ability activation result:`, result);

    const success = result === true || (result && result.success);
    const shouldMarkUsed = result === true || (result && result.shouldMarkUsed);

    if (success && abilityInstance.type === 'active' && shouldMarkUsed) {
        abilityInstance.markUsed();

        const abilityBtn = document.getElementById(`ability-btn-${abilityId}`);
        if (abilityBtn) {
            abilityBtn.disabled = true;
            console.log(`Disabled ability button for ${abilityId}`);
        }

        const echoAbility = gauntletState.abilityInstances.find(ability => ability.id === 'echo');
        if (echoAbility && echoAbility.onAbilityUsed) {
            echoAbility.onAbilityUsed(gauntletState, abilityId);
        }
    }

    saveGauntletState();
}

function handleShopAbilityClick(abilityId) {
    const tempAbility = AbilityFactory.create(abilityId);

    if (!tempAbility) {
        return;
    }

    const success = tempAbility.activate(gauntletState);

    if (success) {
        gauntletState.shopItems = gauntletState.shopItems.filter(item => item.id !== abilityId);

        const abilityBtn = document.getElementById(`ability-btn-${abilityId}-shop`);
        if (abilityBtn) {
            abilityBtn.parentElement.remove();
        }
    }

    saveGauntletState();
}

function getAbilityInstance(abilityId) {
    const actualInstance = gauntletState.abilityInstances.find(instance => instance.id === abilityId);
    if (actualInstance) {
        return actualInstance;
    }

    return window.abilities && window.abilities[abilityId];
}

function addAbilityInstance(abilityId) {
    console.log(`Adding ability instance: ${abilityId}`);
    if (window.abilities && window.abilities[abilityId]) {
        const newInstance = AbilityFactory.create(abilityId);
        console.log(`Created new instance:`, newInstance);
        gauntletState.abilityInstances.push(newInstance);
        console.log(`Added to abilityInstances. Current array:`, gauntletState.abilityInstances);

        if (newInstance.type === 'immediate') {
            newInstance.activate(gauntletState);
        }

        return newInstance;
    }
    console.log(`Failed to create ability instance for ${abilityId}`);
    return null;
}

function highlightTile(tileElement, duration = 6000) {
    tileElement.classList.add('pulsing-highlight');

    setTimeout(() => {
        tileElement.classList.remove('pulsing-highlight');
    }, duration);
}

function showConfirmationModal(title, message, onConfirm) {
    confirmTitle.textContent = title;
    confirmMessage.innerHTML = message;

    const newConfirmBtn = confirmAcceptBtn.cloneNode(true);
    confirmAcceptBtn.parentNode.replaceChild(newConfirmBtn, confirmAcceptBtn);
    confirmAcceptBtn = newConfirmBtn;

    confirmAcceptBtn.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
        onConfirm();
    }, { once: true });

    confirmationModal.style.display = 'flex';

    if (gauntletState.currentPuzzle === 8 && bossEffectsEnabled) {
        const modal = confirmationModal.children[0];
        modal.classList.add('final-boss-modal');
        modal.children[0].classList.add('final-boss-modal-title');
        modal.children[1].classList.add('final-boss-modal-message');
    }
}

function updateButtonVisibility() {
    if (devModeBtn) {
        if (window.APP_CONFIG && window.APP_CONFIG.IS_LOCAL_DEV) {
            devModeBtn.style.display = 'inline-block';
        } else {
            devModeBtn.style.display = 'none';
        }
    }

    if (bossEffectsBtn && gauntletState) {
        if (gauntletState.currentPuzzle === 8) {
            bossEffectsBtn.style.display = 'inline-block';
        } else {
            bossEffectsBtn.style.display = 'none';
        }
    }
}

function activateDevMode() {
    if (!gauntletState) {
        console.warn("Dev mode requires an active gauntlet. Start a gauntlet first.");
        return;
    }
    if (window.APP_CONFIG && !window.APP_CONFIG.IS_LOCAL_DEV) {
        console.warn("Dev mode is not available in production.");
        return;
    }
    console.log("DEV MODE: Unlocking all upgrades.");

    gauntletState.upgrades = Object.values(UPGRADES_POOL);

    for (let i = 0; i < 10; i++) {
        gauntletState.upgrades.push(UPGRADES_POOL.chronomancer);
    }

    gauntletState.abilityInstances = [];
    gauntletState.upgrades.forEach(upgrade => {
        const abilityInstance = AbilityFactory.create(upgrade.id);
        if (abilityInstance) {
            gauntletState.abilityInstances.push(abilityInstance);
            console.log(`Added ability instance: ${upgrade.id}`);
        }
    });

    if (gauntletState.upgrades.some(u => u.id === 'chronomancer')) {
        gauntletState.resetsRemaining += 10;
    }

    console.log("Dev mode activated with", gauntletState.abilityInstances.length, "ability instances");
    renderActiveGauntletUI();
    saveGauntletState();
    devModeBtn.disabled = true;
    devModeBtn.textContent = "Dev Mode Active";
}

function resetAbilityCounters() {
    const abilityCounters = document.querySelectorAll('.ability-counter');
    abilityCounters.forEach(counter => {
        counter.textContent = '';
    });

}

function updateAbilityCounters() {
}

function initSolverWorker() {
    if (solverWorker) return;

    solverWorker = new Worker('solver_worker.js');

    solverWorker.onmessage = function (e) {
        const { type, data, message } = e.data;
        console.log("Solver Worker Message:", type, data, message);

        if (type === 'result') {
            stopSolving = false;

            gauntletState.puzzles[gauntletState.currentPuzzle - 1].solutionPath = data.path;

            if (gauntletState.currentPuzzle === 8 && gauntletState.moveHistory.length > 0 && data.path && data.path.length > 0) {
                const expectedNextIndex = data.path[0].index;

                if (lastClickedIndex !== -1 && lastClickedIndex !== expectedNextIndex) {
                    console.log("Wrong move detected! Last move:", lastClickedIndex, "Expected:", expectedNextIndex);
                    shakeGrid();
                }
            }

            //TODO: this is pretty hacky, i should probably check for specific patterns (like pink being pressed twice in a row, same with green)
            if (gauntletState.moveHistory.length > 0) {
                if ((previouslyClickedColor === 'blue' && (gauntletState.moveHistory[gauntletState.moveHistory.length - 1][4] === 'green' || gauntletState.moveHistory[gauntletState.moveHistory.length - 1][4] === 'black' || gauntletState.moveHistory[gauntletState.moveHistory.length - 1][4] === 'pink')) || (previouslyClickedColor === 'black' || previouslyClickedColor === 'pink' || previouslyClickedColor === 'green') || gauntletState.currentGrid.every((value, index) => value === gauntletState.moveHistory[gauntletState.moveHistory.length - 1][index])) {
                    console.log("Possible infinite loop detected. Not updating ability counters to avoid cheating.");
                    gauntletState.moveCount--;
                } else {
                    updateAbilityCounters();
                }

            }
            if (solverWorker) {
                solverWorker.terminate();
                solverWorker = null;
            }
        }
    };

    solverWorker.onerror = function (error) {
        console.error("Solver Worker Error:", error);
        stopSolving = false;
        if (solverWorker) {
            solverWorker.terminate();
            solverWorker = null;
        }
    };
}

function recalculateSolution() {
    if (stopSolving) {
        if (solverWorker) {
            solverWorker.terminate();
            solverWorker = null;
        }
        stopSolving = false;
        return;
    }
    initSolverWorker();
    stopSolving = true;

    const MAX_STEPS = 25;
    const MAX_DEPTH_LIMIT = 25;
    const MAX_ITERATIONS = 5_000_000;

    solverWorker.postMessage({
        type: 'start',
        data: {
            initialGrid: [...gauntletState.currentGrid],
            targetCorners: { ...gauntletState.currentTargets },
            MAX_STEPS,
            MAX_DEPTH_LIMIT,
            MAX_ITERATIONS
        }
    });
}

function showNotification(message, type = 'info', duration = 1500) {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        console.error('Toast container not found!');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const messageElement = document.createElement('span');
    messageElement.textContent = message;
    toast.appendChild(messageElement);

    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close-btn';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => toast.remove(), 300);
    };
    toast.appendChild(closeButton);

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-fade-in');
    }, 10);

    const autoRemoveTimeout = setTimeout(() => {
        toast.classList.remove('toast-fade-in');
        toast.classList.add('toast-fade-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);

    closeButton.addEventListener('click', () => {
        clearTimeout(autoRemoveTimeout);
    });
}

function toggleBossEffects() {
    bossEffectsEnabled = !bossEffectsEnabled;
    console.log("Boss effects toggled:", bossEffectsEnabled ? "enabled" : "disabled");

    if (bossEffectsBtn) {
        bossEffectsBtn.textContent = `Boss Effects: ${bossEffectsEnabled ? 'ON' : 'OFF'}`;
        bossEffectsBtn.className = `button button-small ${bossEffectsEnabled ? 'button-secondary' : 'button-primary'}`;
    }

    if (gauntletState && activeScreen.style.display !== 'none') {
        renderActiveGauntletUI();
    } else {
        if (!bossEffectsEnabled) {
            document.body.classList.remove('final-boss-body');
            document.querySelector('header h1')?.classList.remove('final-boss-main-title');
            document.querySelector('.container')?.classList.remove('final-boss-container');
            document.querySelector('.modal-content')?.classList.remove('final-boss-modal');
        }
    }

    manageBossScreenOverlay();

    showNotification(`Boss effects ${bossEffectsEnabled ? 'enabled' : 'disabled'}`, "info");
}

function manageBossScreenOverlay() {
    let overlay = document.getElementById('boss-screen-overlay');

    if (bossEffectsEnabled && gauntletState && gauntletState.currentPuzzle === 8) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'boss-screen-overlay';
            overlay.className = 'final-boss-screen-overlay';
            document.body.appendChild(overlay);
        }
    } else {
        if (overlay) {
            overlay.remove();
        }
    }
}

function shakeGrid() {
    if (!bossEffectsEnabled || gauntletState.currentPuzzle !== 8) return;

    const gridContainer = document.getElementById('gauntlet-grid-container');
    if (gridContainer) {
        gridContainer.style.animation = 'none';
        gridContainer.offsetHeight;
        gridContainer.style.animation = 'gridShake 0.5s ease-in-out';

        setTimeout(() => {
            gridContainer.style.animation = '';
        }, 500);
    }
}

function showLoadingModal() {
    console.log('showLoadingModal called, loadingModal element:', loadingModal);

    if (!loadingModal) {
        console.error('Loading modal element not found! Trying to find it again...');
        loadingModal = document.getElementById('loading-modal');


        if (!loadingModal) {
            console.error('Loading modal element still not found after retry');
            showNotification("Generating puzzle...", "info", 10000);
            return;
        }
    }

    const stage = gauntletState ? gauntletState.currentPuzzle : 1;
    const isFinalBoss = stage === 8;

    const title = isFinalBoss ? "Preparing Final Challenge..." : "Generating Puzzle...";
    const message = isFinalBoss ?
        "The ultimate test is being forged. Steel yourself for what lies ahead." :
        `Creating your stage ${stage} challenge. This may take a moment.`;

    const titleElement = loadingModal.querySelector('h2');
    const messageElement = loadingModal.querySelector('p');

    let retryButton = loadingModal.querySelector('.retry-button');
    if (!retryButton) {
        retryButton = document.createElement('button');
        retryButton.className = 'button button-secondary retry-button';
        retryButton.textContent = 'Retry Generation';
        retryButton.style.marginTop = '20px';
        retryButton.onclick = () => {
            console.log('Manual retry triggered');
            hideLoadingModal();
            setTimeout(() => {
                generatePuzzleForCurrentStage();
            }, 500);
        };

        const modalContent = loadingModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.appendChild(retryButton);
        }
    }

    if (titleElement) titleElement.textContent = title;
    if (messageElement) messageElement.textContent = message;

    console.log('Setting loading modal display to flex');
    loadingModal.style.display = 'flex';
    loadingModal.style.visibility = 'visible';
    loadingModal.style.opacity = '1';
    loadingModal.style.zIndex = '10000';
}

function hideLoadingModal() {
    if (loadingModal) {
        loadingModal.style.display = 'none';
    }
}

//TODO MOVE THIS LOGIC IN ABILITIES??
function handleInsightClick(index) {
    const currentPuzzleData = gauntletState.puzzles[gauntletState.currentPuzzle - 1];

    if (!currentPuzzleData) {
        console.error('No puzzle data found for current puzzle');
        showNotification("No puzzle data available for Insight", "error");
        gauntletState.isInsightModeActive = false;
        document.getElementById('gauntlet-grid').classList.remove('insight-mode-active');
        document.getElementById('ability-btn-insight').classList.remove('is-active');
        return;
    }

    let finalGrid = [...currentPuzzleData.initialGrid];
    if (currentPuzzleData.originalSolutionPath) {
        currentPuzzleData.originalSolutionPath.forEach(step => {
            finalGrid = performAction(finalGrid, step.index);
        });
    }
    if (currentPuzzleData && finalGrid) {
        const finalColor = finalGrid[index];
        const clickedCell = document.querySelector(`#gauntlet-grid .cell[data-index='${index}']`);

        const originalColor = clickedCell.style.backgroundColor;
        clickedCell.style.transition = 'background-color 1s ease-in-out';
        clickedCell.style.backgroundColor = colors[finalColor].hex;
        clickedCell.classList.add('insight-flash');

        setTimeout(() => {
            clickedCell.style.backgroundColor = originalColor;
            clickedCell.classList.remove('insight-flash');
            clickedCell.style.transition = 'background-color 0.3s ease-in-out';
        }, 2000);

    }

    gauntletState.isInsightModeActive = false;
    document.getElementById('gauntlet-grid').classList.remove('insight-mode-active');
    document.getElementById('ability-btn-insight').classList.remove('is-active');

    const insightAbility = gauntletState.abilityInstances.find(instance => instance.id === 'insight');
    if (insightAbility) {
        insightAbility.markUsed();
    }

    document.getElementById('ability-btn-insight').disabled = true;
    saveGauntletState();
}

function getPuzzleTitle(puzzleNumber) {
    if (puzzleNumber === 8) {
        return "🟦 THE WILL OF THE HEIR 🟦";
    }

    return getRandomErajanStageName();
}

function advanceToNextPuzzle() {
    gauntletState.currentPuzzle++;
    gauntletState.puzzleSolved = false;
    gauntletState.moveCount = 0;
    gauntletState.moveHistory = [];
    gauntletState.resetsUsed = 0;
    gauntletState.lastLeewayUse = -Infinity;
    gauntletState.bossClickCount = 0;
    gauntletState.isInsightModeActive = false;

    gauntletState.abilityInstances.forEach(ability => {
        ability.reset();
        ability.onPuzzleStart(gauntletState);
    });

    updateButtonVisibility();

    saveGauntletState();
    generatePuzzleForCurrentStage();
}

function showGauntletCompleteModal() {
    const modal = document.getElementById('gauntlet-complete-modal');
    const modalContent = modal.querySelector('.modal-content');

    modalContent.innerHTML = `
        <h2>🎉 Gauntlet Complete! 🎉</h2>
        <div style="text-align: center; margin: 20px 0;">
            <h3>Run Statistics</h3>
            <p><strong>Total Gold Earned:</strong> 💰 ${gauntletState.totalGoldEarned}</p>
            <p><strong>Final Gold Balance:</strong> 💰 ${gauntletState.gold}</p>
            <p><strong>Abilities Collected:</strong> ${gauntletState.abilityInstances.length}</p>
        </div>
        <p>Congratulations! You have conquered the Mora Jai Gauntlet! Your run has been cleared.</p>
        <div class="controls" style="justify-content: center;">
            <button id="gauntlet-complete-ok-btn" class="button">Back to Start</button>
        </div>
    `;

    const okBtn = modalContent.querySelector('#gauntlet-complete-ok-btn');
    okBtn.addEventListener('click', handleGauntletComplete);

    modal.style.display = 'flex';
}

function showShop(goldData) {
    const modalContent = shopModal.querySelector('.modal-content');
    const existingTitle = modalContent.querySelector('h2');

    let goldEarnedHtml = `<div style="color: #ffd700; font-size: 0.9em; margin: 10px 0;">
        <strong>+${goldData.total} gold earned!</strong>`;

    if (goldData.bonuses.length > 0) {
        goldEarnedHtml += `<br><small style="color: #ffec8b;">${goldData.bonuses.join(' • ')}</small>`;
    }

    goldEarnedHtml += `</div>`;

    existingTitle.innerHTML = `🏪 Merchant's Shop
        ${goldEarnedHtml}
        <div style="font-size: 0.8em; color: #ffd700; margin-top: 5px;">💰 ${gauntletState.gold} gold available</div>`;

    shopItemsContainer.innerHTML = '';

    const availableItems = Object.values(SHOP_ITEMS);
    const shopSize = gauntletState.currentPuzzle === 4 ? 3 : 4; // shop 2 has more items
    const selectedItems = getRandomShopItems(availableItems, shopSize);

    selectedItems.forEach(item => {
        const randomizedPrice = getRandomizedShopPrice(item.id);
        const canAfford = gauntletState.gold >= randomizedPrice;
        const card = document.createElement('div');
        card.className = `shop-item-card ${!canAfford ? 'shop-item-disabled' : ''}`;
        card.innerHTML = `
            <div class="shop-item-icon">
                <svg viewBox="0 0 24 24">${item.icon}</svg>
            </div>
            <div class="shop-item-info">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="shop-item-price">💰 ${randomizedPrice} gold</div>
            </div>
        `;

        card.setAttribute('data-price', randomizedPrice);

        if (canAfford) {
            card.addEventListener('click', () => purchaseShopItem(item.id, randomizedPrice));
        }

        shopItemsContainer.appendChild(card);
    });

    shopModal.style.display = 'flex';
}

function purchaseShopItem(itemId, price) {
    const item = SHOP_ITEMS[itemId];
    const actualPrice = price || getRandomizedShopPrice(itemId);

    if (gauntletState.gold < actualPrice) {
        showNotification("Not enough gold!", "error");
        return;
    }

    gauntletState.gold -= actualPrice;

    if (item.type === 'consumable') {
        if (itemId === 'extra_reset') {
            gauntletState.resetsRemaining++;
            showNotification(`+1 Reset gained!`, "success");
        } else if (itemId === 'hint_scroll') {
            gauntletState.shopItems.push({ id: 'insight', name: 'Insight (Scroll)', temporary: true });
            showNotification(`Insight scroll purchased!`, "success");
        } else if (itemId === 'guidance_scroll') {
            gauntletState.shopItems.push({ id: 'guidance', name: 'Guidance (Scroll)', temporary: true });
            showNotification(`Guidance scroll purchased!`, "success");
        }
    } else if (item.type === 'temporary_buff') {
        gauntletState.temporaryBuffs.push(itemId);
        showNotification(`${item.name} activated!`, "success");
    }

    const goldDisplay = shopModal.querySelector('h2').innerHTML;
    const updatedDisplay = goldDisplay.replace(/💰 \d+ gold available/, `💰 ${gauntletState.gold} gold available`);
    shopModal.querySelector('h2').innerHTML = updatedDisplay;

    const cards = shopItemsContainer.querySelectorAll('.shop-item-card');
    cards.forEach(card => {
        if (card.querySelector('h3').textContent === item.name) {
            card.classList.add('shop-item-purchased');
            card.style.pointerEvents = 'none';
            card.style.opacity = '0.5';
            const priceEl = card.querySelector('.shop-item-price');
            priceEl.innerHTML = '✅ PURCHASED';
            priceEl.style.color = '#00ff00';
        }
    });

    cards.forEach(card => {
        const cardPrice = parseInt(card.getAttribute('data-price') || '0');
        const canAfford = gauntletState.gold >= cardPrice;

        if (!canAfford && !card.classList.contains('shop-item-purchased')) {
            card.classList.add('shop-item-disabled');
            card.style.pointerEvents = 'none';
        }
    });

    saveGauntletState();
}

function getUpgradeRarity(upgradeId) {
    const abilityInstance = AbilityFactory.create(upgradeId);
    return abilityInstance ? abilityInstance.rarity : 'common';
}

function getUpgradeCategory(upgradeId) {
    return UPGRADE_CATEGORIES[upgradeId] || 'utility';
}

function getRarityColor(rarity) {
    return RARITY_COLORS[rarity] || RARITY_COLORS.common;
}

function getCategoryInfo(category) {
    return CATEGORY_INFO[category] || CATEGORY_INFO.utility;
}