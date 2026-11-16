import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Check } from 'lucide-react-native';
import { THEME } from '../../theme';
import { copyOrShareText } from '../../utils/shareTuneCard';

export interface TuneGaugeRowProps {
  label: string;
  valueText: string;
  frontRatio?: number; // 0..1
  rearRatio?: number; // 0..1
  frontTag?: string;
  rearTag?: string;
  singleRatio?: number; // 0..1 (for single-slider items like Caster, Final Drive, Center Diff, Brakes)
  subLabel?: string;
  subValue?: string;
  subColor?: string;
}

function clampRatio(r: number): number {
  if (isNaN(r)) return 0;
  return Math.min(1, Math.max(0, r));
}

export const TuneGaugeRow: React.FC<TuneGaugeRowProps> = ({
  label,
  valueText,
  frontRatio,
  rearRatio,
  frontTag = 'F',
  rearTag = 'R',
  singleRatio,
  subLabel,
  subValue,
  subColor = THEME.accentAmber,
}) => {
  const [copied, setCopied] = useState(false);

  const hasDual = frontRatio !== undefined && rearRatio !== undefined;
  const hasSingle = !hasDual && singleRatio !== undefined;

  const handleTapCopy = async () => {
    const payload = Platform.OS === 'web' ? valueText : `${label} ${valueText}`;
    const ok = await copyOrShareText(payload);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handleTapCopy}
      style={[styles.rowContainer, copied && styles.rowContainerCopied]}
    >
      <View style={styles.topRow}>
        <Text style={styles.outLabel}>{label}</Text>
        <View style={styles.valGroup}>
          {copied && (
            <View style={styles.copiedBadge}>
              <Check size={9} color={THEME.bgCanvas} strokeWidth={3} />
              <Text style={styles.copiedBadgeText}>Copied</Text>
            </View>
          )}
          <Text style={styles.outVal}>{valueText}</Text>
        </View>
      </View>

      {hasDual && (
        <View style={styles.dualTracksRow}>
          <View style={styles.trackGroup}>
            <Text style={styles.tagF}>{frontTag}</Text>
            <View style={styles.trackBg}>
              <View
                style={[
                  styles.fillF,
                  { width: `${Math.max(3, Math.round(clampRatio(frontRatio!) * 100))}%` },
                ]}
              />
            </View>
          </View>
          <View style={styles.trackGroup}>
            <Text style={styles.tagR}>{rearTag}</Text>
            <View style={styles.trackBg}>
              <View
                style={[
                  styles.fillR,
                  { width: `${Math.max(3, Math.round(clampRatio(rearRatio!) * 100))}%` },
                ]}
              />
            </View>
          </View>
        </View>
      )}

      {hasSingle && (
        <View style={styles.singleTrackWrap}>
          <View style={styles.trackBg}>
            <View
              style={[
                styles.fillSingle,
                { width: `${Math.max(3, Math.round(clampRatio(singleRatio!) * 100))}%` },
              ]}
            />
          </View>
        </View>
      )}

      {subLabel && subValue ? (
        <View style={styles.subRow}>
          <Text style={[styles.subLabel, { color: subColor }]}>{subLabel}</Text>
          <Text style={[styles.subVal, { color: subColor }]}>{subValue}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    borderRadius: 4,
  },
  rowContainerCopied: {
    backgroundColor: THEME.accentSuccessDim,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outLabel: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
    paddingRight: 8,
  },
  valGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: THEME.accentSuccess,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  copiedBadgeText: {
    color: THEME.bgCanvas,
    fontSize: 9,
    fontWeight: '800',
  },
  outVal: {
    color: THEME.textPrimary,
    fontWeight: '800',
    fontSize: 12.5,
    fontVariant: ['tabular-nums'],
  },
  dualTracksRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
    alignItems: 'center',
  },
  trackGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tagF: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.accentAmber,
    minWidth: 10,
  },
  tagR: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.accentSteel,
    minWidth: 10,
  },
  singleTrackWrap: {
    marginTop: 5,
  },
  trackBg: {
    flex: 1,
    height: 4,
    backgroundColor: THEME.bgElevated,
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  fillF: {
    height: '100%',
    backgroundColor: THEME.accentAmber,
    borderRightWidth: 1.5,
    borderRightColor: '#FEF3C7',
  },
  fillR: {
    height: '100%',
    backgroundColor: THEME.accentSteel,
    borderRightWidth: 1.5,
    borderRightColor: '#E0F2FE',
  },
  fillSingle: {
    height: '100%',
    backgroundColor: THEME.accentBrand,
    borderRightWidth: 1.5,
    borderRightColor: '#FFEDD5',
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  subLabel: {
    fontSize: 10,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  subVal: {
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
