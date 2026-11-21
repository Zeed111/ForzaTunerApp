import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { THEME } from '../../theme';

interface CollapsibleCardProps {
  title: string;
  icon?: React.ReactNode;
  collapsed: boolean;
  onToggle: () => void;
  collapsedSummary?: string;
  children: React.ReactNode;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  icon,
  collapsed,
  onToggle,
  collapsedSummary,
  children,
}) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 520;

  return (
    <View style={[styles.card, isCompact && styles.cardCompact]}>
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <View style={styles.titleRow}>
            {icon}
            <Text style={styles.cardTitle}>{title}</Text>
          </View>
          {collapsed && collapsedSummary ? (
            <Text style={styles.collapsedSummary}>{collapsedSummary}</Text>
          ) : null}
        </View>
        <View style={styles.chevronPill}>
          {collapsed ? (
            <ChevronDown size={16} color={THEME.textMuted} />
          ) : (
            <ChevronUp size={16} color={THEME.accentAmber} />
          )}
        </View>
      </TouchableOpacity>

      {!collapsed && <View style={styles.cardBody}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  cardCompact: {
    padding: 14,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  chevronPill: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.accentAmber,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  collapsedSummary: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 3,
    fontWeight: '600',
  },
  cardBody: {
    marginTop: 12,
  },
});
