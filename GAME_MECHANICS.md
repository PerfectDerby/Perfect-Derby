# Baseball Game Mechanics Documentation

## 1. Pitch Types

*   **Fastball:** Standard straight pitch.
*   **Curveball:** Moves horizontally using a sine wave function.
    *   `offset = Math.sin(curvePhase) * 50 * direction`
    *   Wobbles left OR right by up to 50 pixels.
*   **Changeup:** Slower version of the fastball.
*   **Splitter:** Starts slow (Base 0.28) and drops rapidly just before the plate using a multiplier.
    *   **Standard Splitter:** 2.8x Acceleration. Peak Speed: ~0.78 (Slower than Super Fastball).
    *   **Super Splitter:** Starts faster (Base 0.32), 2.6x Acceleration. Peak Speed: ~0.83.
    *   **Splitter Changeup:** Starts very slow (Base 0.22), 2.5x Acceleration. Peak Speed: ~0.55.
*   **Stopball:** Pauses in mid-air for 400ms when it reaches the halfway point.
*   **Ghostball:** Becomes invisible for the middle 30% of its flight.
*   **Super Fastball:** Extremely fast pitch (Base 0.85).
*   **Stop-Curve:** Hybrid. Flashes Purple then Pink. Curves AND pauses.
*   **Ghost-Curve:** Hybrid. Flashes Cyan then Pink. Curves AND becomes invisible.

## 2. Speed Scaling (Score Multiplier)
The game speed increases as the player scores points.
*   **Base Multiplier:** 0.6x

| Phase | Score Range | Increase per Point | Max Multiplier at End of Phase |
| :--- | :--- | :--- | :--- |
| **1** | **0 - 50** | **+2.0%** (0.02) | **1.60x** |
| **2** | **51 - 100** | **+0.5%** (0.005) | **1.85x** |
| **3** | **101+** | **+0.1%** (0.001) | **Infinite** |

## 3. Pitch Probabilities by Score Tier
**Progression Rule:** A new pitch type is introduced roughly every 10 points and is given a **high probability** so the player experiences it immediately. Older pitches are retained with lower probabilities.
*(Note: Full probability table defined in `js/progressionConfig.js` - refer to source for exact percentages as they dynamically adjust)*

## 4. Batting Mechanics

### Hit Detection Criteria
A hit is registered only if **ALL** of the following conditions are met simultaneously:
1.  **Angle Match:** The difference between the bat's angle and the ball's angle is less than `1.2` radians.
2.  **Barrel Hit:** The distance from the bat's pivot to the ball is between `30` and `bat.length + 15` pixels.
3.  **Position:**
    *   Ball must be in front of the batter (`x > pivotX - 10`).
    *   Ball must be high enough (`y < pivotY + 30`).

## 5. Hit vs. Foul Logic

Once a collision is detected, the game determines if it's a **Fair Hit** or a **Foul Ball** based on the timing (bat angle).

### Fair Hit (Good Input)
*   **Condition:** Bat angle is between `-0.2` and `-2.5` radians.
*   **Result:** The ball is hit into the field.
*   **Direction:** The hit angle is mapped to the field angle (between the foul lines).
    *   **Clamped Input:** `-1.8` to `-0.4` radians.
    *   **Output Angle:** Mapped between Right Foul Line (~-56°) and Left Foul Line (~-123°).
    *   **Jitter:** A random variation of +/- `0.025` radians is added to every hit.

### Foul Ball (Bad Input)
*   **Condition:** Bat angle is outside the "Good Input" range (too early or too late).
*   **Result:** The ball is hit foul.

## 6. Foul Ball Types & Probabilities

If the hit is a foul, one of three types is randomly selected:

### 1. Close Call (30% Chance)
*   **Description:** Travels forward but lands just outside the foul lines.
*   **Offset:** `0.08` to `0.13` radians from the foul line.
*   **Spin (Slice):** Adds a curve of `0.03` to `0.06` to make it veer away from the field.

### 2. Long Foul (40% Chance)
*   **Description:** Travels forward but goes wide into the stands.
*   **Offset:** `0.25` to `0.75` radians from the foul line.
*   **Spin (Slice):** Adds a stronger curve of `0.05` to `0.10`.

### 3. Way Back (30% Chance)
*   **Description:** The ball is hit backwards or sharply to the side (behind the batter).
*   **Right Side:** Angle between `0.2` and `1.2` radians (Back/Right).
*   **Left Side:** Angle between `PI - 0.2` and `PI - 1.2` radians (Back/Left).
*   **Spin:** Fixed spin of `0.02`.

## 7. Scoring & Game Over

### Scoring
*   **Fair Hit (Good Input):** +1 Point. Resets "Perfect Hit Streak".
*   **Perfect Hit (Outer Barrel):**
    *   **1st Perfect Hit:** +1 Point.
    *   **2nd Consecutive:** +2 Points.
    *   **3rd+ Consecutive:** +3 Points.
*   **Visual:** "PERFECT HIT!" message and floating score (+1, +2, +3).
*   **Streak Reset:** Any "Good Hit", Foul, or Strike resets the streak to 0.

### Game Over
The game ends when the player accumulates **3 Strikes**.
- **Strikes**: Occur when a pitch passes the batter without being hit.
- **Fouls**: Count as strikes, but cannot cause the 3rd strike (a foul with 2 strikes keeps the count at 2).
- **Restart**: Tap the screen to restart the game after a Game Over.
