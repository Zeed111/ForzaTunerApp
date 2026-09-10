import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { TuneResult, VehicleInputs } from '../tuningEngine';
import { t } from '../i18n';

export interface CompanionChecklistModalProps {
  visible: boolean;
  onClose: () => void;
  tune: TuneResult;
  inputs: VehicleInputs;
}

interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  value: string;
  subValue?: string;
}

export const CompanionChecklistModal: React.FC<CompanionChecklistModalProps> = ({
  visible,
  onClose,
  tune,
  inputs,
}) => {
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Build the items in the exact Forza garage sequence
  const items: ChecklistItem[] = [
    // 1. TIRES
    {
      id: 'tire_f',
      category: '1. TIRES',
      label: 'Front Tire Pressure (Cold)',
      value: tune.tireFrontCold,
      subValue: `Hot Target: ${tune.tireFrontHot}`,
    },
    {
      id: 'tire_r',
      category: '1. TIRES',
      label: 'Rear Tire Pressure (Cold)',
      value: tune.tireRearCold,
      subValue: `Hot Target: ${tune.tireRearHot}`,
    },

    // 2. GEARING
    {
      id: 'gear_fd',
      category: '2. GEARING',
      label: 'Final Drive',
      value: tune.finalDrive,
      subValue: `Aero Top Speed: ${tune.estimatedTopSpeed}`,
    },
    ...tune.gearRatios.map((r, i) => ({
      id: `gear_${i + 1}`,
      category: '2. GEARING',
      label: `Gear ${i + 1}`,
      value: r.toFixed(2),
    })),

    // 3. ALIGNMENT
    {
      id: 'align_cf',
      category: '3. ALIGNMENT',
      label: 'Front Camber',
      value: tune.camberFront,
    },
    {
      id: 'align_cr',
      category: '3. ALIGNMENT',
      label: 'Rear Camber',
      value: tune.camberRear,
    },
    {
      id: 'align_tf',
      category: '3. ALIGNMENT',
      label: 'Front Toe',
      value: tune.toeFront,
    },
    {
      id: 'align_tr',
      category: '3. ALIGNMENT',
      label: 'Rear Toe',
      value: tune.toeRear,
    },
    {
      id: 'align_caster',
      category: '3. ALIGNMENT',
      label: 'Front Caster Angle',
      value: tune.caster,
    },

    // 4. ANTI-ROLL BARS
    {
      id: 'arb_f',
      category: '4. ANTI-ROLL BARS',
      label: 'Front Anti-Roll Bar',
      value: tune.arbFront,
    },
    {
      id: 'arb_r',
      category: '4. ANTI-ROLL BARS',
      label: 'Rear Anti-Roll Bar',
      value: tune.arbRear,
      subValue: tune.handlingBiasNote,
    },

    // 5. SPRINGS & RIDE HEIGHT
    {
      id: 'sp_f',
      category: '5. SPRINGS & RIDE HEIGHT',
      label: 'Front Springs',
      value: tune.springFront,
    },
    {
      id: 'sp_r',
      category: '5. SPRINGS & RIDE HEIGHT',
      label: 'Rear Springs',
      value: tune.springRear,
    },
    {
      id: 'rh_f',
      category: '5. SPRINGS & RIDE HEIGHT',
      label: 'Front Ride Height',
      value: tune.heightFront,
    },
    {
      id: 'rh_r',
      category: '5. SPRINGS & RIDE HEIGHT',
      label: 'Rear Ride Height',
      value: tune.heightRear,
    },

    // 6. DAMPING
    {
      id: 'damp_reb_f',
      category: '6. DAMPING',
      label: 'Front Rebound Stiffness',
      value: tune.rebFront,
    },
    {
      id: 'damp_reb_r',
      category: '6. DAMPING',
      label: 'Rear Rebound Stiffness',
      value: tune.rebRear,
    },
    {
      id: 'damp_bmp_f',
      category: '6. DAMPING',
      label: 'Front Bump Stiffness',
      value: tune.bmpFront,
    },
    {
      id: 'damp_bmp_r',
      category: '6. DAMPING',
      label: 'Rear Bump Stiffness',
      value: tune.bmpRear,
    },

    // 7. AERO DOWNFORCE
    {
      id: 'aero_f',
      category: '7. AERO DOWNFORCE',
      label: 'Front Downforce',
      value: tune.aeroFront,
    },
    {
      id: 'aero_r',
      category: '7. AERO DOWNFORCE',
      label: 'Rear Downforce',
      value: tune.aeroRear,
    },

    // 8. BRAKES
    {
      id: 'brake_bal',
      category: '8. BRAKES',
      label: 'Braking Balance',
      value: tune.brakeBalance,
    },
    {
      id: 'brake_pres',
      category: '8. BRAKES',
      label: 'Braking Pressure',
      value: tune.brakePressure,
    },

    // 9. DIFFERENTIAL
    ...(tune.diffFront
      ? [
          {
            id: 'diff_f',
            category: '9. DIFFERENTIAL',
            label: 'Front Differential (Acc / Dec)',
            value: tune.diffFront,
          },
        ]
      : []),
    ...(tune.diffRear
      ? [
          {
            id: 'diff_r',
            category: '9. DIFFERENTIAL',
            label: 'Rear Differential (Acc / Dec)',
            value: tune.diffRear,
          },
        ]
      : []),
    ...(tune.diffCenter
      ? [
          {
            id: 'diff_c',
            category: '9. DIFFERENTIAL',
            label: 'Center Differential Bias',
            value: tune.diffCenter,
          },
        ]
      : []),
  ];

  const totalCount = items.length;
  const checkedCount = Object.values(checkedIds).filter(Boolean).length;
  const pct = Math.round((checkedCount / totalCount) * 100);

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(console.error);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCheckAll = () => {
    const all: Record<string, boolean> = {};
    items.forEach(i => (all[i.id] = true));
    setCheckedIds(all);
  };

  const handleReset = () => {
    setCheckedIds({});
  };

  // Group by category
  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>{'IN-GAME TUNE COMPANION'}</Text>
              <Text style={styles.modalSubtitle}>
                {`${checkedCount} of ${totalCount} Applied (${pct}%)`}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtnSmall} onPress={onClose}>
              <Text style={styles.closeBtnSmallText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${pct}%` }]} />
          </View>

          {/* Quick Actions */}
          <View style={styles.toolbarRow}>
            <TouchableOpacity style={styles.toolBtn} onPress={handleCheckAll}>
              <Text style={styles.toolBtnText}>{'Check All'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={handleReset}>
              <Text style={styles.toolBtnText}>{'Reset'}</Text>
            </TouchableOpacity>
          </View>

          {/* Checklist Items Scroll */}
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {categories.map(cat => {
              const catItems = items.filter(i => i.category === cat);
              return (
                <View key={cat} style={styles.categorySection}>
                  <Text style={styles.categoryHeader}>{cat}</Text>
                  {catItems.map(item => {
                    const isChecked = !!checkedIds[item.id];
                    const isCopied = copiedId === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        style={[styles.itemRow, isChecked && styles.itemRowChecked]}
                        onPress={() => toggleCheck(item.id)}
                      >
                        {/* Checkbox box */}
                        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                          {isChecked && <Text style={styles.checkmark}>✓</Text>}
                        </View>

                        {/* Labels & Values */}
                        <View style={styles.itemInfo}>
                          <Text
                            style={[
                              styles.itemLabel,
                              isChecked && styles.itemLabelChecked,
                            ]}
                          >
                            {item.label}
                          </Text>
                          {item.subValue ? (
                            <Text style={styles.itemSubValue}>{item.subValue}</Text>
                          ) : null}
                        </View>

                        <Text
                          style={[
                            styles.itemValue,
                            isChecked && styles.itemValueChecked,
                          ]}
                        >
                          {item.value}
                        </Text>

                        {/* Copy Button */}
                        <TouchableOpacity
                          style={[styles.copyBtn, isCopied && styles.copyBtnCopied]}
                          onPress={e => {
                            e.stopPropagation?.();
                            handleCopy(item.id, item.value);
                          }}
                        >
                          <Text
                            style={[
                              styles.copyBtnText,
                              isCopied && styles.copyBtnTextCopied,
                            ]}
                          >
                            {isCopied ? 'Copied' : 'Copy'}
                          </Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>

          {/* Close button */}
          <TouchableOpacity style={styles.bottomCloseBtn} onPress={onClose}>
            <Text style={styles.bottomCloseBtnText}>{'Done Tuning'}</Text>
          </TouchableOpacity>
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
    maxWidth: 560,
    height: '92%',
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
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#00f0ff',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#00ff9d',
    fontWeight: '700',
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
  progressTrack: {
    height: 6,
    backgroundColor: '#070a10',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e2638',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00ff9d',
    borderRadius: 3,
  },
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 10,
  },
  toolBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#070a10',
    borderWidth: 1,
    borderColor: '#1e2638',
    borderRadius: 5,
  },
  toolBtnText: {
    color: '#8a99ad',
    fontSize: 11,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
    marginBottom: 12,
  },
  categorySection: {
    marginBottom: 14,
  },
  categoryHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ff1744',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2336',
    paddingBottom: 3,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#070a10',
    borderWidth: 1,
    borderColor: '#161f30',
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 4,
    gap: 8,
  },
  itemRowChecked: {
    backgroundColor: '#0a141c',
    borderColor: '#13353e',
    opacity: 0.7,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f1420',
  },
  checkboxChecked: {
    backgroundColor: '#00ff9d',
    borderColor: '#00ff9d',
  },
  checkmark: {
    color: '#070a10',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemLabel: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  itemLabelChecked: {
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
  itemSubValue: {
    color: '#00f0ff',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 1,
  },
  itemValue: {
    color: '#00ff9d',
    fontSize: 12,
    fontWeight: '800',
    marginRight: 6,
  },
  itemValueChecked: {
    color: '#475569',
  },
  copyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#0f1420',
    borderWidth: 1,
    borderColor: '#1e2638',
    borderRadius: 4,
  },
  copyBtnCopied: {
    backgroundColor: '#00ff9d',
    borderColor: '#00ff9d',
  },
  copyBtnText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  copyBtnTextCopied: {
    color: '#070a10',
  },
  bottomCloseBtn: {
    backgroundColor: '#ff1744',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bottomCloseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
