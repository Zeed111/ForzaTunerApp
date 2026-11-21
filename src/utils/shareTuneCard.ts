import { Platform, Share } from 'react-native';
import { TuneResult, VehicleInputs } from '../types/tuning';

export function formatShareableTuneCard(inputs: VehicleInputs, tune: TuneResult): string {
  const title = inputs.carName || 'Custom Spec Build';
  const pi = inputs.piClass || 'A';
  const unitWeight = inputs.units === 'imperial' ? 'lbs' : 'kg';
  const gearLine = tune.gearRatios.map((r, i) => `G${i + 1}: ${r.toFixed(2)}`).join(' | ');

  const lines: string[] = [
    `🏁 FORZA PRO TUNER — [${pi}] ${title}`,
    `Spec: ${inputs.discipline.toUpperCase()} • ${inputs.drivetrain} • ${Math.round(inputs.hp)} HP • ${inputs.weight} ${unitWeight} (${inputs.frontWeightPct}% F)`,
    ``,
    `1. TIRES (Cold / Hot):`,
    `   • Front: ${tune.tireFrontCold} (Hot: ${tune.tireFrontHot})`,
    `   • Rear:  ${tune.tireRearCold} (Hot: ${tune.tireRearHot})`,
    `2. GEARING (Est. Aero Top: ${tune.estimatedTopSpeed}):`,
    `   • Final Drive: ${tune.finalDrive}`,
    `   • Ratios: ${gearLine}`,
    `3. ALIGNMENT:`,
    `   • Camber (F / R): ${tune.camberFront} / ${tune.camberRear}`,
    `   • Toe (F / R):    ${tune.toeFront} / ${tune.toeRear}`,
    `   • Caster:         ${tune.caster}`,
    `4. ANTI-ROLL BARS (F / R): ${tune.arbFront} / ${tune.arbRear}`,
    `5. SPRINGS & RIDE HEIGHT:`,
    `   • Springs (F / R):     ${tune.springFront} / ${tune.springRear}`,
    `   • Ride Height (F / R): ${tune.heightFront} / ${tune.heightRear}`,
    `6. DAMPING:`,
    `   • Rebound (F / R): ${tune.rebFront} / ${tune.rebRear}`,
    `   • Bump (F / R):    ${tune.bmpFront} / ${tune.bmpRear}`,
    `7. AERO DOWNFORCE (F / R): ${tune.aeroFront} / ${tune.aeroRear}`,
    `8. BRAKES: Balance ${tune.brakeBalance}${tune.brakeBalanceNote ? ` (${tune.brakeBalanceNote})` : ''} | Pressure ${tune.brakePressure}`,
    `9. DIFFERENTIAL:`,
  ];

  if (tune.diffFront) lines.push(`   • Front (Acc / Dec): ${tune.diffFront}`);
  if (tune.diffRear) lines.push(`   • Rear (Acc / Dec):  ${tune.diffRear}`);
  if (tune.diffCenter) lines.push(`   • Center Bias:       ${tune.diffCenter}`);

  return lines.join('\n');
}

export async function copyOrShareText(text: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      await Share.share({ message: text });
    }
    return true;
  } catch {
    return false;
  }
}
