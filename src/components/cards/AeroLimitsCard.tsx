import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VehicleInputs } from '../../types/tuning';
import { CollapsibleCard } from '../ui/CollapsibleCard';
import { NumericInput } from '../ui/NumericInput';
import { THEME } from '../../theme';
import { t } from '../../i18n';

interface AeroLimitsCardProps {
  inputs: VehicleInputs;
  onUpdateNumeric: (key: keyof VehicleInputs, val: number) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const AeroLimitsCard: React.FC<AeroLimitsCardProps> = ({
  inputs,
  onUpdateNumeric,
  collapsed,
  onToggleCollapse,
}) => {
  const isImp = inputs.units === 'imperial';

  return (
    <CollapsibleCard
      title={t('aeroLimits')}
      collapsed={collapsed}
      onToggle={onToggleCollapse}
      collapsedSummary={`F ${inputs.aeroFrontMin}-${inputs.aeroFrontMax} • R ${inputs.aeroRearMin}-${inputs.aeroRearMax}`}
    >
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>{t('frontAero', { unit: isImp ? 'lbf' : 'kgf' })}</Text>
          <View style={styles.rowTight}>
            <NumericInput
              style={styles.inputHalf}
              labelPrefix="MIN"
              placeholder={t('placeholderMin')}
              value={inputs.aeroFrontMin}
              onValueChange={v => onUpdateNumeric('aeroFrontMin', v)}
            />
            <NumericInput
              style={styles.inputHalf}
              labelPrefix="MAX"
              placeholder={t('placeholderMax')}
              value={inputs.aeroFrontMax}
              onValueChange={v => onUpdateNumeric('aeroFrontMax', v)}
            />
          </View>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>{t('rearAero', { unit: isImp ? 'lbf' : 'kgf' })}</Text>
          <View style={styles.rowTight}>
            <NumericInput
              style={styles.inputHalf}
              labelPrefix="MIN"
              placeholder={t('placeholderMin')}
              value={inputs.aeroRearMin}
              onValueChange={v => onUpdateNumeric('aeroRearMin', v)}
            />
            <NumericInput
              style={styles.inputHalf}
              labelPrefix="MAX"
              placeholder={t('placeholderMax')}
              value={inputs.aeroRearMax}
              onValueChange={v => onUpdateNumeric('aeroRearMax', v)}
            />
          </View>
        </View>
      </View>
    </CollapsibleCard>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 8, width: '100%' },
  rowTight: { flexDirection: 'row', gap: 4, flex: 1, minWidth: 0 },
  col: { flex: 1, minWidth: 0 },
  label: { fontSize: 11, color: THEME.textSecondary, marginBottom: 4, fontWeight: '600' },
  inputHalf: { flex: 1, minWidth: 0 },
});
