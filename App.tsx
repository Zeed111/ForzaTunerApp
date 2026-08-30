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

const DEFAULT_INPUTS: VehicleInputs = {
  units: 'metric',
  category: 'jdm',
  discipline: 'drift',
  drivetrain: 'RWD',
  hp: 650,
  weight: 1280,
  frontWeightPct: 53,
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

export default function App() {
  const [inputs, setInputs] = useState<VehicleInputs>(DEFAULT_INPUTS);
  const [tune, setTune] = useState<TuneResult>(() => calculateTune(DEFAULT_INPUTS));
  const [carModalVisible, setCarModalVisible] = useState(false);
  const [presetModalVisible, setPresetModalVisible] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [savedPresets, setSavedPresets] = useState<{ [key: string]: VehicleInputs }>({});

  useEffect(() => {
    loadSavedState();
    loadPresetsFromStorage();
  }, []);

  useEffect(() => {
    setTune(calculateTune(inputs));
    AsyncStorage.setItem('fh_tuner_app_state', JSON.stringify(inputs)).catch(console.error);
  }, [inputs]);

  const loadSavedState = async () => {
    try {
      const data = await AsyncStorage.getItem('fh_tuner_app_state');
      if (data) setInputs(JSON.parse(data));
    } catch (e) {
      console.error(e);
    }
  };

  const loadPresetsFromStorage = async () => {
    try {
      const data = await AsyncStorage.getItem('fh_tuner_presets');
      if (data) setSavedPresets(JSON.parse(data));
    } catch (e) {
      console.error(e);
    }
  };

  const updateNumeric = (key: keyof VehicleInputs, val: string) => {
    const num = parseFloat(val) || 0;
    setInputs(prev => ({ ...prev, [key]: num }));
  };

  const toggleUnits = (system: UnitSystem) => {
    if (inputs.units === system) return;
    const isImp = system === 'imperial';
    setInputs(prev => ({
      ...prev,
      units: system,
      weight: isImp ? Math.round(prev.weight * 2.20462) : Math.round(prev.weight / 2.20462),
      springFrontMin: isImp ? +(prev.springFrontMin * 55.997).toFixed(1) : +(prev.springFrontMin / 55.997).toFixed(1),
      springFrontMax: isImp ? +(prev.springFrontMax * 55.997).toFixed(1) : +(prev.springFrontMax / 55.997).toFixed(1),
      springRearMin: isImp ? +(prev.springRearMin * 55.997).toFixed(1) : +(prev.springRearMin / 55.997).toFixed(1),
      springRearMax: isImp ? +(prev.springRearMax * 55.997).toFixed(1) : +(prev.springRearMax / 55.997).toFixed(1),
      heightFrontMin: isImp ? +(prev.heightFrontMin / 2.54).toFixed(1) : +(prev.heightFrontMin * 2.54).toFixed(1),
      heightFrontMax: isImp ? +(prev.heightFrontMax / 2.54).toFixed(1) : +(prev.heightFrontMax * 2.54).toFixed(1),
      heightRearMin: isImp ? +(prev.heightRearMin / 2.54).toFixed(1) : +(prev.heightRearMin * 2.54).toFixed(1),
      heightRearMax: isImp ? +(prev.heightRearMax / 2.54).toFixed(1) : +(prev.heightRearMax * 2.54).toFixed(1),
      aeroFrontMin: isImp ? Math.round(prev.aeroFrontMin * 2.20462) : Math.round(prev.aeroFrontMin / 2.20462),
      aeroFrontMax: isImp ? Math.round(prev.aeroFrontMax * 2.20462) : Math.round(prev.aeroFrontMax / 2.20462),
      aeroRearMin: isImp ? Math.round(prev.aeroRearMin * 2.20462) : Math.round(prev.aeroRearMin / 2.20462),
      aeroRearMax: isImp ? Math.round(prev.aeroRearMax * 2.20462) : Math.round(prev.aeroRearMax / 2.20462),
      topSpeed: isImp ? Math.round(prev.topSpeed / 1.60934) : Math.round(prev.topSpeed * 1.60934),
    }));
  };

  const handleSavePreset = async () => {
    if (!presetNameInput.trim()) {
      Alert.alert('Error', 'Please enter a preset name');
      return;
    }
    const updated = { ...savedPresets, [presetNameInput.trim()]: inputs };
    setSavedPresets(updated);
    await AsyncStorage.setItem('fh_tuner_presets', JSON.stringify(updated));
    setPresetNameInput('');
    Alert.alert('Saved', `Preset "${presetNameInput.trim()}" saved!`);
  };

  const handleLoadPreset = (name: string) => {
    if (savedPresets[name]) {
      setInputs(savedPresets[name]);
      setPresetModalVisible(false);
    }
  };

  const handleDeletePreset = async (name: string) => {
    const updated = { ...savedPresets };
    delete updated[name];
    setSavedPresets(updated);
    await AsyncStorage.setItem('fh_tuner_presets', JSON.stringify(updated));
  };

  const handleReset = () => {
    Alert.alert('Reset Defaults', 'Reset all tuning values to default?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => setInputs(DEFAULT_INPUTS) },
    ]);
  };

  // Live tire diameter readouts
  const diaF = (2 * (inputs.tWidthF * (inputs.tProfileF / 100)) + inputs.tRimF * 25.4) / 1000;
  const diaR = (2 * (inputs.tWidthR * (inputs.tProfileR / 100)) + inputs.tRimR * 25.4) / 1000;
  const isImp = inputs.units === 'imperial';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0d14" translucent={false} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>FORZA <Text style={styles.titleAccent}>PRO TUNER</Text></Text>
          <Text style={styles.subtitle}>Mobile Telemetry & Precision Suspension Calculator</Text>
        </View>

        {/* Top Controls */}
        <View style={styles.topBar}>
          <View style={styles.pillGroup}>
            <TouchableOpacity
              style={[styles.pillBtn, inputs.units === 'metric' && styles.pillActive]}
              onPress={() => toggleUnits('metric')}
            >
              <Text style={[styles.pillText, inputs.units === 'metric' && styles.pillTextActive]}>Metric</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pillBtn, inputs.units === 'imperial' && styles.pillActive]}
              onPress={() => toggleUnits('imperial')}
            >
              <Text style={[styles.pillText, inputs.units === 'imperial' && styles.pillTextActive]}>Imperial</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.presetBtn, { backgroundColor: '#1a2f4c', borderColor: '#2b5080' }]}
              onPress={() => setCarModalVisible(true)}
            >
              <Text style={[styles.presetBtnText, { color: '#00e5ff' }]}>Cars</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetBtn} onPress={() => setPresetModalVisible(true)}>
              <Text style={styles.presetBtnText}>Garage</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. CHASSIS & POWER */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Chassis & Power</Text>

          <Text style={styles.label}>Car Category</Text>
          <View style={styles.pillGroupFull}>
            {([
              { key: 'jdm', label: 'JDM / Tuner' },
              { key: 'track', label: 'GT / Track' },
              { key: 'classic', label: 'Classic / Muscle' },
              { key: 'supercar', label: 'Supercar' },
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

          <Text style={styles.label}>Discipline / Surface</Text>
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

          <Text style={styles.label}>Drivetrain</Text>
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
              <Text style={styles.label}>Horsepower (HP)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(inputs.hp)}
                onChangeText={v => updateNumeric('hp', v)}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Weight ({isImp ? 'lbs' : 'kg'})</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(inputs.weight)}
                onChangeText={v => updateNumeric('weight', v)}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Front Wt %</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(inputs.frontWeightPct)}
                onChangeText={v => updateNumeric('frontWeightPct', v)}
              />
            </View>
          </View>
        </View>

        {/* 2. TIRE SIZES & KINEMATICS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. Front & Rear Tire Sizes</Text>

          <Text style={styles.label}>Front Tire (Width mm / Aspect % / Rim in)</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.col]}
              keyboardType="numeric"
              placeholder="Width"
              value={String(inputs.tWidthF)}
              onChangeText={v => updateNumeric('tWidthF', v)}
            />
            <TextInput
              style={[styles.input, styles.col]}
              keyboardType="numeric"
              placeholder="Profile"
              value={String(inputs.tProfileF)}
              onChangeText={v => updateNumeric('tProfileF', v)}
            />
            <TextInput
              style={[styles.input, styles.col]}
              keyboardType="numeric"
              placeholder="Rim"
              value={String(inputs.tRimF)}
              onChangeText={v => updateNumeric('tRimF', v)}
            />
          </View>
          <Text style={styles.badgeInfo}>
            Front Dia: {isImp ? `${(diaF * 39.3701).toFixed(1)} in` : `${(diaF * 100).toFixed(1)} cm`} | Circ: {isImp ? `${(Math.PI * diaF * 3.28084).toFixed(2)} ft` : `${(Math.PI * diaF).toFixed(2)} m`}
          </Text>

          <Text style={[styles.label, { marginTop: 10 }]}>Rear Tire (Width mm / Aspect % / Rim in)</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.col]}
              keyboardType="numeric"
              placeholder="Width"
              value={String(inputs.tWidthR)}
              onChangeText={v => updateNumeric('tWidthR', v)}
            />
            <TextInput
              style={[styles.input, styles.col]}
              placeholder="Profile"
              keyboardType="numeric"
              value={String(inputs.tProfileR)}
              onChangeText={v => updateNumeric('tProfileR', v)}
            />
            <TextInput
              style={[styles.input, styles.col]}
              placeholder="Rim"
              keyboardType="numeric"
              value={String(inputs.tRimR)}
              onChangeText={v => updateNumeric('tRimR', v)}
            />
          </View>
          <Text style={styles.badgeInfo}>
            Rear Dia: {isImp ? `${(diaR * 39.3701).toFixed(1)} in` : `${(diaR * 100).toFixed(1)} cm`} | Circ: {isImp ? `${(Math.PI * diaR * 3.28084).toFixed(2)} ft` : `${(Math.PI * diaR).toFixed(2)} m`}
          </Text>
        </View>

        {/* 3. SUSPENSION & RIDE HEIGHT BOUNDS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. In-Game Slider Limits</Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Front Springs ({isImp ? 'lb/in' : 'kgf/mm'})</Text>
              <View style={styles.rowTight}>
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  keyboardType="numeric"
                  placeholder="Min"
                  value={String(inputs.springFrontMin)}
                  onChangeText={v => updateNumeric('springFrontMin', v)}
                />
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  keyboardType="numeric"
                  placeholder="Max"
                  value={String(inputs.springFrontMax)}
                  onChangeText={v => updateNumeric('springFrontMax', v)}
                />
              </View>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Rear Springs ({isImp ? 'lb/in' : 'kgf/mm'})</Text>
              <View style={styles.rowTight}>
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  keyboardType="numeric"
                  placeholder="Min"
                  value={String(inputs.springRearMin)}
                  onChangeText={v => updateNumeric('springRearMin', v)}
                />
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  keyboardType="numeric"
                  placeholder="Max"
                  value={String(inputs.springRearMax)}
                  onChangeText={v => updateNumeric('springRearMax', v)}
                />
              </View>
            </View>
          </View>

          <View style={[styles.row, { marginTop: 6 }]}>
            <View style={styles.col}>
              <Text style={styles.label}>Front Ride Height ({isImp ? 'in' : 'cm'})</Text>
              <View style={styles.rowTight}>
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  keyboardType="numeric"
                  placeholder="Min"
                  value={String(inputs.heightFrontMin)}
                  onChangeText={v => updateNumeric('heightFrontMin', v)}
                />
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  keyboardType="numeric"
                  placeholder="Max"
                  value={String(inputs.heightFrontMax)}
                  onChangeText={v => updateNumeric('heightFrontMax', v)}
                />
              </View>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Rear Ride Height ({isImp ? 'in' : 'cm'})</Text>
              <View style={styles.rowTight}>
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  keyboardType="numeric"
                  placeholder="Min"
                  value={String(inputs.heightRearMin)}
                  onChangeText={v => updateNumeric('heightRearMin', v)}
                />
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  keyboardType="numeric"
                  placeholder="Max"
                  value={String(inputs.heightRearMax)}
                  onChangeText={v => updateNumeric('heightRearMax', v)}
                />
              </View>
            </View>
          </View>
        </View>

        {/* 4. AERO DOWNFORCE BOUNDS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>4. Aero Downforce Slider Limits</Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Front Aero ({isImp ? 'lbf' : 'kgf'})</Text>
              <View style={styles.rowTight}>
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  keyboardType="numeric"
                  placeholder="Min"
                  value={String(inputs.aeroFrontMin)}
                  onChangeText={v => updateNumeric('aeroFrontMin', v)}
                />
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  keyboardType="numeric"
                  placeholder="Max"
                  value={String(inputs.aeroFrontMax)}
                  onChangeText={v => updateNumeric('aeroFrontMax', v)}
                />
              </View>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Rear Aero ({isImp ? 'lbf' : 'kgf'})</Text>
              <View style={styles.rowTight}>
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  keyboardType="numeric"
                  placeholder="Min"
                  value={String(inputs.aeroRearMin)}
                  onChangeText={v => updateNumeric('aeroRearMin', v)}
                />
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  keyboardType="numeric"
                  placeholder="Max"
                  value={String(inputs.aeroRearMax)}
                  onChangeText={v => updateNumeric('aeroRearMax', v)}
                />
              </View>
            </View>
          </View>
        </View>

        {/* 5. ENGINE & GEARING SPECS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>5. Engine & Transmission Specs</Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Redline RPM</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(inputs.redlineRpm)}
                onChangeText={v => updateNumeric('redlineRpm', v)}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Top Speed ({isImp ? 'mph' : 'km/h'})</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(inputs.topSpeed)}
                onChangeText={v => updateNumeric('topSpeed', v)}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Gears (1-10)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(inputs.numGears)}
                onChangeText={v => updateNumeric('numGears', v)}
              />
            </View>
          </View>

          <Text style={[styles.label, { marginTop: 8 }]}>Power Band Curve</Text>
          <View style={styles.pillGroupFull}>
            {([
              { key: 'balanced', label: 'Balanced / Turbo' },
              { key: 'highrev', label: 'High-Rev NA (VTEC)' },
              { key: 'torque', label: 'High Torque (V8/Diesel)' },
            ] as { key: EngineType; label: string }[]).map(et => (
              <TouchableOpacity
                key={et.key}
                style={[styles.subPill, inputs.engineType === et.key && styles.subPillActive]}
                onPress={() => setInputs(p => ({ ...p, engineType: et.key }))}
              >
                <Text style={[styles.subPillText, inputs.engineType === et.key && styles.subPillTextActive]}>{et.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* OUTPUT RESULTS CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitleAccent}>Calculated Tune Setup</Text>

          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>Tire Pressure (F / R):</Text>
            <Text style={styles.outVal}>{tune.tireFront} / {tune.tireRear}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>Camber (F / R):</Text>
            <Text style={styles.outVal}>{tune.camberFront} / {tune.camberRear}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>Toe (F / R):</Text>
            <Text style={styles.outVal}>{tune.toeFront} / {tune.toeRear}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>Caster Angle:</Text>
            <Text style={styles.outVal}>{tune.caster}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>Anti-Roll Bars (F / R):</Text>
            <Text style={styles.outVal}>{tune.arbFront} / {tune.arbRear}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>Springs (F / R):</Text>
            <Text style={styles.outVal}>{tune.springFront} / {tune.springRear}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>Ride Height (F / R):</Text>
            <Text style={styles.outVal}>{tune.heightFront} / {tune.heightRear}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>Rebound Damping (F / R):</Text>
            <Text style={styles.outVal}>{tune.rebFront} / {tune.rebRear}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>Bump Damping (F / R):</Text>
            <Text style={styles.outVal}>{tune.bmpFront} / {tune.bmpRear}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>Aero Downforce (F / R):</Text>
            <Text style={styles.outVal}>{tune.aeroFront} / {tune.aeroRear}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>Brakes (Balance / Pressure):</Text>
            <Text style={styles.outVal}>{tune.brakeBalance} / {tune.brakePressure}</Text>
          </View>

          {tune.diffRear && (
            <View style={styles.outputRow}>
              <Text style={styles.outLabel}>Rear Diff (Acc / Dec):</Text>
              <Text style={styles.outVal}>{tune.diffRear}</Text>
            </View>
          )}
          {tune.diffFront && (
            <View style={styles.outputRow}>
              <Text style={styles.outLabel}>Front Diff (Acc / Dec):</Text>
              <Text style={styles.outVal}>{tune.diffFront}</Text>
            </View>
          )}
          {tune.diffCenter && (
            <View style={styles.outputRow}>
              <Text style={styles.outLabel}>Center Differential Bias:</Text>
              <Text style={styles.outVal}>{tune.diffCenter}</Text>
            </View>
          )}

          <Text style={styles.sectionDivider}>Gearing & Transmission</Text>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>Calculated Final Drive:</Text>
            <Text style={styles.outVal}>{tune.finalDrive}</Text>
          </View>

          <View style={styles.gearsGrid}>
            {tune.gearRatios.map((ratio, idx) => (
              <View key={`g-${idx}`} style={styles.gearPill}>
                <Text style={styles.gearLabel}>G{idx + 1}</Text>
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
        <Modal visible={presetModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Car Garage Presets</Text>

              <View style={styles.saveRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="New Preset Name (e.g. R34 Drift)"
                  placeholderTextColor="#63738a"
                  value={presetNameInput}
                  onChangeText={setPresetNameInput}
                />
                <TouchableOpacity style={styles.saveActionBtn} onPress={handleSavePreset}>
                  <Text style={styles.saveActionBtnText}>Save</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { marginTop: 12 }]}>Saved Vehicles:</Text>
              {Object.keys(savedPresets).length === 0 ? (
                <Text style={styles.emptyText}>No presets saved yet.</Text>
              ) : (
                <FlatList
                  data={Object.keys(savedPresets)}
                  keyExtractor={item => item}
                  style={{ maxHeight: 200 }}
                  renderItem={({ item }) => (
                    <View style={styles.presetItem}>
                      <TouchableOpacity style={{ flex: 1 }} onPress={() => handleLoadPreset(item)}>
                        <Text style={styles.presetItemText}>{item}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeletePreset(item)}>
                        <Text style={styles.deleteBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )}

              <TouchableOpacity style={styles.closeBtn} onPress={() => setPresetModalVisible(false)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0d14',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 0,
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
  modalContent: { width: '100%', backgroundColor: '#141923', borderWidth: 1, borderColor: '#232b3b', borderRadius: 12, padding: 18 },
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