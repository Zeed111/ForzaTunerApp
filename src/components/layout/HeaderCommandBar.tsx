import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Car, Stethoscope, ClipboardCheck, Bookmark, RotateCcw } from 'lucide-react-native';
import { UnitSystem } from '../../types/tuning';
import { THEME } from '../../theme';
import { t } from '../../i18n';

interface HeaderCommandBarProps {
  isWideScreen: boolean;
  units: UnitSystem;
  onToggleUnits: (system: UnitSystem) => void;
  onReset: () => void;
  onOpenCars: () => void;
  onOpenDoctor: () => void;
  onOpenChecklist: () => void;
  onOpenGarage: () => void;
}

export const HeaderCommandBar: React.FC<HeaderCommandBarProps> = ({
  isWideScreen,
  units,
  onToggleUnits,
  onReset,
  onOpenCars,
  onOpenDoctor,
  onOpenChecklist,
  onOpenGarage,
}) => {
  const commandControls = (
    <View style={[styles.commandBar, isWideScreen && styles.commandBarWide]}>
      <View style={styles.settingsGroup}>
        <View style={styles.pillGroup}>
          <TouchableOpacity
            style={[styles.pillBtn, units === 'metric' && styles.pillActive]}
            onPress={() => onToggleUnits('metric')}
          >
            <Text style={[styles.pillText, units === 'metric' && styles.pillTextActive]}>{t('metric')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pillBtn, units === 'imperial' && styles.pillActive]}
            onPress={() => onToggleUnits('imperial')}
          >
            <Text style={[styles.pillText, units === 'imperial' && styles.pillTextActive]}>{t('imperial')}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.cmdBtn} onPress={onReset}>
          <RotateCcw size={12} color={THEME.accentDanger} strokeWidth={2.4} />
          <Text style={styles.cmdBtnText}>{t('reset')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.cmdBtn} onPress={onOpenCars}>
          <Car size={13} color={THEME.accentSteel} strokeWidth={2.3} />
          <Text style={styles.cmdBtnText}>{t('cars')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cmdBtn} onPress={onOpenDoctor}>
          <Stethoscope size={13} color={THEME.accentAmber} strokeWidth={2.3} />
          <Text style={styles.cmdBtnText}>{t('doctor')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cmdBtn} onPress={onOpenChecklist}>
          <ClipboardCheck size={13} color={THEME.accentSuccess} strokeWidth={2.3} />
          <Text style={styles.cmdBtnText}>{t('checklist')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cmdBtn} onPress={onOpenGarage}>
          <Bookmark size={13} color={THEME.accentBrand} strokeWidth={2.3} />
          <Text style={styles.cmdBtnText}>{t('garage')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isWideScreen) {
    return (
      <View style={styles.desktopHeaderBar}>
        <View style={styles.desktopBrandBlock}>
          <Text style={styles.title}>{t('forza')}<Text style={styles.titleAccent}>{t('proTuner')}</Text></Text>
          <Text style={styles.subtitle}>{t('subtitle')}</Text>
        </View>
        {commandControls}
      </View>
    );
  }

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>{t('forza')}<Text style={styles.titleAccent}>{t('proTuner')}</Text></Text>
        <Text style={styles.subtitle}>{t('subtitle')}</Text>
      </View>
      {commandControls}
    </View>
  );
};

const styles = StyleSheet.create({
  desktopHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  desktopBrandBlock: {
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: 12, marginTop: 4 },
  title: { fontSize: 22, fontWeight: '900', color: THEME.textPrimary, letterSpacing: 1.5 },
  titleAccent: { color: THEME.accentBrand },
  subtitle: { fontSize: 11, color: THEME.textSecondary, marginTop: 3, letterSpacing: 0.4 },
  commandBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  commandBarWide: {
    marginBottom: 0,
    justifyContent: 'flex-end',
  },
  settingsGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pillGroup: {
    flexDirection: 'row',
    backgroundColor: THEME.bgCard,
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  pillBtn: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 6 },
  pillActive: { backgroundColor: THEME.accentBrand },
  pillText: { color: THEME.textSecondary, fontSize: 11.5, fontWeight: '700' },
  pillTextActive: { color: '#ffffff' },
  actionRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  cmdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: THEME.bgElevated,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  cmdBtnText: { color: THEME.textPrimary, fontSize: 11, fontWeight: '700' },
});
