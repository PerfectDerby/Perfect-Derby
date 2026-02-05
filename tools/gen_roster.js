const PITCH_TYPES = {
    FASTBALL: 'fastball',
    CURVEBALL: 'curveball',
    CHANGEUP: 'changeup',
    SPLITTER: 'splitter',
    SUPER_FASTBALL: 'super_fastball',
    SUPER_SPLITTER: 'super_splitter',
    GHOSTBALL: 'ghostball',
    STOPBALL: 'stopball',
    STOP_CURVE: 'STOP_CURVE',
    GHOST_CURVE: 'GHOST_CURVE',
    SUPER_CURVE: 'SUPER_CURVE',
    SUPER_ZIGZAG: 'super_zigzag',
    STOP_SPLITTER: 'stop_splitter',
    STOP_ZIGZAG: 'stop_zigzag',
    GHOST_SPLITTER: 'ghost_splitter',
    GHOST_ZIGZAG: 'ghost_zigzag',
    GHOST_CHANGEUP: 'ghost_changeup',
    CURVE_SPLITTER: 'curve_splitter',
    ZIGZAG_SPLITTER: 'zigzag_splitter',
    CURVE_CHANGEUP: 'curve_changeup',
    SPLITTER_CHANGEUP: 'splitter_changeup',
    ZIGZAG_CHANGEUP: 'zigzag_changeup',
    GHOST_STOP: 'ghost_stop',
    GHOST_SUPER: 'ghost_super',
    STOP_SUPER: 'stop_super',
    STOP_CHANGEUP: 'stop_changeup',
    ZIGZAG: 'zigzag'
};

const BASIC_PITCHES = [
    PITCH_TYPES.FASTBALL,
    PITCH_TYPES.CURVEBALL,
    PITCH_TYPES.CHANGEUP,
    PITCH_TYPES.SPLITTER,
    PITCH_TYPES.ZIGZAG,
    PITCH_TYPES.STOPBALL,
    PITCH_TYPES.GHOSTBALL,
    PITCH_TYPES.SUPER_FASTBALL // User clarified Red is single color
];

// Progression Order (100+)
const PROGRESSION = [
    { score: 100, pitch: PITCH_TYPES.SUPER_CURVE },
    { score: 110, pitch: PITCH_TYPES.ZIGZAG_SPLITTER },
    { score: 120, pitch: PITCH_TYPES.CURVE_CHANGEUP },
    { score: 130, pitch: PITCH_TYPES.SUPER_ZIGZAG },
    { score: 140, pitch: PITCH_TYPES.CURVE_SPLITTER },

    // LEGEND (150-199) - Hybrids Only
    { score: 150, pitch: PITCH_TYPES.GHOST_STOP },
    { score: 160, pitch: PITCH_TYPES.SUPER_SPLITTER },
    { score: 170, pitch: PITCH_TYPES.GHOST_CURVE },
    { score: 180, pitch: PITCH_TYPES.STOP_SUPER },
    { score: 190, pitch: PITCH_TYPES.GHOST_ZIGZAG },

    // ROOKIE ELITE (200-249)
    { score: 200, pitch: PITCH_TYPES.STOP_SPLITTER },
    { score: 210, pitch: PITCH_TYPES.GHOST_CHANGEUP },
    { score: 220, pitch: PITCH_TYPES.ZIGZAG_CHANGEUP },
    { score: 230, pitch: PITCH_TYPES.STOP_CURVE },
    { score: 240, pitch: PITCH_TYPES.SPLITTER_CHANGEUP },

    // TECHNICIAN ELITE (250-299)
    { score: 250, pitch: PITCH_TYPES.GHOST_SPLITTER },
    { score: 260, pitch: PITCH_TYPES.STOP_CHANGEUP },
    { score: 270, pitch: PITCH_TYPES.GHOST_SUPER },
    { score: 280, pitch: PITCH_TYPES.STOP_ZIGZAG },

    // 290+ = Equal Mix
];

// Determine "Prior" availability based on what has been unlocked in previous tiers
// Initially available at 100: All Basics + Any Hybrids unlocked 0-99 (None in user plan, Ace starts fresh with Hybrids?)
// Actually, earlier pools had SFB/Ghost/Stop etc.
// But the progression list above defines the *New* pitch.
// The "Prior" pool includes everything unlocked *so far* in this list AND the Basic Pitches.

let unlockedPitches = [...BASIC_PITCHES];

function generatePools() {
    let output = [];

    // Simulate progression step by step
    for (const step of PROGRESSION) {

        let pool = {
            max: step.score + 9, // e.g. 100 -> 109
            probs: {}
        };

        // 1. New Pitch: 40%
        pool.probs[step.pitch] = 0.4;

        // 2. Identify Available Priors
        // Add current new pitch to unlocked list for *next* round, 
        // BUT for *this* round, is it included in the 60%? No, it's the 40%.
        // The 60% is split among "Prior" unlocked pitches.

        let priors = [];

        // Special Logic: The Legend (150-199)
        if (step.score >= 150 && step.score <= 199) {
            // ONLY HYBRIDS. Exclude Basics.
            priors = unlockedPitches.filter(p => !BASIC_PITCHES.includes(p));
        } else {
            // ALL unlocked
            priors = [...unlockedPitches];
        }

        if (priors.length > 0) {
            const split = 0.6 / priors.length;
            priors.forEach(p => {
                pool.probs[p] = parseFloat(split.toFixed(4));
            });
        } else {
            // Should not happen unless first step has no priors?
            // At 100, unlockedPitches = Basics.
        }

        // Add the NEW pitch to unlocked for the FUTURE
        if (!unlockedPitches.includes(step.pitch)) {
            unlockedPitches.push(step.pitch);
        }

        output.push({ score: step.score, pool });
    }

    // FINAL POOL 290+ (Technician continued or Ace?)
    // Actually roster config ends at 299 then loops or whatever?
    // User plan said 290+ Equal Mix.
    // Let's generate a pool for 299 using equal mix of ALL unlocked.

    let finalPool = {
        max: 299,
        probs: {}
    };
    const finalSplit = 1.0 / unlockedPitches.length;
    unlockedPitches.forEach(p => {
        finalPool.probs[p] = parseFloat(finalSplit.toFixed(4));
    });
    output.push({ score: 290, pool: finalPool });

    return output;
}

const pools = generatePools();

// Group by Pitcher ID for easy copy-paste
const ACE_POOLS = pools.filter(p => p.score >= 100 && p.score < 150).map(p => p.pool);
const LEGEND_POOLS = pools.filter(p => p.score >= 150 && p.score < 200).map(p => p.pool);
const ROOKIE_ELITE_POOLS = pools.filter(p => p.score >= 200 && p.score < 250).map(p => p.pool);
const TECH_ELITE_POOLS = pools.filter(p => p.score >= 250).map(p => p.pool);

console.log("/// ACE POOLS (100-149) ///");
console.log(JSON.stringify(ACE_POOLS, null, 4));
console.log("\n/// LEGEND POOLS (150-199) ///");
console.log(JSON.stringify(LEGEND_POOLS, null, 4));
console.log("\n/// ROOKIE ELITE POOLS (200-249) ///");
console.log(JSON.stringify(ROOKIE_ELITE_POOLS, null, 4));
console.log("\n/// TECH ELITE POOLS (250-299) ///");
console.log(JSON.stringify(TECH_ELITE_POOLS, null, 4));
