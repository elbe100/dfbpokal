// teams.js - Team-Definitionen

const TEAMS = {
    profi: {
        bundesliga_top6: [
            { name: 'FC Bayern München', division: 'BL Top 6' },
            { name: 'Borussia Dortmund', division: 'BL Top 6' },
            { name: 'TSG Hoffenheim', division: 'BL Top 6' },
            { name: 'VfB Stuttgart', division: 'BL Top 6' },
            { name: 'RB Leipzig', division: 'BL Top 6' },
            { name: 'Bayer Leverkusen', division: 'BL Top 6' }
        ],
        bundesliga_rest: [
            { name: 'Eintracht Frankfurt', division: 'BL' },
            { name: 'SC Freiburg', division: 'BL' },
            { name: 'FC Augsburg', division: 'BL' },
            { name: 'Hamburger SV', division: 'BL' },
            { name: 'Union Berlin', division: 'BL' },
            { name: 'Borussia Mönchengladbach', division: 'BL' },
            { name: 'SV Werder Bremen', division: 'BL' },
            { name: '1. FC Köln', division: 'BL' },
            { name: '1. FSV Mainz 05', division: 'BL' },
            { name: 'FC St. Pauli', division: 'BL' },
            { name: 'VfL Wolfsburg', division: 'BL' },
            { name: '1. FC Heidenheim', division: 'BL' }
        ],
        zweite_liga_top14: [
            { name: 'FC Schalke 04', division: '2.BL' },
            { name: 'SV Darmstadt 98', division: '2.BL' },
            { name: 'SV Elversberg', division: '2.BL' },
            { name: 'SC Paderborn 07', division: '2.BL' },
            { name: 'Hannover 96', division: '2.BL' },
            { name: 'Hertha BSC', division: '2.BL' },
            { name: '1. FC Kaiserslautern', division: '2.BL' },
            { name: 'Karlsruher SC', division: '2.BL' },
            { name: 'VfL Bochum', division: '2.BL' },
            { name: 'Fortuna Düsseldorf', division: '2.BL' },
            { name: '1. FC Nürnberg', division: '2.BL' },
            { name: 'Arminia Bielefeld', division: '2.BL' },
            { name: 'Dynamo Dresden', division: '2.BL' },
            { name: 'Preußen Münster', division: '2.BL' }
        ]
    },
    amateur: {
        zweite_liga_last4: [
            { name: 'Eintracht Braunschweig', division: '2.BL' },
            { name: 'SpVgg Greuther Fürth', division: '2.BL' },
            { name: 'Holstein Kiel', division: '2.BL' },
            { name: '1. FC Magdeburg', division: '2.BL' }
        ],
        dritte_liga_top5: [
            { name: 'VfL Osnabrück', division: '3.Liga' },
            { name: 'FC Energie Cottbus', division: '3.Liga' },
            { name: 'MSV Duisburg', division: '3.Liga' },
            { name: 'Rot-Weiss Essen', division: '3.Liga' },
            { name: 'SC Verl', division: '3.Liga' },
            { name: 'TSV 1860 München', division: '3.Liga' },
            { name: 'Hansa Rostock', division: '3.Liga' },
            { name: 'FC Erzgebirge Aue', division: '3.Liga' },
            { name: 'FC Viktoria Köln', division: '3.Liga' },
            { name: '1. FC Saarbrücken', division: '3.Liga' },
            { name: 'SV Waldhof Mannheim', division: '3.Liga' },
            { name: 'SSV Jahn Regensburg', division: '3.Liga' }
        ],
        regional: [
            { name: 'Teutonia 05 Ottensen', division: '4.Liga' },
            { name: 'VfB Lübeck', division: '4.Liga' },
            { name: 'Eintracht Norderstedt', division: '4.Liga' },
            { name: 'BTSV Oberneuland', division: '4.Liga' },
            { name: 'Vfl Oldenburg', division: '4.Liga' },
            { name: 'Delay Sports Berlin', division: '4.Liga' },
            { name: 'SV Babelsberg 03', division: '4.Liga' },
            { name: 'Hallescher FC II', division: '4.Liga' },
            { name: 'FC Carl Zeiss Jena', division: '4.Liga' },
            { name: 'Sportfreunde Lotte', division: '4.Liga' },
            { name: '1. FC Bocholt', division: '4.Liga' },
            { name: 'TuS Koblenz', division: '4.Liga' },
            { name: 'FK Pirmasens', division: '4.Liga' },
            { name: 'Kickers Offenbach', division: '4.Liga' },
            { name: 'FC 08 Villingen', division: '4.Liga' },
            { name: 'Stuttgarter Kickers', division: '4.Liga' }
        ]
    }
};

function getAllTeams() {
    return {
        pro: [
            ...TEAMS.profi.bundesliga_top6,
            ...TEAMS.profi.bundesliga_rest,
            ...TEAMS.profi.zweite_liga_top14
        ],
        amateur: [
            ...TEAMS.amateur.zweite_liga_last4,
            ...TEAMS.amateur.dritte_liga_top5,
            ...TEAMS.amateur.regional
        ]
    };
}
