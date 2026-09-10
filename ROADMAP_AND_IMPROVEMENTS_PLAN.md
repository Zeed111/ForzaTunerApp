# Forza Pro Tuner — Comprehensive Improvement Roadmap & Implementation Plan

This roadmap outlines targeted engineering improvements for **Forza Pro Tuner**, divided into two core pillars:
1. **Mathematical & Physics Calculation Enhancements** (Refining vehicle dynamics, Forza meta algorithms, and physics accuracy).
2. **App-Level Features & User Experience Enhancements** (New interactive tools, tuning assistant, preset sharing, and workflow optimizations).

---

## Pillar 1: Mathematical & Physics Calculation Improvements

### 1. Tire Compound Modeling & Thermal Pressure Dynamics
- **Current State**: Tire pressures are estimated solely from axle load, discipline, and tire section width.
- **Proposed Enhancement**:
  - Add a **Tire Compound Selector** (`Stock`, `Street`, `Sport`, `Semi-Slick`, `Race Slick`, `Rally`, `Off-Road`, `Drift`, `Drag`).
  - Introduce **Cold vs. Hot Operating Pressure**:
    - Forza physics models dynamic tire heating. During cornering and high-speed runs, tire temperatures increase pressure by $+2.0\text{ to }+4.0\text{ PSI}$ ($+0.14\text{ to }+0.28\text{ bar}$).
    - Race slicks require a target hot pressure of $32.0\text{ PSI}$ ($2.21\text{ bar}$); starting cold pressure should be calculated at $\approx 27.5\text{ to }28.5\text{ PSI}$.
    - Drift tires require deliberate front-to-rear thermal disparity ($32\text{ PSI}$ front for steering authority, $22\text{ to }25\text{ PSI}$ rear for contact patch expansion under slip).
  - Add compound grip coefficients $\mu_{compound}$ affecting lateral G demand and spring roll calculations.

### 2. Aerodynamic Downforce Compensation on Spring Stiffness
- **Current State**: Spring rates are calculated via static front/rear weight distribution:
  $$k_{front} = \text{spMin} + (\text{spMax} - \text{spMin}) \times \text{frontWeightPct}$$
- **Proposed Enhancement**:
  - In high-speed sweepers and braking zones, downforce creates significant dynamic axle loads:
    $$F_{downforce} = \frac{1}{2} \rho v^2 C_L A$$
  - High-downforce builds (Track, GT, Supercar) on soft base springs will compress suspension into the bump stops, causing snap-oversteer or severe understeer.
  - Implement dynamic aero compensation:
    $$k_{eff} = k_{base} \times \left(1 + \frac{\text{AeroSetting}}{\text{AxleMass}} \times \beta\right)$$
  - Prevents bottoming-out while maintaining bump absorption in low-speed sections.

### 3. Anti-Roll Bars (Roll Stiffness Gradient & Handling Bias Slider)
- **Current State**: ARBs are calculated via corner weight scaling and tire width stagger ratio.
- **Proposed Enhancement**:
  - Add an interactive **Handling Bias Slider** (range: `-5` Heavy Understeer / Safe $\leftrightarrow$ `0` Neutral $\leftrightarrow$ `+5` Loose / Aggressive Rotation).
  - Adjusts the front-to-rear roll stiffness distribution:
    $$\Delta_{ARB} = \text{Bias} \times 1.8$$
    $$\text{ARB}_{front}' = \text{clamp}(\text{ARB}_{front} - \Delta_{ARB}, 1, 65)$$
    $$\text{ARB}_{rear}' = \text{clamp}(\text{ARB}_{rear} + \Delta_{ARB}, 1, 65)$$
  - Allows players on controllers or keyboards to dial in forgiving stability, while competitive rivals drivers can dial in maximum turn-in rotation.

### 4. Damping: Critical Damping Ratio ($\zeta$) & Unsprung Mass Tuning
- **Current State**: Uses an empirical base value with mass modifiers and discipline scalar multipliers.
- **Proposed Enhancement**:
  - Implement true automotive critical damping ratio physics:
    $$c_{crit} = 2 \sqrt{k \cdot m_{corner}}$$
    $$\text{Rebound} = \zeta_{reb} \cdot c_{crit}$$
    $$\text{Bump} = \zeta_{bmp} \cdot c_{crit}$$
  - Define explicit damping ratio targets per discipline:
    - **Grip / Track**: $\zeta_{reb} = 0.70 - 0.78$, $\zeta_{bmp} = 0.40 - 0.48$ (body motion control with curb compliance).
    - **Dirt / Rally**: $\zeta_{reb} = 0.55 - 0.65$, $\zeta_{bmp} = 0.28 - 0.35$ (fast wheel response over ruts).
    - **Off-Road**: $\zeta_{reb} = 0.45 - 0.55$, $\zeta_{bmp} = 0.22 - 0.28$ (maximizes articulation over boulders).
    - **Drift**: Front $\zeta_{reb} = 0.80$ (quick transition response), Rear $\zeta_{bmp} = 0.25$ (controlled squat for forward drive).

### 5. Advanced Differential Algorithms Matching Modern Forza Meta
- **Current State**: Fixed empirical values based on discipline and horsepower.
- **Proposed Enhancement**:
  - **AWD Street / Track Meta**:
    - Front Decel: Lock to $0\%$ (in Forza physics, non-zero front decel causes off-throttle understeer on corner entry).
    - Front Accel: Scale with horsepower between $22\%$ and $34\%$.
    - Rear Accel: $72\%\text{ to }84\%$.
    - Rear Decel: $10\%\text{ to }18\%$.
    - Center Diff: Scale between $65\%\text{ and }74\%\text{ Rear}$ based on front weight distribution.
  - **RWD Competitive Meta**:
    - Low-speed traction control: High-torque engines receive progressive acceleration lock ($45\%\text{ to }65\%$) to avoid snap on throttle tip-in.
    - Deceleration lock tuned directly to engine braking and weight transfer ($12\%\text{ to }22\%$).

### 6. Gearing Engine: Power-Band Shift Drops & Aerodynamic Drag Limit
- **Current State**: Uses geometric progression based on target top speed and redline.
- **Proposed Enhancement**:
  - **Power-Band Drop Matching**: Ensure each upshift drops engine RPM right at the start of peak power:
    - `highrev` (VTEC / NA): Tight gear ratios ($15-20\%$ drop), keeping RPM above $6,500\text{ RPM}$.
    - `torque` (V8 / Diesel): Wider gear spacing ($28-35\%$ drop) taking advantage of low-end torque.
    - `balanced` (Turbo): Medium spacing landing above boost threshold ($\approx 4,500\text{ RPM}$).
  - **1st Gear Wheelspin Optimization**: High-power RWD builds automatically receive a taller 1st gear to prevent wheelspin upon launch.
  - **Top Speed Drag Feasibility Check**: Compare requested top speed against theoretical aero drag power:
    $$P_{req} \approx \frac{1}{2} C_d A \rho v^3$$
    Flag a warning if target speed is unreachable without additional upgrades.

---

## Pillar 2: App Features & User Experience Improvements

### 1. Interactive "Tune Doctor" / Diagnostic Symptom Troubleshooter
- **Concept**: A dedicated troubleshooting tool where players click specific handling issues experienced during gameplay and receive precise tuning adjustments:
  - *"Car pushes wide on corner entry"* $\rightarrow$ Soften Front ARB by $2.5$, Add $0.10^\circ$ Front Toe-Out, Soften Front Bump Damping.
  - *"Rear snaps out on corner exit"* $\rightarrow$ Lower Rear Diff Accel by $8\%$, Soften Rear Springs by $5\%$, Increase Rear Wing Downforce.
  - *"Car bounces or skips over curbs"* $\rightarrow$ Reduce Bump Damping by $1.5$, Raise Ride Height by $0.5\text{ cm}$.
  - *"Excessive 1st/2nd gear wheelspin"* $\rightarrow$ Lengthen Final Drive by $-0.15$ or 1st Gear by $-0.30$, Drop Rear Tire Pressure by $1.5\text{ PSI}$.
- Players can click **"Apply Recommended Adjustments"** to directly update their active setup.

### 2. In-Game "Companion / Tune Mode" Step-by-Step Checklist
- **Concept**: A focused, distraction-free companion mode formatted to match the exact in-game Forza garage upgrade tabs:
  1. Tire Pressure (Front / Rear)
  2. Gearing (Final Drive + Individual Gears)
  3. Alignment (Camber, Toe, Caster)
  4. Anti-Roll Bars (Front / Rear)
  5. Springs (Springs + Ride Height)
  6. Damping (Rebound + Bump)
  7. Aero (Front / Rear Downforce)
  8. Brakes (Balance + Pressure)
  9. Differential (Front / Rear / Center)
- Each item includes a single-tap **"Copy"** button and interactive checkboxes so players don't miss an item while applying values on console/PC.

---

## Prioritized Implementation Phasing

| Phase | Focus Area | Key Deliverables | Estimated Scope |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Core Calculation Upgrades** | • Tire Compound selector & thermal pressures<br>• Dynamic Aero-Spring compensation<br>• Handling Bias slider (`-5` to `+5`) | Fast / High Impact (Completed) |
| **Phase 2** | **Tune Doctor & Workflow** | • Interactive "Tune Doctor" symptom troubleshooter modal<br>• In-Game step-by-step checklist mode | Medium / High Value |
| **Phase 3** | **Gearing & Physics Refinement** | • Shift-drop powerband matching<br>• 1st gear launch traction optimization<br>• Theoretical aerodynamic top-speed validation | Medium |


