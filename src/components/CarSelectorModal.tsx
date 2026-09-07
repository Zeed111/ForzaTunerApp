import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FORZA_CAR_DATABASE, PredefinedCar } from '../data/cars';
import { UnitSystem, VehicleInputs } from '../tuningEngine';
import { convertPredefinedSpecsToUnits } from '../utils/units';
import { t } from '../i18n';

export interface CarSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCar: (specs: Partial<VehicleInputs>) => void;
  units: UnitSystem;
}

export function getPiColor(piClass?: string): string {
  switch (piClass?.toUpperCase()) {
    case 'X':
      return '#2ecc71'; // Neon Green (999+)
    case 'R':
      return '#00e5ff'; // Cyan / Teal (901-998 Race / Motorsport)
    case 'S2':
      return '#8e44ad'; // Deep Purple (801-900)
    case 'S1':
      return '#9b59b6'; // Light Purple (701-800)
    case 'A':
      return '#e74c3c'; // Red (601-700)
    case 'B':
      return '#e67e22'; // Orange (501-600)
    case 'C':
      return '#f1c40f'; // Yellow (401-500)
    case 'D':
      return '#3498db'; // Blue (100-400)
    default:
      return '#e74c3c';
  }
}

export const CarSelectorModal: React.FC<CarSelectorModalProps> = ({
  visible,
  onClose,
  onSelectCar,
  units,
}) => {
  const [search, setSearch] = useState('');

  const filteredCars = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return FORZA_CAR_DATABASE;
    return FORZA_CAR_DATABASE.filter(car => {
      const fullName = `${car.year || ''} ${car.brand || ''} ${car.name || ''}`.toLowerCase();
      return fullName.includes(term);
    });
  }, [search]);

  const handleSelect = (car: PredefinedCar) => {
    const specs = convertPredefinedSpecsToUnits(car.specs, units);
    onSelectCar(specs);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('selectVehicle', { count: filteredCars.length })}</Text>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchPlaceholder')}
              placeholderTextColor="#63738a"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {search.length > 0 && (
              <TouchableOpacity style={styles.clearSearchBtn} onPress={() => setSearch('')}>
                <Text style={styles.clearSearchText}>{t('clearSymbol')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredCars}
            keyExtractor={(item, index) => item.id || `car-${index}`}
            style={{ maxHeight: 380 }}
            initialNumToRender={15}
            maxToRenderPerBatch={20}
            windowSize={5}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('noVehiclesMatching', { search })}</Text>
              </View>
            }
            renderItem={({ item }) => {
              const carClass = item.piClass || 'A';
              const badgeBg = getPiColor(carClass);

              return (
                <TouchableOpacity style={styles.carItem} onPress={() => handleSelect(item)}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.carName}>{`${item.year || ''} ${item.brand || ''} ${item.name || ''}`.trim()}</Text>
                    <Text style={styles.carMeta}>
                      {t('carSpecsMeta', {
                        drivetrain: item.specs.drivetrain,
                        hp: item.specs.hp,
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
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '100%', maxWidth: 500, backgroundColor: '#141923', borderWidth: 1, borderColor: '#232b3b', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#00e5ff', textTransform: 'uppercase', marginBottom: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, position: 'relative' },
  searchInput: { flex: 1, backgroundColor: '#0b0e17', borderWidth: 1, borderColor: '#232b3b', borderRadius: 6, color: '#f0f6fc', paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, paddingRight: 36 },
  clearSearchBtn: { position: 'absolute', right: 10, padding: 4 },
  clearSearchText: { color: '#8b9bb4', fontSize: 14, fontWeight: 'bold' },
  carItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#232b3b' },
  carName: { color: '#f0f6fc', fontSize: 13, fontWeight: '700' },
  carMeta: { color: '#8b9bb4', fontSize: 11, marginTop: 2 },
  piBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, minWidth: 28, alignItems: 'center' },
  piBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  emptyContainer: { paddingVertical: 30, alignItems: 'center' },
  emptyText: { color: '#63738a', fontSize: 13, fontStyle: 'italic' },
  closeBtn: { marginTop: 12, backgroundColor: '#0b0e17', borderWidth: 1, borderColor: '#232b3b', paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  closeBtnText: { color: '#8b9bb4', fontSize: 12, fontWeight: '600' },
});