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
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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
  TireCompound,
} from './src/tuningEngine';
import { GearingChart } from './src/components/GearingChart';
import { CarSelectorModal } from './src/components/CarSelectorModal';
import { TuneDoctorModal } from './src/components/TuneDoctorModal';
import { CompanionChecklistModal } from './src/components/CompanionChecklistModal';
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
  tireCompound: 'sport',
  handlingBias: 0,
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
  const [doctorModalVisible, setDoctorModalVisible] = useState(false);
  const [checklistModalVisible, setChecklistModalVisible] = useState(false);
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
    <SafeAreaProvider style={styles.provider}>
      <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#070a10" translucent={false} />
      <ScrollView
        style={styles.scrollView}
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
              style={[styles.presetBtn, { backgroundColor: '#0e1c2c', borderColor: '#173452' }]}
              onPress={() => setCarModalVisible(true)}
            >
              <Text style={[styles.presetBtnText, { color: '#00f0ff' }]}>{t('cars')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetBtn, { backgroundColor: '#1f132b', borderColor: '#4a195e' }]}
              onPress={() => setDoctorModalVisible(true)}
            >
              <Text style={[styles.presetBtnText, { color: '#d946ef' }]}>{`🩺 ${t('doctor')}`}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetBtn, { backgroundColor: '#072419', borderColor: '#0f5238' }]}
              onPress={() => setChecklistModalVisible(true)}
            >
              <Text style={[styles.presetBtnText, { color: '#00ff9d' }]}>{`📋 ${t('checklist')}`}</Text>
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
                <View style={{ flexDirection: 'row', backgroundColor: '#070a10', borderRadius: 4, padding: 1, borderWidth: 1, borderColor: '#1e2638' }}>
                  <TouchableOpacity
                    style={[{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 }, powerUnit === 'hp' && { backgroundColor: '#ff1744' }]}
                    onPress={() => setPowerUnit('hp')}
                  >
                    <Text style={[{ fontSize: 9, fontWeight: '700', color: '#8a99ad' }, powerUnit === 'hp' && { color: '#ffffff' }]}>{t('hpUnit')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 }, powerUnit === 'ps' && { backgroundColor: '#ff1744' }]}
                    onPress={() => setPowerUnit('ps')}
                  >
                    <Text style={[{ fontSize: 9, fontWeight: '700', color: '#8a99ad' }, powerUnit === 'ps' && { color: '#ffffff' }]}>{t('psUnit')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <NumericInput
                value={powerUnit === 'ps' ? Math.round(hpToPs(inputs.hp)) : inputs.hp}
                min={30}
                max={3000}
                onValueChange={v => updateNumeric('hp', powerUnit === 'ps' ? psToHp(v) : v)}
              />
              <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>
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

          <Text style={styles.label}>{t('tireCompound')}</Text>
          <View style={styles.pillGroupFull}>
            {(
              [
                { key: 'stock', label: t('compoundStock') },
                { key: 'street', label: t('compoundStreet') },
                { key: 'sport', label: t('compoundSport') },
                { key: 'semislick', label: t('compoundSemislick') },
                { key: 'slick', label: t('compoundSlick') },
                { key: 'rally', label: t('compoundRally') },
                { key: 'offroad', label: t('compoundOffroad') },
                { key: 'drift', label: t('compoundDrift') },
                { key: 'drag', label: t('compoundDrag') },
              ] as { key: TireCompound; label: string }[]
            ).map(c => (
              <TouchableOpacity
                key={c.key}
                style={[styles.subPill, (inputs.tireCompound || 'sport') === c.key && styles.subPillActive]}
                onPress={() => setInputs(p => ({ ...p, tireCompound: c.key }))}
              >
                <Text style={[styles.subPillText, (inputs.tireCompound || 'sport') === c.key && styles.subPillTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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

          {/* Handling Balance Bias Control */}
          <View style={styles.biasCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={styles.biasTitle}>{t('handlingBiasTitle')}</Text>
              <Text style={styles.biasValueText}>
                {(inputs.handlingBias || 0) === 0
                  ? t('handlingNeutral')
                  : (inputs.handlingBias || 0) > 0
                  ? `+${inputs.handlingBias} ${t('handlingAgile')}`
                  : `${inputs.handlingBias} ${t('handlingStable')}`}
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: '#64748b', marginBottom: 8 }}>
              {t('handlingBiasNote')}
            </Text>

            <View style={styles.biasControlsRow}>
              <TouchableOpacity
                style={styles.biasStepBtn}
                onPress={() => setInputs(p => ({ ...p, handlingBias: Math.max(-5, (p.handlingBias || 0) - 1) }))}
              >
                <Text style={styles.biasStepBtnText}>−</Text>
              </TouchableOpacity>

              <View style={styles.biasQuickGroup}>
                <TouchableOpacity
                  style={[styles.biasPill, (inputs.handlingBias || 0) === -3 && styles.biasPillActiveStable]}
                  onPress={() => setInputs(p => ({ ...p, handlingBias: -3 }))}
                >
                  <Text style={[styles.biasPillText, (inputs.handlingBias || 0) === -3 && styles.biasPillTextActive]}>-3 Stable</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.biasPill, (inputs.handlingBias || 0) === 0 && styles.biasPillActiveNeutral]}
                  onPress={() => setInputs(p => ({ ...p, handlingBias: 0 }))}
                >
                  <Text style={[styles.biasPillText, (inputs.handlingBias || 0) === 0 && styles.biasPillTextActive]}>0 Neutral</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.biasPill, (inputs.handlingBias || 0) === 3 && styles.biasPillActiveAgile]}
                  onPress={() => setInputs(p => ({ ...p, handlingBias: 3 }))}
                >
                  <Text style={[styles.biasPillText, (inputs.handlingBias || 0) === 3 && styles.biasPillTextActive]}>+3 Agile</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.biasStepBtn}
                onPress={() => setInputs(p => ({ ...p, handlingBias: Math.min(5, (p.handlingBias || 0) + 1) }))}
              >
                <Text style={styles.biasStepBtnText}>+</Text>
              </TouchableOpacity>
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
            <Text style={styles.outVal}>{`${tune.tireFrontCold} / ${tune.tireRearCold}`}</Text>
          </View>
          <View style={[styles.outputRow, { borderBottomColor: '#101726' }]}>
            <Text style={[styles.outLabel, { fontSize: 11, color: '#00f0ff', fontStyle: 'italic' }]}>
              {'↳ Target Hot (Telemetry):'}
            </Text>
            <Text style={[styles.outVal, { fontSize: 11, color: '#00f0ff' }]}>
              {`${tune.tireFrontHot} / ${tune.tireRearHot}`}
            </Text>
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
          {(inputs.handlingBias || 0) !== 0 && (
            <View style={[styles.outputRow, { borderBottomColor: '#101726' }]}>
              <Text style={[styles.outLabel, { fontSize: 11, color: (inputs.handlingBias || 0) > 0 ? '#ff4d6d' : '#00f0ff', fontStyle: 'italic' }]}>
                {'↳ Handling Balance:'}
              </Text>
              <Text style={[styles.outVal, { fontSize: 11, color: (inputs.handlingBias || 0) > 0 ? '#ff4d6d' : '#00f0ff' }]}>
                {tune.handlingBiasNote}
              </Text>
            </View>
          )}
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
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>{t('estimatedAeroTopSpeed')}</Text>
            <Text style={[styles.outVal, { color: '#00f0ff' }]}>{tune.estimatedTopSpeed}</Text>
          </View>

          {tune.aeroDragNote && (
            <View style={styles.aeroAdvisoryCard}>
              <Text style={styles.aeroAdvisoryTitle}>⚠️ {t('aeroDragAdvisory')}</Text>
              <Text style={styles.aeroAdvisoryText}>{tune.aeroDragNote}</Text>
            </View>
          )}

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
            estimatedTopSpeedKm={tune.estimatedTopSpeedKm}
          />
        </View>

        {/* CAR SELECTOR MODAL */}
        <CarSelectorModal
          visible={carModalVisible}
          onClose={() => setCarModalVisible(false)}
          onSelectCar={(specs: Partial<VehicleInputs>) => setInputs(prev => ({ ...prev, ...specs }))}
          units={inputs.units}
        />

        {/* TUNE DOCTOR MODAL */}
        <TuneDoctorModal
          visible={doctorModalVisible}
          onClose={() => setDoctorModalVisible(false)}
          inputs={inputs}
          onApplyFix={(newInputs: VehicleInputs) => {
            setInputs(newInputs);
          }}
        />

        {/* COMPANION CHECKLIST MODAL */}
        <CompanionChecklistModal
          visible={checklistModalVisible}
          onClose={() => setChecklistModalVisible(false)}
          tune={tune}
          inputs={inputs}
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  provider: {
    flex: 1,
    backgroundColor: '#070a10',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#070a10',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  container: {
    padding: 14,
    paddingBottom: 60,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  header: { alignItems: 'center', marginBottom: 14, marginTop: 4 },
  title: { fontSize: 22, fontWeight: '900', color: '#f8fafc', letterSpacing: 1.5 },
  titleAccent: { color: '#ff1744' }, // FH6 Torii Crimson
  subtitle: { fontSize: 11, color: '#94a3b8', marginTop: 4, letterSpacing: 0.5 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  pillGroup: { flexDirection: 'row', backgroundColor: '#0f1420', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#1e2638' },
  pillBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  pillActive: { backgroundColor: '#ff1744' },
  pillText: { color: '#8a99ad', fontSize: 12, fontWeight: '700' },
  pillTextActive: { color: '#ffffff' },
  actionRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  presetBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#1a1024', borderRadius: 6, borderWidth: 1, borderColor: '#3b1c54' },
  presetBtnText: { color: '#d946ef', fontSize: 11, fontWeight: '700' },
  resetBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#280d14', borderRadius: 6, borderWidth: 1, borderColor: '#521524' },
  resetBtnText: { color: '#ff4d6d', fontSize: 11, fontWeight: '700' },
  card: { backgroundColor: '#0f1420', borderWidth: 1, borderColor: '#1c2438', borderRadius: 12, padding: 14, marginBottom: 14 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#00f0ff', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  cardTitleAccent: { fontSize: 13, fontWeight: '800', color: '#ff1744', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  label: { fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: '600' },
  badgeInfo: { fontSize: 10, color: '#00f0ff', marginTop: 3, fontStyle: 'italic', fontWeight: '500' },
  pillGroupFull: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  subPill: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#070a10', borderRadius: 6, borderWidth: 1, borderColor: '#1e2638' },
  subPillActive: { backgroundColor: '#ff1744', borderColor: '#ff1744' },
  subPillText: { color: '#8a99ad', fontSize: 11, fontWeight: '700' },
  subPillTextActive: { color: '#ffffff' },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8, width: '100%' },
  rowTight: { flexDirection: 'row', gap: 4, flex: 1, minWidth: 0 },
  col: { flex: 1, minWidth: 0 },
  input: { backgroundColor: '#070a10', borderWidth: 1, borderColor: '#1e2638', borderRadius: 6, color: '#f8fafc', paddingHorizontal: 8, paddingVertical: 6, fontSize: 13, minWidth: 0 },
  inputHalf: { flex: 1, minWidth: 0 },
  sectionDivider: { fontSize: 11, fontWeight: '800', color: '#f8fafc', marginTop: 8, marginBottom: 8, borderTopWidth: 1, borderTopColor: '#1c2438', paddingTop: 8, letterSpacing: 0.5 },
  outputRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#151c2d' },
  outLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '500' },
  outVal: { color: '#00ff9d', fontWeight: '800', fontSize: 12 },
  gearsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
  gearPill: { backgroundColor: '#070a10', borderWidth: 1, borderColor: '#1e2638', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  gearLabel: { fontSize: 9, color: '#8a99ad', fontWeight: '600' },
  gearVal: { fontSize: 12, fontWeight: '800', color: '#00ff9d' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5,7,12,0.88)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 500, backgroundColor: '#0f1420', borderWidth: 1, borderColor: '#1c2438', borderRadius: 12, padding: 18 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#ff1744', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
  saveRow: { flexDirection: 'row', gap: 8 },
  saveActionBtn: { backgroundColor: '#ff1744', borderWidth: 1, borderColor: '#ff1744', paddingHorizontal: 14, justifyContent: 'center', borderRadius: 6 },
  saveActionBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
  emptyText: { color: '#64748b', fontSize: 12, fontStyle: 'italic', marginVertical: 8 },
  presetItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1c2438' },
  presetItemText: { color: '#f8fafc', fontSize: 13, fontWeight: '700' },
  deleteBtnText: { color: '#ff4d6d', fontSize: 11, fontWeight: '700' },
  closeBtn: { marginTop: 14, backgroundColor: '#070a10', borderWidth: 1, borderColor: '#1e2638', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  closeBtnText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  biasCard: {
    backgroundColor: '#070a10',
    borderWidth: 1,
    borderColor: '#1e2638',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 4,
  },
  biasTitle: { fontSize: 11, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  biasValueText: { fontSize: 11, color: '#00ff9d', fontWeight: '800' },
  biasControlsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  biasStepBtn: {
    backgroundColor: '#0f1420',
    borderWidth: 1,
    borderColor: '#1e2638',
    borderRadius: 6,
    width: 34,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biasStepBtnText: { color: '#00f0ff', fontSize: 18, fontWeight: 'bold' },
  biasQuickGroup: { flexDirection: 'row', flex: 1, gap: 4 },
  biasPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: '#0f1420',
    borderWidth: 1,
    borderColor: '#1e2638',
    borderRadius: 6,
  },
  biasPillActiveStable: { backgroundColor: '#004354', borderColor: '#00f0ff' },
  biasPillActiveNeutral: { backgroundColor: '#1e293b', borderColor: '#94a3b8' },
  biasPillActiveAgile: { backgroundColor: '#590e1c', borderColor: '#ff1744' },
  biasPillText: { color: '#8a99ad', fontSize: 10, fontWeight: '700' },
  biasPillTextActive: { color: '#ffffff' },
  aeroAdvisoryCard: {
    backgroundColor: 'rgba(255, 184, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.35)',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    marginBottom: 6,
  },
  aeroAdvisoryTitle: {
    color: '#ffd000',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  aeroAdvisoryText: {
    color: '#e2e8f0',
    fontSize: 11,
    lineHeight: 16,
  },
});