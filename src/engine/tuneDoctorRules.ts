import { TuneResult, VehicleInputs } from '../types/tuning';
import { TranslationKey } from '../i18n';
import { THEME } from '../theme';

export interface SymptomItem {
  id: string;
  badge: string;
  badgeColor: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  diagnosisKey: TranslationKey;
  prescriptions: string[];
  apply: (prev: VehicleInputs) => { updated: VehicleInputs; msg: string };
}

export interface DiffRow {
  label: string;
  before: string;
  after: string;
}

export const SYMPTOMS: SymptomItem[] = [
  {
    id: 'entry_understeer',
    badge: 'TURN-IN',
    badgeColor: THEME.accentSteel,
    titleKey: 'symptomEntryUndersteer',
    descKey: 'descEntryUndersteer',
    diagnosisKey: 'diagnosisentry_understeer',
    prescriptions: [
      'Shift Handling Balance Bias +2 towards Agile',
      'Lower Front Tire starting pressure (-1.5 PSI / -0.10 bar)',
      'Add slight Front Toe-Out (-0.10°) for instantaneous steering bite',
    ],
    apply: prev => {
      const nextBias = Math.min(5, (prev.handlingBias || 0) + 2);
      const prevOff = prev.doctorOffsets || {};
      const nextTireF = Number(Math.max(-0.45, (prevOff.tireBarDeltaF || 0) - 0.10).toFixed(2));
      const nextToeF = Number(Math.max(-0.50, (prevOff.toeDegDeltaF || 0) - 0.10).toFixed(2));
      return {
        updated: {
          ...prev,
          handlingBias: nextBias,
          doctorOffsets: {
            ...prevOff,
            tireBarDeltaF: nextTireF,
            toeDegDeltaF: nextToeF,
          },
        },
        msg: `Shifted Bias to ${nextBias > 0 ? `+${nextBias}` : nextBias}, dropped Front Tire -0.10 bar, and added -0.10° Front Toe-Out.`,
      };
    },
  },
  {
    id: 'exit_oversteer',
    badge: 'THROTTLE EXIT',
    badgeColor: THEME.accentBrand,
    titleKey: 'symptomExitOversteer',
    descKey: 'descExitOversteer',
    diagnosisKey: 'diagnosisexit_oversteer',
    prescriptions: [
      'Shift Handling Balance Bias -2 towards Stable',
      'Lower Rear Differential Accel Lock (-8%) to reduce throttle snap',
      'Lower Rear Tire starting pressure (-1.5 PSI / -0.10 bar) for wider contact patch',
    ],
    apply: prev => {
      const nextBias = Math.max(-5, (prev.handlingBias || 0) - 2);
      const prevOff = prev.doctorOffsets || {};
      const nextDiffR = Math.max(-35, (prevOff.diffRearAccDelta || 0) - 8);
      const nextTireR = Number(Math.max(-0.45, (prevOff.tireBarDeltaR || 0) - 0.10).toFixed(2));
      return {
        updated: {
          ...prev,
          handlingBias: nextBias,
          doctorOffsets: {
            ...prevOff,
            diffRearAccDelta: nextDiffR,
            tireBarDeltaR: nextTireR,
          },
        },
        msg: `Shifted Bias to ${nextBias}, reduced Rear Diff Accel -8%, and lowered Rear Tire -0.10 bar.`,
      };
    },
  },
  {
    id: 'mid_corner_push',
    badge: 'APEX ROTATION',
    badgeColor: THEME.accentAmber,
    titleKey: 'symptomMidCornerPush',
    descKey: 'descMidCornerPush',
    diagnosisKey: 'diagnosismid_corner_push',
    prescriptions: [
      'Shift Handling Balance Bias +1 towards Agile',
      'Stiffen Rear Anti-Roll Bar for cleaner lateral rotation',
      'Increase negative Front Camber (-0.3°) to hold grip at high lateral G',
    ],
    apply: prev => {
      const nextBias = Math.min(5, (prev.handlingBias || 0) + 1);
      const prevOff = prev.doctorOffsets || {};
      const nextCamberF = Number(Math.max(-1.2, (prevOff.camberDegDeltaF || 0) - 0.3).toFixed(1));
      return {
        updated: {
          ...prev,
          handlingBias: nextBias,
          doctorOffsets: {
            ...prevOff,
            camberDegDeltaF: nextCamberF,
          },
        },
        msg: `Shifted Bias to ${nextBias > 0 ? `+${nextBias}` : nextBias} and added -0.3° Front Camber for apex rotation.`,
      };
    },
  },
  {
    id: 'curb_instability',
    badge: 'SUSPENSION',
    badgeColor: THEME.accentSuccess,
    titleKey: 'symptomCurbInstability',
    descKey: 'descCurbInstability',
    diagnosisKey: 'diagnosiscurb_instability',
    prescriptions: [
      'Raise Ride Height target (+12% slider travel)',
      'Soften Front & Rear Bump Damping (-1.2) to absorb curb strikes smoothly',
    ],
    apply: prev => {
      const prevOff = prev.doctorOffsets || {};
      const nextHeightRatio = Number(
        Math.min(0.50, (prevOff.heightRatioDelta || 0) + 0.12).toFixed(2)
      );
      const nextBmpF = Number(Math.max(-5.0, (prevOff.bumpDeltaF || 0) - 1.2).toFixed(1));
      const nextBmpR = Number(Math.max(-5.0, (prevOff.bumpDeltaR || 0) - 1.2).toFixed(1));
      return {
        updated: {
          ...prev,
          doctorOffsets: {
            ...prevOff,
            heightRatioDelta: nextHeightRatio,
            bumpDeltaF: nextBmpF,
            bumpDeltaR: nextBmpR,
          },
        },
        msg: 'Raised Ride Height target (+12% travel) and softened Bump Damping -1.2.',
      };
    },
  },
  {
    id: 'launch_wheelspin',
    badge: 'TRACTION',
    badgeColor: '#FB923C',
    titleKey: 'symptomLaunchWheelspin',
    descKey: 'descLaunchWheelspin',
    diagnosisKey: 'diagnosislaunch_wheelspin',
    prescriptions: [
      'Lower driven axle Tire pressure (-1.5 PSI / -0.10 bar) to maximize launch bite',
      'Reduce driven differential accel lock (-8% on FWD) & lengthen Final Drive (-0.10)',
    ],
    apply: prev => {
      const prevOff = prev.doctorOffsets || {};
      const nextFd = Number(Math.max(-0.60, (prevOff.finalDriveDelta || 0) - 0.10).toFixed(2));
      if (prev.drivetrain === 'FWD') {
        const nextTireF = Number(Math.max(-0.45, (prevOff.tireBarDeltaF || 0) - 0.10).toFixed(2));
        const nextDiffF = Math.max(-35, (prevOff.diffFrontAccDelta || 0) - 8);
        return {
          updated: {
            ...prev,
            doctorOffsets: {
              ...prevOff,
              tireBarDeltaF: nextTireF,
              diffFrontAccDelta: nextDiffF,
              finalDriveDelta: nextFd,
            },
          },
          msg: 'Dropped Front Tire -0.10 bar, reduced Front Diff Accel -8%, and lengthened Final Drive -0.10.',
        };
      }

      const nextTireR = Number(Math.max(-0.45, (prevOff.tireBarDeltaR || 0) - 0.10).toFixed(2));
      return {
        updated: {
          ...prev,
          doctorOffsets: {
            ...prevOff,
            tireBarDeltaR: nextTireR,
            finalDriveDelta: nextFd,
          },
        },
        msg: 'Dropped Rear Tire -0.10 bar and lengthened Final Drive -0.10.',
      };
    },
  },
  {
    id: 'high_speed_wander',
    badge: 'STABILITY',
    badgeColor: '#60A5FA',
    titleKey: 'symptomHighSpeedWander',
    descKey: 'descHighSpeedWander',
    diagnosisKey: 'diagnosishigh_speed_wander',
    prescriptions: [
      'Increase Front Aero Downforce target (+15% slider range) to pin the front end down',
      'Reset Front Toe offset (0.0°) for straight-line tracking',
      'Increase Caster Angle (+0.5°) for straight-line self-centering',
    ],
    apply: prev => {
      const prevOff = prev.doctorOffsets || {};
      const nextAeroFrontRatio = Number(
        Math.min(0.60, (prevOff.aeroFrontRatioDelta || 0) + 0.15).toFixed(2)
      );
      const nextCaster = Number(Math.min(1.5, (prevOff.casterDegDelta || 0) + 0.5).toFixed(1));
      return {
        updated: {
          ...prev,
          doctorOffsets: {
            ...prevOff,
            aeroFrontRatioDelta: nextAeroFrontRatio,
            toeDegDeltaF: 0,
            casterDegDelta: nextCaster,
          },
        },
        msg: 'Increased Front Aero target (+15% range), zeroed Toe tweak, and added +0.5° Caster.',
      };
    },
  },
];

export function computeTuneDoctorDiff(
  inputs: VehicleInputs,
  symptom: SymptomItem,
  calcFn: (i: VehicleInputs) => TuneResult
): DiffRow[] {
  const beforeTune = calcFn(inputs);
  const { updated } = symptom.apply(inputs);
  const afterTune = calcFn(updated);

  const candidates: DiffRow[] = [
    {
      label: 'Handling Balance',
      before: beforeTune.handlingBiasNote || '0 (Neutral Balance)',
      after: afterTune.handlingBiasNote || '0 (Neutral Balance)',
    },
    {
      label: 'Tire Pressure (F / R)',
      before: `${beforeTune.tireFrontCold} / ${beforeTune.tireRearCold}`,
      after: `${afterTune.tireFrontCold} / ${afterTune.tireRearCold}`,
    },
    {
      label: 'Camber (F / R)',
      before: `${beforeTune.camberFront} / ${beforeTune.camberRear}`,
      after: `${afterTune.camberFront} / ${afterTune.camberRear}`,
    },
    {
      label: 'Toe (F / R)',
      before: `${beforeTune.toeFront} / ${beforeTune.toeRear}`,
      after: `${afterTune.toeFront} / ${afterTune.toeRear}`,
    },
    {
      label: 'Caster Angle',
      before: beforeTune.caster,
      after: afterTune.caster,
    },
    {
      label: 'Anti-Roll Bars (F / R)',
      before: `${beforeTune.arbFront} / ${beforeTune.arbRear}`,
      after: `${afterTune.arbFront} / ${afterTune.arbRear}`,
    },
    {
      label: 'Springs (F / R)',
      before: `${beforeTune.springFront} / ${beforeTune.springRear}`,
      after: `${afterTune.springFront} / ${afterTune.springRear}`,
    },
    {
      label: 'Ride Height (F / R)',
      before: `${beforeTune.heightFront} / ${beforeTune.heightRear}`,
      after: `${afterTune.heightFront} / ${afterTune.heightRear}`,
    },
    {
      label: 'Bump Damping (F / R)',
      before: `${beforeTune.bmpFront} / ${beforeTune.bmpRear}`,
      after: `${afterTune.bmpFront} / ${afterTune.bmpRear}`,
    },
    {
      label: 'Aero Downforce (F / R)',
      before: `${beforeTune.aeroFront} / ${beforeTune.aeroRear}`,
      after: `${afterTune.aeroFront} / ${afterTune.aeroRear}`,
    },
    {
      label: 'Front Diff (Acc / Dec)',
      before: beforeTune.diffFront || 'N/A',
      after: afterTune.diffFront || 'N/A',
    },
    {
      label: 'Rear Diff (Acc / Dec)',
      before: beforeTune.diffRear || 'N/A',
      after: afterTune.diffRear || 'N/A',
    },
    {
      label: 'Final Drive',
      before: beforeTune.finalDrive,
      after: afterTune.finalDrive,
    },
  ];

  return candidates.filter(row => row.before !== row.after);
}
