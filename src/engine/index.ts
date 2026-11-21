import { TuneRawMetrics, TuneResult, VehicleInputs } from '../types/tuning';
import { clamp, formatToe, calculateTiresAndAlignment } from './tiresAndAlignment';
import { calculateSuspensionAndAero } from './suspensionAndAero';
import { calculateDrivetrainAndGearing } from './drivetrainAndGearing';

export * from '../types/tuning';

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
  const doc = car.doctorOffsets || {};

  const tiresAlign = calculateTiresAndAlignment(
    car,
    weightKg,
    frontMassKg,
    rearMassKg,
    fw,
    rw,
    safeHp,
    powerToWeightTon,
    doc
  );

  const suspAero = calculateSuspensionAndAero(
    car,
    weightKg,
    frontMassKg,
    rearMassKg,
    fw,
    rw,
    hpFactor,
    tiresAlign.stagger,
    tiresAlign.compoundGrip,
    tiresAlign.bias,
    doc
  );

  const driveGearing = calculateDrivetrainAndGearing(
    car,
    isImp,
    weightKg,
    fw,
    rw,
    safeHp,
    hpFactor,
    powerToWeightTon,
    tiresAlign.widthR,
    tiresAlign.driveCircumferenceM,
    suspAero.aeroR,
    suspAero.aeroRMin,
    suspAero.aeroRMax,
    doc
  );

  const raw: TuneRawMetrics = {
    tireFrontRatio: clamp((tiresAlign.coldBarF - 1.0) / 2.8, 0, 1),
    tireRearRatio: clamp((tiresAlign.coldBarR - 1.0) / 2.8, 0, 1),
    camberFrontRatio: clamp(Math.abs(tiresAlign.cF) / 5.0, 0, 1),
    camberRearRatio: clamp(Math.abs(tiresAlign.cR) / 5.0, 0, 1),
    toeFrontDeg: Number(tiresAlign.toeF.toFixed(2)),
    toeRearDeg: Number(tiresAlign.toeR.toFixed(2)),
    casterRatio: clamp((tiresAlign.caster - 1.0) / 6.0, 0, 1),
    arbFrontRatio: clamp((suspAero.arbF - 1) / 64, 0, 1),
    arbRearRatio: clamp((suspAero.arbR - 1) / 64, 0, 1),
    springFrontRatio: clamp((suspAero.spF - suspAero.spFMin) / suspAero.rangeSpF, 0, 1),
    springRearRatio: clamp((suspAero.spR - suspAero.spRMin) / suspAero.rangeSpR, 0, 1),
    heightFrontRatio: clamp(
      (suspAero.hF - suspAero.hFMin) / (suspAero.hFMax - suspAero.hFMin),
      0,
      1
    ),
    heightRearRatio: clamp(
      (suspAero.hR - suspAero.hRMin) / (suspAero.hRMax - suspAero.hRMin),
      0,
      1
    ),
    rebFrontRatio: clamp((suspAero.rebF_val - 1) / 19, 0, 1),
    rebRearRatio: clamp((suspAero.rebR_val - 1) / 19, 0, 1),
    bmpFrontRatio: clamp((suspAero.bmpF_val - 1) / 19, 0, 1),
    bmpRearRatio: clamp((suspAero.bmpR_val - 1) / 19, 0, 1),
    aeroFrontRatio:
      suspAero.aeroRangeF > 0
        ? clamp((suspAero.aeroF - suspAero.aeroFMin) / suspAero.aeroRangeF, 0, 1)
        : 0,
    aeroRearRatio:
      suspAero.aeroRangeR > 0
        ? clamp((suspAero.aeroR - suspAero.aeroRMin) / suspAero.aeroRangeR, 0, 1)
        : 0,
    brakeBalanceRatio: clamp(driveGearing.brakeBalance / 100, 0, 1),
    brakePressureRatio: clamp((driveGearing.brakePressure - 50) / 150, 0, 1),
    diffFrontAccRatio:
      car.drivetrain !== 'RWD' ? clamp(driveGearing.dFAcc / 100, 0, 1) : undefined,
    diffFrontDecRatio:
      car.drivetrain !== 'RWD' ? clamp(driveGearing.dFDec / 100, 0, 1) : undefined,
    diffRearAccRatio:
      car.drivetrain !== 'FWD' ? clamp(driveGearing.dRAcc / 100, 0, 1) : undefined,
    diffRearDecRatio:
      car.drivetrain !== 'FWD' ? clamp(driveGearing.dRDec / 100, 0, 1) : undefined,
    diffCenterRatio:
      car.drivetrain === 'AWD' ? clamp(driveGearing.dCenterPct / 100, 0, 1) : undefined,
  };

  const { bias } = tiresAlign;

  return {
    tireFront: isImp
      ? `${(tiresAlign.coldBarF * 14.5038).toFixed(1)} PSI`
      : `${tiresAlign.coldBarF.toFixed(2)} bar`,
    tireRear: isImp
      ? `${(tiresAlign.coldBarR * 14.5038).toFixed(1)} PSI`
      : `${tiresAlign.coldBarR.toFixed(2)} bar`,
    tireFrontCold: isImp
      ? `${(tiresAlign.coldBarF * 14.5038).toFixed(1)} PSI`
      : `${tiresAlign.coldBarF.toFixed(2)} bar`,
    tireFrontHot: isImp
      ? `${(tiresAlign.targetHotBarF * 14.5038).toFixed(1)} PSI`
      : `${tiresAlign.targetHotBarF.toFixed(2)} bar`,
    tireRearCold: isImp
      ? `${(tiresAlign.coldBarR * 14.5038).toFixed(1)} PSI`
      : `${tiresAlign.coldBarR.toFixed(2)} bar`,
    tireRearHot: isImp
      ? `${(tiresAlign.targetHotBarR * 14.5038).toFixed(1)} PSI`
      : `${tiresAlign.targetHotBarR.toFixed(2)} bar`,
    handlingBiasNote:
      bias === 0
        ? '0 (Neutral Balance)'
        : bias > 0
        ? `+${bias} (Agile Rotation)`
        : `${bias} (Stable Understeer)`,
    camberFront: `${tiresAlign.cF.toFixed(1)}°`,
    camberRear: `${tiresAlign.cR.toFixed(1)}°`,
    toeFront: formatToe(tiresAlign.toeF),
    toeRear: formatToe(tiresAlign.toeR),
    caster: `${tiresAlign.caster.toFixed(1)}°`,
    arbFront: suspAero.arbF.toFixed(1),
    arbRear: suspAero.arbR.toFixed(1),
    springFront: isImp
      ? `${suspAero.spF.toFixed(1)} lb/in`
      : `${suspAero.spF.toFixed(1)} kgf/mm`,
    springRear: isImp
      ? `${suspAero.spR.toFixed(1)} lb/in`
      : `${suspAero.spR.toFixed(1)} kgf/mm`,
    heightFront: isImp
      ? `${suspAero.hF.toFixed(1)} in`
      : `${suspAero.hF.toFixed(1)} cm`,
    heightRear: isImp
      ? `${suspAero.hR.toFixed(1)} in`
      : `${suspAero.hR.toFixed(1)} cm`,
    rebFront: suspAero.rebF_val.toFixed(1),
    rebRear: suspAero.rebR_val.toFixed(1),
    bmpFront: suspAero.bmpF_val.toFixed(1),
    bmpRear: suspAero.bmpR_val.toFixed(1),
    aeroFront: isImp
      ? `${Math.round(suspAero.aeroF)} lbf`
      : `${Math.round(suspAero.aeroF)} kgf`,
    aeroRear: isImp
      ? `${Math.round(suspAero.aeroR)} lbf`
      : `${Math.round(suspAero.aeroR)} kgf`,
    brakeBalance: `${driveGearing.brakeBalance}% (Forza Slider)`,
    brakeBalanceNote: `${driveGearing.physicalFrontBias}% Front Physics • FH Slider Inverted`,
    brakePressure: `${driveGearing.brakePressure}%`,
    diffFront:
      car.drivetrain !== 'RWD'
        ? `${driveGearing.dFAcc}% / ${driveGearing.dFDec}%`
        : undefined,
    diffRear:
      car.drivetrain !== 'FWD'
        ? `${driveGearing.dRAcc}% / ${driveGearing.dRDec}%`
        : undefined,
    diffCenter: car.drivetrain === 'AWD' ? driveGearing.dCenter : undefined,
    finalDrive: driveGearing.calculatedFD.toFixed(2),
    gearRatios: driveGearing.gearRatios,
    gearMaxSpeeds: driveGearing.gearMaxSpeeds,
    shiftDropRpms: driveGearing.shiftDropRpms,
    driveCircumferenceM: tiresAlign.driveCircumferenceM,
    redlineRpm: driveGearing.safeRedline,
    targetSpeedDisplay: driveGearing.rawTopSpeed,
    estimatedTopSpeed: driveGearing.estSpeedDisplay,
    estimatedTopSpeedKm: driveGearing.vTerminalKmh,
    aeroDragNote: driveGearing.aeroDragNote,
    raw,
  };
}
