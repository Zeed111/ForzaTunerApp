import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_INPUTS,
  TuneResult,
  UnitSystem,
  VehicleInputs,
} from '../types/tuning';
import { calculateTune } from '../engine';
import { convertInputsUnitSystem, FORZA_SPRING_TO_LB_IN } from '../utils/units';
import { t } from '../i18n';

const STORAGE_KEY_STATE = 'fh_tuner_app_state';

export function useTunerState() {
  const [inputs, setInputs] = useState<VehicleInputs>(DEFAULT_INPUTS);
  const [tune, setTune] = useState<TuneResult>(() => calculateTune(DEFAULT_INPUTS));
  const [isHydrated, setIsHydrated] = useState(false);
  const [powerUnit, setPowerUnit] = useState<'hp' | 'ps'>('hp');
  const [selectedGear, setSelectedGear] = useState<number | null>(null);
  const [checklistCheckedIds, setChecklistCheckedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const hydrate = async () => {
      try {
        const savedState = await AsyncStorage.getItem(STORAGE_KEY_STATE);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          setInputs({ ...DEFAULT_INPUTS, ...parsed });
        }
      } catch (e) {
        console.error('Failed to hydrate tuner state', e);
      } finally {
        setIsHydrated(true);
      }
    };
    hydrate();
  }, []);

  useEffect(() => {
    const nextTune = calculateTune(inputs);
    setTune(nextTune);
    setSelectedGear(prev =>
      prev != null && prev >= nextTune.gearRatios.length ? null : prev
    );
    if (isHydrated) {
      AsyncStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(inputs)).catch(console.error);
    }
  }, [inputs, isHydrated]);

  const updateNumeric = useCallback((key: keyof VehicleInputs, val: number) => {
    setInputs(prev => ({ ...prev, [key]: val }));
  }, []);

  const toggleUnits = useCallback((system: UnitSystem) => {
    setInputs(prev => {
      if (prev.units === system) return prev;
      return convertInputsUnitSystem(prev, system);
    });
  }, []);

  const handleAutoScaleLimits = useCallback(() => {
    setInputs(prev => {
      const isImpLocal = prev.units === 'imperial';
      const wKg = isImpLocal ? prev.weight / 2.20462 : prev.weight;
      const fw = Math.min(0.75, Math.max(0.30, prev.frontWeightPct / 100));
      const rw = 1 - fw;

      const minF_forza = Number(Math.max(15, Math.min(110, wKg * fw * 0.055)).toFixed(1));
      const maxF_forza = Number(
        Math.max(minF_forza + 60, Math.min(360, wKg * fw * 0.30)).toFixed(1)
      );
      const minR_forza = Number(Math.max(15, Math.min(110, wKg * rw * 0.055)).toFixed(1));
      const maxR_forza = Number(
        Math.max(minR_forza + 60, Math.min(360, wKg * rw * 0.30)).toFixed(1)
      );

      return {
        ...prev,
        springFrontMin: isImpLocal
          ? Number((minF_forza * FORZA_SPRING_TO_LB_IN).toFixed(1))
          : minF_forza,
        springFrontMax: isImpLocal
          ? Number((maxF_forza * FORZA_SPRING_TO_LB_IN).toFixed(1))
          : maxF_forza,
        springRearMin: isImpLocal
          ? Number((minR_forza * FORZA_SPRING_TO_LB_IN).toFixed(1))
          : minR_forza,
        springRearMax: isImpLocal
          ? Number((maxR_forza * FORZA_SPRING_TO_LB_IN).toFixed(1))
          : maxR_forza,
      };
    });
  }, []);

  const handleReset = useCallback(() => {
    Alert.alert(t('resetDefaultsTitle'), t('resetDefaultsConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('reset'),
        style: 'destructive',
        onPress: () => {
          setInputs(DEFAULT_INPUTS);
          setChecklistCheckedIds(new Set());
        },
      },
    ]);
  }, []);

  return {
    inputs,
    setInputs,
    tune,
    isHydrated,
    powerUnit,
    setPowerUnit,
    selectedGear,
    setSelectedGear,
    checklistCheckedIds,
    setChecklistCheckedIds,
    updateNumeric,
    toggleUnits,
    handleAutoScaleLimits,
    handleReset,
  };
}
