import React from 'react';
import type { ColorValue } from 'react-native';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface NativeIconProps {
  sfSymbol: SymbolViewProps['name'];
  materialName: keyof typeof MaterialIcons.glyphMap;
  FallbackIcon: React.ComponentType<{ size: number; color: any }>;
  size?: number;
  color?: ColorValue | string;
}

export function NativeIcon({
  sfSymbol,
  materialName,
  FallbackIcon,
  size = 20,
  color = '#71717a',
}: NativeIconProps) {
  if (process.env.EXPO_OS === 'ios') {
    return (
      <SymbolView
        name={sfSymbol}
        tintColor={color as any}
        size={size}
        style={{ width: size, height: size }}
      />
    );
  }

  if (process.env.EXPO_OS === 'android') {
    return <MaterialIcons name={materialName} size={size} color={color as any} />;
  }

  return <FallbackIcon size={size} color={color as any} />;
}
