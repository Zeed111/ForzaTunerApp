import React, { useState, useEffect } from 'react';
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
  const [lastPsInput, setLastPsInput] = useState<{ hp: number; ps: number } | null>(null);

  useEffect(() => {
    if (lastPsInput && (powerUnit !== 'ps' || lastPsInput.hp !== inputs.hp)) {
      setLastPsInput(null);
    }
  }, [lastPsInput, powerUnit, inputs.hp]);

  const powerDisplayValue =
    powerUnit === 'ps'
      ? lastPsInput && lastPsInput.hp === inputs.hp
        ? lastPsInput.ps
        : hpToPs(inputs.hp)
      : inputs.hp;

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
          { key: 'sports', label: t('sportsLabel') },
          { key: 'track', label: t('trackLabel') },
          { key: 'classic', label: t('classicLabel') },
          { key: 'supercar', label: t('supercarLabel') },
          { key: 'offroad', label: t('offroadLabel') },
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
            <Text style={[styles.label, styles.labelInline]} numberOfLines={1}>
              {t('power')}
            </Text>
            <View style={styles.unitMiniSwitch}>
              <TouchableOpacity
                style={[styles.unitMiniBtn, powerUnit === 'hp' && styles.unitMiniBtnActive]}
                onPress={() => {
                  setLastPsInput(null);
                  onChangePowerUnit('hp');
                }}
              >
                <Text style={[styles.unitMiniText, powerUnit === 'hp' && styles.unitMiniTextActive]}>{t('hpUnit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitMiniBtn, powerUnit === 'ps' && styles.unitMiniBtnActive]}
                onPress={() => {
                  setLastPsInput(null);
                  onChangePowerUnit('ps');
                }}
              >
                <Text style={[styles.unitMiniText, powerUnit === 'ps' && styles.unitMiniTextActive]}>{t('psUnit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <NumericInput
            fieldId="chassis-power"
            fieldLabel="Chassis • Power"
            fieldOrder={101}
            value={powerDisplayValue}
            decimals={0}
            min={30}
            max={3000}
            maxLength={5}
            onValueChange={v => {
              if (powerUnit === 'ps') {
                const nextHp = psToHp(v);
                setLastPsInput({ hp: nextHp, ps: v });
                onUpdateNumeric('hp', nextHp);
              } else {
                setLastPsInput(null);
                onUpdateNumeric('hp', v);
              }
            }}
            onBlur={() => setLastPsInput(null)}
          />
          <Text style={styles.approxHint}>
            {powerUnit === 'ps' ? t('approxHp', { val: inputs.hp }) : t('approxPs', { val: hpToPs(inputs.hp) })}
          </Text>
        </View>
        <View style={styles.col}>
          <View style={styles.colHeaderRow}>
            <Text style={[styles.label, styles.labelInline]} numberOfLines={1}>
              {t('weight', { unit: isImp ? 'lbs' : 'kg' })}
            </Text>
          </View>
          <NumericInput
            fieldId="chassis-weight"
            fieldLabel="Chassis • Weight"
            fieldOrder={102}
            value={inputs.weight}
            decimals={0}
            min={300}
            max={9000}
            maxLength={5}
            onValueChange={v => onUpdateNumeric('weight', v)}
          />
        </View>
        <View style={styles.col}>
          <View style={styles.colHeaderRow}>
            <Text style={[styles.label, styles.labelInline]} numberOfLines={1}>
              {t('frontWeightPct')}
            </Text>
          </View>
          <NumericInput
            fieldId="chassis-front-weight"
            fieldLabel="Chassis • Front Wt %"
            fieldOrder={103}
            value={inputs.frontWeightPct}
            decimals={1}
            min={30}
            max={75}
            maxLength={5}
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
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8, width: '100%' },
  col: { flex: 1, minWidth: 0 },
  labelInline: { marginBottom: 0, flexShrink: 1 },
  colHeaderRow: {
    minHeight: 22,
    justifyContent: 'center',
    marginBottom: 4,
  },
  powerHeaderRow: {
    minHeight: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  unitMiniSwitch: {
    flexDirection: 'row',
    backgroundColor: THEME.bgCanvas,
    borderRadius: 999,
    padding: 2,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  unitMiniBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
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
