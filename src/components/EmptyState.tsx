import { LucideIcon, Plus } from 'lucide-react-native';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';
import { NativeIcon, NativeIconProps } from './NativeIcon';
import { PressableScale } from './animated/PressableScale';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  sfSymbol: NativeIconProps['sfSymbol'];
  materialName: NativeIconProps['materialName'];
  actionLabel?: string;
  actionIcon?: LucideIcon;
  actionSfSymbol?: NativeIconProps['sfSymbol'];
  actionMaterialName?: NativeIconProps['materialName'];
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  sfSymbol,
  materialName,
  actionLabel,
  actionIcon = Plus,
  actionSfSymbol = 'plus',
  actionMaterialName = 'add',
  onActionPress,
  style,
  testID,
}) => {
  const { palette, themeColor } = useAppTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: palette.card,
          borderColor: palette.line,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: themeColor.surface,
          },
        ]}
      >
        <NativeIcon
          sfSymbol={sfSymbol}
          materialName={materialName}
          FallbackIcon={icon}
          size={28}
          color={themeColor.primary}
        />
      </View>

      <Text
        style={[
          styles.title,
          {
            color: palette.ink,
            fontFamily: fonts.semibold,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.description,
          {
            color: palette.muted,
            fontFamily: fonts.regular,
          },
        ]}
      >
        {description}
      </Text>

      {actionLabel && onActionPress ? (
        <PressableScale
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={[
            styles.actionButton,
            {
              backgroundColor: themeColor.primary,
            },
          ]}
        >
          <NativeIcon
            sfSymbol={actionSfSymbol}
            materialName={actionMaterialName}
            FallbackIcon={actionIcon}
            size={16}
            color={themeColor.onPrimary}
          />
          <Text
            style={[
              styles.actionButtonText,
              {
                color: themeColor.onPrimary,
                fontFamily: fonts.semibold,
              },
            ]}
          >
            {actionLabel}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    marginTop: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 360,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 13,
  },
});
