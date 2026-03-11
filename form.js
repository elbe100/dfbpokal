// form.js – Team-Formkurven & Formfaktor

const FORM_BASELINES = {
    'BL Top 6': { wProb: 0.55, dProb: 0.25 },
    'BL':       { wProb: 0.45, dProb: 0.28 },
    '2.BL':     { wProb: 0.38, dProb: 0.28 },
    '3.Liga':   { wProb: 0.33, dProb: 0.30 },
    '4.Liga':   { wProb: 0.28, dProb: 0.32 }
};

function loadFormData() {
    const stored = localStorage.getItem('dfbpokal_form');
    return stored ? JSON.parse(stored) : {};
}

function saveFormData(data) {
    localStorage.setItem('dfbpokal_form', JSON.stringify(data));
}

function getTeamForm(teamName) {
    const data = loadFormData();
    return data[teamName] || { results: ['D', 'D', 'D', 'D', 'D'], override: null };
}

function setTeamResults(teamName, results) {
    const data = loadFormData();
    if (!data[teamName]) data[teamName] = { results, override: null };
    else data[teamName].results = results;
    saveFormData(data);
}

function setTeamOverride(teamName, value) {
    const data = loadFormData();
    if (!data[teamName]) data[teamName] = { results: ['D','D','D','D','D'], override: null };
    data[teamName].override = (value !== null && value !== '') ? Math.max(-2, Math.min(2, Number(value))) : null;
    saveFormData(data);
}

function calcFormFactor(results) {
    const pts = results.reduce((s, r) => s + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0);
    // Normalize: 0–15 pts → -2 to +2
    return parseFloat(((pts - 7.5) / 7.5 * 2).toFixed(1));
}

function getEffectiveFormFactor(teamName) {
    const entry = getTeamForm(teamName);
    if (entry.override !== null && entry.override !== undefined && entry.override !== '') {
        return Number(entry.override);
    }
    return calcFormFactor(entry.results);
}

function suggestFormForTeam(team) {
    const baseline = FORM_BASELINES[team.division] || { wProb: 0.33, dProb: 0.34 };
    const results = [];
    for (let i = 0; i < 5; i++) {
        const r = Math.random();
        if (r < baseline.wProb) results.push('W');
        else if (r < baseline.wProb + baseline.dProb) results.push('D');
        else results.push('L');
    }
    return results;
}

function suggestFormForAll(allTeams) {
    const data = loadFormData();
    allTeams.forEach(team => {
        if (!data[team.name]) data[team.name] = { results: ['D','D','D','D','D'], override: null };
        data[team.name].results = suggestFormForTeam(team);
        data[team.name].override = null; // clear overrides on regeneration
    });
    return data;
}

function getFormStatsByDivision(allTeams) {
    const stats = {};
    allTeams.forEach(team => {
        const div = team.division;
        if (!stats[div]) stats[div] = { teams: [] };
        const factor = getEffectiveFormFactor(team.name);
        stats[div].teams.push({ name: team.name, factor });
    });
    Object.keys(stats).forEach(div => {
        const teams = stats[div].teams;
        const avg = teams.reduce((s, t) => s + t.factor, 0) / teams.length;
        const sorted = [...teams].sort((a, b) => b.factor - a.factor);
        stats[div].avg = parseFloat(avg.toFixed(1));
        stats[div].best = sorted[0];
        stats[div].worst = sorted[sorted.length - 1];
    });
    return stats;
}
