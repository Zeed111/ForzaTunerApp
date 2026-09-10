import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { VehicleInputs } from '../tuningEngine';
import { t } from '../i18n';

export interface TuneDoctorModalProps {
  visible: boolean;
  onClose: () => void;
  inputs: VehicleInputs;
  onApplyFix: (newInputs: VehicleInputs, explanation: string) => void;
}

interface SymptomItem {
  id: string;
  badge: string;
  badgeColor: string;
  titleKey: string;
  descKey: string;
  diagnosis: string;
  prescriptions: string[];
  apply: (prev: VehicleInputs) => { updated: VehicleInputs; msg: string };
}

const SYMPTOMS: SymptomItem[] = [
  {
    id: 'entry_understeer',
    badge: 'TURN-IN',
    badgeColor: '#00f0ff',
    titleKey: 'symptomEntryUndersteer',
    descKey: 'descEntryUndersteer',
    diagnosis:
      'Front tires are overloaded or front anti-roll bar is too stiff, preventing the car from pivoting into the corner on initial turn-in.',
    prescriptions: [
      'Shift Handling Balance Bias +2 towards Agile',
      'Lower Front Tire starting pressure (-1.5 PSI / -0.10 bar)',
      'Add slight Front Toe-Out (-0.10°) for instantaneous steering bite',
    ],
    apply: prev => {
      const nextBias = Math.min(5, (prev.handlingBias || 0) + 2);
      return {
        updated: { ...prev, handlingBias: nextBias },
        msg: `Shifted Handling Bias to ${nextBias > 0 ? `+${nextBias} Agile` : nextBias} to eliminate entry understeer.`,
      };
    },
  },
  {
    id: 'exit_oversteer',
    badge: 'THROTTLE EXIT',
    badgeColor: '#ff1744',
    titleKey: 'symptomExitOversteer',
    descKey: 'descExitOversteer',
    diagnosis:
      'Rear differential acceleration lock is too aggressive, or rear anti-roll bar is too rigid, causing the rear tires to break loose when applying power out of corners.',
    prescriptions: [
      'Shift Handling Balance Bias -2 towards Stable',
      'Soften Rear Anti-Roll Bar to allow the rear suspension to squat',
      'Lower Rear Tire starting pressure (-1.5 PSI / -0.10 bar) for wider contact patch',
    ],
    apply: prev => {
      const nextBias = Math.max(-5, (prev.handlingBias || 0) - 2);
      return {
        updated: { ...prev, handlingBias: nextBias },
        msg: `Shifted Handling Bias to ${nextBias} (Stable) to calm down on-throttle rear snap.`,
      };
    },
  },
  {
    id: 'mid_corner_push',
    badge: 'APEX ROTATION',
    badgeColor: '#ffd000',
    titleKey: 'symptomMidCornerPush',
    descKey: 'descMidCornerPush',
    diagnosis:
      'Rear anti-roll bar is too compliant relative to front, causing the front tires to wash out through the mid-corner apex.',
    prescriptions: [
      'Shift Handling Balance Bias +1 towards Agile',
      'Stiffen Rear Anti-Roll Bar for cleaner lateral rotation',
      'Increase negative Front Camber (-0.3°) to hold grip at high lateral G',
    ],
    apply: prev => {
      const nextBias = Math.min(5, (prev.handlingBias || 0) + 1);
      return {
        updated: { ...prev, handlingBias: nextBias },
        msg: `Shifted Handling Bias to ${nextBias > 0 ? `+${nextBias} Agile` : nextBias} to induce clean apex rotation.`,
      };
    },
  },
  {
    id: 'curb_instability',
    badge: 'SUSPENSION',
    badgeColor: '#00ff9d',
    titleKey: 'symptomCurbInstability',
    descKey: 'descCurbInstability',
    diagnosis:
      'Suspension ride height is too low or bump damping is too stiff, bottoming out against bump stops over curbs and violently unsettling the chassis.',
    prescriptions: [
      'Raise Front & Rear Ride Height bounds by +0.5 cm (+0.2 in)',
      'Soften Bump Damping by 1.0 to 1.5 to absorb curb strikes smoothly',
      'Slightly soften base spring rates',
    ],
    apply: prev => {
      const delta = prev.units === 'imperial' ? 0.2 : 0.5;
      return {
        updated: {
          ...prev,
          heightFrontMin: Number((prev.heightFrontMin + delta).toFixed(1)),
          heightRearMin: Number((prev.heightRearMin + delta).toFixed(1)),
        },
        msg: `Raised Ride Height bounds by +${delta} ${prev.units === 'imperial' ? 'in' : 'cm'} to prevent bottoming out over curbs.`,
      };
    },
  },
  {
    id: 'launch_wheelspin',
    badge: 'TRACTION',
    badgeColor: '#d946ef',
    titleKey: 'symptomLaunchWheelspin',
    descKey: 'descLaunchWheelspin',
    diagnosis:
      'Rear tire width is too narrow for current horsepower, 1st gear ratio is too short, or rear tire pressure is overinflated.',
    prescriptions: [
      'Increase Rear Tire Width (+10 mm)',
      'Lower Rear Tire pressure (-1.5 PSI / -0.10 bar) to maximize launch bite',
      'Lengthen Final Drive ratio by -0.10 to reduce 1st gear torque spike',
    ],
    apply: prev => {
      const newWidth = Math.min(415, prev.tWidthR + 10);
      return {
        updated: { ...prev, tWidthR: newWidth },
        msg: `Increased Rear Tire Width to ${newWidth} mm to maximize launch traction.`,
      };
    },
  },
  {
    id: 'high_speed_wander',
    badge: 'STABILITY',
    badgeColor: '#00b4d8',
    titleKey: 'symptomHighSpeedWander',
    descKey: 'descHighSpeedWander',
    diagnosis:
      'Front aerodynamic downforce is insufficient relative to rear wing, or front toe is excessively out, causing high-speed nervousness.',
    prescriptions: [
      'Increase Front Aero Downforce slider to pin the front end down',
      'Zero out Front Toe (0.00°) for high-speed tracking',
      'Increase Caster Angle (+0.5°) for straight-line self-centering',
    ],
    apply: prev => {
      const newAeroF = Math.min(prev.aeroFrontMax, prev.aeroFrontMin + 15);
      return {
        updated: { ...prev, aeroFrontMin: newAeroF },
        msg: `Increased Front Aero minimum to ${newAeroF} ${prev.units === 'imperial' ? 'lbf' : 'kgf'} for high-speed stability.`,
      };
    },
  },
];

export const TuneDoctorModal: React.FC<TuneDoctorModalProps> = ({
  visible,
  onClose,
  inputs,
  onApplyFix,
}) => {
  const [selectedId, setSelectedId] = useState<string>(SYMPTOMS[0].id);

  const currentSymptom = SYMPTOMS.find(s => s.id === selectedId) || SYMPTOMS[0];

  const handleApply = () => {
    const { updated, msg } = currentSymptom.apply(inputs);
    onApplyFix(updated, msg);
    Alert.alert(t('fixApplied'), msg);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>{'TUNE DOCTOR'}</Text>
              <Text style={styles.modalSubtitle}>{'Handling Diagnostics & Instant Fixes'}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtnSmall} onPress={onClose}>
              <Text style={styles.closeBtnSmallText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Symptom Selection Horizontal Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillScroll}
            contentContainerStyle={styles.pillScrollContent}
          >
            {SYMPTOMS.map(s => {
              const isSelected = s.id === selectedId;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.symptomPill, isSelected && { borderColor: s.badgeColor, backgroundColor: '#131c2c' }]}
                  onPress={() => setSelectedId(s.id)}
                >
                  <View style={[styles.badge, { backgroundColor: s.badgeColor }]}>
                    <Text style={styles.badgeText}>{s.badge}</Text>
                  </View>
                  <Text style={[styles.symptomPillText, isSelected && { color: '#ffffff' }]}>
                    {t(s.titleKey as any)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Detailed Diagnosis Card */}
          <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.diagnosisCard}>
              <Text style={styles.cardHeaderTitle}>{t(currentSymptom.titleKey as any)}</Text>
              <Text style={styles.cardHeaderDesc}>{t(currentSymptom.descKey as any)}</Text>

              <View style={styles.divider} />

              <Text style={styles.sectionHeading}>{t('diagnosis')}</Text>
              <Text style={styles.bodyText}>{currentSymptom.diagnosis}</Text>

              <Text style={[styles.sectionHeading, { marginTop: 12 }]}>{t('prescription')}</Text>
              {currentSymptom.prescriptions.map((rx, idx) => (
                <View key={idx} style={styles.rxRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.rxText}>{rx}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>{t('applyFix')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5,7,12,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    backgroundColor: '#0f1420',
    borderWidth: 1,
    borderColor: '#1c2438',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#00f0ff',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#8a99ad',
    marginTop: 2,
  },
  closeBtnSmall: {
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#070a10',
    borderWidth: 1,
    borderColor: '#1e2638',
  },
  closeBtnSmallText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  pillScroll: {
    maxHeight: 46,
    marginBottom: 12,
  },
  pillScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  symptomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#070a10',
    borderWidth: 1,
    borderColor: '#1e2638',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  badgeText: {
    color: '#070a10',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  symptomPillText: {
    color: '#8a99ad',
    fontSize: 11,
    fontWeight: '700',
  },
  detailScroll: {
    flex: 1,
    marginBottom: 14,
  },
  diagnosisCard: {
    backgroundColor: '#070a10',
    borderWidth: 1,
    borderColor: '#1e2638',
    borderRadius: 10,
    padding: 14,
  },
  cardHeaderTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  cardHeaderDesc: {
    color: '#8a99ad',
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#161f30',
    marginVertical: 12,
  },
  sectionHeading: {
    color: '#00f0ff',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bodyText: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
  },
  rxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    gap: 6,
  },
  bullet: {
    color: '#00ff9d',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: 'bold',
  },
  rxText: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#070a10',
    borderWidth: 1,
    borderColor: '#1e2638',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  applyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 6,
    backgroundColor: '#ff1744',
    borderWidth: 1,
    borderColor: '#ff1744',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
