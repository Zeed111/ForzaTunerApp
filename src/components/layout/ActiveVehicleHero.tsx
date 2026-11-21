import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bookmark, Stethoscope } from 'lucide-react-native';
import { VehicleInputs } from '../../types/tuning';
import { THEME, getPiColor } from '../../theme';
import { t } from '../../i18n';

interface ActiveVehicleHeroProps {
  inputs: VehicleInputs;
  ptwVal: number;
  onOpenGarage: () => void;
  onOpenDoctor: () => void;
  onCyclePiClass: () => void;
}

export const ActiveVehicleHero: React.FC<ActiveVehicleHeroProps> = ({
  inputs,
  ptwVal,
  onOpenGarage,
  onOpenDoctor,
  onCyclePiClass,
}) => {
  const piBadgeColor = getPiColor(inputs.piClass);
  const displayName = inputs.activePresetName || inputs.carName || t('customBuild');
  const showPresetBadge =
    Boolean(inputs.activePresetName) && inputs.activePresetName !== inputs.carName;

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroLeft}>
        <View style={styles.heroKickerRow}>
          <Text style={styles.heroKicker}>{t('activeVehicle')}</Text>
          {showPresetBadge ? (
            <View style={styles.heroPresetTag}>
              <Text style={styles.heroPresetTagText}>{inputs.activePresetName}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.heroTitleRow}>
          <TouchableOpacity
            style={[styles.heroPiBadge, { backgroundColor: piBadgeColor }]}
            onPress={onCyclePiClass}
            accessibilityRole="button"
            accessibilityLabel="Cycle PI class"
          >
            <Text style={styles.heroPiBadgeText}>{inputs.piClass || 'A'}</Text>
          </TouchableOpacity>
          <Text style={styles.heroCarName} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
        <View style={styles.heroMetaChips}>
          <View style={styles.heroMetaChip}>
            <Text style={styles.heroMetaChipText}>{inputs.drivetrain}</Text>
          </View>
          <View style={styles.heroMetaChip}>
            <Text style={styles.heroMetaChipText}>{`${Math.round(inputs.hp)} HP`}</Text>
          </View>
          <View style={styles.heroMetaChip}>
            <Text style={styles.heroMetaChipText}>{t('powerToWeight', { ptw: ptwVal })}</Text>
          </View>
          <View style={[styles.heroMetaChip, styles.heroMetaChipAccent]}>
            <Text style={[styles.heroMetaChipText, styles.heroMetaChipTextAccent]}>
              {inputs.discipline.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.heroActions}>
        <TouchableOpacity style={styles.heroActionPrimary} onPress={onOpenGarage}>
          <Bookmark size={13} color="#ffffff" strokeWidth={2.4} />
          <Text style={styles.heroActionPrimaryText}>{t('garageSave')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.heroActionSecondary} onPress={onOpenDoctor}>
          <Stethoscope size={13} color={THEME.accentAmber} strokeWidth={2.2} />
          <Text style={styles.heroActionSecondaryText}>{t('doctor')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  heroLeft: {
    flex: 1,
    minWidth: 210,
  },
  heroKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  heroKicker: {
    fontSize: 9.5,
    fontWeight: '800',
    color: THEME.textMuted,
    letterSpacing: 1,
  },
  heroPresetTag: {
    backgroundColor: THEME.accentBrandDim,
    borderWidth: 1,
    borderColor: 'rgba(255, 109, 46, 0.45)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  heroPresetTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: THEME.accentBrand,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  heroPiBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 30,
    alignItems: 'center',
  },
  heroPiBadgeText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '900',
  },
  heroCarName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
    color: THEME.textPrimary,
    letterSpacing: 0.2,
  },
  heroMetaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  heroMetaChip: {
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  heroMetaChipAccent: {
    backgroundColor: THEME.accentAmberDim,
    borderColor: 'rgba(255, 183, 77, 0.35)',
  },
  heroMetaChipText: {
    fontSize: 10.5,
    color: THEME.textSecondary,
    fontWeight: '700',
  },
  heroMetaChipTextAccent: {
    color: THEME.accentAmber,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  heroActionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.accentBrand,
    borderWidth: 1,
    borderColor: THEME.accentBrand,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  heroActionPrimaryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  heroActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  heroActionSecondaryText: {
    color: THEME.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
});
