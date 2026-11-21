import { TireCompound, TuneDoctorOffsets, VehicleInputs } from '../types/tuning';

export function clamp(val: number, min: number, max: number): number {
  if (isNaN(val)) return min;
  return Math.min(Math.max(val, min), max);
}

export function formatToe(val: number): string {
  const stepped = Math.round(val * 10) / 10;
  if (Math.abs(stepped) < 0.05) return '0.0°';
  if (stepped < 0) {
    return `${Math.abs(stepped).toFixed(1)}° Out`;
  }
  return `${stepped.toFixed(1)}° In`;
}

export interface TiresAndAlignmentResult {
  driveCircumferenceM: number;
  stagger: number;
  widthR: number;
  compoundGrip: number;
  bias: number;
  targetHotBarF: number;
  targetHotBarR: number;
  coldBarF: number;
  coldBarR: number;
  cF: number;
  cR: number;
  toeF: number;
  toeR: number;
  caster: number;
}

export function calculateTiresAndAlignment(
  car: VehicleInputs,
  weightKg: number,
  frontMassKg: number,
  rearMassKg: number,
  fw: number,
  rw: number,
  safeHp: number,
  powerToWeightTon: number,
  doc: TuneDoctorOffsets
): TiresAndAlignmentResult {
  // 1. Tire Kinematics & Stagger
  const widthF = clamp(car.tWidthF || 245, 125, 455);
  const profileF = clamp(car.tProfileF || 40, 15, 85);
  const rimF = clamp(car.tRimF || 18, 12, 26);

  const widthR = clamp(car.tWidthR || 275, 125, 455);
  const profileR = clamp(car.tProfileR || 35, 15, 85);
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

  targetHotBarF = clamp(targetHotBarF + (doc.tireBarDeltaF || 0), 1.15, 3.80);
  targetHotBarR = clamp(targetHotBarR + (doc.tireBarDeltaR || 0), 1.15, 3.80);

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
    cF = clamp(-4.4 - (fw - 0.5) * 1.4 - profileModF - massRollMod * 0.5, -5.0, -3.5);
    cR = clamp(-0.4 - (rw - 0.5) * 0.8 - (powerToWeightTon > 380 ? 0.2 : 0), -1.2, -0.2);
    // In Forza: Negative is Toe-Out (sharp turn-in and angle hold)
    toeF = clamp(-0.5 - (fw - 0.5) * 0.8 - (safeHp > 600 ? 0.2 : 0), -1.2, -0.3);
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
    toeF = -0.1; // slight Toe-Out
    toeR = 0.1;  // slight Toe-In for high-speed stability
    caster = 6.5;
  } else {
    // Grip / Track / Sports / JDM / Classic / Supercar / Offroad
    let baseCamberF = -1.9, baseCamberR = -1.3, baseCaster = 6.3;
    if (car.category === 'track') { baseCamberF = -2.4; baseCamberR = -1.7; baseCaster = 6.7; }
    else if (car.category === 'jdm') { baseCamberF = -2.0; baseCamberR = -1.4; baseCaster = 6.3; }
    else if (car.category === 'sports') { baseCamberF = -1.9; baseCamberR = -1.3; baseCaster = 6.3; }
    else if (car.category === 'classic') { baseCamberF = -1.5; baseCamberR = -0.9; baseCaster = 5.7; }
    else if (car.category === 'supercar') { baseCamberF = -2.2; baseCamberR = -1.8; baseCaster = 6.5; }
    else if (car.category === 'offroad') { baseCamberF = -1.0; baseCamberR = -0.6; baseCaster = 6.5; }

    cF = clamp(baseCamberF - (fw - 0.5) * 1.4 - profileModF - massRollMod, -3.2, -0.8);
    cR = clamp(baseCamberR - (rw - 0.5) * 1.1 - profileModR - massRollMod, -2.5, -0.4);
    toeF = car.category === 'track' ? -0.1 : 0.0;
    toeR = fw < 0.48 || car.category === 'supercar' ? 0.2 : (fw > 0.56 ? 0.0 : 0.1);
    caster = clamp(baseCaster + (fw - 0.5) * 0.8, 5.2, 7.0);
  }

  // Handling bias effect on Alignment & Turn-in:
  if (bias > 0) {
    // Agile / Oversteer: slight extra front toe-out for immediate bite, slight extra negative camber
    toeF = clamp(toeF - bias * 0.02, -1.2, 0.2);
    cF = clamp(cF - bias * 0.05, -5.0, -0.5);
  } else if (bias < 0) {
    // Stable / Understeer: slight extra rear camber for planted traction
    cR = clamp(cR + bias * 0.04, -3.0, -0.2);
  }

  // Tune Doctor Alignment Offsets
  if (doc.camberDegDeltaF) {
    cF = clamp(cF + doc.camberDegDeltaF, -5.0, -0.2);
  }
  if (doc.toeDegDeltaF) {
    toeF = clamp(toeF + doc.toeDegDeltaF, -1.2, 0.5);
  }
  if (doc.casterDegDelta) {
    caster = clamp(caster + doc.casterDegDelta, 4.5, 7.0);
  }

  // Snap Toe to Forza's 0.1 deg slider step
  toeF = Math.round(toeF * 10) / 10;
  toeR = Math.round(toeR * 10) / 10;
  if (Object.is(toeF, -0)) toeF = 0;
  if (Object.is(toeR, -0)) toeR = 0;

  return {
    driveCircumferenceM,
    stagger,
    widthR,
    compoundGrip,
    bias,
    targetHotBarF,
    targetHotBarR,
    coldBarF,
    coldBarR,
    cF,
    cR,
    toeF,
    toeR,
    caster,
  };
}
