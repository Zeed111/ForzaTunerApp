import { TuneDoctorOffsets, VehicleInputs } from '../types/tuning';
import { clamp } from './tiresAndAlignment';

export interface DrivetrainAndGearingResult {
  dFAcc: number;
  dFDec: number;
  dRAcc: number;
  dRDec: number;
  dCenter: string;
  dCenterPct: number;
  brakeBalance: number;
  brakePressure: number;
  calculatedFD: number;
  gearRatios: number[];
  gearMaxSpeeds: number[];
  shiftDropRpms: number[];
  safeRedline: number;
  rawTopSpeed: number;
  estSpeedDisplay: string;
  vTerminalKmh: number;
  aeroDragNote?: string;
}

export function calculateDrivetrainAndGearing(
  car: VehicleInputs,
  isImp: boolean,
  fw: number,
  rw: number,
  safeHp: number,
  hpFactor: number,
  powerToWeightTon: number,
  widthR: number,
  driveCircumferenceM: number,
  aeroR: number,
  aeroRMin: number,
  aeroRMax: number,
  doc: TuneDoctorOffsets
): DrivetrainAndGearingResult {
  // 6. Differentials - Distinctly scaled by horsepower and drivetrain
  let dFAcc = 0, dFDec = 0, dRAcc = 0, dRDec = 0, dCenter = 'N/A';
  let dCenterPct = 65;

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
      dCenterPct = clamp(Math.round(82 + hpFactor * 8), 80, 92);
      dCenter = `${dCenterPct}% Rear`;
    } else if (car.discipline === 'drag') {
      dFAcc = 100; dFDec = 0; dRAcc = 100; dRDec = 0;
      dCenterPct = Math.round(72 + hpFactor * 12);
      dCenter = `${dCenterPct}% Rear`;
    } else if (car.discipline === 'dirt') {
      dFAcc = clamp(45 + Math.round(hpFactor * 20), 40, 75);
      dFDec = 0;
      dRAcc = clamp(75 + Math.round(hpFactor * 20), 70, 95);
      dRDec = 8;
      dCenterPct = 64;
      dCenter = '64% Rear';
    } else if (car.discipline === 'offroad') {
      dFAcc = 90; dFDec = 0; dRAcc = 100; dRDec = 0;
      dCenterPct = 50;
      dCenter = '50% Balanced';
    } else {
      // Grip AWD
      if (car.engineType === 'ev') {
        dFAcc = clamp(50 + Math.round(hpFactor * 25), 45, 78);
        dFDec = 0;
        dRAcc = clamp(80 + Math.round(hpFactor * 16), 75, 96);
        dRDec = clamp(18 + Math.round(rw * 20), 12, 35);
        dCenterPct = clamp(Math.round(65 + (fw - 0.5) * 20), 55, 75);
        dCenter = `${dCenterPct}% Rear`;
      } else {
        dFAcc = clamp(30 + Math.round(rw * 20 + hpFactor * 15), 25, 65);
        dFDec = 0;
        dRAcc = clamp(62 + Math.round(hpFactor * 28), 55, 92);
        dRDec = clamp(10 + Math.round(rw * 25), 8, 35);
        dCenterPct = clamp(Math.round(62 + (fw - 0.5) * 28 + (safeHp > 600 ? 5 : 0)), 55, 80);
        dCenter = `${dCenterPct}% Rear`;
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

  if (car.drivetrain !== 'FWD' && doc.diffRearAccDelta) {
    dRAcc = clamp(dRAcc + doc.diffRearAccDelta, 5, 100);
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
    curveExponent = 0.78;
  } else if (car.engineType === 'highrev') {
    g1 *= 1.10;
    gTop *= 1.05;
    curveExponent = 0.94;
  } else if (car.engineType === 'ev') {
    g1 = 2.40;
    gTop = 0.80;
    curveExponent = 0.86;
  }

  const numGears = clamp(Math.round(car.numGears || (isEv ? 1 : 6)), 1, 10);
  const gearRatios: number[] = [];
  let calculatedFD = 3.50;

  if (numGears === 1) {
    gearRatios.push(1.00);
    calculatedFD = clamp(safeRedline / wheelRpmAtTopSpeed, 2.20, 12.50);
  } else if (numGears === 2) {
    if (isEv) {
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

  if (doc.finalDriveDelta) {
    calculatedFD = clamp(calculatedFD + doc.finalDriveDelta, 2.20, numGears === 1 ? 12.50 : 6.20);
  }

  const estSpeedDisplay = isImp
    ? `${Math.round(vTerminalKmh / 1.60934)} mph`
    : `${vTerminalKmh} km/h`;

  const roundedFD = Number(calculatedFD.toFixed(2));
  const gearMaxSpeeds = gearRatios.map(ratio => {
    const maxSpeedKmh = ((safeRedline / Math.max(0.1, ratio * roundedFD)) * driveCircumferenceM * 60) / 1000;
    return Math.round(isImp ? maxSpeedKmh / 1.60934 : maxSpeedKmh);
  });

  const shiftDropRpms = gearRatios.map((ratio, idx) => {
    if (idx === 0) return 0;
    return Math.round(safeRedline * (ratio / Math.max(0.1, gearRatios[idx - 1])));
  });

  return {
    dFAcc,
    dFDec,
    dRAcc,
    dRDec,
    dCenter,
    dCenterPct,
    brakeBalance,
    brakePressure,
    calculatedFD,
    gearRatios,
    gearMaxSpeeds,
    shiftDropRpms,
    safeRedline,
    rawTopSpeed,
    estSpeedDisplay,
    vTerminalKmh,
    aeroDragNote,
  };
}
