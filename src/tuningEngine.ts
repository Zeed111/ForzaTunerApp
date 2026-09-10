export type UnitSystem = 'metric' | 'imperial';
export type CarCategory = 'jdm' | 'track' | 'classic' | 'supercar';
export type Discipline = 'drift' | 'grip' | 'dirt' | 'offroad' | 'drag';
export type Drivetrain = 'RWD' | 'AWD' | 'FWD';
export type EngineType = 'balanced' | 'highrev' | 'torque' | 'ev';
export type TireCompound =
  | 'stock'
  | 'street'
  | 'sport'
  | 'semislick'
  | 'slick'
  | 'rally'
  | 'offroad'
  | 'drift'
  | 'drag';

export interface VehicleInputs {
  units: UnitSystem;
  category: CarCategory;
  discipline: Discipline;
  drivetrain: Drivetrain;
  hp: number;
  weight: number; // kg or lbs based on units
  frontWeightPct: number;
  tireCompound?: TireCompound;
  handlingBias?: number; // -5 (Stable/Understeer) to +5 (Agile/Oversteer), default 0
  // Tires
  tWidthF: number;
  tProfileF: number;
  tRimF: number;
  tWidthR: number;
  tProfileR: number;
  tRimR: number;
  // Slider limits
  springFrontMin: number;
  springFrontMax: number;
  springRearMin: number;
  springRearMax: number;
  heightFrontMin: number;
  heightFrontMax: number;
  heightRearMin: number;
  heightRearMax: number;
  aeroFrontMin: number;
  aeroFrontMax: number;
  aeroRearMin: number;
  aeroRearMax: number;
  // Gearing
  redlineRpm: number;
  topSpeed: number; // km/h or mph
  numGears: number;
  engineType: EngineType;
}

export interface TuneResult {
  tireFront: string;
  tireRear: string;
  tireFrontCold: string;
  tireFrontHot: string;
  tireRearCold: string;
  tireRearHot: string;
  handlingBiasNote?: string;
  camberFront: string;
  camberRear: string;
  toeFront: string;
  toeRear: string;
  caster: string;
  arbFront: string;
  arbRear: string;
  springFront: string;
  springRear: string;
  heightFront: string;
  heightRear: string;
  rebFront: string;
  rebRear: string;
  bmpFront: string;
  bmpRear: string;
  aeroFront: string;
  aeroRear: string;
  brakeBalance: string;
  brakePressure: string;
  diffFront?: string;
  diffRear?: string;
  diffCenter?: string;
  finalDrive: string;
  gearRatios: number[];
  driveCircumferenceM: number;
  redlineRpm: number;
  targetSpeedDisplay: number;
  estimatedTopSpeed: string;
  estimatedTopSpeedKm: number;
  aeroDragNote?: string;
}

function clamp(val: number, min: number, max: number): number {
  if (isNaN(val)) return min;
  return Math.min(Math.max(val, min), max);
}

function formatToe(val: number): string {
  if (Math.abs(val) < 0.005) return '0.00°';
  // In Forza Horizon: Negative (-) is Toe-Out, Positive (+) is Toe-In
  if (val < 0) {
    return `${val.toFixed(2)}° (Out)`;
  }
  return `+${val.toFixed(2)}° (In)`;
}

export function calculateTune(car: VehicleInputs): TuneResult {
  const isImp = car.units === 'imperial';
  // Standardize weight to kg for internal physics calculations
  const rawWeight = car.weight > 0 ? car.weight : (isImp ? 3000 : 1360);
  const weightKg = clamp(isImp ? rawWeight / 2.20462 : rawWeight, 400, 4500);

  const rawFw = car.frontWeightPct > 0 ? car.frontWeightPct : 52;
  const fw = clamp(rawFw / 100, 0.30, 0.75);
  const rw = 1 - fw;

  const frontMassKg = weightKg * fw;
  const rearMassKg = weightKg * rw;
  const safeHp = Math.max(30, car.hp || 300);
  const hpFactor = clamp((safeHp - 250) / 750, 0, 1);
  const powerToWeightTon = (safeHp / weightKg) * 1000;

  // 1. Tire Kinematics & Stagger
  const widthF = clamp(car.tWidthF || 245, 135, 405);
  const profileF = clamp(car.tProfileF || 40, 20, 85);
  const rimF = clamp(car.tRimF || 18, 12, 26);

  const widthR = clamp(car.tWidthR || 275, 135, 405);
  const profileR = clamp(car.tProfileR || 35, 20, 85);
  const rimR = clamp(car.tRimR || 18, 12, 26);

  const tireDiameterMF = Math.max(0.35, (2 * (widthF * (profileF / 100)) + rimF * 25.4) / 1000);
  const tireCircumferenceMF = Math.PI * tireDiameterMF;
  const tireDiameterMR = Math.max(0.35, (2 * (widthR * (profileR / 100)) + rimR * 25.4) / 1000);
  const tireCircumferenceMR = Math.PI * tireDiameterMR;

  let driveCircumferenceM = tireCircumferenceMR;
  if (car.drivetrain === 'FWD') driveCircumferenceM = tireCircumferenceMF;
  else if (car.drivetrain === 'AWD') driveCircumferenceM = tireCircumferenceMF * 0.4 + tireCircumferenceMR * 0.6;

  // Tire stagger ratio (wider rears increase natural understeer, needing rear roll compensation)
  const stagger = clamp(widthR / widthF, 0.8, 1.5);
  const widthScaleF = 245 / widthF;
  const widthScaleR = 245 / widthR;

  // 2. Tire Compound & Thermal Pressure Modeling
  const compound: TireCompound = car.tireCompound || 'sport';
  const bias = clamp(car.handlingBias != null ? car.handlingBias : 0, -5, 5);

  let compoundGrip = 1.00;
  let thermalRiseBarF = 0.19; // ~2.8 PSI
  let thermalRiseBarR = 0.19; // ~2.8 PSI
  let compoundBaseMod = 0.0;

  switch (compound) {
    case 'stock':
      compoundGrip = 0.90;
      thermalRiseBarF = 0.15;
      thermalRiseBarR = 0.15;
      compoundBaseMod = 0.05;
      break;
    case 'street':
      compoundGrip = 0.95;
      thermalRiseBarF = 0.17;
      thermalRiseBarR = 0.17;
      compoundBaseMod = 0.02;
      break;
    case 'sport':
      compoundGrip = 1.00;
      thermalRiseBarF = 0.19;
      thermalRiseBarR = 0.19;
      compoundBaseMod = 0.0;
      break;
    case 'semislick':
      compoundGrip = 1.10;
      thermalRiseBarF = 0.22;
      thermalRiseBarR = 0.22;
      compoundBaseMod = -0.04;
      break;
    case 'slick':
      compoundGrip = 1.22;
      thermalRiseBarF = 0.25;
      thermalRiseBarR = 0.25;
      compoundBaseMod = -0.07;
      break;
    case 'rally':
      compoundGrip = 0.92;
      thermalRiseBarF = 0.14;
      thermalRiseBarR = 0.14;
      compoundBaseMod = -0.15;
      break;
    case 'offroad':
      compoundGrip = 0.85;
      thermalRiseBarF = 0.12;
      thermalRiseBarR = 0.12;
      compoundBaseMod = -0.25;
      break;
    case 'drift':
      compoundGrip = 0.94;
      thermalRiseBarF = 0.14; // Front stable
      thermalRiseBarR = 0.26; // High rear slip friction
      compoundBaseMod = 0.0;
      break;
    case 'drag':
      compoundGrip = 1.18;
      thermalRiseBarF = 0.10;
      thermalRiseBarR = 0.18;
      compoundBaseMod = 0.0;
      break;
  }

  // Target Hot Operating Pressures (in bar) - based on axle load, discipline, width, and compound
  let targetHotBarF = 2.15;
  let targetHotBarR = 2.15;

  if (car.discipline === 'drift') {
    targetHotBarF = clamp(2.35 + (frontMassKg - 700) * 0.00038 * widthScaleF + compoundBaseMod, 2.10, 2.80);
    targetHotBarR = clamp(1.85 + (rearMassKg - 700) * 0.00032 * widthScaleR + compoundBaseMod, 1.50, 2.30);
  } else if (car.discipline === 'grip') {
    targetHotBarF = clamp(2.10 + (frontMassKg - 700) * 0.00040 * widthScaleF + compoundBaseMod, 1.85, 2.55);
    targetHotBarR = clamp(2.10 + (rearMassKg - 700) * 0.00040 * widthScaleR + compoundBaseMod, 1.85, 2.55);
  } else if (car.discipline === 'dirt') {
    targetHotBarF = clamp(1.75 + (frontMassKg - 700) * 0.00030 * widthScaleF + compoundBaseMod, 1.45, 2.20);
    targetHotBarR = clamp(1.75 + (rearMassKg - 700) * 0.00030 * widthScaleR + compoundBaseMod, 1.45, 2.20);
  } else if (car.discipline === 'offroad') {
    targetHotBarF = clamp(1.55 + (frontMassKg - 700) * 0.00025 * widthScaleF + compoundBaseMod, 1.30, 1.95);
    targetHotBarR = clamp(1.55 + (rearMassKg - 700) * 0.00025 * widthScaleR + compoundBaseMod, 1.30, 1.95);
  } else if (car.discipline === 'drag') {
    targetHotBarF = clamp(3.30 + (frontMassKg - 700) * 0.0003, 2.80, 3.80);
    targetHotBarR = clamp(1.25 + (rearMassKg - 700) * 0.0002, 1.10, 1.55);
  }

  targetHotBarF = clamp(targetHotBarF, 1.15, 3.80);
  targetHotBarR = clamp(targetHotBarR, 1.15, 3.80);

  // Cold Starting Pressures (what the player inputs in the Forza tuning menu)
  const coldBarF = clamp(targetHotBarF - thermalRiseBarF, 1.05, 3.65);
  const coldBarR = clamp(targetHotBarR - thermalRiseBarR, 1.05, 3.65);

  // 3. Alignment (Camber, Toe, Caster)
  // Profile mod: taller sidewalls deform more under lateral G, requiring more negative static camber
  const profileModF = clamp((profileF - 35) * 0.015, -0.2, 0.4);
  const profileModR = clamp((profileR - 35) * 0.015, -0.2, 0.4);
  const massRollMod = clamp((weightKg - 1300) * 0.0003, -0.25, 0.45);

  let cF = -1.8, cR = -1.2, toeF = 0.0, toeR = 0.0, caster = 6.2;

  if (car.discipline === 'drift') {
    // Front: heavy negative camber for steering angle, rear: near-zero camber for acceleration while sideways
    cF = clamp(-4.4 - (fw - 0.5) * 1.6 - profileModF - massRollMod * 0.5, -5.5, -3.8);
    cR = clamp(-0.4 - (rw - 0.5) * 0.8 - (powerToWeightTon > 380 ? 0.2 : 0), -1.2, -0.2);
    // In Forza: Negative is Toe-Out (sharp turn-in and angle hold)
    toeF = clamp(-0.55 - (fw - 0.5) * 0.8 - (safeHp > 600 ? 0.15 : 0), -1.2, -0.3);
    // Rear: slight Toe-In for high-speed control or neutral
    toeR = clamp((rw - 0.5) * 0.4, 0.0, 0.2);
    caster = clamp(6.8 + (fw - 0.5) * 0.8, 6.5, 7.0);
  } else if (car.discipline === 'drag') {
    cF = 0.0; cR = 0.0; toeF = 0.0; toeR = 0.0; caster = 7.0;
  } else if (car.discipline === 'offroad') {
    cF = clamp(-0.6 - (fw - 0.5) * 0.6 - massRollMod * 0.4, -1.2, -0.4);
    cR = clamp(-0.4 - (rw - 0.5) * 0.5 - massRollMod * 0.4, -0.9, -0.2);
    toeF = 0.0; toeR = 0.0;
    caster = 6.8;
  } else if (car.discipline === 'dirt') {
    cF = clamp(-1.2 - (fw - 0.5) * 0.8 - profileModF, -1.8, -0.9);
    cR = clamp(-0.8 - (rw - 0.5) * 0.6 - profileModR, -1.3, -0.5);
    toeF = -0.10; // slight Toe-Out
    toeR = 0.10;  // slight Toe-In for high-speed stability
    caster = 6.5;
  } else {
    // Grip / Track / JDM / Classic / Supercar
    let baseCamberF = -1.9, baseCamberR = -1.3, baseCaster = 6.3;
    if (car.category === 'track') { baseCamberF = -2.4; baseCamberR = -1.7; baseCaster = 6.7; }
    else if (car.category === 'jdm') { baseCamberF = -2.0; baseCamberR = -1.4; baseCaster = 6.3; }
    else if (car.category === 'classic') { baseCamberF = -1.5; baseCamberR = -0.9; baseCaster = 5.7; }
    else if (car.category === 'supercar') { baseCamberF = -2.2; baseCamberR = -1.8; baseCaster = 6.5; }

    cF = clamp(baseCamberF - (fw - 0.5) * 1.4 - profileModF - massRollMod, -3.2, -1.0);
    cR = clamp(baseCamberR - (rw - 0.5) * 1.1 - profileModR - massRollMod, -2.5, -0.5);
    toeF = car.category === 'track' ? -0.10 : 0.0;
    toeR = fw < 0.48 || car.category === 'supercar' ? 0.15 : (fw > 0.56 ? 0.05 : 0.10);
    caster = clamp(baseCaster + (fw - 0.5) * 0.8, 5.2, 7.0);
  }

  // Handling bias effect on Alignment & Turn-in:
  if (bias > 0) {
    // Agile / Oversteer: slight extra front toe-out for immediate bite, slight extra negative camber
    toeF = clamp(toeF - bias * 0.02, -1.2, 0.2);
    cF = clamp(cF - bias * 0.05, -5.5, -0.8);
  } else if (bias < 0) {
    // Stable / Understeer: slight extra rear camber for planted traction
    cR = clamp(cR + bias * 0.04, -3.0, -0.2);
  }

  // 4. Aero Downforce (Calculated before springs to allow dynamic aero compensation)
  const aeroFMin = car.aeroFrontMin || 0;
  const aeroFMax = Math.max(aeroFMin, car.aeroFrontMax || 150);
  const aeroRMin = car.aeroRearMin || 0;
  const aeroRMax = Math.max(aeroRMin, car.aeroRearMax || 250);

  let aeroF = aeroFMin;
  let aeroR = aeroRMin;

  if (car.discipline === 'offroad' || car.discipline === 'dirt') {
    aeroF = aeroFMin + (aeroFMax - aeroFMin) * 0.35;
    aeroR = aeroRMin + (aeroRMax - aeroRMin) * 0.40;
  } else if (car.discipline === 'drift') {
    aeroF = aeroFMin + (aeroFMax - aeroFMin) * clamp(0.20 + hpFactor * 0.25, 0.15, 0.60);
    aeroR = aeroRMin + (aeroRMax - aeroRMin) * clamp(0.25 + hpFactor * 0.30, 0.20, 0.70);
  } else if (car.discipline === 'drag') {
    aeroF = aeroFMin;
    aeroR = aeroRMin;
  } else {
    // Grip
    const baseGrip = car.category === 'track' ? 0.85 : 0.60;
    aeroF = aeroFMin + (aeroFMax - aeroFMin) * clamp(baseGrip * (fw / 0.5), 0.15, 0.95);
    aeroR = aeroRMin + (aeroRMax - aeroRMin) * clamp(baseGrip * (rw / 0.5) * 1.08, 0.15, 0.95);
  }

  // 5. Springs with Dynamic Aero Downforce Compensation
  const spFMin = car.springFrontMin || 100;
  const spFMax = Math.max(spFMin + 1, car.springFrontMax || 600);
  const spRMin = car.springRearMin || 100;
  const spRMax = Math.max(spRMin + 1, car.springRearMax || 600);

  const rangeSpF = spFMax - spFMin;
  const rangeSpR = spRMax - spRMin;

  let springRatioF = fw;
  let springRatioR = rw;

  // Aero dynamic load ratio:
  const aeroRangeF = aeroFMax - aeroFMin;
  const aeroRangeR = aeroRMax - aeroRMin;
  const aeroLoadF = aeroRangeF > 0 ? (aeroF - aeroFMin) / aeroRangeF : 0;
  const aeroLoadR = aeroRangeR > 0 ? (aeroR - aeroRMin) / aeroRangeR : 0;

  // Dynamic Aero Boost: Stiffens spring rate so high-speed downforce doesn't bottom out
  const aeroSpringBoostF = aeroLoadF * 0.12 * compoundGrip;
  const aeroSpringBoostR = aeroLoadR * 0.12 * compoundGrip;

  if (car.discipline === 'drift') {
    // Drift: Slightly softer rear spring allows rear to squat under throttle for forward bite
    springRatioF = clamp(fw + 0.04 + aeroSpringBoostF, 0.25, 0.88);
    springRatioR = clamp(rw - 0.06 + aeroSpringBoostR, 0.15, 0.82);
  } else if (car.discipline === 'drag') {
    springRatioF = 0.85;
    springRatioR = 0.15;
  } else if (car.discipline === 'offroad') {
    springRatioF = clamp(fw * 0.75 + aeroSpringBoostF, 0.25, 0.65);
    springRatioR = clamp(rw * 0.75 + aeroSpringBoostR, 0.25, 0.65);
  } else if (car.discipline === 'dirt') {
    springRatioF = clamp(fw * 0.85 + aeroSpringBoostF, 0.30, 0.72);
    springRatioR = clamp(rw * 0.85 + aeroSpringBoostR, 0.30, 0.72);
  } else {
    springRatioF = clamp(fw + aeroSpringBoostF, 0.25, 0.90);
    springRatioR = clamp(rw + aeroSpringBoostR, 0.25, 0.90);
  }

  const spF = spFMin + rangeSpF * springRatioF;
  const spR = spRMin + rangeSpR * springRatioR;

  // Anti-Roll Bars (ARBs): Scale with total vehicle weight, tire stagger, and handling balance bias
  const weightArbScale = clamp(weightKg / 1380, 0.70, 1.45);
  let baseArbF = ((65 - 1) * fw + 1) * weightArbScale;
  let baseArbR = ((65 - 1) * rw + 1) * weightArbScale;

  // If rear tires are much wider than fronts, stiffen rear ARB to balance turn-in
  baseArbR *= Math.pow(stagger, 0.6);

  let arbF = 0, arbR = 0;
  if (car.discipline === 'drag') {
    arbF = clamp(18 * weightArbScale, 10, 30);
    arbR = clamp(62 * weightArbScale, 45, 65);
  } else if (car.discipline === 'drift') {
    // Drift: Firm front for rapid transitions, balanced rear scaled with power
    arbF = clamp(baseArbF * 1.08, 20, 60);
    arbR = clamp(baseArbR * (0.65 + hpFactor * 0.30), 12, 50);
  } else if (car.discipline === 'offroad') {
    // Offroad: Soft ARBs allow independent wheel travel over rocks and uneven terrain
    arbF = clamp(baseArbF * 0.35, 4, 24);
    arbR = clamp(baseArbR * 0.35, 4, 24);
  } else if (car.discipline === 'dirt') {
    arbF = clamp(baseArbF * 0.50, 8, 32);
    arbR = clamp(baseArbR * 0.50, 8, 32);
  } else {
    // Grip
    arbF = clamp(baseArbF, 12, 60);
    arbR = clamp(baseArbR, 12, 60);
  }

  // Handling Balance Bias roll stiffness redistribution:
  // bias > 0 (Oversteer): stiffens rear ARB, softens front ARB
  // bias < 0 (Understeer): stiffens front ARB, softens rear ARB
  const deltaArbF = -bias * 1.6;
  const deltaArbR = bias * 1.8;

  arbF = clamp(arbF + deltaArbF, 1, 65);
  arbR = clamp(arbR + deltaArbR, 1, 65);

  // 6. Damping: Damped according to corner mass and spring stiffness
  const frontCornerKg = frontMassKg / 2;
  const rearCornerKg = rearMassKg / 2;
  const massDampModF = clamp((frontCornerKg - 350) / 350 * 2.2, -2.5, 3.2);
  const massDampModR = clamp((rearCornerKg - 350) / 350 * 2.2, -2.5, 3.2);

  const bumpFactor = car.discipline === 'offroad' ? 0.38 : car.discipline === 'dirt' ? 0.46 : 0.58;

  let rebF_val = 10.0;
  let rebR_val = 10.0;
  let bmpF_val = 6.0;
  let bmpR_val = 6.0;

  if (car.discipline === 'drag') {
    rebF_val = 3.0;
    rebR_val = 19.0;
    bmpF_val = 16.0;
    bmpR_val = 3.5;
  } else if (car.discipline === 'drift') {
    rebF_val = clamp(10.8 + massDampModF + (springRatioF - 0.5) * 3.0, 6.0, 18.0);
    rebR_val = clamp(8.4 + massDampModR + (springRatioR - 0.5) * 2.5, 4.5, 15.0);
    bmpF_val = clamp(rebF_val * bumpFactor, 3.0, 12.0);
    bmpR_val = clamp(rebR_val * (bumpFactor * 0.9), 2.5, 10.0);
  } else if (car.discipline === 'offroad') {
    rebF_val = clamp(5.5 + massDampModF * 0.6 + (springRatioF - 0.5) * 2.0, 3.0, 10.0);
    rebR_val = clamp(5.5 + massDampModR * 0.6 + (springRatioR - 0.5) * 2.0, 3.0, 10.0);
    bmpF_val = clamp(rebF_val * bumpFactor, 1.5, 5.5);
    bmpR_val = clamp(rebR_val * bumpFactor, 1.5, 5.5);
  } else if (car.discipline === 'dirt') {
    rebF_val = clamp(7.2 + massDampModF * 0.8 + (springRatioF - 0.5) * 2.2, 4.0, 12.0);
    rebR_val = clamp(7.2 + massDampModR * 0.8 + (springRatioR - 0.5) * 2.2, 4.0, 12.0);
    bmpF_val = clamp(rebF_val * bumpFactor, 2.0, 7.0);
    bmpR_val = clamp(rebR_val * bumpFactor, 2.0, 7.0);
  } else {
    // Grip
    const catBase = car.category === 'track' ? 11.2 : car.category === 'supercar' ? 10.8 : 9.6;
    rebF_val = clamp(catBase + massDampModF + (springRatioF - 0.5) * 3.5, 5.0, 18.0);
    rebR_val = clamp(catBase + massDampModR + (springRatioR - 0.5) * 3.5, 5.0, 18.0);
    bmpF_val = clamp(rebF_val * bumpFactor, 2.5, 11.5);
    bmpR_val = clamp(rebR_val * bumpFactor, 2.5, 11.5);
  }

  // Handling bias effect on damping
  if (bias < 0) {
    rebF_val = clamp(rebF_val + Math.abs(bias) * 0.25, 3.0, 19.0);
  } else if (bias > 0) {
    rebR_val = clamp(rebR_val + bias * 0.20, 3.0, 19.0);
  }

  // 7. Ride Height
  const hFMin = car.heightFrontMin || 9.0;
  const hFMax = Math.max(hFMin + 0.1, car.heightFrontMax || 18.0);
  const hRMin = car.heightRearMin || 9.0;
  const hRMax = Math.max(hRMin + 0.1, car.heightRearMax || 18.0);

  let hRatioF = 0.15;
  let hRatioR = 0.15;

  if (car.discipline === 'offroad') {
    hRatioF = 0.95; hRatioR = 0.95;
  } else if (car.discipline === 'dirt') {
    hRatioF = 0.65; hRatioR = 0.65;
  } else if (car.discipline === 'drift') {
    hRatioF = 0.12;
    hRatioR = 0.18; // Slight rear rake for weight shift
  } else if (car.discipline === 'drag') {
    hRatioF = 0.05;
    hRatioR = 0.60;
  } else {
    hRatioF = car.category === 'track' ? 0.08 : 0.15;
    hRatioR = car.category === 'track' ? 0.12 : 0.18;
  }

  const hF = hFMin + (hFMax - hFMin) * hRatioF;
  const hR = hRMin + (hRMax - hRMin) * hRatioR;

  // 6. Differentials - Distinctly scaled by horsepower and drivetrain
  let dFAcc = 0, dFDec = 0, dRAcc = 0, dRDec = 0, dCenter = 'N/A';

  if (car.drivetrain === 'RWD') {
    if (car.discipline === 'drift') {
      dRAcc = 100;
      dRDec = clamp(85 + Math.round(hpFactor * 15), 85, 100);
    } else if (car.discipline === 'drag') {
      dRAcc = 100; dRDec = 100;
    } else if (car.discipline === 'dirt') {
      dRAcc = clamp(55 + Math.round(hpFactor * 30), 50, 90);
      dRDec = clamp(10 + Math.round(rw * 20), 8, 30);
    } else if (car.discipline === 'offroad') {
      dRAcc = 90; dRDec = 15;
    } else {
      // Grip RWD
      if (car.engineType === 'ev') {
        dRAcc = clamp(78 + Math.round(hpFactor * 16), 75, 96);
        dRDec = clamp(22 + Math.round(rw * 20), 15, 42);
      } else {
        dRAcc = clamp(42 + Math.round(hpFactor * 38), 35, 88);
        dRDec = clamp(14 + Math.round(rw * 26), 10, 42);
      }
    }
  } else if (car.drivetrain === 'AWD') {
    if (car.discipline === 'drift') {
      dFAcc = clamp(85 + Math.round(hpFactor * 15), 80, 100);
      dFDec = 0;
      dRAcc = 100;
      dRDec = clamp(85 + Math.round(hpFactor * 10), 80, 95);
      dCenter = `${clamp(Math.round(82 + hpFactor * 8), 80, 92)}% Rear`;
    } else if (car.discipline === 'drag') {
      dFAcc = 100; dFDec = 0; dRAcc = 100; dRDec = 0;
      dCenter = `${Math.round(72 + hpFactor * 12)}% Rear`;
    } else if (car.discipline === 'dirt') {
      dFAcc = clamp(45 + Math.round(hpFactor * 20), 40, 75);
      dFDec = 0;
      dRAcc = clamp(75 + Math.round(hpFactor * 20), 70, 95);
      dRDec = 8;
      dCenter = '64% Rear';
    } else if (car.discipline === 'offroad') {
      dFAcc = 90; dFDec = 0; dRAcc = 100; dRDec = 0; dCenter = '50% Balanced';
    } else {
      // Grip AWD
      if (car.engineType === 'ev') {
        dFAcc = clamp(50 + Math.round(hpFactor * 25), 45, 78);
        dFDec = 0;
        dRAcc = clamp(80 + Math.round(hpFactor * 16), 75, 96);
        dRDec = clamp(18 + Math.round(rw * 20), 12, 35);
        dCenter = `${clamp(Math.round(65 + (fw - 0.5) * 20), 55, 75)}% Rear`;
      } else {
        dFAcc = clamp(30 + Math.round(rw * 20 + hpFactor * 15), 25, 65);
        dFDec = 0;
        dRAcc = clamp(62 + Math.round(hpFactor * 28), 55, 92);
        dRDec = clamp(10 + Math.round(rw * 25), 8, 35);
        dCenter = `${clamp(Math.round(62 + (fw - 0.5) * 28 + (safeHp > 600 ? 5 : 0)), 55, 80)}% Rear`;
      }
    }
  } else if (car.drivetrain === 'FWD') {
    if (car.discipline === 'drag' || car.discipline === 'drift') {
      dFAcc = 100; dFDec = 0;
    } else {
      dFAcc = clamp(35 + Math.round(hpFactor * 35), 30, 75);
      dFDec = clamp(5 + Math.round((fw - 0.5) * 12), 2, 18);
    }
  }

  // 7. Brakes
  const brakeBalance = clamp(Math.round(50 + (fw - 0.5) * 10 + (car.category === 'track' ? 1 : 0)), 47, 55);
  const brakePressure = car.discipline === 'drift' ? 130 : car.category === 'track' ? 115 : 100;

  // 8. Transmission Ratios & Aerodynamic Drag Analysis
  let cdA = 0.72; // default sports coupe / JDM
  if (car.category === 'supercar') cdA = 0.62;
  else if (car.category === 'track') cdA = 0.82;
  else if (car.category === 'classic') cdA = 0.88;
  if (car.discipline === 'offroad') cdA = 1.25;
  else if (car.discipline === 'dirt') cdA = 0.95;

  // Additional aero drag from wing downforce setting
  if (aeroRMax > 50) {
    const aeroDragRatio = (aeroR - aeroRMin) / (aeroRMax - aeroRMin + 1);
    cdA += aeroDragRatio * 0.18;
  }

  // Aerodynamic terminal velocity estimation: P_wheel = 0.5 * rho * CdA * v^3
  const drivetrainEff = car.drivetrain === 'AWD' ? 0.82 : 0.85;
  const wheelPowerWatts = safeHp * 745.7 * drivetrainEff;
  const airDensity = 1.225; // kg/m^3 at sea level
  const vTerminalMs = Math.pow(wheelPowerWatts / (0.5 * airDensity * cdA), 1 / 3);
  const vTerminalKmh = Math.round(vTerminalMs * 3.6);
  // Practical limit allowing for tailwinds, slipstream, and downhill
  const practicalMaxKmh = Math.round(vTerminalKmh * 1.08);

  const rawTopSpeed = car.topSpeed > 0 ? car.topSpeed : (isImp ? 160 : 260);
  const topSpeedKm = clamp(isImp ? rawTopSpeed * 1.60934 : rawTopSpeed, 80, 520);

  let aeroDragNote: string | undefined;
  let effectiveTopSpeedKm = topSpeedKm;

  if (topSpeedKm > practicalMaxKmh + 20) {
    effectiveTopSpeedKm = practicalMaxKmh;
    const estDisplay = isImp ? `${Math.round(vTerminalKmh / 1.60934)} mph` : `${vTerminalKmh} km/h`;
    const targetDisplay = isImp ? `${Math.round(topSpeedKm / 1.60934)} mph` : `${Math.round(topSpeedKm)} km/h`;
    aeroDragNote = `Target speed (${targetDisplay}) exceeds ${safeHp} HP aerodynamic limit (~${estDisplay}). Gearing optimized for peak attainable speed.`;
  }

  const speedMs = (effectiveTopSpeedKm * 1000) / 3600;
  const wheelRpmAtTopSpeed = Math.max(10, (speedMs / Math.max(0.5, driveCircumferenceM)) * 60);

  const isEv = car.engineType === 'ev' || car.numGears === 1;
  const maxRedline = isEv ? 22000 : 14000;
  const defaultRedline = isEv ? 16000 : 7500;
  const safeRedline = clamp(car.redlineRpm || defaultRedline, 2000, maxRedline);

  // 1st Gear Launch Traction Optimization:
  // High HP RWD spins violently; lengthen 1st gear to allow tires to hook up
  const ptw = powerToWeightTon;
  let launchGripFactor = 1.0;
  if (car.drivetrain === 'RWD') {
    if (ptw > 320) {
      launchGripFactor = clamp(1.0 - (ptw - 320) * 0.00045, 0.78, 1.0);
    }
  } else if (car.drivetrain === 'FWD') {
    if (ptw > 250) {
      launchGripFactor = clamp(1.0 - (ptw - 250) * 0.00035, 0.82, 1.0);
    }
  } else if (car.drivetrain === 'AWD') {
    launchGripFactor = clamp(1.0 + (ptw > 350 ? 0.06 : 0), 1.0, 1.08);
  }

  // Wider rear tires increase traction threshold
  const widthLaunchBonus = clamp((widthR - 245) * 0.0006, -0.04, 0.06);
  launchGripFactor += widthLaunchBonus;

  let gTop = car.discipline === 'drag' ? 0.90 : car.discipline === 'drift' ? 0.82 : 0.74;
  let g1 = (car.discipline === 'drag' ? 2.65 : car.discipline === 'offroad' ? 3.90 : car.discipline === 'drift' ? 3.10 : 3.35) * launchGripFactor;

  // Powerband Shift-Drop Progression Exponent
  let curveExponent = 0.86;
  if (car.engineType === 'torque') {
    g1 *= 0.90;
    gTop *= 0.92;
    curveExponent = 0.78; // wider steps riding broad low-end torque
  } else if (car.engineType === 'highrev') {
    g1 *= 1.10;
    gTop *= 1.05;
    curveExponent = 0.94; // tight steps keeping engine above VTEC/crossover
  } else if (car.engineType === 'ev') {
    g1 = 2.40;
    gTop = 0.80;
    curveExponent = 0.86;
  }

  const numGears = clamp(Math.round(car.numGears || (isEv ? 1 : 6)), 1, 10);
  const gearRatios: number[] = [];
  let calculatedFD = 3.50;

  if (numGears === 1) {
    // Single-speed EV / direct drive transmission: ratio is 1.00, entire reduction handled by Final Drive
    gearRatios.push(1.00);
    calculatedFD = clamp(safeRedline / wheelRpmAtTopSpeed, 2.20, 12.50);
  } else if (numGears === 2) {
    if (isEv) {
      // 2-speed EV (e.g. Porsche Taycan: 1st gear launch reduction, 2nd gear direct drive)
      gearRatios.push(1.85);
      gearRatios.push(1.00);
      calculatedFD = clamp(safeRedline / (wheelRpmAtTopSpeed * 1.00), 2.20, 11.00);
    } else {
      gearRatios.push(Number((gTop * 1.82).toFixed(2)));
      gearRatios.push(Number(gTop.toFixed(2)));
      calculatedFD = clamp(safeRedline / (wheelRpmAtTopSpeed * gTop), 2.20, 5.80);
    }
  } else {
    for (let i = 1; i <= numGears; i++) {
      const t = (i - 1) / (numGears - 1);
      const ratio = Number((g1 * Math.pow(gTop / g1, Math.pow(t, curveExponent))).toFixed(2));
      gearRatios.push(ratio);
    }
    calculatedFD = clamp(safeRedline / (wheelRpmAtTopSpeed * gTop), 2.20, 6.20);
  }

  const estSpeedDisplay = isImp
    ? `${Math.round(vTerminalKmh / 1.60934)} mph`
    : `${vTerminalKmh} km/h`;

  return {
    tireFront: isImp ? `${(coldBarF * 14.5038).toFixed(1)} PSI` : `${coldBarF.toFixed(2)} bar`,
    tireRear: isImp ? `${(coldBarR * 14.5038).toFixed(1)} PSI` : `${coldBarR.toFixed(2)} bar`,
    tireFrontCold: isImp ? `${(coldBarF * 14.5038).toFixed(1)} PSI` : `${coldBarF.toFixed(2)} bar`,
    tireFrontHot: isImp ? `${(targetHotBarF * 14.5038).toFixed(1)} PSI` : `${targetHotBarF.toFixed(2)} bar`,
    tireRearCold: isImp ? `${(coldBarR * 14.5038).toFixed(1)} PSI` : `${coldBarR.toFixed(2)} bar`,
    tireRearHot: isImp ? `${(targetHotBarR * 14.5038).toFixed(1)} PSI` : `${targetHotBarR.toFixed(2)} bar`,
    handlingBiasNote: bias === 0 ? '0 (Neutral Balance)' : bias > 0 ? `+${bias} (Agile Rotation)` : `${bias} (Stable Understeer)`,
    camberFront: `${cF.toFixed(1)}°`,
    camberRear: `${cR.toFixed(1)}°`,
    toeFront: formatToe(toeF),
    toeRear: formatToe(toeR),
    caster: `${caster.toFixed(1)}°`,
    arbFront: arbF.toFixed(1),
    arbRear: arbR.toFixed(1),
    springFront: isImp ? `${spF.toFixed(1)} lb/in` : `${spF.toFixed(1)} kgf/mm`,
    springRear: isImp ? `${spR.toFixed(1)} lb/in` : `${spR.toFixed(1)} kgf/mm`,
    heightFront: isImp ? `${hF.toFixed(1)} in` : `${hF.toFixed(1)} cm`,
    heightRear: isImp ? `${hR.toFixed(1)} in` : `${hR.toFixed(1)} cm`,
    rebFront: rebF_val.toFixed(1),
    rebRear: rebR_val.toFixed(1),
    bmpFront: bmpF_val.toFixed(1),
    bmpRear: bmpR_val.toFixed(1),
    aeroFront: isImp ? `${Math.round(aeroF)} lbf` : `${Math.round(aeroF)} kgf`,
    aeroRear: isImp ? `${Math.round(aeroR)} lbf` : `${Math.round(aeroR)} kgf`,
    brakeBalance: `${brakeBalance}% (Front)`,
    brakePressure: `${brakePressure}%`,
    diffFront: car.drivetrain !== 'RWD' ? `${dFAcc}% / ${dFDec}%` : undefined,
    diffRear: car.drivetrain !== 'FWD' ? `${dRAcc}% / ${dRDec}%` : undefined,
    diffCenter: car.drivetrain === 'AWD' ? dCenter : undefined,
    finalDrive: calculatedFD.toFixed(2),
    gearRatios,
    driveCircumferenceM,
    redlineRpm: safeRedline,
    targetSpeedDisplay: rawTopSpeed,
    estimatedTopSpeed: estSpeedDisplay,
    estimatedTopSpeedKm: vTerminalKmh,
    aeroDragNote,
  };
}