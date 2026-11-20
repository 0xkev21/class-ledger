import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';

export type StatusPillVariant = 'paid' | 'unpaid' | 'brand' | 'neutral';

export interface StatusPillProps {
  variant?: StatusPillVariant;
  label: string;
  mono?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Compact status pill matching the landing page .cl-pill tokens.
 */
export const StatusPill: React.FC<StatusPillProps> = ({
  variant = 'neutral',
  label,
  mono = false,
  style,
  textStyle,
}) => {
  const { palette, themeColor } = useAppTheme();

  const colorsByVariant = {
    paid: { bg: palette.paidBg, text: palette.paidText },
    unpaid: { bg: palette.unpaidBg, text: palette.unpaidText },
    brand: { bg: themeColor.surface, text: themeColor.text },
    neutral: { bg: palette.surface, text: palette.muted },
  } as const;

  const { bg, text } = colorsByVariant[variant];

  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            color: text,
            fontFamily: mono ? fonts.monoMedium : fonts.medium,
            fontVariant: ['tabular-nums'],
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 9999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
  },
});
