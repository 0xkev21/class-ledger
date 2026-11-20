import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { surfaces } from '@/src/theme';
import { Haptics } from '@/src/utils/haptics';
import { project, rubberband } from '@/src/utils/motion';

export interface DragDismissSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number;
  containerStyle?: StyleProp<ViewStyle>;
  sheetClassName?: string;
  isDark?: boolean;
  backgroundColor?: string;
}

const triggerLightHaptic = () => {
  Haptics.impactLightAsync();
};

export const DragDismissSheet: React.FC<DragDismissSheetProps> = ({
  visible,
  onClose,
  children,
  maxHeight,
  containerStyle,
  sheetClassName = '',
  isDark: propIsDark,
  backgroundColor: propBg,
}) => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = propIsDark !== undefined ? propIsDark : colorScheme === 'dark';
  const palette = isDark ? surfaces.dark : surfaces.light;
  const resolvedBg = propBg || (isDark ? surfaces.dark.card : surfaces.light.bg);
  const reducedMotion = useReducedMotion();
  const [modalRendered, setModalRendered] = useState(visible);

  const sheetHeight = maxHeight || windowHeight * 0.9;
  const translateY = useSharedValue(sheetHeight);
  const context = useSharedValue(0);

  const handleFinishClose = () => {
    setModalRendered(false);
    onClose();
  };

  useEffect(() => {
    if (visible) {
      setModalRendered(true);
      if (reducedMotion) {
        translateY.set(0);
      } else {
        translateY.set(
          withSpring(0, {
            duration: 320,
            dampingRatio: 0.85,
          })
        );
      }
    } else if (modalRendered) {
      if (reducedMotion) {
        translateY.set(sheetHeight);
        setModalRendered(false);
      } else {
        translateY.set(
          withSpring(
            sheetHeight,
            {
              duration: 260,
              dampingRatio: 1,
              overshootClamping: true,
            },
            (finished) => {
              if (finished) {
                scheduleOnRN(handleFinishClose);
              }
            }
          )
        );
      }
    }
  }, [visible, sheetHeight, reducedMotion]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-10, 10])
        .onStart(() => {
          context.set(translateY.get());
        })
        .onUpdate((e) => {
          const next = context.get() + e.translationY;
          translateY.set(next >= 0 ? next : rubberband(next, sheetHeight));
        })
        .onEnd((e) => {
          const projected = translateY.get() + project(e.velocityY);
          if (projected > sheetHeight * 0.35 || e.velocityY > 500) {
            scheduleOnRN(triggerLightHaptic);
            translateY.set(
              withSpring(
                sheetHeight,
                {
                  duration: 280,
                  dampingRatio: 1,
                  velocity: e.velocityY,
                  overshootClamping: true,
                },
                (finished) => {
                  if (finished) {
                    scheduleOnRN(handleFinishClose);
                  }
                }
              )
            );
          } else {
            translateY.set(
              withSpring(0, {
                duration: 300,
                dampingRatio: 0.8,
                velocity: e.velocityY,
              })
            );
          }
        }),
    [sheetHeight]
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.get(),
      [0, sheetHeight],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  if (!modalRendered) return null;

  const isZeroPadding = sheetClassName.includes('p-0');

  return (
    <Modal
      visible={modalRendered}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              height: sheetHeight,
              backgroundColor: resolvedBg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: sheetHeight,
              maxWidth: 672,
            },
            sheetAnimatedStyle,
            containerStyle,
          ]}
        >
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: resolvedBg,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
              },
            ]}
          />

          <View
            style={{
              flex: 1,
              width: '100%',
              backgroundColor: resolvedBg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              overflow: 'hidden',
              paddingHorizontal: isZeroPadding ? 0 : 24,
              paddingTop: isZeroPadding ? 0 : 8,
              paddingBottom: isZeroPadding ? 0 : Math.max(insets.bottom, 20),
            }}
          >
            <GestureDetector gesture={panGesture}>
              <View style={styles.handleContainer}>
                <View
                  style={{
                    height: 5,
                    width: 44,
                    borderRadius: 3,
                    backgroundColor: palette.lineStrong,
                  }}
                />
              </View>
            </GestureDetector>

            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(22, 35, 42, 0.45)',
  },
  sheetContainer: {
    width: '100%',
    zIndex: 10,
    borderCurve: 'continuous',
    shadowColor: '#1f3038',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 20,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 14,
    cursor: 'grab',
  },
});
