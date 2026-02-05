// Haunted Renderer
import { gameState } from '../gameState.js';
import { scoreManager } from '../scoreManager.js';
import { soundManager } from '../soundManager.js';
import { GAME_WIDTH, GAME_HEIGHT, playOffsetY } from '../dom.js';
import { drawHauntedTombstone } from './hauntedTombstoneRenderer.js';

export function drawHauntedMoon(ctx, w, h) {
    ctx.save();
    const moonX = w * 0.85;
    const moonY = h * 0.1; // Higher up (was 0.15)
    const moonR = Math.min(w, h) * 0.1; // Slightly smaller to look further away

    // 1. Massive Atmospheric Glow
    const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR, moonX, moonY, moonR * 4);
    moonGlow.addColorStop(0, 'rgba(255, 255, 230, 0.4)'); // Inner bright halo
    moonGlow.addColorStop(0.5, 'rgba(200, 200, 255, 0.1)'); // Outer blueish tint
    moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath(); ctx.arc(moonX, moonY, moonR * 4, 0, Math.PI * 2); ctx.fill();

    // 2. The Moon Body
    ctx.fillStyle = '#ffffe0'; // Pale Yellow-White
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; // Reset

    // 3. Craters (Subtle)
    ctx.fillStyle = 'rgba(200, 200, 210, 0.5)';
    const drawCrater = (cx, cy, r) => {
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    };
    drawCrater(moonX - moonR * 0.3, moonY - moonR * 0.2, moonR * 0.2);
    drawCrater(moonX + moonR * 0.4, moonY + moonR * 0.3, moonR * 0.15);
    ctx.restore();
}

function drawHauntedFog(ctx, w, h, time) {
    // Legacy wrapper, redirected to new cloud system
    drawCloudLayer(ctx, w, h, time);
}

// --- BACKGROUND RENDERER ---
// --- BACKGROUND RENDERER ---
export function drawHauntedBackground(ctx, w, h, skipMansion = false) {
    // 1. RICH SKY GRADIENT
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0.0, '#0a0520');   // Deep midnight blue
    skyGrad.addColorStop(0.5, '#1a0f35');   // Purple midpoint
    skyGrad.addColorStop(1.0, '#151020');   // Dark purple-grey horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. STARS - MOVED TO DYNAMIC LOOP


    // 3. ATMOSPHERIC LAYERS (Mist - Distinct Separation)
    const mistGrad = ctx.createLinearGradient(0, h * 0.5, 0, h);
    mistGrad.addColorStop(0, 'rgba(40, 50, 60, 0)');
    mistGrad.addColorStop(0.7, 'rgba(40, 30, 60, 0.3)'); // Ecto-Purple Tint
    mistGrad.addColorStop(1, 'rgba(20, 10, 30, 0.9)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, h * 0.5, w, h * 0.5);

    // 4. MOON (Enhanced)
    drawHauntedMoon(ctx, w, h);

    // 5. CLOUDS - MOVED TO DYNAMIC LOOP
    // 6. MANSION - MOVED TO DYNAMIC LOOP
}

// --- DYNAMIC BACKGROUND OVERLAY ---
// Cache for the Storm Effect (Structure Only)
let stormStructureCache = null;
let stormWindowsCache = null; // NEW: Cache for the glowing windows
let lastStormStructW = 0;
let lastStormStructH = 0;

// Thunder State Tracking
let thunderState = { flash1: false, flash2: false };

// Called every frame by renderer.js
export function drawHauntedDynamicBackground(ctx, w, h) {
    // Check for Perfect Hit Storm
    let lightningIntensity = 0;
    const isActive = scoreManager.consecutivePerfectHits >= 1 && gameState.perfectHitTimer > 0;

    if (isActive) {
        // Controlled Flashes (Timer counts DOWN from 1500ms)
        const t = gameState.perfectHitTimer;

        // Flash 1: Immediate Strike (1500 -> 1300)
        if (t > 1300) {
            lightningIntensity = 1.0;
            if (!thunderState.flash1) {
                soundManager.playThunder(0.3);
                thunderState.flash1 = true;
            }
        }
        // Flash 2: The Echo (1000 -> 850)
        else if (t > 850 && t < 1000) {
            lightningIntensity = 0.8;
            if (!thunderState.flash2) {
                soundManager.playThunder(0.15);
                thunderState.flash2 = true;
            }
        }
    } else {
        thunderState.flash1 = false;
        thunderState.flash2 = false;

        // Draw Drifting Clouds (Dynamic Layer)
        // Only draw here if NOT storming? Or always?
        // Always draw clouds on top of static sky, but BEHIND structure.
        // But drawHauntedDynamicBackground is usually called AFTER static bg.
        // Static BG has the "base" clouds (t=0).
        // If we draw moving ones here, we get nice parallax.
        const time = Date.now() / 1000;
        drawCloudLayer(ctx, w, h, time);

        return;
    }

    ctx.save();

    // 1. LIGHTNING & SKY (Only during flash peaks)
    // OPTIMIZED: Simplified rendering path
    if (lightningIntensity > 0.5) {
        // Sky Flash (Lightning Illumination)
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(180, 220, 255, ${0.4 * lightningIntensity})`;
        ctx.fillRect(0, 0, w, h);

        // OPTIMIZATION: Simple lightning without recursion or shadowBlur
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = `rgba(255, 255, 255, ${lightningIntensity})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Pre-defined lightning path (deterministic, no Math.random)
        const variant = (lightningIntensity > 0.9) ? 0 : 1;
        if (variant === 0) {
            // Main bolt
            ctx.beginPath();
            ctx.moveTo(w * 0.5, 0);
            ctx.lineTo(w * 0.48, h * 0.15);
            ctx.lineTo(w * 0.52, h * 0.3);
            ctx.lineTo(w * 0.5, h * 0.5);
            ctx.stroke();
        } else {
            thunderState.flash1 = false;
            thunderState.flash2 = false;
        }

    }

    // 2. CACHED STRUCTURE OVERLAY (Walls/Roof)
    // Always draw during the event (isActive = true), ensuring windows have a base to sit on.
    // 2. CACHED STRUCTURE OVERLAY (Walls/Roof)
    // ALWAYS DRAW: To support clouds passing behind the mansion, the mansion itself
    // must be drawn every frame on top of the dynamic clouds.
    const safeW = Math.floor(w);
    const safeH = Math.floor(h);

    const needsRebuild = !stormStructureCache || !stormWindowsCache || safeW !== lastStormStructW || safeH !== lastStormStructH;

    if (needsRebuild) {
        console.log(`[HauntedRenderer] Storm Cache UPDATE: ${safeW}x${safeH}`);

        if (typeof OffscreenCanvas !== 'undefined') {
            stormStructureCache = new OffscreenCanvas(safeW, safeH);
            stormWindowsCache = new OffscreenCanvas(safeW, safeH);
        } else {
            stormStructureCache = document.createElement('canvas');
            stormStructureCache.width = safeW;
            stormStructureCache.height = safeH;
            stormWindowsCache = document.createElement('canvas');
            stormWindowsCache.width = safeW;
            stormWindowsCache.height = safeH;
        }

        const sCtx = stormStructureCache.getContext('2d');
        // Render STRUCTURE ONLY (No Windows)
        drawHauntedHouse(sCtx, safeW, safeH, 0, 'STRUCTURE_ONLY');

        const wCtx = stormWindowsCache.getContext('2d');
        // Render WINDOWS ONLY (Lit State High Intensity)
        drawHauntedHouse(wCtx, safeW, safeH, 1.0, 'WINDOWS_ONLY');

        lastStormStructW = safeW;
        lastStormStructH = safeH;
    }

    // LAYER ORDER: 
    // 0. Stars (Dynamic Twinkle) - Behind Clouds
    const time = Date.now() / 1000;
    drawStarField(ctx, w, h, time);

    // 1. Clouds (Behind Mansion)
    drawCloudLayer(ctx, w, h, time);

    // 2. Mansion Structure (Occludes Clouds)
    ctx.drawImage(stormStructureCache, 0, 0, safeW, safeH);

    // 3. Dynamic Windows (Glowing/Pulsing)
    // Default: Always draw lit windows at base intensity
    // If storming, pulse them bright.

    let windowAlpha = 0.8; // Standard Lit
    let composite = 'source-over';

    if (isActive) {
        const t = gameState.perfectHitTimer;
        const phase = Date.now();
        const wave = Math.sin(phase * 0.008);
        // Pulse bright
        windowAlpha = 0.5 + (wave + 1) / 4;
        composite = 'screen';
    }

    ctx.globalAlpha = windowAlpha;
    ctx.globalCompositeOperation = composite;
    ctx.drawImage(stormWindowsCache, 0, 0, safeW, safeH);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;

    ctx.restore();
}

// EXPORTED WARMUP: Called by effectPreloader.js
// Pre-renders the heavy mansion structure so it's ready for the Perfect Hit event.
export function warmupHauntedCache(w, h) {
    // Only generate if dimensions differ (or no cache exists)
    if (!stormStructureCache || !stormWindowsCache || lastStormStructW !== w || lastStormStructH !== h) {
        console.log(`[HauntedRenderer] WARMUP Storm Cache: ${w}x${h}`);
        if (typeof OffscreenCanvas !== 'undefined') {
            stormStructureCache = new OffscreenCanvas(w, h);
            stormWindowsCache = new OffscreenCanvas(w, h);
        } else {
            stormStructureCache = document.createElement('canvas'); // Fallback
            stormStructureCache.width = w;
            stormStructureCache.height = h;
            stormWindowsCache = document.createElement('canvas');
            stormWindowsCache.width = w;
            stormWindowsCache.height = h;
        }

        const sCtx = stormStructureCache.getContext('2d');
        // Render STRUCTURE ONLY
        drawHauntedHouse(sCtx, w, h, 0, 'STRUCTURE_ONLY');

        const wCtx = stormWindowsCache.getContext('2d');
        // Render WINDOWS ONLY (Lit State)
        drawHauntedHouse(wCtx, w, h, 1.0, 'WINDOWS_ONLY');

        lastStormStructW = w;
        lastStormStructH = h;
    }

    // Warmup Clouds
    warmupCloudCache(w, h);
}


// Deterministic Random Helper
function pseudoRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// --- CLOUD SYSTEM (Procedural Noise Cache) ---
let cloudCache = null;
let cloudW = 0;
let cloudH = 0;

// --- STAR SYSTEM (Dynamic Twinkle) ---
const numStars = 150;
const starField = [];

function initStars(w, h) {
    if (starField.length > 0) return; // Already init

    for (let i = 0; i < numStars; i++) {
        starField.push({
            x: Math.random() * w,
            y: Math.random() * h * 0.7, // Top 70% only
            size: Math.random() > 0.9 ? 2 : 1, // Mostly 1px stars
            baseAlpha: 0.3 + Math.random() * 0.7,
            phase: Math.random() * Math.PI * 2,
            speed: 0.5 + Math.random() * 1.5,
            color: Math.random() > 0.8 ? '#a0c0ff' : (Math.random() > 0.8 ? '#fffacd' : '#ffffff') // Blueish, Yellowish, White
        });
    }
}

function drawStarField(ctx, w, h, time) {
    if (starField.length === 0) initStars(w, h); // Lazy init

    ctx.save();
    for (let i = 0; i < starField.length; i++) {
        const s = starField[i];

        // Twinkle Logic
        const flicker = Math.sin(time * s.speed + s.phase);
        // Map -1..1 to 0.4..1.0 factor
        const alphaMod = 0.7 + flicker * 0.3;

        ctx.globalAlpha = s.baseAlpha * alphaMod;
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.restore();
}

function warmupCloudCache(w, h) {
    // Generate a noise texture for clouds (Seamless)
    if (cloudCache && cloudW === w && cloudH === h) return;

    console.log(`[HauntedRenderer] Generatng Cloud Cache ${w}x${h}`);
    cloudW = w;
    cloudH = h;

    // Low-res noise is fine for wispy clouds
    const size = 512;

    if (typeof OffscreenCanvas !== 'undefined') {
        cloudCache = new OffscreenCanvas(size, size);
    } else {
        cloudCache = document.createElement('canvas');
        cloudCache.width = size;
        cloudCache.height = size;
    }

    const ctx = cloudCache.getContext('2d');
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    // Simple layered noise
    const noise = (x, y) => {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    };

    const smoothNoise = (x, y) => {
        const i = Math.floor(x);
        const j = Math.floor(y);
        const f = x - i;
        const g = y - j;
        const a = noise(i, j);
        const b = noise(i + 1, j);
        const c = noise(i, j + 1);
        const d = noise(i + 1, j + 1);
        const u = f * f * (3 - 2 * f);
        const v = g * g * (3 - 2 * g);
        return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
    };

    // Render FBM Noise
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let total = 0;
            let frequency = 0.02;
            let amplitude = 1;
            let maxValue = 0;

            for (let i = 0; i < 4; i++) {
                total += smoothNoise(x * frequency, y * frequency) * amplitude;
                maxValue += amplitude;
                amplitude *= 0.5;
                frequency *= 2;
            }

            const val = total / maxValue; // 0.0 to 1.0

            const cell = (x + y * size) * 4;
            // Deep Purple/Blue Grey
            data[cell] = 40;     // R
            data[cell + 1] = 30; // G
            data[cell + 2] = 60; // B

            // Alpha Thresholding for "Wisp" look
            let alpha = Math.pow(val, 2.5) * 200;
            if (alpha > 150) alpha = 150; // Max opacity

            data[cell + 3] = Math.floor(alpha);
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

// Draw Scrolling Cloud Layers
function drawCloudLayer(ctx, w, h, time) {
    if (!cloudCache) return;

    ctx.save();

    // Layer 1: Slow, faraway (Background)
    ctx.globalAlpha = 0.6;
    const speed1 = 15;
    const x1 = -(time * speed1) % (w * 1.5);

    // Draw huge stretched image to cover screen width + scroll buffer
    const stretchW = w * 2.0;
    const stretchH = h * 0.8;

    // Draw twice for seamless loop
    ctx.drawImage(cloudCache, x1, 0, stretchW, stretchH);
    ctx.drawImage(cloudCache, x1 + stretchW, 0, stretchW, stretchH);

    // Layer 2: Faster, lower (Foreground Mist)
    ctx.globalAlpha = 0.3;
    const speed2 = 35;
    const x2 = -(time * speed2) % (w * 1.5);

    ctx.drawImage(cloudCache, x2, h * 0.3, stretchW, stretchH);
    ctx.drawImage(cloudCache, x2 + stretchW, h * 0.3, stretchW, stretchH);

    ctx.restore();
}

// NEW: Dense Side Clouds to fill empty space
function drawSideClouds(ctx, w, h) {
    ctx.save();

    // Helper: Draw a single "Cloud/Fog Puff"
    const drawFogPuff = (cx, cy, size, opacity) => {
        ctx.fillStyle = `rgba(15, 15, 25, ${opacity})`;
        ctx.beginPath();
        // Distort circle into cloud shape
        ctx.ellipse(cx, cy, size, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Highlight layer
        ctx.fillStyle = `rgba(35, 35, 50, ${opacity * 0.5})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy - size * 0.2, size * 0.7, size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawCloudBank = (startX, direction) => {
        // Dynamic spread: Ensure they reach towards the center
        // Reduced spread to leave center sky open for stars
        const spread = Math.max(200, w * 0.35);

        // Stack of puffy fog clouds
        // Reduced count (30 -> 15) and Opacity (0.7 -> 0.3) to let stars shine through
        for (let i = 0; i < 15; i++) {
            const size = 100 + pseudoRandom(i) * 150;
            const dist = (pseudoRandom(i + 100) ** 1.5) * spread;
            const x = startX + (dist * direction);

            // Keep clouds in the SKY
            const y = (pseudoRandom(i + 200) * h * 0.4);

            drawFogPuff(x, y, size, 0.3); // Much lighter clouds
        }
    };

    // Left Bank
    drawCloudBank(-50, 1);

    // Right Bank
    drawCloudBank(w + 50, -1);

    ctx.restore();
}

// Helper: Shared Layout Logic
function getHauntedLayout(w, h) {
    const cx = w / 2;
    // playOffsetY is imported
    const pitcherY = 150 + (playOffsetY || 0);
    const baseY = Math.max(pitcherY - 40, h * 0.2);

    // FIXED SCALE (Massive)
    const scaleY = ((baseY - 30) / 290) * 1.5;
    const scaleX = scaleY; // Keep 1:1 Aspect Ratio

    const baseMansionW = 300 * scaleX;
    const sideGap = (w - baseMansionW) / 2;
    let extraWings = 0;
    if (sideGap > 0) {
        extraWings = Math.ceil(sideGap / (90 * scaleX)) + 1; // +1 for good measure
    } else {
        extraWings = 1;
    }

    const wingsPerSide = 1 + Math.min(extraWings, 20);
    return { cx, baseY, scaleX, scaleY, horizonY: baseY, wingsPerSide };
}

// --- MODULE LEVEL HELPERS (Shared by Background and Dynamic Foreground) ---

// Helper: Draw Jagged Line with STABLE randomness
const drawJaggedLine = (ctx, x1, y1, x2, y2, width, seed) => {
    const pseudoRandom = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };

    ctx.lineWidth = width;
    ctx.strokeStyle = '#0a0f14';
    ctx.lineCap = 'square';
    ctx.lineJoin = 'bevel';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const midX = (x1 + x2) / 2 + (pseudoRandom(seed) - 0.5) * 10;
    const midY = (y1 + y2) / 2 + (pseudoRandom(seed + 1) - 0.5) * 10;
    ctx.lineTo(midX, midY);
    ctx.lineTo(x2, y2);
    ctx.stroke();
};

// SIMPLE SEEDED RNG (Linear Congruential Generator)
class SeededRNG {
    constructor(seed) { this.m = 0x80000000; this.a = 1103515245; this.c = 12345; this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1)); }
    nextInt() { this.state = (this.a * this.state + this.c) % this.m; return this.state; }
    nextFloat() { return this.nextInt() / (this.m - 1); }
    range(min, max) { return min + this.nextFloat() * (max - min); }
}

// TREE CACHE MAP: Key = unique hash of params, Value = OffscreenCanvas
const treeBitmapCache = new Map();

// Helper: Generate Cache Key
// OPTIMIZATION: Quantize scale more aggressively (0.1 steps) to maximize cache hits.
// We render at quantization levels (0.5, 0.6, ...) and scale slightly in drawImage.
const getTreeKey = (seed, isDead, scale) => `${seed}-${isDead ? 'd' : 'l'}-${scale.toFixed(1)}`;

// INTERNAL: Renders a tree to a provided context at (0, bottom)
// Renamed from drawHauntedTree to renderTreeToContext
const renderTreeToContext = (ctx, baseX, BaseY, sizeScale, leanDirection, seedBase, isDead = false, opacity = 1.0) => {
    const pseudoRandom = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
    const rnd = (seed) => pseudoRandom(seed); // Alias

    // User Request: Make trees much SMALLER and DARKER (Silhouettes)
    const effectiveScale = sizeScale * 0.5; // Global 50% reduction

    ctx.save();
    // Default opacity lowered for atmospheric blending -> REMOVED per user request
    // "Make trees not transparent anymore"
    ctx.globalAlpha = opacity;

    const drawFoliageClump = (x, y, radius, seed) => {
        ctx.save();
        // Sparser, sharper clumps (Pixel Art Style)
        const count = 3 + Math.floor(rnd(seed) * 3); // Reduced count
        for (let i = 0; i < count; i++) {
            const offX = (rnd(seed + i) - 0.5) * radius * 1.8;
            const offY = (rnd(seed + i * 2) - 0.5) * radius * 1.2;
            // Smaller, tighter leaves
            const r = radius * (0.4 + rnd(seed + i * 3) * 0.3);

            ctx.beginPath();
            ctx.arc(x + offX, y + offY, r, 0, Math.PI * 2);

            // PALETTE SWAP: Dark Blue/Grey/Black (No Green)
            const val = rnd(seed + i * 4);
            if (val > 0.8) ctx.fillStyle = '#1b262c'; // Dark Blue-Grey Highlight
            else if (val < 0.4) ctx.fillStyle = '#05070a'; // Pure Black Shadow
            else ctx.fillStyle = '#0f171a'; // Dark Slate Base

            ctx.fill();
        }
        ctx.restore();
    };

    // Recursive Branch (Spindlier)
    const drawBranch = (x, y, angle, length, width, depth, seedIndex) => {
        if (length < 2 || depth > 6) {
            // Leaf Clump at tips (if not dead)
            if (!isDead && depth > 2) {
                // Fix: Ensure radius is positive. (6-depth) can be negative if depth > 6.
                const r = Math.max(1, 15 * effectiveScale * (Math.max(0.5, 6 - depth)));
                drawFoliageClump(x, y, r, seedIndex);
            }
            return;
        }

        let endX = x + Math.cos(angle) * length;
        let endY = y + Math.sin(angle) * length;

        // Thinner lines for spindly look
        drawJaggedLine(ctx, x, y, endX, endY, width * 0.8, seedIndex);

        // Foliage along branch (Very Sparse)
        if (!isDead && depth > 3 && rnd(seedIndex * 99) > 0.7) {
            drawFoliageClump(x, y, 10 * effectiveScale, seedIndex + 10);
        }

        const s1 = seedIndex * 13.1;
        const s2 = seedIndex * 17.5;

        // More branching, sharper angles
        const splitProb = 1.0 - (depth * 0.05);
        if (rnd(s1) < splitProb) {
            drawBranch(endX, endY, angle + (rnd(s1) - 0.5) * 0.8, length * 0.7, width * 0.6, depth + 1, s1 + 1);
            if (rnd(s2) > 0.3) {
                const dir = (rnd(s2) > 0.5 ? 1 : -1);
                drawBranch(endX, endY, angle + (0.6 * dir), length * 0.5, width * 0.5, depth + 1, s2 + 2);
            }
        } else {
            drawBranch(endX, endY, angle + (rnd(s1) - 0.5) * 0.4, length * 0.8, width * 0.7, depth + 1, s1 + 1);
        }
    };

    // Trunk Gradient (Dark & Desaturated)
    const trunkW = (isDead ? 15 : 25) * effectiveScale; // Much thinner
    const trunkH = (isDead ? 220 : 180) * effectiveScale; // Taller proportionaly

    // Shadow base
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.ellipse(baseX, BaseY + 2, trunkW * 1.5, 6, 0, 0, Math.PI * 2); ctx.fill();

    // Trunk Texture
    const grad = ctx.createLinearGradient(baseX - trunkW, 0, baseX + trunkW, 0);
    grad.addColorStop(0, '#020305'); // Almost Black
    grad.addColorStop(0.4, '#1b262c'); // Dark Slate Highlight
    grad.addColorStop(1, '#000000'); // Black
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(baseX - trunkW, BaseY + 5);
    ctx.quadraticCurveTo(baseX - trunkW * 0.2, BaseY - trunkH * 0.5, baseX - trunkW * 0.4, BaseY - trunkH);
    ctx.lineTo(baseX + trunkW * 0.4, BaseY - trunkH);
    ctx.quadraticCurveTo(baseX + trunkW * 0.2, BaseY - trunkH * 0.5, baseX + trunkW, BaseY + 5);
    ctx.closePath();
    ctx.fill();

    // Start branches (Higher up)
    const startLen = (isDead ? 140 : 120) * effectiveScale;
    drawBranch(baseX, BaseY - trunkH, -Math.PI / 2 + leanDirection * 0.1, startLen, 8 * effectiveScale, 0, seedBase);

    // Low branch (only sometimes)
    if (rnd(seedBase) > 0.5) {
        drawBranch(baseX, BaseY - trunkH * 0.6, -Math.PI / 2 + leanDirection * 0.8, startLen * 0.7, 6 * effectiveScale, 0, seedBase + 50);
    }

    ctx.restore();
};

// PUBLIC: Get (or create) a cached bitmap for a specific tree configuration
const getHauntedTreeImage = (seed, isDead, lean, scale) => {
    // Quantize scale to avoid infinite cache growth during smooth animations (if any)
    const key = getTreeKey(seed, isDead, scale);

    if (treeBitmapCache.has(key)) {
        return treeBitmapCache.get(key);
    }

    // CREATE NEW CACHED IMAGE
    const extraPadding = 100 * scale;
    const w = 300 * scale + extraPadding; // Estimate bounding box heavily padded
    const h = 400 * scale + extraPadding;

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(w);
    canvas.height = Math.ceil(h);
    const offCtx = canvas.getContext('2d');

    // Draw tree at bottom center
    // Centered horizontally: w/2
    // Bottom aligned: h - padding/2
    renderTreeToContext(offCtx, w / 2, h - 50 * scale, scale, lean, seed, isDead, 1.0);

    treeBitmapCache.set(key, canvas);
    return canvas;
};

// --- END MODULE HELPERS ---


// STEP 2: Atmospheric Frame - Static Background Trees Only
// Renamed from drawGnarledTrees to avoid confusion. Now only draws distant trees.
export function drawHauntedStaticFoliage(ctx, w, h) {
    ctx.shadowBlur = 0;
    // Added wingsPerSide to calculate true width
    const { cx, baseY, scaleX, wingsPerSide } = getHauntedLayout(w, h);

    const drawCached = (x, y, scale, lean, seed, isDead) => {
        const img = getHauntedTreeImage(seed, isDead, lean, scale);
        // Anchor: Bottom Center.
        // Image logic: Tree root base was at (w/2, h - 50*scale) inside the image.
        // So drawing at (x, y) means we align (x, y) with that anchor.
        const offX = img.width / 2;
        const offY = img.height - 50 * scale;
        ctx.drawImage(img, x - offX, y - offY);
    };

    // 1. BACKGROUND TREES (Flanking Mansion) - Varied
    // Calculate safe margin based on mansion width (including wings)
    // Base center width ~120px. Wing width ~180px per pair? No, 90 per wing.

    // Width of center stack = 120. Half = 60.
    // Each wing = 90.
    // Total Half Width = (60 + wingsPerSide * 90) * scaleX.
    const mansionHalfW = (60 + wingsPerSide * 90) * scaleX;

    // Push static trees OUTSIDE this zone
    // REMOVED CLAMP (User Request: "Trees blocking view")
    // Force trees to start strictly outside the mansion wings.
    // If mansion is wider than screen, these trees will be off-screen. (Good)
    const tree1Dist = mansionHalfW + 20 * scaleX;
    const tree2Dist = mansionHalfW + 120 * scaleX;

    // Left of House
    drawCached(cx - tree1Dist, baseY + 20, 0.7, 0.2, 1000, false);
    drawCached(cx - tree2Dist, baseY + 10, 0.5, 0.1, 1050, true);
    // Removed the "Close" tree (180 offset) or pushed it way out
    // drawCached(cx - 180... ) -> merged into tree1Dist/tree2Dist logic

    // Right of House
    drawCached(cx + tree1Dist, baseY + 20, 0.7, -0.2, 2000, false);
    drawCached(cx + (tree2Dist + 40 * scaleX), baseY + 15, 0.6, -0.1, 2050, true);
}

// --- DYNAMIC FOREGROUND LAYER (Cached) ---
let foregroundTreeCache = null;
let lastCacheDim = { w: 0, h: 0 };

// Generates the layout of trees respecting "Clear Zones" and "Paths"
function generateHauntedForegroundTrees(w, h) {
    const trees = [];
    // Added scaleX/baseY/wingsPerSide for Mansion exclusion
    const { cx, baseY, scaleX, horizonY, wingsPerSide } = getHauntedLayout(w, h);

    // Config: Less common trees
    const numTrees = 10; // Reduced from 20 -> 10

    // Bounds
    // User Request: "Trees blocking view... can't spawn past certain height"
    // Push trees further down (Foreground Only) to keep Mansion view clear.
    const minY = horizonY + 180;
    const maxY = h;

    /*
     * LAYOUT STRATEGY:
     * 1. Allow trees ANYWHERE in the Graveyard (Mid-Ground).
     * 2. Protected Zones: Paths, Center Lane, Mansion.
     */

    // ... (RNG and Exclusion Logic unchanged until scale) ...
    // Note: I will need to replace the loop block to change scale.

    // THIS TOOL CALL REPLACES *drawHauntedForeground* logic primarily? 
    // Wait, I need to replace separate chunks. Let's do the spawn config first.

    // ...


    /*
     * LAYOUT STRATEGY:
     * 1. Allow trees ANYWHERE in the Graveyard (Mid-Ground).
     * 2. Protected Zones: Paths, Center Lane, Mansion.
     */

    // STABILIZATION: Use seeded RNG
    const rng = new SeededRNG(12345);

    // Params for Exclusion
    const homeY = h * 0.85; // Approx home plate Y
    const hubRadius = 70;
    const dxHub = hubRadius / 1.8;
    const dyHub = 1.5 * dxHub;
    const sxL = cx - dxHub; // Left Line Start
    const syL = homeY - dyHub;
    const sxR = cx + dxHub; // Right Line Start
    const syR = homeY - dyHub;

    const isCloseToLine = (px, py, lX, lY, dirX) => {
        // Project point onto line vector
        // Eq: y - y1 = m(x - x1). m = 1.5 * dirX. Abs(m*x - y + C) / sqrt(m^2+1)
        const m = (dirX < 0) ? 1.5 : -1.5;
        const A = m;
        const B = -1;
        const C = lY - m * lX;
        return Math.abs(A * px + B * py + C) / Math.sqrt(A * A + B * B);
    };

    let attempts = 0;
    while (trees.length < numTrees && attempts < 600) {
        attempts++;

        let x = rng.nextFloat() * w;
        let y = minY + rng.nextFloat() * (maxY - minY);

        // 1. STRICT EDGE RULE - REMOVED!
        // Allow trees to spawn anywhere in the "Graveyard" (mid-ground).
        // The Path and Mansion checks are sufficient to keep gameplay clean.
        // This fixes the "Artificial Line of Trees" artifact.

        /*
        const edgeLimit = w * 0.10;
        if (x > edgeLimit && x < (w - edgeLimit)) {
             if (y > h * 0.65) continue;
        }
        */

        // 2. LINE CHECK (The Stone Paths) - TAPERED for Perspective!
        // Taper factor: 0.0 at top, 1.0 at bottom.
        const taper = (y - horizonY) / (maxY - horizonY);
        const safeDist = 55 + taper * 50; // 55px at top, 105px at bottom

        const distL = isCloseToLine(x, y, sxL, syL, -1);
        const distR = isCloseToLine(x, y, sxR, syR, 1);
        if (distL < safeDist || distR < safeDist) continue;

        // 3. BALL FLIGHT LANE (Center Clearance)
        if (Math.abs(x - cx) < 60) continue;

        // 4. MANSION PROTECTION (Central Only + Canopy Buffer)
        // We check TRUNK position (x). Leaves extend ~40-50px sideways.
        // So we need: MansionEdge + LeafRadius.
        const leafRadius = 45;

        // Dynamic Mansion Width logic:
        const mansionRealHalfW = (60 + wingsPerSide * 90) * scaleX;

        // Clamp for Ultra-Wide Screens (allow overlap on outer wings only)
        // Cap only if extreme width. 
        const maxProtectedHalfW = 240 * scaleX;

        // Use the smaller of REAL or MAX, then add safety buffer.
        const protectionBase = Math.min(mansionRealHalfW, maxProtectedHalfW);
        const safeZoneHalfW = protectionBase + leafRadius;

        if (Math.abs(x - cx) < safeZoneHalfW) continue;

        // 5. PROPERTIES
        // STABILIZATION FIX: Use the stable 'index' of the tree (0, 1, 2...) 
        // to determine its personality. This prevents the tree from changing its 
        // shape/dead-status just because the window resized and position shifted slightly.
        const treeIndex = trees.length;

        // Create a secondary RNG just for this tree's properties
        // We use a large multiplier to separate the seeds
        const propSeed = 777 + (treeIndex * 1337);
        const propRng = new SeededRNG(propSeed);

        const isDead = propRng.nextFloat() > 0.4;
        const progress = (y - horizonY) / (h - horizonY);
        // Shorter trees: 0.5 to 1.0 scale (was 0.8 to 1.6)
        const scale = 0.5 + progress * 0.5;
        const lean = (x < cx) ? 0.4 : -0.4;

        // Use 'treeIndex' as the ID instead of 'attempts'
        trees.push({ x, y, scale, lean, isDead, id: treeIndex });
    }

    // FIXED Corner Frames REMOVED per user request
    // "Trees blocking the view"

    // SORT BY Y
    trees.sort((a, b) => a.y - b.y);

    return trees;
}
















// EXPORTED: Called every frame by renderer.js
export function drawHauntedForeground(ctx, w, h, playerPos) {
    if (!foregroundTreeCache || lastCacheDim.w !== w || lastCacheDim.h !== h) {
        foregroundTreeCache = generateHauntedForegroundTrees(w, h);
        lastCacheDim = { w, h };
    }

    const fadeRadius = 250; // px

    foregroundTreeCache.forEach(t => {
        // Calculate Distance to Player
        // User Request: "Not transparent anymore" - Always solid.
        const opacity = 1.0;

        /* 
        if (playerPos) {
           // ... fade logic removed ...
        }
        */

        // Draw Cached Bitmap
        const img = getHauntedTreeImage(5000 + t.id, t.isDead, t.lean, t.scale);

        ctx.save();
        ctx.globalAlpha = opacity; // Opacity applied to the whole bitmap

        const offX = img.width / 2;
        const offY = img.height - 50 * t.scale;

        ctx.drawImage(img, t.x - offX, t.y - offY);
        ctx.restore();
    });
}


// Helper: Procedural Lightning Bolt
const drawLightningBolt = (ctx, x1, y1, x2, y2, displace, width = 2) => {
    if (displace < 40) { // Limit recursion
        ctx.lineWidth = width;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        return;
    }
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    // Perpendicular offset assumption? Just random jitter is usually enough for "chaos" lightning
    // But Perpendicular looks better. Let's just do random chaos for speed.
    const offsetX = (Math.random() - 0.5) * displace;
    const offsetY = (Math.random() - 0.5) * displace;
    drawLightningBolt(ctx, x1, y1, midX + offsetX, midY + offsetY, displace / 1.8, width);
    drawLightningBolt(ctx, midX + offsetX, midY + offsetY, x2, y2, displace / 1.8, width);
};



// Helper: Wrought Iron Fence (Silhouette)
const drawWroughtIronFence = (ctx, startX, startY, width, height) => {
    ctx.save();
    ctx.fillStyle = '#050505';
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 2;

    const numPosts = Math.floor(width / 15);
    const postGap = width / numPosts;

    // Horizontal Rails
    ctx.fillRect(startX, startY + height * 0.2, width, 3);
    ctx.fillRect(startX, startY + height * 0.8, width, 3);

    // Vertical Pickets
    for (let i = 0; i <= numPosts; i++) {
        const x = startX + i * postGap;
        // Main Post every 5
        if (i % 5 === 0) {
            ctx.fillRect(x - 2, startY, 4, height);
            // Finial
            ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x - 3, startY - 6); ctx.lineTo(x + 3, startY - 6); ctx.fill();
        } else {
            // Picket
            ctx.fillRect(x - 1, startY + 5, 2, height - 5);
            // Spike
            ctx.beginPath(); ctx.moveTo(x, startY + 5); ctx.lineTo(x, startY); ctx.stroke();
        }
    }
    ctx.restore();
};

// Helper: Dead Grass Tufts
const drawDeadGrass = (ctx, x, y, scale, seed) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = '#050505'; // Silhouette
    ctx.lineWidth = 1;

    const numBlades = 3 + Math.floor(Math.abs(Math.sin(seed) * 3));
    for (let i = 0; i < numBlades; i++) {
        const angle = -Math.PI / 2 + (Math.sin(seed + i) * 0.5);
        const len = 5 + Math.abs(Math.cos(seed * i) * 6);
        ctx.beginPath();
        ctx.moveTo(0, 0); // Root
        // Bendy blade
        ctx.quadraticCurveTo(Math.cos(angle) * len * 0.5, Math.sin(angle) * len * 0.5, Math.cos(angle) * len, Math.sin(angle) * len);
        ctx.stroke();
    }
    ctx.restore();
};

export function drawHauntedHouse(ctx, w, h, stormIntensity = 0, renderMode = 'FULL', timestamp = 0, layoutOverride = null) {
    // Render Flags
    const drawStructure = renderMode !== 'WINDOWS_ONLY';
    const drawWindows = renderMode !== 'STRUCTURE_ONLY';

    // Retrieve layout (or use override)
    const { cx, baseY, scaleX, scaleY, wingsPerSide } = layoutOverride || getHauntedLayout(w, h);

    ctx.save();
    ctx.translate(cx, baseY);
    ctx.scale(scaleX, scaleY);

    // PALETTE
    const cWall = '#4a4e57';     // Lighter grey-blue stone
    const cWallDark = '#2e3238'; // Shadowed parts
    const cRoof = '#1a1d23';     // Dark slate roof
    const cTrim = '#6c757d';     // Stone trim

    // Depth Constants for Parallel Perspective (Global for all helpers)
    const depthX = 6;
    const depthY = 4;

    // Reactive Window Logic (Storm Effect)
    const isStorm = stormIntensity > 0.5;
    const cWinLit = isStorm ? '#e0f7fa' : '#feca57';   // Electric Blue vs Warm Yellow
    const cWinDark = '#1e272e';  // Dark glass

    // --- HELPER: EXTRUDE BOX SIDE - PARALLEL PERSPECTIVE (VISIBLE EDGES) ---
    const drawReturn = (x, y, w, h) => {
        // ALWAYS DRAW LEFT SIDE RETURN (Visible when depth goes Left)
        // This ensures Left Wings show depth on their left/outer side
        // and Right Wings show depth on their left/inner side.

        const frontX = x; // Always visible LEFT edge
        const backX = frontX - depthX; // Goes left

        const topY = y;
        const botY = y + h;
        const backTopY = topY - depthY;
        const backBotY = botY - depthY;

        ctx.beginPath();
        ctx.moveTo(frontX, botY);
        ctx.lineTo(frontX, topY);
        ctx.lineTo(backX, backTopY);
        ctx.lineTo(backX, backBotY);
        ctx.closePath();

        // Gradient - darker now
        const g = ctx.createLinearGradient(frontX, 0, backX, 0);
        g.addColorStop(0, '#050508');
        g.addColorStop(1, '#000000');
        ctx.fillStyle = g;
        ctx.fill();

        // Texture - REMOVED for Darker Depth
        /*
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(frontX, botY);
        ctx.lineTo(frontX, topY);
        ctx.lineTo(backX, backTopY);
        ctx.lineTo(backX, backBotY);
        ctx.closePath();
        ctx.clip();
        ctx.globalAlpha = 0.5;
        drawBrickwork(Math.min(frontX, backX) - 5, backTopY - 5, Math.abs(frontX - backX) + 10, (botY - backTopY) + 10, true);
        ctx.restore();
        */

        // Edge definition
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(frontX, topY);
        ctx.lineTo(frontX, botY);
        ctx.stroke();
    };
    const cFrame = '#0b0e11';    // Black frames
    const cShadowBack = '#15181c'; // Darkest backing

    // Help: Pixel-art rect
    const rect = (x, y, w, h, c) => {
        ctx.fillStyle = c;
        if (isStorm && c === cWinLit) {
            ctx.shadowColor = '#00e5ff'; // Electric Cyan Glow
            ctx.shadowBlur = 40; // INTENSE GLOW
        }
        ctx.fillRect(x, y, w, h);
        ctx.shadowBlur = 0; // Reset
    };



    // Helper: Roof Texture
    const drawRoofTexture = (x, y, w, h, topWidth) => {
        ctx.save();
        ctx.strokeStyle = '#252930';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const diamondSize = 6;
        const startY = y;
        const endY = y - h;
        for (let ry = startY; ry > endY; ry -= diamondSize) {
            const offset = ((Math.abs(ry) / diamondSize) % 2) * (diamondSize / 2);
            for (let rx = x - w; rx < x + w; rx += diamondSize) {
                ctx.moveTo(rx + offset, ry);
                ctx.lineTo(rx + offset + diamondSize / 2, ry - diamondSize);
                ctx.lineTo(rx + offset + diamondSize, ry);
            }
        }
        ctx.stroke();
        ctx.restore();
    };

    // Helper: Shingled Roof Texture (Replaces Diamond)
    const drawShingledRoof = (x, y, w, h) => {
        const rowH = 6; // Taller rows for readability
        // Draw rows from bottom to top
        for (let ry = y; ry > y - h; ry -= rowH) {
            const shade = 25 + pseudoRandom(ry) * 5;
            const cRow = `rgb(${shade}, ${shade}, ${shade + 10})`;

            // Random Shingle Logic (Drawing individually vs full row for gaps)
            // But full row is safer for base opacity.
            ctx.fillStyle = cRow;
            ctx.fillRect(x - w, ry - rowH, w * 2, rowH);

            // Bottom Shadow (Depth)
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(x - w, ry, w * 2, 1);

            // Per-Shingle Variance & Damage
            const shingleW = 8;
            // Align to grid
            const rowOffset = ((Math.abs(ry) / rowH) % 2) * (shingleW / 2);

            for (let rx = x - w + rowOffset; rx < x + w; rx += shingleW) {
                const seed = pseudoRandom(rx * ry);

                // DAMAGE: Missing Shingle (Dark hole)
                if (seed > 0.96) {
                    ctx.fillStyle = '#050505'; // Hole
                    ctx.fillRect(rx + 1, ry - rowH + 1, shingleW - 2, rowH - 1);
                    // Add "Broken" edge? Simple rect is fine for pixel art.
                    continue; // Skip decorative highlights
                }

                // Individual Color Variance
                if (seed > 0.75) {
                    // Lighter / Worn
                    ctx.fillStyle = 'rgba(255,255,255,0.06)';
                    ctx.fillRect(rx, ry - rowH, shingleW, rowH - 1);
                } else if (seed < 0.2) {
                    // Darker / Mossy
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.fillRect(rx, ry - rowH, shingleW, rowH - 1);
                }

                // Vertical Divider (Gap)
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(rx + shingleW - 1, ry - rowH, 1, rowH);
            }
        }
    };

    // Helper: Brickwork
    const drawBrickwork = (x, y, w, h, transparentMortar = false) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        if (!transparentMortar) {
            ctx.fillStyle = '#2c2c2c'; // Mortar (only if opaque)
            ctx.fillRect(x, y, w, h);
        }

        const rowH = 10;
        const brickBaseW = 14;

        for (let by = y; by < y + h; by += rowH) {
            const isOffset = Math.floor((by - y) / rowH) % 2 === 1;
            let bx = x - (isOffset ? brickBaseW / 2 : 0);
            while (bx < x + w) {
                const brickW = brickBaseW;
                const seed = Math.sin(bx * by) * 10000;
                let baseColor;
                const val = seed - Math.floor(seed);
                if (val > 0.8) baseColor = '#5a5e68';
                else if (val > 0.4) baseColor = '#4a4e57';
                else baseColor = '#3e4249';

                ctx.fillStyle = '#636e72';
                ctx.fillRect(bx, by, brickW - 1, 1);
                ctx.fillStyle = baseColor;
                ctx.fillRect(bx, by + 1, brickW - 1, rowH - 3);
                ctx.fillStyle = '#2d3436';
                ctx.fillRect(bx, by + rowH - 2, brickW - 1, 1);
                bx += brickW;
            }
        }
        ctx.restore();
    };
    // Alias for compatibility if I miss any calls, though I should replace them.
    const drawStonework = drawBrickwork;

    // Shared Constants
    const baseSpacing = 90;
    const wingWidth = 60;
    const depthXLocal = 6;
    const depthYLocal = 4;

    const maxOffset = baseSpacing + (wingsPerSide - 1) * wingWidth;
    const outerBackX = maxOffset + 5 + depthXLocal;

    // Geometry Refinement
    const backWallBottom = -20;
    const backWallTop = -98;    // Eaves height
    const backRoofPeakY = -140; // Ridge height

    // --- 0. BACK WALL VOLUME - REMOVED ---
    // Back structure removed per user request


    // Detailed Window (Multi-pane) with Depth ("Cut Into Wall")
    const drawWindow = ({ x, y, w, h, arched, lit, phase = 0, ignoreStorm = false }) => {
        ctx.save();

        // 1. Cut the Hole (Inner Cavity)
        // Darker than the frame, creates the illusion of depth
        ctx.fillStyle = '#05070a'; // Deepest shadow
        if (arched) {
            ctx.beginPath();
            ctx.moveTo(x, y + h);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x + w, y + h * 0.3);
            ctx.quadraticCurveTo(x + w / 2, y - h * 0.1, x, y + h * 0.3);
            ctx.fill();
        } else {
            ctx.fillRect(x, y, w, h);
        }

        // 2. Inner Shadow (Top & Left edges cast shadow inside)
        // This sells the "Recessed" look
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 2; // Thicker shadow for frame depth
        ctx.beginPath();
        if (arched) {
            // Trace Top and Left inner edge
            ctx.moveTo(x + w, y + h * 0.3); // Right Top start (actually we want Left and Top)
            // Start Bottom Left
            ctx.moveTo(x, y + h);
            ctx.lineTo(x, y + h * 0.3);
            ctx.quadraticCurveTo(x + w / 2, y - h * 0.1, x + w, y + h * 0.3);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(x + w, y); // Top Right
            ctx.lineTo(x, y);     // Top Left
            ctx.lineTo(x, y + h); // Bottom Left
            ctx.stroke();
        }

        // 3. Glass / Light (Inset by frame width ~2px)
        const frameW = 2;
        const gx = x + frameW;
        const gy = y + frameW; // Arched needs logic? Approximation for small scale.
        const gw = w - frameW * 2;
        const gh = h - frameW * 2;

        // FORCE LIT / PULSE IF STORM
        let pulseIntensity = 0;
        if (isStorm && !ignoreStorm) {
            lit = true;
            // Spectral Wave Logic
            if (timestamp > 0) {
                const wave = Math.sin(phase + timestamp * 0.008);
                pulseIntensity = (wave + 1) / 2; // 0.0 to 1.0

                // Interpolate Colors: Deep Blue (#2962ff) -> Bright Cyan (#00e5ff) -> White (#ffffff)
                // Optimized linear blend for speed
                const r = Math.floor(40 + (255 - 40) * pulseIntensity);
                const g = Math.floor(100 + (255 - 100) * pulseIntensity);
                const b = 255;

                ctx.fillStyle = `rgb(${r},${g},${b})`;
            } else {
                ctx.fillStyle = '#e0f7fa'; // Static Storm (Fallback)
            }
        } else if (lit) {
            const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 2, x + w / 2, y + h / 2, w);
            g.addColorStop(0, '#ffca28'); // Bright center (Amber)
            g.addColorStop(1, '#ff6f00'); // Orange edge
            ctx.fillStyle = g;
        } else {
            ctx.fillStyle = '#15181c'; // Dark Glass reflection
        }

        if (lit && isStorm && !ignoreStorm) {
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 20 + 30 * pulseIntensity;
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        if (arched) {
            // Simply fill slightly smaller path
            ctx.moveTo(gx, y + h - frameW);
            ctx.lineTo(gx + gw, y + h - frameW);
            ctx.lineTo(gx + gw, y + h * 0.3);
            ctx.quadraticCurveTo(x + w / 2, y - h * 0.1 + frameW, gx, y + h * 0.3);
            ctx.fill();
        } else {
            ctx.fillRect(gx, gy, gw, gh);
        }
        ctx.shadowBlur = 0; // Clear for mullions

        // 4. Frame Detail (Beveled)
        // Light Top/Left, Dark Bottom/Right
        ctx.borderWidth = 1;

        // Frame Highlight (Top/Left outside)
        ctx.strokeStyle = '#636e72'; // Lighter Stone/Wood
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (arched) {
            ctx.moveTo(x + w, y + h * 0.3);
            ctx.quadraticCurveTo(x + w / 2, y - h * 0.1, x, y + h * 0.3);
            ctx.lineTo(x, y + h);
        } else {
            ctx.moveTo(x + w, y); ctx.lineTo(x, y); ctx.lineTo(x, y + h);
        }
        ctx.stroke();

        // Frame Shadow (Bottom/Right outside)
        ctx.strokeStyle = '#000';
        ctx.beginPath();
        if (arched) {
            ctx.moveTo(x + w, y + h * 0.3); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h);
        } else {
            ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h);
        }
        ctx.stroke();

        // Mullions (Grid)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h);
        ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2);
        ctx.stroke();

        ctx.restore();
    };





    // Mansard Roof Section (Victorian Style)
    const drawMansardRoof = (x, y, w, h) => {
        const overhang = 8;
        const topWidth = w * 0.6; // Wider top platform

        ctx.fillStyle = cRoof;
        ctx.beginPath();
        ctx.moveTo(x - w / 2 - overhang, y);
        ctx.lineTo(x + w / 2 + overhang, y);
        ctx.lineTo(x + topWidth / 2, y - h);
        ctx.lineTo(x - topWidth / 2, y - h);
        ctx.fill();

        // 1. Shingled Texture
        ctx.save();
        ctx.clip(); // Clip to the roof shape we just drew
        drawShingledRoof(x, y, w + overhang * 2, h);
        ctx.restore();

        // 3D CORNICE SLAB (Thick Overhang)
        const ch = 5;
        const cw = w + overhang * 2;
        const cx = x - cw / 2;
        // Main Face
        ctx.fillStyle = '#1a1c21';
        ctx.fillRect(cx, y, cw, ch);
        // Highlight Top Edge
        ctx.fillStyle = '#3e4249'; ctx.fillRect(cx, y, cw, 1);
        // Shadow Bottom Edge
        ctx.fillStyle = '#08090a'; ctx.fillRect(cx, y + ch - 1, cw, 1);

        // RIDGE CAP (Top)
        ctx.fillStyle = '#1a1c21';
        ctx.fillRect(x - topWidth / 2 - 2, y - h - 2, topWidth + 4, 3);
        ctx.fillStyle = '#3e4249'; // Highlight
        ctx.fillRect(x - topWidth / 2 - 2, y - h - 2, topWidth + 4, 1);

        // RIDGE CAP SIDE RETURN (3D Depth)
        // Since it's at the top, we want to match the tower's left-going depth
        ctx.fillStyle = '#050508'; // Shadow color
        ctx.beginPath();
        const capLeft = x - topWidth / 2 - 2;
        ctx.moveTo(capLeft, y - h - 2);
        ctx.lineTo(capLeft - depthX, y - h - 2 - depthY);
        ctx.lineTo(capLeft - depthX, y - h + 1 - depthY);
        ctx.lineTo(capLeft, y - h + 1);
        ctx.fill();


        // Top Railing (Iron Cresting) - GOTHIC
        ctx.strokeStyle = '#0a0a0d';
        ctx.fillStyle = '#0a0a0d';
        ctx.lineWidth = 1.5;

        // Main rails
        ctx.beginPath();
        ctx.moveTo(x - topWidth / 2, y - h); ctx.lineTo(x + topWidth / 2, y - h);
        ctx.moveTo(x - topWidth / 2, y - h - 5); ctx.lineTo(x + topWidth / 2, y - h - 5);
        ctx.stroke();

        // Spikes with Finials
        const spikeSpacing = 6;
        for (let i = 0; i <= topWidth; i += spikeSpacing) {
            const rx = x - topWidth / 2 + i;
            ctx.beginPath();
            ctx.moveTo(rx, y - h);
            ctx.lineTo(rx, y - h - 10); // Tall spike
            ctx.stroke();
            // Tiny ball on top
            ctx.beginPath(); ctx.arc(rx, y - h - 11, 1.5, 0, Math.PI * 2); ctx.fill();
        }

        // --- MANARD ROOF PARALLEL DEPTH FIX ---
        // Add 3D Side Return (Left Side visible)
        ctx.fillStyle = '#050508'; // Match Wall Shadow
        ctx.beginPath();
        // Left edge of roof base
        const roofBaseLeft = x - w / 2 - overhang;
        const roofTopLeft = x - topWidth / 2;

        ctx.moveTo(roofBaseLeft, y);
        ctx.lineTo(roofBaseLeft - depthX, y - depthY); // Back-Left Base
        ctx.lineTo(roofTopLeft - depthX, y - h - depthY); // Back-Left Top
        ctx.lineTo(roofTopLeft, y - h);
        ctx.closePath();
        ctx.fill();

        // Edge Highlight
        ctx.strokeStyle = '#3e4249'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(roofBaseLeft, y);
        ctx.lineTo(roofTopLeft, y - h);
        ctx.stroke();
    };

    // Helper: Volumetric Dormer
    const drawDormer3D = (x, y, w, h) => {
        const dDepth = 8;
        const rh = 12; // Roof height

        ctx.save();

        if (drawStructure) {
            // 1. Cast Shadow (Base)
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.ellipse(x, y + 2, w / 2 + 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // 2. Front Face
            rect(x - w / 2, y - h, w, h, cWall);
            drawBrickwork(x - w / 2, y - h, w, h);

            // 3. Side Walls (PARALLEL PERSPECTIVE - Left Side Only)
            ctx.fillStyle = '#1a1d22'; // Match shadow color
            ctx.beginPath();
            // Left Side Visible
            const dX = x - w / 2;
            ctx.moveTo(dX, y - h);
            ctx.lineTo(dX - depthX, y - h - depthY); // Back-Left
            ctx.lineTo(dX - depthX, y - depthY);
            ctx.lineTo(dX, y);
            ctx.fill();
            // Edge
            ctx.strokeStyle = '#000'; ctx.lineWidth = 0.5; ctx.stroke();

            // 4. Roof (Gabled)
            ctx.fillStyle = cRoof;
            ctx.beginPath();
            ctx.moveTo(x - w / 2 - 4, y - h); // Overhang Left
            ctx.lineTo(x + w / 2 + 4, y - h); // Overhang Right
            ctx.lineTo(x, y - h - rh);      // Peak
            ctx.fill();

            // Roof Shadow on Front Face
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath(); ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x + w / 2, y - h); ctx.lineTo(x, y - h + 4); ctx.fill();

            // Roof Texture
            ctx.save();
            ctx.clip();
            drawShingledRoof(x, y - h, w + 8, rh);
            ctx.restore();
        }

        // 5. Window
        if (drawWindows) {
            drawWindow({ x: x - w / 2 + 2, y: y - h + 3, w: w - 4, h: h - 5, arched: true, lit: true });
        }

        ctx.restore();
    };

    // --- MODULAR COMPONENT: WING (STACKED BOXES) ---
    const drawWing = (offsetX, isRight, isOuter, index) => {
        const sign = isRight ? 1 : -1;
        const wx = offsetX * sign;
        const wingW = 60; // Base Width of Wing Block

        ctx.save();
        ctx.translate(wx, 0);

        // --- STACKED BOX ARCHITECTURE ---
        // We render 3 Distinct Volumetric Boxes:
        // 1. Floor 1 (Ground)
        const f1H = 50;
        const f1Y = 0; // Ground Level
        const beltH = 6; // Protruding Decorative Belt

        // PUSH IN: Make Floor 2 narrower to simulate height/distance
        const f2Inset = 3;
        const f2W = wingW - (f2Inset * 2); // 54px
        const f2H = 40;
        const f2Y = -f1H - beltH; // Sits on top of belt
        const roofY = f2Y - f2H;

        // Depth Constants moved to top of function







        // --- 1. FLOOR 1 BOX ---
        const f1X = -wingW / 2;

        if (drawStructure) {
            // A. Side Return - ONLY FOR FAR LEFT OUTER WING
            if (isOuter && !isRight) {
                drawReturn(f1X, -f1H, wingW, f1H);
            }

            // B. Front Face
            rect(f1X, -f1H, wingW, f1H, cWall);
            drawBrickwork(f1X, -f1H, wingW, f1H); // USE BRICKWORK

            // CAST SHADOW: Belt onto F1 (Down-Right)
            if (true) {
                ctx.fillStyle = 'rgba(0,0,0,0.35)'; // Shadow color
                ctx.fillRect(f1X + 4, -f1H, wingW - 4, 6);
            }

            // C. Base Trim
            rect(f1X - 2, -f1H, wingW + 4, 5, cTrim);
        }


        // --- 2. BELT COURSE (The Ledge) ---
        const beltW = wingW + 4; // Sticks out
        const beltX = -beltW / 2;

        const f2X = -f2W / 2;
        const f2Top = f2Y - f2H;

        if (drawStructure) {
            // Side Return - ONLY FOR FAR LEFT OUTER WING
            if (isOuter && !isRight) {
                drawReturn(beltX, f2Y + beltH, beltW, beltH);

                // BELT CONNECTOR (Fixes Floating Gap)
                // The belt itself needs a return to bridge F1 and F2 returns
                ctx.fillStyle = '#050508'; // Darkest depth
                // Draw a simple block at the belt's position offset by depth
                // It draws from the left edge of the belt, backwards
                const beltReturnX = beltX;
                ctx.beginPath();
                ctx.moveTo(beltReturnX, f2Y);
                ctx.lineTo(beltReturnX, f2Y + beltH);
                ctx.lineTo(beltReturnX - depthX, f2Y + beltH - depthY);
                ctx.lineTo(beltReturnX - depthX, f2Y - depthY);
                ctx.closePath();
                ctx.fill();

                // STEP SEAL (Top Cap Fix)
                // Fills the horizontal gap between the wider Belt and the narrower F2 Wall
                // Points: F2Front -> BeltFront -> BeltBack -> F2Back
                const f2ReturnX = f2X; // F2 is centered, this is its left edge
                ctx.beginPath();
                ctx.moveTo(f2ReturnX, f2Y);
                ctx.lineTo(beltReturnX, f2Y);
                ctx.lineTo(beltReturnX - depthX, f2Y - depthY);
                ctx.lineTo(f2ReturnX - depthX, f2Y - depthY);
                ctx.closePath();
                ctx.fill();
            }

            // Front Face (Corrected Y Position to stack on F1)
            rect(beltX, f2Y, beltW, beltH, cTrim);

            // Slab Detail: Highlight Top, Shadow Bottom
            ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(beltX, f2Y, beltW, 1);
            ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(beltX, f2Y + beltH - 1, beltW, 1);


            // --- 3. FLOOR 2 BOX (INSET) ---

            // Belt Top Surface (Ledge visible due to inset)
            ctx.fillStyle = '#6a6e75'; // Lit Top
            ctx.fillRect(beltX, f2Y, beltW, 2);

            // Side Return - ONLY FOR FAR LEFT OUTER WING
            if (isOuter && !isRight) {
                drawReturn(f2X, f2Top, f2W, f2H);
            }

            // Front Face
            rect(f2X, f2Top, f2W, f2H, cWall);
            drawBrickwork(f2X, f2Top, f2W, f2H); // USE BRICKWORK

            // CAST SHADOW: Roof onto F2 (Down-Right Gradient)
            if (true) {
                const shG = ctx.createLinearGradient(0, f2Top, 0, f2Top + 12);
                shG.addColorStop(0, 'rgba(0,0,0,0.8)');
                shG.addColorStop(1, 'rgba(0,0,0,0.0)');
                ctx.fillStyle = shG;
                ctx.fillRect(f2X + 4, f2Top, f2W - 4, 12);
            }

            // Divider Trim
            rect(f2X - 2, f2Y - 3, f2W + 4, 4, cTrim);
        }

        // --- 4. ROOF BOX (Sloped) ---
        const rBaseW = f2W + 8; // Overhang
        const rH = 40;
        const rX = -rBaseW / 2;
        const rTopY = f2Top - rH; // Need for calculations

        if (drawStructure) {
            // Roof Side Return - SYMMETRIC PERSPECTIVE
            if (true) {
                // PARALLEL PERSPECTIVE: Select visible edge for each wing
                // LEFT wings: use right edge | RIGHT wings: use left edge
                const edgeX = isRight ? rX : (rX + rBaseW);

                const topW = rBaseW * 0.55;
                const topX = rX + rBaseW / 2 - topW / 2;

                const slantW = (rBaseW - topW) / 2;
                const topEdgeX = isRight ? (rX + slantW) : (rX + rBaseW - slantW);

                // Redux Depth: Make side roof feel "attached" not huge
                const roofDepthX = depthX * 0.8;
                // PARALLEL: All depth goes left
                const rBackX = edgeX - roofDepthX; // Always subtract
                const rBackTopX = topEdgeX - roofDepthX; // Always subtract


                ctx.beginPath();
                ctx.moveTo(edgeX, f2Top);
                ctx.lineTo(topEdgeX, rTopY);
                ctx.lineTo(rBackTopX, rTopY - depthY);
                ctx.lineTo(rBackX, f2Top - depthY);
                ctx.closePath();

                // Gradient - darker now
                const rg = ctx.createLinearGradient(edgeX, 0, rBackX, 0);
                rg.addColorStop(0, '#050508'); // Match walls
                rg.addColorStop(1, '#000000'); // Match walls
                ctx.fillStyle = rg;
                ctx.fill();

                // Shingle Rows on Perspective Side (REAL TEXTURE)
                ctx.save();
                ctx.clip(); // Clip to the side shape

                // Draw Full Shingles but Darkened
                // FIX: Draw from Base (f2Top) upwards
                const roofH = f2Top - (rTopY - depthY) + 20;
                drawShingledRoof(Math.min(edgeX, rBackX) - 50, f2Top, 200, roofH);

                // Shadow Overlay (Reduced opacity to reveal texture)
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fill();
                ctx.restore();

                // Edge Highlight
                ctx.strokeStyle = '#3e4249'; ctx.lineWidth = 1; ctx.stroke();
            }

            // Front Roof
            drawMansardRoof(0, f2Top, rBaseW, rH);
        }


        // --- 5. WINDOWS & DORMERS ---
        // Windows (Stable Randomness via Index)
        const seed1 = pseudoRandom(index * 11 + (isRight ? 100 : 0));
        const seed2 = pseudoRandom(index * 13 + (isRight ? 200 : 0));
        const seed3 = pseudoRandom(index * 17 + (isRight ? 300 : 0));
        const lit1 = !isOuter || seed1 > 0.5;
        const lit2 = seed2 > 0.3;

        // Calculate Spectral Phase (Distance from center determines wave offset)
        const wingDist = Math.abs(wx);
        const wingPhase = wingDist * 0.015; // Tuning: 0.015 gives nice ripple width

        // F1 Window (Centered in F1)
        if (drawWindows) {
            drawWindow({ x: -10, y: -40, w: 20, h: 25, arched: true, lit: lit1, phase: wingPhase });

            // F2 Window (Centered in F2, scaled down slightly)
            drawWindow({ x: -9, y: f2Top + 12, w: 18, h: 18, arched: false, lit: lit2, phase: wingPhase });
        }

        // Dormer (Volumetric) - drawDormer3D handles its own checks now!
        // Wait, drawDormer3D(x,y,w,h) calls our updated local helper which checks flags.
        // But we should only CALL it if we are drawing something.
        // Actually, since it has both parts, we must call it if EITHER is true.
        if (!isOuter || seed3 > 0.5) {
            const dY = f2Top - 25;
            drawDormer3D(0, dY + 12, 16, 12);
        }



        ctx.restore();
    };

    // --- RENDER LOOP ---
    // 1. Central Tower (Always drawn)

    // --- RENDER LOOP ---
    // REORDERED: Central Tower & Main Hall FIRST (so they are BEHIND the wings)

    // 1. Central Tower (Background Tier)
    // TOWER STACKED BOX
    // T1: Base (-90 to -150) -> T2: Upper (-150 to -210)

    // Tower F1 Structure
    const tW = 54; // Matched to t2W for vertical alignment
    const tH = 60;
    const tY = -90; // Sits on top of Central Hall F2

    // Tower Belt
    const tbW = 66; // Protrude
    const tbH = 8;
    const tbY = tY - tH - tbH;

    // Tower Upper (F2)
    const tCenterOffset = -2; // Nudge left
    const t2W = 54;
    const t2H = 50;
    const t2Y = tbY;

    if (drawStructure) {
        // T1 Left Side Depth (Parallel Perspective)
        // Draw this BEFORE the front face so it sits behind? 
        // Actually, returns usually draw first or carefully.
        // It projects left-backward.
        const t1LeftX = tCenterOffset - tW / 2;
        drawReturn(t1LeftX, tY, tW, tH); // Generic helper handles it perfectly? 
        // Wait, drawReturn (x, base, w, h) draws x... x+w? 
        // No, drawReturn(frontX, botY, width, height) in this file draws side from frontX.
        // Let's use the explicit logic to match style.

        ctx.fillStyle = '#050508'; // Deep Black Shadow
        ctx.beginPath();
        ctx.moveTo(t1LeftX, tY);
        ctx.lineTo(t1LeftX, tY - tH);
        ctx.lineTo(t1LeftX - depthX, tY - tH - depthY);
        ctx.lineTo(t1LeftX - depthX, tY - depthY);
        ctx.fill();

        // T1: Front Face
        const t1X = tCenterOffset - tW / 2;
        rect(t1X, tY - tH, tW, tH, '#2d3138');
        drawBrickwork(t1X, tY - tH, tW, tH);

        // Belt Side Return
        const tbLeftX = tCenterOffset - tbW / 2;
        ctx.fillStyle = '#0a0c0e';
        ctx.beginPath();
        ctx.moveTo(tbLeftX, tbY + tbH);
        ctx.lineTo(tbLeftX, tbY);
        ctx.lineTo(tbLeftX - 6, tbY - 2);
        ctx.lineTo(tbLeftX - 6, tbY + tbH - 2);
        ctx.fill();

        rect(tCenterOffset - tbW / 2, tbY, tbW, tbH, cTrim); // Front - Aligned

        // Slab Highlight/Shadow
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(tCenterOffset - tbW / 2, tbY, tbW, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(tCenterOffset - tbW / 2, tbY + tbH - 1, tbW, 1);

        // F2 Side Return (Left Visible)
        const t2LeftX = tCenterOffset - t2W / 2;
        ctx.fillStyle = '#050508';
        ctx.beginPath();
        ctx.moveTo(t2LeftX, t2Y);
        ctx.lineTo(t2LeftX, t2Y - t2H);
        ctx.lineTo(t2LeftX - depthX, t2Y - t2H - depthY);
        ctx.lineTo(t2LeftX - depthX, t2Y - depthY);
        ctx.fill();

        // Body - DARKENED
        rect(tCenterOffset - t2W / 2, t2Y - t2H, t2W, t2H, '#2d3138');
        drawBrickwork(tCenterOffset - t2W / 2, t2Y - t2H, t2W, t2H);

        // Tower Roof
        drawMansardRoof(tCenterOffset, t2Y - t2H, 60, 50);

        // Finial Logic (Unchanged)
        const peakY = t2Y - t2H - 54;
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tCenterOffset, peakY); ctx.lineTo(tCenterOffset, peakY - 30);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(tCenterOffset - 10, peakY - 20); ctx.lineTo(tCenterOffset + 10, peakY - 20); ctx.stroke();
        ctx.fillStyle = '#c0a060';
        ctx.beginPath(); ctx.arc(tCenterOffset, peakY - 30, 3, 0, Math.PI * 2); ctx.fill();

        // Widow's Walk
        const wwY = peakY;
        ctx.strokeStyle = '#0a0a0d'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tCenterOffset - 20, wwY - 10); ctx.lineTo(tCenterOffset + 20, wwY - 10);
        for (let i = -18; i <= 18; i += 6) {
            ctx.moveTo(tCenterOffset + i, wwY);
            ctx.lineTo(tCenterOffset + i, wwY - 12);
        }
        ctx.stroke();
    }

    if (drawWindows) {
        drawWindow({ x: tCenterOffset - 10, y: t2Y - t2H + 10, w: 20, h: 30, arched: true, lit: true, ignoreStorm: true });
    }

    // 2. Central Main Hall (Foreground Tier)
    const chW = 120; // Base Width
    const chF1H = 50;
    const chBeltH = 8;
    const chBeltW = 126;
    const chBeltY = -chF1H - chBeltH;
    const chF2Inset = 5;
    const chF2W = chW - (chF2Inset * 2);
    const chF2H = 40;
    const chF2Y = chBeltY;
    const chF2Top = chF2Y - chF2H;

    if (drawStructure) {
        // --- ADDED LEFT SIDE DEPTH ---
        // F1 Left Side Return
        ctx.fillStyle = '#050508';
        const chF1LeftX = -chW / 2;
        ctx.beginPath();
        ctx.moveTo(chF1LeftX, 0); // Base Y=0
        ctx.lineTo(chF1LeftX, -chF1H); // Top Y
        ctx.lineTo(chF1LeftX - depthX, -chF1H - depthY);
        ctx.lineTo(chF1LeftX - depthX, 0 - depthY);
        ctx.closePath();
        ctx.fill();

        // Box 1: Ground Floor
        rect(-chW / 2, -chF1H, chW, chF1H, cWall);
        drawBrickwork(-chW / 2, -chF1H, chW, chF1H);

        for (let qy = -chF1H; qy < -4; qy += 16) {
            ctx.fillStyle = (Math.abs(qy) % 32 === 0) ? cWall : '#3b3f46';
            ctx.fillRect(-chW / 2, qy, 6, 8);
            ctx.fillRect(chW / 2 - 6, qy, 6, 8);
        }

        // Belt Side Return
        // Belt sticks out 4px on each side (chBeltW vs chW)
        // chBeltX = -chW/2 - 3? No, -chW/2 - 4? 
        // Earlier code used rect(-chW/2 - 4, ... chW+8)
        const chBeltLeftX = -chW / 2 - 4;
        ctx.fillStyle = '#050508';
        ctx.beginPath();
        ctx.moveTo(chBeltLeftX, chBeltY + chBeltH);
        ctx.lineTo(chBeltLeftX, chBeltY);
        ctx.lineTo(chBeltLeftX - depthX, chBeltY - depthY);
        ctx.lineTo(chBeltLeftX - depthX, chBeltY + chBeltH - depthY);
        ctx.closePath();
        ctx.fill();

        // G1 Belt
        rect(-chW / 2 - 4, chBeltY, chW + 8, chBeltH, cTrim);
        ctx.fillStyle = '#5a5e68'; ctx.fillRect(-chW / 2, chF2Y, chW, 2);

        // F2 Side Return
        const chF2LeftX = -chF2W / 2;
        ctx.fillStyle = '#050508';
        ctx.beginPath();
        ctx.moveTo(chF2LeftX, chF2Y);
        ctx.lineTo(chF2LeftX, chF2Top);
        ctx.lineTo(chF2LeftX - depthX, chF2Top - depthY);
        ctx.lineTo(chF2LeftX - depthX, chF2Y - depthY);
        ctx.closePath();
        ctx.fill();

        // Box 2: Upper Floor (Inset)
        rect(-chF2W / 2, chF2Top, chF2W, chF2H, cWall);
        drawBrickwork(-chF2W / 2, chF2Top, chF2W, chF2H);

        rect(-chF2W / 2 - 2, chF2Y - 4, chF2W + 4, 4, cTrim);
    }

    drawWindow({ x: -40, y: chF2Top + 10, w: 14, h: 20, arched: true, lit: true, ignoreStorm: true });
    drawWindow({ x: -7, y: chF2Top + 10, w: 14, h: 20, arched: true, lit: true, ignoreStorm: true });
    drawWindow({ x: 26, y: chF2Top + 10, w: 14, h: 20, arched: true, lit: true, ignoreStorm: true });

    // F1 Entry & Windows logic (Unchanged, just moved up)
    const eW = 40; const eH = 35;
    if (drawStructure) {
        rect(-eW / 2, -eH, eW, eH, '#2d3436');
        ctx.beginPath();
        ctx.moveTo(-eW / 2 - 6, -eH);
        ctx.lineTo(0, -eH - 12);
        ctx.lineTo(eW / 2 + 6, -eH);
        ctx.closePath();
        ctx.fillStyle = '#111'; ctx.fill();
        ctx.strokeStyle = '#444'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-eW / 2 + 2, -eH, eW - 4, 6);
        ctx.fillStyle = '#050505';
        const dW = 24; const dH = 25;
        ctx.fillRect(-dW / 2, -dH, dW, dH);
        ctx.fillStyle = '#1a0f0f';
        const pM = 2;
        ctx.fillRect(-dW / 2 + pM, -dH + pM, dW - pM * 2, dH - pM);
        ctx.fillStyle = '#2b1b1b';
        ctx.fillRect(-dW / 2 + 4, -dH + 4, 6, 8);
        ctx.fillRect(dW / 2 - 10, -dH + 4, 6, 8);
        ctx.fillRect(-dW / 2 + 4, -dH + 14, 6, 8);
        ctx.fillRect(dW / 2 - 10, -dH + 14, 6, 8);
        ctx.fillStyle = '#e1b12c';
        ctx.beginPath(); ctx.arc(dW / 2 - 6, -dH / 2 + 2, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 1; ctx.strokeRect(-dW / 2, -dH, dW, dH);
    }

    if (drawWindows) {
        drawWindow({ x: -45, y: -35, w: 12, h: 20, arched: false, lit: true, ignoreStorm: true });
        drawWindow({ x: 33, y: -35, w: 12, h: 20, arched: false, lit: true, ignoreStorm: true });
    }

    if (drawStructure) {
        rect(-25, -25, 6, 25, cTrim); rect(19, -25, 6, 25, cTrim);
        rect(-30, -32, 60, 8, cTrim);
        ctx.beginPath(); ctx.moveTo(-32, -32); ctx.lineTo(32, -32); ctx.lineTo(0, -50); ctx.fill();
    }


    // 0. Dynamic Wings - SPLIT LOOP by Side to fix overlapping shadows
    // LEFT Wings: Draw Inside-Out (1 -> wingsPerSide)

    // This makes Outer wings draw ON TOP of Inner wings, hiding the inner shadow
    for (let i = 1; i <= wingsPerSide; i++) {
        const offset = baseSpacing + (i - 1) * wingWidth;
        const isOuter = (i === wingsPerSide);
        drawWing(offset, false, isOuter, i); // Left Only
    }

    // RIGHT Wings: Draw Outside-In (wingsPerSide -> 1)
    // This makes Inner wings draw ON TOP of Outer wings
    for (let i = wingsPerSide; i >= 1; i--) {
        const offset = baseSpacing + (i - 1) * wingWidth;
        const isOuter = (i === wingsPerSide);
        drawWing(offset, true, isOuter, i);  // Right Only
    }




    // 7. ENVIRONMENT INTEGRATION (Baked into Structure)
    if (drawStructure) {
        // A. Wrought Iron Fence (Flanking the mansion)
        // Mansion base width is approx 300 * scaleX.
        // We want fences connecting the mansion to the "void" on sides.
        const mansionHalfW = (60 + wingsPerSide * 90) * scaleX;

        // Left Fence
        drawWroughtIronFence(ctx, -mansionHalfW - 140, 0, 140, 30);
        // Right Fence
        drawWroughtIronFence(ctx, mansionHalfW, 0, 140, 30);

        // B. Dead Grass on the Hill (Silhouette)
        // Populate the hill curve with tufts
        // Hill spans roughly -mansionHalfW*1.5 to +mansionHalfW*1.5
        const hillSpan = mansionHalfW * 2.5; // Wider than house
        for (let i = 0; i < 40; i++) {
            const rx = (pseudoRandom(i * 11.2) - 0.5) * hillSpan * 2; // Spread wide
            const rScale = 0.5 + pseudoRandom(i * 3) * 1.5;

            // Avoid drawing ON the house (Gap in middle)
            if (Math.abs(rx) < mansionHalfW * 0.9) continue;

            drawDeadGrass(ctx, rx, 10, rScale, i); // y=10 is slightly down the "hill" relative to base
        }
    }


    // Helper: Shared Layout Logic


    // Extracted Steps Function (To be drawn dynamically over grass)
    function drawHauntedSteps(ctx, w, h) {
        const { cx, baseY, scaleX, scaleY } = getHauntedLayout(w, h); // Destructure X/Y

        ctx.save();
        ctx.translate(cx, baseY);
        ctx.scale(scaleX, scaleY); // Non-uniform scale

        // Helper: Pixel-art rect
        const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

        // --- PORCH STEPS (3D Effect) ---
        const stepTop = '#2a2e35';   // Lighter top surface
        const stepFront = '#1a1d23'; // Darker front face

        // Draw steps from top to bottom (painter's algorithm)
        // Step 1 (Top)
        rect(-25, 0, 50, 3, stepTop);  // Top
        rect(-25, 3, 50, 2, stepFront); // Front

        // Step 2 (Middle)
        rect(-30, 5, 60, 3, stepTop);
        rect(-30, 8, 60, 2, stepFront);

        // Step 3 (Bottom)
        rect(-35, 10, 70, 3, stepTop);
        rect(-35, 13, 70, 2, stepFront);

        ctx.restore();
    }


    // Helper: Draw detailed stone path (Stops at Plaza/Hub or Extends)
    // Helper: Draw detailed stone path (Explicit Geometry)
    // Fixes "Moved to Left" bug by matching the call signature:
    // drawStonePath(ctx, cx, horizonY,    // 4. STONE PATH GENERATOR (Perspective Correct)
    const drawStonePath = (ctx, cx, topY, topW, bottomY, bottomW, isGameplay, moundY) => {

        // 1. Foundation (Trapezoid)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - topW / 2, topY);
        ctx.lineTo(cx + topW / 2, topY);
        ctx.lineTo(cx + bottomW / 2, bottomY);
        ctx.lineTo(cx - bottomW / 2, bottomY);
        ctx.closePath();
        ctx.fillStyle = '#1a1a1a';
        ctx.fill();
        ctx.restore();

        // 2. SPIDER WEB HELPER (Procedural Sector) - SEEDED
        const drawEdgeWeb = (bx, by, side, seed) => {
            ctx.save();
            ctx.translate(bx, by);
            ctx.scale(-side, 1); // Orientation: +x is Inward

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'; // High Visibility White
            ctx.lineWidth = 1.3;
            ctx.lineCap = 'butt';
            ctx.beginPath();

            // Web Size & Shape (Stable RNG)
            let rng = seed;
            const nextRnd = () => pseudoRandom(rng += 17.1); // Output 0..1

            const size = 30 + nextRnd() * 25; // Large: 30-55px

            // Fan Settings
            // User Request: "Corner Webs" (90 degree fan)
            const numSpokes = 5;
            const startAng = 0.0;
            const endAng = Math.PI * 0.55;  // Just past 90 degrees

            const spokes = [];

            // Generate Spokes
            for (let i = 0; i < numSpokes; i++) {
                // Distribute angles
                const t = i / (numSpokes - 1);
                const ang = startAng + t * (endAng - startAng);

                // Length variance (Jitter the tips)
                const len = size * (0.8 + nextRnd() * 0.4);

                // Convert polar to cartesian
                // ang=0 is +x (Inward)
                const sx = Math.cos(ang) * len;
                const sy = Math.sin(ang) * len;

                spokes.push({ x: sx, y: sy });

                // Draw Spoke Line
                ctx.moveTo(0, 0);
                ctx.lineTo(sx, sy);
            }

            // Draw Spiral Threads (Catenary Curves)
            const numLayers = 3;

            for (let layer = 1; layer <= numLayers; layer++) {
                // Normalized distance from center (0.0 to 1.0)
                const dist = layer / (numLayers + 0.2);

                for (let i = 0; i < numSpokes - 1; i++) {
                    const s1 = spokes[i];
                    const s2 = spokes[i + 1];

                    // Start and End points for this thread segment
                    const p1x = s1.x * dist;
                    const p1y = s1.y * dist;
                    const p2x = s2.x * dist;
                    const p2y = s2.y * dist;

                    ctx.moveTo(p1x, p1y);

                    // Sag Control: Pull the midpoint towards the origin (0,0)
                    // Midpoint of straight line
                    const midX = (p1x + p2x) * 0.5;
                    const midY = (p1y + p2y) * 0.5;

                    // Sag factor: < 1.0 means curve inward (catenary)
                    const sag = 0.85;
                    ctx.quadraticCurveTo(midX * sag, midY * sag, p2x, p2y);
                }
            }

            ctx.stroke();
            ctx.restore();
        };

        // 3. Iterate Rows
        const rowH = 16;
        const height = bottomY - topY;

        // Only draw webs if enough height
        if (height > 0) {
            const steps = Math.floor(height / rowH);

            // WEBS COLLECTION (Fix Z-Order Glitch)
            const websToDraw = [];

            // Logic for perfect Zig-Zag Spacing
            let lastWebRow = -999;
            let nextWebIsLeft = (pseudoRandom(steps) > 0.5);

            for (let i = 0; i < steps; i++) {
                const y1 = topY + i * rowH;
                const p = i / steps; // 0 at top, 1 at bottom

                // Linear Trapezoid Interpolation
                const currentW = topW + (bottomW - topW) * p;
                const xStart = cx - currentW / 2;

                const stoneSeed = (i * 1337);
                let remainingW = currentW;

                let currentX = xStart;

                // OPTIMIZATION: Removed 'stonesInRow' array allocation.
                // Generate and draw in one pass to avoid GC thrashing.
                let j = 0; // Stone index for colors

                while (remainingW > 0) {
                    let slabW = 20 + Math.floor(pseudoRandom(stoneSeed + remainingW) * 30);
                    if (slabW > remainingW) slabW = remainingW;

                    // Draw Stone Logic Immediate
                    let sx = currentX;
                    let sw = slabW - 2; // Gap

                    // Clip edges
                    if (sx < xStart) {
                        sw -= (xStart - sx);
                        sx = xStart;
                    }
                    if (sx + sw > xStart + currentW) {
                        sw = (xStart + currentW) - sx;
                    }

                    if (sw > 1) {
                        // Draw 3D Stone
                        const shade = 60 + Math.floor(pseudoRandom(stoneSeed + j) * 30);
                        const cBase = `rgb(${shade}, ${shade}, ${shade})`;
                        const cHigh = `rgb(${shade + 40}, ${shade + 40}, ${shade + 40})`;
                        const cShadow = `rgb(${shade - 30}, ${shade - 30}, ${shade - 30})`;

                        ctx.fillStyle = cBase; ctx.fillRect(sx, y1, sw, rowH - 2);
                        ctx.fillStyle = cHigh; ctx.fillRect(sx, y1, sw, 1); ctx.fillRect(sx, y1, 1, rowH - 2);
                        ctx.fillStyle = cShadow; ctx.fillRect(sx, y1 + rowH - 3, sw, 1); ctx.fillRect(sx + sw - 1, y1, 1, rowH - 2);
                    }

                    remainingW -= slabW;
                    currentX += slabW;
                    j++;
                }

                // SPIDER WEBS (Edge Decoration)
                // EXCLUSION ZONES
                if (moundY && (y1 > moundY - 80 && y1 < moundY + 85)) continue;
                if (y1 > bottomY - 80) continue;
                if (y1 < topY + 40) continue;
                if (i - lastWebRow < 5) continue;

                const webSeed = (i * 999);

                if (pseudoRandom(webSeed) > 0.82) {
                    const side = nextWebIsLeft ? -1 : 1;
                    const seed = webSeed + (nextWebIsLeft ? 0 : 100);
                    websToDraw.push({ x: nextWebIsLeft ? (xStart + 2) : (xStart + currentW - 2), y: y1 + 5, side: side, seed: seed });

                    nextWebIsLeft = !nextWebIsLeft;
                    lastWebRow = i;
                }
            }

            // DRAW WEBS PASS
            websToDraw.forEach(w => drawEdgeWeb(w.x, w.y, w.side, w.seed));
        }
    };

    // Draw Circular Hub (Connector) at Intersection
    // Re-introduced to look good ON TOP of the Spine
    function drawHomeHub(ctx, cx, cy, radius) {
        ctx.save();

        // Foundation (Opaque to hide intersection)
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a1a';
        ctx.fill();

        // Concentric Rings
        const ringSize = 18;
        const numRings = Math.floor(radius / ringSize);

        for (let r = 0; r < numRings; r++) {
            const currentR = radius - r * ringSize;
            const circum = 2 * Math.PI * currentR;
            const numStones = Math.floor(circum / 25); // Approx 25px per stone
            const angleStep = (Math.PI * 2) / numStones;
            const offset = r * 0.5;

            for (let i = 0; i < numStones; i++) {
                const a1 = offset + i * angleStep;
                const a2 = offset + (i + 1) * angleStep - 0.1;

                // Inner/Outer R
                const rOut = currentR;
                const rIn = currentR - ringSize + 2;

                // Beveled Poly helper logic inline or assume exists (I deleted it? No, I need to check)
                // If I deleted drawBeveledPoly, I need to restore it or implement simple sector drawing.
                // Let's implement simple sector drawing here to be safe and self-contained.

                const shade = 70 + (i % 3) * 20;
                ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;

                ctx.beginPath();
                ctx.arc(cx, cy, rOut, a1, a2);
                ctx.arc(cx, cy, rIn, a2, a1, true);
                ctx.closePath();
                ctx.fill();
            }
        }

        // Center Cap
        ctx.beginPath();
        ctx.arc(cx, cy, radius - numRings * ringSize, 0, Math.PI * 2);
        ctx.fillStyle = '#555';
        ctx.fill();

        ctx.restore();
    }

    function drawStoneFoulLine(ctx, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Stone specs for "Paved" look
        const stoneLen = 24;
        const stoneW = 22; // Individual stone width across the path
        const gap = 0; // Tight packing
        const numStones = Math.ceil(len / (stoneLen + gap));

        ctx.save();
        ctx.translate(x1, y1);
        ctx.rotate(angle);

        // Dark Foundation (Double Width)
        const totalPathW = stoneW * 2 + 2; // 2 Rows + Grout
        const foundationW = totalPathW + 4; // Border
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, -foundationW / 2, len, foundationW);

        // Draw 2 Rows of Stones (Staggered Brick Pattern)
        for (let row = 0; row < 2; row++) {
            const rowOffset = (row === 0) ? 0 : (stoneLen / 2);

            for (let i = 0; i < numStones; i++) {
                const sx = i * (stoneLen + gap) - rowOffset;
                if (sx + stoneLen < 0 || sx > len) continue; // Clip start/end

                const sw = stoneLen;
                const sh = stoneW;
                const sy = (row === 0) ? -stoneW : 0; // Local Y relative to centerline

                // FIX: Remove x1 from seed. Use index only to keep colors stable during resize.
                const seed = (i + row * 1000) * 1.1;
                const shade = 60 + Math.floor(pseudoRandom(seed) * 30);

                // 3D Stone Logic (Rotated Local Space)
                const cBase = `rgb(${shade}, ${shade}, ${shade})`;
                const cHigh = `rgb(${shade + 40}, ${shade + 40}, ${shade + 40})`;
                const cShadow = `rgb(${shade - 30}, ${shade - 30}, ${shade - 30})`;
                const grout = 1;

                // DRAW STONE (With Grout inset)
                // Base
                ctx.fillStyle = cBase;
                ctx.fillRect(sx, sy + grout, sw - grout, sh - grout);

                // Highlights
                ctx.fillStyle = cHigh;
                ctx.fillRect(sx, sy + grout, sw - grout, 1);
                ctx.fillRect(sx, sy + grout, 1, sh - grout);

                // Shadows
                ctx.fillStyle = cShadow;
                ctx.fillRect(sx, sy + sh - 1, sw - grout, 1);
                ctx.fillRect(sx + sw - grout - 1, sy + grout, 1, sh - grout);
            }
        }

        ctx.restore();
    }


    // Helper to draw an arbitrary 4-point stone with 3D bevels
    function drawBeveledPoly(ctx, points, colorSeed) {
        const shade = 60 + Math.floor(pseudoRandom(colorSeed) * 30);
        const cBase = `rgb(${shade}, ${shade}, ${shade})`;
        const cHigh = `rgb(${shade + 40}, ${shade + 40}, ${shade + 40})`;
        const cShadow = `rgb(${shade - 30}, ${shade - 30}, ${shade - 30})`;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < 4; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.closePath();

        // Foundation/Grout (Dark Border)
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#1a1a1a';
        ctx.stroke();
        // Fill Base
        ctx.fillStyle = cBase;
        ctx.fill();

        // 3D Bevels (lighting from Top-Left)
        // Simplified: Highlight Top/Left segments, Shadow Bottom/Right segments
        // Since points are arbitrary, we just draw lines on the edges inside.
        ctx.lineWidth = 2;

        // Highlight (0->1 and 3->0 approx Top/Left)
        ctx.beginPath();
        ctx.strokeStyle = cHigh;
        ctx.moveTo(points[3].x, points[3].y);
        ctx.lineTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.stroke();

        // Shadow (1->2 and 2->3 approx Bottom/Right)
        ctx.beginPath();
        ctx.strokeStyle = cShadow;
        ctx.moveTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        ctx.lineTo(points[3].x, points[3].y);
        ctx.stroke();
    }

    // Draw a "Masonry Fan" to turn the corner seamlessly
    function drawPathJunction(ctx, w, h, cx, homeY, horizonY, bottomW, topW) {
        // 1. Recalculate Intersection
        const k = (bottomW - topW) / (h - horizonY);
        const intersectY = (homeY - 0.75 * topW + 0.75 * k * horizonY) / (1 + 0.75 * k);
        const rigidP = (intersectY - horizonY) / (h - horizonY);
        const widthAtIntersect = topW + (bottomW - topW) * rigidP;

        // Corner Pivots (Inner corner of the turn)
        // The path is widthAtIntersect wide. 
        // Left Pivot: cx - width/2
        // Right Pivot: cx + width/2
        const pivotL = { x: cx - widthAtIntersect / 2 + 10, y: intersectY }; // Move IN to create radius
        const pivotR = { x: cx + widthAtIntersect / 2 - 10, y: intersectY };

        // Fan Parameters
        const fanRadiusInner = 5;
        const fanRadiusOuter = 45; // Length of the turning stones
        const numFanStones = 3;

        // Angles
        // Vertical Up = -Math.PI / 2 (-90 deg)
        const angleVert = -Math.PI / 2;
        // Left Foul Line Vector (-1, -1.5) -> atan2(-1.5, -1) = -2.15 rad (-123 deg)
        const angleDiagL = Math.atan2(-1.5, -1);

        // Right Foul Line Vector (1, -1.5) -> atan2(-1.5, 1) = -0.98 rad (-56 deg)
        const angleDiagR = Math.atan2(-1.5, 1);

        const drawFan = (pivot, startAngle, endAngle) => {
            const totalSweep = endAngle - startAngle;
            const step = totalSweep / numFanStones;

            for (let i = 0; i < numFanStones; i++) {
                const a1 = startAngle + i * step;
                const a2 = startAngle + (i + 1) * step;

                // Build Trapezoid Points
                // 0: Inner Start
                // 1: Outer Start
                // 2: Outer End
                // 3: Inner End
                const p0 = { x: pivot.x + Math.cos(a1) * fanRadiusInner, y: pivot.y + Math.sin(a1) * fanRadiusInner };
                const p1 = { x: pivot.x + Math.cos(a1) * fanRadiusOuter, y: pivot.y + Math.sin(a1) * fanRadiusOuter };
                const p2 = { x: pivot.x + Math.cos(a2) * fanRadiusOuter, y: pivot.y + Math.sin(a2) * fanRadiusOuter };
                const p3 = { x: pivot.x + Math.cos(a2) * fanRadiusInner, y: pivot.y + Math.sin(a2) * fanRadiusInner };

                drawBeveledPoly(ctx, [p0, p1, p2, p3], pivot.x + i * 100);
            }
        };

        // Draw Left Fan (Vert to DiagL) -> -90 to -123
        drawFan(pivotL, angleVert, angleDiagL);

        // Draw Right Fan (Vert to DiagR) -> -90 to -56
        drawFan(pivotR, angleVert, angleDiagR);
    }

    function drawGravestone(ctx, x, y, scale, type) {
        ctx.save();
        ctx.translate(x, y);

        // 1. SHAPE VARIANCE (Squat vs Tall)
        // type is 0.0-1.0. Use it to stretch/squash.
        const widthMod = 0.9 + type * 0.3; // 0.9 to 1.2
        const heightMod = 1.1 - type * 0.2; // 1.1 to 0.9
        ctx.scale(scale * widthMod, scale * heightMod);

        // PALETTE: Neutral Greys (No Purple)
        const cLight = '#757575'; // Top/Highlight
        const cFace = '#616161'; // Front Face
        const cDark = '#424242'; // Shadow/Side
        const cLine = '#212121'; // Outline

        // SHAPE: Rounded Slab with 3D Extrusion
        ctx.lineWidth = 2;
        ctx.strokeStyle = cLine;

        // 1. 3D Side/Depth (Right & Bottom)
        ctx.fillStyle = cDark;
        ctx.beginPath();
        // Right side extrusion
        ctx.moveTo(10, -14);
        ctx.lineTo(14, -14);
        ctx.lineTo(14, 0);
        ctx.lineTo(10, 0);
        ctx.fill(); ctx.stroke();

        // 2. Main Face (Rounded Top)
        ctx.fillStyle = cFace;
        ctx.beginPath();
        ctx.arc(0, -18, 10, Math.PI, 0); // Round Top
        ctx.lineTo(10, 0);
        ctx.lineTo(-10, 0);
        ctx.lineTo(-10, -18);
        ctx.fill(); ctx.stroke();

        // 3. TEXTURE NOISE (Weathering)
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        for (let i = 0; i < 6; i++) {
            const nx = (pseudoRandom(type + i) - 0.5) * 16;
            const ny = -4 - pseudoRandom(type * i) * 20;
            ctx.fillRect(nx, ny, 2, 2);
        }

        // 4. Cracks / Details
        ctx.fillStyle = cDark;
        if (type > 0.5) {
            // Crack (Top Right)
            ctx.beginPath();
            ctx.moveTo(4, -24);
            ctx.lineTo(7, -18);
            ctx.stroke();
        } else {
            // Chipped Corner (Top Left)
            ctx.fillStyle = cDark;
            ctx.fillRect(-10, -18, 4, 4);
        }

        // 5. "R.I.P" Lines (Abstract)
        ctx.fillStyle = '#424242'; // Dark Grey Text
        ctx.fillRect(-4, -14, 8, 2);
        ctx.fillRect(-3, -10, 6, 2);

        // Shadow Base on Grass
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(0, 2, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // 6. GRASS OVERLAP (Grounding)
        // Draw 5-8 blades growing UP onto the stone base
        ctx.strokeStyle = '#0f1a13'; // Dark grass base color
        ctx.lineWidth = 1; // Fine detail
        const grassCount = 5 + Math.floor(type * 4);
        for (let i = 0; i < grassCount; i++) {
            const gx = -12 + (i / grassCount) * 24 + (pseudoRandom(i) - 0.5) * 4;
            const gh = 3 + pseudoRandom(i * 2) * 4;
            ctx.beginPath();
            ctx.moveTo(gx, 2); // Start slightly below
            ctx.quadraticCurveTo(gx + 1, 2 - gh / 2, gx + (i % 2 == 0 ? 2 : -2), 2 - gh);
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawPixelGhost(ctx, x, y, scale) {
        ctx.save();
        // 1. CAST SHADOW (Grounding)
        // Draw distinct shadow below the ghost
        ctx.save();
        ctx.translate(x, y + 20 * scale); // Shadow on ground
        ctx.scale(scale, scale * 0.3); // Flattened oval
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. GHOST BODY
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.globalAlpha = 0.7; // Much more transparent (was 0.95)

        // 3D VOLUME GRADIENT
        // Light coming from top-left
        const grad = ctx.createRadialGradient(-4, -8, 2, 0, 0, 18);
        grad.addColorStop(0, '#ffffff');   // Highlight
        grad.addColorStop(0.5, '#e1f5fe'); // Mid face
        grad.addColorStop(1, '#b3e5fc');   // Shadow edge
        ctx.fillStyle = grad;

        // SHAPE: Tall Sheet Ghost (Reference Match)
        // Head: Rounded dome
        ctx.beginPath();
        ctx.arc(0, -12, 8, Math.PI, 0);

        // Body: Drapes down
        ctx.lineTo(8, 10);
        // Uneven ragged bottom
        ctx.lineTo(4, 8);
        ctx.lineTo(0, 12);
        ctx.lineTo(-4, 8);
        ctx.lineTo(-8, 10);
        ctx.lineTo(-8, -12);
        ctx.fill(); // Gradient fill

        // Arms: Stubby Nubs (Gradient match)
        ctx.fillStyle = '#e1f5fe'; // Keep arms simpler
        // Left Nub
        ctx.beginPath();
        ctx.moveTo(-8, -4);
        ctx.lineTo(-12, -8);
        ctx.lineTo(-10, -2);
        ctx.lineTo(-8, 0);
        ctx.fill();
        // Right Nub
        ctx.beginPath();
        ctx.moveTo(8, -4);
        ctx.lineTo(12, -2);
        ctx.lineTo(10, 2);
        ctx.lineTo(8, -2);
        ctx.fill();

        // FACE: Sad/Surprised (Tilted Eyes)
        ctx.fillStyle = '#1a237e'; // Dark Navy Eyes

        // Left Eye (Tilted /)
        ctx.save();
        ctx.translate(-3, -10);
        ctx.rotate(-0.2);
        ctx.fillRect(-1.5, -2, 3, 5);
        ctx.restore();

        // Right Eye (Tilted \)
        ctx.save();
        ctx.translate(3, -10);
        ctx.rotate(0.2);
        ctx.fillRect(-1.5, -2, 3, 5);
        ctx.restore();

        // Mouth: Open O (Vertical)
        ctx.fillRect(-2, -4, 4, 6);

        ctx.restore();
        ctx.restore();
    }
}

export function drawHauntedField(ctx, w, h, isGameplay = true) {
    const { cx, horizonY, scaleX, wingsPerSide } = getHauntedLayout(w, h);
    // Sync homeY with Bat Position (Critical for Patio Alignment)
    const homeY = (gameState.bat && gameState.bat.pivotY)
        ? gameState.bat.pivotY
        : (h * 0.85); // Fallback

    // CRITICAL: Ensure area above horizon is transparent (for mansion visibility)
    ctx.clearRect(0, 0, w, horizonY);

    // Clip all grass rendering to below horizon
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, horizonY, w, h - horizonY);
    ctx.clip();

    // 1. Ground: Rich Grass Texture
    // 3. BASE GROUND (Patchy Natural Match)
    // Style: Natural Sketchy + "Bald Spots" + "De-banded Horizon".
    // 1. Dirt Patches: Random areas with no grass.
    // 2. High Jitter: Breaks horizontal lines.
    const generateHauntedPattern = (targetW, targetH) => {
        const canW = 1024;
        const canH = 1024;

        const canvas = document.createElement('canvas');
        canvas.width = canW;
        canvas.height = canH;
        const tCtx = canvas.getContext('2d');

        tCtx.imageSmoothingEnabled = true;

        // PALETTE (Reference Match: Moonlit Graveyard)
        const C_BASE = '#0b1214';
        const C_MID = '#162a26';
        const C_HIGH = '#2f4f48';
        const C_INK = '#4a6b63';

        // 1. Base Fill
        tCtx.fillStyle = C_BASE;
        tCtx.fillRect(0, 0, canW, canH);

        // 2. GENERATE DIRT MAP (The "Bald Spots")
        // Create random circles where grass won't grow.
        const dirtPatches = [];
        const patchCount = 25; // Decreased from 50 (User Request)
        for (let i = 0; i < patchCount; i++) {
            dirtPatches.push({
                x: Math.random() * canW,
                y: Math.random() * canH,
                r: 10 + Math.random() * 20 // Decreased size (was 20-70)
            });
        }

        const isDirt = (tx, ty) => {
            for (let p of dirtPatches) {
                const dx = tx - p.x;
                const dy = ty - p.y;
                if ((dx * dx + dy * dy) < (p.r * p.r)) return true;
            }
            return false;
        };

        // 3. PAINTER ALGORITHM

        const numRows = 150;
        const rowH = canH / numRows;

        for (let row = 0; row < numRows; row++) {
            const z = row / numRows;
            const baseRowY = row * rowH;

            // Perspective Scale
            const scale = 0.5 + Math.pow(z, 2.2) * 3.0;

            // Density
            const density = 200 * (1.1 - z * 0.3);

            // JITTER PER ROW (Breaks the "Banding" at the top)
            // We draw items at random Y offsets relative to the row line.

            for (let i = 0; i < density; i++) {
                // X Position
                const x = Math.random() * canW;

                // Y Position with JITTER
                // High jitter in back (z close to 0) to mix the horizon lines
                const yJitter = (Math.random() - 0.5) * rowH * 1.5;
                const y = baseRowY + yJitter;

                // CHECK DIRT PATCH
                if (isDirt(x, y)) continue; // Skip! Bald spot.

                // Style Logic (Same as before)
                const styleRoll = Math.random();
                const hBase = (15 + Math.random() * 20) * scale;
                tCtx.lineWidth = 1.0 * scale;
                tCtx.lineCap = 'round';

                let color = C_MID;
                if (Math.random() > 0.6) color = C_HIGH;
                if (Math.random() > 0.9) color = C_INK;
                tCtx.strokeStyle = color;

                tCtx.beginPath();

                if (styleRoll < 0.4) {
                    // STYLE A: Hatching
                    const count = 2 + Math.floor(Math.random() * 2);
                    const lean = (Math.random() - 0.5) * 10 * scale;
                    const spacing = 4 * scale;
                    for (let k = 0; k < count; k++) {
                        const ox = x + (k * spacing);
                        tCtx.moveTo(ox, y);
                        tCtx.quadraticCurveTo(ox + lean, y - hBase * 0.7, ox + lean * 1.2, y - hBase);
                    }
                } else if (styleRoll < 0.8) {
                    // STYLE B: Unruly Clump
                    const count = 3;
                    for (let k = 0; k < count; k++) {
                        const ox = x + (Math.random() - 0.5) * 10 * scale;
                        const lean = (Math.random() - 0.5) * 30 * scale;
                        const h = hBase * (0.8 + Math.random() * 0.4);
                        tCtx.moveTo(ox, y);
                        tCtx.quadraticCurveTo(ox + lean * 0.5, y - h / 2, ox + lean, y - h);
                    }
                } else {
                    // STYLE C: Solitaire Hook
                    const lean = (Math.random() - 0.5) * 15 * scale;
                    const h = hBase * 1.3;
                    tCtx.moveTo(x, y);
                    tCtx.quadraticCurveTo(x + lean, y - h * 0.8, x + lean * 2.5, y - h);
                }
                tCtx.stroke();
            }
        }

        return canvas;
    };


    // Lazy load Seamless Pattern (PERMANENT CACHE)
    const groundH = h - horizonY;

    // CACHE CHECK: Force regen for Patchy Natural Pattern (1037)
    // Use a custom property to track version, not width.
    const CACHE_ID = 1037;
    if (!gameState.hauntedPatternCanvas || gameState.hauntedPatternCanvas._cacheId !== CACHE_ID) {
        // Generate High Res Perspective Field
        gameState.hauntedPatternCanvas = generateHauntedPattern(1024, 1024);
        gameState.hauntedPatternCanvas._cacheId = CACHE_ID;
    }

    // DRAW PATTERN
    // DRAW ILLUSION (Stretch to fit Field area)
    ctx.save();
    // Source: 0,0,1024,1024. Dest: 0, horizonY, w, groundH
    ctx.drawImage(gameState.hauntedPatternCanvas, 0, horizonY, w, groundH);
    ctx.restore();

    // 5. MANSION WINDOW LIGHT SPILL (Atmosphere)
    // Warm glow extending from the mansion base onto the grass
    ctx.save();
    ctx.globalCompositeOperation = 'overlay'; // Blend with grass texture
    const glow = ctx.createRadialGradient(cx, horizonY, 50, cx, horizonY + 200, 600);
    glow.addColorStop(0, 'rgba(255, 200, 50, 0.4)'); // Warm center
    glow.addColorStop(0.3, 'rgba(100, 100, 50, 0.1)'); // Mid fade
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    // Compressed oval for perspective
    ctx.transform(1, 0, 0, 0.3, 0, horizonY * 0.7);
    ctx.fillRect(0, horizonY, w, h);
    ctx.restore();

    // 5. [REMOVED] Tree Shadows (Caused artifacts)

    // Vignette Overlay (Darken edges)
    const vig = ctx.createRadialGradient(cx, h / 2, w * 0.2, cx, h / 2, w);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, horizonY, w, h - horizonY);


    // 3. MID-GROUND: Graves & Ghosts
    const graves = [];
    const numGraves = 32; // More density

    // 1. Generate Random Positions (With Minimum Spacing)
    const minSpacing = 35; // Minimum distance between stones
    let attempts = 0;

    while (graves.length < numGraves && attempts < 200) {
        attempts++;

        // Randomize depth (biased slightly towards back for density)
        // Use a different seed for attempts to vary results
        const seed = attempts * 13;
        const z = Math.pow(pseudoRandom(seed), 0.8);
        const y = horizonY + 20 + z * (h - horizonY - 100);

        // Calculate clear path width at this depth
        const pathW = 90 + z * 320;
        const availableW = (w - pathW) / 2;

        // Pick side
        const side = pseudoRandom(seed + 7) > 0.5 ? 1 : -1;

        // Random offset from path edge
        const offset = pseudoRandom(seed + 3) * (availableW - 40);
        const x = cx + side * (pathW / 2 + 20 + offset);

        // COLLISION CHECK
        let tooClose = false;
        for (let g of graves) {
            const dx = g.x - x;
            const dy = g.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Scale spacing based on depth (smaller in back)
            const requiredSep = minSpacing * (0.6 + z * 0.4);

            if (dist < requiredSep) {
                tooClose = true;
                break;
            }
        }

        if (!tooClose) {
            graves.push({ x, y, z, id: graves.length });
        }
    }

    // 2. Sort by Y (Depth Sorting)
    graves.sort((a, b) => a.y - b.y);

    // 3. Draw in Order
    graves.forEach(g => {
        const scale = 0.6 + g.z * 1.0;
        const type = pseudoRandom(g.id + 50); // Consistent type per ID

        // Shadow (Offset slightly back)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(g.x, g.y + 5 * scale, 15 * scale, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        drawGravestone(ctx, g.x, g.y, scale, type);
    });

    // Ghosts (STATIC - No Animation)
    // 3 Fixed Ghosts
    drawPixelGhost(ctx, w * 0.15, horizonY + (h - horizonY) * 0.3, 1.2);
    drawPixelGhost(ctx, w * 0.85, horizonY + (h - horizonY) * 0.4, 1.3);
    drawPixelGhost(ctx, w * 0.25, horizonY + (h - horizonY) * 0.6, 1.8);

    // 3.5 FOUL LINES (Stone Paths) - Drawn BEFORE Main Path to look connected
    // FIX: Calculate EXACT intersection with Tapered Path Edge to prevent gaps

    // Path Params (Must match drawStonePath)
    const bottomW = Math.min(w * 0.28, 400);
    const topW = 50;
    // Slope of the Path Left Edge: x = cx - (topW + (bottomW-topW)*p)/2 where p = (y-horizonY)/(h-horizonY)
    // Foul Line Left Vector: y = homeY - 1.5 * (cx - x)

    // Solving for Y Intersection:
    const k = (bottomW - topW) / (h - horizonY);
    // x_edge = cx - 0.5 * (topW + k*(y - horizonY))
    // y = homeY - 1.5 * (cx - (cx - 0.5 * (topW + k*(y - horizonY))))
    // y = homeY - 1.5 * (0.5 * (topW + k*(y - horizonY)))
    // y = homeY - 0.75 * topW - 0.75 * k * y + 0.75 * k * horizonY
    // y * (1 + 0.75 * k) = homeY - 0.75 * topW + 0.75 * k * horizonY

    const intersectY = (homeY - 0.75 * topW + 0.75 * k * horizonY) / (1 + 0.75 * k);

    // Calculate Width at Intersect
    const rigidP = (intersectY - horizonY) / (h - horizonY);
    const widthAtIntersect = topW + (bottomW - topW) * rigidP;

    // 3.6 FOUL LINES (Stone Paths) - Drawn FIRST (Background Layer)
    // Start from Center (cx, homeY) - Main Path will overlay the V-junction

    // 3.5 LAYOUT CONSTANTS (Socket Junction)
    const hubRadius = 70;

    // 3.6 THE STONE PATH (Socket Junction) - Drawn FIRST (Bottom Layer)
    // Calculate precise chord intersection to eliminate gaps
    const joinYOffset = 30; // Distance from center to join Line (Upper Chord)
    const joinY = homeY - joinYOffset;

    // Width of circle at this chord: 2 * sqrt(r^2 - y^2)
    // Width of circle at this chord: 2 * sqrt(r^2 - y^2)
    const chordHalfW = Math.sqrt(hubRadius * hubRadius - joinYOffset * joinYOffset);
    // const joinW = chordHalfW * 2 - 4; // -4 for margin/tuck <- OLD WIDE WIDTH

    // FIX: Narrow Path (User Request "Even more narrow")
    const joinW = 70; // Fixed narrow width (approx 30% reduction)

    // FIX: Constant Width (User Request) - Top width = Bottom width

    // Calculate Mound Y early for exclusion zones
    // Ensure playOffsetY is handled safely to avoid NaN
    const moundY = 150 + ((typeof playOffsetY !== 'undefined') ? playOffsetY : 0) + 32;

    drawStonePath(ctx, cx, horizonY, joinW, joinY, joinW, isGameplay, moundY);

    // 3.7 FOUL LINES (Stone Paths) - Drawn SECOND (Middle Layer)
    // Branch from Hub Edge
    const dxHub = hubRadius / 1.8027;
    const dyHub = 1.5 * dxHub;

    const sxL = cx - dxHub;
    const syL = homeY - dyHub;
    const exL = -w;
    const eyL = syL + 1.5 * (exL - sxL);
    drawStoneFoulLine(ctx, sxL, syL, exL, eyL);

    const sxR = cx + dxHub;
    const syR = homeY - dyHub;
    const exR = w * 2;
    const eyR = syR - 1.5 * (exR - sxR);
    drawStoneFoulLine(ctx, sxR, syR, exR, eyR);

    // 4.5 HOME HUB (The Connector Disc)
    // Drawn LAST (Top Layer) to cap all seams
    drawHomeHub(ctx, cx, homeY, hubRadius);

    // 4.6 PATH EDGE OVERLAP REMOVED (User Request)

    // 5. Grass Blades Details (Dynamic High-Density) -> REMOVED OLD LOOP
    // The pattern covers the "field" look.
    // We can add just a few specific clumps near the camera for parallax if needed,
    // but let's stick to the consistent texture first as requested.

    // 6. FIELD MARKINGS (Foul Lines & Boxes) - SOLID BRIGHT WHITE
    ctx.save();
    ctx.strokeStyle = '#FFFFFF'; // Solid White
    ctx.lineWidth = 4;

    // Foul Lines
    // Moved to 3.5 to draw behind main path

    // Remove dashed stroke
    // ctx.stroke();

    // Batter's Boxes
    ctx.lineWidth = 3;
    ctx.strokeRect(cx - 70, homeY - 30, 30, 60);
    ctx.strokeRect(cx + 40, homeY - 30, 30, 60);

    // Home Plate
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(cx, homeY + 10);
    ctx.lineTo(cx + 10, homeY);
    ctx.lineTo(cx + 10, homeY - 10);
    ctx.lineTo(cx - 10, homeY - 10);
    ctx.lineTo(cx - 10, homeY);
    ctx.fill();
    ctx.restore();




    // Layer 4: Grass details (Optional, keeping consistent texture for now)

    // Pitcher Mound (3D STONE PLATFORM)
    // Style: "Nice Stone Platform" - Clean, Solid, Matches Reference Geometry
    // moundY calculated above
    const moundR = 75; // Wider (was 60)
    const moundH = 18; // Shorter/Flatter (was 25)

    ctx.save();
    ctx.translate(cx, moundY);

    // PALETTE: Neutral Dark Greys (Match Main Path)
    const C_SIDE = '#212121'; // Dark Foundation
    const C_TOP = '#616161';  // Stone Face (Mid Grey)
    const C_OUTLINE = '#121212'; // Near Black

    // 1. CYLINDER SIDE (Volumetric Stacked Stones)
    // We draw "Cylindrical Slices" from top to bottom.
    // The side is visible as the front face.

    // Config: 3 Rows for dense look (18px total = 6px per row)
    const sideRows = 3;
    const sideRowH = moundH / sideRows;

    // Draw Background Generic Fill (Painter's Algo Safety)
    ctx.fillStyle = C_SIDE;
    ctx.beginPath();
    ctx.ellipse(0, moundH, moundR, moundR * 0.4, 0, 0, Math.PI * 2);
    ctx.rect(-moundR, 0, moundR * 2, moundH);
    ctx.fill();

    // Now Detail Texture (Front Face Only approx 0 to PI)
    ctx.save();
    // We iterate Y in screen space because moundH is a vertical offset.

    for (let r = 0; r < sideRows; r++) {
        const yTop = r * sideRowH;
        const yBot = (r + 1) * sideRowH;

        const stonesInRow = 12;
        const offsetAng = (r % 2) * (Math.PI / stonesInRow); // Brick bond

        for (let i = 0; i < stonesInRow / 2 + 2; i++) {
            // Span from 0 (Right) to PI (Left).
            const startAng = (i * (Math.PI / (stonesInRow / 2))) + offsetAng;
            const endAng = startAng + (Math.PI / (stonesInRow / 2)) - 0.1; // Gap

            if (startAng > Math.PI - 0.1) continue;

            // Calculate Stone Coordinates on the Ellipse Periphery
            // x = R * cos(a), y_flat = R * sin(a) * 0.4

            const getPt = (ang, yOffset) => ({
                x: Math.cos(ang) * moundR,
                y: Math.sin(ang) * (moundR * 0.4) + yOffset
            });

            const pTL = getPt(startAng, yTop);
            const pTR = getPt(endAng, yTop);
            const pBL = getPt(startAng, yBot);
            const pBR = getPt(endAng, yBot);

            // Draw Stone Face (Quad)
            ctx.beginPath();
            ctx.moveTo(pTL.x, pTL.y);
            ctx.lineTo(pTR.x, pTR.y);
            ctx.lineTo(pBR.x, pBR.y);
            ctx.lineTo(pBL.x, pBL.y);
            ctx.closePath();

            // Texture/Color
            const seed = (r * 99) + (i * 13);
            const val = 60 + pseudoRandom(seed) * 20;
            ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
            ctx.fill();

            // Outline/Grout
            ctx.strokeStyle = '#151515';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Highlights (Bevels - 3D Effect)
            ctx.strokeStyle = 'rgba(255,255,255,0.4)'; // Strong Highlight
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pTL.x, pTL.y);
            ctx.lineTo(pTR.x, pTR.y); // Top Edge
            ctx.moveTo(pTL.x, pTL.y);
            ctx.lineTo(pBL.x, pBL.y); // Left Edge
            ctx.stroke();

            // Shadows (Bottom/Right)
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.moveTo(pBL.x, pBL.y);
            ctx.lineTo(pBR.x, pBR.y);
            ctx.lineTo(pTR.x, pTR.y);
            ctx.stroke();
        }
    }
    ctx.restore();

    // Bottom Rim Outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2; // Thicker base
    ctx.beginPath();
    ctx.ellipse(0, moundH, moundR, moundR * 0.4, 0, Math.PI, 0); // Bottom curve only
    ctx.stroke();

    // 2. TOP FACE (Paved Stone Texture)
    // "Compliment the path, no cracks" -> Radial Paving Stones

    ctx.save();
    ctx.scale(1, 0.4); // Squash to match perspective (now we can draw circles)

    const numRings = 2;
    const centerR = 15;

    // Draw from Outside In
    // Ring 1 (Outer)
    const r1 = moundR;
    const r2 = moundR * 0.6; // Inner boundary of outer ring
    const stonesOuter = 12;
    const angleStep1 = (Math.PI * 2) / stonesOuter;

    for (let i = 0; i < stonesOuter; i++) {
        const a1 = i * angleStep1;
        const a2 = (i + 1) * angleStep1;

        // Slight Color Variation (Like Path Stones)
        const shade = 90 + (pseudoRandom(i) * 20); // 90-110 (Light tint of #616161)
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;

        ctx.beginPath();
        ctx.arc(0, 0, r1, a1, a2);
        ctx.arc(0, 0, r2, a2, a1, true); // Reverse for donut
        ctx.closePath();
        ctx.fill();
        ctx.stroke(); // Dark Outline (Mortar)
    }

    // Ring 2 (Inner)
    const r3 = centerR;
    const stonesInner = 8;
    const angleStep2 = (Math.PI * 2) / stonesInner;
    // Offset angle to stagger "brick" pattern
    const angleOffset = angleStep2 / 2;

    for (let i = 0; i < stonesInner; i++) {
        const a1 = angleOffset + i * angleStep2;
        const a2 = angleOffset + (i + 1) * angleStep2;

        const shade = 95 + (pseudoRandom(i + 50) * 20);
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;

        ctx.beginPath();
        ctx.arc(0, 0, r2, a1, a2);
        ctx.arc(0, 0, r3, a2, a1, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    // Center Cap
    ctx.fillStyle = '#757575';
    ctx.beginPath();
    ctx.arc(0, 0, centerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore(); // End Scale

    // Top Rim Outline (Re-draw for sharpness on top of stones)
    ctx.strokeStyle = '#121212';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, moundR, moundR * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Webs (Attached to Rim) - Adjusted for new geometry
    const webCount = 5;
    for (let i = 0; i < webCount; i++) {
        const angle = (i / webCount) * Math.PI * 2 + 0.5;
        if (Math.sin(angle) < -0.2) continue; // Skip back-facing

        const wx = Math.cos(angle) * moundR;
        const wy = Math.sin(angle) * (moundR * 0.4);

        ctx.save();
        ctx.translate(wx, wy);
        ctx.scale(0.6, 0.6);
        ctx.rotate(Math.PI / 4 + Math.random() * 0.3);

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; // Faint
        ctx.lineWidth = 1;
        ctx.moveTo(0, 0); ctx.lineTo(10, 25);
        ctx.moveTo(0, 0); ctx.lineTo(-12, 22);
        ctx.moveTo(-6, 12); ctx.lineTo(6, 14);
        ctx.stroke();
        ctx.restore();
    }

    ctx.restore(); // End Mound translation

    // Home Plate & Batter's Boxes (Classic Style - Drawn ON TOP)
    ctx.save();

    // Batter's Boxes
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.strokeRect(cx - 70, homeY - 30, 30, 60);
    ctx.strokeRect(cx + 40, homeY - 30, 30, 60);

    // Home Plate (Pentagon)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(cx, homeY + 10);
    ctx.lineTo(cx + 10, homeY);
    ctx.lineTo(cx + 10, homeY - 10);
    ctx.lineTo(cx - 10, homeY - 10);
    ctx.lineTo(cx - 10, homeY);
    ctx.fill();
    ctx.restore();

    // 3. STEPS: Draw Steps ON TOP of Path/Grass
    drawHauntedSteps(ctx, w, h);

    // FOREGROUND: Draw Trees ON TOP of grass
    if (typeof drawHauntedStaticFoliage === 'function') {
        drawHauntedStaticFoliage(ctx, w, h);
    }

    ctx.restore(); // END CLIPPING

    // DYNAMIC: Animated Bats handled in renderer.js


    // Animated Bats State
    let lastBatUpdate = 0;
    let accumulatedBatTime = 0;

    export function drawAnimatedBats(ctx, w, h) {
        const now = Date.now();
        if (lastBatUpdate === 0) lastBatUpdate = now;

        // Only advance animation if NOT paused
        if (!gameState.isPaused) {
            accumulatedBatTime += (now - lastBatUpdate);
        }
        lastBatUpdate = now;

        const time = accumulatedBatTime;

        // Bat Fleet
        const bats = [
            { id: 0, xBase: w * 0.3, yBase: h * 0.1, r: 60, speed: 0.002 },  // Was h*0.2
            { id: 1, xBase: w * 0.7, yBase: h * 0.15, r: 50, speed: -0.002 }, // Was h*0.25
            { id: 2, xBase: w * 0.4, yBase: h * 0.08, r: 70, speed: 0.0015 }, // Was h*0.18
            { id: 3, xBase: w * 0.5, yBase: h * 0.05, r: 80, speed: 0.001 },  // Was h*0.15
            { id: 4, xBase: w * 0.2, yBase: h * 0.2, r: 30, speed: 0.003 }    // Was h*0.3
        ];

        ctx.save();
        ctx.fillStyle = '#000'; // Black silhouette

        bats.forEach(bat => {
            const t = time * bat.speed + bat.id * 100;
            // Orbit movement (Oscillating)
            const x = bat.xBase + Math.cos(t) * bat.r;
            const y = bat.yBase + Math.sin(t * 1.5) * (bat.r * 0.5);

            // Flap calculation (Sine wave)
            const flap = Math.sin(time * 0.015 + bat.id);

            // Draw Angular Bat (Better silhouette)
            const size = 6; // Normal size
            ctx.beginPath();
            ctx.moveTo(x, y); // Center body
            // Wings
            ctx.lineTo(x - size * 2, y - size * flap); // Left Wing Tip
            ctx.lineTo(x - size, y + size / 2); // Left membrane
            ctx.lineTo(x, y + size); // Bottom body
            ctx.lineTo(x + size, y + size / 2); // Right membrane
            ctx.lineTo(x + size * 2, y - size * flap); // Right Wing Tip
            ctx.fill();
        });
        ctx.restore();
    }

    // --- 10. START SCREEN (THE CURSED ALTAR) ---
    export function drawHauntedStartScreen(ctx, w, h) {
        // SAFETY: Ensure we start with a clean massive slab to prevent ghosting/doubling
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, w, h); // Nuke the previous frame
        ctx.restore();

        const isGameOver = gameState.isGameOver;

        // 1. Background (Sky, Moon, Stars)
        // skipMansion=true in background, because we draw a CUSTOM SCALED one below
        drawHauntedBackground(ctx, w, h, true);

        // 2. THE MASSIVE MANSION (Backdrop)
        // Scale: Huge (2.2x to 2.5x) to fill the width and loom over
        // Position: Base is lower (80% down) so we just see the upper floors/towers

        // Scale Logic: Ensure it covers width on mobile, and looks grand on desktop
        const baseScale = (w < 600) ? 1.4 : 2.5;
        const mansionBaseY = h * 0.8; // Low base

        const layoutOverride = {
            cx: w / 2,
            baseY: mansionBaseY,
            scaleX: baseScale,
            scaleY: baseScale,
            wingsPerSide: 3 // Extra wings to fill wide screens
        };

        // Draw the Behemoth
        drawHauntedHouse(ctx, w, h, 0, 'FULL', 0, layoutOverride);

        // 3. THE HILL (Foreground Rise)
        // A central mound for the Altar
        const hillY = h * 0.85;
        const hillGrad = ctx.createLinearGradient(0, hillY - 50, 0, h);
        hillGrad.addColorStop(0, '#05070a');
        hillGrad.addColorStop(1, '#000000');

        ctx.fillStyle = hillGrad;
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, hillY + 20);
        // Gentle curve up to center
        ctx.bezierCurveTo(w * 0.2, hillY, w * 0.5, hillY - 40, w, hillY + 20);
        ctx.lineTo(w, h);
        ctx.fill();

        // 4. THE ALTAR (Center Stage)
        // Positioned at bottom center, on top of the hill
        const altarX = w / 2;
        const altarY = hillY - 60; // Sits on top of the mound

        // Draw the Altar (Handles Start vs Game Over color internally)
        drawHauntedTombstone(ctx, altarX, altarY, 1.4, true, scoreManager.highScore);

        // 5. FOREGROUND SILHOUETTES (Framing)
        // Large dead trees on sides 
        ctx.save();
        ctx.fillStyle = '#000000';
        // Left Tree
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(w * 0.15, h);
        ctx.lineTo(w * 0.12, h * 0.6);
        ctx.lineTo(0, h * 0.5);
        ctx.fill();
        // Right Tree
        ctx.beginPath();
        ctx.moveTo(w, h);
        ctx.lineTo(w * 0.85, h);
        ctx.lineTo(w * 0.88, h * 0.6);
        ctx.lineTo(w, h * 0.5);
        ctx.fill();
        ctx.restore();

        // 6. FOG & ATMOSPHERE
        ctx.save();
        const fog = ctx.createLinearGradient(0, h * 0.7, 0, h);
        fog.addColorStop(0, 'rgba(0,0,0,0)');
        fog.addColorStop(0.5, 'rgba(10, 20, 30, 0.3)'); // Blue mist
        fog.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        ctx.fillStyle = fog;
        ctx.fillRect(0, h * 0.7, w, h * 0.3);
        ctx.restore();

        // 7. TEXT OVERLAYS
        ctx.textAlign = 'center';
        // Remove Drop Shadow to prevent "Doubling" look
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;

        // Title: TAP TO START
        ctx.font = '40px "PressStart2PLocal"';
        ctx.fillStyle = '#00e676'; // Bright Ecto-Green
        ctx.fillText("TAP TO START", w / 2, h * 0.35);

        // Subtitle: DARE YOU ENTER?
        ctx.font = '16px "PressStart2PLocal"';
        ctx.fillStyle = '#b9f6ca'; // Pale Green
        ctx.fillText("DARE YOU ENTER?", w / 2, h * 0.42);
    }


    // Old drawHauntedGameOver is now subsumed by drawHauntedStartScreen
    function drawHauntedGameOver(ctx, w, h) {
        // Legacy redirect (just in case called directly)
        drawHauntedStartScreen(ctx, w, h);
    }
