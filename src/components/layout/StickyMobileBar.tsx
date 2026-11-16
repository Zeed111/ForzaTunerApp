import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Gauge, ClipboardCheck } from 'lucide-react-native';
import { TuneResult } from '../../types/tuning';
import { THEME } from '../../theme';
import { t } from '../../i18n';

interface StickyMobileBarProps {
  tune: TuneResult;
  onViewTune: () => void;
  onOpenChecklist: () => void;
}

export const StickyMobileBar: React.FC<StickyMobileBarProps> = ({
  tune,
  onViewTune,
  onOpenChecklist,
}) => {
  return (
    <View style={styles.stickyMobileBar}>
      <View style={styles.stickyStatsGroup}>
        <View style={styles.stickyStatItem}>
          <Text style={styles.stickyStatLabel}>TIRES</Text>
          <Text style={styles.stickyStatVal} numberOfLines={1}>
            {`${tune.tireFrontCold}/${tune.tireRearCold}`}
          </Text>
        </View>
        <View style={styles.stickyStatItem}>
          <Text style={styles.stickyStatLabel}>ARB</Text>
          <Text style={styles.stickyStatVal} numberOfLines={1}>
            {`${tune.arbFront}/${tune.arbRear}`}
          </Text>
        </View>
        <View style={styles.stickyStatItem}>
          <Text style={styles.stickyStatLabel}>FD</Text>
          <Text style={styles.stickyStatVal} numberOfLines={1}>
            {tune.finalDrive}
          </Text>
        </View>
      </View>

      <View style={styles.stickyActionsGroup}>
        <TouchableOpacity style={styles.stickyJumpBtn} onPress={onViewTune}>
          <Gauge size={12} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.stickyJumpBtnText}>{t('viewTune')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.stickyChecklistBtn} onPress={onOpenChecklist}>
          <ClipboardCheck size={14} color={THEME.accentSuccess} strokeWidth={2.3} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stickyMobileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    borderRadius: 999,
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 6,
  },
  stickyStatsGroup: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    minWidth: 0,
  },
  stickyStatItem: {
    flexShrink: 1,
    minWidth: 0,
  },
  stickyStatLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: THEME.textMuted,
    letterSpacing: 0.5,
  },
  stickyStatVal: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  stickyActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stickyJumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.accentBrand,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
  },
  stickyJumpBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  stickyChecklistBtn: {
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
