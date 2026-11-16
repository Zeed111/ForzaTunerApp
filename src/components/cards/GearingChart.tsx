import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import Svg, { Line, Text as SvgText, Rect, Circle } from 'react-native-svg';
import { EngineType } from '../../types/tuning';
import { THEME, GEAR_CHART_COLORS } from '../../theme';

interface GearingChartProps {
  gearRatios: number[];
  finalDrive: number;
  redlineRpm: number;
  driveCircumferenceM: number;
  targetSpeed: number;
  units: 'metric' | 'imperial';
  estimatedTopSpeedKm?: number;
  engineType?: EngineType;
  selectedGear?: number | null;
  onSelectGear?: (gearIdx: number | null) => void;
}

function getPowerbandStartRatio(engineType?: EngineType): number {
  switch (engineType) {
    case 'highrev':
      return 0.72;
    case 'torque':
      return 0.50;
    case 'ev':
      return 0.35;
    case 'balanced':
    default:
      return 0.62;
  }
}

export const GearingChart: React.FC<GearingChartProps> = ({
  gearRatios,
  finalDrive,
  redlineRpm,
  driveCircumferenceM,
  targetSpeed,
  units,
  estimatedTopSpeedKm,
  engineType = 'balanced',
  selectedGear = null,
  onSelectGear,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = React.useState<number>(0);
  const width = containerWidth > 0 ? containerWidth : Math.min(Math.max(windowWidth - 48, 280), 540);
  const height = 220;

  const padLeft = 44;
  const padBottom = 32;
  const padTop = 22;
  const padRight = 16;

  const graphW = width - padLeft - padRight;
  const graphH = height - padTop - padBottom;

  const safeTargetSpeed = targetSpeed > 0 && !isNaN(targetSpeed) ? targetSpeed : 260;
  const safeRedline = redlineRpm > 0 && !isNaN(redlineRpm) ? redlineRpm : 7500;
  const safeFD = finalDrive > 0 && !isNaN(finalDrive) ? finalDrive : 3.5;
  const safeCirc = driveCircumferenceM > 0 && !isNaN(driveCircumferenceM) ? driveCircumferenceM : 2.0;

  // Compute each gear's theoretical max speed in active display units
  const gearMaxSpeedsDisplay = gearRatios.map(ratio => {
    if (!ratio || isNaN(ratio) || ratio <= 0) return 0;
    const totalRatio = ratio * safeFD;
    const maxSpeedKmh = ((safeRedline / totalRatio) * safeCirc * 60) / 1000;
    const rawSpeed = units === 'imperial' ? maxSpeedKmh / 1.60934 : maxSpeedKmh;
    return isNaN(rawSpeed) || rawSpeed <= 0 ? 1 : rawSpeed;
  });

  const highestGearSpeedDisplay = gearMaxSpeedsDisplay.reduce((max, s) => (s > max ? s : max), 0);
  const maxDisplaySpeed = Math.max(safeTargetSpeed * 1.12, highestGearSpeedDisplay * 1.06, 60);

  // Powerband shading metrics
  const pbStartRatio = getPowerbandStartRatio(engineType);
  const powerbandY = padTop + graphH * (1 - pbStartRatio);
  const powerbandH = graphH * pbStartRatio;

  const speedUnitLabel = units === 'imperial' ? 'mph' : 'km/h';

  const gearPoints = gearRatios.map((ratio, idx) => {
    if (!ratio || isNaN(ratio) || ratio <= 0) return null;
    const maxSpeedDisplay = gearMaxSpeedsDisplay[idx];
    const startX = padLeft;
    const startY = padTop + graphH;
    const rawEndX = padLeft + (maxSpeedDisplay / Math.max(1, maxDisplaySpeed)) * graphW;
    const rightBound = width - padRight;

    let endX = rawEndX;
    let endY = padTop;
    if (rawEndX > rightBound && rawEndX > startX) {
      const frac = (rightBound - startX) / (rawEndX - startX);
      endX = rightBound;
      endY = startY - frac * graphH;
    }

    // Shift drop point from previous gear
    let prevEndX = startX;
    let dropY = startY;
    if (idx > 0 && gearRatios[idx - 1] > 0) {
      const prevMaxSpeed = gearMaxSpeedsDisplay[idx - 1];
      const rawPrevX = padLeft + (prevMaxSpeed / Math.max(1, maxDisplaySpeed)) * graphW;
      prevEndX = Math.min(rawPrevX, endX);
      const dropRatio = Math.min(1, Math.max(0, ratio / gearRatios[idx - 1]));
      dropY = padTop + graphH * (1 - dropRatio);
    }

    return {
      idx,
      ratio,
      maxSpeedDisplay,
      startX,
      startY,
      endX,
      endY,
      prevEndX,
      dropY,
      color: GEAR_CHART_COLORS[idx % GEAR_CHART_COLORS.length],
    };
  });

  return (
    <View
      style={styles.container}
      onLayout={e => {
        const w = Math.floor(e.nativeEvent.layout.width);
        if (w > 0 && Math.abs(w - containerWidth) > 2) {
          setContainerWidth(w);
        }
      }}
    >
      <Svg width={width} height={height}>
        {/* Background */}
        <Rect width={width} height={height} fill={THEME.bgCanvas} rx={16} />

        {/* Powerband Optimal RPM Shaded Zone */}
        <Rect
          x={padLeft}
          y={padTop}
          width={graphW}
          height={powerbandH}
          fill="rgba(245, 158, 11, 0.08)"
        />
        <Line
          x1={padLeft}
          y1={powerbandY}
          x2={width - padRight}
          y2={powerbandY}
          stroke="rgba(245, 158, 11, 0.4)"
          strokeWidth="1"
          strokeDasharray="3, 3"
        />
        <SvgText
          x={width - padRight - 4}
          y={powerbandY - 4}
          fill="rgba(245, 158, 11, 0.78)"
          fontSize="7.5"
          fontWeight="bold"
          textAnchor="end"
        >
          POWERBAND
        </SvgText>

        {/* Y Axis Unit Label */}
        <SvgText x={padLeft - 6} y={padTop - 8} fill={THEME.textMuted} fontSize="8" fontWeight="bold" textAnchor="end">
          RPM
        </SvgText>

        {/* Y Grid Lines (RPM) */}
        {[0, 0.33, 0.66, 1].map((p, idx) => {
          const y = padTop + graphH - p * graphH;
          const rpmVal = Math.round(p * safeRedline);
          return (
            <React.Fragment key={`rpm-${idx}`}>
              <Line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#1F232B" strokeWidth="1" />
              <SvgText x={padLeft - 6} y={y + 3} fill={THEME.textSecondary} fontSize="9" textAnchor="end">
                {rpmVal >= 1000 ? `${(rpmVal / 1000).toFixed(1).replace('.0', '')}k` : rpmVal}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* X Grid Lines (Speed) */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
          const x = padLeft + p * graphW;
          const spd = Math.round(p * maxDisplaySpeed);
          return (
            <React.Fragment key={`spd-${idx}`}>
              <Line x1={x} y1={padTop} x2={x} y2={padTop + graphH} stroke="#1F232B" strokeWidth="1" />
              <SvgText x={x} y={padTop + graphH + 12} fill={THEME.textSecondary} fontSize="9" textAnchor="middle">
                {spd}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* X Axis Unit Label */}
        <SvgText
          x={width - padRight}
          y={height - 4}
          fill={THEME.textMuted}
          fontSize="8"
          fontWeight="bold"
          textAnchor="end"
        >
          {`SPEED (${speedUnitLabel})`}
        </SvgText>

        {/* Full Ratio Reference Lines (Muted) */}
        {gearPoints.map(pt => {
          if (!pt) return null;
          const isSelected = selectedGear === pt.idx;
          const baseOpacity = selectedGear == null ? 0.28 : isSelected ? 0.5 : 0.12;
          return (
            <Line
              key={`ref-${pt.idx}`}
              x1={pt.startX}
              y1={pt.startY}
              x2={pt.endX}
              y2={pt.endY}
              stroke={pt.color}
              strokeWidth={isSelected ? '2' : '1.25'}
              strokeOpacity={baseOpacity}
            />
          );
        })}

        {/* Shift-Drop Vertical Connectors & Active Acceleration Segments */}
        {gearPoints.map(pt => {
          if (!pt) return null;
          const isSelected = selectedGear === pt.idx;
          const isDimmed = selectedGear != null && !isSelected;
          const segStartX = pt.idx === 0 ? pt.startX : pt.prevEndX;
          const segStartY = pt.idx === 0 ? pt.startY : pt.dropY;
          const handleSvgPress =
            Platform.OS !== 'web' && onSelectGear
              ? () => onSelectGear(isSelected ? null : pt.idx)
              : undefined;

          return (
            <React.Fragment key={`gear-active-${pt.idx}`}>
              {/* Vertical upshift RPM drop line */}
              {pt.idx > 0 && (
                <Line
                  x1={pt.prevEndX}
                  y1={padTop}
                  x2={pt.prevEndX}
                  y2={pt.dropY}
                  stroke={THEME.textSecondary}
                  strokeWidth="1.1"
                  strokeDasharray="2, 2"
                  strokeOpacity={isDimmed ? 0.2 : 0.7}
                />
              )}

              {/* Active full-throttle acceleration slope segment */}
              <Line
                x1={segStartX}
                y1={segStartY}
                x2={pt.endX}
                y2={pt.endY}
                stroke={pt.color}
                strokeWidth={isSelected ? '3.2' : '2.6'}
                strokeOpacity={isDimmed ? 0.22 : 1}
                onPress={handleSvgPress}
              />

              {/* Redline endpoint marker */}
              <Circle
                cx={pt.endX}
                cy={pt.endY}
                r={isSelected ? 3.8 : 2.2}
                fill={pt.color}
                fillOpacity={isDimmed ? 0.25 : 1}
              />

              {/* Gear Label */}
              <SvgText
                x={Math.min(pt.endX, width - padRight - 6)}
                y={pt.endY - 6}
                fill={pt.color}
                fillOpacity={isDimmed ? 0.35 : 1}
                fontSize={isSelected ? '10' : '8.5'}
                fontWeight="bold"
                textAnchor="middle"
                onPress={handleSvgPress}
              >
                G{pt.idx + 1}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Aerodynamic Drag Terminal Velocity Limit */}
        {estimatedTopSpeedKm && estimatedTopSpeedKm > 0 && (() => {
          const rawAeroSpeed = units === 'imperial' ? estimatedTopSpeedKm / 1.60934 : estimatedTopSpeedKm;
          const aeroX = padLeft + (rawAeroSpeed / Math.max(1, maxDisplaySpeed)) * graphW;
          if (aeroX < padLeft || aeroX > width - padRight) return null;
          return (
            <React.Fragment key="aero-limit-line">
              <Line
                x1={aeroX}
                y1={padTop}
                x2={aeroX}
                y2={padTop + graphH}
                stroke={THEME.accentSteel}
                strokeWidth="1.5"
                strokeDasharray="4, 3"
              />
              <SvgText
                x={Math.min(aeroX, width - padRight - 28)}
                y={padTop + 11}
                fill={THEME.accentSteel}
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
              >
                Aero Limit
              </SvgText>
            </React.Fragment>
          );
        })()}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
  },
});
