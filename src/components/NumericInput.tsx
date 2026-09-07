import React, { useState, useEffect } from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';

interface NumericInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: number;
  onValueChange: (val: number) => void;
  decimals?: number;
  min?: number;
  max?: number;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onValueChange,
  decimals,
  min,
  max,
  style,
  ...rest
}) => {
  // Keep local string state so decimal points like "9." or "0." are not wiped while typing
  const [localText, setLocalText] = useState<string>(() => (value != null ? String(value) : ''));
  const [isFocused, setIsFocused] = useState(false);

  // Sync from props only when not actively typing or if numeric value has materially changed
  useEffect(() => {
    if (!isFocused) {
      const formatted = value != null ? (decimals != null ? String(Number(value.toFixed(decimals))) : String(value)) : '';
      setLocalText(formatted);
    }
  }, [value, isFocused, decimals]);

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
      let finalVal = parsed;
      if (min != null && finalVal < min) finalVal = min;
      if (max != null && finalVal > max) finalVal = max;
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
      let clamped = parsed;
      if (min != null && clamped < min) clamped = min;
      if (max != null && clamped > max) clamped = max;
      const formatted = decimals != null ? String(Number(clamped.toFixed(decimals))) : String(clamped);
      setLocalText(formatted);
      onValueChange(clamped);
    }
  };

  return (
    <TextInput
      {...rest}
      style={[styles.input, style]}
      value={localText}
      onChangeText={handleChangeText}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      keyboardType="decimal-pad"
      placeholderTextColor="#63738a"
    />
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#0b0e17',
    borderWidth: 1,
    borderColor: '#232b3b',
    borderRadius: 6,
    color: '#f0f6fc',
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
  },
});
