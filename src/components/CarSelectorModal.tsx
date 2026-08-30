import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { FORZA_CAR_DATABASE, PredefinedCar } from '../data/cars';
import { UnitSystem, VehicleInputs } from '../tuningEngine';

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

  const filteredCars = FORZA_CAR_DATABASE.filter(car => {
    const term = search.toLowerCase();
    const fullName = `${car.year || ''} ${car.brand || ''} ${car.name || ''}`.toLowerCase();
    return fullName.includes(term);
  });

  const handleSelect = (car: PredefinedCar) => {
    let specs = { ...car.specs };
    if (units === 'imperial') {
      specs = {
        ...specs,
        weight: Math.round(specs.weight * 2.20462),
        springFrontMin: +(specs.springFrontMin * 55.997).toFixed(1),
        springFrontMax: +(specs.springFrontMax * 55.997).toFixed(1),
        springRearMin: +(specs.springRearMin * 55.997).toFixed(1),
        springRearMax: +(specs.springRearMax * 55.997).toFixed(1),
        heightFrontMin: +(specs.heightFrontMin / 2.54).toFixed(1),
        heightFrontMax: +(specs.heightFrontMax / 2.54).toFixed(1),
        heightRearMin: +(specs.heightRearMin / 2.54).toFixed(1),
        heightRearMax: +(specs.heightRearMax / 2.54).toFixed(1),
        aeroFrontMin: Math.round(specs.aeroFrontMin * 2.20462),
        aeroFrontMax: Math.round(specs.aeroFrontMax * 2.20462),
        aeroRearMin: Math.round(specs.aeroRearMin * 2.20462),
        aeroRearMax: Math.round(specs.aeroRearMax * 2.20462),
        topSpeed: Math.round(specs.topSpeed / 1.60934),
      };
    }
    onSelectCar(specs);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Vehicle ({filteredCars.length})</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search manufacturer, model, or year..."
            placeholderTextColor="#63738a"
            value={search}
            onChangeText={setSearch}
          />

          <FlatList
            data={filteredCars}
            keyExtractor={(item, index) => item.id || `car-${index}`}
            style={{ maxHeight: 380 }}
            initialNumToRender={15}
            maxToRenderPerBatch={20}
            windowSize={5}
            renderItem={({ item }) => {
              const carClass = item.piClass || 'A';
              const badgeBg = getPiColor(carClass);

              return (
                <TouchableOpacity style={styles.carItem} onPress={() => handleSelect(item)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.carName}>{item.year} {item.brand} {item.name}</Text>
                    <Text style={styles.carMeta}>
                      {item.specs.drivetrain} • {item.specs.hp} HP • {item.specs.category.toUpperCase()}
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
            <Text style={styles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '100%', backgroundColor: '#141923', borderWidth: 1, borderColor: '#232b3b', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#00e5ff', textTransform: 'uppercase', marginBottom: 10 },
  searchInput: { backgroundColor: '#0b0e17', borderWidth: 1, borderColor: '#232b3b', borderRadius: 6, color: '#f0f6fc', paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, marginBottom: 12 },
  carItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#232b3b' },
  carName: { color: '#f0f6fc', fontSize: 13, fontWeight: '700' },
  carMeta: { color: '#8b9bb4', fontSize: 11, marginTop: 2 },
  piBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, minWidth: 28, alignItems: 'center' },
  piBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  closeBtn: { marginTop: 12, backgroundColor: '#0b0e17', borderWidth: 1, borderColor: '#232b3b', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  closeBtnText: { color: '#8b9bb4', fontSize: 12, fontWeight: '600' },
});