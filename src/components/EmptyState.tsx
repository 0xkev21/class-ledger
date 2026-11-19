import { LucideIcon, Plus } from 'lucide-react-native';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/src/context/TreasuryContext';
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
  const { themeColor, isDark } = useAppTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#18181b' : '#ffffff',
          borderColor: isDark ? 'rgba(39, 39, 42, 0.8)' : 'rgba(228, 228, 231, 0.7)',
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
          size={32}
          color={themeColor.primary}
        />
      </View>

      <Text style={styles.title} className="text-zinc-900 dark:text-zinc-50">
        {title}
      </Text>

      <Text style={styles.description} className="text-zinc-500 dark:text-zinc-400">
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
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 1,
    marginTop: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderCurve: 'continuous',
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '700',
  },
});
