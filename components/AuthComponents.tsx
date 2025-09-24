import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ViewStyle,
  TextStyle,
  ColorValue,
  KeyboardTypeOptions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  required?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  containerStyle,
  leftIcon,
  required = false
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>
      <View style={[styles.textInputContainer, error ? styles.inputError : null]}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          placeholderTextColor="#9ca3af"
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={24}
              color="#9ca3af"
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
};

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle
}) => {
  const getButtonStyle = () => {
    if (disabled) return styles.disabledButton;
    
    switch (variant) {
      case 'primary':
        return styles.primaryButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      default:
        return styles.primaryButton;
    }
  };
  
  const getTextStyle = () => {
    if (disabled) return styles.disabledButtonText;
    
    switch (variant) {
      case 'primary':
        return styles.primaryButtonText;
      case 'secondary':
        return styles.secondaryButtonText;
      case 'outline':
        return styles.outlineButtonText;
      default:
        return styles.primaryButtonText;
    }
  };
  
  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <Text style={[getTextStyle(), textStyle]}>Loading...</Text>
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export const LinkText: React.FC<{
  text: string;
  linkText: string;
  onPress: () => void;
  linkStyle?: TextStyle;
  textStyle?: TextStyle;
}> = ({ text, linkText, onPress, linkStyle, textStyle }) => {
  return (
    <View style={styles.linkContainer}>
      <Text style={[styles.linkText, textStyle]}>{text} </Text>
      <TouchableOpacity onPress={onPress}>
        <Text style={[styles.link, linkStyle]}>{linkText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  requiredAsterisk: {
    color: '#ef4444',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  leftIconContainer: {
    marginRight: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  primaryButton: {
    backgroundColor: '#0284c7',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
  },
  secondaryButtonText: {
    color: '#1f2937',
    fontWeight: '600',
    fontSize: 16,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  outlineButtonText: {
    color: '#0284c7',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
  },
  disabledButtonText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 16,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  linkText: {
    color: '#374151',
    fontSize: 14,
  },
  link: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '600',
  },
});