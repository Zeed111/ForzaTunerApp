export type UnitSystem = 'metric' | 'imperial';
export type CarCategory = 'jdm' | 'track' | 'classic' | 'supercar';
export type Discipline = 'drift' | 'grip' | 'dirt' | 'offroad' | 'drag';
export type Drivetrain = 'RWD' | 'AWD' | 'FWD';
export type EngineType = 'balanced' | 'highrev' | 'torque';

export interface VehicleInputs {
  units: UnitSystem;
  category: CarCategory;
  discipline: Discipline;
  drivetrain: Drivetrain;
  hp: number;
  weight: number; // kg or lbs based on units
  frontWeightPct: number;
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
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function calculateTune(car: VehicleInputs): TuneResult {
  const isImp = car.units === 'imperial';
  const weightKg = isImp ? car.weight / 2.20462 : car.weight;
  const fw = clamp(car.frontWeightPct / 100, 0.3, 0.75);
  const rw = 1 - fw;

  // 1. Tire Kinematics
  const tireDiameterMF = (2 * (car.tWidthF * (car.tProfileF / 100)) + car.tRimF * 25.4) / 1000;
  const tireCircumferenceMF = Math.PI * tireDiameterMF;
  const tireDiameterMR = (2 * (car.tWidthR * (car.tProfileR / 100)) + car.tRimR * 25.4) / 1000;
  const tireCircumferenceMR = Math.PI * tireDiameterMR;

  let driveCircumferenceM = tireCircumferenceMR;
  if (car.drivetrain === 'FWD') driveCircumferenceM = tireCircumferenceMF;
  else if (car.drivetrain === 'AWD') driveCircumferenceM = tireCircumferenceMF * 0.4 + tireCircumferenceMR * 0.6;

  // 2. Tire Pressures (in bar)
  const massBarMod = clamp((weightKg - 1350) * 0.00025, -0.25, 0.35);
  let baseBarF = 2.0;
  let baseBarR = 2.0;

  if (car.discipline === 'drift') {
    baseBarF = 2.3 + massBarMod * 0.5;
    baseBarR = 1.65 + massBarMod * 0.5;
  } else if (car.discipline === 'grip') {
    baseBarF = 1.95 + massBarMod + (fw - 0.5) * 0.2;
    baseBarR = 1.95 + massBarMod + (rw - 0.5) * 0.2;
  } else if (car.discipline === 'dirt') {
    baseBarF = 1.65 + massBarMod * 0.7;
    baseBarR = 1.65 + massBarMod * 0.7;
  } else if (car.discipline === 'offroad') {
    baseBarF = 1.45 + massBarMod * 0.5;
    baseBarR = 1.45 + massBarMod * 0.5;
  } else if (car.discipline === 'drag') {
    baseBarF = 3.6;
    baseBarR = 1.0;
  }

  // 3. Alignment
  let cF = 0, cR = 0, toeF = 0, toeR = 0, caster = 6.0;
  if (car.discipline === 'drift') {
    cF = -4.5 - (fw - 0.5) * 1.5;
    cR = -0.5 + (rw - 0.5) * 0.5;
    toeF = 0.8;
    toeR = 0.0;
    caster = 7.0;
  } else if (car.discipline === 'drag') {
    cF = 0.0; cR = 0.0; toeF = 0.0; toeR = 0.0; caster = 7.0;
  } else if (car.discipline === 'offroad') {
    cF = -0.6 - (fw - 0.5) * 0.5;
    cR = -0.4 - (rw - 0.5) * 0.4;
    caster = 7.0;
  } else if (car.discipline === 'dirt') {
    cF = -1.2 - (fw - 0.5) * 0.8;
    cR = -0.8 - (rw - 0.5) * 0.6;
    toeF = 0.1;
    caster = 6.5;
  } else {
    let baseCamberF = -1.8, baseCamberR = -1.2;
    if (car.category === 'track') { baseCamberF = -2.4; baseCamberR = -1.6; caster = 6.8; }
    else if (car.category === 'jdm') { baseCamberF = -2.0; baseCamberR = -1.3; caster = 6.3; }
    else if (car.category === 'classic') { baseCamberF = -1.4; baseCamberR = -0.8; caster = 5.6; }
    else if (car.category === 'supercar') { baseCamberF = -2.1; baseCamberR = -1.7; caster = 6.5; }

    cF = baseCamberF - (fw - 0.5) * 1.2;
    cR = baseCamberR - (rw - 0.5) * 1.0;
    toeF = car.category === 'track' ? 0.1 : 0.0;
    toeR = fw < 0.48 || car.category === 'supercar' ? 0.15 : fw > 0.56 ? -0.05 : 0.0;
  }

  // 4. Springs, ARBs & Damping
  let spF = 0, spR = 0;
  let arbFront = '0', arbRear = '0';
  let rebFront = '0', rebRear = '0';
  let bmpFront = '0', bmpRear = '0';
  let hF = 0, hR = 0;
  const bumpFactor = car.discipline === 'offroad' ? 0.45 : car.discipline === 'dirt' ? 0.5 : 0.58;

  if (car.discipline === 'drag') {
    spF = car.springFrontMin + (car.springFrontMax - car.springFrontMin) * 0.85;
    spR = car.springRearMin + (car.springRearMax - car.springRearMin) * 0.15;
    arbFront = '25.0'; arbRear = '65.0';
    rebFront = '3.0'; rebRear = '19.0';
    bmpFront = '16.0'; bmpRear = '3.5';
    hF = car.heightFrontMin;
    hR = car.heightRearMin + (car.heightRearMax - car.heightRearMin) * 0.6;
  } else {
    spF = car.springFrontMin + (car.springFrontMax - car.springFrontMin) * fw;
    spR = car.springRearMin + (car.springRearMax - car.springRearMin) * rw;

    let arbScaleF = (65 - 1) * fw + 1;
    let arbScaleR = (65 - 1) * rw + 1;
    if (car.discipline === 'drift') {
      arbScaleF = clamp(arbScaleF * 1.1, 1, 65);
      arbScaleR = clamp(arbScaleR * 0.65, 1, 65);
    }
    arbFront = arbScaleF.toFixed(1);
    arbRear = arbScaleR.toFixed(1);

    const fSpringNorm = (spF - car.springFrontMin) / Math.max(1, car.springFrontMax - car.springFrontMin);
    const rSpringNorm = (spR - car.springRearMin) / Math.max(1, car.springRearMax - car.springRearMin);

    const rF_val = clamp(3.5 + 13.5 * fSpringNorm, 2.0, 19.0);
    const rR_val = clamp(3.5 + 13.5 * rSpringNorm, 2.0, 19.0);

    rebFront = rF_val.toFixed(1);
    rebRear = rR_val.toFixed(1);
    bmpFront = (rF_val * bumpFactor).toFixed(1);
    bmpRear = (rR_val * bumpFactor).toFixed(1);

    const hRatio = car.discipline === 'offroad' ? 1.0 : car.discipline === 'dirt' ? 0.7 : car.discipline === 'drift' ? 0.15 : 0.1;
    hF = car.heightFrontMin + (car.heightFrontMax - car.heightFrontMin) * hRatio;
    hR = car.heightRearMin + (car.heightRearMax - car.heightRearMin) * hRatio;
  }

  // 5. Aero Downforce
  let aeroF = car.aeroFrontMin;
  let aeroR = car.aeroRearMin;
  if (car.discipline === 'offroad' || car.discipline === 'dirt') {
    aeroF = car.aeroFrontMin + (car.aeroFrontMax - car.aeroFrontMin) * 0.4;
    aeroR = car.aeroRearMin + (car.aeroRearMax - car.aeroRearMin) * 0.45;
  } else if (car.discipline === 'grip') {
    const baseGrip = car.category === 'track' ? 0.85 : 0.6;
    aeroF = car.aeroFrontMin + (car.aeroFrontMax - car.aeroFrontMin) * clamp(baseGrip * (fw / 0.5), 0.15, 0.95);
    aeroR = car.aeroRearMin + (car.aeroRearMax - car.aeroRearMin) * clamp(baseGrip * (rw / 0.5) * 1.08, 0.15, 0.95);
  }

  // 6. Differentials
  let dFAcc = 0, dFDec = 0, dRAcc = 0, dRDec = 0, dCenter = 'N/A';
  const hpFactor = clamp((car.hp - 300) / 700, 0, 1);

  if (car.drivetrain === 'RWD') {
    if (car.discipline === 'drift' || car.discipline === 'drag') {
      dRAcc = 100; dRDec = 100;
    } else if (car.discipline === 'dirt') {
      dRAcc = Math.round(60 + hpFactor * 25);
      dRDec = Math.round(10 + rw * 15);
    } else if (car.discipline === 'offroad') {
      dRAcc = 90; dRDec = 15;
    } else {
      dRAcc = Math.round(45 + hpFactor * 35);
      dRDec = Math.round(15 + rw * 30);
    }
  } else if (car.drivetrain === 'AWD') {
    if (car.discipline === 'drift') {
      dFAcc = 95; dFDec = 0; dRAcc = 100; dRDec = 90; dCenter = '85% Rear';
    } else if (car.discipline === 'drag') {
      dFAcc = 100; dFDec = 0; dRAcc = 100; dRDec = 0; dCenter = `${Math.round(75 + hpFactor * 10)}% Rear`;
    } else if (car.discipline === 'dirt') {
      dFAcc = 50; dFDec = 0; dRAcc = 85; dRDec = 5; dCenter = '62% Rear';
    } else if (car.discipline === 'offroad') {
      dFAcc = 90; dFDec = 0; dRAcc = 100; dRDec = 0; dCenter = '50% Balanced';
    } else {
      dFAcc = Math.round(35 + rw * 20 + hpFactor * 10);
      dFDec = 0;
      dRAcc = Math.round(65 + hpFactor * 25);
      dRDec = Math.round(10 + rw * 25);
      dCenter = `${Math.round(clamp(62 + (fw - 0.5) * 30, 55, 78))}% Rear`;
    }
  } else if (car.drivetrain === 'FWD') {
    dFAcc = car.discipline === 'drag' || car.discipline === 'drift' ? 100 : Math.round(35 + hpFactor * 30);
    dFDec = Math.round(5 + (fw - 0.5) * 10);
  }

  // 7. Brakes
  const brakeBalance = Math.round(clamp(50 + (fw - 0.5) * 8, 48, 54));
  const brakePressure = car.discipline === 'drift' ? 130 : car.category === 'track' ? 115 : 100;

  // 8. Transmission Ratios
  const topSpeedKm = isImp ? car.topSpeed * 1.60934 : car.topSpeed;
  const speedMs = (topSpeedKm * 1000) / 3600;
  const wheelRpmAtTopSpeed = (speedMs / driveCircumferenceM) * 60;

  let gTop = car.discipline === 'drag' ? 0.9 : car.discipline === 'drift' ? 0.82 : 0.74;
  let g1 = car.discipline === 'drag' ? 2.65 : car.discipline === 'offroad' ? 3.85 : car.discipline === 'drift' ? 3.1 : 3.35;
  if (car.engineType === 'torque') { g1 *= 0.9; gTop *= 0.92; }
  if (car.engineType === 'highrev') { g1 *= 1.1; gTop *= 1.05; }

  const calculatedFD = clamp(car.redlineRpm / (wheelRpmAtTopSpeed * gTop), 2.2, 5.8);
  const gearRatios: number[] = [];

  if (car.numGears === 1) {
    gearRatios.push(1.0);
  } else if (car.numGears === 2) {
    gearRatios.push(Number((gTop * 1.82).toFixed(2)));
    gearRatios.push(Number(gTop.toFixed(2)));
  } else {
    for (let i = 1; i <= car.numGears; i++) {
      const t = (i - 1) / (car.numGears - 1);
      const ratio = Number((g1 * Math.pow(gTop / g1, Math.pow(t, 0.86))).toFixed(2));
      gearRatios.push(ratio);
    }
  }

  return {
    tireFront: isImp ? `${(baseBarF * 14.5038).toFixed(1)} PSI` : `${baseBarF.toFixed(2)} bar`,
    tireRear: isImp ? `${(baseBarR * 14.5038).toFixed(1)} PSI` : `${baseBarR.toFixed(2)} bar`,
    camberFront: `${cF.toFixed(1)}°`,
    camberRear: `${cR.toFixed(1)}°`,
    toeFront: `${toeF > 0 ? '+' : ''}${toeF.toFixed(2)}° ${toeF > 0 ? '(Out)' : toeF < 0 ? '(In)' : ''}`,
    toeRear: `${toeR > 0 ? '+' : ''}${toeR.toFixed(2)}° ${toeR > 0 ? '(In)' : toeR < 0 ? '(Out)' : ''}`,
    caster: `${caster.toFixed(1)}°`,
    arbFront,
    arbRear,
    springFront: isImp ? `${spF.toFixed(1)} lb/in` : `${spF.toFixed(1)} kgf/mm`,
    springRear: isImp ? `${spR.toFixed(1)} lb/in` : `${spR.toFixed(1)} kgf/mm`,
    heightFront: isImp ? `${hF.toFixed(1)} in` : `${hF.toFixed(1)} cm`,
    heightRear: isImp ? `${hR.toFixed(1)} in` : `${hR.toFixed(1)} cm`,
    rebFront,
    rebRear,
    bmpFront,
    bmpRear,
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
    redlineRpm: car.redlineRpm,
    targetSpeedDisplay: car.topSpeed,
  };
}