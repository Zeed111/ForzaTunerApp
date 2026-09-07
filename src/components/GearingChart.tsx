import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Line, Text as SvgText, Rect } from 'react-native-svg';

interface GearingChartProps {
  gearRatios: number[];
  finalDrive: number;
  redlineRpm: number;
  driveCircumferenceM: number;
  targetSpeed: number;
  units: 'metric' | 'imperial';
}

const GEAR_COLORS = ['#00e5ff', '#39d353', '#e3b341', '#f0883e', '#ff007a', '#79c0ff', '#d2a8ff', '#56d364', '#f778ba', '#7ee787'];

export const GearingChart: React.FC<GearingChartProps> = ({
  gearRatios,
  finalDrive,
  redlineRpm,
  driveCircumferenceM,
  targetSpeed,
  units,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.max(windowWidth - 48, 280);
  const height = 200;

  const padLeft = 45;
  const padBottom = 25;
  const padTop = 15;
  const padRight = 15;

  const graphW = width - padLeft - padRight;
  const graphH = height - padTop - padBottom;

  const safeTargetSpeed = targetSpeed > 0 && !isNaN(targetSpeed) ? targetSpeed : 260;
  const safeRedline = redlineRpm > 0 && !isNaN(redlineRpm) ? redlineRpm : 7500;
  const safeFD = finalDrive > 0 && !isNaN(finalDrive) ? finalDrive : 3.5;
  const safeCirc = driveCircumferenceM > 0 && !isNaN(driveCircumferenceM) ? driveCircumferenceM : 2.0;

  const maxDisplaySpeed = safeTargetSpeed * 1.15;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Background */}
        <Rect width={width} height={height} fill="#0b0e17" rx={8} />

        {/* Y Grid Lines (RPM) */}
        {[0, 0.33, 0.66, 1].map((p, idx) => {
          const y = padTop + graphH - p * graphH;
          const rpmVal = Math.round(p * safeRedline);
          return (
            <React.Fragment key={`rpm-${idx}`}>
              <Line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#1b2333" strokeWidth="1" />
              <SvgText x={padLeft - 6} y={y + 4} fill="#63738a" fontSize="9" textAnchor="end">
                {rpmVal >= 1000 ? `${(rpmVal / 1000).toFixed(0)}k` : rpmVal}
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
              <Line x1={x} y1={padTop} x2={x} y2={padTop + graphH} stroke="#1b2333" strokeWidth="1" />
              <SvgText x={x} y={height - 8} fill="#63738a" fontSize="9" textAnchor="middle">
                {spd}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Gear Lines */}
        {gearRatios.map((ratio, idx) => {
          if (!ratio || isNaN(ratio) || ratio <= 0) return null;
          const totalRatio = ratio * safeFD;
          if (totalRatio <= 0) return null;

          const maxSpeedKmh = ((safeRedline / totalRatio) * safeCirc * 60) / 1000;
          const rawSpeed = units === 'imperial' ? maxSpeedKmh / 1.60934 : maxSpeedKmh;
          const maxSpeedDisplay = isNaN(rawSpeed) || rawSpeed <= 0 ? 1 : rawSpeed;

          const startX = padLeft;
          const startY = padTop + graphH;
          const endX = Math.min(
            padLeft + (maxSpeedDisplay / Math.max(1, maxDisplaySpeed)) * graphW,
            width - padRight
          );
          const endY = padTop;

          const color = GEAR_COLORS[idx % GEAR_COLORS.length];

          return (
            <React.Fragment key={`gear-line-${idx}`}>
              <Line x1={startX} y1={startY} x2={endX} y2={endY} stroke={color} strokeWidth="2.5" />
              <SvgText x={endX} y={endY - 4} fill={color} fontSize="9" fontWeight="bold" textAnchor="middle">
                G{idx + 1}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#232b3b',
  },
});