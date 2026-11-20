import { BookOpen, Edit2, Phone, Plus, Trash2, Users } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddStudentModal } from '@/src/components/AddStudentModal';
import { AddSubjectModal } from '@/src/components/AddSubjectModal';
import { EmptyState } from '@/src/components/EmptyState';
import { FloatingActionButton } from '@/src/components/FloatingActionButton';
import { NativeIcon } from '@/src/components/NativeIcon';
import { SearchBar } from '@/src/components/SearchBar';
import { StatusPill } from '@/src/components/StatusPill';
import { ToastNotification } from '@/src/components/ToastNotification';
import { AnimatedSegmentedControl } from '@/src/components/animated/AnimatedSegmentedControl';
import { StaggeredRow } from '@/src/components/animated/StaggeredRow';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import { fonts } from '@/src/theme';
import { Student, Subject } from '@/src/types';
import { formatMMK } from '@/src/utils/formatters';
import { Haptics } from '@/src/utils/haptics';

function chunkPairs<T>(items: T[]): Array<[T, T | null]> {
  const pairs: Array<[T, T | null]> = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push([items[i], items[i + 1] ?? null]);
  }
  return pairs;
}

export default function RosterScreen() {
  const {
    students,
    subjects,
    deleteStudent,
    deleteSubject,
    getStudentUnpaidFineBalance,
    fines,
    t,
  } = useTreasury();
  const { themeColor, palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  // Mount guard on web keeps static SSR and client hydration identical
  const [hasMounted, setHasMounted] = useState(!isWeb);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  const isDesktop = hasMounted && width >= 1024;

  const [segment, setSegment] = useState<'students' | 'subjects'>('students');
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const q = searchQuery.toLowerCase().trim();
    return subjects.filter((s) => s.name.toLowerCase().includes(q));
  }, [subjects, searchQuery]);

  const studentPairs = useMemo(
    () => chunkPairs(filteredStudents),
    [filteredStudents]
  );
  const subjectPairs = useMemo(
    () => chunkPairs(filteredSubjects),
    [filteredSubjects]
  );

  const rosterTabs = useMemo(
    () => [
      {
        id: 'students' as const,
        label: t.roster.studentsTab(students.length),
        icon: ({ size, color }: { size: number; color: string }) => (
          <NativeIcon
            sfSymbol="person.2.fill"
            materialName="people"
            FallbackIcon={Users}
            size={size}
            color={color}
          />
        ),
      },
      {
        id: 'subjects' as const,
        label: t.roster.subjectsTab(subjects.length),
        icon: ({ size, color }: { size: number; color: string }) => (
          <NativeIcon
            sfSymbol="book.fill"
            materialName="menu-book"
            FallbackIcon={BookOpen}
            size={size}
            color={color}
          />
        ),
      },
    ],
    [t, students.length, subjects.length]
  );

  const performDeleteStudent = async (studentId: string) => {
    await deleteStudent(studentId);
    setToastMessage(t.roster.deleteStudentToast);
  };

  const handleDeleteStudent = (student: Student) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(t.roster.deleteStudentMsg(student.name))) {
        void performDeleteStudent(student.id);
      }
      return;
    }

    Alert.alert(
      t.roster.deleteStudentTitle,
      t.roster.deleteStudentMsg(student.name),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: () => {
            void performDeleteStudent(student.id);
          },
        },
      ]
    );
  };

  const performDeleteSubject = async (subjectId: string) => {
    await deleteSubject(subjectId);
    setToastMessage(t.roster.deleteSubjectToast);
  };

  const handleDeleteSubject = (subject: Subject) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(t.roster.deleteSubjectMsg(subject.name))) {
        void performDeleteSubject(subject.id);
      }
      return;
    }

    Alert.alert(
      t.roster.deleteSubjectTitle,
      t.roster.deleteSubjectMsg(subject.name),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: () => {
            void performDeleteSubject(subject.id);
          },
        },
      ]
    );
  };

  const openPrimaryCreate = () => {
    Haptics.selectionAsync();
    if (segment === 'students') {
      setEditingStudent(null);
      setShowAddStudent(true);
    } else {
      setEditingSubject(null);
      setShowAddSubject(true);
    }
  };

  const renderStudentCard = (student: Student) => {
    const unpaidBalance = getStudentUnpaidFineBalance(student.id);

    return (
      <View
        key={student.id}
        style={[
          styles.itemCard,
          {
            backgroundColor: palette.card,
            borderColor: palette.line,
          },
        ]}
      >
        <View style={styles.cardLeft}>
          <View style={styles.studentTitleRow}>
            {student.rollNumber ? (
              <StatusPill variant="neutral" mono label={student.rollNumber} />
            ) : null}
            <Text
              selectable
              numberOfLines={1}
              style={[
                styles.cardName,
                { color: palette.ink, fontFamily: fonts.semibold },
              ]}
            >
              {student.name}
            </Text>
          </View>

          {student.phone ? (
            <View style={styles.phoneRow}>
              <NativeIcon
                sfSymbol="phone.fill"
                materialName="phone"
                FallbackIcon={Phone}
                size={12}
                color={palette.muted}
              />
              <Text
                selectable
                style={[
                  styles.phoneText,
                  { color: palette.muted, fontFamily: fonts.mono },
                ]}
              >
                {student.phone}
              </Text>
            </View>
          ) : null}

          <View style={styles.badgeWrap}>
            <StatusPill
              variant={unpaidBalance > 0 ? 'unpaid' : 'paid'}
              mono={unpaidBalance > 0}
              label={
                unpaidBalance > 0
                  ? `${t.roster.unpaidDues}: ${formatMMK(unpaidBalance)}`
                  : t.roster.allClear
              }
            />
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setEditingStudent(student);
              setShowAddStudent(true);
            }}
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel={t.common.edit}
            style={[
              styles.actionCircleBtn,
              {
                backgroundColor: palette.surface,
              },
            ]}
          >
            <NativeIcon
              sfSymbol="pencil"
              materialName="edit"
              FallbackIcon={Edit2}
              size={14}
              color={palette.subtle}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDeleteStudent(student)}
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel={t.common.delete}
            style={[
              styles.actionCircleBtn,
              {
                backgroundColor: palette.surface,
              },
            ]}
          >
            <NativeIcon
              sfSymbol="trash"
              materialName="delete-outline"
              FallbackIcon={Trash2}
              size={14}
              color={palette.dangerText}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSubjectCard = (sub: Subject) => {
    const subFines = fines.filter((f) => f.subjectId === sub.id);
    const subTotal = subFines.reduce((sum, f) => sum + f.amount, 0);

    return (
      <View
        key={sub.id}
        style={[
          styles.itemCard,
          {
            backgroundColor: palette.card,
            borderColor: palette.line,
          },
        ]}
      >
        <View style={styles.cardLeft}>
          <Text
            selectable
            numberOfLines={1}
            style={[
              styles.cardName,
              { color: palette.ink, fontFamily: fonts.semibold },
            ]}
          >
            {sub.name}
          </Text>

          <View style={styles.subjectMetaRow}>
            <StatusPill
              variant="neutral"
              mono
              label={t.fines.countFines(subFines.length)}
            />
            <Text
              selectable
              style={[
                styles.subjectTotal,
                { color: themeColor.text, fontFamily: fonts.monoMedium },
              ]}
            >
              {formatMMK(subTotal)}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setEditingSubject(sub);
              setShowAddSubject(true);
            }}
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel={t.common.edit}
            style={[
              styles.actionCircleBtn,
              {
                backgroundColor: palette.surface,
              },
            ]}
          >
            <NativeIcon
              sfSymbol="pencil"
              materialName="edit"
              FallbackIcon={Edit2}
              size={14}
              color={palette.subtle}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDeleteSubject(sub)}
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel={t.common.delete}
            style={[
              styles.actionCircleBtn,
              {
                backgroundColor: palette.surface,
              },
            ]}
          >
            <NativeIcon
              sfSymbol="trash"
              materialName="delete-outline"
              FallbackIcon={Trash2}
              size={14}
              color={palette.dangerText}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const segmentedControl = (
    <AnimatedSegmentedControl<'students' | 'subjects'>
      tabs={rosterTabs}
      activeId={segment}
      onChange={(id) => {
        setSegment(id);
        setSearchQuery('');
      }}
      activeColor={palette.ink}
      onActiveColor={palette.bg}
      backgroundColor={palette.surface}
      inactiveTextColor={palette.muted}
      style={isDesktop ? styles.desktopSegmented : undefined}
    />
  );

  return (
    <View style={[styles.screenRoot, { backgroundColor: palette.bg }]}>
      <ToastNotification
        message={toastMessage}
        onHide={() => setToastMessage(null)}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: isDesktop ? 24 : 20,
            paddingTop: isDesktop ? 24 : insets.top + 16,
            paddingBottom: isDesktop ? 40 : 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.container,
            { maxWidth: isDesktop ? 1280 : 760 },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text
                selectable
                style={[
                  styles.pageTitle,
                  { color: palette.ink, fontFamily: fonts.bold },
                ]}
              >
                {t.roster.title}
              </Text>
              <Text
                style={[
                  styles.pageSubtitle,
                  { color: palette.muted, fontFamily: fonts.regular },
                ]}
              >
                {t.roster.subtitle}
              </Text>
            </View>

            {isDesktop ? (
              <TouchableOpacity
                onPress={openPrimaryCreate}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={
                  segment === 'students'
                    ? t.roster.addStudent
                    : t.roster.addSubject
                }
                style={[
                  styles.primaryActionBtn,
                  {
                    backgroundColor: themeColor.primary,
                  },
                ]}
              >
                <NativeIcon
                  sfSymbol="plus"
                  materialName="add"
                  FallbackIcon={Plus}
                  size={16}
                  color={themeColor.onPrimary}
                />
                <Text
                  style={[
                    styles.primaryActionText,
                    {
                      color: themeColor.onPrimary,
                      fontFamily: fonts.semibold,
                    },
                  ]}
                >
                  {segment === 'students'
                    ? t.roster.addStudent
                    : t.roster.addSubject}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Toolbar: Segmented Control & SearchBar */}
          {isDesktop ? (
            <View style={styles.desktopToolbar}>
              {segmentedControl}
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={
                  segment === 'students'
                    ? t.roster.searchStudents
                    : t.roster.searchSubjects
                }
                style={styles.flexOne}
              />
            </View>
          ) : (
            <View style={styles.mobileToolbar}>
              {segmentedControl}
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={
                  segment === 'students'
                    ? t.roster.searchStudents
                    : t.roster.searchSubjects
                }
              />
            </View>
          )}

          {/* Segment Content */}
          {segment === 'students' ? (
            filteredStudents.length === 0 ? (
              <EmptyState
                title={t.roster.emptyStudentsTitle}
                description={t.roster.emptyStudentsDesc}
                icon={Users}
                sfSymbol="person.2.fill"
                materialName="people"
                actionLabel={t.roster.addStudent}
                onActionPress={() => {
                  setEditingStudent(null);
                  setShowAddStudent(true);
                }}
              />
            ) : isDesktop ? (
              <View style={styles.gridGap}>
                {studentPairs.map(([leftItem, rightItem]) => (
                  <View key={leftItem.id} style={styles.desktopGridRow}>
                    <View style={styles.desktopGridCol}>
                      {renderStudentCard(leftItem)}
                    </View>
                    <View style={styles.desktopGridCol}>
                      {rightItem ? renderStudentCard(rightItem) : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.listGap}>
                {filteredStudents.map((student, index) => (
                  <StaggeredRow key={student.id} index={index}>
                    {renderStudentCard(student)}
                  </StaggeredRow>
                ))}
              </View>
            )
          ) : filteredSubjects.length === 0 ? (
            <EmptyState
              title={t.roster.emptySubjectsTitle}
              description={t.roster.emptySubjectsDesc}
              icon={BookOpen}
              sfSymbol="book.fill"
              materialName="menu-book"
              actionLabel={t.roster.addSubject}
              onActionPress={() => {
                setEditingSubject(null);
                setShowAddSubject(true);
              }}
            />
          ) : isDesktop ? (
            <View style={styles.gridGap}>
              {subjectPairs.map(([leftItem, rightItem]) => (
                <View key={leftItem.id} style={styles.desktopGridRow}>
                  <View style={styles.desktopGridCol}>
                    {renderSubjectCard(leftItem)}
                  </View>
                  <View style={styles.desktopGridCol}>
                    {rightItem ? renderSubjectCard(rightItem) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.listGap}>
              {filteredSubjects.map((sub, index) => (
                <StaggeredRow key={sub.id} index={index}>
                  {renderSubjectCard(sub)}
                </StaggeredRow>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {!isDesktop ? (
        <FloatingActionButton
          onPress={openPrimaryCreate}
          label={
            segment === 'students' ? t.roster.addStudent : t.roster.addSubject
          }
        />
      ) : null}

      <AddStudentModal
        visible={showAddStudent}
        onClose={() => {
          setShowAddStudent(false);
          setEditingStudent(null);
        }}
        editingStudent={editingStudent}
      />

      <AddSubjectModal
        visible={showAddSubject}
        onClose={() => {
          setShowAddSubject(false);
          setEditingSubject(null);
        }}
        editingSubject={editingSubject}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    width: '100%',
    alignSelf: 'center',
  },
  flexOne: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 18,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    fontSize: 26,
    lineHeight: 42,
    paddingTop: 4,
    letterSpacing: -0.3,
    ...(Platform.OS === 'android' ? { includeFontPadding: true } : {}),
  },
  pageSubtitle: {
    fontSize: 13,
    lineHeight: 22,
    marginTop: 2,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexShrink: 0,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  primaryActionText: {
    fontSize: 13,
  },
  desktopToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  desktopSegmented: {
    width: 340,
    flexShrink: 0,
  },
  mobileToolbar: {
    gap: 12,
    marginBottom: 16,
  },
  gridGap: {
    gap: 12,
  },
  desktopGridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  desktopGridCol: {
    flex: 1,
    minWidth: 0,
  },
  listGap: {
    gap: 10,
  },
  itemCard: {
    flex: 1,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardLeft: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  studentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  cardName: {
    fontSize: 15,
    flexShrink: 1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneText: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subjectTotal: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  actionCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
});
