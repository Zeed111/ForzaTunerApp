import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Sliders, Sparkles } from 'lucide-react-native';
import { VehicleInputs } from '../../types/tuning';
import { CollapsibleCard } from '../ui/CollapsibleCard';
import { NumericInput } from '../ui/NumericInput';
import { HandlingBiasTrack } from '../ui/HandlingBiasTrack';
import { THEME } from '../../theme';
import { t } from '../../i18n';

interface SuspensionLimitsCardProps {
  inputs: VehicleInputs;
  onUpdateInputs: (updater: (prev: VehicleInputs) => VehicleInputs) => void;
  onUpdateNumeric: (key: keyof VehicleInputs, val: number) => void;
  onAutoScaleLimits: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const SuspensionLimitsCard: React.FC<SuspensionLimitsCardProps> = ({
  inputs,
  onUpdateInputs,
  onUpdateNumeric,
  onAutoScaleLimits,
  collapsed,
  onToggleCollapse,
}) => {
  const isImp = inputs.units === 'imperial';
  const currentBias = inputs.handlingBias || 0;

  return (
    <CollapsibleCard
      title={t('sliderLimits')}
      icon={<Sliders size={13} color={THEME.accentAmber} />}
      collapsed={collapsed}
      onToggle={onToggleCollapse}
      collapsedSummary={`Bias ${currentBias > 0 ? `+${currentBias}` : currentBias}`}
    >
      <View style={styles.autoScaleRow}>
        <TouchableOpacity style={styles.autoScaleBtn} onPress={onAutoScaleLimits}>
          <Sparkles size={11} color={THEME.accentAmber} strokeWidth={2.3} />
          <Text style={styles.autoScaleBtnText}>{t('autoScaleLimits')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>{t('frontSprings', { unit: isImp ? 'lb/in' : 'kgf/mm' })}</Text>
          <View style={styles.rowTight}>
            <NumericInput
              style={styles.inputHalf}
              labelPrefix="MIN"
              placeholder={t('placeholderMin')}
              value={inputs.springFrontMin}
              decimals={1}
              onValueChange={v => onUpdateNumeric('springFrontMin', v)}
            />
            <NumericInput
              style={styles.inputHalf}
              labelPrefix="MAX"
              placeholder={t('placeholderMax')}
              value={inputs.springFrontMax}
              decimals={1}
              onValueChange={v => onUpdateNumeric('springFrontMax', v)}
            />
          </View>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>{t('rearSprings', { unit: isImp ? 'lb/in' : 'kgf/mm' })}</Text>
          <View style={styles.rowTight}>
            <NumericInput
              style={styles.inputHalf}
              labelPrefix="MIN"
              placeholder={t('placeholderMin')}
              value={inputs.springRearMin}
              decimals={1}
              onValueChange={v => onUpdateNumeric('springRearMin', v)}
            />
            <NumericInput
              style={styles.inputHalf}
              labelPrefix="MAX"
              placeholder={t('placeholderMax')}
              value={inputs.springRearMax}
              decimals={1}
              onValueChange={v => onUpdateNumeric('springRearMax', v)}
            />
          </View>
        </View>
      </View>

      <View style={[styles.row, { marginTop: 6 }]}>
        <View style={styles.col}>
          <Text style={styles.label}>{t('frontRideHeight', { unit: isImp ? 'in' : 'cm' })}</Text>
          <View style={styles.rowTight}>
            <NumericInput
              style={styles.inputHalf}
              labelPrefix="MIN"
              placeholder={t('placeholderMin')}
              value={inputs.heightFrontMin}
              decimals={1}
              onValueChange={v => onUpdateNumeric('heightFrontMin', v)}
            />
            <NumericInput
              style={styles.inputHalf}
              labelPrefix="MAX"
              placeholder={t('placeholderMax')}
              value={inputs.heightFrontMax}
              decimals={1}
              onValueChange={v => onUpdateNumeric('heightFrontMax', v)}
            />
          </View>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>{t('rearRideHeight', { unit: isImp ? 'in' : 'cm' })}</Text>
          <View style={styles.rowTight}>
            <NumericInput
              style={styles.inputHalf}
              labelPrefix="MIN"
              placeholder={t('placeholderMin')}
              value={inputs.heightRearMin}
              decimals={1}
              onValueChange={v => onUpdateNumeric('heightRearMin', v)}
            />
            <NumericInput
              style={styles.inputHalf}
              labelPrefix="MAX"
              placeholder={t('placeholderMax')}
              value={inputs.heightRearMax}
              decimals={1}
              onValueChange={v => onUpdateNumeric('heightRearMax', v)}
            />
          </View>
        </View>
      </View>

      <HandlingBiasTrack
        value={currentBias}
        onChange={nextBias => onUpdateInputs(p => ({ ...p, handlingBias: nextBias }))}
      />
    </CollapsibleCard>
  );
};

const styles = StyleSheet.create({
  autoScaleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  autoScaleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  autoScaleBtnText: {
    color: THEME.accentAmber,
    fontSize: 10.5,
    fontWeight: '700',
  },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8, width: '100%' },
  rowTight: { flexDirection: 'row', gap: 4, flex: 1, minWidth: 0 },
  col: { flex: 1, minWidth: 0 },
  label: { fontSize: 11, color: THEME.textSecondary, marginBottom: 4, fontWeight: '600' },
  inputHalf: { flex: 1, minWidth: 0 },
});
