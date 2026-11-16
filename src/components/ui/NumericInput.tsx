import React, { useState, useEffect } from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { THEME } from '../../theme';

interface NumericInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: number;
  onValueChange: (val: number) => void;
  decimals?: number;
  min?: number;
  max?: number;
  step?: number;
  labelPrefix?: string;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onValueChange,
  decimals,
  min,
  max,
  step,
  labelPrefix,
  style,
  ...rest
}) => {
  // Keep local string state so decimal points like "9." or "0." are not wiped while typing
  const [localText, setLocalText] = useState<string>(() => (value != null ? String(value) : ''));
  const [isFocused, setIsFocused] = useState(false);

  // Sync from props only when not actively typing or if numeric value has materially changed
  useEffect(() => {
    if (!isFocused) {
      const formatted =
        value != null
          ? decimals != null
            ? String(Number(value.toFixed(decimals)))
            : String(value)
          : '';
      setLocalText(formatted);
    }
  }, [value, isFocused, decimals]);

  const clampAndRound = (val: number) => {
    let clamped = val;
    if (min != null && clamped < min) clamped = min;
    if (max != null && clamped > max) clamped = max;
    return decimals != null ? Number(clamped.toFixed(decimals)) : clamped;
  };

  const handleChangeText = (text: string) => {
    // Normalize commas to dots (common in European keyboard locales)
    const normalized = text.replace(',', '.');

    // Allow only valid partial numbers: digits and at most one decimal point, optional negative sign
    if (normalized === '' || normalized === '-' || normalized === '.' || normalized === '-.') {
      setLocalText(normalized);
      return;
    }

    // Check if it's a valid floating point string pattern
    const regex = /^-?\d*\.?\d*$/;
    if (!regex.test(normalized)) {
      return;
    }

    setLocalText(normalized);

    const parsed = parseFloat(normalized);
    if (!isNaN(parsed)) {
      if (min != null && parsed < min) {
        // Wait until user finishes typing more digits or blurs
        return;
      }
      const finalVal = max != null && parsed > max ? max : parsed;
      onValueChange(finalVal);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(localText);
    if (isNaN(parsed)) {
      const fallback = min != null ? min : 0;
      setLocalText(String(fallback));
      onValueChange(fallback);
    } else {
      const clamped = clampAndRound(parsed);
      setLocalText(String(clamped));
      onValueChange(clamped);
    }
  };

  const handleStep = (delta: number) => {
    const base = isNaN(value) ? (min != null ? min : 0) : value;
    const next = clampAndRound(base + delta);
    setLocalText(String(next));
    onValueChange(next);
  };

  if (step != null) {
    const atMin = min != null && value <= min;
    const atMax = max != null && value >= max;

    return (
      <View style={[styles.stepperOuter, isFocused && styles.inputFocused, style]}>
        {labelPrefix ? (
          <View style={styles.stepperHeaderTag}>
            <Text style={styles.stepperPrefixText}>{labelPrefix}</Text>
          </View>
        ) : null}
        <View style={styles.stepperContainer}>
          <TouchableOpacity
            style={[styles.stepBtn, atMin && styles.stepBtnDisabled]}
            onPress={() => handleStep(-step)}
            disabled={atMin}
            accessibilityLabel="Decrease value"
          >
            <Minus
              size={12}
              color={atMin ? THEME.textMuted : THEME.textSecondary}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
          <TextInput
            {...rest}
            style={styles.stepperInput}
            value={localText}
            onChangeText={handleChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            keyboardType="decimal-pad"
            placeholderTextColor={THEME.textMuted}
          />
          <TouchableOpacity
            style={[styles.stepBtn, atMax && styles.stepBtnDisabled]}
            onPress={() => handleStep(step)}
            disabled={atMax}
            accessibilityLabel="Increase value"
          >
            <Plus
              size={12}
              color={atMax ? THEME.textMuted : THEME.textSecondary}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (labelPrefix) {
    return (
      <View style={[styles.prefixedContainer, isFocused && styles.inputFocused, style]}>
        <Text style={styles.prefixTag}>{labelPrefix}</Text>
        <TextInput
          {...rest}
          style={styles.prefixedInput}
          value={localText}
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          keyboardType="decimal-pad"
          placeholderTextColor={THEME.textMuted}
        />
      </View>
    );
  }

  return (
    <TextInput
      {...rest}
      style={[styles.input, isFocused && styles.inputFocused, style]}
      value={localText}
      onChangeText={handleChangeText}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      keyboardType="decimal-pad"
      placeholderTextColor={THEME.textMuted}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 6,
    color: THEME.textPrimary,
    paddingHorizontal: 8,
    paddingVertical: 7,
    fontSize: 13,
    fontWeight: '600',
    minWidth: 0,
  },
  inputFocused: {
    borderColor: THEME.accentBrand,
  },
  prefixedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 6,
    paddingLeft: 6,
    paddingRight: 5,
    minWidth: 0,
    gap: 3,
  },
  prefixTag: {
    fontSize: 8.5,
    fontWeight: '800',
    color: THEME.textMuted,
    letterSpacing: 0.3,
  },
  prefixedInput: {
    flex: 1,
    minWidth: 0,
    color: THEME.textPrimary,
    paddingVertical: 7,
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'right',
  },
  stepperOuter: {
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 6,
    overflow: 'hidden',
    minWidth: 0,
  },
  stepperHeaderTag: {
    backgroundColor: THEME.bgSubtle,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingVertical: 2,
    alignItems: 'center',
  },
  stepperPrefixText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: THEME.textMuted,
    letterSpacing: 0.6,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  stepperInput: {
    flex: 1,
    minWidth: 0,
    color: THEME.textPrimary,
    paddingHorizontal: 2,
    paddingVertical: 6,
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  stepBtn: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bgSubtle,
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
});
