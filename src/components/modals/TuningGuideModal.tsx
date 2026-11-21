import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { BookOpen, Layers, Sliders, Check, X } from 'lucide-react-native';
import { CarCategory, VehicleInputs } from '../../types/tuning';
import { THEME } from '../../theme';
import { t } from '../../i18n';

export type GuideSectionTab = 'all' | 'category' | 'bias';

export interface TuningGuideModalProps {
  visible: boolean;
  initialTab?: GuideSectionTab;
  onClose: () => void;
  inputs: VehicleInputs;
  onSelectCategory?: (category: CarCategory) => void;
  onSelectBias?: (bias: number) => void;
}

interface CategoryGuideItem {
  key: CarCategory;
  title: string;
  tag: string;
  accentColor: string;
  summary: string;
  bestFor: string;
  adjustments: string[];
}

interface BiasRangeGuideItem {
  id: string;
  rangeLabel: string;
  title: string;
  sampleValue: number;
  matches: (bias: number) => boolean;
  accentColor: string;
  whenToUse: string;
  behaviorEffect: string;
}

const CATEGORY_GUIDES: CategoryGuideItem[] = [
  {
    key: 'jdm',
    title: 'JDM / Tuner',
    tag: 'STREET / TOUGE',
    accentColor: THEME.accentBrand,
    summary:
      'Tuned for agile street and touge coupes/sedans that balance crisp front turn-in with compliant curb absorption.',
    bestFor:
      'Japanese & sport compacts, tuner coupes, and street builds (e.g., Nissan Silvia / GT-R, Toyota Supra, Mazda RX-7, Subaru WRX, Civic Type R).',
    adjustments: [
      'Base Grip Camber: -2.0° Front / -1.4° Rear with 6.3° Caster',
      'Aero Downforce Target: 60% of slider range (balanced cornering vs top speed)',
      'Base Rebound Damping: 9.6 (responsive weight transfer without harshness)',
      'Ride Height Target: 15% Front / 18% Rear rake for forward bite',
    ],
  },
  {
    key: 'sports',
    title: 'Sports / GT',
    tag: 'ALL-ROUNDER',
    accentColor: THEME.accentSteel,
    summary:
      'Neutral grand-touring chassis baseline designed for modern sports cars with predictable, progressive limit handling.',
    bestFor:
      'Modern European & American sports coupes, roadsters, and GTs (e.g., Porsche 911 Carrera, BMW M3/M4, Corvette Stingray, Aston Martin, Audi RS).',
    adjustments: [
      'Base Grip Camber: -1.9° Front / -1.3° Rear with 6.3° Caster',
      'Aero Downforce Target: 60% baseline scaled by axle weight distribution',
      'Base Rebound Damping: 9.6 with balanced 58% bump ratio',
      'Ride Height Target: 15% Front / 18% Rear street-circuit stance',
    ],
  },
  {
    key: 'track',
    title: 'GT / Track',
    tag: 'MAX CORNERING',
    accentColor: THEME.accentSuccess,
    summary:
      'Aggressive circuit setup maximizing lateral G-force, high-speed aerodynamic downforce, and immediate turn-in response.',
    bestFor:
      'GT3/GT2 race cars, track-day specials, and high-grip circuit builds (e.g., 911 GT3 RS, Viper ACR, AMG GT Black Series, KTM X-Bow).',
    adjustments: [
      'Base Grip Camber: -2.4° Front / -1.7° Rear, 6.7° Caster, and 0.1° Out Front Toe',
      'Aero Downforce Target: 85% high-downforce ratio for maximum apex speed',
      'Base Rebound Damping: 11.2 firm circuit control & lowest Ride Height (8% F / 12% R)',
      'Brakes: +1% extra physical front brake bias & 115% brake pressure',
    ],
  },
  {
    key: 'classic',
    title: 'Classic / Muscle',
    tag: 'VINTAGE / TORQUE',
    accentColor: THEME.accentAmber,
    summary:
      'Flatter contact-patch geometry that protects straight-line traction and braking on older chassis and taller tire sidewalls.',
    bestFor:
      '1950s–1980s vintage cars, classic American muscle, and retro tourers (e.g., ’69 Charger, Mustang Boss 302, Hakosuka Skyline, classic Ferraris).',
    adjustments: [
      'Base Grip Camber: -1.5° Front / -0.9° Rear (keeps more tire flat under acceleration)',
      'Caster Angle: 5.7° base to prevent heavy, wandering steering on tall tires',
      'Base Rebound Damping: 9.6 paired with 15% F / 18% R ride height clearance',
    ],
  },
  {
    key: 'supercar',
    title: 'Supercar',
    tag: 'HIGH SPEED / S1–X',
    accentColor: '#A78BFA',
    summary:
      'High-velocity stability setup built to control massive horsepower and aerodynamic compression at 280+ km/h.',
    bestFor:
      'Mid-engine exotics, hypercars, and high-PI S1/S2/X builds (e.g., Ferrari 488/SF90, Lamborghini Huracán, McLaren 720S, Koenigsegg).',
    adjustments: [
      'Base Grip Camber: -2.2° Front / -1.8° Rear with 6.5° Caster',
      'Rear Toe Stability: Automatic +0.2° In Rear Toe to prevent high-speed rear snap',
      'Base Rebound Damping: 10.8 stiffer platform to resist aero bottoming',
    ],
  },
  {
    key: 'offroad',
    title: 'Offroad / Rally',
    tag: 'ROUGH TERRAIN',
    accentColor: '#38BDF8',
    summary:
      'High-clearance, soft-damped archetype that keeps tires planted over gravel, jumps, and broken multi-surface stages.',
    bestFor:
      'Rally cars, trophy trucks, buggies, SUVs, and cross-country builds (e.g., Lancia Delta, Ford Fiesta WRC, Hoonigan RS200, Bronco R).',
    adjustments: [
      'Base Camber: Upright -1.0° Front / -0.6° Rear for loose-surface braking & launch traction',
      'Aero Downforce Target: Reduced 35% base to avoid drag penalty on dirt straights',
      'Suspension: Compliant 7.5 base rebound & raised 55% ride height even in mixed grip mode',
    ],
  },
];

const BIAS_RANGE_GUIDES: BiasRangeGuideItem[] = [
  {
    id: 'deep-stable',
    rangeLabel: '-5 to -3',
    title: 'Maximum Stability (Strong Understeer Bias)',
    sampleValue: -3,
    matches: b => b <= -3,
    accentColor: THEME.accentSteel,
    whenToUse:
      'Use when a high-power RWD or mid-engine car feels twitchy, spins out over crests, or loses the rear on fast sweepers.',
    behaviorEffect:
      'Stiffens Front ARB (+4.8 to +8.0), softens Rear ARB (-5.4 to -9.0), adds front rebound control, and stands up rear camber to lock the rear axle down.',
  },
  {
    id: 'mild-stable',
    rangeLabel: '-2 to -1',
    title: 'Planted Exit (Mild Stability)',
    sampleValue: -1,
    matches: b => b >= -2 && b <= -1,
    accentColor: THEME.accentSteel,
    whenToUse:
      'Great for fast S1/S2 street circuits where you want extra rear confidence when applying throttle early out of corners.',
    behaviorEffect:
      'Slightly shifts roll stiffness forward (+1.6 to +3.2 Front ARB / -1.8 to -3.6 Rear ARB) to calm snap oversteer without killing turn-in.',
  },
  {
    id: 'neutral',
    rangeLabel: '0',
    title: 'Neutral Physics Baseline (Recommended Start)',
    sampleValue: 0,
    matches: b => b === 0,
    accentColor: THEME.accentSuccess,
    whenToUse:
      'Always start here on a fresh build. Pure physics calculation balanced strictly from your weight distribution, tire stagger, and drivetrain.',
    behaviorEffect:
      'Zero artificial roll-stiffness offset; front and rear ARBs, camber, and damping match your vehicle’s exact mass and tire ratio.',
  },
  {
    id: 'mild-agile',
    rangeLabel: '+1 to +2',
    title: 'Crisp Turn-In (Mild Agility / Rotation)',
    sampleValue: 2,
    matches: b => b >= 1 && b <= 2,
    accentColor: THEME.accentAmber,
    whenToUse:
      'Ideal when an AWD or front-heavy car pushes slightly wide at the apex and needs sharper nose bite into corners.',
    behaviorEffect:
      'Softens Front ARB (-1.6 to -3.2) and stiffens Rear ARB (+1.8 to +3.6), plus subtle front negative camber and toe-out for immediate turn-in.',
  },
  {
    id: 'deep-agile',
    rangeLabel: '+3 to +5',
    title: 'Maximum Agility (Aggressive Oversteer Rotation)',
    sampleValue: 4,
    matches: b => b >= 3,
    accentColor: THEME.accentBrand,
    whenToUse:
      'Use for tight technical circuits, hairpins, or stubborn understeering AWD/FWD builds where you want the rear to actively rotate on entry.',
    behaviorEffect:
      'Softens Front ARB (-4.8 to -8.0), strongly stiffens Rear ARB (+5.4 to +9.0), adds up to -0.1° Front Toe-Out, and increases rear rebound for lift-off rotation.',
  },
];

export const TuningGuideModal: React.FC<TuningGuideModalProps> = ({
  visible,
  initialTab = 'all',
  onClose,
  inputs,
  onSelectCategory,
  onSelectBias,
}) => {
  const [activeTab, setActiveTab] = useState<GuideSectionTab>(initialTab);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  const currentBias = inputs.handlingBias || 0;
  const activeCatGuide =
    CATEGORY_GUIDES.find(c => c.key === inputs.category) || CATEGORY_GUIDES[0];

  const showCategorySection = activeTab === 'all' || activeTab === 'category';
  const showBiasSection = activeTab === 'all' || activeTab === 'bias';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Dismiss tuning guide modal"
        />
        <View style={styles.modalContent}>
          <View style={styles.sheetHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleBlock}>
              <View style={styles.titleRow}>
                <BookOpen size={17} color={THEME.accentSteel} strokeWidth={2.4} />
                <Text style={styles.modalTitle}>{t('tuningGuideTitle')}</Text>
              </View>
              <Text style={styles.modalSubtitle}>{t('tuningGuideSubtitle')}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtnSmall} onPress={onClose}>
              <X size={14} color={THEME.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Current Active Setup Summary Strip */}
          <View style={styles.activeSummaryBanner}>
            <Text style={styles.activeSummaryLabel}>{t('guideActiveSetupLabel')}</Text>
            <View style={styles.activeSummaryChipsRow}>
              <View style={styles.activeChip}>
                <Layers size={11} color={activeCatGuide.accentColor} />
                <Text style={styles.activeChipText}>
                  {t('carCategory')}:{' '}
                  <Text style={{ color: activeCatGuide.accentColor, fontWeight: '900' }}>
                    {activeCatGuide.title}
                  </Text>
                </Text>
              </View>
              <View style={styles.activeChip}>
                <Sliders size={11} color={THEME.accentAmber} />
                <Text style={styles.activeChipText}>
                  {t('guideTabBias')}:{' '}
                  <Text
                    style={{
                      color:
                        currentBias < 0
                          ? THEME.accentSteel
                          : currentBias > 0
                          ? THEME.accentBrand
                          : THEME.accentSuccess,
                      fontWeight: '900',
                    }}
                  >
                    {currentBias === 0
                      ? '0 (Neutral)'
                      : currentBias > 0
                      ? `+${currentBias} (Agile)`
                      : `${currentBias} (Stable)`}
                  </Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Section Filter Tabs */}
          <View style={styles.tabRow}>
            {(
              [
                { key: 'all', label: t('guideTabAll') },
                { key: 'category', label: t('guideTabCategory') },
                { key: 'bias', label: t('guideTabBias') },
              ] as { key: GuideSectionTab; label: string }[]
            ).map(tab => {
              const isSelected = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabPill, isSelected && styles.tabPillActive]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text style={[styles.tabPillText, isSelected && styles.tabPillTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Scrollable Guide Body */}
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {showCategorySection && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Layers size={15} color={THEME.accentBrand} strokeWidth={2.3} />
                  <Text style={styles.sectionTitle}>{t('guideCategorySectionTitle')}</Text>
                </View>
                <Text style={styles.sectionIntro}>{t('guideCategoryIntro')}</Text>

                <View style={styles.cardsList}>
                  {CATEGORY_GUIDES.map(cat => {
                    const isCurrent = inputs.category === cat.key;
                    return (
                      <View
                        key={cat.key}
                        style={[
                          styles.guideCard,
                          isCurrent && {
                            borderColor: cat.accentColor,
                            backgroundColor: THEME.bgSubtle,
                          },
                        ]}
                      >
                        <View style={styles.cardTopRow}>
                          <View style={styles.cardTitleGroup}>
                            <Text style={styles.cardTitle}>{cat.title}</Text>
                            <View
                              style={[
                                styles.tagBadge,
                                {
                                  backgroundColor: `${cat.accentColor}22`,
                                  borderColor: `${cat.accentColor}66`,
                                },
                              ]}
                            >
                              <Text style={[styles.tagBadgeText, { color: cat.accentColor }]}>
                                {cat.tag}
                              </Text>
                            </View>
                          </View>

                          {isCurrent ? (
                            <View style={styles.currentBadge}>
                              <Check size={10} color={THEME.accentSuccess} strokeWidth={3} />
                              <Text style={styles.currentBadgeText}>ACTIVE</Text>
                            </View>
                          ) : onSelectCategory ? (
                            <TouchableOpacity
                              style={styles.selectQuickBtn}
                              onPress={() => onSelectCategory(cat.key)}
                            >
                              <Text style={styles.selectQuickBtnText}>Select</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>

                        <Text style={styles.cardSummary}>{cat.summary}</Text>

                        <View style={styles.infoBlock}>
                          <Text style={styles.infoLabel}>{t('guideBestFor')}</Text>
                          <Text style={styles.infoText}>{cat.bestFor}</Text>
                        </View>

                        <View style={styles.infoBlock}>
                          <Text style={[styles.infoLabel, { color: THEME.accentAmber }]}>
                            {t('guideEngineEffect')}
                          </Text>
                          {cat.adjustments.map((adj, idx) => (
                            <View key={idx} style={styles.bulletRow}>
                              <Text style={[styles.bulletDot, { color: cat.accentColor }]}>•</Text>
                              <Text style={styles.bulletText}>{adj}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {showCategorySection && showBiasSection && <View style={styles.sectionDivider} />}

            {showBiasSection && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Sliders size={15} color={THEME.accentAmber} strokeWidth={2.3} />
                  <Text style={styles.sectionTitle}>{t('guideBiasSectionTitle')}</Text>
                </View>
                <Text style={styles.sectionIntro}>{t('guideBiasIntro')}</Text>

                {/* Exact Per-Step Physics Box */}
                <View style={styles.mechanicsBox}>
                  <Text style={styles.mechanicsTitle}>{t('guideBiasMechanicsTitle')}</Text>
                  <View style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: THEME.accentBrand }]}>•</Text>
                    <Text style={styles.bulletText}>
                      <Text style={styles.boldText}>Anti-Roll Bars (ARBs): </Text>
                      Each +1 step towards Agile softens Front ARB by -1.6 and stiffens Rear ARB by
                      +1.8 (shifting lateral weight transfer to the rear so the front tires bite and
                      rotate). Each -1 step towards Stable does the reverse (+1.6 Front / -1.8 Rear)
                      to plant the rear end.
                    </Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: THEME.accentSteel }]}>•</Text>
                    <Text style={styles.bulletText}>
                      <Text style={styles.boldText}>Alignment (Camber & Toe): </Text>
                      Agile (+1 to +5) adds -0.05° Front Camber and -0.02° Front Toe-Out per step
                      for sharper turn-in. Stable (-1 to -5) adjusts Rear Camber (+0.04° per step
                      towards vertical) for stronger straight-line exit traction.
                    </Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: THEME.accentSuccess }]}>•</Text>
                    <Text style={styles.bulletText}>
                      <Text style={styles.boldText}>Rebound Damping: </Text>
                      Agile (+1 to +5) adds +0.20 Rear Rebound per step to help the rear pivot on
                      corner entry. Stable (-1 to -5) adds +0.25 Front Rebound per step to calm
                      twitchy steering.
                    </Text>
                  </View>
                </View>

                <Text style={styles.subSectionHeading}>{t('guideBiasRangeTitle')}</Text>

                <View style={styles.cardsList}>
                  {BIAS_RANGE_GUIDES.map(item => {
                    const isCurrentRange = item.matches(currentBias);
                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.guideCard,
                          isCurrentRange && {
                            borderColor: item.accentColor,
                            backgroundColor: THEME.bgSubtle,
                          },
                        ]}
                      >
                        <View style={styles.cardTopRow}>
                          <View style={styles.cardTitleGroup}>
                            <View
                              style={[
                                styles.rangePill,
                                {
                                  backgroundColor: `${item.accentColor}24`,
                                  borderColor: item.accentColor,
                                },
                              ]}
                            >
                              <Text style={[styles.rangePillText, { color: item.accentColor }]}>
                                {item.rangeLabel}
                              </Text>
                            </View>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                          </View>

                          {isCurrentRange ? (
                            <View style={styles.currentBadge}>
                              <Check size={10} color={THEME.accentSuccess} strokeWidth={3} />
                              <Text style={styles.currentBadgeText}>CURRENT ({currentBias > 0 ? `+${currentBias}` : currentBias})</Text>
                            </View>
                          ) : onSelectBias ? (
                            <TouchableOpacity
                              style={styles.selectQuickBtn}
                              onPress={() => onSelectBias(item.sampleValue)}
                            >
                              <Text style={styles.selectQuickBtnText}>
                                Set {item.sampleValue > 0 ? `+${item.sampleValue}` : item.sampleValue}
                              </Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>

                        <View style={styles.infoBlock}>
                          <Text style={styles.infoLabel}>{t('guideBestFor')}</Text>
                          <Text style={styles.infoText}>{item.whenToUse}</Text>
                        </View>

                        <View style={styles.infoBlock}>
                          <Text style={[styles.infoLabel, { color: item.accentColor }]}>
                            {t('guideWhatItDoes')}
                          </Text>
                          <Text style={styles.infoText}>{item.behaviorEffect}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>{t('close')}</Text>
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
    backgroundColor: 'rgba(10, 12, 16, 0.84)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalContent: {
    width: '100%',
    maxWidth: 620,
    height: '90%',
    maxHeight: 740,
    minHeight: 440,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    borderRadius: 28,
    padding: 18,
    paddingTop: 12,
    flexDirection: 'column',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: THEME.borderStrong,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerTitleBlock: {
    flex: 1,
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.textPrimary,
    letterSpacing: 0.4,
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  closeBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSummaryBanner: {
    backgroundColor: THEME.bgCanvas,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  activeSummaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.textMuted,
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  activeSummaryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeChipText: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: THEME.accentBrand,
    borderColor: THEME.accentBrand,
  },
  tabPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: THEME.textSecondary,
  },
  tabPillTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  bodyScroll: {
    flex: 1,
  },
  bodyScrollContent: {
    paddingBottom: 12,
  },
  sectionBlock: {
    marginBottom: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: THEME.textPrimary,
    letterSpacing: 0.3,
  },
  sectionIntro: {
    fontSize: 12,
    color: THEME.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: THEME.borderStrong,
    marginVertical: 16,
  },
  subSectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
  },
  cardsList: {
    gap: 10,
  },
  guideCard: {
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 18,
    padding: 13,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.textPrimary,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rangePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  rangePillText: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.accentSuccessDim,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.45)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: THEME.accentSuccess,
    letterSpacing: 0.4,
  },
  selectQuickBtn: {
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  selectQuickBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  cardSummary: {
    fontSize: 12,
    color: THEME.textPrimary,
    lineHeight: 17.5,
    marginBottom: 8,
    fontWeight: '600',
  },
  infoBlock: {
    marginTop: 6,
  },
  infoLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: THEME.accentSteel,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 11.5,
    color: THEME.textSecondary,
    lineHeight: 17,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 3,
  },
  bulletDot: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
  },
  bulletText: {
    flex: 1,
    fontSize: 11.5,
    color: THEME.textSecondary,
    lineHeight: 17,
  },
  boldText: {
    color: THEME.textPrimary,
    fontWeight: '800',
  },
  mechanicsBox: {
    backgroundColor: THEME.bgCanvas,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    borderRadius: 16,
    padding: 12,
  },
  mechanicsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.accentAmber,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  doneBtn: {
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: THEME.accentBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
