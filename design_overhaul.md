# Game Design Overhaul: The "Big Leagues" Update

## Executive Summary
This plan addresses the current disjointed progression systems and difficulty spikes/plateaus. The goal is to create a cohesive "Career Mode" feeling where the player progresses through defined Leagues, facing distinct Pitchers with unique personalities and "signature pitches."

## Core Problems Identified
1.  **Dual Progression Systems**: The game currently fights between `rosterConfig.js` (Score 0-149) and `progressionConfig.js` (Legacy fallback). This causes abrupt changes and breaks modularity.
2.  **Linear Difficulty**: The speed scaling (Formula: `0.6 + Score*0.02`) creates a brutal learning curve early on, then plateaus. Faster isn't always funner.
3.  **Predictability**: "New pitcher every 50" becomes stale.
4.  **Content Exhaustion**: Running out of defined content at Score 150 leads to a generic "Legacy Mode."

---

## The Solution: Unified League System

We will abolish the "Legacy Fallback" and the infinite linear math. Instead, we introduce **Leagues**.

### 1. The Structure
The game is divided into **Leagues**. Each League consists of a series of **Batters Faced** (pacing) or **Score Thresholds**.

*   **Rookie League** (Scores 0-49)
    *   *Focus*: Learning timing and basic curves.
    *   *Pitcher*: **"The Rookie"** (Standard Fastballs/Curves).
    *   *Speed Cap*: Low.
*   **minor League** (Scores 50-99)
    *   *Focus*: Movement and deception.
    *   *Pitcher*: **"The Technician"** (Stopballs, Splitters).
    *   *Speed Cap*: Medium.
*   **Major League** (Scores 100-149)
    *   *Focus*: Hybrids and Velocity.
    *   *Pitcher*: **"The Ace"** (Super Curves, Ghostballs).
    *   *Speed Cap*: High.
*   **Hall of Fame** (Scores 150+)
    *   *Focus*: Survival.
    *   *Pitcher*: **"The Legend"** (God-Tier Pitches).
    *   *Speed*: Uncapped.

### 2. The "Prestige" Loop (Infinite Scaling)
Instead of just stopping or randomizing after Score 150 (or 250), we implement a **Season System**.
Once you beat "The Legend", you loop back to face **"The Rookie (Season 2)"**.
*   **Season 2 Changes**:
    *   Base speed starts 10% higher.
    *   Reaction windows shrink.
    *   Strike Zone gets slightly tighter (optional).
    *   The Rookie now has one "Trick Pitch" he didn't have in Season 1.

### 3. Difficulty Smoothing (Wave Scaling)
Instead of a straight line up, we use **Wave Scaling**.
*   **Start of New Pitcher**: Speed drops slightly (-5% to -10%).
    *   *Why?* You are learning a new mechanic (e.g., stopping balls). You need mental bandwidth.
*   **Mid-Pitcher**: Speed ramps up back to normal.
*   **End-Pitcher (Audition)**: Speed spikes +10%. A "Final Boss" test before the next pitcher enters.

### 4. Pitcher Identity & Mechanics
Each pitcher needs a stronger identity.
*   **The Rookie**: "I throw heat." (Fastball, Super Fastball).
*   **The Technician**: "I mess with your timing." (Changeup, Stopball).
*   **The Magician**: "Now you see it..." (Ghostball, Ghost-Splitter).
*   **The Cheat** (Secret Boss): Throws "Impossible" pitches (ZigZag-Stop).

## Implementation Steps

### Phase 1: Unification
1.  **Delete `progressionConfig.js`**. Move all logic into `rosterConfig.js`.
2.  **Expand `rosterConfig.js`**:
    *   Add a `Cycle` or `Season` parameter.
    *   Create a `getPitcher(score)` function that handles modulo math (e.g., Score 350 = Season 2 Technician).

### Phase 2: Refined Difficulty
1.  **Refactor `pitcherSystem.js`**:
    *   Remove the global speed formula.
    *   Add a per-pitcher `baseSpeedMultiplier`.
    *   Pass the *current streak* vs that pitcher to calculate local difficulty.

### Phase 3: The "Health" Mechanic
*   **Strikes**: Continue resetting strikes on Pitcher change. This is a perfect "Heal" mechanic.
*   **Fouls**: Consider resetting "Consecutive Fouls" (which simplify pitches in some games) to prevent cheese.

## User Decisions Needed
1.  **Do you like the "Season" loop idea?** (Replaying tougher versions of early pitchers vs. just facing unthemed randomness).
2.  **Strikes clearing**: Should we keep this as a reward for beating a pitcher? (Recommended: Yes).
