import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
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
  withTiming,
} from 'react-native-reanimated';
import { cssInterop } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { EASE_OUT, project, rubberband } from '@/src/utils/motion';

cssInterop(Animated.View, { className: 'style' });

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

export const DragDismissSheet: React.FC<DragDismissSheetProps> = ({
  visible,
  onClose,
  children,
  maxHeight = SCREEN_HEIGHT * 0.9,
  containerStyle,
  sheetClassName = '',
  isDark: propIsDark,
  backgroundColor: propBg,
}) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = propIsDark !== undefined ? propIsDark : colorScheme === 'dark';
  const resolvedBg = propBg || (isDark ? '#18181b' : '#ffffff');
  const reducedMotion = useReducedMotion();
  const [modalRendered, setModalRendered] = useState(visible);

  const sheetHeight = maxHeight;
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
        .activeOffsetY([-10, 10]) // Declare intent before claiming touch
        .onStart(() => {
          context.set(translateY.get()); // Resume seamlessly if grabbed mid-motion
        })
        .onUpdate((e) => {
          const next = context.get() + e.translationY;
          // Downward is free; upward past top resists via rubberband
          translateY.set(next >= 0 ? next : rubberband(next, sheetHeight));
        })
        .onEnd((e) => {
          const projected = translateY.get() + project(e.velocityY);
          // Flick velocity or 35% distance commits to dismiss
          if (projected > sheetHeight * 0.35 || e.velocityY > 500) {
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
            // Settle back to open position with gesture velocity
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
        {/* Backdrop synced with sheet transform */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Sheet with Pan Gesture recognition */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: resolvedBg,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingHorizontal: isZeroPadding ? 0 : 24,
              paddingTop: isZeroPadding ? 0 : 8,
              paddingBottom: Math.max(insets.bottom, 20),
              maxHeight: sheetHeight,
              maxWidth: 672,
            },
            sheetAnimatedStyle,
            containerStyle,
          ]}
          className={`w-full md:max-w-2xl rounded-t-[32px] md:rounded-[28px] shadow-2xl flex-col ${sheetClassName}`}
        >
          {/* Draggable Handle */}
          <GestureDetector gesture={panGesture}>
            <View style={styles.handleContainer}>
              <View
                style={{
                  height: 6,
                  width: 48,
                  borderRadius: 3,
                  backgroundColor: isDark ? '#3f3f46' : '#d4d4d8',
                }}
              />
            </View>
          </GestureDetector>

          {children}
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheetContainer: {
    width: '100%',
    zIndex: 10,
    borderCurve: 'continuous',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 16,
    cursor: 'grab',
  },
});
