import { LucideIcon, Plus } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/context/TreasuryContext';
import { NativeIcon, NativeIconProps } from './NativeIcon';
import { PressableScale } from './animated/PressableScale';

export interface FloatingActionButtonProps {
  onPress: () => void;
  label: string;
  icon?: LucideIcon;
  sfSymbol?: NativeIconProps['sfSymbol'];
  materialName?: NativeIconProps['materialName'];
  style?: ViewStyle;
  testID?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  label,
  icon = Plus,
  sfSymbol = 'plus',
  materialName = 'add',
  style,
  testID,
}) => {
  const insets = useSafeAreaInsets();
  const { themeColor } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, 16) + 16,
          right: 20,
        },
        style,
      ]}
      pointerEvents="box-none"
    >
      <PressableScale
        onPress={onPress}
        testID={testID}
        style={[
          styles.button,
          {
            backgroundColor: themeColor.primary,
          },
        ]}
      >
        <NativeIcon
          sfSymbol={sfSymbol}
          materialName={materialName}
          FallbackIcon={icon}
          size={18}
          color={themeColor.onPrimary}
        />
        <Text
          style={[
            styles.label,
            {
              color: themeColor.onPrimary,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </PressableScale>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 50,
  },
  button: {
    height: 48,
    minWidth: 140,
    borderRadius: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  label: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
