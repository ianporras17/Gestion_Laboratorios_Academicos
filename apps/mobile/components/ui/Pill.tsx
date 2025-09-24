import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PillProps {
  children: React.ReactNode;
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'gray';
}

export const Pill: React.FC<PillProps> = ({ children, color = 'gray' }) => {
  const colorStyles = {
    green: { backgroundColor: '#dcfce7', color: '#166534' },
    red: { backgroundColor: '#fecaca', color: '#991b1b' },
    yellow: { backgroundColor: '#fef3c7', color: '#92400e' },
    blue: { backgroundColor: '#dbeafe', color: '#1e40af' },
    gray: { backgroundColor: '#f3f4f6', color: '#374151' },
  };

  const style = colorStyles[color];

  return (
    <View style={[styles.pill, { backgroundColor: style.backgroundColor }]}>
      <Text style={[styles.text, { color: style.color }]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
