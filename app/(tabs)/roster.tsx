import {
  BookOpen,
  Edit2,
  Phone,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddStudentModal } from '@/src/components/AddStudentModal';
import { AddSubjectModal } from '@/src/components/AddSubjectModal';
import { EmptyState } from '@/src/components/EmptyState';
import { FloatingActionButton } from '@/src/components/FloatingActionButton';
import { NativeIcon } from '@/src/components/NativeIcon';
import { SearchBar } from '@/src/components/SearchBar';
import { ToastNotification } from '@/src/components/ToastNotification';
import { AnimatedSegmentedControl } from '@/src/components/animated/AnimatedSegmentedControl';
import { PressableScale } from '@/src/components/animated/PressableScale';
import { StaggeredRow } from '@/src/components/animated/StaggeredRow';
import { useAppTheme, useTreasury } from '@/src/context/TreasuryContext';
import { Student, Subject } from '@/src/types';
import { formatMMK } from '@/src/utils/formatters';
import { Haptics } from '@/src/utils/haptics';

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
  const { isDark, themeColor } = useAppTheme();
  const insets = useSafeAreaInsets();

  // Active Segment: 'students' or 'subjects'
  const [segment, setSegment] = useState<'students' | 'subjects'>('students');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtered lists
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

  const handleDeleteStudent = (student: Student) => {
    Alert.alert(
      t.roster.deleteStudentTitle,
      t.roster.deleteStudentMsg(student.name),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            await deleteStudent(student.id);
            setToastMessage(t.roster.deleteStudentToast);
          },
        },
      ]
    );
  };

  const handleDeleteSubject = (subject: Subject) => {
    Alert.alert(
      t.roster.deleteSubjectTitle,
      t.roster.deleteSubjectMsg(subject.name),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            await deleteSubject(subject.id);
            setToastMessage(t.roster.deleteSubjectToast);
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <ToastNotification message={toastMessage} onHide={() => setToastMessage(null)} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1, height: '100%' }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: 120,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <View className="mb-5 pt-2">
            <Text
              selectable
              className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-relaxed py-0.5"
            >
              {t.roster.title}
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              {t.roster.subtitle}
            </Text>
          </View>

          {/* Animated Segmented Controller */}
          <AnimatedSegmentedControl
            tabs={rosterTabs}
            activeId={segment}
            onChange={(id) => {
              setSegment(id);
              setSearchQuery('');
            }}
            activeColor={themeColor.primary}
            onActiveColor={themeColor.onPrimary}
            backgroundColor={isDark ? '#18181b' : '#f4f4f5'}
            inactiveTextColor={isDark ? '#a1a1aa' : '#71717a'}
            className="mb-4"
          />

          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              segment === 'students'
                ? t.roster.searchStudents
                : t.roster.searchSubjects
            }
            style={{ marginBottom: 16 }}
          />

          {/* Segment 1: Students View */}
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
            ) : (
              <View className="gap-2.5">
                {filteredStudents.map((student, index) => {
                  const unpaidBalance = getStudentUnpaidFineBalance(student.id);

                  return (
                    <StaggeredRow key={student.id} index={index}>
                      <View
                        style={{ borderCurve: 'continuous' }}
                        className="rounded-3xl bg-white dark:bg-zinc-900 p-4 border border-zinc-200/70 dark:border-zinc-800/80 shadow-none flex-row items-center justify-between"
                      >
                      <View className="flex-1 mr-3">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text
                            selectable
                            className="text-sm font-bold text-zinc-900 dark:text-zinc-50"
                          >
                            {student.name}
                          </Text>
                          {student.rollNumber ? (
                            <View
                              style={{ borderCurve: 'continuous' }}
                              className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5"
                            >
                              <Text selectable className="text-2xs font-semibold text-zinc-500">
                                {student.rollNumber}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {student.phone ? (
                          <View className="flex-row items-center mt-0.5">
                            <NativeIcon
                              sfSymbol="phone.fill"
                              materialName="phone"
                              FallbackIcon={Phone}
                              size={11}
                              color="#9ca3af"
                            />
                            <Text selectable className="ml-1 text-xs-tight text-zinc-400">
                              {student.phone}
                            </Text>
                          </View>
                        ) : null}

                        {/* Unpaid Fine Balance Badge */}
                        <View className="mt-2 flex-row">
                          <View
                            style={{ borderCurve: 'continuous' }}
                            className={`rounded-full px-2.5 py-0.5 ${
                              unpaidBalance > 0
                                ? 'bg-rose-500/15'
                                : 'bg-emerald-500/15'
                            }`}
                          >
                            <Text
                              selectable
                              style={{
                                color: unpaidBalance > 0
                                  ? (isDark ? '#fca5a5' : '#b91c1c')
                                  : (isDark ? '#6ee7b7' : '#047857'),
                                fontVariant: ['tabular-nums'],
                              }}
                              className="text-2xs font-bold"
                            >
                              {unpaidBalance > 0
                                ? `${t.roster.unpaidDues}: ${formatMMK(unpaidBalance)}`
                                : t.roster.allClear}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Actions: Edit & Delete */}
                      <View className="flex-row items-center gap-1.5">
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.selectionAsync();
                            setEditingStudent(student);
                            setShowAddStudent(true);
                          }}
                          className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center active:bg-zinc-200 dark:active:bg-zinc-700"
                        >
                          <NativeIcon
                            sfSymbol="pencil"
                            materialName="edit"
                            FallbackIcon={Edit2}
                            size={14}
                            color="#71717a"
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDeleteStudent(student)}
                          className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center active:bg-rose-50 dark:active:bg-rose-950/40"
                        >
                          <NativeIcon
                            sfSymbol="trash"
                            materialName="delete-outline"
                            FallbackIcon={Trash2}
                            size={14}
                            color="#e11d48"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </StaggeredRow>
                );
              })}
              </View>
            )
          ) : (
            /* Segment 2: Subjects View */
            filteredSubjects.length === 0 ? (
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
            ) : (
              <View className="gap-2.5">
                {filteredSubjects.map((sub, index) => {
                  const subFines = fines.filter((f) => f.subjectId === sub.id);
                  const subTotal = subFines.reduce((sum, f) => sum + f.amount, 0);

                  return (
                    <StaggeredRow key={sub.id} index={index}>
                      <View
                        style={{ borderCurve: 'continuous' }}
                        className="rounded-3xl bg-white dark:bg-zinc-900 p-4 border border-zinc-200/70 dark:border-zinc-800/80 shadow-none flex-row items-center justify-between"
                      >
                      <View className="flex-1 mr-3">
                        <Text
                          selectable
                          className="text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-relaxed py-0.5"
                        >
                          {sub.name}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          <Text className="text-xs-tight text-zinc-400">
                            {t.fines.countFines(subFines.length)}
                          </Text>
                          <Text
                            selectable
                            style={{
                              color: themeColor.primary,
                              fontVariant: ['tabular-nums'],
                            }}
                            className="text-xs-tight font-bold"
                          >
                            {formatMMK(subTotal)}
                          </Text>
                        </View>
                      </View>

                      {/* Actions */}
                      <View className="flex-row items-center gap-1.5">
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.selectionAsync();
                            setEditingSubject(sub);
                            setShowAddSubject(true);
                          }}
                          className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center active:bg-zinc-200 dark:active:bg-zinc-700"
                        >
                          <NativeIcon
                            sfSymbol="pencil"
                            materialName="edit"
                            FallbackIcon={Edit2}
                            size={14}
                            color="#71717a"
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDeleteSubject(sub)}
                          className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center active:bg-rose-50 dark:active:bg-rose-950/40"
                        >
                          <NativeIcon
                            sfSymbol="trash"
                            materialName="delete-outline"
                            FallbackIcon={Trash2}
                            size={14}
                            color="#e11d48"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </StaggeredRow>
                );
              })}
              </View>
            )
          )}
        </View>
      </ScrollView>

      {/* Prominent Floating Action Button with Safe Inset Positioning */}
      <FloatingActionButton
        onPress={() => {
          if (segment === 'students') {
            setEditingStudent(null);
            setShowAddStudent(true);
          } else {
            setEditingSubject(null);
            setShowAddSubject(true);
          }
        }}
        label={segment === 'students' ? t.roster.addStudent : t.roster.addSubject}
      />

      {/* Add / Edit Student Modal */}
      <AddStudentModal
        visible={showAddStudent}
        onClose={() => {
          setShowAddStudent(false);
          setEditingStudent(null);
        }}
        editingStudent={editingStudent}
      />

      {/* Add / Edit Subject Modal */}
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
