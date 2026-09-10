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
  estimatedTopSpeedKm?: number;
}

const GEAR_COLORS = ['#ff1744', '#00f0ff', '#ffd000', '#00ff9d', '#d946ef', '#ff7b00', '#38bdf8', '#a78bfa', '#f43f5e', '#4ade80'];

export const GearingChart: React.FC<GearingChartProps> = ({
  gearRatios,
  finalDrive,
  redlineRpm,
  driveCircumferenceM,
  targetSpeed,
  units,
  estimatedTopSpeedKm,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = React.useState<number>(0);
  const width = containerWidth > 0 ? containerWidth : Math.min(Math.max(windowWidth - 48, 280), 540);
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
        <Rect width={width} height={height} fill="#070a10" rx={8} />

        {/* Y Grid Lines (RPM) */}
        {[0, 0.33, 0.66, 1].map((p, idx) => {
          const y = padTop + graphH - p * graphH;
          const rpmVal = Math.round(p * safeRedline);
          return (
            <React.Fragment key={`rpm-${idx}`}>
              <Line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#161f30" strokeWidth="1" />
              <SvgText x={padLeft - 6} y={y + 4} fill="#8a99ad" fontSize="9" textAnchor="end">
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
              <Line x1={x} y1={padTop} x2={x} y2={padTop + graphH} stroke="#161f30" strokeWidth="1" />
              <SvgText x={x} y={height - 8} fill="#8a99ad" fontSize="9" textAnchor="middle">
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
                stroke="#00f0ff"
                strokeWidth="1.5"
                strokeDasharray="4, 3"
              />
              <SvgText
                x={Math.min(aeroX, width - padRight - 28)}
                y={padTop + 10}
                fill="#00f0ff"
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
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1c2438',
  },
});