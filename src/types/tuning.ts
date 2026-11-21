export type UnitSystem = 'metric' | 'imperial';
export type CarCategory = 'jdm' | 'sports' | 'classic' | 'track' | 'supercar' | 'offroad';
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

export interface TuneDoctorOffsets {
  tireBarDeltaF?: number;
  tireBarDeltaR?: number;
  toeDegDeltaF?: number;
  camberDegDeltaF?: number;
  casterDegDelta?: number;
  bumpDeltaF?: number;
  bumpDeltaR?: number;
  heightRatioDelta?: number;
  aeroFrontRatioDelta?: number;
  diffFrontAccDelta?: number;
  diffRearAccDelta?: number;
  finalDriveDelta?: number;
}

export interface VehicleInputs {
  carName?: string;
  piClass?: string;
  activePresetName?: string;
  doctorOffsets?: TuneDoctorOffsets;
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

export interface TuneRawMetrics {
  tireFrontRatio: number; // 0..1 relative to 1.0..3.8 bar
  tireRearRatio: number;
  camberFrontRatio: number; // 0..1 relative to 0..-5.5 deg (magnitude)
  camberRearRatio: number;
  toeFrontDeg: number; // -1.2..+1.2
  toeRearDeg: number;
  casterRatio: number; // 0..1 relative to 1..7 deg
  arbFrontRatio: number; // 0..1 relative to 1..65
  arbRearRatio: number;
  springFrontRatio: number; // 0..1 between min and max
  springRearRatio: number;
  heightFrontRatio: number; // 0..1 between min and max
  heightRearRatio: number;
  rebFrontRatio: number; // 0..1 relative to 1..20
  rebRearRatio: number;
  bmpFrontRatio: number; // 0..1 relative to 1..20
  bmpRearRatio: number;
  aeroFrontRatio: number; // 0..1 between min and max
  aeroRearRatio: number;
  brakeBalanceRatio: number; // 0..1 (0..100%)
  brakePressureRatio: number; // 0..1 (50..200%)
  diffFrontAccRatio?: number; // 0..1
  diffFrontDecRatio?: number;
  diffRearAccRatio?: number;
  diffRearDecRatio?: number;
  diffCenterRatio?: number; // 0..1 (Rear %)
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
  brakeBalanceNote?: string;
  brakePressure: string;
  diffFront?: string;
  diffRear?: string;
  diffCenter?: string;
  finalDrive: string;
  gearRatios: number[];
  gearMaxSpeeds: number[];
  shiftDropRpms: number[];
  driveCircumferenceM: number;
  redlineRpm: number;
  targetSpeedDisplay: number;
  estimatedTopSpeed: string;
  estimatedTopSpeedKm: number;
  aeroDragNote?: string;
  raw: TuneRawMetrics;
}

export interface PresetItem {
  id: string;
  name: string;
  inputs: VehicleInputs;
}

export type MobileTab = 'specs' | 'limits' | 'tune' | 'all';
export type OutputTab = 'all' | 'tires' | 'susp' | 'aero' | 'gears';

export const DEFAULT_INPUTS: VehicleInputs = {
  carName: 'Custom JDM Drift Spec',
  piClass: 'S1',
  units: 'metric',
  category: 'jdm',
  discipline: 'drift',
  drivetrain: 'RWD',
  hp: 650,
  weight: 1280,
  frontWeightPct: 53.0,
  tireCompound: 'sport',
  handlingBias: 0,
  tWidthF: 245,
  tProfileF: 40,
  tRimF: 18,
  tWidthR: 275,
  tProfileR: 35,
  tRimR: 18,
  springFrontMin: 35,
  springFrontMax: 210,
  springRearMin: 35,
  springRearMax: 210,
  heightFrontMin: 9.0,
  heightFrontMax: 18.0,
  heightRearMin: 9.0,
  heightRearMax: 18.0,
  aeroFrontMin: 35,
  aeroFrontMax: 180,
  aeroRearMin: 70,
  aeroRearMax: 320,
  redlineRpm: 8000,
  topSpeed: 260,
  numGears: 6,
  engineType: 'balanced',
};
