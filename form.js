// form.js – Team-Formkurven & Formfaktor

const FORM_BASELINES = {
    'BL Top 6': { wProb: 0.55, dProb: 0.25 },
    'BL':       { wProb: 0.45, dProb: 0.28 },
    '2.BL':     { wProb: 0.38, dProb: 0.28 },
    '3.Liga':   { wProb: 0.33, dProb: 0.30 },
    '4.Liga':   { wProb: 0.28, dProb: 0.32 }
};

const LEAGUE_SIZES = {
    'BL Top 6': 18, 'BL': 18, '2.BL': 18, '3.Liga': 20, '4.Liga': 18
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

function setTeamTablePosOverride(teamName, pos) {
    const data = loadFormData();
    if (!data[teamName]) data[teamName] = { results: ['D','D','D','D','D'], override: null };
    data[teamName].tablePosOverride = (pos !== null && pos !== '') ? Math.max(1, Math.min(20, Number(pos))) : null;
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

function calcTableFactor(pos, division) {
    const size = LEAGUE_SIZES[division] || 18;
    return parseFloat(((size - pos) / (size - 1) * 2 - 1).toFixed(1));
}

function getEffectiveTableFactor(teamName, division) {
    const entry = getTeamForm(teamName);
    const pos = (entry.tablePosOverride != null) ? entry.tablePosOverride : entry.tablePos;
    if (pos == null) return 0;
    return calcTableFactor(pos, division);
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

// ── OpenLigaDB API ────────────────────────────────────────────────────────────

const OPENLIGADB_LEAGUES = ['bl1', 'bl2', 'bl3'];

// Normalisiert einen Teamnamen für fuzzy-Matching
function _normName(n) {
    return n.toLowerCase()
        .replace(/^(fc |sv |1\. fc |1\. fsv |sc |rb |vfb |vfl |sg |ssv |dsv |bv |tsg |bayer 04 |borussia |dynamo |rot-weiss |rot-weiß |energie |eintracht |fortuna |hansa |arminia |preußen |stuttgarter )/g, '')
        .replace(/ü/g,'u').replace(/ä/g,'a').replace(/ö/g,'o').replace(/ß/g,'ss')
        .replace(/\s*(1846|98|07|05|04|03|02|01)\s*$/g, '')
        .trim();
}

function _namesMatch(a, b) {
    const na = _normName(a), nb = _normName(b);
    return na === nb || na.startsWith(nb) || nb.startsWith(na) ||
           na.includes(nb.slice(0, 6)) || nb.includes(na.slice(0, 6));
}

function _getFinalScore(match) {
    const results = match.MatchResults || [];
    if (!results.length) return null;
    const final = results.reduce((a, b) => a.ResultOrderID > b.ResultOrderID ? a : b);
    return { home: final.PointsTeam1, away: final.PointsTeam2 };
}

function _resultForTeam(teamName, match) {
    const score = _getFinalScore(match);
    if (!score) return null;
    const isHome = _namesMatch(teamName, match.Team1.TeamName);
    const isAway = !isHome && _namesMatch(teamName, match.Team2.TeamName);
    if (!isHome && !isAway) return null;
    const mine = isHome ? score.home : score.away;
    const opp  = isHome ? score.away : score.home;
    return mine > opp ? 'W' : mine < opp ? 'L' : 'D';
}

function _detectSeason(stichtag) {
    const d = new Date(stichtag);
    return d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
}

function _computeTable(matches) {
    const t = {};
    matches.forEach(m => {
        const score = _getFinalScore(m);
        if (!score) return;
        const n1 = m.Team1.TeamName, n2 = m.Team2.TeamName;
        if (!t[n1]) t[n1] = { name: n1, pts: 0, gd: 0, played: 0 };
        if (!t[n2]) t[n2] = { name: n2, pts: 0, gd: 0, played: 0 };
        t[n1].played++; t[n2].played++;
        t[n1].gd += score.home - score.away;
        t[n2].gd += score.away - score.home;
        if (score.home > score.away)       { t[n1].pts += 3; }
        else if (score.home < score.away)  { t[n2].pts += 3; }
        else                               { t[n1].pts++;  t[n2].pts++; }
    });
    return Object.values(t).sort((a, b) => b.pts - a.pts || b.gd - a.gd);
}

async function loadFormFromAPI(stichtag, onProgress) {
    const season = _detectSeason(stichtag);
    const cutoff = new Date(stichtag);
    cutoff.setUTCHours(23, 59, 59, 999);

    // Alle 3 Ligen parallel laden
    onProgress('Lade Spielpaarungen von OpenLigaDB…');
    const fetches = await Promise.allSettled(
        OPENLIGADB_LEAGUES.map(l =>
            fetch(`https://api.openligadb.de/getmatchdata/${l}/${season}`)
                .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
                .then(data => ({ league: l, matches: data }))
        )
    );

    const leagueMatches = {};   // { bl1: [...], bl2: [...], bl3: [...] }
    fetches.forEach(f => {
        if (f.status === 'fulfilled') {
            const { league, matches } = f.value;
            leagueMatches[league] = matches.filter(m => {
                const dtStr = m.MatchDateTimeUTC || m.MatchDateTime;
                if (!dtStr) return false;
                return new Date(dtStr) <= cutoff;
            });
        }
    });

    const allPlayed = Object.values(leagueMatches).flat();
    if (!allPlayed.length) {
        const totalFetched = fetches.filter(f => f.status === 'fulfilled').reduce((s, f) => s + f.value.matches.length, 0);
        throw new Error(`Keine abgeschlossenen Spiele vor dem Stichtag gefunden. (${totalFetched} Spiele geladen, Stichtag: ${cutoff.toISOString()})`);
    }

    // Tabellen berechnen
    const tables = {};
    Object.entries(leagueMatches).forEach(([l, ms]) => {
        tables[l] = _computeTable(ms);
    });

    const teams = getAllTeams();
    const allTeams = [...teams.pro, ...teams.amateur];
    const formData = loadFormData();
    let matched = 0;

    allTeams.forEach(team => {
        // Suche in allen Ligen nach Spielen dieses Teams
        let teamMatches = allPlayed
            .filter(m => _namesMatch(team.name, m.Team1.TeamName) || _namesMatch(team.name, m.Team2.TeamName))
            .sort((a, b) => new Date(a.MatchDateTimeUTC) - new Date(b.MatchDateTimeUTC));

        if (!teamMatches.length) return;
        matched++;

        const last5 = teamMatches.slice(-5);
        const results = last5.map(m => _resultForTeam(team.name, m)).filter(Boolean);
        while (results.length < 5) results.unshift('D');

        // Tabellenposition ermitteln
        let tablePos = null, tablePts = null, tablePlayed = null;
        for (const [, table] of Object.entries(tables)) {
            const entry = table.find(r => _namesMatch(team.name, r.name));
            if (entry) {
                tablePos    = table.indexOf(entry) + 1;
                tablePts    = entry.pts;
                tablePlayed = entry.played;
                break;
            }
        }

        if (!formData[team.name]) formData[team.name] = { override: null };
        formData[team.name].results    = results.slice(-5);
        formData[team.name].override   = null;
        formData[team.name].apiDate    = stichtag;
        formData[team.name].tablePos   = tablePos;
        formData[team.name].tablePts   = tablePts;
        formData[team.name].tablePlayed = tablePlayed;
    });

    onProgress(`✅ ${matched} von ${allTeams.length} Teams geladen (Saison ${season}/${season+1})`);
    return { formData, matched, total: allTeams.length };
}

// ─────────────────────────────────────────────────────────────────────────────

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
