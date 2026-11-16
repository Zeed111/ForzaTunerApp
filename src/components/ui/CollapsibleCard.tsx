import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
  return (
    <View style={styles.card}>
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
        {collapsed ? (
          <ChevronDown size={16} color={THEME.textMuted} />
        ) : (
          <ChevronUp size={16} color={THEME.accentAmber} />
        )}
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
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: THEME.accentAmber,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  collapsedSummary: {
    fontSize: 10,
    color: THEME.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  cardBody: {
    marginTop: 10,
  },
});
