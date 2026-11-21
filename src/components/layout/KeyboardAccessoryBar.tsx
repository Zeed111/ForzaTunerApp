import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { THEME } from '../../theme';

export interface KeyboardAccessoryBarProps {
  label: string | null;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onDone: () => void;
}

export const KeyboardAccessoryBar: React.FC<KeyboardAccessoryBarProps> = ({
  label,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onDone,
}) => {
  return (
    <View
      style={styles.bar}
      onPointerDown={Platform.OS === 'web' ? e => e.preventDefault() : undefined}
    >
      <View style={styles.navGroup}>
        <TouchableOpacity
          style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
          onPress={onPrev}
          disabled={!canGoPrev}
          focusable={false}
          accessibilityRole="button"
          accessibilityLabel="Previous field"
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        >
          <ChevronUp
            size={16}
            color={canGoPrev ? THEME.textPrimary : THEME.textMuted}
            strokeWidth={2.5}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
          onPress={onNext}
          disabled={!canGoNext}
          focusable={false}
          accessibilityRole="button"
          accessibilityLabel="Next field"
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        >
          <ChevronDown
            size={16}
            color={canGoNext ? THEME.textPrimary : THEME.textMuted}
            strokeWidth={2.5}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.fieldLabel} numberOfLines={1} ellipsizeMode="tail">
        {label ?? ''}
      </Text>

      <TouchableOpacity
        style={styles.doneBtn}
        onPress={onDone}
        focusable={false}
        accessibilityRole="button"
        accessibilityLabel="Done editing"
        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      >
        <Text style={styles.doneBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    height: 44,
    backgroundColor: THEME.bgCard,
    borderTopWidth: 1,
    borderTopColor: THEME.borderStrong,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navBtn: {
    minWidth: 36,
    height: 32,
    borderRadius: 999,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  fieldLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textSecondary,
    textAlign: 'center',
  },
  doneBtn: {
    backgroundColor: THEME.accentBrand,
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
