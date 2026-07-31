import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  onPress?: () => void;
}

export const MetricCard = ({ title, value, icon: Icon, color, onPress }: MetricCardProps) => {
  return (
    <TouchableOpacity 
      style={styles.cardContainer} 
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 1)', 'rgba(248, 250, 252, 1)']}
        style={[styles.card, { borderTopColor: color }]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <Icon size={16} color={color} />
          </View>
        </View>
        <Text style={styles.value}>{value}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '48%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderTopWidth: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0', // Slate 200
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 13,
    color: '#64748b', // Slate 500
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingRight: 8,
    lineHeight: 18,
  },
  value: {
    fontSize: 24,
    color: '#0f172a', // Slate 900
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
