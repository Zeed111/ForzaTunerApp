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
      return '#00ff9d'; // FH6 Nitro Green (999+)
    case 'R':
      return '#00f0ff'; // Tokyo Neon Cyan (901-998 Race)
    case 'S2':
      return '#9d4edd'; // Deep Violet (801-900)
    case 'S1':
      return '#c77dff'; // Sakura Lavender (701-800)
    case 'A':
      return '#ff1744'; // Torii Red (601-700)
    case 'B':
      return '#ff7b00'; // Neon Sunset (501-600)
    case 'C':
      return '#ffd000'; // Shinjuku Gold (401-500)
    case 'D':
      return '#00b4d8'; // Skyline Blue (100-400)
    default:
      return '#ff1744';
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5,7,12,0.92)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '100%', maxWidth: 500, backgroundColor: '#0f1420', borderWidth: 1, borderColor: '#1c2438', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#ff1744', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, position: 'relative' },
  searchInput: { flex: 1, minWidth: 0, backgroundColor: '#070a10', borderWidth: 1, borderColor: '#1e2638', borderRadius: 6, color: '#f8fafc', paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, paddingRight: 36 },
  clearSearchBtn: { position: 'absolute', right: 10, padding: 4 },
  clearSearchText: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold' },
  carItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1c2438' },
  carName: { color: '#f8fafc', fontSize: 13, fontWeight: '700' },
  carMeta: { color: '#8a99ad', fontSize: 11, marginTop: 2 },
  piBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, minWidth: 28, alignItems: 'center' },
  piBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  emptyContainer: { paddingVertical: 30, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 13, fontStyle: 'italic' },
  closeBtn: { marginTop: 12, backgroundColor: '#070a10', borderWidth: 1, borderColor: '#1e2638', paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  closeBtnText: { color: '#ff4d6d', fontSize: 12, fontWeight: '700' },
});