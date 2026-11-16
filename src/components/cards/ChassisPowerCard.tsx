import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CarCategory, Discipline, Drivetrain, VehicleInputs } from '../../types/tuning';
import { CollapsibleCard } from '../ui/CollapsibleCard';
import { NumericInput } from '../ui/NumericInput';
import { hpToPs, psToHp } from '../../utils/units';
import { THEME } from '../../theme';
import { t } from '../../i18n';

interface ChassisPowerCardProps {
  inputs: VehicleInputs;
  powerUnit: 'hp' | 'ps';
  onChangePowerUnit: (unit: 'hp' | 'ps') => void;
  onUpdateInputs: (updater: (prev: VehicleInputs) => VehicleInputs) => void;
  onUpdateNumeric: (key: keyof VehicleInputs, val: number) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const ChassisPowerCard: React.FC<ChassisPowerCardProps> = ({
  inputs,
  powerUnit,
  onChangePowerUnit,
  onUpdateInputs,
  onUpdateNumeric,
  collapsed,
  onToggleCollapse,
}) => {
  const isImp = inputs.units === 'imperial';

  return (
    <CollapsibleCard
      title={t('chassisAndPower')}
      collapsed={collapsed}
      onToggle={onToggleCollapse}
      collapsedSummary={`${inputs.category.toUpperCase()} • ${inputs.discipline.toUpperCase()} • ${inputs.drivetrain} • ${Math.round(inputs.hp)} HP`}
    >
      <Text style={styles.label}>{t('carCategory')}</Text>
      <View style={styles.pillGroupFull}>
        {([
          { key: 'jdm', label: t('jdmLabel') },
          { key: 'track', label: t('trackLabel') },
          { key: 'classic', label: t('classicLabel') },
          { key: 'supercar', label: t('supercarLabel') },
        ] as { key: CarCategory; label: string }[]).map(c => (
          <TouchableOpacity
            key={c.key}
            style={[styles.subPill, inputs.category === c.key && styles.subPillActive]}
            onPress={() => onUpdateInputs(p => ({ ...p, category: c.key }))}
          >
            <Text style={[styles.subPillText, inputs.category === c.key && styles.subPillTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('disciplineSurface')}</Text>
      <View style={styles.pillGroupFull}>
        {(['drift', 'grip', 'dirt', 'offroad', 'drag'] as Discipline[]).map(d => (
          <TouchableOpacity
            key={d}
            style={[styles.subPill, inputs.discipline === d && styles.subPillActive]}
            onPress={() => onUpdateInputs(p => ({ ...p, discipline: d }))}
          >
            <Text style={[styles.subPillText, inputs.discipline === d && styles.subPillTextActive]}>{d.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('drivetrain')}</Text>
      <View style={styles.pillGroupFull}>
        {(['RWD', 'AWD', 'FWD'] as Drivetrain[]).map(dt => (
          <TouchableOpacity
            key={dt}
            style={[styles.subPill, inputs.drivetrain === dt && styles.subPillActive]}
            onPress={() => onUpdateInputs(p => ({ ...p, drivetrain: dt }))}
          >
            <Text style={[styles.subPillText, inputs.drivetrain === dt && styles.subPillTextActive]}>{dt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <View style={styles.powerHeaderRow}>
            <Text style={[styles.label, { marginBottom: 0 }]}>{t('power')}</Text>
            <View style={styles.unitMiniSwitch}>
              <TouchableOpacity
                style={[styles.unitMiniBtn, powerUnit === 'hp' && styles.unitMiniBtnActive]}
                onPress={() => onChangePowerUnit('hp')}
              >
                <Text style={[styles.unitMiniText, powerUnit === 'hp' && styles.unitMiniTextActive]}>{t('hpUnit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitMiniBtn, powerUnit === 'ps' && styles.unitMiniBtnActive]}
                onPress={() => onChangePowerUnit('ps')}
              >
                <Text style={[styles.unitMiniText, powerUnit === 'ps' && styles.unitMiniTextActive]}>{t('psUnit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <NumericInput
            value={powerUnit === 'ps' ? Math.round(hpToPs(inputs.hp)) : inputs.hp}
            min={30}
            max={3000}
            onValueChange={v => onUpdateNumeric('hp', powerUnit === 'ps' ? psToHp(v) : v)}
          />
          <Text style={styles.approxHint}>
            {powerUnit === 'ps' ? t('approxHp', { val: inputs.hp }) : t('approxPs', { val: Math.round(hpToPs(inputs.hp)) })}
          </Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>{t('weight', { unit: isImp ? 'lbs' : 'kg' })}</Text>
          <NumericInput
            value={inputs.weight}
            min={300}
            max={9000}
            onValueChange={v => onUpdateNumeric('weight', v)}
          />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>{t('frontWeightPct')}</Text>
          <NumericInput
            value={inputs.frontWeightPct}
            decimals={1}
            min={30}
            max={75}
            onValueChange={v => onUpdateNumeric('frontWeightPct', v)}
          />
        </View>
      </View>
    </CollapsibleCard>
  );
};

const styles = StyleSheet.create({
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
  row: { flexDirection: 'row', gap: 8, marginBottom: 8, width: '100%' },
  col: { flex: 1, minWidth: 0 },
  powerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  unitMiniSwitch: {
    flexDirection: 'row',
    backgroundColor: THEME.bgCanvas,
    borderRadius: 4,
    padding: 1,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  unitMiniBtn: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  unitMiniBtnActive: {
    backgroundColor: THEME.accentBrand,
  },
  unitMiniText: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.textSecondary,
  },
  unitMiniTextActive: {
    color: '#ffffff',
  },
  approxHint: {
    fontSize: 9.5,
    color: THEME.textMuted,
    marginTop: 3,
  },
});
