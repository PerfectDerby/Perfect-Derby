
// Scenario: User is in UTC+2 (e.g. South Africa, Eastern Europe).
// Current Time: Jan 2nd 00:30 UTC.
// Local Time: Jan 2nd 02:30.
// Last Played: Jan 1st (UTC).
// Expected: Streak Check passes (Jan 1st is yesterday of Jan 2nd).
// Actual: Fails because Local Yesterday (Jan 1 02:30) -> UTC (Dec 31 22:30).

function checkStreakBug() {
    // Mock Current Time: Jan 2nd 00:30 UTC
    // We simulate this by forcing the system time.
    // However, JS Date uses system timezone. We can't easily change system timezone in Node.
    // But we can simulate the values.

    console.log("--- Simulating Timezone Bug ---");

    // 1. Setup "Now"
    // Let's assume we are running this on a machine with UTC+2 (Offset -120 min)
    // OR we just manually simulate the values derived in the code.

    // The code does:
    // const yesterday = new Date();
    // yesterday.setDate(yesterday.getDate() - 1);

    // let's manually construct the 'yesterday' object that would result on a UTC+2 machine.
    // 'now' (Local) = Jan 2nd 02:30.
    // 'yesterday' (Local) = Jan 1st 02:30.
    // 'yesterday' (UTC equivalent) = Dec 31st 22:30.

    const yesterdayMilis = Date.UTC(2026, 0, 1) - (1.5 * 60 * 60 * 1000); // Dec 31 22:30 UTC
    const yesterday = new Date(yesterdayMilis);

    console.log(`Mock Yesterday Object (UTC Time): ${yesterday.toISOString()}`);

    const yYear = yesterday.getUTCFullYear();
    const yMonth = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
    const yDay = String(yesterday.getUTCDate()).padStart(2, '0');
    const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

    console.log(`Calculated YesterdayStr: ${yesterdayStr}`);

    const lastDate = "2026-01-01"; // We validly played yesterday (Jan 1st)
    console.log(`Actual Last Date: ${lastDate}`);

    if (lastDate === yesterdayStr) {
        console.log("PASS: Logic matches.");
    } else {
        console.log("FAIL: Logic resets streak!");
    }
}

checkStreakBug();
