import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Check, Copy, Share2, X } from 'lucide-react-native';
import { TuneResult, VehicleInputs } from '../../types/tuning';
import { copyOrShareText, formatShareableTuneCard } from '../../utils/shareTuneCard';
import { t } from '../../i18n';
import { THEME } from '../../theme';

export interface CompanionChecklistModalProps {
  visible: boolean;
  onClose: () => void;
  tune: TuneResult;
  inputs: VehicleInputs;
  checkedIds?: Set<string>;
  onToggleCheck?: (id: string) => void;
  onCheckAll?: (allIds: string[]) => void;
  onResetChecks?: () => void;
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
  checkedIds: controlledCheckedIds,
  onToggleCheck,
  onCheckAll,
  onResetChecks,
}) => {
  const [internalCheckedIds, setInternalCheckedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCard, setCopiedCard] = useState(false);

  const activeCheckedIds = controlledCheckedIds ?? internalCheckedIds;

  const catTires = t('catTires');
  const catGearing = t('catGearing');
  const catAlignment = t('catAlignment');
  const catArbs = t('catArbs');
  const catSprings = t('catSprings');
  const catDamping = t('catDamping');
  const catAero = t('catAero');
  const catBrakes = t('catBrakes');
  const catDiff = t('catDiff');

  // Build the items in the exact Forza garage sequence
  const items: ChecklistItem[] = [
    // 1. TIRES
    {
      id: 'tire_f',
      category: catTires,
      label: 'Front Tire Pressure (Cold)',
      value: tune.tireFrontCold,
      subValue: `Hot Target: ${tune.tireFrontHot}`,
    },
    {
      id: 'tire_r',
      category: catTires,
      label: 'Rear Tire Pressure (Cold)',
      value: tune.tireRearCold,
      subValue: `Hot Target: ${tune.tireRearHot}`,
    },

    // 2. GEARING
    {
      id: 'gear_fd',
      category: catGearing,
      label: 'Final Drive',
      value: tune.finalDrive,
      subValue: `Aero Top Speed: ${tune.estimatedTopSpeed}`,
    },
    ...tune.gearRatios.map((r, i) => ({
      id: `gear_${i + 1}`,
      category: catGearing,
      label: `Gear ${i + 1}`,
      value: r.toFixed(2),
      subValue:
        tune.gearMaxSpeeds[i] != null
          ? `Max: ${tune.gearMaxSpeeds[i]} ${inputs.units === 'imperial' ? 'mph' : 'km/h'}`
          : undefined,
    })),

    // 3. ALIGNMENT
    {
      id: 'align_cf',
      category: catAlignment,
      label: 'Front Camber',
      value: tune.camberFront,
    },
    {
      id: 'align_cr',
      category: catAlignment,
      label: 'Rear Camber',
      value: tune.camberRear,
    },
    {
      id: 'align_tf',
      category: catAlignment,
      label: 'Front Toe',
      value: tune.toeFront,
    },
    {
      id: 'align_tr',
      category: catAlignment,
      label: 'Rear Toe',
      value: tune.toeRear,
    },
    {
      id: 'align_caster',
      category: catAlignment,
      label: 'Front Caster Angle',
      value: tune.caster,
    },

    // 4. ANTI-ROLL BARS
    {
      id: 'arb_f',
      category: catArbs,
      label: 'Front Anti-Roll Bar',
      value: tune.arbFront,
    },
    {
      id: 'arb_r',
      category: catArbs,
      label: 'Rear Anti-Roll Bar',
      value: tune.arbRear,
      subValue: tune.handlingBiasNote,
    },

    // 5. SPRINGS & RIDE HEIGHT
    {
      id: 'sp_f',
      category: catSprings,
      label: 'Front Springs',
      value: tune.springFront,
    },
    {
      id: 'sp_r',
      category: catSprings,
      label: 'Rear Springs',
      value: tune.springRear,
    },
    {
      id: 'rh_f',
      category: catSprings,
      label: 'Front Ride Height',
      value: tune.heightFront,
    },
    {
      id: 'rh_r',
      category: catSprings,
      label: 'Rear Ride Height',
      value: tune.heightRear,
    },

    // 6. DAMPING
    {
      id: 'damp_reb_f',
      category: catDamping,
      label: 'Front Rebound Stiffness',
      value: tune.rebFront,
    },
    {
      id: 'damp_reb_r',
      category: catDamping,
      label: 'Rear Rebound Stiffness',
      value: tune.rebRear,
    },
    {
      id: 'damp_bmp_f',
      category: catDamping,
      label: 'Front Bump Stiffness',
      value: tune.bmpFront,
    },
    {
      id: 'damp_bmp_r',
      category: catDamping,
      label: 'Rear Bump Stiffness',
      value: tune.bmpRear,
    },

    // 7. AERO DOWNFORCE
    {
      id: 'aero_f',
      category: catAero,
      label: 'Front Downforce',
      value: tune.aeroFront,
    },
    {
      id: 'aero_r',
      category: catAero,
      label: 'Rear Downforce',
      value: tune.aeroRear,
    },

    // 8. BRAKES
    {
      id: 'brake_bal',
      category: catBrakes,
      label: 'Braking Balance',
      value: tune.brakeBalance,
    },
    {
      id: 'brake_pres',
      category: catBrakes,
      label: 'Braking Pressure',
      value: tune.brakePressure,
    },

    // 9. DIFFERENTIAL
    ...(tune.diffFront
      ? [
          {
            id: 'diff_f',
            category: catDiff,
            label: 'Front Differential (Acc / Dec)',
            value: tune.diffFront,
          },
        ]
      : []),
    ...(tune.diffRear
      ? [
          {
            id: 'diff_r',
            category: catDiff,
            label: 'Rear Differential (Acc / Dec)',
            value: tune.diffRear,
          },
        ]
      : []),
    ...(tune.diffCenter
      ? [
          {
            id: 'diff_c',
            category: catDiff,
            label: 'Center Differential Bias',
            value: tune.diffCenter,
          },
        ]
      : []),
  ];

  const totalCount = items.length;
  const checkedCount = items.filter(i => activeCheckedIds.has(i.id)).length;
  const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const toggleCheck = (id: string) => {
    if (onToggleCheck) {
      onToggleCheck(id);
      return;
    }
    setInternalCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopy = async (id: string, text: string) => {
    await copyOrShareText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCopyTuneCard = async () => {
    const cardText = formatShareableTuneCard(inputs, tune);
    const ok = await copyOrShareText(cardText);
    if (ok) {
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 1800);
    }
  };

  const handleCheckAll = () => {
    const allIds = items.map(i => i.id);
    if (onCheckAll) {
      onCheckAll(allIds);
    } else {
      setInternalCheckedIds(new Set(allIds));
    }
  };

  const handleReset = () => {
    if (onResetChecks) {
      onResetChecks();
    } else {
      setInternalCheckedIds(new Set());
    }
  };

  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.modalTitle}>{t('inGameTuneCompanion')}</Text>
              <Text style={styles.modalSubtitle}>
                {t('appliedProgress', { checked: checkedCount, total: totalCount, pct })}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtnSmall} onPress={onClose}>
              <X size={14} color={THEME.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${pct}%` }]} />
          </View>

          {/* Quick Actions */}
          <View style={styles.toolbarRow}>
            <TouchableOpacity
              style={[styles.copyCardBtn, copiedCard && styles.copyCardBtnCopied]}
              onPress={handleCopyTuneCard}
            >
              {copiedCard ? (
                <Check size={12} color={THEME.bgCanvas} strokeWidth={2.8} />
              ) : Platform.OS === 'web' ? (
                <Copy size={12} color={THEME.accentSteel} strokeWidth={2.4} />
              ) : (
                <Share2 size={12} color={THEME.accentSteel} strokeWidth={2.4} />
              )}
              <Text style={[styles.copyCardBtnText, copiedCard && styles.copyCardBtnTextCopied]}>
                {copiedCard ? t('tuneCardCopied') : t('copyTuneCard')}
              </Text>
            </TouchableOpacity>

            <View style={styles.toolbarRight}>
              <TouchableOpacity style={styles.toolBtn} onPress={handleCheckAll}>
                <Text style={styles.toolBtnText}>{t('checkAll')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={handleReset}>
                <Text style={styles.toolBtnText}>{t('reset')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Checklist Items Scroll */}
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {categories.map(cat => {
              const catItems = items.filter(i => i.category === cat);
              return (
                <View key={cat} style={styles.categorySection}>
                  <Text style={styles.categoryHeader}>{cat}</Text>
                  {catItems.map(item => {
                    const isChecked = activeCheckedIds.has(item.id);
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
                          {isChecked && <Check size={12} color={THEME.bgCanvas} strokeWidth={3} />}
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
                            {isCopied ? t('copied') : t('copy')}
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
            <Text style={styles.bottomCloseBtnText}>{t('doneTuning')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8,9,11,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 560,
    height: '92%',
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
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
    color: THEME.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  modalSubtitle: {
    fontSize: 11,
    color: THEME.accentAmber,
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtnSmall: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  progressTrack: {
    height: 6,
    backgroundColor: THEME.bgElevated,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  progressBar: {
    height: '100%',
    backgroundColor: THEME.accentBrand,
    borderRadius: 3,
  },
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  toolbarRight: {
    flexDirection: 'row',
    gap: 6,
  },
  copyCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    borderRadius: 6,
  },
  copyCardBtnCopied: {
    backgroundColor: THEME.accentSuccess,
    borderColor: THEME.accentSuccess,
  },
  copyCardBtnText: {
    color: THEME.accentSteel,
    fontSize: 11,
    fontWeight: '800',
  },
  copyCardBtnTextCopied: {
    color: THEME.bgCanvas,
  },
  toolBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 5,
  },
  toolBtnText: {
    color: THEME.textSecondary,
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
    color: THEME.accentAmber,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: 3,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 4,
    gap: 8,
  },
  itemRowChecked: {
    backgroundColor: THEME.bgCanvas,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    opacity: 0.72,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: THEME.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bgCard,
  },
  checkboxChecked: {
    backgroundColor: THEME.accentSuccess,
    borderColor: THEME.accentSuccess,
  },
  itemInfo: {
    flex: 1,
  },
  itemLabel: {
    color: THEME.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  itemLabelChecked: {
    color: THEME.textMuted,
    textDecorationLine: 'line-through',
  },
  itemSubValue: {
    color: THEME.accentSteel,
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 1,
  },
  itemValue: {
    color: THEME.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginRight: 6,
  },
  itemValueChecked: {
    color: THEME.textMuted,
  },
  copyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 4,
  },
  copyBtnCopied: {
    backgroundColor: THEME.accentSuccess,
    borderColor: THEME.accentSuccess,
  },
  copyBtnText: {
    color: THEME.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  copyBtnTextCopied: {
    color: THEME.bgCanvas,
  },
  bottomCloseBtn: {
    backgroundColor: THEME.accentBrand,
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
