import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TireCompound, VehicleInputs } from '../../types/tuning';
import { CollapsibleCard } from '../ui/CollapsibleCard';
import { NumericInput } from '../ui/NumericInput';
import { THEME } from '../../theme';
import { t } from '../../i18n';

interface TiresKinematicsCardProps {
  inputs: VehicleInputs;
  onUpdateInputs: (updater: (prev: VehicleInputs) => VehicleInputs) => void;
  onUpdateNumeric: (key: keyof VehicleInputs, val: number) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const TiresKinematicsCard: React.FC<TiresKinematicsCardProps> = ({
  inputs,
  onUpdateInputs,
  onUpdateNumeric,
  collapsed,
  onToggleCollapse,
}) => {
  const isImp = inputs.units === 'imperial';
  const diaF = (2 * (inputs.tWidthF * (inputs.tProfileF / 100)) + inputs.tRimF * 25.4) / 1000;
  const diaR = (2 * (inputs.tWidthR * (inputs.tProfileR / 100)) + inputs.tRimR * 25.4) / 1000;

  return (
    <CollapsibleCard
      title={t('frontRearTireSizes')}
      collapsed={collapsed}
      onToggle={onToggleCollapse}
      collapsedSummary={`${inputs.tWidthF}/${inputs.tProfileF}R${inputs.tRimF} • ${inputs.tWidthR}/${inputs.tProfileR}R${inputs.tRimR}`}
    >
      <Text style={styles.label}>{t('tireCompound')}</Text>
      <View style={styles.pillGroupFull}>
        {(
          [
            { key: 'stock', label: t('compoundStock') },
            { key: 'street', label: t('compoundStreet') },
            { key: 'sport', label: t('compoundSport') },
            { key: 'semislick', label: t('compoundSemislick') },
            { key: 'slick', label: t('compoundSlick') },
            { key: 'rally', label: t('compoundRally') },
            { key: 'offroad', label: t('compoundOffroad') },
            { key: 'drift', label: t('compoundDrift') },
            { key: 'drag', label: t('compoundDrag') },
          ] as { key: TireCompound; label: string }[]
        ).map(c => (
          <TouchableOpacity
            key={c.key}
            style={[styles.subPill, (inputs.tireCompound || 'sport') === c.key && styles.subPillActive]}
            onPress={() => onUpdateInputs(p => ({ ...p, tireCompound: c.key }))}
          >
            <Text style={[styles.subPillText, (inputs.tireCompound || 'sport') === c.key && styles.subPillTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('frontTireLabel')}</Text>
      <View style={styles.row}>
        <NumericInput
          style={styles.col}
          labelPrefix="W"
          placeholder={t('placeholderWidth')}
          value={inputs.tWidthF}
          min={125}
          max={455}
          step={10}
          onValueChange={v => onUpdateNumeric('tWidthF', v)}
        />
        <NumericInput
          style={styles.col}
          labelPrefix="ASP"
          placeholder={t('placeholderProfile')}
          value={inputs.tProfileF}
          min={15}
          max={85}
          step={5}
          onValueChange={v => onUpdateNumeric('tProfileF', v)}
        />
        <NumericInput
          style={styles.col}
          labelPrefix="RIM"
          placeholder={t('placeholderRim')}
          value={inputs.tRimF}
          min={12}
          max={26}
          step={1}
          onValueChange={v => onUpdateNumeric('tRimF', v)}
        />
      </View>
      <Text style={styles.badgeInfo}>
        {t('frontDiaCirc', {
          dia: isImp ? `${(diaF * 39.3701).toFixed(1)} in` : `${(diaF * 100).toFixed(1)} cm`,
          circ: isImp ? `${(Math.PI * diaF * 3.28084).toFixed(2)} ft` : `${(Math.PI * diaF).toFixed(2)} m`,
        })}
      </Text>

      <View style={styles.rearTireHeaderRow}>
        <Text style={[styles.label, { marginBottom: 0 }]}>{t('rearTireLabel')}</Text>
        <View style={styles.tireQuickBtns}>
          <TouchableOpacity
            style={styles.tireQuickBtn}
            onPress={() =>
              onUpdateInputs(p => ({
                ...p,
                tWidthR: p.tWidthF,
                tProfileR: p.tProfileF,
                tRimR: p.tRimF,
              }))
            }
          >
            <Text style={styles.tireQuickBtnText}>{t('matchFrontTires')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tireQuickBtn}
            onPress={() =>
              onUpdateInputs(p => ({
                ...p,
                tWidthR: Math.min(405, p.tWidthF + 30),
              }))
            }
          >
            <Text style={styles.tireQuickBtnText}>{t('staggerPlus30')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.row}>
        <NumericInput
          style={styles.col}
          labelPrefix="W"
          placeholder={t('placeholderWidth')}
          value={inputs.tWidthR}
          min={125}
          max={455}
          step={10}
          onValueChange={v => onUpdateNumeric('tWidthR', v)}
        />
        <NumericInput
          style={styles.col}
          labelPrefix="ASP"
          placeholder={t('placeholderProfile')}
          value={inputs.tProfileR}
          min={15}
          max={85}
          step={5}
          onValueChange={v => onUpdateNumeric('tProfileR', v)}
        />
        <NumericInput
          style={styles.col}
          labelPrefix="RIM"
          placeholder={t('placeholderRim')}
          value={inputs.tRimR}
          min={12}
          max={26}
          step={1}
          onValueChange={v => onUpdateNumeric('tRimR', v)}
        />
      </View>
      <Text style={styles.badgeInfo}>
        {t('rearDiaCirc', {
          dia: isImp ? `${(diaR * 39.3701).toFixed(1)} in` : `${(diaR * 100).toFixed(1)} cm`,
          circ: isImp ? `${(Math.PI * diaR * 3.28084).toFixed(2)} ft` : `${(Math.PI * diaR).toFixed(2)} m`,
        })}
      </Text>
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
  badgeInfo: {
    fontSize: 10,
    color: THEME.accentSteel,
    marginTop: 3,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  rearTireHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 4,
  },
  tireQuickBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  tireQuickBtn: {
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  tireQuickBtnText: {
    color: THEME.accentSteel,
    fontSize: 9.5,
    fontWeight: '700',
  },
});
