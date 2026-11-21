import React, { useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  FlatList,
  Platform,
  StyleSheet,
  TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Copy, Trash2 } from 'lucide-react-native';
import { DEFAULT_INPUTS, PresetItem, TuneResult, VehicleInputs } from '../../types/tuning';
import { calculateTune } from '../../engine';
import { useKeyboardInset } from '../../hooks/useKeyboardInset';
import { THEME, getPiColor } from '../../theme';
import { t } from '../../i18n';

const WEB_INPUT_RESET: TextStyle | undefined =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : undefined;

interface GaragePresetsModalProps {
  visible: boolean;
  onClose: () => void;
  presetNameInput: string;
  onChangePresetName: (text: string) => void;
  savedPresets: PresetItem[];
  onSavePreset: () => void;
  onLoadPreset: (preset: PresetItem) => void;
  onDeletePreset: (preset: PresetItem) => void;
  copiedPresetId: string | null;
  onCopyPresetCard: (inputs: VehicleInputs, tune: TuneResult, presetId: string) => void;
}

export const GaragePresetsModal: React.FC<GaragePresetsModalProps> = ({
  visible,
  onClose,
  presetNameInput,
  onChangePresetName,
  savedPresets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  copiedPresetId,
  onCopyPresetCard,
}) => {
  const overlayRef = useRef<View>(null);
  const insets = useSafeAreaInsets();
  const { keyboardInset, isKeyboardVisible } = useKeyboardInset({
    containerRef: overlayRef,
    subtractSafeAreaBottomOnIOS: false,
    enabled: visible,
  });

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
            paddingTop: Math.max(18, insets.top + 8),
            paddingBottom: isKeyboardVisible
              ? keyboardInset + 12
              : Math.max(18, insets.bottom + 12),
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
          <Text style={styles.modalTitle}>{t('carGaragePresets')}</Text>

          <View style={styles.saveRow}>
            <TextInput
              style={[styles.input, WEB_INPUT_RESET]}
              placeholder={t('newPresetPlaceholder')}
              placeholderTextColor={THEME.textMuted}
              cursorColor={THEME.accentBrand}
              selectionColor={THEME.accentBrand}
              value={presetNameInput}
              onChangeText={onChangePresetName}
              returnKeyType="done"
              enterKeyHint="done"
              maxLength={40}
              autoCorrect={false}
              onSubmitEditing={onSavePreset}
            />
            <TouchableOpacity style={styles.saveActionBtn} onPress={onSavePreset}>
              <Text style={styles.saveActionBtnText}>{t('save')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>{t('savedVehicles')}</Text>
          {savedPresets.length === 0 ? (
            <Text style={styles.emptyText}>{t('noPresetsSaved')}</Text>
          ) : (
            <FlatList
              data={savedPresets}
              keyExtractor={item => item.id}
              style={[styles.presetList, !isKeyboardVisible && styles.presetListDefaultMax]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              renderItem={({ item }) => {
                const pInputs = { ...DEFAULT_INPUTS, ...item.inputs };
                const pPiColor = getPiColor(pInputs.piClass);
                const isCopied = copiedPresetId === item.id;
                const wtUnit = pInputs.units === 'imperial' ? 'lbs' : 'kg';
                return (
                  <View style={styles.presetCard}>
                    <TouchableOpacity
                      style={styles.presetCardMain}
                      onPress={() => onLoadPreset(item)}
                    >
                      <View style={styles.presetTitleRow}>
                        <View style={[styles.presetPiBadge, { backgroundColor: pPiColor }]}>
                          <Text style={styles.presetPiText}>{pInputs.piClass || 'A'}</Text>
                        </View>
                        <Text style={styles.presetItemText} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                      <Text style={styles.presetCarSub} numberOfLines={1}>
                        {pInputs.carName || t('customBuild')}
                      </Text>
                      <Text style={styles.presetSpecMeta}>
                        {`${pInputs.discipline.toUpperCase()} • ${pInputs.drivetrain} • ${Math.round(pInputs.hp)} HP • ${pInputs.weight} ${wtUnit}`}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.presetActions}>
                      <TouchableOpacity
                        style={[styles.presetActionIconBtn, isCopied && styles.presetActionIconBtnCopied]}
                        onPress={() => onCopyPresetCard(pInputs, calculateTune(pInputs), item.id)}
                        accessibilityLabel="Copy tune card"
                      >
                        {isCopied ? (
                          <Check size={14} color={THEME.bgCanvas} strokeWidth={2.8} />
                        ) : (
                          <Copy size={14} color={THEME.accentSteel} strokeWidth={2.2} />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.presetDeleteIconBtn}
                        onPress={() => onDeletePreset(item)}
                        accessibilityLabel="Delete preset"
                      >
                        <Trash2 size={14} color={THEME.accentDanger} strokeWidth={2.2} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t('close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 16, 0.84)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '100%',
    flexShrink: 1,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    borderRadius: 28,
    padding: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: THEME.borderStrong,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: THEME.textPrimary,
    marginBottom: 12,
    letterSpacing: 0.4,
  },
  saveRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    minHeight: 42,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 999,
    color: THEME.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: Platform.select({ web: 16, default: 14 }),
    textAlignVertical: 'center',
    includeFontPadding: false,
    minWidth: 0,
  },
  presetList: {
    flexShrink: 1,
  },
  presetListDefaultMax: {
    maxHeight: 280,
  },
  saveActionBtn: {
    backgroundColor: THEME.accentBrand,
    borderWidth: 1,
    borderColor: THEME.accentBrand,
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 999,
  },
  saveActionBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 12.5 },
  label: { fontSize: 11.5, color: THEME.textSecondary, marginBottom: 6, fontWeight: '600' },
  emptyText: { color: THEME.textMuted, fontSize: 12.5, fontStyle: 'italic', marginVertical: 10 },
  presetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 18,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  presetCardMain: {
    flex: 1,
    minWidth: 0,
  },
  presetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  presetPiBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  presetPiText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '900',
  },
  presetItemText: { color: THEME.textPrimary, fontSize: 13.5, fontWeight: '800', flex: 1 },
  presetCarSub: { color: THEME.textSecondary, fontSize: 11.5, fontWeight: '600', marginTop: 2 },
  presetSpecMeta: { color: THEME.accentAmber, fontSize: 10.5, fontWeight: '600', marginTop: 2 },
  presetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  presetActionIconBtn: {
    padding: 9,
    borderRadius: 999,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
  },
  presetActionIconBtnCopied: {
    backgroundColor: THEME.accentSuccess,
    borderColor: THEME.accentSuccess,
  },
  presetDeleteIconBtn: {
    padding: 9,
    borderRadius: 999,
    backgroundColor: THEME.accentDangerDim,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.35)',
  },
  closeBtn: {
    marginTop: 14,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    paddingVertical: 11,
    borderRadius: 999,
    alignItems: 'center',
  },
  closeBtnText: { color: THEME.textPrimary, fontSize: 12.5, fontWeight: '700' },
});
