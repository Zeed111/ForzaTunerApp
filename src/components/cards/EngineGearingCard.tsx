import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EngineType, VehicleInputs } from '../../types/tuning';
import { CollapsibleCard } from '../ui/CollapsibleCard';
import { NumericInput } from '../ui/NumericInput';
import { THEME } from '../../theme';
import { t } from '../../i18n';

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
          <Text style={styles.label}>{t('redlineRpm')}</Text>
          <NumericInput
            value={inputs.redlineRpm}
            min={2000}
            max={22000}
            onValueChange={v => onUpdateNumeric('redlineRpm', v)}
          />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>{t('topSpeed', { unit: isImp ? 'mph' : 'km/h' })}</Text>
          <NumericInput
            value={inputs.topSpeed}
            min={50}
            max={550}
            onValueChange={v => onUpdateNumeric('topSpeed', v)}
          />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>{t('gears')}</Text>
          <NumericInput
            value={inputs.numGears}
            min={1}
            max={10}
            decimals={0}
            step={1}
            onValueChange={v => onUpdateNumeric('numGears', v)}
          />
        </View>
      </View>

      <Text style={[styles.label, { marginTop: 8 }]}>{t('powerBandCurve')}</Text>
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
  row: { flexDirection: 'row', gap: 8, marginBottom: 8, width: '100%' },
  col: { flex: 1, minWidth: 0 },
  label: { fontSize: 11, color: THEME.textSecondary, marginBottom: 4, fontWeight: '600' },
  pillGroupFull: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  subPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: THEME.bgElevated,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  subPillActive: { backgroundColor: THEME.accentBrand, borderColor: THEME.accentBrand },
  subPillText: { color: THEME.textSecondary, fontSize: 11, fontWeight: '700' },
  subPillTextActive: { color: '#ffffff' },
});
