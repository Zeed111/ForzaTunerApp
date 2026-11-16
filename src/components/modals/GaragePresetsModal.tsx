import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Check, Copy, Trash2 } from 'lucide-react-native';
import { DEFAULT_INPUTS, PresetItem, TuneResult, VehicleInputs } from '../../types/tuning';
import { calculateTune } from '../../engine';
import { THEME, getPiColor } from '../../theme';
import { t } from '../../i18n';

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
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('carGaragePresets')}</Text>

          <View style={styles.saveRow}>
            <TextInput
              style={styles.input}
              placeholder={t('newPresetPlaceholder')}
              placeholderTextColor={THEME.textMuted}
              value={presetNameInput}
              onChangeText={onChangePresetName}
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
              style={{ maxHeight: 280 }}
              keyboardShouldPersistTaps="handled"
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
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8,9,11,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    padding: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.textPrimary,
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 1,
  },
  saveRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 6,
    color: THEME.textPrimary,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    minWidth: 0,
  },
  saveActionBtn: {
    backgroundColor: THEME.accentBrand,
    borderWidth: 1,
    borderColor: THEME.accentBrand,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 6,
  },
  saveActionBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
  label: { fontSize: 11, color: THEME.textSecondary, marginBottom: 4, fontWeight: '600' },
  emptyText: { color: THEME.textMuted, fontSize: 12, fontStyle: 'italic', marginVertical: 8 },
  presetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    gap: 8,
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
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    minWidth: 22,
    alignItems: 'center',
  },
  presetPiText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '900',
  },
  presetItemText: { color: THEME.textPrimary, fontSize: 13, fontWeight: '800', flex: 1 },
  presetCarSub: { color: THEME.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 2 },
  presetSpecMeta: { color: THEME.accentAmber, fontSize: 10, fontWeight: '600', marginTop: 2 },
  presetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  presetActionIconBtn: {
    padding: 7,
    borderRadius: 6,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
  },
  presetActionIconBtnCopied: {
    backgroundColor: THEME.accentSuccess,
    borderColor: THEME.accentSuccess,
  },
  presetDeleteIconBtn: {
    padding: 7,
    borderRadius: 6,
    backgroundColor: THEME.accentDangerDim,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  closeBtn: {
    marginTop: 14,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeBtnText: { color: THEME.textSecondary, fontSize: 12, fontWeight: '600' },
});
