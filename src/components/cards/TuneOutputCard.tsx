import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Gauge, Share2, Check, ClipboardCheck } from 'lucide-react-native';
import { OutputTab, TuneResult, VehicleInputs } from '../../types/tuning';
import { TuneGaugeRow } from '../ui/TuneGaugeRow';
import { GearingChart } from './GearingChart';
import { THEME, GEAR_CHART_COLORS } from '../../theme';
import { t } from '../../i18n';

interface TuneOutputCardProps {
  inputs: VehicleInputs;
  tune: TuneResult;
  outputTab: OutputTab;
  onChangeOutputTab: (tab: OutputTab) => void;
  selectedGear: number | null;
  onSelectGear: (gearIdx: number | null) => void;
  copiedShareCard: boolean;
  onCopyShareCard: () => void;
  onOpenChecklist: () => void;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const TuneOutputCard: React.FC<TuneOutputCardProps> = ({
  inputs,
  tune,
  outputTab,
  onChangeOutputTab,
  selectedGear,
  onSelectGear,
  copiedShareCard,
  onCopyShareCard,
  onOpenChecklist,
}) => {
  const isImp = inputs.units === 'imperial';
  const currentBias = inputs.handlingBias || 0;

  return (
    <View style={styles.card}>
      <View style={styles.outputHeaderRow}>
        <View>
          <View style={styles.titleRow}>
            <Gauge size={15} color={THEME.accentBrand} strokeWidth={2.5} />
            <Text style={styles.cardTitleAccent}>{t('calculatedTuneSetup')}</Text>
          </View>
          <Text style={styles.tapCopyHint}>{t('tapRowToCopyHint')}</Text>
        </View>

        <View style={styles.outputHeaderActions}>
          <TouchableOpacity
            style={[styles.miniShareBtn, copiedShareCard && styles.miniShareBtnCopied]}
            onPress={onCopyShareCard}
          >
            {copiedShareCard ? (
              <Check size={12} color={THEME.bgCanvas} strokeWidth={2.8} />
            ) : (
              <Share2 size={12} color={THEME.accentSteel} strokeWidth={2.3} />
            )}
            <Text
              style={[
                styles.miniShareBtnText,
                copiedShareCard && styles.miniShareBtnTextCopied,
              ]}
            >
              {copiedShareCard ? t('tuneCardCopied') : t('copyTuneCard')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.miniChecklistBtn} onPress={onOpenChecklist}>
            <ClipboardCheck size={12} color={THEME.accentSuccess} />
            <Text style={styles.miniChecklistBtnText}>{t('checklist')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Output Category Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.outputFilterScroll}
        contentContainerStyle={styles.outputFilterContent}
      >
        {([
          { key: 'all', label: t('filterAllTabs') },
          { key: 'tires', label: t('filterTiresAlign') },
          { key: 'susp', label: t('filterSuspension') },
          { key: 'aero', label: t('filterAeroDiff') },
          { key: 'gears', label: t('filterGearing') },
        ] as { key: OutputTab; label: string }[]).map(tab => {
          const isActive = outputTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.outputFilterChip, isActive && styles.outputFilterChipActive]}
              onPress={() => onChangeOutputTab(tab.key)}
            >
              <Text
                style={[
                  styles.outputFilterChipText,
                  isActive && styles.outputFilterChipTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sub-section 1: Tires & Alignment */}
      {(outputTab === 'all' || outputTab === 'tires') && (
        <View>
          <Text style={styles.subSectionHeader}>{t('secTiresAlignment')}</Text>
          <TuneGaugeRow
            label={t('tirePressureFR')}
            valueText={`${tune.tireFrontCold} / ${tune.tireRearCold}`}
            frontRatio={tune.raw.tireFrontRatio}
            rearRatio={tune.raw.tireRearRatio}
            subLabel={t('targetHotTelemetry')}
            subValue={`${tune.tireFrontHot} / ${tune.tireRearHot}`}
            subColor={THEME.accentAmber}
          />
          <TuneGaugeRow
            label={t('camberFR')}
            valueText={`${tune.camberFront} / ${tune.camberRear}`}
            frontRatio={tune.raw.camberFrontRatio}
            rearRatio={tune.raw.camberRearRatio}
          />
          <TuneGaugeRow
            label={t('toeFR')}
            valueText={`${tune.toeFront} / ${tune.toeRear}`}
            frontRatio={clamp01((tune.raw.toeFrontDeg + 1.2) / 2.4)}
            rearRatio={clamp01((tune.raw.toeRearDeg + 1.2) / 2.4)}
          />
          <TuneGaugeRow
            label={t('casterAngle')}
            valueText={tune.caster}
            singleRatio={tune.raw.casterRatio}
          />
        </View>
      )}

      {/* Sub-section 2: Suspension & Damping */}
      {(outputTab === 'all' || outputTab === 'susp') && (
        <View>
          <Text style={styles.subSectionHeader}>{t('secSuspensionDamping')}</Text>
          <TuneGaugeRow
            label={t('arbFR')}
            valueText={`${tune.arbFront} / ${tune.arbRear}`}
            frontRatio={tune.raw.arbFrontRatio}
            rearRatio={tune.raw.arbRearRatio}
            subLabel={currentBias !== 0 ? t('handlingBalanceSub') : undefined}
            subValue={currentBias !== 0 ? tune.handlingBiasNote : undefined}
            subColor={currentBias > 0 ? THEME.accentBrand : THEME.accentSteel}
          />
          <TuneGaugeRow
            label={t('springsFR')}
            valueText={`${tune.springFront} / ${tune.springRear}`}
            frontRatio={tune.raw.springFrontRatio}
            rearRatio={tune.raw.springRearRatio}
          />
          <TuneGaugeRow
            label={t('rideHeightFR')}
            valueText={`${tune.heightFront} / ${tune.heightRear}`}
            frontRatio={tune.raw.heightFrontRatio}
            rearRatio={tune.raw.heightRearRatio}
          />
          <TuneGaugeRow
            label={t('reboundDampingFR')}
            valueText={`${tune.rebFront} / ${tune.rebRear}`}
            frontRatio={tune.raw.rebFrontRatio}
            rearRatio={tune.raw.rebRearRatio}
          />
          <TuneGaugeRow
            label={t('bumpDampingFR')}
            valueText={`${tune.bmpFront} / ${tune.bmpRear}`}
            frontRatio={tune.raw.bmpFrontRatio}
            rearRatio={tune.raw.bmpRearRatio}
          />
        </View>
      )}

      {/* Sub-section 3: Aero, Brakes & Differential */}
      {(outputTab === 'all' || outputTab === 'aero') && (
        <View>
          <Text style={styles.subSectionHeader}>{t('secAeroBrakesDiff')}</Text>
          <TuneGaugeRow
            label={t('aeroDownforceFR')}
            valueText={`${tune.aeroFront} / ${tune.aeroRear}`}
            frontRatio={tune.raw.aeroFrontRatio}
            rearRatio={tune.raw.aeroRearRatio}
          />
          <TuneGaugeRow
            label={t('brakesBalancePressure')}
            valueText={`${tune.brakeBalance} / ${tune.brakePressure}`}
            frontRatio={tune.raw.brakeBalanceRatio}
            rearRatio={tune.raw.brakePressureRatio}
            frontTag="BAL"
            rearTag="PRS"
          />
          {tune.diffFront && (
            <TuneGaugeRow
              label={t('frontDiffAccDec')}
              valueText={tune.diffFront}
              frontRatio={tune.raw.diffFrontAccRatio}
              rearRatio={tune.raw.diffFrontDecRatio}
              frontTag="ACC"
              rearTag="DEC"
            />
          )}
          {tune.diffRear && (
            <TuneGaugeRow
              label={t('rearDiffAccDec')}
              valueText={tune.diffRear}
              frontRatio={tune.raw.diffRearAccRatio}
              rearRatio={tune.raw.diffRearDecRatio}
              frontTag="ACC"
              rearTag="DEC"
            />
          )}
          {tune.diffCenter && (
            <TuneGaugeRow
              label={t('centerDiffBias')}
              valueText={tune.diffCenter}
              singleRatio={tune.raw.diffCenterRatio}
            />
          )}
        </View>
      )}

      {/* Gearing & Interactive Chart */}
      {(outputTab === 'all' || outputTab === 'gears') && (
        <View>
          <Text style={styles.sectionDivider}>{t('gearingTransmission')}</Text>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>{t('calculatedFinalDrive')}</Text>
            <Text style={styles.outVal}>{tune.finalDrive}</Text>
          </View>
          <View style={styles.outputRow}>
            <Text style={styles.outLabel}>{t('estimatedAeroTopSpeed')}</Text>
            <Text style={[styles.outVal, { color: THEME.accentSteel }]}>{tune.estimatedTopSpeed}</Text>
          </View>

          {tune.aeroDragNote && (
            <View style={styles.aeroAdvisoryCard}>
              <Text style={styles.aeroAdvisoryTitle}>⚠️ {t('aeroDragAdvisory')}</Text>
              <Text style={styles.aeroAdvisoryText}>{tune.aeroDragNote}</Text>
            </View>
          )}

          <View style={styles.gearsGrid}>
            {tune.gearRatios.map((ratio, idx) => {
              const isGearSelected = selectedGear === idx;
              const gearColor = GEAR_CHART_COLORS[idx % GEAR_CHART_COLORS.length];
              const speedVal = tune.gearMaxSpeeds[idx];
              const dropRpm = tune.shiftDropRpms[idx];
              return (
                <TouchableOpacity
                  key={`g-${idx}`}
                  activeOpacity={0.75}
                  onPress={() => onSelectGear(isGearSelected ? null : idx)}
                  style={[
                    styles.gearPill,
                    isGearSelected && { borderColor: gearColor, backgroundColor: THEME.bgSubtle },
                  ]}
                >
                  <Text style={[styles.gearLabel, isGearSelected && { color: gearColor }]}>
                    {t('gearPrefix', { num: idx + 1 })}
                  </Text>
                  <Text style={styles.gearVal}>{ratio.toFixed(2)}</Text>
                  {speedVal != null && (
                    <Text style={styles.gearSpeed}>
                      {`${speedVal} ${isImp ? 'mph' : 'km/h'}`}
                    </Text>
                  )}
                  {idx > 0 && dropRpm > 0 && (
                    <Text style={styles.gearDrop}>
                      {`↳ ${(dropRpm / 1000).toFixed(1)}k`}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <GearingChart
            gearRatios={tune.gearRatios}
            finalDrive={parseFloat(tune.finalDrive) || 3.5}
            redlineRpm={tune.redlineRpm}
            driveCircumferenceM={tune.driveCircumferenceM}
            targetSpeed={tune.targetSpeedDisplay}
            units={inputs.units}
            estimatedTopSpeedKm={tune.estimatedTopSpeedKm}
            engineType={inputs.engineType}
            selectedGear={selectedGear}
            onSelectGear={onSelectGear}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitleAccent: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tapCopyHint: {
    fontSize: 10,
    color: THEME.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  outputHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  outputHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  miniShareBtnCopied: {
    backgroundColor: THEME.accentSuccess,
    borderColor: THEME.accentSuccess,
  },
  miniShareBtnText: {
    color: THEME.accentSteel,
    fontSize: 10,
    fontWeight: '800',
  },
  miniShareBtnTextCopied: {
    color: THEME.bgCanvas,
  },
  miniChecklistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  miniChecklistBtnText: {
    color: THEME.accentSuccess,
    fontSize: 10,
    fontWeight: '800',
  },
  outputFilterScroll: {
    flexGrow: 0,
    marginBottom: 6,
  },
  outputFilterContent: {
    gap: 6,
    paddingVertical: 2,
  },
  outputFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  outputFilterChipActive: {
    backgroundColor: THEME.accentBrand,
    borderColor: THEME.accentBrand,
  },
  outputFilterChipText: {
    color: THEME.textSecondary,
    fontSize: 10.5,
    fontWeight: '700',
  },
  outputFilterChipTextActive: {
    color: '#ffffff',
  },
  subSectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.accentAmber,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: 3,
  },
  sectionDivider: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.accentAmber,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 6,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingTop: 10,
    letterSpacing: 0.7,
  },
  outputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  outLabel: { color: THEME.textSecondary, fontSize: 12, fontWeight: '500' },
  outVal: {
    color: THEME.textPrimary,
    fontWeight: '800',
    fontSize: 12.5,
    fontVariant: ['tabular-nums'],
  },
  gearsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
  gearPill: {
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
    minWidth: 58,
  },
  gearLabel: { fontSize: 9, color: THEME.textSecondary, fontWeight: '700' },
  gearVal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: THEME.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  gearSpeed: { fontSize: 9, color: THEME.textSecondary, fontWeight: '600', marginTop: 1 },
  gearDrop: { fontSize: 8.5, color: THEME.textMuted, fontWeight: '600' },
  aeroAdvisoryCard: {
    backgroundColor: THEME.accentAmberDim,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    marginBottom: 6,
  },
  aeroAdvisoryTitle: {
    color: THEME.accentAmber,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  aeroAdvisoryText: {
    color: THEME.textPrimary,
    fontSize: 11,
    lineHeight: 16,
  },
});
