const PITCH_TYPES = {
    FASTBALL: 'fastball',
    CURVEBALL: 'curveball',
    CHANGEUP: 'changeup',
    SUPER_FASTBALL: 'super_fastball',
    STOPBALL: 'stopball',
    SPLITTER: 'splitter',
    GHOSTBALL: 'ghostball',
    ZIGZAG: 'zigzag',
    CURVE_SPLITTER: 'curve_splitter',
    SUPER_CURVE: 'super_curve',
    ZIGZAG_CHANGEUP: 'zigzag_changeup',
    GHOST_SPLITTER: 'ghost_splitter',
    STOP_ZIGZAG: 'stop_zigzag',
    GHOST_STOP: 'ghost_stop',
    STOP_CURVE: 'STOP_CURVE',
    SUPER_ZIGZAG: 'super_zigzag',
    STOP_SUPER: 'stop_super'
};

const ROSTER = [
    {
        id: 'ROOKIE',
        name: 'The Rookie',
        leagueId: 0,
        minScoreInSeason: 0,
        maxScoreInSeason: 49,
        baseSpeedMultiplier: 0.8,
        pools: [
            { max: 9, probs: { [PITCH_TYPES.FASTBALL]: 0.5, [PITCH_TYPES.CURVEBALL]: 0.5 } },
            { max: 19, probs: { [PITCH_TYPES.SUPER_FASTBALL]: 0.6, [PITCH_TYPES.FASTBALL]: 0.2, [PITCH_TYPES.CURVEBALL]: 0.2 } },
            { max: 39, probs: { [PITCH_TYPES.CHANGEUP]: 0.5, [PITCH_TYPES.SUPER_FASTBALL]: 0.3, [PITCH_TYPES.FASTBALL]: 0.1, [PITCH_TYPES.CURVEBALL]: 0.1 } },
            { max: 49, probs: { [PITCH_TYPES.ZIGZAG]: 0.4, [PITCH_TYPES.SUPER_FASTBALL]: 0.2, [PITCH_TYPES.CHANGEUP]: 0.2, [PITCH_TYPES.FASTBALL]: 0.1, [PITCH_TYPES.CURVEBALL]: 0.1 } }
        ],
        seasonTwoTrick: PITCH_TYPES.GHOSTBALL
    },
    {
        id: 'TECHNICIAN',
        name: 'The Technician',
        leagueId: 1,
        minScoreInSeason: 50,
        maxScoreInSeason: 99,
        baseSpeedMultiplier: 1.2,
        pools: [
            { max: 64, probs: { [PITCH_TYPES.STOPBALL]: 0.5, [PITCH_TYPES.SUPER_FASTBALL]: 0.15, [PITCH_TYPES.ZIGZAG]: 0.15, [PITCH_TYPES.CURVEBALL]: 0.1 } },
            { max: 79, probs: { [PITCH_TYPES.SPLITTER]: 0.5, [PITCH_TYPES.STOPBALL]: 0.2, [PITCH_TYPES.ZIGZAG]: 0.1 } },
            { max: 99, probs: { [PITCH_TYPES.GHOSTBALL]: 0.4, [PITCH_TYPES.SPLITTER]: 0.2, [PITCH_TYPES.STOPBALL]: 0.2, [PITCH_TYPES.ZIGZAG]: 0.2 } }
        ],
        seasonTwoTrick: PITCH_TYPES.STOP_CURVE
    },
    {
        id: 'ACE',
        name: 'The Ace',
        leagueId: 2,
        minScoreInSeason: 100,
        maxScoreInSeason: 149,
        baseSpeedMultiplier: 1.5,
        pools: [
            { max: 114, probs: { [PITCH_TYPES.CURVE_SPLITTER]: 0.5, [PITCH_TYPES.GHOSTBALL]: 0.2, [PITCH_TYPES.SUPER_FASTBALL]: 0.1 } },
            { max: 129, probs: { [PITCH_TYPES.SUPER_CURVE]: 0.5, [PITCH_TYPES.CURVE_SPLITTER]: 0.2, [PITCH_TYPES.GHOSTBALL]: 0.3 } },
            { max: 149, probs: { [PITCH_TYPES.ZIGZAG_CHANGEUP]: 0.4, [PITCH_TYPES.SUPER_CURVE]: 0.2, [PITCH_TYPES.CURVE_SPLITTER]: 0.2 } }
        ],
        seasonTwoTrick: PITCH_TYPES.SUPER_ZIGZAG
    },
    {
        id: 'SCARY',
        name: 'The Legend',
        leagueId: 3,
        minScoreInSeason: 150,
        maxScoreInSeason: 199,
        baseSpeedMultiplier: 2.0,
        pools: [
            { max: 164, probs: { [PITCH_TYPES.GHOST_SPLITTER]: 0.5, [PITCH_TYPES.SUPER_CURVE]: 0.25 } },
            { max: 179, probs: { [PITCH_TYPES.STOP_ZIGZAG]: 0.5, [PITCH_TYPES.GHOST_SPLITTER]: 0.25 } },
            { max: 199, probs: { [PITCH_TYPES.GHOST_STOP]: 0.4, [PITCH_TYPES.GHOST_SPLITTER]: 0.2 } }
        ],
        seasonTwoTrick: PITCH_TYPES.STOP_SUPER
    }
];

function getSeasonInfo(score) {
    const SEASON_LENGTH = 200;
    const seasonIndex = Math.floor(score / SEASON_LENGTH);
    const scoreInSeason = score % SEASON_LENGTH;
    return { seasonIndex, scoreInSeason };
}

function getPitcherForScore(score) {
    const { scoreInSeason } = getSeasonInfo(score);
    return ROSTER.find(p => scoreInSeason >= p.minScoreInSeason && scoreInSeason <= p.maxScoreInSeason);
}

function getSpeedData(score) {
    // Linear: 0.9 + (score * 0.007)
    let total = 0.9 + (score * 0.007);

    // Boss Boost
    const pitcher = getPitcherForScore(score);
    if (pitcher && pitcher.id === 'SCARY') {
        total += 0.25;
    }

    return { total: total, base: total, wave: 1.0 };
}

// Generate Report
let output = "# Big Leagues Pitch Mapping (Generated)\n\n| Score | Season | Pitcher | Speed (Total) | Speed (Base/Wave) | Primary Pitches |\n|---|---|---|---|---|---|\n";

for (let i = 0; i <= 600; i += 10) {
    const { seasonIndex, scoreInSeason } = getSeasonInfo(i);
    const pitcher = getPitcherForScore(i);
    const speedData = getSpeedData(i);

    let pitcherName = pitcher ? pitcher.name : "UNKNOWN";
    let speedStr = `${speedData.total.toFixed(2)}x`;
    let detailStr = `${speedData.base.toFixed(2)} / ${speedData.wave.toFixed(2)}`;

    // Get Pool
    let poolDesc = "";
    if (pitcher) {
        const pool = pitcher.pools.find(p => scoreInSeason <= p.max) || pitcher.pools[pitcher.pools.length - 1];
        // Sort highest prob first
        const sorted = Object.entries(pool.probs).sort((a, b) => b[1] - a[1]);
        poolDesc = sorted.map(([k, v]) => `${k}(${(v * 100).toFixed(0)}%)`).join(", ");

        if (seasonIndex >= 1 && pitcher.seasonTwoTrick) {
            poolDesc += ` + [TRICK: ${pitcher.seasonTwoTrick}]`;
        }
    }

    output += `| ${i} | ${seasonIndex + 1} | ${pitcherName} | ${speedStr} | ${detailStr} | ${poolDesc} |\n`;
}

console.log(output);

const fs = require('fs');
const path = "C:/Users/acsha/.gemini/antigravity/brain/b73f9c8d-cc1c-4229-b6b2-9fd694077c46/new_stats.md";
fs.writeFileSync(path, output, 'utf8');
