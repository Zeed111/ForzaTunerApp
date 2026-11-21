import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CarCategory,
  DEFAULT_INPUTS,
  Discipline,
  Drivetrain,
  EngineType,
  VehicleInputs,
  calculateTune,
} from '../index';
import { SYMPTOMS } from '../tuneDoctorRules';
import { convertInputsUnitSystem, FORZA_SPRING_TO_LB_IN } from '../../utils/units';

const CATEGORIES: CarCategory[] = ['jdm', 'sports', 'classic', 'track', 'supercar', 'offroad'];
const DISCIPLINES: Discipline[] = ['drift', 'grip', 'dirt', 'offroad', 'drag'];
const DRIVETRAINS: Drivetrain[] = ['RWD', 'AWD', 'FWD'];
const ENGINE_TYPES: EngineType[] = ['balanced', 'highrev', 'torque', 'ev'];

function assertNoNaN(obj: unknown, path = 'root'): void {
  if (typeof obj === 'number') {
    assert.ok(Number.isFinite(obj), `Expected finite number at ${path}, got ${obj}`);
    return;
  }
  if (typeof obj === 'string') {
    assert.ok(!obj.includes('NaN') && !obj.includes('Infinity'), `Invalid string at ${path}: ${obj}`);
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => assertNoNaN(item, `${path}[${idx}]`));
    return;
  }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        assertNoNaN(v, `${path}.${k}`);
      }
    }
  }
}

test('exhaustive 720-build matrix stays within Forza slider bounds with zero NaNs', () => {
  const imperialBase = convertInputsUnitSystem(DEFAULT_INPUTS, 'imperial');
  let count = 0;

  for (const unitSystem of ['metric', 'imperial'] as const) {
    const template = unitSystem === 'imperial' ? imperialBase : DEFAULT_INPUTS;
    for (const category of CATEGORIES) {
      for (const discipline of DISCIPLINES) {
        for (const drivetrain of DRIVETRAINS) {
          for (const engineType of ENGINE_TYPES) {
            const build: VehicleInputs = {
              ...template,
              category,
              discipline,
              drivetrain,
              engineType,
              numGears: engineType === 'ev' ? 1 : 6,
              redlineRpm: engineType === 'ev' ? 18000 : 8000,
            };
            const res = calculateTune(build);
            count++;

            assertNoNaN(res, `${unitSystem}/${category}/${discipline}/${drivetrain}/${engineType}`);

            const cF = parseFloat(res.camberFront);
            const cR = parseFloat(res.camberRear);
            assert.ok(cF >= -5.0 && cF <= 0.0, `Front camber out of bounds: ${cF}`);
            assert.ok(cR >= -5.0 && cR <= 0.0, `Rear camber out of bounds: ${cR}`);

            assert.ok(
              Math.abs(res.raw.toeFrontDeg * 10 - Math.round(res.raw.toeFrontDeg * 10)) < 1e-6,
              `Front toe not stepped by 0.1: ${res.raw.toeFrontDeg}`
            );
            assert.ok(
              Math.abs(res.raw.toeRearDeg * 10 - Math.round(res.raw.toeRearDeg * 10)) < 1e-6,
              `Rear toe not stepped by 0.1: ${res.raw.toeRearDeg}`
            );
            assert.ok(
              res.toeFront === '0.0°' || res.toeFront.endsWith('° Out') || res.toeFront.endsWith('° In'),
              `Unexpected toe format: ${res.toeFront}`
            );

            const caster = parseFloat(res.caster);
            assert.ok(caster >= 4.5 && caster <= 7.0, `Caster out of bounds: ${caster}`);

            const fd = parseFloat(res.finalDrive);
            assert.ok(fd >= 2.20 && fd <= 6.10, `Final drive out of Forza range: ${fd}`);

            res.gearRatios.forEach((ratio, idx) => {
              assert.ok(ratio >= 0.48 && ratio <= 6.00, `Gear ${idx + 1} ratio out of range: ${ratio}`);
              if (idx > 0) {
                assert.ok(
                  ratio < res.gearRatios[idx - 1],
                  `Gear ${idx + 1} (${ratio}) not strictly < Gear ${idx} (${res.gearRatios[idx - 1]})`
                );
              }
            });

            const arbF = parseFloat(res.arbFront);
            const arbR = parseFloat(res.arbRear);
            assert.ok(arbF >= 1.0 && arbF <= 65.0, `Front ARB out of bounds: ${arbF}`);
            assert.ok(arbR >= 1.0 && arbR <= 65.0, `Rear ARB out of bounds: ${arbR}`);

            const rebF = parseFloat(res.rebFront);
            const rebR = parseFloat(res.rebRear);
            const bmpF = parseFloat(res.bmpFront);
            const bmpR = parseFloat(res.bmpRear);
            for (const d of [rebF, rebR, bmpF, bmpR]) {
              assert.ok(d >= 1.0 && d <= 20.0, `Damping out of bounds: ${d}`);
            }

            const brakeSlider = parseInt(res.brakeBalance, 10);
            assert.ok(brakeSlider >= 45 && brakeSlider <= 53, `Brake slider out of bounds: ${brakeSlider}`);
            assert.ok(res.brakeBalanceNote?.includes('FH Slider Inverted'));
          }
        }
      }
    }
  }

  assert.equal(count, 720);

  // Verify 1..10 gear counts all stay strictly decreasing and within Forza limits
  for (let gears = 1; gears <= 10; gears++) {
    const res = calculateTune({ ...DEFAULT_INPUTS, numGears: gears });
    assert.equal(res.gearRatios.length, gears);
    const fd = parseFloat(res.finalDrive);
    assert.ok(fd >= 2.20 && fd <= 6.10, `FD for ${gears} gears out of bounds: ${fd}`);
    res.gearRatios.forEach((r, idx) => {
      assert.ok(r >= 0.48 && r <= 6.00);
      if (idx > 0) assert.ok(r < res.gearRatios[idx - 1]);
    });
  }
});

test('metric <-> imperial conversion preserves realistic spring rates and tune parity', () => {
  assert.ok(Math.abs(100 * FORZA_SPRING_TO_LB_IN - 560) < 0.1);

  const imperial = convertInputsUnitSystem(DEFAULT_INPUTS, 'imperial');
  assert.ok(imperial.springFrontMin > 150 && imperial.springFrontMin < 250);
  assert.ok(imperial.springFrontMax > 1000 && imperial.springFrontMax < 1500);

  const roundTrip = convertInputsUnitSystem(imperial, 'metric');
  assert.ok(Math.abs(roundTrip.springFrontMin - DEFAULT_INPUTS.springFrontMin) <= 0.2);
  assert.ok(Math.abs(roundTrip.springFrontMax - DEFAULT_INPUTS.springFrontMax) <= 0.2);
  assert.ok(Math.abs(roundTrip.weight - DEFAULT_INPUTS.weight) <= 1);

  const metricTune = calculateTune({ ...DEFAULT_INPUTS, discipline: 'grip' });
  const imperialTune = calculateTune({ ...imperial, discipline: 'grip' });

  assert.equal(metricTune.camberFront, imperialTune.camberFront);
  assert.equal(metricTune.toeFront, imperialTune.toeFront);
  assert.equal(metricTune.arbFront, imperialTune.arbFront);
  assert.equal(metricTune.arbRear, imperialTune.arbRear);
  assert.equal(metricTune.rebFront, imperialTune.rebFront);
  assert.equal(metricTune.brakeBalance, imperialTune.brakeBalance);
  assert.ok(Math.abs(parseFloat(metricTune.finalDrive) - parseFloat(imperialTune.finalDrive)) <= 0.02);

  const metricFrontPsi = parseFloat(metricTune.tireFrontCold) * 14.5038;
  const impFrontPsi = parseFloat(imperialTune.tireFrontCold);
  assert.ok(Math.abs(metricFrontPsi - impFrontPsi) <= 0.2);
});

test('Forza physics invariants: AWD/FWD ARBs, drift pressures, EV gearing, drag stance, inverted brake bias', () => {
  // AWD & FWD grip should have softer front ARB than rear ARB to curb understeer
  for (const dt of ['AWD', 'FWD'] as const) {
    const gripTune = calculateTune({
      ...DEFAULT_INPUTS,
      discipline: 'grip',
      drivetrain: dt,
      frontWeightPct: 58,
      handlingBias: 0,
    });
    assert.ok(
      parseFloat(gripTune.arbFront) < parseFloat(gripTune.arbRear),
      `${dt} grip ARB should favor rotation: F=${gripTune.arbFront}, R=${gripTune.arbRear}`
    );
  }

  // Drift should run lower rear cold pressure than front cold pressure
  const driftTune = calculateTune({ ...DEFAULT_INPUTS, discipline: 'drift', tireCompound: 'drift' });
  assert.ok(parseFloat(driftTune.tireRearCold) < parseFloat(driftTune.tireFrontCold));

  // High-RPM 1-speed & 2-speed EV must stay within FD <= 6.10 and gearRatio <= 6.00 while hitting speed target
  const ev1 = calculateTune({
    ...DEFAULT_INPUTS,
    discipline: 'grip',
    drivetrain: 'AWD',
    hp: 1000,
    engineType: 'ev',
    numGears: 1,
    redlineRpm: 18000,
    topSpeed: 300,
  });
  assert.ok(parseFloat(ev1.finalDrive) <= 6.10);
  assert.ok(ev1.gearRatios[0] <= 6.00 && ev1.gearRatios[0] >= 0.48);
  assert.ok(ev1.gearMaxSpeeds[0] >= 295);

  const ev2 = calculateTune({
    ...DEFAULT_INPUTS,
    discipline: 'grip',
    drivetrain: 'AWD',
    hp: 750,
    engineType: 'ev',
    numGears: 2,
    redlineRpm: 16000,
    topSpeed: 280,
  });
  assert.ok(parseFloat(ev2.finalDrive) <= 6.10);
  assert.ok(ev2.gearRatios[0] <= 6.00 && ev2.gearRatios[1] < ev2.gearRatios[0]);

  // Drag setup: higher front ride height & softer front springs for weight transfer
  const dragTune = calculateTune({ ...DEFAULT_INPUTS, discipline: 'drag' });
  assert.ok(parseFloat(dragTune.heightFront) > parseFloat(dragTune.heightRear));
  assert.ok(parseFloat(dragTune.springFront) < parseFloat(dragTune.springRear));

  // Front-heavy track build outputs < 50% on Forza's inverted brake slider
  const trackTune = calculateTune({
    ...DEFAULT_INPUTS,
    category: 'track',
    discipline: 'grip',
    frontWeightPct: 54,
  });
  assert.ok(parseInt(trackTune.brakeBalance, 10) < 50);
  assert.equal(trackTune.brakeBalance, '49% (Forza Slider)');
  assert.ok(trackTune.brakeBalanceNote?.includes('51% Front Physics'));
});

test('Tune Doctor symptoms are non-destructive, reversible, and drivetrain-aware', () => {
  for (const drivetrain of DRIVETRAINS) {
    const baseInputs: VehicleInputs = { ...DEFAULT_INPUTS, drivetrain, discipline: 'grip' };
    const baseTune = calculateTune(baseInputs);

    for (const symptom of SYMPTOMS) {
      const { updated } = symptom.apply(baseInputs);

      assert.equal(updated.heightFrontMin, baseInputs.heightFrontMin);
      assert.equal(updated.heightRearMin, baseInputs.heightRearMin);
      assert.equal(updated.aeroFrontMin, baseInputs.aeroFrontMin);
      assert.equal(updated.tWidthF, baseInputs.tWidthF);
      assert.equal(updated.tWidthR, baseInputs.tWidthR);

      if (symptom.id === 'launch_wheelspin' && drivetrain === 'FWD') {
        assert.ok((updated.doctorOffsets?.tireBarDeltaF ?? 0) < 0);
        assert.equal(updated.doctorOffsets?.tireBarDeltaR, undefined);
        assert.ok((updated.doctorOffsets?.diffFrontAccDelta ?? 0) < 0);
      }

      const { doctorOffsets: _clearedOffsets, ...withoutOffsets } = updated;
      void _clearedOffsets;
      const reset: VehicleInputs = {
        ...withoutOffsets,
        handlingBias: 0,
      };
      assert.deepEqual(reset, baseInputs);
      assert.deepEqual(calculateTune(reset), baseTune);
    }
  }
});
