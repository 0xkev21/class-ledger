import { Search, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '@/src/context/TreasuryContext';
import { NativeIcon } from './NativeIcon';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  testID?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder,
  onClear,
  style,
  autoCapitalize = 'none',
  testID,
}) => {
  const { isDark, themeColor } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChangeText('');
    }
  };

  const iconColor = isDark ? '#71717a' : '#9ca3af';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#18181b' : '#ffffff',
          borderColor: isFocused
            ? themeColor.primary
            : isDark
            ? 'rgba(39, 39, 42, 0.8)'
            : 'rgba(228, 228, 231, 0.7)',
        },
        style,
      ]}
      accessibilityRole="search"
    >
      <NativeIcon
        sfSymbol="magnifyingglass"
        materialName="search"
        FallbackIcon={Search}
        size={16}
        color={iconColor}
      />
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={iconColor}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        returnKeyType="search"
        style={[
          styles.input,
          {
            color: isDark ? '#f4f4f5' : '#18181b',
          },
        ]}
      />
      {value ? (
        <Pressable
          onPress={handleClear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search input"
          style={({ pressed }) => [
            styles.clearButton,
            {
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <NativeIcon
            sfSymbol="xmark.circle.fill"
            materialName="clear"
            FallbackIcon={X}
            size={16}
            color={iconColor}
          />
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
