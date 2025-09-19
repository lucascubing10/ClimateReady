import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  icon: React.ReactNode;
  label: string;
}

const Badge = ({ icon, label }: BadgeProps) => {
  return (
    <View style={styles.badge}>
      {typeof icon === 'string' || typeof icon === 'number' ? (
        <Text style={styles.icon}>{icon}</Text>
      ) : (
        icon
      )}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5ba24f',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 18,
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
});

export { Badge };