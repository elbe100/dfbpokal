// app.js - Main Application Logic

let tournament = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    tournament = new Tournament();
    setupNavigationListeners();
    renderSetupSection();
}

function setupNavigationListeners() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Entferne active class von allen
            navBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            
            // Füge active class zu aktuellem Button hinzu
            e.target.classList.add('active');
            
            // Zeige entsprechende Section
            const sectionId = e.target.dataset.section;
            document.getElementById(sectionId).classList.add('active');
            
            // Render Inhalte
            if (sectionId === 'matches') renderMatchesSection();
            if (sectionId === 'stats') renderStatsSection();
            if (sectionId === 'sieger') renderSiegerSection();
            if (sectionId === 'form') renderFormSection();
            if (sectionId === 'settings') renderSettingsSection();
        });
    });
}

function renderSetupSection() {
    const teams = getAllTeams();
    
    // Renderiere Pro Teams
    const proContainer = document.getElementById('profi-teams');
    proContainer.innerHTML = teams.pro
        .map(team => `<div class="team-item pro">${team.name} (${team.division})</div>`)
        .join('');
    
    // Renderiere Amateur Teams
    const amateurContainer = document.getElementById('amateur-teams');
    amateurContainer.innerHTML = teams.amateur
        .map(team => `<div class="team-item amateur">${team.name} (${team.division})</div>`)
        .join('');
    
    // Start Button
    const startBtn = document.getElementById('start-tournament');
    startBtn.addEventListener('click', () => {
        tournament.start();
        renderMatchesSection();
        switchToSection('matches');
    });
}

function renderMatchesSection() {
    const container = document.getElementById('matches-container');
    const roundInfo = document.getElementById('match-round-info');
    
    if (tournament.currentRound === 0) {
        container.innerHTML = '<p>Starten Sie das Turnier im Setup-Tab um Spiele zu sehen.</p>';
        roundInfo.innerHTML = '';
        return;
    }

    const playedMatches = tournament.matches.filter(m => m.result !== null).length;
    const totalMatches = tournament.matches.length;
    const allDone = playedMatches === totalMatches;

    roundInfo.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
            <div>
                <h3 style="margin: 0;">Runde ${tournament.currentRound}</h3>
                <p style="margin: 0.25rem 0 0;">Gespielt: ${playedMatches}/${totalMatches}</p>
            </div>
            ${!allDone ? `<button id="roll-all-btn" class="btn-primary">🎲 Alle würfeln</button>` : ''}
        </div>
    `;

    container.innerHTML = tournament.matches
        .map((match) => renderMatchCard(match))
        .join('');

    // Event Listener für Würfel Buttons
    document.querySelectorAll('.btn-roll-dice').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const matchId = parseInt(e.target.dataset.matchId);
            playMatch(matchId);
        });
    });

    // Event Listener für "Alle würfeln"
    const rollAllBtn = document.getElementById('roll-all-btn');
    if (rollAllBtn) {
        rollAllBtn.addEventListener('click', () => playAllMatches());
    }

    // Event Listener für Next Round Button
    const nextRoundBtn = document.getElementById('next-round-btn');
    if (nextRoundBtn) {
        nextRoundBtn.addEventListener('click', () => {
            tournament.continueToNextRound();
            renderMatchesSection();
        });
    }
}

function renderMatchCard(match) {
    const isPlayed = match.result !== null;
    const homeTeamClass = match.homeType === 'amateur' ? 'home' : '';
    const awayTeamClass = match.awayType === 'amateur' ? 'away' : '';

    let diceDisplay = `
        <div class="match-team ${homeTeamClass}">
            <span class="team-name">${match.home.name}</span>
            <span class="team-division">${match.home.division}</span>
            ${isPlayed ? `<span class="dice-value">${match.result.homeTotal || match.diceResult.home}</span>` : 
                        `<span class="dice-value pending">-</span>`}
        </div>
        <div class="vs-separator">vs</div>
        <div class="match-team ${awayTeamClass}">
            <span class="team-name">${match.away.name}</span>
            <span class="team-division">${match.away.division}</span>
            ${isPlayed ? `<span class="dice-value">${match.result.awayTotal || match.diceResult.away}</span>` : 
                        `<span class="dice-value pending">-</span>`}
        </div>
    `;

    let resultDisplay = '';
    if (isPlayed) {
        const winner = match.result.winner === 'home' ? match.home.name : match.away.name;
        const extraInfo = match.result.extraTime ? ' (n.V.)' : '';
        const penaltyInfo = match.result.penalties ? ` (11m: ${match.result.homeScore}:${match.result.awayScore})` : '';
        resultDisplay = `<div style="text-align: center; margin-top: 1rem; padding: 0.5rem; background: #e8f5e9; border-radius: 4px;"><strong>${winner}${extraInfo}${penaltyInfo}</strong></div>`;
    }

    const actionButton = isPlayed ? 
        '' : 
        `<button class="btn-small btn-roll-dice" data-match-id="${match.id}">🎲 Würfeln</button>`;

    return `
        <div class="match-card ${homeTeamClass || awayTeamClass ? homeTeamClass || awayTeamClass : ''}">
            ${diceDisplay}
            <div class="match-actions">
                ${actionButton}
            </div>
            ${resultDisplay}
        </div>
    `;
}

function playMatch(matchId) {
    tournament.playMatch(matchId);
    finishRoundIfComplete();
}

function playAllMatches() {
    tournament.matches
        .filter(m => m.result === null)
        .forEach(m => tournament.playMatch(m.id));
    finishRoundIfComplete();
}

function finishRoundIfComplete() {
    const allPlayed = tournament.matches.every(m => m.result !== null);
    if (allPlayed && tournament.currentRound > 0) {
        const winners = tournament.getWinnersOfRound();
        if (winners.length === 1) {
            // Finale abgeschlossen – sofort speichern
            saveTournamentWinner();
            renderMatchesSection();
            alert('🏆 Turnier abgeschlossen! ' + tournament.getTournamentWinner().name + ' ist Pokalsieger!');
        } else {
            renderMatchesSection();
            addNextRoundButton();
        }
    } else {
        renderMatchesSection();
    }
}

function addNextRoundButton() {
    if (document.getElementById('next-round-btn')) return;
    const roundInfo = document.getElementById('match-round-info');
    const btn = document.createElement('button');
    btn.id = 'next-round-btn';
    btn.className = 'btn-primary';
    btn.textContent = '▶ Nächste Runde';
    btn.style.margin = '0';
    roundInfo.querySelector('div').appendChild(btn);
    btn.addEventListener('click', () => {
        tournament.continueToNextRound();
        renderMatchesSection();
    });
}


function renderStatsSection() {
    const stats = tournament.getStatistics();
    const container = document.getElementById('stats-container');

    const winner = tournament.getTournamentWinner();
    
    let winnerCard = '';
    if (winner) {
        winnerCard = `
            <div class="stat-card" style="background: linear-gradient(135deg, #fff700 0%, #ffd700 100%); color: #333;">
                <h4 style="color: #333;">🏆 Pokalsieger</h4>
                <div class="stat-value" style="color: #333;">${winner.name}</div>
            </div>
        `;
    }

    const html = `
        ${winnerCard}
        <div class="stat-card">
            <h4>Runde</h4>
            <div class="stat-value">${stats.currentRound}</div>
            <div class="stat-label">Aktuelle Runde</div>
        </div>
        <div class="stat-card">
            <h4>Spiele</h4>
            <div class="stat-value">${stats.totalMatches}</div>
            <div class="stat-label">Gesamt Partien</div>
        </div>
        <div class="stat-card">
            <h4>Verbliebene Teams</h4>
            <div class="stat-value">${stats.remainingTeams}</div>
            <div class="stat-label">noch im Turnier</div>
        </div>
        <div class="stat-card">
            <h4>Ausgeschiedene Profis</h4>
            <div class="stat-value">${stats.proTeamsEliminated}</div>
            <div class="stat-label">aus Profi-Topf</div>
        </div>
        <div class="stat-card">
            <h4>Ausgeschiedene Amateure</h4>
            <div class="stat-value">${stats.amateurTeamsEliminated}</div>
            <div class="stat-label">aus Amateur-Topf</div>
        </div>
    `;

    container.innerHTML = html;
}

function switchToSection(sectionId) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

    const btn = document.querySelector(`[data-section="${sectionId}"]`);
    if (btn) btn.classList.add('active');

    const section = document.getElementById(sectionId);
    if (section) section.classList.add('active');
}

// --- Team-Form ---

function renderFormSection() {
    const container = document.getElementById('form-container');
    const allTeams = getAllTeams();
    const teams = [...allTeams.pro, ...allTeams.amateur];
    const stats = getFormStatsByDivision(teams);

    // Standard-Stichtag: heute
    const todayStr = new Date().toISOString().slice(0, 10);
    const savedDate = localStorage.getItem('dfbpokal_stichtag') || todayStr;

    container.innerHTML = `
        <div class="form-api-bar">
            <label class="form-api-label">Stichtag
                <input type="date" id="stichtag-input" value="${savedDate}" max="${todayStr}">
            </label>
            <button id="load-api-btn" class="btn-primary">🌐 Daten laden</button>
            <span id="api-status" class="form-api-status"></span>
        </div>
        <div class="form-actions-bar">
            <button id="suggest-form-btn" class="btn-small">🎲 Zufalls-Vorschlag</button>
            <button id="reset-form-btn" class="btn-small">↩ Zurücksetzen</button>
        </div>
        <div class="form-stats-panel" id="form-stats-panel">
            ${renderFormStats(stats)}
        </div>
        <div class="form-teams-grid" id="form-teams-grid">
            ${teams.map(t => renderFormTeamCard(t)).join('')}
        </div>
    `;

    // Event-Delegation für W/D/L Badges
    document.getElementById('form-teams-grid').addEventListener('click', e => {
        const badge = e.target.closest('.form-result-badge');
        if (!badge) return;
        const teamName = badge.dataset.team;
        const idx = parseInt(badge.dataset.idx);
        const form = getTeamForm(teamName);
        const cycle = { W: 'D', D: 'L', L: 'W' };
        form.results[idx] = cycle[form.results[idx]];
        setTeamResults(teamName, form.results);
        rerenderFormCard(teamName, teams);
    });

    // Override-Inputs (Form-Faktor und Tabellenplatz)
    document.getElementById('form-teams-grid').addEventListener('change', e => {
        const teamName = e.target.dataset.team;
        const val = e.target.value.trim();
        if (e.target.classList.contains('form-override-input')) {
            setTeamOverride(teamName, val === '' ? null : parseFloat(val));
            rerenderFormCard(teamName, teams);
        } else if (e.target.classList.contains('form-tablepos-input')) {
            setTeamTablePosOverride(teamName, val === '' ? null : parseInt(val));
            rerenderFormCard(teamName, teams);
        }
    });

    document.getElementById('suggest-form-btn').addEventListener('click', () => {
        if (confirm('Zufällige Formwerte für alle 64 Teams generieren (Overrides werden zurückgesetzt)?')) {
            saveFormData(suggestFormForAll(teams));
            renderFormSection();
        }
    });

    document.getElementById('reset-form-btn').addEventListener('click', () => {
        if (confirm('Alle Formwerte zurücksetzen?')) {
            saveFormData({});
            renderFormSection();
        }
    });

    // API-Laden
    document.getElementById('load-api-btn').addEventListener('click', async () => {
        const stichtag = document.getElementById('stichtag-input').value;
        if (!stichtag) return;
        localStorage.setItem('dfbpokal_stichtag', stichtag);

        const btn = document.getElementById('load-api-btn');
        const status = document.getElementById('api-status');
        btn.disabled = true;
        btn.textContent = '⏳ Lädt…';
        status.textContent = '';
        status.className = 'form-api-status';

        try {
            const { formData, matched, total } = await loadFormFromAPI(stichtag, msg => {
                status.textContent = msg;
            });
            saveFormData(formData);
            status.textContent = `✅ ${matched}/${total} Teams • Saison aus Stichtag ${stichtag}`;
            status.classList.add('form-api-ok');
            renderFormSection();
        } catch (err) {
            status.textContent = '❌ ' + err.message;
            status.classList.add('form-api-err');
        } finally {
            btn.disabled = false;
            btn.textContent = '🌐 Daten laden';
        }
    });
}

function renderFormStats(stats) {
    const order = ['BL Top 6', 'BL', '2.BL', '3.Liga', '4.Liga'];
    return order.map(div => {
        const s = stats[div];
        if (!s) return '';
        const sign = v => (v > 0 ? '+' : '') + v.toFixed(1);
        const avgClass = s.avg > 0.3 ? 'form-factor-positive' : s.avg < -0.3 ? 'form-factor-negative' : 'form-factor-neutral';
        return `
            <div class="form-stat-card">
                <div class="form-stat-division">${div}</div>
                <div class="form-stat-avg ${avgClass}">Ø ${sign(s.avg)}</div>
                <div class="form-stat-extremes">
                    <span title="${s.best.name}">▲ ${sign(s.best.factor)}</span>
                    <span title="${s.worst.name}">▼ ${sign(s.worst.factor)}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderFormTeamCard(team) {
    const form = getTeamForm(team.name);
    const autoFactor = calcFormFactor(form.results);
    const effective = getEffectiveFormFactor(team.name);
    const hasOverride = form.override !== null && form.override !== undefined;
    const safeId = team.name.replace(/[^a-z0-9]/gi, '_');

    const badges = form.results.map((r, idx) => `
        <span class="form-result-badge form-result-${r.toLowerCase()}"
              data-team="${team.name}" data-idx="${idx}">${r}</span>
    `).join('');

    const fClass = v => v > 0.3 ? 'form-factor-positive' : v < -0.3 ? 'form-factor-negative' : 'form-factor-neutral';
    const sign = v => (v > 0 ? '+' : '') + v.toFixed(1);

    // Tabellenplatz: Override > API
    const hasApiData = !!form.apiDate;
    const hasPosOverride = form.tablePosOverride != null;
    const displayPos = hasPosOverride ? form.tablePosOverride : (form.tablePos || '');
    const tableFactor = getEffectiveTableFactor(team.name, team.division);
    const totalBonus = parseFloat((effective + tableFactor).toFixed(1));

    const apiLabel = hasApiData
        ? `<span class="form-api-badge" title="Daten vom ${form.apiDate}">API ${form.apiDate}</span>`
        : '';
    const noMatchLabel = (hasApiData && !form.tablePos && !hasPosOverride)
        ? `<span class="form-api-badge form-api-nomatch">kein Treffer</span>`
        : '';

    return `
        <div class="form-team-card" id="form-card-${safeId}">
            <div class="form-team-header">
                <span class="form-team-name">${team.name}</span>
                <span class="form-division-badge">${team.division}</span>
            </div>
            <div class="form-results-row">${badges}</div>
            <div class="form-table-row">
                <label class="form-table-edit-label">Platz:
                    <input type="number" class="form-tablepos-input" data-team="${team.name}"
                           min="1" max="20" step="1" placeholder="–"
                           value="${displayPos}"
                           title="Tabellenplatz (1=Erster)">
                </label>
                ${form.tablePts != null ? `<span class="form-table-pts">${form.tablePts} Pkt</span>` : ''}
                ${form.tablePlayed != null ? `<span class="form-table-played">${form.tablePlayed} Sp.</span>` : ''}
                <span class="form-factor-value ${fClass(tableFactor)}" title="Tabellenfaktor">${sign(tableFactor)}</span>
                ${hasPosOverride ? `<span title="Manuell" style="font-size:0.75rem;">✏️</span>` : apiLabel}
                ${noMatchLabel}
            </div>
            <div class="form-factor-row">
                <span class="form-factor-label">Form:</span>
                <span class="form-factor-value ${fClass(autoFactor)}">${sign(autoFactor)}</span>
                ${hasOverride ? `<span title="Manuell überschrieben" style="font-size:0.75rem;">✏️</span>` : ''}
                <span class="form-factor-label" style="margin-left:0.5rem;">Gesamt:</span>
                <span class="form-factor-value ${fClass(totalBonus)}" title="Form + Tabelle"><strong>${sign(totalBonus)}</strong></span>
            </div>
            <div class="form-override-row">
                <label class="form-override-label">Form-Override:
                    <input type="number" class="form-override-input" data-team="${team.name}"
                           min="-2" max="2" step="0.1" placeholder="auto"
                           value="${hasOverride ? form.override : ''}">
                </label>
                <span class="form-effective-label">Aktiv: <strong class="${fClass(effective)}">${sign(effective)}</strong></span>
            </div>
        </div>
    `;
}

function rerenderFormCard(teamName, teams) {
    const safeId = teamName.replace(/[^a-z0-9]/gi, '_');
    const el = document.getElementById('form-card-' + safeId);
    const team = teams.find(t => t.name === teamName);
    if (el && team) {
        const tmp = document.createElement('div');
        tmp.innerHTML = renderFormTeamCard(team);
        el.replaceWith(tmp.firstElementChild);
    }
    // Statistiken aktualisieren
    const statsPanel = document.getElementById('form-stats-panel');
    if (statsPanel) statsPanel.innerHTML = renderFormStats(getFormStatsByDivision(teams));
}

// --- Würfel-Einstellungen ---

function renderSettingsSection() {
    const container = document.getElementById('settings-container');
    const current = getDiceSettings();

    const rows = Object.entries(DEFAULT_DICE_SETTINGS).map(([division, defaults]) => {
        const cur = current[division] || defaults;
        return `
            <div class="settings-row">
                <div class="settings-label">${defaults.label}</div>
                <div class="settings-inputs">
                    <label>Min
                        <input type="number" class="dice-setting-min" data-division="${division}"
                               value="${cur.min}" min="0" max="99">
                    </label>
                    <div class="settings-range-preview" id="preview-${division.replace(/[^a-z0-9]/gi,'_')}">
                        ${cur.min}–${cur.max}
                    </div>
                    <label>Max
                        <input type="number" class="dice-setting-max" data-division="${division}"
                               value="${cur.max}" min="0" max="99">
                    </label>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="settings-form">
            <div class="settings-header-row">
                <span>Liga</span>
                <span style="text-align:center;">Würfelbereich</span>
            </div>
            ${rows}
            <div style="margin-top: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">
                <button id="save-settings-btn" class="btn-primary">💾 Speichern</button>
                <button id="reset-settings-btn" class="btn-small">↩ Standard</button>
            </div>
        </div>
    `;

    // Live-Vorschau
    container.querySelectorAll('.dice-setting-min, .dice-setting-max').forEach(input => {
        input.addEventListener('input', () => {
            const div = input.dataset.division;
            const key = div.replace(/[^a-z0-9]/gi, '_');
            const minEl = container.querySelector(`.dice-setting-min[data-division="${div}"]`);
            const maxEl = container.querySelector(`.dice-setting-max[data-division="${div}"]`);
            const preview = document.getElementById('preview-' + key);
            if (preview) preview.textContent = `${minEl.value}–${maxEl.value}`;
        });
    });

    document.getElementById('save-settings-btn').onclick = () => {
        const newSettings = {};
        container.querySelectorAll('.dice-setting-min').forEach(minInput => {
            const div = minInput.dataset.division;
            const maxInput = container.querySelector(`.dice-setting-max[data-division="${div}"]`);
            const min = Math.max(0, parseInt(minInput.value) || 0);
            const max = Math.max(min, parseInt(maxInput.value) || 0);
            newSettings[div] = { min, max };
            minInput.value = min;
            maxInput.value = max;
        });
        saveDiceSettings(newSettings);
        showSaveConfirmation();
    };

    document.getElementById('reset-settings-btn').onclick = () => {
        if (confirm('Würfel-Einstellungen auf Standard zurücksetzen?')) {
            localStorage.removeItem('dfbpokal_dice_settings');
            renderSettingsSection();
        }
    };
}

function showSaveConfirmation() {
    const btn = document.getElementById('save-settings-btn');
    const orig = btn.textContent;
    btn.textContent = '✅ Gespeichert!';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1500);
}

// --- Sieger (Hall of Fame) ---

function saveTournamentWinner() {
    const winner = tournament.getTournamentWinner();
    if (!winner) return;

    const finalResult = tournament.results[tournament.results.length - 1];
    const finalTimestamp = new Date().toISOString();

    const entry = {
        champion: {
            name: winner.name,
            division: winner.division
        },
        finalRound: tournament.currentRound,
        finalTimestamp,
        rounds: buildRoundSummary()
    };

    const stored = JSON.parse(localStorage.getItem('dfbpokal_sieger') || '[]');
    stored.unshift(entry);
    localStorage.setItem('dfbpokal_sieger', JSON.stringify(stored));
}

function buildRoundSummary() {
    const byRound = {};
    tournament.results.forEach(r => {
        if (!byRound[r.round]) byRound[r.round] = [];
        byRound[r.round].push(r.winner.name);
    });
    return Object.keys(byRound).sort((a, b) => a - b).map(round => ({
        round: parseInt(round),
        winners: byRound[round]
    }));
}

function renderSiegerSection() {
    const container = document.getElementById('sieger-container');
    const stored = JSON.parse(localStorage.getItem('dfbpokal_sieger') || '[]');

    if (stored.length === 0) {
        container.innerHTML = '<p style="color: #666;">Noch kein Turnier abgeschlossen. Spiel ein Turnier zu Ende, um den Sieger hier zu sehen.</p>';
    } else {
        const roundNames = ['', 'Runde 1', 'Runde 2', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'];
        container.innerHTML = stored.map((entry, idx) => {
            const date = new Date(entry.finalTimestamp);
            const dateStr = date.toLocaleString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            const tournamentNum = stored.length - idx;
            return `
                <div class="result-card" style="border-left: 4px solid #ffd700;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <span style="font-weight: bold; color: #888;">Turnier #${tournamentNum}</span>
                        <span style="font-size: 0.85rem; color: #666;">⏱ Finale: ${dateStr} Uhr</span>
                    </div>
                    <div style="text-align: center; padding: 0.75rem; background: linear-gradient(135deg, #fff9c4 0%, #ffd700 100%); border-radius: 8px; margin-bottom: 0.75rem;">
                        <div style="font-size: 1.5rem;">🏆</div>
                        <div style="font-size: 1.2rem; font-weight: bold;">${entry.champion.name}</div>
                        <div style="font-size: 0.85rem; color: #555;">${entry.champion.division}</div>
                    </div>
                    <details style="margin-top: 0.5rem;">
                        <summary style="cursor: pointer; color: #666; font-size: 0.9rem;">Rundenverlauf anzeigen</summary>
                        <div style="margin-top: 0.5rem; font-size: 0.85rem; color: #444;">
                            ${entry.rounds.map(r => {
                                const name = roundNames[r.round] || `Runde ${r.round}`;
                                return `<div style="margin: 0.3rem 0;"><strong>${name}:</strong> ${r.winners.join(', ')}</div>`;
                            }).join('')}
                        </div>
                    </details>
                </div>
            `;
        }).join('');
    }

    // Clear-Button
    const clearBtn = document.getElementById('clear-sieger-btn');
    clearBtn.onclick = () => {
        if (confirm('Alle gespeicherten Sieger löschen?')) {
            localStorage.removeItem('dfbpokal_sieger');
            renderSiegerSection();
        }
    };
}