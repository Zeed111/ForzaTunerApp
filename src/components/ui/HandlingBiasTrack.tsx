import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import { THEME } from '../../theme';
import { t } from '../../i18n';

const BIAS_STOPS = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];

interface HandlingBiasTrackProps {
  value: number;
  onChange: (nextBias: number) => void;
  onOpenGuide?: () => void;
}

export const HandlingBiasTrack: React.FC<HandlingBiasTrackProps> = ({
  value,
  onChange,
  onOpenGuide,
}) => {
  return (
    <View style={styles.biasCard}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithGuide}>
          <Text style={styles.biasTitle}>{t('handlingBiasTitle')}</Text>
          {onOpenGuide && (
            <TouchableOpacity style={styles.inlineGuideBtn} onPress={onOpenGuide}>
              <BookOpen size={10} color={THEME.accentSteel} strokeWidth={2.4} />
              <Text style={styles.inlineGuideText}>{t('guide')}</Text>
            </TouchableOpacity>
          )}
        </View>
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
    borderRadius: 18,
    padding: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  titleWithGuide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineGuideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
  },
  inlineGuideText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: THEME.accentSteel,
  },
  biasTitle: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  biasValueText: { fontSize: 11.5, color: THEME.textPrimary, fontWeight: '800' },
  biasSubNote: { fontSize: 10.5, color: THEME.textMuted, marginBottom: 10 },
  biasControlsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  biasStepBtn: {
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    borderRadius: 999,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biasStepBtnText: { color: THEME.textPrimary, fontSize: 16, fontWeight: 'bold' },
  biasTrackGroup: {
    flexDirection: 'row',
    flex: 1,
    gap: 3,
  },
  biasStopCell: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
  },
  biasStopZero: {
    borderColor: THEME.borderStrong,
  },
  biasStopNeg: {
    backgroundColor: 'rgba(122, 208, 255, 0.16)',
    borderColor: 'rgba(122, 208, 255, 0.45)',
  },
  biasStopPos: {
    backgroundColor: 'rgba(255, 109, 46, 0.16)',
    borderColor: 'rgba(255, 109, 46, 0.45)',
  },
  biasStopExactZero: {
    backgroundColor: THEME.bgSubtle,
    borderColor: THEME.textSecondary,
    borderRadius: 999,
  },
  biasStopExactNeg: {
    backgroundColor: '#0284C7',
    borderColor: THEME.accentSteel,
    borderRadius: 999,
  },
  biasStopExactPos: {
    backgroundColor: '#C2410C',
    borderColor: THEME.accentBrand,
    borderRadius: 999,
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
    marginTop: 6,
    paddingHorizontal: 38,
  },
  biasLegendText: {
    fontSize: 9.5,
    color: THEME.textMuted,
    fontWeight: '700',
  },
});
