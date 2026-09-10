export const translations = {
  en: {
    // Car Selector Modal
    selectVehicle: 'Select Vehicle ({{count}})',
    noVehiclesMatching: 'No vehicles matching "{{search}}"',
    cancel: 'Cancel',
    searchPlaceholder: 'Search manufacturer, model, or year...',
    carSpecsMeta: '{{drivetrain}} • {{hp}} HP • {{category}}',
    clearSymbol: '✕',

    // Top Bar & Header
    forza: 'FORZA ',
    proTuner: 'PRO TUNER',
    subtitle: 'Mobile Telemetry & Precision Suspension Calculator',
    metric: 'Metric',
    imperial: 'Imperial',
    cars: 'Cars',
    garage: 'Garage',
    reset: 'Reset',
    // Alerts & Confirmations
    errorTitle: 'Error',
    enterPresetNameMsg: 'Please enter a preset name',
    invalidPresetNameMsg: 'Invalid preset name',
    overwritePresetTitle: 'Overwrite Preset',
    overwritePresetConfirm: 'A preset named "{{name}}" already exists. Do you want to overwrite it?',
    overwrite: 'Overwrite',
    presetSavedTitle: 'Saved',
    presetSavedMsg: 'Preset "{{name}}" saved!',
    presetUpdatedMsg: 'Preset "{{name}}" updated!',
    deletePresetTitle: 'Delete Preset',
    deletePresetConfirm: 'Are you sure you want to delete "{{name}}"?',
    resetDefaultsTitle: 'Reset Defaults',
    resetDefaultsConfirm: 'Reset all tuning values to default?',

    // Section 1: Chassis & Power
    chassisAndPower: '1. Chassis & Power',
    carCategory: 'Car Category',
    jdmLabel: 'JDM / Tuner',
    trackLabel: 'GT / Track',
    classicLabel: 'Classic / Muscle',
    supercarLabel: 'Supercar',
    disciplineSurface: 'Discipline / Surface',
    drivetrain: 'Drivetrain',
    power: 'Power',
    hpUnit: 'HP',
    psUnit: 'PS',
    approxHp: '≈ {{val}} HP',
    approxPs: '≈ {{val}} PS',
    weight: 'Weight ({{unit}})',
    frontWeightPct: 'Front Wt %',

    // Section 2: Tires & Compound
    frontRearTireSizes: '2. Front & Rear Tire Sizes',
    tireCompound: 'Tire Compound',
    compoundStock: 'Stock',
    compoundStreet: 'Street',
    compoundSport: 'Sport',
    compoundSemislick: 'Semi-Slick',
    compoundSlick: 'Race Slick',
    compoundRally: 'Rally',
    compoundOffroad: 'Off-Road',
    compoundDrift: 'Drift',
    compoundDrag: 'Drag',
    frontTireLabel: 'Front Tire (Width mm / Aspect % / Rim in)',
    rearTireLabel: 'Rear Tire (Width mm / Aspect % / Rim in)',
    placeholderWidth: 'Width',
    placeholderProfile: 'Profile',
    placeholderRim: 'Rim',
    frontDiaCirc: 'Front Dia: {{dia}} | Circ: {{circ}}',
    rearDiaCirc: 'Rear Dia: {{dia}} | Circ: {{circ}}',

    // Section 3: Suspension Limits & Handling Bias
    sliderLimits: '3. In-Game Slider Limits',
    handlingBiasTitle: 'Handling Balance Bias',
    handlingStable: 'Stable (Understeer)',
    handlingNeutral: 'Neutral Balance',
    handlingAgile: 'Agile (Oversteer)',
    handlingBiasDisplay: 'Bias: {{val}}',
    handlingBiasNote: 'Fine-tunes ARB roll distribution & turn-in rotation',
    placeholderMin: 'Min',
    placeholderMax: 'Max',
    frontSprings: 'Front Springs ({{unit}})',
    rearSprings: 'Rear Springs ({{unit}})',
    frontRideHeight: 'Front Ride Height ({{unit}})',
    rearRideHeight: 'Rear Ride Height ({{unit}})',

    // Section 4: Aero
    aeroLimits: '4. Aero Downforce Slider Limits',
    frontAero: 'Front Aero ({{unit}})',
    rearAero: 'Rear Aero ({{unit}})',

    // Section 5: Engine & Transmission
    engineTransmissionSpecs: '5. Engine & Transmission Specs',
    redlineRpm: 'Redline RPM',
    topSpeed: 'Top Speed ({{unit}})',
    gears: 'Gears (1-10)',
    powerBandCurve: 'Power Band Curve',
    balancedTurbo: 'Balanced / Turbo',
    highRevNA: 'High-Rev NA (VTEC)',
    highTorque: 'High Torque (V8/Diesel)',
    electricEV: 'Electric (EV / Direct)',

    // Output Card
    calculatedTuneSetup: 'Calculated Tune Setup',
    tirePressureFR: 'Tire Pressure (F / R):',
    camberFR: 'Camber (F / R):',
    toeFR: 'Toe (F / R):',
    casterAngle: 'Caster Angle:',
    arbFR: 'Anti-Roll Bars (F / R):',
    springsFR: 'Springs (F / R):',
    rideHeightFR: 'Ride Height (F / R):',
    reboundDampingFR: 'Rebound Damping (F / R):',
    bumpDampingFR: 'Bump Damping (F / R):',
    aeroDownforceFR: 'Aero Downforce (F / R):',
    brakesBalancePressure: 'Brakes (Balance / Pressure):',
    frontDiffAccDec: 'Front Diff (Acc / Dec):',
    rearDiffAccDec: 'Rear Diff (Acc / Dec):',
    centerDiffBias: 'Center Differential Bias:',
    gearingTransmission: 'Gearing & Transmission',
    calculatedFinalDrive: 'Calculated Final Drive:',
    gearPrefix: 'G{{num}}',

    // Garage Modal
    carGaragePresets: 'Car Garage Presets',
    newPresetPlaceholder: 'New Preset Name (e.g. R34 Drift)',
    save: 'Save',
    savedVehicles: 'Saved Vehicles:',
    noPresetsSaved: 'No presets saved yet.',
    delete: 'Delete',
    close: 'Close',
  },
};

export type TranslationKey = keyof typeof translations.en;

const englishMap = new Map<string, string>(Object.entries(translations.en));

const languageMaps = new Map<string, Map<string, string>>([
  ['en', englishMap],
]);

let currentLanguage = 'en';

export function setLanguage(lang: string) {
  if (languageMaps.has(lang)) {
    currentLanguage = lang;
  }
}

// Static literal RegExp to prevent ReDoS (CWE-1333)
const PLACEHOLDER_REGEX = /\{\{([a-zA-Z0-9_]+)\}\}/g;

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  // Use Map.get() instead of bracket object notation to prevent prototype pollution (CWE-1385)
  const activeMap = languageMaps.get(currentLanguage) || englishMap;
  let str = activeMap.get(key) || englishMap.get(key) || String(key);

  if (params) {
    const paramMap = new Map<string, string | number>(Object.entries(params));
    str = str.replace(PLACEHOLDER_REGEX, (match, paramName) => {
      const val = paramMap.get(paramName);
      return val !== undefined ? String(val) : match;
    });
  }
  return str;
}
