import { TuneDoctorOffsets, VehicleInputs } from '../types/tuning';
import { clamp } from './tiresAndAlignment';

export interface SuspensionAndAeroResult {
  aeroF: number;
  aeroR: number;
  aeroFMin: number;
  aeroFMax: number;
  aeroRMin: number;
  aeroRMax: number;
  aeroRangeF: number;
  aeroRangeR: number;
  spF: number;
  spR: number;
  spFMin: number;
  rangeSpF: number;
  spRMin: number;
  rangeSpR: number;
  arbF: number;
  arbR: number;
  rebF_val: number;
  rebR_val: number;
  bmpF_val: number;
  bmpR_val: number;
  hF: number;
  hR: number;
  hFMin: number;
  hFMax: number;
  hRMin: number;
  hRMax: number;
}

export function calculateSuspensionAndAero(
  car: VehicleInputs,
  weightKg: number,
  frontMassKg: number,
  rearMassKg: number,
  fw: number,
  rw: number,
  hpFactor: number,
  stagger: number,
  compoundGrip: number,
  bias: number,
  doc: TuneDoctorOffsets
): SuspensionAndAeroResult {
  // 4. Aero Downforce (Calculated before springs to allow dynamic aero compensation)
  const aeroFMin = car.aeroFrontMin || 0;
  const aeroFMax = Math.max(aeroFMin, car.aeroFrontMax || 150);
  const aeroRMin = car.aeroRearMin || 0;
  const aeroRMax = Math.max(aeroRMin, car.aeroRearMax || 250);

  let aeroRatioF = 0;
  let aeroRatioR = 0;

  if (car.discipline === 'offroad' || car.discipline === 'dirt') {
    aeroRatioF = 0.35;
    aeroRatioR = 0.40;
  } else if (car.discipline === 'drift') {
    aeroRatioF = clamp(0.20 + hpFactor * 0.25, 0.15, 0.60);
    aeroRatioR = clamp(0.25 + hpFactor * 0.30, 0.20, 0.70);
  } else if (car.discipline === 'drag') {
    aeroRatioF = 0;
    aeroRatioR = 0;
  } else {
    // Grip
    const baseGrip =
      car.category === 'track' ? 0.85 : car.category === 'offroad' ? 0.35 : 0.60;
    aeroRatioF = clamp(baseGrip * (fw / 0.5), 0.15, 0.95);
    aeroRatioR = clamp(baseGrip * (rw / 0.5) * 1.08, 0.15, 0.95);
  }

  if (doc.aeroFrontRatioDelta) {
    aeroRatioF = clamp(aeroRatioF + doc.aeroFrontRatioDelta, 0, 1);
  }

  const aeroF = aeroFMin + (aeroFMax - aeroFMin) * aeroRatioF;
  const aeroR = aeroRMin + (aeroRMax - aeroRMin) * aeroRatioR;

  // 5. Springs with Dynamic Aero Downforce Compensation
  const spFMin = car.springFrontMin || 35;
  const spFMax = Math.max(spFMin + 1, car.springFrontMax || 210);
  const spRMin = car.springRearMin || 35;
  const spRMax = Math.max(spRMin + 1, car.springRearMax || 210);

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
    // Drag: Soft front promotes weight transfer / nose lift; mid rear prevents bottoming
    springRatioF = 0.25;
    springRatioR = 0.45;
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

  // Anti-Roll Bars (ARBs): Scale with total vehicle weight, drivetrain, tire stagger, and bias
  const weightArbScale = clamp(weightKg / 1380, 0.70, 1.45);
  const baseArbF = ((65 - 1) * fw + 1) * weightArbScale;
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
    // Grip: drivetrain-aware ARB balance (softer front / stiffer rear for AWD & FWD rotation)
    if (car.drivetrain === 'AWD') {
      arbF = clamp(baseArbF * 0.78, 8, 52);
      arbR = clamp(baseArbR * 1.18, 16, 62);
      if (arbF >= arbR) {
        arbR = clamp(arbF + 3.0, 1, 65);
      }
    } else if (car.drivetrain === 'FWD') {
      arbF = clamp(baseArbF * 0.72, 8, 48);
      arbR = clamp(baseArbR * 1.25, 18, 63);
      if (arbF >= arbR) {
        arbR = clamp(arbF + 3.0, 1, 65);
      }
    } else {
      arbF = clamp(baseArbF * 0.96, 12, 58);
      arbR = clamp(baseArbR * 0.94, 12, 58);
    }
  }

  // Handling Balance Bias roll stiffness redistribution:
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
    rebR_val = 16.0;
    bmpF_val = 14.0;
    bmpR_val = 4.0;
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
    const catBase =
      car.category === 'track'
        ? 11.2
        : car.category === 'supercar'
        ? 10.8
        : car.category === 'offroad'
        ? 7.5
        : 9.6;
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

  // Tune Doctor Bump Damping Offsets
  if (doc.bumpDeltaF) {
    bmpF_val = clamp(bmpF_val + doc.bumpDeltaF, 1.0, 20.0);
  }
  if (doc.bumpDeltaR) {
    bmpR_val = clamp(bmpR_val + doc.bumpDeltaR, 1.0, 20.0);
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
    // Drag: higher front gives nose-lift clearance and rear squat preload
    hRatioF = 0.70;
    hRatioR = 0.35;
  } else {
    hRatioF = car.category === 'track' ? 0.08 : car.category === 'offroad' ? 0.55 : 0.15;
    hRatioR = car.category === 'track' ? 0.12 : car.category === 'offroad' ? 0.55 : 0.18;
  }

  if (doc.heightRatioDelta) {
    hRatioF = clamp(hRatioF + doc.heightRatioDelta, 0, 1);
    hRatioR = clamp(hRatioR + doc.heightRatioDelta, 0, 1);
  }

  const hF = hFMin + (hFMax - hFMin) * hRatioF;
  const hR = hRMin + (hRMax - hRMin) * hRatioR;

  return {
    aeroF,
    aeroR,
    aeroFMin,
    aeroFMax,
    aeroRMin,
    aeroRMax,
    aeroRangeF,
    aeroRangeR,
    spF,
    spR,
    spFMin,
    rangeSpF,
    spRMin,
    rangeSpR,
    arbF,
    arbR,
    rebF_val,
    rebR_val,
    bmpF_val,
    bmpR_val,
    hF,
    hR,
    hFMin,
    hFMax,
    hRMin,
    hRMax,
  };
}
