import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_INPUTS, PresetItem, VehicleInputs } from '../types/tuning';
import { t } from '../i18n';

const STORAGE_KEY_PRESETS = 'fh_tuner_presets';

interface UseGaragePresetsArgs {
  inputs: VehicleInputs;
  setInputs: React.Dispatch<React.SetStateAction<VehicleInputs>>;
  onPresetLoaded?: () => void;
}

export function useGaragePresets({ inputs, setInputs, onPresetLoaded }: UseGaragePresetsArgs) {
  const [savedPresets, setSavedPresets] = useState<PresetItem[]>([]);
  const [presetNameInput, setPresetNameInput] = useState('');

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const savedPresetsData = await AsyncStorage.getItem(STORAGE_KEY_PRESETS);
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
        console.error('Failed to load garage presets', e);
      }
    };
    loadPresets();
  }, []);

  const handleSavePreset = useCallback(async () => {
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

    const inputsWithPreset: VehicleInputs = {
      ...inputs,
      carName: trimmed,
      activePresetName: trimmed,
    };

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
                index === existingIndex ? { id: trimmed, name: trimmed, inputs: inputsWithPreset } : item
              );
              setSavedPresets(updated);
              setInputs(inputsWithPreset);
              await AsyncStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(updated));
              setPresetNameInput('');
              Alert.alert(t('presetSavedTitle'), t('presetUpdatedMsg', { name: trimmed }));
            },
          },
        ]
      );
      return;
    }

    const updated: PresetItem[] = [
      ...savedPresets,
      { id: trimmed, name: trimmed, inputs: inputsWithPreset },
    ];
    setSavedPresets(updated);
    setInputs(inputsWithPreset);
    await AsyncStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(updated));
    setPresetNameInput('');
    Alert.alert(t('presetSavedTitle'), t('presetSavedMsg', { name: trimmed }));
  }, [inputs, presetNameInput, savedPresets, setInputs]);

  const handleLoadPreset = useCallback(
    (preset: PresetItem) => {
      setInputs({
        ...DEFAULT_INPUTS,
        ...preset.inputs,
        carName: preset.inputs.carName || preset.name,
        activePresetName: preset.name,
      });
      onPresetLoaded?.();
    },
    [onPresetLoaded, setInputs]
  );

  const handleDeletePreset = useCallback(
    (preset: PresetItem) => {
      Alert.alert(t('deletePresetTitle'), t('deletePresetConfirm', { name: preset.name }), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            const updated = savedPresets.filter(p => p.id !== preset.id);
            setSavedPresets(updated);
            await AsyncStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(updated));
          },
        },
      ]);
    },
    [savedPresets]
  );

  return {
    savedPresets,
    presetNameInput,
    setPresetNameInput,
    handleSavePreset,
    handleLoadPreset,
    handleDeletePreset,
  };
}
