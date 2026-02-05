# Pitch Progression Mapping Plan

## Goal
Create a comprehensive reference table showing how pitch availability and speeds evolve from Score 0 to 1,000.

## Analysis of Current Logic
The game uses two distinct systems to determine difficulty:

### 1. Pitch Repertoire `(js/progressionConfig.js)`
- **Phase 1 (Score 0-60)**: Introduces single pitch types (Fastball -> Curve -> Splitter, etc.).
- **Phase 1.5 (Score 70)**: "The Bridge" - mixes earlier pitches.
- **Phase 2 (Score 80-230)**: "The Weave" - Introduces Hybrid pitches (e.g., Curve-Splitter) mixed with legacy pitches.
- **Phase 3 (Score 240-260)**: "God Tier" - Extremely difficult pitches.
- **Chaos Mode (Score > 260)**: All pitches unlocked and selected randomly.

### 2. Speed Scaling `(js/pitcherSystem.js)`
Speed is calculated using a dynamic multiplier applied to the pitch's `baseSpeed`.

- **Score 0-50**: Rapid linear increase.
  - Formula: `0.6 + (Score * 0.02)`
  - Range: 0.6x to 1.6x
- **Score 51-100**: Moderate increase.
  - Formula: `1.6 + ((Score - 50) * 0.005)`
  - Range: 1.6x to 1.85x
- **Score 101+**: Slow, infinite linear scaling.
  - Formula: `1.85 + ((Score - 100) * 0.001)`
  - Range: 1.85x -> 2.75x (at Score 1000)

## Execution Plan
We will generate a data table sampling the game state every 10 points (and at critical tier boundaries) from Score 0 to 1,000.

### Output Columns
1. **Score**: The game score.
2. **Speed Multiplier**: The global speed factor.
3. **Reference Speed (Fastball)**: Visual reference of how fast a standard Fastball travels.
4. **Active Phase**: The current progression phase description.
5. **New/Unlock**: Which specific pitches are dominating the pool or unlocked at this stage.

### Implementation
I will create a temporary script `tools/map_pitches.js` to execute the game's exact logic and print the Markdown table to `pitch_stats_1000.md`.
