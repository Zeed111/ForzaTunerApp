import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../../theme';
import { t } from '../../i18n';

const BIAS_STOPS = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];

interface HandlingBiasTrackProps {
  value: number;
  onChange: (nextBias: number) => void;
}

export const HandlingBiasTrack: React.FC<HandlingBiasTrackProps> = ({ value, onChange }) => {
  return (
    <View style={styles.biasCard}>
      <View style={styles.headerRow}>
        <Text style={styles.biasTitle}>{t('handlingBiasTitle')}</Text>
        <Text
          style={[
            styles.biasValueText,
            value < 0 && { color: THEME.accentSteel },
            value > 0 && { color: THEME.accentBrand },
          ]}
        >
          {value === 0
            ? t('handlingNeutral')
            : value > 0
            ? `+${value} ${t('handlingAgile')}`
            : `${value} ${t('handlingStable')}`}
        </Text>
      </View>
      <Text style={styles.biasSubNote}>{t('handlingBiasNote')}</Text>

      <View style={styles.biasControlsRow}>
        <TouchableOpacity
          style={styles.biasStepBtn}
          onPress={() => onChange(Math.max(-5, value - 1))}
        >
          <Text style={styles.biasStepBtnText}>−</Text>
        </TouchableOpacity>

        <View style={styles.biasTrackGroup}>
          {BIAS_STOPS.map(stop => {
            const isExact = value === stop;
            const isFilledNeg = value < 0 && stop < 0 && stop >= value;
            const isFilledPos = value > 0 && stop > 0 && stop <= value;
            const isZeroCenter = stop === 0;

            return (
              <TouchableOpacity
                key={`bias-${stop}`}
                style={[
                  styles.biasStopCell,
                  isZeroCenter && styles.biasStopZero,
                  isFilledNeg && styles.biasStopNeg,
                  isFilledPos && styles.biasStopPos,
                  isExact && isZeroCenter && styles.biasStopExactZero,
                  isExact && stop < 0 && styles.biasStopExactNeg,
                  isExact && stop > 0 && styles.biasStopExactPos,
                ]}
                onPress={() => onChange(stop)}
              >
                <Text
                  style={[
                    styles.biasStopText,
                    (isFilledNeg || isFilledPos || isExact) && styles.biasStopTextActive,
                  ]}
                >
                  {stop > 0 ? `+${stop}` : String(stop)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.biasStepBtn}
          onPress={() => onChange(Math.min(5, value + 1))}
        >
          <Text style={styles.biasStepBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.biasScaleLegend}>
        <Text style={[styles.biasLegendText, { color: THEME.accentSteel }]}>{t('handlingStable')}</Text>
        <Text style={styles.biasLegendText}>0</Text>
        <Text style={[styles.biasLegendText, { color: THEME.accentBrand }]}>{t('handlingAgile')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  biasCard: {
    backgroundColor: THEME.bgCanvas,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  biasTitle: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  biasValueText: { fontSize: 11, color: THEME.textPrimary, fontWeight: '800' },
  biasSubNote: { fontSize: 10, color: THEME.textMuted, marginBottom: 8 },
  biasControlsRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  biasStepBtn: {
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 6,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biasStepBtnText: { color: THEME.textPrimary, fontSize: 16, fontWeight: 'bold' },
  biasTrackGroup: {
    flexDirection: 'row',
    flex: 1,
    gap: 2,
  },
  biasStopCell: {
    flex: 1,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 4,
  },
  biasStopZero: {
    borderColor: THEME.borderStrong,
  },
  biasStopNeg: {
    backgroundColor: '#0C354D',
    borderColor: '#0284C7',
  },
  biasStopPos: {
    backgroundColor: '#4D1E08',
    borderColor: '#C2410C',
  },
  biasStopExactZero: {
    backgroundColor: THEME.bgSubtle,
    borderColor: THEME.textSecondary,
  },
  biasStopExactNeg: {
    backgroundColor: '#075985',
    borderColor: THEME.accentSteel,
  },
  biasStopExactPos: {
    backgroundColor: '#7C2D12',
    borderColor: THEME.accentBrand,
  },
  biasStopText: {
    color: THEME.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  biasStopTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  biasScaleLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingHorizontal: 36,
  },
  biasLegendText: {
    fontSize: 9,
    color: THEME.textMuted,
    fontWeight: '700',
  },
});
