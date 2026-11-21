import { UnitSystem, VehicleInputs } from '../types/tuning';

export const KG_TO_LBS = 2.2046226218;
// Forza Horizon's in-game metric spring readout (labeled kgf/mm) uses kgf/cm-scale numbers
// (~10x numerically larger than SI kgf/mm): 100.0 Forza metric ≈ 560.0 lb/in Imperial.
export const FORZA_SPRING_TO_LB_IN = 5.599741459;
export const CM_TO_IN = 1 / 2.54;
export const KMH_TO_MPH = 1 / 1.609344;

// Power conversions: Metric Horsepower (PS) vs Mechanical Horsepower (HP / bhp)
export const PS_TO_HP = 0.98632007; // 1 PS = 0.98632 HP
export const HP_TO_PS = 1.01386967; // 1 HP = 1.01387 PS
export const KW_TO_HP = 1.34102209; // 1 kW = 1.34102 HP
export const HP_TO_KW = 0.74569987; // 1 HP = 0.7457 kW

export function psToHp(ps: number): number {
  return Math.round(ps * PS_TO_HP);
}

export function hpToPs(hp: number): number {
  return Math.round(hp * HP_TO_PS);
}

export function kwToHp(kw: number): number {
  return Math.round(kw * KW_TO_HP);
}

export function hpToKw(hp: number): number {
  return Math.round(hp * HP_TO_KW);
}

/**
 * Converts vehicle inputs between metric and imperial unit systems cleanly.
 */
export function convertInputsUnitSystem(
  current: VehicleInputs,
  targetUnits: UnitSystem
): VehicleInputs {
  if (current.units === targetUnits) {
    return current;
  }

  const toImperial = targetUnits === 'imperial';

  return {
    ...current,
    units: targetUnits,
    weight: toImperial
      ? Math.round(current.weight * KG_TO_LBS)
      : Math.round(current.weight / KG_TO_LBS),
    springFrontMin: toImperial
      ? Number((current.springFrontMin * FORZA_SPRING_TO_LB_IN).toFixed(1))
      : Number((current.springFrontMin / FORZA_SPRING_TO_LB_IN).toFixed(1)),
    springFrontMax: toImperial
      ? Number((current.springFrontMax * FORZA_SPRING_TO_LB_IN).toFixed(1))
      : Number((current.springFrontMax / FORZA_SPRING_TO_LB_IN).toFixed(1)),
    springRearMin: toImperial
      ? Number((current.springRearMin * FORZA_SPRING_TO_LB_IN).toFixed(1))
      : Number((current.springRearMin / FORZA_SPRING_TO_LB_IN).toFixed(1)),
    springRearMax: toImperial
      ? Number((current.springRearMax * FORZA_SPRING_TO_LB_IN).toFixed(1))
      : Number((current.springRearMax / FORZA_SPRING_TO_LB_IN).toFixed(1)),
    heightFrontMin: toImperial
      ? Number((current.heightFrontMin * CM_TO_IN).toFixed(1))
      : Number((current.heightFrontMin / CM_TO_IN).toFixed(1)),
    heightFrontMax: toImperial
      ? Number((current.heightFrontMax * CM_TO_IN).toFixed(1))
      : Number((current.heightFrontMax / CM_TO_IN).toFixed(1)),
    heightRearMin: toImperial
      ? Number((current.heightRearMin * CM_TO_IN).toFixed(1))
      : Number((current.heightRearMin / CM_TO_IN).toFixed(1)),
    heightRearMax: toImperial
      ? Number((current.heightRearMax * CM_TO_IN).toFixed(1))
      : Number((current.heightRearMax / CM_TO_IN).toFixed(1)),
    aeroFrontMin: toImperial
      ? Math.round(current.aeroFrontMin * KG_TO_LBS)
      : Math.round(current.aeroFrontMin / KG_TO_LBS),
    aeroFrontMax: toImperial
      ? Math.round(current.aeroFrontMax * KG_TO_LBS)
      : Math.round(current.aeroFrontMax / KG_TO_LBS),
    aeroRearMin: toImperial
      ? Math.round(current.aeroRearMin * KG_TO_LBS)
      : Math.round(current.aeroRearMin / KG_TO_LBS),
    aeroRearMax: toImperial
      ? Math.round(current.aeroRearMax * KG_TO_LBS)
      : Math.round(current.aeroRearMax / KG_TO_LBS),
    topSpeed: toImperial
      ? Math.round(current.topSpeed * KMH_TO_MPH)
      : Math.round(current.topSpeed / KMH_TO_MPH),
  };
}
