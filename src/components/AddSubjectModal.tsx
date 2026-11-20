import { BookOpen, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';
import { Subject } from '@/src/types';
import { DragDismissSheet } from './animated/DragDismissSheet';
import { PressableScale } from './animated/PressableScale';
import { NativeIcon } from './NativeIcon';

export interface AddSubjectModalProps {
  visible: boolean;
  onClose: () => void;
  editingSubject?: Subject | null;
}

export const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  visible,
  onClose,
  editingSubject,
}) => {
  const { addSubject, updateSubject, t } = useTreasury();
  const { isDark, themeColor, palette } = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();

  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      if (editingSubject) {
        setName(editingSubject.name);
      } else {
        setName('');
      }
      setError('');
    }
  }, [visible, editingSubject]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t.modals.addSubject.errorRequired);
      return;
    }

    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, {
          name: name.trim(),
        });
      } else {
        await addSubject({
          name: name.trim(),
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || t.common.error);
    }
  };

  return (
    <DragDismissSheet
      visible={visible}
      onClose={onClose}
      maxHeight={windowHeight * 0.9}
      isDark={isDark}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[styles.iconBadge, { backgroundColor: themeColor.surface }]}
          >
            <NativeIcon
              sfSymbol="book.fill"
              materialName="menu-book"
              FallbackIcon={BookOpen}
              size={20}
              color={themeColor.primary}
            />
          </View>
          <Text
            style={[
              styles.title,
              { color: palette.ink, fontFamily: fonts.semibold },
            ]}
          >
            {editingSubject
              ? t.modals.addSubject.titleEdit
              : t.modals.addSubject.titleAdd}
          </Text>
        </View>
        <PressableScale
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
          style={[styles.closeButton, { backgroundColor: palette.surface }]}
        >
          <NativeIcon
            sfSymbol="xmark"
            materialName="close"
            FallbackIcon={X}
            size={16}
            color={palette.subtle}
          />
        </PressableScale>
      </View>

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: palette.dangerBg }]}>
          <Text
            style={[
              styles.errorText,
              { color: palette.dangerText, fontFamily: fonts.medium },
            ]}
          >
            {error}
          </Text>
        </View>
      ) : null}

      {/* Subject Name Input */}
      <View style={styles.fieldGroupLast}>
        <Text
          style={[
            styles.label,
            { color: palette.muted, fontFamily: fonts.medium },
          ]}
        >
          {t.modals.addSubject.nameLabel}{' '}
          <Text style={{ color: palette.dangerText }}>*</Text>
        </Text>
        <TextInput
          value={name}
          onChangeText={(tVal) => {
            setName(tVal);
            setError('');
          }}
          placeholder={t.modals.addSubject.namePlaceholder}
          placeholderTextColor={palette.muted}
          style={[
            styles.input,
            {
              backgroundColor: palette.card,
              borderColor: palette.line,
              color: palette.ink,
              fontFamily: fonts.regular,
              ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
            },
          ]}
        />
      </View>

      {/* Submit Button */}
      <PressableScale
        onPress={handleSubmit}
        accessibilityRole="button"
        accessibilityLabel={
          editingSubject
            ? t.modals.addSubject.submitEdit
            : t.modals.addSubject.submitAdd
        }
        style={[styles.submitButton, { backgroundColor: themeColor.primary }]}
      >
        <Text
          style={[
            styles.submitText,
            { color: themeColor.onPrimary, fontFamily: fonts.semibold },
          ]}
        >
          {editingSubject
            ? t.modals.addSubject.submitEdit
            : t.modals.addSubject.submitAdd}
        </Text>
      </PressableScale>
    </DragDismissSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 19,
    lineHeight: 24,
    flexShrink: 1,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  errorBox: {
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 17,
  },
  fieldGroupLast: {
    marginBottom: 22,
  },
  label: {
    fontSize: 12,
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    width: '100%',
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  submitButton: {
    width: '100%',
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  submitText: {
    fontSize: 14,
  },
});
