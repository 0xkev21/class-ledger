import { User, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';
import { Student } from '@/src/types';
import { DragDismissSheet } from './animated/DragDismissSheet';
import { PressableScale } from './animated/PressableScale';
import { NativeIcon } from './NativeIcon';

export interface AddStudentModalProps {
  visible: boolean;
  onClose: () => void;
  editingStudent?: Student | null;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  visible,
  onClose,
  editingStudent,
}) => {
  const { addStudent, updateStudent, t } = useTreasury();
  const { isDark, themeColor, palette } = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();

  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      if (editingStudent) {
        setName(editingStudent.name);
        setRollNumber(editingStudent.rollNumber || '');
        setPhone(editingStudent.phone || '');
      } else {
        setName('');
        setRollNumber('');
        setPhone('');
      }
      setError('');
    }
  }, [visible, editingStudent]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t.modals.addStudent.errorRequired);
      return;
    }

    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, {
          name: name.trim(),
          rollNumber: rollNumber.trim() || undefined,
          phone: phone.trim() || undefined,
        });
      } else {
        await addStudent({
          name: name.trim(),
          rollNumber: rollNumber.trim() || undefined,
          phone: phone.trim() || undefined,
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
              sfSymbol="person.fill"
              materialName="person"
              FallbackIcon={User}
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
            {editingStudent
              ? t.modals.addStudent.titleEdit
              : t.modals.addStudent.titleAdd}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Student Name */}
        <View style={styles.fieldGroup}>
          <Text
            style={[
              styles.label,
              { color: palette.muted, fontFamily: fonts.medium },
            ]}
          >
            {t.modals.addStudent.nameLabel}{' '}
            <Text style={{ color: palette.dangerText }}>*</Text>
          </Text>
          <TextInput
            value={name}
            onChangeText={(tVal) => {
              setName(tVal);
              setError('');
            }}
            placeholder={t.modals.addStudent.namePlaceholder}
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

        {/* Roll Number */}
        <View style={styles.fieldGroup}>
          <Text
            style={[
              styles.label,
              { color: palette.muted, fontFamily: fonts.medium },
            ]}
          >
            {t.modals.addStudent.rollLabel} ({t.common.optional})
          </Text>
          <TextInput
            value={rollNumber}
            onChangeText={setRollNumber}
            placeholder={t.modals.addStudent.rollPlaceholder}
            placeholderTextColor={palette.muted}
            style={[
              styles.input,
              {
                backgroundColor: palette.card,
                borderColor: palette.line,
                color: palette.ink,
                fontFamily: fonts.mono,
                ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
              },
            ]}
          />
        </View>

        {/* Phone */}
        <View style={styles.fieldGroupLast}>
          <Text
            style={[
              styles.label,
              { color: palette.muted, fontFamily: fonts.medium },
            ]}
          >
            {t.modals.addStudent.phoneLabel} ({t.common.optional})
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder={t.modals.addStudent.phonePlaceholder}
            placeholderTextColor={palette.muted}
            keyboardType="phone-pad"
            style={[
              styles.input,
              {
                backgroundColor: palette.card,
                borderColor: palette.line,
                color: palette.ink,
                fontFamily: fonts.mono,
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
            editingStudent
              ? t.modals.addStudent.submitEdit
              : t.modals.addStudent.submitAdd
          }
          style={[styles.submitButton, { backgroundColor: themeColor.primary }]}
        >
          <Text
            style={[
              styles.submitText,
              { color: themeColor.onPrimary, fontFamily: fonts.semibold },
            ]}
          >
            {editingStudent
              ? t.modals.addStudent.submitEdit
              : t.modals.addStudent.submitAdd}
          </Text>
        </PressableScale>
      </ScrollView>
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
  fieldGroup: {
    marginBottom: 14,
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
