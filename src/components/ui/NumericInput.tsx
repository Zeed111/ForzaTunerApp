import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TextInput,
  TextInputProps,
  TextStyle,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { THEME } from '../../theme';
import { useFormNavigation } from '../../context/FormNavigationContext';

export interface NumericInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: number;
  onValueChange: (val: number) => void;
  decimals?: number;
  min?: number;
  max?: number;
  step?: number;
  labelPrefix?: string;
  fieldId?: string;
  fieldLabel?: string;
  fieldOrder?: number;
  compactStepper?: boolean;
}

const inputFontSize = Platform.select({ web: 16, default: 14 }) ?? 14;
const webInputReset =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;

function formatNumericValue(val: number, decimals?: number): string {
  if (val == null || isNaN(val)) return '';
  return decimals != null ? String(Number(val.toFixed(decimals))) : String(val);
}

export const NumericInput = React.forwardRef<TextInput, NumericInputProps>(
  (
    {
      value,
      onValueChange,
      decimals,
      min,
      max,
      step,
      labelPrefix,
      fieldId,
      fieldLabel,
      fieldOrder,
      compactStepper,
      style,
      onFocus,
      onBlur,
      onSubmitEditing,
      keyboardType,
      inputMode,
      returnKeyType,
      enterKeyHint,
      submitBehavior,
      selectTextOnFocus,
      maxLength,
      disableFullscreenUI,
      cursorColor,
      selectionColor,
      placeholderTextColor,
      ...rest
    },
    forwardedRef
  ) => {
    const { width: windowWidth } = useWindowDimensions();
    const formNav = useFormNavigation();
    const registerField = formNav?.registerField;

    const inputRef = useRef<TextInput | null>(null);
    const containerRef = useRef<View | null>(null);
    const lastEmittedRef = useRef<number | null>(null);
    const prevPropValueRef = useRef<number>(value);

    // Keep local string state so decimal points like "9." or "0." are not wiped while typing
    const [localText, setLocalText] = useState<string>(() => formatNumericValue(value, decimals));
    const [isFocused, setIsFocused] = useState(false);

    const setInputRef = useCallback(
      (node: TextInput | null) => {
        inputRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef && typeof forwardedRef === 'object') {
          (forwardedRef as React.MutableRefObject<TextInput | null>).current = node;
        }
      },
      [forwardedRef]
    );

    useEffect(() => {
      if (!registerField || fieldId == null || fieldOrder == null) return;
      return registerField({
        id: fieldId,
        label: fieldLabel ?? labelPrefix ?? '',
        order: fieldOrder,
        inputRef,
        containerRef,
      });
    }, [registerField, fieldId, fieldLabel, labelPrefix, fieldOrder]);

    // Sync from props when unfocused, or when prop changes externally while focused
    useEffect(() => {
      const formatted = formatNumericValue(value, decimals);
      if (!isFocused) {
        setLocalText(formatted);
        lastEmittedRef.current = null;
      } else if (value !== prevPropValueRef.current) {
        if (lastEmittedRef.current !== null && value === lastEmittedRef.current) {
          lastEmittedRef.current = null;
        } else {
          setLocalText(formatted);
        }
      }
      prevPropValueRef.current = value;
    }, [value, isFocused, decimals]);

    const allowNegative = min == null || min < 0;
    const allowDecimal = decimals !== 0;

    const clampAndRound = (val: number) => {
      let clamped = val;
      if (min != null && clamped < min) clamped = min;
      if (max != null && clamped > max) clamped = max;
      return decimals != null ? Number(clamped.toFixed(decimals)) : clamped;
    };

    const handleChangeText = (text: string) => {
      // Normalize commas to dots (common in European keyboard locales)
      const normalized = text.replace(/,/g, '.');

      if (normalized === '') {
        setLocalText('');
        return;
      }

      if (normalized === '-') {
        if (allowNegative) setLocalText('-');
        return;
      }

      if (normalized === '.') {
        if (allowDecimal) setLocalText('.');
        return;
      }

      if (normalized === '-.') {
        if (allowNegative && allowDecimal) setLocalText('-.');
        return;
      }

      const regex = allowNegative
        ? allowDecimal
          ? /^-?\d*\.?\d*$/
          : /^-?\d*$/
        : allowDecimal
          ? /^\d*\.?\d*$/
          : /^\d*$/;

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
        lastEmittedRef.current = finalVal;
        onValueChange(finalVal);
      }
    };

    const handleFocus: NonNullable<TextInputProps['onFocus']> = e => {
      setIsFocused(true);
      if (fieldId) formNav?.notifyFocus(fieldId);
      onFocus?.(e);
    };

    const handleBlur: NonNullable<TextInputProps['onBlur']> = e => {
      setIsFocused(false);
      const parsed = parseFloat(localText);
      if (isNaN(parsed)) {
        const fallback = min != null ? min : 0;
        setLocalText(formatNumericValue(fallback, decimals));
        lastEmittedRef.current = fallback;
        onValueChange(fallback);
      } else {
        const clamped = clampAndRound(parsed);
        setLocalText(formatNumericValue(clamped, decimals));
        lastEmittedRef.current = clamped;
        onValueChange(clamped);
      }
      if (fieldId) formNav?.notifyBlur(fieldId);
      onBlur?.(e);
    };

    const isLastField = fieldId && formNav ? !formNav.hasNext(fieldId) : true;

    const handleSubmitEditing: NonNullable<TextInputProps['onSubmitEditing']> = e => {
      onSubmitEditing?.(e);
      if (fieldId && formNav) {
        if (formNav.hasNext(fieldId)) {
          formNav.focusNext(fieldId);
        } else {
          formNav.dismissKeyboard();
        }
      }
    };

    const handleStep = (delta: number) => {
      const parsed = parseFloat(localText);
      const base = !isNaN(parsed) ? parsed : isNaN(value) ? (min != null ? min : 0) : value;
      const next = clampAndRound(base + delta);
      setLocalText(formatNumericValue(next, decimals));
      lastEmittedRef.current = next;
      onValueChange(next);
    };

    const resolvedKeyboardType =
      keyboardType ?? (decimals === 0 ? 'number-pad' : 'decimal-pad');
    const resolvedInputMode = inputMode ?? (decimals === 0 ? 'numeric' : 'decimal');
    const resolvedReturnKeyType = returnKeyType ?? (isLastField ? 'done' : 'next');
    const resolvedEnterKeyHint = enterKeyHint ?? (isLastField ? 'done' : 'next');
    const resolvedSubmitBehavior =
      submitBehavior ?? (isLastField ? 'blurAndSubmit' : 'submit');

    const sharedInputProps: Omit<TextInputProps, 'style'> = {
      ...rest,
      value: localText,
      onChangeText: handleChangeText,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onSubmitEditing: handleSubmitEditing,
      keyboardType: resolvedKeyboardType,
      inputMode: resolvedInputMode,
      returnKeyType: resolvedReturnKeyType,
      enterKeyHint: resolvedEnterKeyHint,
      submitBehavior: resolvedSubmitBehavior,
      cursorColor: cursorColor ?? THEME.accentBrand,
      selectionColor: selectionColor ?? THEME.accentBrand,
      placeholderTextColor: placeholderTextColor ?? THEME.textMuted,
      selectTextOnFocus: selectTextOnFocus ?? true,
      maxLength: maxLength ?? 7,
      disableFullscreenUI: disableFullscreenUI ?? true,
    };

    if (step != null) {
      const parsedLocal = parseFloat(localText);
      const effectiveValue = !isNaN(parsedLocal) ? parsedLocal : value;
      const atMin = min != null && effectiveValue <= min;
      const atMax = max != null && effectiveValue >= max;
      const isCompactStepper = compactStepper ?? windowWidth < 520;

      return (
        <View
          ref={containerRef}
          collapsable={false}
          style={[styles.stepperOuter, isFocused && styles.inputFocused, style]}
        >
          {labelPrefix ? (
            <View style={styles.stepperHeaderTag}>
              <Text style={styles.stepperPrefixText}>{labelPrefix}</Text>
            </View>
          ) : null}
          {isCompactStepper ? (
            <>
              <TextInput
                ref={setInputRef}
                {...sharedInputProps}
                style={[styles.stepperInputCompact, webInputReset]}
              />
              <View style={styles.stepperActionsRow}>
                <TouchableOpacity
                  style={[styles.stepperActionBtn, atMin && styles.stepBtnDisabled]}
                  onPress={() => handleStep(-step)}
                  disabled={atMin}
                  hitSlop={{ top: 4, bottom: 6, left: 4, right: 4 }}
                  accessibilityLabel="Decrease value"
                >
                  <Minus
                    size={13}
                    color={atMin ? THEME.textMuted : THEME.textSecondary}
                    strokeWidth={2.5}
                  />
                </TouchableOpacity>
                <View style={styles.stepperActionDivider} />
                <TouchableOpacity
                  style={[styles.stepperActionBtn, atMax && styles.stepBtnDisabled]}
                  onPress={() => handleStep(step)}
                  disabled={atMax}
                  hitSlop={{ top: 4, bottom: 6, left: 4, right: 4 }}
                  accessibilityLabel="Increase value"
                >
                  <Plus
                    size={13}
                    color={atMax ? THEME.textMuted : THEME.textSecondary}
                    strokeWidth={2.5}
                  />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={[styles.stepBtn, atMin && styles.stepBtnDisabled]}
                onPress={() => handleStep(-step)}
                disabled={atMin}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                accessibilityLabel="Decrease value"
              >
                <Minus
                  size={12}
                  color={atMin ? THEME.textMuted : THEME.textSecondary}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>
              <TextInput
                ref={setInputRef}
                {...sharedInputProps}
                style={[styles.stepperInput, webInputReset]}
              />
              <TouchableOpacity
                style={[styles.stepBtn, atMax && styles.stepBtnDisabled]}
                onPress={() => handleStep(step)}
                disabled={atMax}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                accessibilityLabel="Increase value"
              >
                <Plus
                  size={12}
                  color={atMax ? THEME.textMuted : THEME.textSecondary}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }

    if (labelPrefix) {
      return (
        <View
          ref={containerRef}
          collapsable={false}
          style={[styles.prefixedContainer, isFocused && styles.inputFocused, style]}
        >
          <Text style={styles.prefixTag}>{labelPrefix}</Text>
          <TextInput
            ref={setInputRef}
            {...sharedInputProps}
            style={[styles.prefixedInput, webInputReset]}
          />
        </View>
      );
    }

    return (
      <View ref={containerRef} collapsable={false} style={[styles.plainWrapper, style]}>
        <TextInput
          ref={setInputRef}
          {...sharedInputProps}
          style={[styles.input, isFocused && styles.inputFocused, webInputReset]}
        />
      </View>
    );
  }
);

NumericInput.displayName = 'NumericInput';

const styles = StyleSheet.create({
  plainWrapper: {
    minWidth: 0,
  },
  input: {
    width: '100%',
    minHeight: 40,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 14,
    color: THEME.textPrimary,
    paddingHorizontal: 11,
    paddingVertical: 8,
    fontSize: inputFontSize,
    fontWeight: '600',
    minWidth: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
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
    borderRadius: 14,
    minHeight: 40,
    paddingLeft: 8,
    paddingRight: 8,
    minWidth: 0,
    gap: 6,
  },
  prefixTag: {
    fontSize: 8.5,
    fontWeight: '800',
    color: THEME.textSecondary,
    backgroundColor: THEME.bgSubtle,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    letterSpacing: 0.3,
  },
  prefixedInput: {
    flex: 1,
    minWidth: 44,
    minHeight: 38,
    color: THEME.textPrimary,
    paddingHorizontal: 4,
    paddingVertical: 8,
    fontSize: inputFontSize,
    fontWeight: '700',
    textAlign: 'right',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  stepperOuter: {
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 14,
    overflow: 'hidden',
    minWidth: 0,
  },
  stepperHeaderTag: {
    backgroundColor: THEME.bgSubtle,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingVertical: 2.5,
    alignItems: 'center',
  },
  stepperPrefixText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: THEME.textSecondary,
    letterSpacing: 0.6,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    minWidth: 0,
  },
  stepperInput: {
    flex: 1,
    minWidth: 38,
    minHeight: 38,
    color: THEME.textPrimary,
    paddingHorizontal: 4,
    paddingVertical: 7,
    fontSize: inputFontSize,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  stepperInputCompact: {
    width: '100%',
    minHeight: 38,
    color: THEME.textPrimary,
    paddingHorizontal: 6,
    paddingVertical: 7,
    fontSize: inputFontSize,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  stepperActionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    backgroundColor: THEME.bgSubtle,
  },
  stepperActionBtn: {
    flex: 1,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperActionDivider: {
    width: 1,
    backgroundColor: THEME.border,
  },
  stepBtn: {
    width: 26,
    height: 26,
    margin: 2,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bgSubtle,
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
});
