import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MobileTab, OutputTab, TuneResult, VehicleInputs } from './src/types/tuning';
import { formatShareableTuneCard, copyOrShareText } from './src/utils/shareTuneCard';
import { useTunerState } from './src/hooks/useTunerState';
import { useGaragePresets } from './src/hooks/useGaragePresets';
import { useKeyboardInset } from './src/hooks/useKeyboardInset';
import { FormNavigationProvider, useFormNavigation } from './src/context/FormNavigationContext';
import { HeaderCommandBar } from './src/components/layout/HeaderCommandBar';
import { ActiveVehicleHero } from './src/components/layout/ActiveVehicleHero';
import { StickyMobileBar } from './src/components/layout/StickyMobileBar';
import { KeyboardAccessoryBar } from './src/components/layout/KeyboardAccessoryBar';
import { ChassisPowerCard } from './src/components/cards/ChassisPowerCard';
import { TiresKinematicsCard } from './src/components/cards/TiresKinematicsCard';
import { SuspensionLimitsCard } from './src/components/cards/SuspensionLimitsCard';
import { AeroLimitsCard } from './src/components/cards/AeroLimitsCard';
import { EngineGearingCard } from './src/components/cards/EngineGearingCard';
import { TuneOutputCard } from './src/components/cards/TuneOutputCard';
import { TuneDoctorModal } from './src/components/modals/TuneDoctorModal';
import { CompanionChecklistModal } from './src/components/modals/CompanionChecklistModal';
import { GaragePresetsModal } from './src/components/modals/GaragePresetsModal';
import { THEME } from './src/theme';
import { t } from './src/i18n';

const PI_CLASSES = ['D', 'C', 'B', 'A', 'S1', 'S2', 'X'] as const;

interface MobileKeyboardChromeProps {
  isWideScreen: boolean;
  isKeyboardVisible: boolean;
  tune: TuneResult;
  onViewTune: () => void;
  onOpenChecklist: () => void;
}

const MobileKeyboardChrome: React.FC<MobileKeyboardChromeProps> = ({
  isWideScreen,
  isKeyboardVisible,
  tune,
  onViewTune,
  onOpenChecklist,
}) => {
  const formNav = useFormNavigation();

  if (isWideScreen) {
    return null;
  }

  if (isKeyboardVisible) {
    if (formNav?.activeFieldId) {
      const activeId = formNav.activeFieldId;
      return (
        <KeyboardAccessoryBar
          label={formNav.activeFieldLabel}
          canGoPrev={formNav.canGoPrev}
          canGoNext={formNav.canGoNext}
          onPrev={() => formNav.focusPrev(activeId)}
          onNext={() => formNav.focusNext(activeId)}
          onDone={formNav.dismissKeyboard}
        />
      );
    }
    return null;
  }

  return (
    <StickyMobileBar
      tune={tune}
      onViewTune={onViewTune}
      onOpenChecklist={onOpenChecklist}
    />
  );
};

function AppContent() {
  const { width: windowWidth } = useWindowDimensions();
  const isWideScreen = windowWidth >= 920;
  const isNarrowMobile = windowWidth < 520;

  const scrollRef = useRef<ScrollView>(null);
  const keyboardFrameRef = useRef<View>(null);
  const scrollViewportRef = useRef<View>(null);
  const scrollOffsetRef = useRef<number>(0);

  const { keyboardInset, isKeyboardVisible } = useKeyboardInset({
    containerRef: keyboardFrameRef,
    subtractSafeAreaBottomOnIOS: true,
  });

  const [mobileTab, setMobileTab] = useState<MobileTab>('specs');
  const [outputTab, setOutputTab] = useState<OutputTab>('all');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const [doctorModalVisible, setDoctorModalVisible] = useState(false);
  const [checklistModalVisible, setChecklistModalVisible] = useState(false);
  const [presetModalVisible, setPresetModalVisible] = useState(false);
  const [copiedShareCard, setCopiedShareCard] = useState(false);
  const [copiedPresetId, setCopiedPresetId] = useState<string | null>(null);

  const {
    inputs,
    setInputs,
    tune,
    powerUnit,
    setPowerUnit,
    selectedGear,
    setSelectedGear,
    checklistCheckedIds,
    setChecklistCheckedIds,
    updateNumeric,
    toggleUnits,
    handleAutoScaleLimits,
    handleReset,
  } = useTunerState();

  const {
    savedPresets,
    presetNameInput,
    setPresetNameInput,
    handleSavePreset,
    handleLoadPreset,
    handleDeletePreset,
  } = useGaragePresets({
    inputs,
    setInputs,
    onPresetLoaded: () => {
      setChecklistCheckedIds(new Set());
      setPresetModalVisible(false);
    },
  });

  const handleCopyShareCard = async (
    targetInputs: VehicleInputs = inputs,
    targetTune: TuneResult = tune,
    presetId?: string
  ) => {
    const ok = await copyOrShareText(formatShareableTuneCard(targetInputs, targetTune));
    if (!ok) return;
    if (presetId) {
      setCopiedPresetId(presetId);
      setTimeout(() => setCopiedPresetId(prev => (prev === presetId ? null : prev)), 1800);
    } else {
      setCopiedShareCard(true);
      setTimeout(() => setCopiedShareCard(false), 1800);
    }
  };

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCyclePiClass = () => {
    setInputs(prev => {
      const currentIdx = PI_CLASSES.indexOf(
        (prev.piClass?.toUpperCase() || 'A') as (typeof PI_CLASSES)[number]
      );
      const nextPi = PI_CLASSES[(currentIdx + 1) % PI_CLASSES.length];
      return { ...prev, piClass: nextPi };
    });
  };

  const weightKg = inputs.units === 'imperial' ? inputs.weight / 2.20462 : inputs.weight;
  const ptwVal = Math.round((inputs.hp / Math.max(100, weightKg)) * 1000);

  const showSpecsCards = isWideScreen || mobileTab === 'specs' || mobileTab === 'all';
  const showLimitsCards = isWideScreen || mobileTab === 'limits' || mobileTab === 'all';
  const showTuneCard = isWideScreen || mobileTab === 'tune' || mobileTab === 'all';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <View
        ref={keyboardFrameRef}
        collapsable={false}
        style={[styles.keyboardFrame, { paddingBottom: keyboardInset }]}
      >
        <FormNavigationProvider
          scrollRef={scrollRef}
          scrollViewportRef={scrollViewportRef}
          scrollOffsetRef={scrollOffsetRef}
          keyboardInset={keyboardInset}
          isKeyboardVisible={isKeyboardVisible}
        >
          <View ref={scrollViewportRef} collapsable={false} style={styles.scrollViewport}>
            <ScrollView
              ref={scrollRef}
              style={styles.scrollView}
              contentContainerStyle={[
                styles.container,
                isWideScreen
                  ? styles.containerWide
                  : [
                      styles.containerMobile,
                      isNarrowMobile && styles.containerNarrowMobile,
                      isKeyboardVisible && styles.containerMobileKeyboardOpen,
                    ],
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              scrollEventThrottle={16}
              onScroll={e => {
                scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
              }}
            >
              <HeaderCommandBar
                isWideScreen={isWideScreen}
                units={inputs.units}
                onToggleUnits={toggleUnits}
                onReset={handleReset}
                onOpenDoctor={() => setDoctorModalVisible(true)}
                onOpenChecklist={() => setChecklistModalVisible(true)}
                onOpenGarage={() => setPresetModalVisible(true)}
              />

              <ActiveVehicleHero
                inputs={inputs}
                ptwVal={ptwVal}
                onOpenGarage={() => setPresetModalVisible(true)}
                onOpenDoctor={() => setDoctorModalVisible(true)}
                onCyclePiClass={handleCyclePiClass}
              />

              {!isWideScreen && (
                <View style={styles.mobileTabBar}>
                  {([
                    { key: 'specs', label: t('tabSpecs') },
                    { key: 'limits', label: t('tabLimits') },
                    { key: 'tune', label: t('tabTune') },
                    { key: 'all', label: t('tabAll') },
                  ] as { key: MobileTab; label: string }[]).map(tab => {
                    const isActive = mobileTab === tab.key;
                    return (
                      <TouchableOpacity
                        key={tab.key}
                        style={[styles.mobileTabPill, isActive && styles.mobileTabPillActive]}
                        onPress={() => setMobileTab(tab.key)}
                      >
                        <Text style={[styles.mobileTabText, isActive && styles.mobileTabTextActive]}>
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={isWideScreen ? styles.mainGridWide : styles.mainGridNarrow}>
                {(showSpecsCards || showLimitsCards) && (
                  <View style={isWideScreen ? styles.leftColumnWide : styles.columnFull}>
                    {showSpecsCards && (
                      <>
                        <ChassisPowerCard
                          inputs={inputs}
                          powerUnit={powerUnit}
                          onChangePowerUnit={setPowerUnit}
                          onUpdateInputs={setInputs}
                          onUpdateNumeric={updateNumeric}
                          collapsed={!!collapsedSections.chassis}
                          onToggleCollapse={() => toggleSection('chassis')}
                        />
                        <TiresKinematicsCard
                          inputs={inputs}
                          onUpdateInputs={setInputs}
                          onUpdateNumeric={updateNumeric}
                          collapsed={!!collapsedSections.tires}
                          onToggleCollapse={() => toggleSection('tires')}
                        />
                      </>
                    )}

                    {showLimitsCards && (
                      <>
                        <SuspensionLimitsCard
                          inputs={inputs}
                          onUpdateInputs={setInputs}
                          onUpdateNumeric={updateNumeric}
                          onAutoScaleLimits={handleAutoScaleLimits}
                          collapsed={!!collapsedSections.limits}
                          onToggleCollapse={() => toggleSection('limits')}
                        />
                        <AeroLimitsCard
                          inputs={inputs}
                          onUpdateNumeric={updateNumeric}
                          collapsed={!!collapsedSections.aero}
                          onToggleCollapse={() => toggleSection('aero')}
                        />
                        <EngineGearingCard
                          inputs={inputs}
                          onUpdateInputs={setInputs}
                          onUpdateNumeric={updateNumeric}
                          collapsed={!!collapsedSections.engine}
                          onToggleCollapse={() => toggleSection('engine')}
                        />
                      </>
                    )}
                  </View>
                )}

                {showTuneCard && (
                  <View style={isWideScreen ? styles.rightColumnWide : styles.columnFull}>
                    <TuneOutputCard
                      inputs={inputs}
                      tune={tune}
                      outputTab={outputTab}
                      onChangeOutputTab={setOutputTab}
                      selectedGear={selectedGear}
                      onSelectGear={setSelectedGear}
                      copiedShareCard={copiedShareCard}
                      onCopyShareCard={() => handleCopyShareCard()}
                      onOpenChecklist={() => setChecklistModalVisible(true)}
                    />
                  </View>
                )}
              </View>
            </ScrollView>
          </View>

          <MobileKeyboardChrome
            isWideScreen={isWideScreen}
            isKeyboardVisible={isKeyboardVisible}
            tune={tune}
            onViewTune={() => {
              setMobileTab('tune');
              scrollRef.current?.scrollTo({ y: 0, animated: true });
            }}
            onOpenChecklist={() => setChecklistModalVisible(true)}
          />
        </FormNavigationProvider>
      </View>

      <TuneDoctorModal
        visible={doctorModalVisible}
        onClose={() => setDoctorModalVisible(false)}
        inputs={inputs}
        onApplyFix={(newInputs: VehicleInputs) => setInputs(newInputs)}
      />

      <CompanionChecklistModal
        visible={checklistModalVisible}
        onClose={() => setChecklistModalVisible(false)}
        tune={tune}
        inputs={inputs}
        checkedIds={checklistCheckedIds}
        onToggleCheck={id => {
          setChecklistCheckedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
              next.delete(id);
            } else {
              next.add(id);
            }
            return next;
          });
        }}
        onCheckAll={allIds => setChecklistCheckedIds(new Set(allIds))}
        onResetChecks={() => setChecklistCheckedIds(new Set())}
      />

      <GaragePresetsModal
        visible={presetModalVisible}
        onClose={() => setPresetModalVisible(false)}
        presetNameInput={presetNameInput}
        onChangePresetName={setPresetNameInput}
        savedPresets={savedPresets}
        onSavePreset={handleSavePreset}
        onLoadPreset={handleLoadPreset}
        onDeletePreset={handleDeletePreset}
        copiedPresetId={copiedPresetId}
        onCopyPresetCard={handleCopyShareCard}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={styles.provider}>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  provider: {
    flex: 1,
    backgroundColor: THEME.bgCanvas,
  },
  safeArea: {
    flex: 1,
    backgroundColor: THEME.bgCanvas,
  },
  keyboardFrame: {
    flex: 1,
  },
  scrollViewport: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  container: {
    padding: 14,
    width: '100%',
    alignSelf: 'center',
  },
  containerMobile: {
    maxWidth: 640,
    paddingBottom: 24,
  },
  containerNarrowMobile: {
    padding: 12,
    paddingBottom: 24,
  },
  containerMobileKeyboardOpen: {
    paddingBottom: 56,
  },
  containerWide: {
    maxWidth: 1220,
    paddingBottom: 48,
  },
  mobileTabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 999,
    padding: 4,
    gap: 4,
    marginBottom: 14,
  },
  mobileTabPill: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileTabPillActive: {
    backgroundColor: THEME.accentBrand,
  },
  mobileTabText: {
    color: THEME.textSecondary,
    fontSize: 10.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  mobileTabTextActive: {
    color: '#ffffff',
  },
  mainGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
  },
  mainGridNarrow: {
    flexDirection: 'column',
  },
  leftColumnWide: {
    flex: 1.05,
    minWidth: 0,
  },
  rightColumnWide: {
    flex: 0.95,
    minWidth: 0,
  },
  columnFull: {
    width: '100%',
  },
});
