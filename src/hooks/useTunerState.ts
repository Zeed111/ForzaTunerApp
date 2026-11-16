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
import { convertInputsUnitSystem, KGF_MM_TO_LB_IN } from '../utils/units';
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

      const minF_kgf = Math.round(Math.max(40, Math.min(350, wKg * fw * 0.17)));
      const maxF_kgf = Math.round(Math.max(minF_kgf + 200, Math.min(1300, wKg * fw * 0.92)));
      const minR_kgf = Math.round(Math.max(40, Math.min(350, wKg * rw * 0.17)));
      const maxR_kgf = Math.round(Math.max(minR_kgf + 200, Math.min(1300, wKg * rw * 0.92)));

      return {
        ...prev,
        springFrontMin: isImpLocal ? Number((minF_kgf * KGF_MM_TO_LB_IN).toFixed(1)) : minF_kgf,
        springFrontMax: isImpLocal ? Number((maxF_kgf * KGF_MM_TO_LB_IN).toFixed(1)) : maxF_kgf,
        springRearMin: isImpLocal ? Number((minR_kgf * KGF_MM_TO_LB_IN).toFixed(1)) : minR_kgf,
        springRearMax: isImpLocal ? Number((maxR_kgf * KGF_MM_TO_LB_IN).toFixed(1)) : maxR_kgf,
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
