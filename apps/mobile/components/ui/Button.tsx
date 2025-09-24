import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  variant?: 'solid' | 'outline' | 'ghost';
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'outline', 
  onPress,
  disabled = false,
  children, 
  style 
}) => {
  const buttonStyle = [
    styles.base,
    variantStyles[variant],
    disabled && styles.disabled,
    style
  ];

  const textStyle = [
    styles.text,
    variantTextStyles[variant],
    disabled && styles.disabledText
  ];

  return (
    <TouchableOpacity 
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={textStyle}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solid: {
    backgroundColor: '#2563eb',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontWeight: '600',
    fontSize: 16,
  },
  solidText: {
    color: '#ffffff',
  },
  outlineText: {
    color: '#374151',
  },
  ghostText: {
    color: '#374151',
  },
  disabledText: {
    color: '#9ca3af',
  },
});

const variantStyles = {
  solid: styles.solid,
  outline: styles.outline,
  ghost: styles.ghost,
};

const variantTextStyles = {
  solid: styles.solidText,
  outline: styles.outlineText,
  ghost: styles.ghostText,
};
