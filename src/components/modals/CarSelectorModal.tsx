import React, { useState, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  FlatList,
  ScrollView,
  StyleSheet,
  Keyboard,
  Platform,
  TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, RotateCcw } from 'lucide-react-native';
import { FORZA_CAR_DATABASE, PredefinedCar } from '../../data/cars';
import { CarCategory, Drivetrain, UnitSystem, VehicleInputs } from '../../types/tuning';
import { convertPredefinedSpecsToUnits, KG_TO_LBS } from '../../utils/units';
import { useKeyboardInset } from '../../hooks/useKeyboardInset';
import { t } from '../../i18n';
import { THEME, getPiColor } from '../../theme';

const WEB_INPUT_RESET: TextStyle | undefined =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : undefined;

export interface CarSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCar: (specs: Partial<VehicleInputs>) => void;
  units: UnitSystem;
}

const PI_FILTERS = ['ALL', 'D', 'C', 'B', 'A', 'S1', 'S2', 'R'] as const;
const DRIVETRAIN_FILTERS: ('ALL' | Drivetrain)[] = ['ALL', 'RWD', 'AWD', 'FWD'];
const CATEGORY_FILTERS: { key: CarCategory; label: string }[] = [
  { key: 'jdm', label: 'JDM' },
  { key: 'track', label: 'Track' },
  { key: 'classic', label: 'Classic' },
  { key: 'supercar', label: 'Supercar' },
];

export const CarSelectorModal: React.FC<CarSelectorModalProps> = ({
  visible,
  onClose,
  onSelectCar,
  units,
}) => {
  const overlayRef = useRef<View>(null);
  const insets = useSafeAreaInsets();
  const { keyboardInset, isKeyboardVisible } = useKeyboardInset({
    containerRef: overlayRef,
    subtractSafeAreaBottomOnIOS: false,
    enabled: visible,
  });

  const [search, setSearch] = useState('');
  const [selectedPi, setSelectedPi] = useState<string>('ALL');
  const [selectedDt, setSelectedDt] = useState<'ALL' | Drivetrain>('ALL');
  const [selectedCat, setSelectedCat] = useState<'ALL' | CarCategory>('ALL');

  const hasActiveFilters =
    selectedPi !== 'ALL' ||
    selectedDt !== 'ALL' ||
    selectedCat !== 'ALL' ||
    search.trim().length > 0;

  const resetAllFilters = () => {
    setSearch('');
    setSelectedPi('ALL');
    setSelectedDt('ALL');
    setSelectedCat('ALL');
  };

  const filteredCars = useMemo(() => {
    const term = search.trim().toLowerCase();
    return FORZA_CAR_DATABASE.filter(car => {
      if (selectedPi !== 'ALL' && (car.piClass || 'A').toUpperCase() !== selectedPi) {
        return false;
      }
      if (selectedDt !== 'ALL' && car.specs.drivetrain !== selectedDt) {
        return false;
      }
      if (selectedCat !== 'ALL' && car.specs.category !== selectedCat) {
        return false;
      }
      if (term) {
        const fullName = `${car.year || ''} ${car.brand || ''} ${car.name || ''}`.toLowerCase();
        if (!fullName.includes(term)) return false;
      }
      return true;
    });
  }, [search, selectedPi, selectedDt, selectedCat]);

  const handleSelect = (car: PredefinedCar) => {
    const specs = convertPredefinedSpecsToUnits(car.specs, units);
    const carName = `${car.year || ''} ${car.brand || ''} ${car.name || ''}`.trim();
    onSelectCar({
      ...specs,
      carName,
      piClass: car.piClass || 'A',
      activePresetName: undefined,
      doctorOffsets: undefined,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View
        ref={overlayRef}
        collapsable={false}
        style={[
          styles.modalOverlay,
          {
            paddingTop: Math.max(16, insets.top + 8),
            paddingBottom: isKeyboardVisible
              ? keyboardInset + 12
              : Math.max(16, insets.bottom + 12),
            justifyContent: isKeyboardVisible ? 'flex-start' : 'center',
          },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Dismiss modal"
        />
        <View style={styles.modalContent}>
          <View style={styles.sheetHandle} />
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>{t('selectVehicle', { count: filteredCars.length })}</Text>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.resetFiltersBtn} onPress={resetAllFilters}>
                <RotateCcw size={11} color={THEME.accentSteel} strokeWidth={2.5} />
                <Text style={styles.resetFiltersText}>{t('resetFilters')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchIcon} pointerEvents="none">
              <Search size={14} color={THEME.textMuted} />
            </View>
            <TextInput
              style={[styles.searchInput, WEB_INPUT_RESET]}
              placeholder={t('searchPlaceholder')}
              placeholderTextColor={THEME.textMuted}
              cursorColor={THEME.accentBrand}
              selectionColor={THEME.accentBrand}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              returnKeyType="search"
              enterKeyHint="search"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {search.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => setSearch('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={14} color={THEME.textSecondary} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>

          {/* Row 1: PI Class Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterScrollContent}
          >
            {PI_FILTERS.map(pi => {
              const isActive = selectedPi === pi;
              const piColor = pi === 'ALL' ? THEME.accentBrand : getPiColor(pi);
              return (
                <TouchableOpacity
                  key={`pi-${pi}`}
                  style={[
                    styles.filterChip,
                    isActive && [styles.filterChipActive, { backgroundColor: piColor, borderColor: piColor }],
                  ]}
                  onPress={() => setSelectedPi(pi)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {pi === 'ALL' ? t('filterAll') : pi}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Row 2: Drivetrain & Category Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.filterScroll, { marginBottom: 10 }]}
            contentContainerStyle={styles.filterScrollContent}
          >
            {DRIVETRAIN_FILTERS.map(dt => {
              const isActive = selectedDt === dt;
              return (
                <TouchableOpacity
                  key={`dt-${dt}`}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActiveCyan,
                  ]}
                  onPress={() => setSelectedDt(dt)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {dt === 'ALL' ? t('filterAll') : dt}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.chipDivider} />

            {CATEGORY_FILTERS.map(cat => {
              const isActive = selectedCat === cat.key;
              return (
                <TouchableOpacity
                  key={`cat-${cat.key}`}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActiveRed,
                  ]}
                  onPress={() => setSelectedCat(prev => (prev === cat.key ? 'ALL' : cat.key))}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <FlatList
            data={filteredCars}
            keyExtractor={(item, index) => item.id || `car-${index}`}
            style={[styles.carList, !isKeyboardVisible && styles.carListDefaultMax]}
            initialNumToRender={15}
            maxToRenderPerBatch={20}
            windowSize={5}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {search.trim().length > 0
                    ? t('noVehiclesMatching', { search })
                    : t('noVehiclesMatchFilters')}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const carClass = item.piClass || 'A';
              const badgeBg = getPiColor(carClass);
              const displayWeight =
                units === 'imperial'
                  ? Math.round(item.specs.weight * KG_TO_LBS)
                  : Math.round(item.specs.weight);

              return (
                <TouchableOpacity style={styles.carItem} onPress={() => handleSelect(item)}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.carName}>{`${item.year || ''} ${item.brand || ''} ${item.name || ''}`.trim()}</Text>
                    <Text style={styles.carMeta}>
                      {t('carSpecsMeta', {
                        drivetrain: item.specs.drivetrain,
                        hp: item.specs.hp,
                        weight: displayWeight,
                        wtUnit: units === 'imperial' ? 'lbs' : 'kg',
                        frontPct: item.specs.frontWeightPct,
                        category: item.specs.category.toUpperCase(),
                      })}
                    </Text>
                  </View>
                  <View style={[styles.piBadge, { backgroundColor: badgeBg }]}>
                    <Text style={styles.piBadgeText}>{carClass}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 12, 16, 0.84)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '100%', maxWidth: 520, maxHeight: '100%', flexShrink: 1, backgroundColor: THEME.bgCard, borderWidth: 1, borderColor: THEME.borderStrong, borderRadius: 28, padding: 18, paddingTop: 12 },
  sheetHandle: { width: 36, height: 4, borderRadius: 999, backgroundColor: THEME.borderStrong, alignSelf: 'center', marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 17, fontWeight: '900', color: THEME.textPrimary, letterSpacing: 0.3 },
  resetFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
  },
  resetFiltersText: { color: THEME.accentSteel, fontSize: 11, fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, position: 'relative' },
  searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 999,
    color: THEME.textPrimary,
    paddingLeft: 38,
    paddingRight: 40,
    paddingVertical: 10,
    fontSize: Platform.select({ web: 16, default: 14 }),
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  carList: {
    flexShrink: 1,
  },
  carListDefaultMax: {
    maxHeight: 360,
  },
  clearSearchBtn: { position: 'absolute', right: 12, padding: 4 },
  filterScroll: { flexGrow: 0, marginBottom: 6 },
  filterScrollContent: { gap: 6, alignItems: 'center', paddingVertical: 1 },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  filterChipActive: {
    borderRadius: 999,
  },
  filterChipActiveCyan: {
    backgroundColor: THEME.accentSteelDim,
    borderColor: THEME.accentSteel,
    borderRadius: 999,
  },
  filterChipActiveRed: {
    backgroundColor: THEME.accentBrand,
    borderColor: THEME.accentBrand,
    borderRadius: 999,
  },
  filterChipText: { color: THEME.textSecondary, fontSize: 11, fontWeight: '800' },
  filterChipTextActive: { color: '#ffffff' },
  chipDivider: { width: 1, height: 18, backgroundColor: THEME.borderStrong, marginHorizontal: 3 },
  carItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: THEME.border },
  carName: { color: THEME.textPrimary, fontSize: 13.5, fontWeight: '700' },
  carMeta: { color: THEME.textSecondary, fontSize: 11, marginTop: 2 },
  piBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, minWidth: 32, alignItems: 'center' },
  piBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  emptyContainer: { paddingVertical: 30, alignItems: 'center' },
  emptyText: { color: THEME.textMuted, fontSize: 13, fontStyle: 'italic', textAlign: 'center' },
  closeBtn: { marginTop: 14, backgroundColor: THEME.bgElevated, borderWidth: 1, borderColor: THEME.borderStrong, paddingVertical: 11, borderRadius: 999, alignItems: 'center' },
  closeBtnText: { color: THEME.textPrimary, fontSize: 12.5, fontWeight: '700' },
});
