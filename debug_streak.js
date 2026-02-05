
// Mock Global Objects
const seededRandom = {
    getDailySeed: () => {
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};

const gameState = {
    dailyStreak: 1,
    lastDailyDate: "2026-01-23" // Assume we played yesterday (UTC)
};

function checkStreak(mockCurrentDate) {
    // Override Date
    const RealDate = Date;
    global.Date = class extends RealDate {
        constructor() {
            if (arguments.length > 0) return new RealDate(...arguments);
            return new RealDate(mockCurrentDate);
        }
    };

    // Original Logic from scoreManager.js
    const today = seededRandom.getDailySeed();
    const lastDate = gameState.lastDailyDate;

    console.log(`\n--- Test Case: ${mockCurrentDate.toISOString()} ---`);
    console.log(`Current Time (Local): ${mockCurrentDate.toString()}`);
    console.log(`Today (UTC String): ${today}`);
    console.log(`Last Played (UTC String): ${lastDate}`);

    if (lastDate === today) {
        console.log("RESULT: Already Played");
        global.Date = RealDate;
        return;
    }

    const yesterday = new Date();
    // THE BUGGY LINE:
    yesterday.setDate(yesterday.getDate() - 1);

    const yYear = yesterday.getUTCFullYear();
    const yMonth = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
    const yDay = String(yesterday.getUTCDate()).padStart(2, '0');
    const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

    console.log(`Yesterday Calc (UTC String): ${yesterdayStr}`);

    let result = "";
    if (lastDate === yesterdayStr) {
        result = "STREAK INC (+1)";
    } else {
        result = "RESET (1)";
    }
    console.log(`Logic Result: ${result}`);

    // Restore
    global.Date = RealDate;
}

// Scenario 1: User is in EST (UTC-5). 
// It is Jan 24 22:00 EST. 
// UTC is Jan 25 03:00.
// Today (UTC) = Jan 25.
// Last Played (UTC) = Jan 24. (Expected Streak Inc)
const date1 = new Date("2026-01-24T22:00:00-05:00");
gameState.lastDailyDate = "2026-01-24";
checkStreak(date1);

// Scenario 2: User is in Japan (UTC+9).
// It is Jan 25 01:00 JST.
// UTC is Jan 24 16:00.
// Today (UTC) = Jan 24.
// Last Played (UTC) = Jan 23. (Expected Streak Inc)
const date2 = new Date("2026-01-25T01:00:00+09:00");
gameState.lastDailyDate = "2026-01-23";
checkStreak(date2);
