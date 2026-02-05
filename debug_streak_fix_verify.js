
// Scenario: User is in UTC+2 (e.g. South Africa, Eastern Europe).
// Current Time: Jan 2nd 00:30 UTC.
// Local Time: Jan 2nd 02:30.
// Last Played: Jan 1st (UTC).
// Expected: Streak Check passes (Jan 1st is yesterday of Jan 2nd).

function checkStreakFix() {
    console.log("--- Validating Fix for Timezone Bug ---");

    // 1. Simulate "Yesterday" calculation with the NEW LOGIC
    // We want to simulate the environment where "Now" is Jan 2nd 02:30 (Local) / Jan 2nd 00:30 (UTC)

    // Construct the "Now" object that represents that instant in time
    const nowTime = Date.UTC(2026, 0, 2, 0, 30, 0); // Jan 2 00:30 UTC
    const now = new Date(nowTime);

    console.log(`Current Time (UTC): ${now.toISOString()}`);
    console.log(`Current Time (Local - System Dependent): ${now.toString()}`);

    // --- LOGIC UNDER TEST (COPY-PASTED FROM FIX) ---
    // const now = new Date(); // (We use our mocked 'now' instead)

    const yesterdayTs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1);
    const yesterdayDate = new Date(yesterdayTs);

    const yYear = yesterdayDate.getUTCFullYear();
    const yMonth = String(yesterdayDate.getUTCMonth() + 1).padStart(2, '0');
    const yDay = String(yesterdayDate.getUTCDate()).padStart(2, '0');
    const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;
    // -----------------------------------------------

    console.log(`Calculated YesterdayStr: ${yesterdayStr}`);

    // Test Case
    const lastDate = "2026-01-01"; // We validly played yesterday (Jan 1st)
    console.log(`Actual Last Date (from DB): ${lastDate}`);

    if (lastDate === yesterdayStr) {
        console.log("PASS: Streak preserved correctly.");
    } else {
        console.log("FAIL: Streak would reset.");
    }

    // Double Check Rollover (Jan 1 -> Dec 31)
    console.log("\n--- Rolling over validtion (Jan 1) ---");
    const now2 = new Date(Date.UTC(2026, 0, 1, 0, 30, 0)); // Jan 1 00:30 UTC

    const yesterdayTs2 = Date.UTC(now2.getUTCFullYear(), now2.getUTCMonth(), now2.getUTCDate() - 1);
    const yesterdayDate2 = new Date(yesterdayTs2);
    const yYear2 = yesterdayDate2.getUTCFullYear();
    const yMonth2 = String(yesterdayDate2.getUTCMonth() + 1).padStart(2, '0');
    const yDay2 = String(yesterdayDate2.getUTCDate()).padStart(2, '0');
    const yesterdayStr2 = `${yYear2}-${yMonth2}-${yDay2}`;

    console.log(`Current: ${now2.toISOString()}`);
    console.log(`Yesterday: ${yesterdayStr2}`);
    if (yesterdayStr2 === "2025-12-31") {
        console.log("PASS: Year rollover correct.");
    } else {
        console.log("FAIL: Year rollover failed.");
    }
}

checkStreakFix();
