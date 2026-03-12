// settings.js – Würfel-Einstellungen

const DEFAULT_DICE_SETTINGS = {
    'BL Top 6': { min: 1, max: 6, label: '1. Bundesliga (Top 6)' },
    'BL':       { min: 1, max: 5, label: '1. Bundesliga (Übrige)' },
    '2.BL':     { min: 0, max: 4, label: '2. Bundesliga' },
    '3.Liga':   { min: 0, max: 3, label: '3. Liga' },
    '4.Liga':   { min: 0, max: 2, label: '4. Liga / Regional' }
};

function getDiceSettings() {
    const stored = localStorage.getItem('dfbpokal_dice_settings');
    if (stored) return JSON.parse(stored);
    return Object.fromEntries(
        Object.entries(DEFAULT_DICE_SETTINGS).map(([k, v]) => [k, { min: v.min, max: v.max }])
    );
}

function saveDiceSettings(settings) {
    localStorage.setItem('dfbpokal_dice_settings', JSON.stringify(settings));
}
