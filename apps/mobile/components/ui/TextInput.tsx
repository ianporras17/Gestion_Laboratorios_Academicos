import React from 'react';
import { TextInput as RNTextInput, StyleSheet, TextInputProps } from 'react-native';

interface CustomTextInputProps extends TextInputProps {
  error?: boolean;
}

export const TextInput: React.FC<CustomTextInputProps> = ({ 
  error = false, 
  style, 
  ...props 
}) => {
  return (
    <RNTextInput
      style={[
        styles.input,
        error && styles.error,
        style
      ]}
      placeholderTextColor="#9ca3af"
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  error: {
    borderColor: '#ef4444',
  },
});
