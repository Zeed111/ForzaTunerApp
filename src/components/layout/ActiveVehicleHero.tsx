import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Car, Bookmark } from 'lucide-react-native';
import { VehicleInputs } from '../../types/tuning';
import { THEME, getPiColor } from '../../theme';
import { t } from '../../i18n';

interface ActiveVehicleHeroProps {
  inputs: VehicleInputs;
  ptwVal: number;
  onChangeCar: () => void;
  onSaveTune: () => void;
}

export const ActiveVehicleHero: React.FC<ActiveVehicleHeroProps> = ({
  inputs,
  ptwVal,
  onChangeCar,
  onSaveTune,
}) => {
  const piBadgeColor = getPiColor(inputs.piClass);

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroLeft}>
        <View style={styles.heroKickerRow}>
          <Text style={styles.heroKicker}>{t('activeVehicle')}</Text>
          {inputs.activePresetName ? (
            <View style={styles.heroPresetTag}>
              <Text style={styles.heroPresetTagText}>{inputs.activePresetName}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.heroTitleRow}>
          <View style={[styles.heroPiBadge, { backgroundColor: piBadgeColor }]}>
            <Text style={styles.heroPiBadgeText}>{inputs.piClass || 'A'}</Text>
          </View>
          <Text style={styles.heroCarName} numberOfLines={1}>
            {inputs.carName || t('customBuild')}
          </Text>
        </View>
        <Text style={styles.heroMeta}>
          {`${inputs.drivetrain} • ${Math.round(inputs.hp)} HP • ${t('powerToWeight', { ptw: ptwVal })} • ${inputs.discipline.toUpperCase()}`}
        </Text>
      </View>

      <View style={styles.heroActions}>
        <TouchableOpacity style={styles.heroActionPrimary} onPress={onChangeCar}>
          <Car size={12} color="#ffffff" strokeWidth={2.4} />
          <Text style={styles.heroActionPrimaryText}>{t('changeCar')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.heroActionSecondary} onPress={onSaveTune}>
          <Bookmark size={12} color={THEME.textPrimary} strokeWidth={2.2} />
          <Text style={styles.heroActionSecondaryText}>{t('saveTune')}</Text>
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
    gap: 10,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
    borderLeftWidth: 3,
    borderLeftColor: THEME.accentBrand,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  heroLeft: {
    flex: 1,
    minWidth: 210,
  },
  heroKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  heroKicker: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.textMuted,
    letterSpacing: 1,
  },
  heroPresetTag: {
    backgroundColor: THEME.accentBrandDim,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.45)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  heroPresetTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.accentBrand,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroPiBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 26,
    alignItems: 'center',
  },
  heroPiBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  heroCarName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    color: THEME.textPrimary,
    letterSpacing: 0.3,
  },
  heroMeta: {
    fontSize: 11,
    color: THEME.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  heroActionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.accentBrand,
    borderWidth: 1,
    borderColor: THEME.accentBrand,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  heroActionPrimaryText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  heroActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  heroActionSecondaryText: {
    color: THEME.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
});
