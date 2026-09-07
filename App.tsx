import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
  Modal,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  VehicleInputs,
  calculateTune,
  TuneResult,
  UnitSystem,
  CarCategory,
  Discipline,
  Drivetrain,
  EngineType,
} from './src/tuningEngine';
import { GearingChart } from './src/components/GearingChart';
import { CarSelectorModal } from './src/components/CarSelectorModal';
import { NumericInput } from './src/components/NumericInput';
import { convertInputsUnitSystem, psToHp, hpToPs } from './src/utils/units';
import { t } from './src/i18n';

const DEFAULT_INPUTS: VehicleInputs = {
  units: 'metric',
  category: 'jdm',
  discipline: 'drift',
  drivetrain: 'RWD',
  hp: 650,
  weight: 1280,
  frontWeightPct: 53.0,
  tWidthF: 245,
  tProfileF: 40,
  tRimF: 18,
  tWidthR: 275,
  tProfileR: 35,
  tRimR: 18,
  springFrontMin: 120,
  springFrontMax: 650,
  springRearMin: 120,
  springRearMax: 650,
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

export interface PresetItem {
  id: string;
  name: string;
  inputs: VehicleInputs;
}

export default function App() {
  const [inputs, setInputs] = useState<VehicleInputs>(DEFAULT_INPUTS);
  const [tune, setTune] = useState<TuneResult>(() => calculateTune(DEFAULT_INPUTS));
  const [isHydrated, setIsHydrated] = useState(false);
  const [carModalVisible, setCarModalVisible] = useState(false);
  const [presetModalVisible, setPresetModalVisible] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [savedPresets, setSavedPresets] = useState<PresetItem[]>([]);
  const [powerUnit, setPowerUnit] = useState<'hp' | 'ps'>('hp');

  useEffect(() => {
    const initStorage = async () => {
      try {
        const [savedState, savedPresetsData] = await Promise.all([
          AsyncStorage.getItem('fh_tuner_app_state'),
          AsyncStorage.getItem('fh_tuner_presets'),
        ]);

        if (savedState) {
          const parsed = JSON.parse(savedState);
          setInputs({ ...DEFAULT_INPUTS, ...parsed });
        }
        if (savedPresetsData) {
          const parsed = JSON.parse(savedPresetsData);
          if (Array.isArray(parsed)) {
            setSavedPresets(parsed);
          } else if (typeof parsed === 'object' && parsed !== null) {
            const migrated: PresetItem[] = Object.entries(parsed)
              .filter(([k]) => k !== '__proto__' && k !== 'constructor' && k !== 'prototype')
              .map(([k, val]) => ({ id: k, name: k, inputs: val as VehicleInputs }));
            setSavedPresets(migrated);
          }
        }
      } catch (e) {
        console.error('Storage initialization failed', e);
      } finally {
        setIsHydrated(true);
      }
    };

    initStorage();
  }, []);

  useEffect(() => {
    setTune(calculateTune(inputs));
    if (isHydrated) {
      AsyncStorage.setItem('fh_tuner_app_state', JSON.stringify(inputs)).catch(console.error);
    }
  }, [inputs, isHydrated]);

  const updateNumeric = (key: keyof VehicleInputs, val: number) => {
    setInputs(prev => ({ ...prev, [key]: val }));
  };

  const toggleUnits = (system: UnitSystem) => {
    if (inputs.units === system) return;
    setInputs(prev => convertInputsUnitSystem(prev, system));
  };

  const handleSavePreset = async () => {
    const trimmed = presetNameInput.trim();
    if (!trimmed) {
      Alert.alert(t('errorTitle'), t('enterPresetNameMsg'));
      return;
    }
    if (trimmed === '__proto__' || trimmed === 'constructor' || trimmed === 'prototype') {
      Alert.alert(t('errorTitle'), t('invalidPresetNameMsg'));
      return;
    }

    const existingIndex = savedPresets.findIndex(
      p => p.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (existingIndex >= 0) {
      Alert.alert(
        t('overwritePresetTitle'),
        t('overwritePresetConfirm', { name: trimmed }),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('overwrite'),
            style: 'destructive',
            onPress: async () => {
              const updated = savedPresets.map((item, index) =>
                index === existingIndex ? { id: trimmed, name: trimmed, inputs } : item
              );
              setSavedPresets(updated);
              await AsyncStorage.setItem('fh_tuner_presets', JSON.stringify(updated));
              setPresetNameInput('');
              Alert.alert(t('presetSavedTitle'), t('presetUpdatedMsg', { name: trimmed }));
            },
          },
        ]
      );
      return;
    }

    const updated: PresetItem[] = [...savedPresets, { id: trimmed, name: trimmed, inputs }];
    setSavedPresets(updated);
    await AsyncStorage.setItem('fh_tuner_presets', JSON.stringify(updated));
    setPresetNameInput('');
    Alert.alert(t('presetSavedTitle'), t('presetSavedMsg', { name: trimmed }));
  };

  const handleLoadPreset = (preset: PresetItem) => {
    setInputs({ ...DEFAULT_INPUTS, ...preset.inputs });
    setPresetModalVisible(false);
  };

  const handleDeletePreset = (preset: PresetItem) => {
    Alert.alert(t('deletePresetTitle'), t('deletePresetConfirm', { name: preset.name }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          const updated = savedPresets.filter(p => p.id !== preset.id);
          setSavedPresets(updated);
          await AsyncStorage.setItem('fh_tuner_presets', JSON.stringify(updated));
        },
      },
    ]);
  };

  const handleReset = () => {
    Alert.alert(t('resetDefaultsTitle'), t('resetDefaultsConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('reset'), style: 'destructive', onPress: () => setInputs(DEFAULT_INPUTS) },
    ]);
  };

  // Live tire diameter readouts
  const diaF = (2 * (inputs.tWidthF * (inputs.tProfileF / 100)) + inputs.tRimF * 25.4) / 1000;
  const diaR = (2 * (inputs.tWidthR * (inputs.tProfileR / 100)) + inputs.tRimR * 25.4) / 1000;
  const isImp = inputs.units === 'imperial';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0d14" translucent={false} />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('forza')}<Text style={styles.titleAccent}>{t('proTuner')}</Text></Text>
          <Text style={styles.subtitle}>{t('subtitle')}</Text>
        </View>

        {/* Top Controls */}
        <View style={styles.topBar}>
          <View style={styles.pillGroup}>
            <TouchableOpacity
              style={[styles.pillBtn, inputs.units === 'metric' && styles.pillActive]}
              onPress={() => toggleUnits('metric')}
            >
              <Text style={[styles.pillText, inputs.units === 'metric' && styles.pillTextActive]}>{t('metric')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pillBtn, inputs.units === 'imperial' && styles.pillActive]}
              onPress={() => toggleUnits('imperial')}
            >
              <Text style={[styles.pillText, inputs.units === 'imperial' && styles.pillTextActive]}>{t('imperial')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.presetBtn, { backgroundColor: '#1a2f4c', borderColor: '#2b5080' }]}
              onPress={() => setCarModalVisible(true)}
            >
              <Text style={[styles.presetBtnText, { color: '#00e5ff' }]}>{t('cars')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetBtn} onPress={() => setPresetModalVisible(true)}>
              <Text style={styles.presetBtnText}>{t('garage')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>{t('reset')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. CHASSIS & POWER */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('chassisAndPower')}</Text>

          <Text style={styles.label}>{t('carCategory')}</Text>
          <View style={styles.pillGroupFull}>
            {([
              { key: 'jdm', label: t('jdmLabel') },
              { key: 'track', label: t('trackLabel') },
              { key: 'classic', label: t('classicLabel') },
              { key: 'supercar', label: t('supercarLabel') },
            ] as { key: CarCategory; label: string }[]).map(c => (
              <TouchableOpacity
                key={c.key}
                style={[styles.subPill, inputs.category === c.key && styles.subPillActive]}
                onPress={() => setInputs(p => ({ ...p, category: c.key }))}
              >
                <Text style={[styles.subPillText, inputs.category === c.key && styles.subPillTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t('disciplineSurface')}</Text>
          <View style={styles.pillGroupFull}>
            {(['drift', 'grip', 'dirt', 'offroad', 'drag'] as Discipline[]).map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.subPill, inputs.discipline === d && styles.subPillActive]}
                onPress={() => setInputs(p => ({ ...p, discipline: d }))}
              >
                <Text style={[styles.subPillText, inputs.discipline === d && styles.subPillTextActive]}>{d.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t('drivetrain')}</Text>
          <View style={styles.pillGroupFull}>
            {(['RWD', 'AWD', 'FWD'] as Drivetrain[]).map(dt => (
              <TouchableOpacity
                key={dt}
                style={[styles.subPill, inputs.drivetrain === dt && styles.subPillActive]}
                onPress={() => setInputs(p => ({ ...p, drivetrain: dt }))}
              >
                <Text style={[styles.subPillText, inputs.drivetrain === dt && styles.subPillTextActive]}>{dt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={styles.label}>{t('power')}</Text>
                <View style={{ flexDirection: 'row', backgroundColor: '#0b0e17', borderRadius: 4, padding: 1, borderWidth: 1, borderColor: '#232b3b' }}>
                  <TouchableOpacity
                    style={[{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 }, powerUnit === 'hp' && { backgroundColor: '#00e5ff' }]}
                    onPress={() => setPowerUnit('hp')}
                  >
                    <Text style={[{ fontSize: 9, fontWeight: '700', color: '#8b9bb4' }, powerUnit === 'hp' && { color: '#0a0d14' }]}>{t('hpUnit')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 }, powerUnit === 'ps' && { backgroundColor: '#00e5ff' }]}
                    onPress={() => setPowerUnit('ps')}
                  >
                    <Text style={[{ fontSize: 9, fontWeight: '700', color: '#8b9bb4' }, powerUnit === 'ps' && { color: '#0a0d14' }]}>{t('psUnit')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <NumericInput
                value={powerUnit === 'ps' ? Math.round(hpToPs(inputs.hp)) : inputs.hp}
                min={30}
                max={3000}
                onValueChange={v => updateNumeric('hp', powerUnit === 'ps' ? psToHp(v) : v)}
              />
              <Text style={{ fontSize: 9, color: '#63738a', marginTop: 2 }}>
                {powerUnit === 'ps' ? t('approxHp', { val: inputs.hp }) : t('approxPs', { val: Math.round(hpToPs(inputs.hp)) })}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>{t('weight', { unit: isImp ? 'lbs' : 'kg' })}</Text>
              <NumericInput
                value={inputs.weight}
                min={300}
                max={9000}
                onValueChange={v => updateNumeric('weight', v)}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>{t('frontWeightPct')}</Text>
              <NumericInput
                value={inputs.frontWeightPct}
                decimals={1}
                min={30}
                max={75}
                onValueChange={v => updateNumeric('frontWeightPct', v)}
              />
            </View>
          </View>
        </View>

        {/* 2. TIRE SIZES & KINEMATICS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('frontRearTireSizes')}</Text>

          <Text style={styles.label}>{t('frontTireLabel')}</Text>
          <View style={styles.row}>
            <NumericInput
              style={styles.col}
              placeholder={t('placeholderWidth')}
              value={inputs.tWidthF}
              min={125}
              max={455}
              onValueChange={v => updateNumeric('tWidthF', v)}
            />
            <NumericInput
              style={styles.col}
              placeholder={t('placeholderProfile')}
              value={inputs.tProfileF}
              min={15}
              max={85}
              onValueChange={v => updateNumeric('tProfileF', v)}
            />
            <NumericInput
              style={styles.col}
              placeholder={t('placeholderRim')}
              value={inputs.tRimF}
              min={12}
              max={26}
              onValueChange={v => updateNumeric('tRimF', v)}
            />
          </View>
          <Text style={styles.badgeInfo}>
            {t('frontDiaCirc', {
              dia: isImp ? `${(diaF * 39.3701).toFixed(1)} in` : `${(diaF * 100).toFixed(1)} cm`,
              circ: isImp ? `${(Math.PI * diaF * 3.28084).toFixed(2)} ft` : `${(Math.PI * diaF).toFixed(2)} m`,
            })}
          </Text>

          <Text style={[styles.label, { marginTop: 10 }]}>{t('rearTireLabel')}</Text>
          <View style={styles.row}>
            <NumericInput
              style={styles.col}
              placeholder={t('placeholderWidth')}
              value={inputs.tWidthR}
              min={125}
              max={455}
              onValueChange={v => updateNumeric('tWidthR', v)}
            />
            <NumericInput
              style={styles.col}
              placeholder={t('placeholderProfile')}
              value={inputs.tProfileR}
              min={15}
              max={85}
              onValueChange={v => updateNumeric('tProfileR', v)}
            />
            <NumericInput
              style={styles.col}
              placeholder={t('placeholderRim')}
              value={inputs.tRimR}
              min={12}
              max={26}
              onValueChange={v => updateNumeric('tRimR', v)}
            />
          </View>
          <Text style={styles.badgeInfo}>
            {t('rearDiaCirc', {
              dia: isImp ? `${(diaR * 39.3701).toFixed(1)} in` : `${(diaR * 100).toFixed(1)} cm`,
              circ: isImp ? `${(Math.PI * diaR * 3.28084).toFixed(2)} ft` : `${(Math.PI * diaR).toFixed(2)} m`,
            })}
          </Text>
        </View>

        {/* 3. SUSPENSION & RIDE HEIGHT BOUNDS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('sliderLimits')}</Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>{t('frontSprings', { unit: isImp ? 'lb/in' : 'kgf/mm' })}</Text>
              <View style={styles.rowTight}>
                <NumericInput
                  style={styles.inputHalf}
                  placeholder={t('placeholderMin')}
                  value={inputs.springFrontMin}
                  decimals={1}
                  onValueChange={v => updateNumeric('springFrontMin', v)}
                />
                <NumericInput
                  style={styles.inputHalf}
                  placeholder={t('placeholderMax')}
                  value={inputs.springFrontMax}
                  decimals={1}
                  onValueChange={v => updateNumeric('springFrontMax', v)}
                />
              </View>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>{t('rearSprings', { unit: isImp ? 'lb/in' : 'kgf/mm' })}</Text>
              <View style={styles.rowTight}>
                <NumericInput
                  style={styles.inputHalf}
                  placeholder={t('placeholderMin')}
                  value={inputs.springRearMin}
                  decimals={1}
                  onValueChange={v => updateNumeric('springRearMin', v)}
                />
                <NumericInput
                  style={styles.inputHalf}
                  placeholder={t('placeholderMax')}
                  value={inputs.springRearMax}
                  decimals={1}
                  onValueChange={v => updateNumeric('springRearMax', v)}
                />
              </View>
            </View>
          </View>

          <View style={[styles.row, { marginTop: 6 }]}>
            <View style={styles.col}>
              <Text style={styles.label}>{t('frontRideHeight', { unit: isImp ? 'in' : 'cm' })}</Text>
              <View style={styles.rowTight}>
                <NumericInput
                  style={styles.inputHalf}
                  placeholder={t('placeholderMin')}
                  value={inputs.heightFrontMin}
                  decimals={1}
                  onValueChange={v => updateNumeric('heightFrontMin', v)}
                />
                <NumericInput
                  style={styles.inputHalf}
                  placeholder={t('placeholderMax')}
                  value={inputs.heightFrontMax}
                  decimals={1}
                  onValueChange={v => updateNumeric('heightFrontMax', v)}
                />
              </View>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>{t('rearRideHeight', { unit: isImp ? 'in' : 'cm' })}</Text>
              <View style={styles.rowTight}>
                <NumericInput
                  style={styles.inputHalf}
                  placeholder={t('placeholderMin')}
                  value={inputs.heightRearMin}
                  decimals={1}
                  onValueChange={v => updateNumeric('heightRearMin', v)}
                />
                <NumericInput
                  style={styles.inputHalf}
                  placeholder={t('placeholderMax')}
                  value={inputs.heightRearMax}
                  decimals={1}
                  onValueChange={v => updateNumeric('heightRearMax', v)}
                />
              </View>
            </View>
          </View>
        </View>

        {/* 4. AERO DOWNFORCE BOUNDS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('aeroLimits')}</Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>{t('frontAero', { unit: isImp ? 'lbf' : 'kgf' })}</Text>
              <View style={styles.rowTight}>
                <NumericInput
                  style={styles.inputHalf}
                  placeholder={t('placeholderMin')}
                  value={inputs.aeroFrontMin}
                  onValueChange={v => updateNumeric('aeroFrontMin', v)}
                />
                <NumericInput
                  style={styles.inputHalf}
                  placeholder={t('placeholderMax')}
                  value={inputs.aeroFrontMax}
                  onValueChange={v => updateNumeric('aeroFrontMax', v)}
                />
              </View>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>{t('rearAero', { unit: isImp ? 'lbf' : 'kgf' })}</Text>
              <View style={styles.rowTight}>
                <NumericInput
                  style={styles.inputHalf}
                  placeholder={t('placeholderMin')}
                  value={inputs.aeroRearMin}
                  onValueChange={v => updateNumeric('aeroRearMin', v)}
                />
                <NumericInput
                  style={styles.inputHalf}
                  placeholder={t('placeholderMax')}
                  value={inputs.aeroRearMax}
                  onValueChange={v => updateNumeric('aeroRearMax', v)}
                />
              </View>
            </View>
          </View>
        </View>

        {/* 5. ENGINE & GEARING SPECS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('engineTransmissionSpecs')}</Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>{t('redlineRpm')}</Text>
              <NumericInput
                value={inputs.redlineRpm}
                min={2000}
                max={22000}
                onValueChange={v => updateNumeric('redlineRpm', v)}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>{t('topSpeed', { unit: isImp ? 'mph' : 'km/h' })}</Text>
              <NumericInput
                value={inputs.topSpeed}
                min={50}
                max={550}
                onValueChange={v => updateNumeric('topSpeed', v)}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>{t('gears')}</Text>
              <NumericInput
                value={inputs.numGears}
                min={1}
                max={10}
                decimals={0}
                onValueChange={v => updateNumeric('numGears', v)}
              />
            </View>
          </View>

          <Text style={[styles.label, { marginTop: 8 }]}>{t('powerBandCurve')}</Text>
          <View style={styles.pillGroupFull}>
            {([
              { key: 'balanced', label: t('balancedTurbo') },
              { key: 'highrev', label: t('highRevNA') },
              { key: 'torque', label: t('highTorque') },
              { key: 'ev', label: t('electricEV') },
            ] as { key: EngineType; label: string }[]).map(et => (
              <TouchableOpacity
                key={et.key}
                style={[styles.subPill, inputs.engineType === et.key && styles.subPillActive]}
                onPress={() => {
                  setInputs(p => ({
                    ...p,
                    engineType: et.key,
                    ...(et.key === 'ev' && p.numGears > 2
                      ? { numGears: 1, redlineRpm: Math.max(p.redlineRpm, 16000) }
                      : {}),
                  }));
                }}
              >
                <Text style={[styles.subPillText, inputs.engineType === et.key && styles.subPillTextActive]}>{et.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* OUTPUT RESULTS CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitleAccent}>{t('calculatedTuneSetup')}</Text>

          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>{t('tirePressureFR')}</Text>
            <Text style={styles.outVal}>{`${tune.tireFront} / ${tune.tireRear}`}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>{t('camberFR')}</Text>
            <Text style={styles.outVal}>{`${tune.camberFront} / ${tune.camberRear}`}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>{t('toeFR')}</Text>
            <Text style={styles.outVal}>{`${tune.toeFront} / ${tune.toeRear}`}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>{t('casterAngle')}</Text>
            <Text style={styles.outVal}>{tune.caster}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>{t('arbFR')}</Text>
            <Text style={styles.outVal}>{`${tune.arbFront} / ${tune.arbRear}`}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>{t('springsFR')}</Text>
            <Text style={styles.outVal}>{`${tune.springFront} / ${tune.springRear}`}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>{t('rideHeightFR')}</Text>
            <Text style={styles.outVal}>{`${tune.heightFront} / ${tune.heightRear}`}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>{t('reboundDampingFR')}</Text>
            <Text style={styles.outVal}>{`${tune.rebFront} / ${tune.rebRear}`}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>{t('bumpDampingFR')}</Text>
            <Text style={styles.outVal}>{`${tune.bmpFront} / ${tune.bmpRear}`}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>{t('aeroDownforceFR')}</Text>
            <Text style={styles.outVal}>{`${tune.aeroFront} / ${tune.aeroRear}`}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>{t('brakesBalancePressure')}</Text>
            <Text style={styles.outVal}>{`${tune.brakeBalance} / ${tune.brakePressure}`}</Text>
          </View>

          {/* Differential Order Matching Forza Menu: Front -> Rear -> Center */}
          {tune.diffFront && (
            <View style={styles.outputRow}>
              <Text style={styles.outLabel}>{t('frontDiffAccDec')}</Text>
              <Text style={styles.outVal}>{tune.diffFront}</Text>
            </View>
          )}
          {tune.diffRear && (
            <View style={styles.outputRow}>
              <Text style={styles.outLabel}>{t('rearDiffAccDec')}</Text>
              <Text style={styles.outVal}>{tune.diffRear}</Text>
            </View>
          )}
          {tune.diffCenter && (
            <View style={styles.outputRow}>
              <Text style={styles.outLabel}>{t('centerDiffBias')}</Text>
              <Text style={styles.outVal}>{tune.diffCenter}</Text>
            </View>
          )}

          <Text style={styles.sectionDivider}>{t('gearingTransmission')}</Text>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>{t('calculatedFinalDrive')}</Text>
            <Text style={styles.outVal}>{tune.finalDrive}</Text>
          </View>

          <View style={styles.gearsGrid}>
            {tune.gearRatios.map((ratio, idx) => (
              <View key={`g-${idx}`} style={styles.gearPill}>
                <Text style={styles.gearLabel}>{t('gearPrefix', { num: idx + 1 })}</Text>
                <Text style={styles.gearVal}>{ratio.toFixed(2)}</Text>
              </View>
            ))}
          </View>

          <GearingChart
            gearRatios={tune.gearRatios}
            finalDrive={parseFloat(tune.finalDrive) || 3.5}
            redlineRpm={tune.redlineRpm}
            driveCircumferenceM={tune.driveCircumferenceM}
            targetSpeed={tune.targetSpeedDisplay}
            units={inputs.units}
          />
        </View>

        {/* CAR SELECTOR MODAL */}
        <CarSelectorModal
          visible={carModalVisible}
          onClose={() => setCarModalVisible(false)}
          onSelectCar={(specs: Partial<VehicleInputs>) => setInputs(prev => ({ ...prev, ...specs }))}
          units={inputs.units}
        />

        {/* GARAGE PRESET MODAL */}
        <Modal visible={presetModalVisible} animationType="slide" transparent onRequestClose={() => setPresetModalVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('carGaragePresets')}</Text>

              <View style={styles.saveRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={t('newPresetPlaceholder')}
                  placeholderTextColor="#63738a"
                  value={presetNameInput}
                  onChangeText={setPresetNameInput}
                />
                <TouchableOpacity style={styles.saveActionBtn} onPress={handleSavePreset}>
                  <Text style={styles.saveActionBtnText}>{t('save')}</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { marginTop: 12 }]}>{t('savedVehicles')}</Text>
              {savedPresets.length === 0 ? (
                <Text style={styles.emptyText}>{t('noPresetsSaved')}</Text>
              ) : (
                <FlatList
                  data={savedPresets}
                  keyExtractor={item => item.id}
                  style={{ maxHeight: 200 }}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <View style={styles.presetItem}>
                      <TouchableOpacity style={{ flex: 1 }} onPress={() => handleLoadPreset(item)}>
                        <Text style={styles.presetItemText}>{item.name}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeletePreset(item)} style={{ padding: 4 }}>
                        <Text style={styles.deleteBtnText}>{t('delete')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )}

              <TouchableOpacity style={styles.closeBtn} onPress={() => setPresetModalVisible(false)}>
                <Text style={styles.closeBtnText}>{t('close')}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0d14',
  },
  container: { padding: 14, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 14, marginTop: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#f0f6fc', letterSpacing: 1 },
  titleAccent: { color: '#ff007a' },
  subtitle: { fontSize: 11, color: '#8b9bb4', marginTop: 4 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pillGroup: { flexDirection: 'row', backgroundColor: '#141923', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#232b3b' },
  pillBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  pillActive: { backgroundColor: '#ff007a' },
  pillText: { color: '#8b9bb4', fontSize: 12, fontWeight: '600' },
  pillTextActive: { color: '#fff' },
  actionRow: { flexDirection: 'row', gap: 6 },
  presetBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#1f3a2b', borderRadius: 6, borderWidth: 1, borderColor: '#2e6244' },
  presetBtnText: { color: '#39d353', fontSize: 12, fontWeight: '600' },
  resetBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#3b141b', borderRadius: 6, borderWidth: 1, borderColor: '#63222d' },
  resetBtnText: { color: '#ff6b81', fontSize: 12, fontWeight: '600' },
  card: { backgroundColor: '#141923', borderWidth: 1, borderColor: '#232b3b', borderRadius: 12, padding: 14, marginBottom: 14 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#00e5ff', textTransform: 'uppercase', marginBottom: 8 },
  cardTitleAccent: { fontSize: 13, fontWeight: '700', color: '#ff007a', textTransform: 'uppercase', marginBottom: 8 },
  label: { fontSize: 11, color: '#8b9bb4', marginBottom: 4, fontWeight: '500' },
  badgeInfo: { fontSize: 10, color: '#00e5ff', marginTop: 3, fontStyle: 'italic' },
  pillGroupFull: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  subPill: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#0b0e17', borderRadius: 6, borderWidth: 1, borderColor: '#232b3b' },
  subPillActive: { backgroundColor: '#00e5ff', borderColor: '#00e5ff' },
  subPillText: { color: '#8b9bb4', fontSize: 11, fontWeight: '600' },
  subPillTextActive: { color: '#0a0d14' },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  rowTight: { flexDirection: 'row', gap: 4, flex: 1 },
  col: { flex: 1 },
  input: { backgroundColor: '#0b0e17', borderWidth: 1, borderColor: '#232b3b', borderRadius: 6, color: '#f0f6fc', paddingHorizontal: 8, paddingVertical: 6, fontSize: 13 },
  inputHalf: { flex: 1 },
  sectionDivider: { fontSize: 11, fontWeight: '700', color: '#f0f6fc', marginTop: 8, marginBottom: 8, borderTopWidth: 1, borderTopColor: '#232b3b', paddingTop: 8 },
  outputRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#1a2233' },
  outLabel: { color: '#8b9bb4', fontSize: 12 },
  outVal: { color: '#39d353', fontWeight: '700', fontSize: 12 },
  gearsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
  gearPill: { backgroundColor: '#0b0e17', borderWidth: 1, borderColor: '#232b3b', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  gearLabel: { fontSize: 9, color: '#8b9bb4' },
  gearVal: { fontSize: 12, fontWeight: '700', color: '#39d353' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 500, backgroundColor: '#141923', borderWidth: 1, borderColor: '#232b3b', borderRadius: 12, padding: 18 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#00e5ff', textTransform: 'uppercase', marginBottom: 12 },
  saveRow: { flexDirection: 'row', gap: 8 },
  saveActionBtn: { backgroundColor: '#1f3a2b', borderWidth: 1, borderColor: '#2e6244', paddingHorizontal: 14, justifyContent: 'center', borderRadius: 6 },
  saveActionBtnText: { color: '#39d353', fontWeight: '700', fontSize: 12 },
  emptyText: { color: '#63738a', fontSize: 12, fontStyle: 'italic', marginVertical: 8 },
  presetItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#232b3b' },
  presetItemText: { color: '#f0f6fc', fontSize: 13, fontWeight: '600' },
  deleteBtnText: { color: '#ff6b81', fontSize: 11, fontWeight: '600' },
  closeBtn: { marginTop: 14, backgroundColor: '#0b0e17', borderWidth: 1, borderColor: '#232b3b', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  closeBtnText: { color: '#8b9bb4', fontSize: 12, fontWeight: '600' },
});