
import { soundManager } from './js/soundManager.js';
import { hapticManager } from './js/hapticManager.js';
import { scoreManager } from './js/scoreManager.js';

window.benchmarkPerfectHit = async () => {
    console.log("Starting Benchmark...");

    // 1. Audio
    const t0 = performance.now();
    for (let i = 0; i < 10; i++) {
        soundManager.playPerfectHit();
    }
    const t1 = performance.now();
    console.log(`Audio (10x): ${(t1 - t0).toFixed(2)}ms`);

    // 2. Haptics
    const t2 = performance.now();
    for (let i = 0; i < 10; i++) {
        hapticManager.vibrate('perfect');
    }
    const t3 = performance.now();
    console.log(`Haptics (10x): ${(t3 - t2).toFixed(2)}ms`);

    // 3. Score
    const t4 = performance.now();
    for (let i = 0; i < 10; i++) {
        scoreManager.registerHit('PERFECT');
    }
    const t5 = performance.now();
    console.log(`Score (10x): ${(t5 - t4).toFixed(2)}ms`);

    // 4. Combined Frame Simulation
    const t6 = performance.now();
    soundManager.playPerfectHit();
    hapticManager.vibrate('perfect');
    scoreManager.registerHit('PERFECT');
    const t7 = performance.now();
    console.log(`Single Frame Total: ${(t7 - t6).toFixed(2)}ms`);
};
