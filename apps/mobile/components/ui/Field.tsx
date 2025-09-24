import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, required, children }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  required: {
    color: '#ef4444',
  },
});
