import {
  AlertCircle,
  BookOpen,
  Edit2,
  GraduationCap,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddStudentModal } from '@/src/components/AddStudentModal';
import { AddSubjectModal } from '@/src/components/AddSubjectModal';
import { ToastNotification } from '@/src/components/ToastNotification';
import { useTreasury } from '@/src/context/TreasuryContext';
import { Student, Subject } from '@/src/types';
import { formatMMK } from '@/src/utils/formatters';

export default function RosterScreen() {
  const {
    students,
    subjects,
    fines,
    deleteStudent,
    deleteSubject,
    getStudentUnpaidFineBalance,
  } = useTreasury();

  // Segment: students | subjects
  const [segment, setSegment] = useState<'students' | 'subjects'>('students');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q) ||
        s.phone?.includes(q)
    );
  }, [students, searchQuery]);

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const q = searchQuery.toLowerCase().trim();
    return subjects.filter((sub) => sub.name.toLowerCase().includes(q));
  }, [subjects, searchQuery]);

  const handleDeleteStudent = (student: Student) => {
    Alert.alert(
      'ကျောင်းသား ဖျက်မည်',
      `"${student.name}" အား အတန်းစာရင်းမှ ဖျက်ပစ်ရန် သေချာပါသလား? သက်ဆိုင်ရာ ဒဏ်ကြေးနှင့် အလှူမှတ်တမ်းများပါ ပျက်သွားပါမည်။`,
      [
        { text: 'မဖျက်ပါ', style: 'cancel' },
        {
          text: 'ဖျက်မည်',
          style: 'destructive',
          onPress: async () => {
            await deleteStudent(student.id);
            setToastMessage('ကျောင်းသားအား စာရင်းမှ ဖျက်ပစ်လိုက်ပါပြီ');
          },
        },
      ]
    );
  };

  const handleDeleteSubject = (subject: Subject) => {
    Alert.alert(
      'ဘာသာရပ် ဖျက်မည်',
      `"${subject.name}" ဘာသာရပ်အား ဖျက်ပစ်ရန် သေချာပါသလား?`,
      [
        { text: 'မဖျက်ပါ', style: 'cancel' },
        {
          text: 'ဖျက်မည်',
          style: 'destructive',
          onPress: async () => {
            await deleteSubject(subject.id);
            setToastMessage('ဘာသာရပ်အား ဖျက်ပစ်လိုက်ပါပြီ');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, height: '100%', minHeight: 0 }}
      className="flex-1 bg-slate-50 dark:bg-zinc-950"
    >
      <ToastNotification message={toastMessage} onHide={() => setToastMessage(null)} />

      <ScrollView
        style={{ flex: 1, height: '100%' }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 120,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={true}
      >
        <View className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <View className="mb-5 pt-2">
            <Text className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-relaxed py-0.5">
              ကျောင်းသားစာရင်း & ဘာသာရပ်များ
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              အတန်းသား roster နှင့် သင်ကြားသည့် ဘာသာရပ်များ စီမံခန့်ခွဲခြင်း
            </Text>
          </View>

          {/* M3 Segmented Button */}
          <View className="flex-row p-1 bg-white dark:bg-zinc-900 rounded-full mb-4 shadow-none">
            <TouchableOpacity
              onPress={() => {
                setSegment('students');
                setSearchQuery('');
              }}
              className={`flex-1 flex-row items-center justify-center py-2.5 rounded-full ${
                segment === 'students'
                  ? 'bg-indigo-600 shadow-sm'
                  : 'bg-transparent'
              }`}
            >
              <Users
                size={16}
                color={segment === 'students' ? '#ffffff' : '#71717a'}
              />
              <Text
                className={`ml-2 text-xs font-bold ${
                  segment === 'students'
                    ? 'text-white'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                ကျောင်းသားများ ({students.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setSegment('subjects');
                setSearchQuery('');
              }}
              className={`flex-1 flex-row items-center justify-center py-2.5 rounded-full ${
                segment === 'subjects'
                  ? 'bg-indigo-600 shadow-sm'
                  : 'bg-transparent'
              }`}
            >
              <BookOpen
                size={16}
                color={segment === 'subjects' ? '#ffffff' : '#71717a'}
              />
              <Text
                className={`ml-2 text-xs font-bold ${
                  segment === 'subjects'
                    ? 'text-white'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                ဘာသာရပ်များ ({subjects.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center rounded-2xl bg-white dark:bg-zinc-900 px-4 py-3 mb-4">
            <Search size={16} color="#9ca3af" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={
                segment === 'students'
                  ? 'ကျောင်းသားအမည် / ခုံနံပါတ် ဖြင့် ရှာရန်...'
                  : 'ဘာသာရပ်အမည် ဖြင့် ရှာရန်...'
              }
              placeholderTextColor="#9ca3af"
              className="ml-2.5 flex-1 text-xs text-zinc-900 dark:text-zinc-50 p-0"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={15} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Segment 1: Students View */}
          {segment === 'students' ? (
            filteredStudents.length === 0 ? (
              <View className="items-center justify-center py-16 px-6 rounded-3xl bg-white dark:bg-zinc-900 mt-2">
                <View className="h-16 w-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 items-center justify-center mb-3">
                  <Users size={32} color="#4f46e5" />
                </View>
                <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                  ကျောင်းသားစာရင်း မရှိသေးပါ
                </Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400 text-center mb-5 max-w-xs leading-relaxed">
                  အတန်းသားများကို အလွယ်တကူ ထည့်သွင်းနိုင်ပါသည်
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setEditingStudent(null);
                    setShowAddStudent(true);
                  }}
                  className="flex-row items-center rounded-full bg-indigo-600 px-6 py-3 active:bg-indigo-700 shadow-sm"
                >
                  <Plus size={16} color="#ffffff" />
                  <Text className="ml-1.5 text-xs font-bold text-white">ကျောင်းသား အသစ်ထည့်မည်</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-2.5">
                {filteredStudents.map((student) => {
                  const unpaidBalance = getStudentUnpaidFineBalance(student.id);

                  return (
                    <View
                      key={student.id}
                      className="rounded-3xl bg-white dark:bg-zinc-900 p-4 shadow-none flex-row items-center justify-between"
                    >
                      <View className="flex-1 mr-3">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                            {student.name}
                          </Text>
                          {student.rollNumber ? (
                            <View className="rounded-full bg-slate-100 dark:bg-zinc-800 px-2 py-0.5">
                              <Text className="text-[10px] font-semibold text-zinc-500">
                                {student.rollNumber}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {student.phone ? (
                          <View className="flex-row items-center mt-0.5">
                            <Phone size={11} color="#9ca3af" />
                            <Text className="ml-1 text-[11px] text-zinc-400">
                              {student.phone}
                            </Text>
                          </View>
                        ) : null}

                        {/* Unpaid Fine Balance Badge */}
                        <View className="mt-2 flex-row">
                          <View
                            className={`rounded-full px-2.5 py-0.5 ${
                              unpaidBalance > 0
                                ? 'bg-rose-500/15'
                                : 'bg-emerald-500/15'
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-bold ${
                                unpaidBalance > 0
                                ? 'text-rose-700 dark:text-rose-300'
                                : 'text-emerald-700 dark:text-emerald-300'
                              }`}
                            >
                              {unpaidBalance > 0
                                ? `ဒဏ်ကြေးကျန်: ${formatMMK(unpaidBalance)}`
                                : 'ဒဏ်ကြေး ကင်းရှင်း'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Actions: Edit & Delete */}
                      <View className="flex-row items-center gap-1.5">
                        <TouchableOpacity
                          onPress={() => {
                            setEditingStudent(student);
                            setShowAddStudent(true);
                          }}
                          className="h-8 w-8 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center active:bg-indigo-50"
                        >
                          <Edit2 size={14} color="#71717a" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDeleteStudent(student)}
                          className="h-8 w-8 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center active:bg-rose-50"
                        >
                          <Trash2 size={14} color="#e11d48" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )
          ) : (
            /* Segment 2: Subjects View */
            filteredSubjects.length === 0 ? (
              <View className="items-center justify-center py-16 px-6 rounded-3xl bg-white dark:bg-zinc-900 mt-2">
                <View className="h-16 w-16 rounded-full bg-violet-50 dark:bg-violet-950/60 items-center justify-center mb-3">
                  <BookOpen size={32} color="#7c3aed" />
                </View>
                <Text className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-1">
                  ဘာသာရပ် မရှိသေးပါ
                </Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400 text-center mb-5 max-w-xs leading-relaxed">
                  သင်ကြားနေသော ဘာသာရပ်များကို + ခလုတ်ဖြင့် ထည့်သွင်းပါ
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setEditingSubject(null);
                    setShowAddSubject(true);
                  }}
                  className="flex-row items-center rounded-full bg-violet-600 px-6 py-3 active:bg-violet-700 shadow-sm"
                >
                  <Plus size={16} color="#ffffff" />
                  <Text className="ml-1.5 text-xs font-bold text-white">+ ဘာသာရပ် အသစ်ထည့်မည်</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-2.5">
                {filteredSubjects.map((sub) => {
                  const subFines = fines.filter((f) => f.subjectId === sub.id);
                  const subTotal = subFines.reduce((sum, f) => sum + f.amount, 0);

                  return (
                    <View
                      key={sub.id}
                      className="rounded-3xl bg-white dark:bg-zinc-900 p-4 shadow-none flex-row items-center justify-between"
                    >
                      <View className="flex-1 mr-3">
                        <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-relaxed py-0.5">
                          {sub.name}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          <Text className="text-[11px] text-zinc-400">
                            ဒဏ်ကြေး {subFines.length} မှု
                          </Text>
                          <Text className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            {formatMMK(subTotal)}
                          </Text>
                        </View>
                      </View>

                      {/* Actions */}
                      <View className="flex-row items-center gap-1.5">
                        <TouchableOpacity
                          onPress={() => {
                            setEditingSubject(sub);
                            setShowAddSubject(true);
                          }}
                          className="h-8 w-8 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center active:bg-violet-50"
                        >
                          <Edit2 size={14} color="#71717a" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDeleteSubject(sub)}
                          className="h-8 w-8 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center active:bg-rose-50"
                        >
                          <Trash2 size={14} color="#e11d48" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )
          )}
        </View>
      </ScrollView>

      {/* Prominent M3 Extended FAB */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          onPress={() => {
            if (segment === 'students') {
              setEditingStudent(null);
              setShowAddStudent(true);
            } else {
              setEditingSubject(null);
              setShowAddSubject(true);
            }
          }}
          activeOpacity={0.85}
          className={`flex-row items-center rounded-full px-5 py-4 shadow-lg ${
            segment === 'students'
              ? 'bg-indigo-600 active:bg-indigo-700'
              : 'bg-violet-600 active:bg-violet-700'
          }`}
        >
          <Plus size={18} color="#ffffff" />
          <Text className="ml-2 text-sm font-bold text-white">
            {segment === 'students' ? 'Add Student' : 'Add Subject'}
          </Text>
        </TouchableOpacity>
      </View>

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
    </SafeAreaView>
  );
}
