import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewProps, TouchableOpacityProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
}

const Card = ({ children, style, onPress, ...props }: CardProps) => {
  if (onPress) {
    return (
      <TouchableOpacity 
        style={[styles.card, style]} 
        onPress={onPress}
        {...props as TouchableOpacityProps}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export { Card };