import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { ArrowRight, RotateCcw, Check, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { VehicleInputs } from '../../types/tuning';
import { calculateTune } from '../../engine';
import { SYMPTOMS, computeTuneDoctorDiff } from '../../engine/tuneDoctorRules';
import { useHorizontalDragScroll } from '../../hooks/useHorizontalDragScroll';
import { t } from '../../i18n';
import { THEME } from '../../theme';

export interface TuneDoctorModalProps {
  visible: boolean;
  onClose: () => void;
  inputs: VehicleInputs;
  onApplyFix: (newInputs: VehicleInputs, explanation: string) => void;
}

export const TuneDoctorModal: React.FC<TuneDoctorModalProps> = ({
  visible,
  onClose,
  inputs,
  onApplyFix,
}) => {
  const [selectedId, setSelectedId] = useState<string>(SYMPTOMS[0].id);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const {
    scrollRef,
    hasMovedRef,
    canScrollLeft,
    canScrollRight,
    handleScroll,
    scrollBy,
    scrollToTarget,
  } = useHorizontalDragScroll(visible);

  useEffect(() => {
    if (!visible) {
      setFeedbackMsg(null);
    }
  }, [visible]);

  const selectedIndex = SYMPTOMS.findIndex(s => s.id === selectedId);
  const currentSymptom = SYMPTOMS[selectedIndex >= 0 ? selectedIndex : 0];

  const hasActiveDoctorTweaks = useMemo(() => {
    const off = inputs.doctorOffsets;
    const hasOffset =
      off != null && Object.values(off).some(val => typeof val === 'number' && val !== 0);
    return hasOffset || (inputs.handlingBias || 0) !== 0;
  }, [inputs.doctorOffsets, inputs.handlingBias]);

  const diffRows = useMemo(
    () => computeTuneDoctorDiff(inputs, currentSymptom, calculateTune),
    [inputs, currentSymptom]
  );

  const handleSelectSymptom = (id: string, index: number) => {
    if (hasMovedRef.current) return;
    setSelectedId(id);
    setFeedbackMsg(null);
    scrollToTarget(Math.max(0, index * 175 - 40));
  };

  const handleApply = () => {
    const { updated, msg } = currentSymptom.apply(inputs);
    onApplyFix(updated, msg);
    setFeedbackMsg(msg);
  };

  const handleResetTweaks = () => {
    const resetInputs: VehicleInputs = {
      ...inputs,
      handlingBias: 0,
      doctorOffsets: undefined,
    };
    const msg = t('doctorTweaksResetMsg');
    onApplyFix(resetInputs, msg);
    setFeedbackMsg(msg);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={styles.modalTitle}>{t('tuneDoctor')}</Text>
                {hasActiveDoctorTweaks && (
                  <View style={styles.activeTweaksBadge}>
                    <Text style={styles.activeTweaksBadgeText}>{t('doctorFixesActive')}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.modalSubtitle}>{'Handling Diagnostics & Instant Fixes'}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtnSmall} onPress={onClose}>
              <X size={14} color={THEME.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Symptom Selection Horizontal Navigation Row with Chevrons */}
          <View style={styles.pillsWrapper}>
            <TouchableOpacity
              style={[styles.arrowBtn, !canScrollLeft && styles.arrowBtnDisabled]}
              disabled={!canScrollLeft}
              onPress={() => scrollBy(-180)}
              accessibilityLabel="Scroll options left"
            >
              <ChevronLeft size={16} color={canScrollLeft ? THEME.accentBrand : THEME.textMuted} strokeWidth={2.5} />
            </TouchableOpacity>

            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pillScroll}
              contentContainerStyle={styles.pillScrollContent}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {SYMPTOMS.map((s, idx) => {
                const isSelected = s.id === selectedId;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.symptomPill,
                      isSelected && [styles.symptomPillSelected, { borderColor: s.badgeColor }],
                    ]}
                    onPress={() => handleSelectSymptom(s.id, idx)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.badge, { backgroundColor: s.badgeColor }]}>
                      <Text style={styles.badgeText}>{s.badge}</Text>
                    </View>
                    <Text style={[styles.symptomPillText, isSelected && { color: THEME.textPrimary }]}>
                      {t(s.titleKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.arrowBtn, !canScrollRight && styles.arrowBtnDisabled]}
              disabled={!canScrollRight}
              onPress={() => scrollBy(180)}
              accessibilityLabel="Scroll options right"
            >
              <ChevronRight size={16} color={canScrollRight ? THEME.accentBrand : THEME.textMuted} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Dots & Counter Indicator */}
          <View style={styles.indicatorRow}>
            <View style={styles.dotsContainer}>
              {SYMPTOMS.map((s, idx) => {
                const isSelected = s.id === selectedId;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.dot,
                      isSelected && [styles.dotActive, { backgroundColor: s.badgeColor }],
                    ]}
                    onPress={() => handleSelectSymptom(s.id, idx)}
                  />
                );
              })}
            </View>
            <Text style={styles.counterText}>
              {selectedIndex + 1} / {SYMPTOMS.length}
            </Text>
          </View>

          {/* Detailed Diagnosis Card + Live Before -> After Diff Preview */}
          <ScrollView
            style={styles.detailScroll}
            contentContainerStyle={styles.detailScrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.diagnosisCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <View style={[styles.badge, { backgroundColor: currentSymptom.badgeColor }]}>
                    <Text style={styles.badgeText}>{currentSymptom.badge}</Text>
                  </View>
                  <Text style={styles.cardHeaderTitle}>{t(currentSymptom.titleKey)}</Text>
                </View>
                <Text style={styles.cardHeaderDesc}>{t(currentSymptom.descKey)}</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionHeading}>{t('diagnosis')}</Text>
              <Text style={styles.bodyText}>{t(currentSymptom.diagnosisKey)}</Text>

              <Text style={[styles.sectionHeading, { marginTop: 12 }]}>{t('prescription')}</Text>
              {currentSymptom.prescriptions.map((rx, idx) => (
                <View key={idx} style={styles.rxRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.rxText}>{rx}</Text>
                </View>
              ))}

              <View style={styles.divider} />

              <Text style={styles.diffHeading}>{t('liveTelemetryImpact')}</Text>
              {diffRows.length === 0 ? (
                <Text style={styles.noDiffText}>{t('noDirectChangesNeeded')}</Text>
              ) : (
                <View style={styles.diffList}>
                  {diffRows.map(row => (
                    <View key={row.label} style={styles.diffRow}>
                      <Text style={styles.diffLabel}>{row.label}</Text>
                      <View style={styles.diffValuesRow}>
                        <Text style={styles.diffBefore}>{row.before}</Text>
                        <ArrowRight size={11} color={THEME.textMuted} />
                        <Text style={styles.diffAfter}>{row.after}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Inline Confirmation Banner */}
          {feedbackMsg ? (
            <View style={styles.feedbackBanner}>
              <Check size={14} color={THEME.accentSuccess} strokeWidth={2.5} />
              <Text style={styles.feedbackText}>{feedbackMsg}</Text>
            </View>
          ) : null}

          {/* Action Footer */}
          <View style={styles.footerRow}>
            {hasActiveDoctorTweaks && (
              <TouchableOpacity style={styles.resetTweaksBtn} onPress={handleResetTweaks}>
                <RotateCcw size={12} color={THEME.accentSteel} strokeWidth={2.4} />
                <Text style={styles.resetTweaksText}>{t('resetDoctorTweaks')}</Text>
              </TouchableOpacity>
            )}
            <View style={styles.footerRight}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>{t('close')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                <Text style={styles.applyBtnText}>{t('applyFix')}</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    height: '88%',
    maxHeight: 680,
    minHeight: 420,
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
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: THEME.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  activeTweaksBadge: {
    backgroundColor: THEME.accentAmberDim,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeTweaksBadgeText: {
    color: THEME.accentAmber,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  modalSubtitle: {
    fontSize: 11,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  closeBtnSmall: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  pillsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  arrowBtn: {
    width: 28,
    height: 36,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtnDisabled: {
    opacity: 0.28,
    borderColor: THEME.border,
  },
  pillScroll: {
    flex: 1,
    maxHeight: 46,
    marginHorizontal: 6,
  },
  pillScrollContent: {
    gap: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  symptomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  symptomPillSelected: {
    backgroundColor: THEME.bgSubtle,
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  badgeText: {
    color: THEME.bgCanvas,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  symptomPillText: {
    color: THEME.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.borderStrong,
  },
  dotActive: {
    width: 16,
    borderRadius: 3,
  },
  counterText: {
    fontSize: 10,
    color: THEME.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailScroll: {
    flex: 1,
    minHeight: 200,
    marginBottom: 10,
  },
  detailScrollContent: {
    paddingBottom: 6,
  },
  diagnosisCard: {
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    padding: 14,
  },
  cardHeader: {
    marginBottom: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardHeaderTitle: {
    color: THEME.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  cardHeaderDesc: {
    color: THEME.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.border,
    marginVertical: 10,
  },
  sectionHeading: {
    color: THEME.accentSteel,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bodyText: {
    color: THEME.textPrimary,
    fontSize: 12,
    lineHeight: 18,
  },
  rxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 5,
    gap: 6,
  },
  bullet: {
    color: THEME.accentBrand,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: 'bold',
  },
  rxText: {
    flex: 1,
    color: THEME.textPrimary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  diffHeading: {
    color: THEME.accentAmber,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  noDiffText: {
    color: THEME.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  diffList: {
    gap: 5,
  },
  diffRow: {
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  diffLabel: {
    color: THEME.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  diffValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  diffBefore: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  diffAfter: {
    color: THEME.accentSuccess,
    fontSize: 11,
    fontWeight: '800',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.accentSuccessDim,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  feedbackText: {
    flex: 1,
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  footerRight: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 'auto',
  },
  resetTweaksBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
  },
  resetTweaksText: {
    color: THEME.accentSteel,
    fontSize: 11,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  applyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: THEME.accentBrand,
    borderWidth: 1,
    borderColor: THEME.accentBrand,
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
