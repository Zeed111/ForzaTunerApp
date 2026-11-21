import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EngineType, VehicleInputs } from '../../types/tuning';
import { CollapsibleCard } from '../ui/CollapsibleCard';
import { NumericInput } from '../ui/NumericInput';
import { THEME } from '../../theme';
import { t } from '../../i18n';

const GEAR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

interface EngineGearingCardProps {
  inputs: VehicleInputs;
  onUpdateInputs: (updater: (prev: VehicleInputs) => VehicleInputs) => void;
  onUpdateNumeric: (key: keyof VehicleInputs, val: number) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const EngineGearingCard: React.FC<EngineGearingCardProps> = ({
  inputs,
  onUpdateInputs,
  onUpdateNumeric,
  collapsed,
  onToggleCollapse,
}) => {
  const isImp = inputs.units === 'imperial';

  return (
    <CollapsibleCard
      title={t('engineTransmissionSpecs')}
      collapsed={collapsed}
      onToggle={onToggleCollapse}
      collapsedSummary={`${inputs.numGears} Gears • ${inputs.redlineRpm} RPM • ${inputs.topSpeed} ${isImp ? 'mph' : 'km/h'}`}
    >
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label} numberOfLines={1}>{t('redlineRpm')}</Text>
          <NumericInput
            fieldId="engine-redline"
            fieldLabel="Engine • Redline RPM"
            fieldOrder={501}
            value={inputs.redlineRpm}
            decimals={0}
            min={2000}
            max={22000}
            maxLength={5}
            onValueChange={v => onUpdateNumeric('redlineRpm', v)}
          />
        </View>
        <View style={styles.col}>
          <Text style={styles.label} numberOfLines={1}>{t('topSpeed', { unit: isImp ? 'mph' : 'km/h' })}</Text>
          <NumericInput
            fieldId="engine-top-speed"
            fieldLabel="Engine • Top Speed"
            fieldOrder={502}
            value={inputs.topSpeed}
            decimals={0}
            min={50}
            max={550}
            maxLength={4}
            onValueChange={v => onUpdateNumeric('topSpeed', v)}
          />
        </View>
      </View>

      <View style={styles.gearHeaderRow}>
        <Text style={[styles.label, { marginBottom: 0 }]}>{t('gears')}</Text>
        <Text style={styles.gearSelectedBadge}>
          {inputs.numGears === 1 ? '1-Speed (Direct)' : `${inputs.numGears}-Speed`}
        </Text>
      </View>
      <View style={styles.gearTrack}>
        {GEAR_OPTIONS.map(g => {
          const isActive = inputs.numGears === g;
          return (
            <TouchableOpacity
              key={`gear-${g}`}
              style={[styles.gearPill, isActive && styles.gearPillActive]}
              accessibilityRole="button"
              accessibilityLabel={`${g} gears`}
              accessibilityState={{ selected: isActive }}
              onPress={() => onUpdateNumeric('numGears', g)}
            >
              <Text
                style={[styles.gearPillText, isActive && styles.gearPillTextActive]}
                numberOfLines={1}
              >
                {g}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.label, { marginTop: 10 }]}>{t('powerBandCurve')}</Text>
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
              onUpdateInputs(p => ({
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
    </CollapsibleCard>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8, width: '100%' },
  col: { flex: 1, minWidth: 0 },
  label: { fontSize: 11, color: THEME.textSecondary, marginBottom: 4, fontWeight: '600' },
  gearHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  gearSelectedBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.accentAmber,
  },
  gearTrack: {
    flexDirection: 'row',
    backgroundColor: THEME.bgCanvas,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 14,
    padding: 3,
    gap: 3,
    marginBottom: 4,
  },
  gearPill: {
    flex: 1,
    minWidth: 0,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  gearPillActive: {
    backgroundColor: THEME.accentBrand,
    borderColor: THEME.accentBrand,
  },
  gearPillText: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
  },
  gearPillTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  pillGroupFull: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  subPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: THEME.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  subPillActive: {
    backgroundColor: THEME.accentBrand,
    borderColor: THEME.accentBrand,
    borderRadius: 999,
  },
  subPillText: { color: THEME.textSecondary, fontSize: 11.5, fontWeight: '700' },
  subPillTextActive: { color: '#ffffff' },
});
