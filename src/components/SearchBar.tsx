import { Search, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';
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
  const { palette, themeColor } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChangeText('');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.card,
          borderColor: isFocused ? themeColor.primary : palette.line,
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
        color={palette.muted}
      />
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        returnKeyType="search"
        style={[
          styles.input,
          {
            color: palette.ink,
            fontFamily: fonts.regular,
            ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
          },
        ]}
      />
      {value ? (
        <TouchableOpacity
          onPress={handleClear}
          activeOpacity={0.6}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search input"
          style={styles.clearButton}
        >
          <NativeIcon
            sfSymbol="xmark.circle.fill"
            materialName="clear"
            FallbackIcon={X}
            size={16}
            color={palette.muted}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
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
