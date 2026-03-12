// dice.js - Würfelmechanik

class DiceRoller {
    constructor() {
        this.rolls = {};
    }

    roll(team) {
        const settings = getDiceSettings();
        const s = settings[team.division] || { min: 0, max: 1 };
        const min = Math.min(s.min, s.max);
        const max = Math.max(s.min, s.max);
        const raw = min + Math.floor(Math.random() * (max - min + 1));
        const formBonus = getEffectiveFormFactor(team.name);
        const tableBonus = getEffectiveTableFactor(team.name, team.division);
        return Math.max(min, Math.min(max, Math.round(raw + formBonus + tableBonus)));
    }

    rollForMatch(homeTeam, awayTeam) {
        const homeRoll = this.roll(homeTeam);
        const awayRoll = this.roll(awayTeam);
        
        return {
            home: homeRoll,
            away: awayRoll,
            winner: homeRoll > awayRoll ? 'home' : awayRoll > homeRoll ? 'away' : 'draw'
        };
    }

    addExtraTime(diceResult) {
        // Bei Unentschieden: Verlängerung mit erneutem Würfeln (bonus)
        if (diceResult.winner === 'draw') {
            const homeBonus = Math.floor(Math.random() * 3); // 0-2 extra
            const awayBonus = Math.floor(Math.random() * 3);
            
            return {
                extraTime: true,
                homeExtra: homeBonus,
                awayExtra: awayBonus,
                homeTotal: diceResult.home + homeBonus,
                awayTotal: diceResult.away + awayBonus,
                winner: (diceResult.home + homeBonus) > (diceResult.away + awayBonus) ? 'home' : 
                       (diceResult.away + awayBonus) > (diceResult.home + homeBonus) ? 'away' : 'penalty'
            };
        }
        return { extraTime: false, winner: diceResult.winner };
    }

    addPenalties(diceResult) {
        // Bei weiterem Unentschieden: Elfmeterschießen (3 Würfe pro Team)
        if (diceResult.winner === 'penalty') {
            const homePenalties = [
                Math.floor(Math.random() * 2),
                Math.floor(Math.random() * 2),
                Math.floor(Math.random() * 2)
            ];
            const awayPenalties = [
                Math.floor(Math.random() * 2),
                Math.floor(Math.random() * 2),
                Math.floor(Math.random() * 2)
            ];
            
            const homeScore = homePenalties.reduce((a,b) => a+b, 0);
            const awayScore = awayPenalties.reduce((a,b) => a+b, 0);
            
            return {
                penalties: true,
                homePenalties,
                awayPenalties,
                homeScore,
                awayScore,
                winner: homeScore > awayScore ? 'home' : 'away'
            };
        }
        return { penalties: false };
    }
}