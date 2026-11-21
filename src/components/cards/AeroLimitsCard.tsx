import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
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
  const { width } = useWindowDimensions();
  const stackAxes = width < 600;
  const isImp = inputs.units === 'imperial';

  return (
    <CollapsibleCard
      title={t('aeroLimits')}
      collapsed={collapsed}
      onToggle={onToggleCollapse}
      collapsedSummary={`F ${inputs.aeroFrontMin}-${inputs.aeroFrontMax} • R ${inputs.aeroRearMin}-${inputs.aeroRearMax}`}
    >
      <View style={[styles.row, stackAxes && styles.rowStacked]}>
        <View style={stackAxes ? styles.colFull : styles.col}>
          <Text style={styles.label}>{t('frontAero', { unit: isImp ? 'lbf' : 'kgf' })}</Text>
          <View style={stackAxes ? styles.rowTightStacked : styles.rowTight}>
            <NumericInput
              style={styles.inputHalf}
              fieldId="aero-front-min"
              fieldLabel="Front Aero • MIN"
              fieldOrder={401}
              labelPrefix="MIN"
              placeholder={t('placeholderMin')}
              value={inputs.aeroFrontMin}
              decimals={0}
              min={0}
              maxLength={6}
              onValueChange={v => onUpdateNumeric('aeroFrontMin', v)}
            />
            <NumericInput
              style={styles.inputHalf}
              fieldId="aero-front-max"
              fieldLabel="Front Aero • MAX"
              fieldOrder={402}
              labelPrefix="MAX"
              placeholder={t('placeholderMax')}
              value={inputs.aeroFrontMax}
              decimals={0}
              min={0}
              maxLength={6}
              onValueChange={v => onUpdateNumeric('aeroFrontMax', v)}
            />
          </View>
        </View>
        <View style={stackAxes ? styles.colFull : styles.col}>
          <Text style={styles.label}>{t('rearAero', { unit: isImp ? 'lbf' : 'kgf' })}</Text>
          <View style={stackAxes ? styles.rowTightStacked : styles.rowTight}>
            <NumericInput
              style={styles.inputHalf}
              fieldId="aero-rear-min"
              fieldLabel="Rear Aero • MIN"
              fieldOrder={403}
              labelPrefix="MIN"
              placeholder={t('placeholderMin')}
              value={inputs.aeroRearMin}
              decimals={0}
              min={0}
              maxLength={6}
              onValueChange={v => onUpdateNumeric('aeroRearMin', v)}
            />
            <NumericInput
              style={styles.inputHalf}
              fieldId="aero-rear-max"
              fieldLabel="Rear Aero • MAX"
              fieldOrder={404}
              labelPrefix="MAX"
              placeholder={t('placeholderMax')}
              value={inputs.aeroRearMax}
              decimals={0}
              min={0}
              maxLength={6}
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
  rowStacked: { flexDirection: 'column', gap: 10 },
  rowTight: { flexDirection: 'row', gap: 4, flex: 1, minWidth: 0 },
  rowTightStacked: { flexDirection: 'row', gap: 8, width: '100%' },
  col: { flex: 1, minWidth: 0 },
  colFull: { width: '100%' },
  label: { fontSize: 11, color: THEME.textSecondary, marginBottom: 4, fontWeight: '600' },
  inputHalf: { flex: 1, minWidth: 0 },
});
