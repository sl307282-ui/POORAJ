import { useAppTheme } from '../hooks/useAppTheme';
import { AppText } from '../components/AppText';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useThemeStore } from '../store/themeStore';
import { Colors } from '../theme/colors';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  onPress?: () => void;
}

export const MetricCard = ({ title, value, icon: Icon, color, onPress }: MetricCardProps) => {
  const { mode } = useThemeStore();
  const theme = useAppTheme();

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { borderTopColor: color, backgroundColor: theme.surface, borderColor: theme.border }
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.cardHeader}>
        <AppText style={[styles.title, { color: theme.textSecondary }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{title}</AppText>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Icon size={16} color={color} />
        </View>
      </View>
      <AppText style={[styles.value, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</AppText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    borderTopWidth: 4,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    paddingRight: 4,
    lineHeight: 16,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
