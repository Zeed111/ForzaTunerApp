export const translations = {
  en: {
    // Car Selector Modal
    selectVehicle: 'Select Vehicle ({{count}})',
    noVehiclesMatching: 'No vehicles matching "{{search}}"',
    noVehiclesMatchFilters: 'No vehicles match the selected filters',
    filterAll: 'ALL',
    resetFilters: 'Reset Filters',
    cancel: 'Cancel',
    searchPlaceholder: 'Search manufacturer, model, or year...',
    carSpecsMeta: '{{drivetrain}} • {{hp}} HP • {{weight}} {{wtUnit}} • {{frontPct}}% F • {{category}}',
    clearSymbol: '✕',

    // Top Bar & Header
    forza: 'FORZA ',
    proTuner: 'PRO TUNER',
    subtitle: 'Mobile Telemetry & Precision Suspension Calculator',
    metric: 'Metric',
    imperial: 'Imperial',
    cars: 'Cars',
    doctor: 'Doctor',
    checklist: 'Checklist',
    garage: 'Garage',
    reset: 'Reset',

    // Tune Doctor
    tuneDoctor: 'Tune Doctor',
    symptomEntryUndersteer: 'Entry Understeer',
    descEntryUndersteer: 'Car pushes wide and refuses to turn when entering a corner.',
    symptomExitOversteer: 'Exit Snap Oversteer',
    descExitOversteer: 'Rear snaps out under throttle when accelerating out of turns.',
    symptomMidCornerPush: 'Mid-Corner Push',
    descMidCornerPush: 'Car hesitates or pushes wide through the apex.',
    symptomCurbInstability: 'Curb Instability & Bouncing',
    descCurbInstability: 'Chassis bounces or unsettles violently over curbs or bumps.',
    symptomLaunchWheelspin: 'Launch Wheelspin',
    descLaunchWheelspin: 'Excessive wheelspin off the line in 1st/2nd gear.',
    symptomHighSpeedWander: 'High-Speed Wander',
    descHighSpeedWander: 'Car feels floaty, light, or nervous at high speeds.',
    diagnosis: 'Diagnosis & Cause:',
    prescription: 'Prescription & Adjustments:',
    applyFix: 'Apply Recommended Fix',
    fixApplied: 'Fix Applied!',
    liveTelemetryImpact: 'Live Telemetry Impact (Before → After):',
    resetDoctorTweaks: 'Reset Doctor Tweaks',
    doctorTweaksResetMsg: 'Cleared Tune Doctor fine-tune offsets and reset Handling Bias.',
    doctorFixesActive: 'Doctor Tweaks Active',
    noDirectChangesNeeded: 'Current tune values already reflect this prescription.',
    diagnosisentry_understeer:
      'Front tires are overloaded or front anti-roll bar is too stiff, preventing the car from pivoting into the corner on initial turn-in.',
    diagnosisexit_oversteer:
      'Rear differential acceleration lock is too aggressive, or rear anti-roll bar is too rigid, causing the rear tires to break loose when applying power out of corners.',
    diagnosismid_corner_push:
      'Rear anti-roll bar is too compliant relative to front, causing the front tires to wash out through the mid-corner apex.',
    diagnosiscurb_instability:
      'Suspension ride height is too low or bump damping is too stiff, bottoming out against bump stops over curbs and violently unsettling the chassis.',
    diagnosislaunch_wheelspin:
      'Rear tire width is too narrow for current horsepower, 1st gear ratio is too short, or rear tire pressure is overinflated.',
    diagnosishigh_speed_wander:
      'Front aerodynamic downforce is insufficient relative to rear wing, or front toe is excessively out, causing high-speed nervousness.',
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

    // Active Vehicle Banner & Section Headers
    activeVehicle: 'ACTIVE VEHICLE',
    customBuild: 'Custom Spec Build',
    changeCar: 'Change Car',
    saveTune: 'Save Tune',
    powerToWeight: '{{ptw}} HP/t',
    matchFrontTires: 'Match Front',
    staggerPlus30: '+30mm Stagger',
    viewTune: 'View Tune',
    targetHotTelemetry: '↳ Target Hot (Telemetry):',
    handlingBalanceSub: '↳ Handling Balance:',
    secTiresAlignment: 'Tires & Alignment',
    secSuspensionDamping: 'Suspension & Damping',
    secAeroBrakesDiff: 'Aero, Brakes & Diff',
    tabSpecs: '1. Specs & Tires',
    tabLimits: '2. Limits & Gears',
    tabTune: '3. Tune Sheet',
    tabAll: 'All',
    autoScaleLimits: 'Auto-Scale from Weight',
    filterAllTabs: 'All',
    filterTiresAlign: 'Tires & Align',
    filterSuspension: 'Suspension',
    filterAeroDiff: 'Aero & Diff',
    filterGearing: 'Gearing',
    tapRowToCopyHint: 'Tap any row to copy value',

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
    estimatedAeroTopSpeed: 'Estimated Aero Top Speed:',
    aeroDragAdvisory: 'Aero Drag Advisory',
    gearPrefix: 'G{{num}}',

    // Garage Modal & Companion Checklist
    carGaragePresets: 'Car Garage Presets',
    newPresetPlaceholder: 'New Preset Name (e.g. R34 Drift)',
    save: 'Save',
    savedVehicles: 'Saved Vehicles:',
    noPresetsSaved: 'No presets saved yet.',
    delete: 'Delete',
    close: 'Close',
    inGameTuneCompanion: 'IN-GAME TUNE COMPANION',
    appliedProgress: '{{checked}} of {{total}} Applied ({{pct}}%)',
    checkAll: 'Check All',
    copyTuneCard: 'Copy Tune Card',
    tuneCardCopied: 'Copied!',
    doneTuning: 'Done Tuning',
    copy: 'Copy',
    copied: 'Copied',
    catTires: '1. TIRES',
    catGearing: '2. GEARING',
    catAlignment: '3. ALIGNMENT',
    catArbs: '4. ANTI-ROLL BARS',
    catSprings: '5. SPRINGS & RIDE HEIGHT',
    catDamping: '6. DAMPING',
    catAero: '7. AERO DOWNFORCE',
    catBrakes: '8. BRAKES',
    catDiff: '9. DIFFERENTIAL',
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
