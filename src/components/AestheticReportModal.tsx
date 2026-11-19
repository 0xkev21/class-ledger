import {
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  Image as ImageIcon,
  Palette,
  Settings2,
  Share2,
  Sliders,
  Sparkles,
  X,
  ZoomIn,
} from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, useTreasury } from '../context/TreasuryContext';
import { StudentFineStat } from '../types';
import {
  AestheticReportModel,
  createAestheticTheme,
  DualColumnItem,
  ReportLayoutMode,
  ReportSourceType,
  SummaryTableRow,
} from '../types/imageReport';
import {
  copyAestheticReportImage,
  downloadAestheticReportPNG,
  generateAestheticReportSVG,
  renderAestheticReportToCanvas,
  shareAestheticReportImage,
} from '../utils/aestheticImageRenderer';
import { downloadFileWeb } from '../utils/exporter';
import { formatDate, formatMMK, getTodayFormatted } from '../utils/formatters';
import { AestheticReportView } from './AestheticReportView';
import { AestheticSvgReport } from './AestheticSvgReport';
import { NativeIcon } from './NativeIcon';

interface AestheticReportModalProps {
  visible: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  initialReportType?: ReportSourceType;
  initialEventId?: string;
}

export const AestheticReportModal: React.FC<AestheticReportModalProps> = ({
  visible,
  onClose,
  onShowToast,
  initialReportType = 'student_fines',
  initialEventId,
}) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768;

  // Ref to the native SVG component for capturing PNG on native mobile
  const svgRef = useRef<any>(null);

  const {
    students,
    subjects,
    fines,
    finesSummary,
    subjectFineStats,
    studentFineStats,
    events,
    eventRecords,
    settings,
    language,
    t,
  } = useTreasury();
  const { isDark, themeColor } = useAppTheme();

  // State
  const [reportType, setReportType] = useState<ReportSourceType>(initialReportType);
  const [studentFineFilter, setStudentFineFilter] = useState<'all' | 'with_fines' | 'unpaid' | 'paid'>('all');
  const [layoutMode, setLayoutMode] = useState<ReportLayoutMode>(
    initialReportType === 'subject_fines' ? 'summary_table' : 'dual_column'
  );
  const [selectedEventId, setSelectedEventId] = useState<string>(
    initialEventId || (events[0]?.id ?? '')
  );

  // Mobile navigation tab ('preview' | 'settings')
  const [mobileTab, setMobileTab] = useState<'preview' | 'settings'>('preview');

  // Preview renderer ('svg' = scale-to-fit vector, 'view' = scrollable table)
  const [previewRenderer, setPreviewRenderer] = useState<'svg' | 'view'>('svg');

  // Custom typography overrides
  const [customWord1, setCustomWord1] = useState('');
  const [customWord2, setCustomWord2] = useState('');
  const [customMetaLeft, setCustomMetaLeft] = useState('');

  // UI state
  const [isExporting, setIsExporting] = useState(false);

  // Dynamic aesthetic theme derived directly from the active App Theme Color
  const currentTheme = useMemo(() => createAestheticTheme(themeColor), [themeColor]);

  // Maps for fast lookups
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s.name])), [subjects]);

  // Selected event
  const currentEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) || events[0],
    [events, selectedEventId]
  );

  // Build the AestheticReportModel
  const reportModel: AestheticReportModel = useMemo(() => {
    const today = getTodayFormatted();
    const metaRight = `Date: ${today}`;

    // 1. Student Fines (Roster assessment / dues)
    if (reportType === 'student_fines') {
      const title1 = customWord1.trim() || 'FINES';
      const title2 = customWord2.trim() || 'ASSESSMENT';
      const metaLeft = customMetaLeft.trim() || 'Class: Class Ledger (2025-2026)';

      const getStudentRowData = (stat: StudentFineStat) => {
        if (stat.totalAll === 0) {
          return {
            value: '—',
            status: 'neutral' as const,
          };
        }
        if (stat.totalUnpaid === 0 && stat.totalPaid > 0) {
          return {
            value: `✓ ${formatMMK(stat.totalPaid)}`,
            status: 'paid' as const,
          };
        }
        if (stat.totalUnpaid > 0 && stat.totalPaid === 0) {
          return {
            value: formatMMK(stat.totalUnpaid),
            status: 'unpaid' as const,
          };
        }
        // Partially paid: show unpaid balance due
        return {
          value: `${formatMMK(stat.totalUnpaid)} Due`,
          status: 'unpaid' as const,
        };
      };

      const filtered = studentFineStats.filter((s) => {
        if (studentFineFilter === 'with_fines') return s.totalAll > 0;
        if (studentFineFilter === 'unpaid') return s.totalUnpaid > 0;
        if (studentFineFilter === 'paid') return s.totalPaid > 0;
        return true;
      });

      const sorted = [...filtered].sort((a, b) => {
        if (studentFineFilter === 'unpaid') return b.totalUnpaid - a.totalUnpaid;
        if (studentFineFilter === 'paid') return b.totalPaid - a.totalPaid;
        if (studentFineFilter === 'with_fines') {
          if (b.totalUnpaid !== a.totalUnpaid) return b.totalUnpaid - a.totalUnpaid;
          return b.totalAll - a.totalAll;
        }
        // For 'all', preserve original roster order
        return 0;
      });

      const totalPaid = filtered.reduce((sum, s) => sum + s.totalPaid, 0);
      const totalUnpaid = filtered.reduce((sum, s) => sum + s.totalUnpaid, 0);
      const totalAll = totalPaid + totalUnpaid;

      if (layoutMode === 'dual_column') {
        const half = Math.max(Math.ceil(sorted.length / 2), 15);
        const leftItems: DualColumnItem[] = [];
        const rightItems: DualColumnItem[] = [];

        for (let i = 0; i < half; i++) {
          const leftStat = sorted[i];
          if (leftStat) {
            const rowData = getStudentRowData(leftStat);
            leftItems.push({
              index: i + 1,
              label: leftStat.student.name,
              subLabel: leftStat.student.rollNumber,
              value: rowData.value,
              status: rowData.status,
            });
          } else {
            leftItems.push({ index: i + 1, label: '' });
          }

          const rightIdx = i + half;
          const rightStat = sorted[rightIdx];
          if (rightStat) {
            const rowData = getStudentRowData(rightStat);
            rightItems.push({
              index: rightIdx + 1,
              label: rightStat.student.name,
              subLabel: rightStat.student.rollNumber,
              value: rowData.value,
              status: rowData.status,
            });
          } else {
            rightItems.push({ index: rightIdx + 1, label: '' });
          }
        }

        return {
          titleWord1: title1,
          titleWord2: title2,
          metadataLeft: metaLeft,
          metadataRight: metaRight,
          layoutMode: 'dual_column',
          theme: currentTheme,
          leftItems,
          rightItems,
          stats: [
            { label: 'Total Paid', value: formatMMK(totalPaid), color: '#166534' },
            { label: 'Total Owed', value: formatMMK(totalUnpaid), color: '#991B1B' },
            { label: 'Overall Total', value: formatMMK(totalAll) },
          ],
          footerNote: 'Class Ledger • Student Fine Assessment Sheet',
        };
      } else {
        // Summary Table layout for students
        const tableRows: SummaryTableRow[] = sorted.map((s, idx) => ({
          no: idx + 1,
          title: s.student.name + (s.student.rollNumber ? ` (${s.student.rollNumber})` : ''),
          col1: formatMMK(s.totalPaid),
          col2: formatMMK(s.totalUnpaid),
          col3: formatMMK(s.totalAll),
        }));

        return {
          titleWord1: title1,
          titleWord2: title2,
          metadataLeft: metaLeft,
          metadataRight: metaRight,
          layoutMode: 'summary_table',
          theme: currentTheme,
          leftItems: [],
          rightItems: [],
          tableHeaders: ['No.', 'Student Name', 'Paid', 'Unpaid', 'Total'],
          tableRows,
          tableFooterRow: {
            title: 'TOTAL',
            col1: formatMMK(totalPaid),
            col2: formatMMK(totalUnpaid),
            col3: formatMMK(totalAll),
          },
          stats: [
            { label: 'Total Paid', value: formatMMK(totalPaid), color: '#166534' },
            { label: 'Total Owed', value: formatMMK(totalUnpaid), color: '#991B1B' },
            { label: 'Overall Total', value: formatMMK(totalAll) },
          ],
          footerNote: 'Class Ledger • Detailed Student Dues Ledger',
        };
      }
    }

    // 2. Subject Fines Breakdown
    if (reportType === 'subject_fines') {
      const title1 = customWord1.trim() || 'SUBJECT';
      const title2 = customWord2.trim() || 'SUMMARY';
      const metaLeft = customMetaLeft.trim() || 'Report: Subject Fine Analysis';

      if (layoutMode === 'dual_column') {
        const half = Math.max(Math.ceil(subjectFineStats.length / 2), 15);
        const leftItems: DualColumnItem[] = [];
        const rightItems: DualColumnItem[] = [];

        for (let i = 0; i < half; i++) {
          const l = subjectFineStats[i];
          if (l) {
            leftItems.push({
              index: i + 1,
              label: l.subject.name,
              subLabel: `${l.count} items`,
              value: l.totalAll > 0 ? formatMMK(l.totalAll) : '—',
              status: l.totalAll === 0 ? 'neutral' : l.totalUnpaid > 0 ? 'unpaid' : 'paid',
            });
          } else {
            leftItems.push({ index: i + 1, label: '' });
          }

          const rIdx = i + half;
          const r = subjectFineStats[rIdx];
          if (r) {
            rightItems.push({
              index: rIdx + 1,
              label: r.subject.name,
              subLabel: `${r.count} items`,
              value: r.totalAll > 0 ? formatMMK(r.totalAll) : '—',
              status: r.totalAll === 0 ? 'neutral' : r.totalUnpaid > 0 ? 'unpaid' : 'paid',
            });
          } else {
            rightItems.push({ index: rIdx + 1, label: '' });
          }
        }

        return {
          titleWord1: title1,
          titleWord2: title2,
          metadataLeft: metaLeft,
          metadataRight: metaRight,
          layoutMode: 'dual_column',
          theme: currentTheme,
          leftItems,
          rightItems,
          stats: [
            { label: 'Paid Fines', value: formatMMK(finesSummary.totalPaid), color: '#166534' },
            { label: 'Unpaid Fines', value: formatMMK(finesSummary.totalUnpaid), color: '#991B1B' },
            { label: 'Total Fine Pool', value: formatMMK(finesSummary.totalAll) },
          ],
          footerNote: 'Class Ledger • Subject Fine Summary',
        };
      } else {
        const tableRows: SummaryTableRow[] = subjectFineStats.map((st, idx) => ({
          no: idx + 1,
          title: st.subject.name,
          subtitle: `${st.count} incidents`,
          col1: formatMMK(st.totalPaid),
          col2: formatMMK(st.totalUnpaid),
          col3: formatMMK(st.totalAll),
        }));

        return {
          titleWord1: title1,
          titleWord2: title2,
          metadataLeft: metaLeft,
          metadataRight: metaRight,
          layoutMode: 'summary_table',
          theme: currentTheme,
          leftItems: [],
          rightItems: [],
          tableHeaders: ['No.', 'Subject / Department', 'Paid', 'Unpaid', 'Total'],
          tableRows,
          tableFooterRow: {
            title: 'TOTAL',
            col1: formatMMK(finesSummary.totalPaid),
            col2: formatMMK(finesSummary.totalUnpaid),
            col3: formatMMK(finesSummary.totalAll),
          },
          stats: [
            { label: 'Paid Fines', value: formatMMK(finesSummary.totalPaid), color: '#166534' },
            { label: 'Unpaid Fines', value: formatMMK(finesSummary.totalUnpaid), color: '#991B1B' },
            { label: 'Total Fine Pool', value: formatMMK(finesSummary.totalAll) },
          ],
          footerNote: 'Class Ledger • End of Year Subject Analysis',
        };
      }
    }

    // 3. Event Contributions / Donors
    if (reportType === 'event_donors') {
      const ev = currentEvent;
      const evName = ev ? ev.name : 'EVENT';
      const title1 = customWord1.trim() || (ev?.type === 'donation' ? 'DONATION' : 'CONTRIBUTION');
      const title2 = customWord2.trim() || 'RECORD';
      const metaLeft = customMetaLeft.trim() || `Event: ${evName}`;

      const records = ev ? eventRecords.filter((r) => r.eventId === ev.id) : [];
      const totalCollected = records.filter((r) => r.isPaid).reduce((sum, r) => sum + r.amount, 0);

      if (layoutMode === 'dual_column') {
        const half = Math.max(Math.ceil(records.length / 2), 15);
        const leftItems: DualColumnItem[] = [];
        const rightItems: DualColumnItem[] = [];

        for (let i = 0; i < half; i++) {
          const lRec = records[i];
          if (lRec) {
            const student = studentMap.get(lRec.studentId);
            leftItems.push({
              index: i + 1,
              label: student?.name || 'Unknown',
              subLabel: student?.rollNumber,
              value: formatMMK(lRec.amount),
              status: lRec.isPaid ? 'paid' : 'unpaid',
            });
          } else {
            leftItems.push({ index: i + 1, label: '' });
          }

          const rIdx = i + half;
          const rRec = records[rIdx];
          if (rRec) {
            const student = studentMap.get(rRec.studentId);
            rightItems.push({
              index: rIdx + 1,
              label: student?.name || 'Unknown',
              subLabel: student?.rollNumber,
              value: formatMMK(rRec.amount),
              status: rRec.isPaid ? 'paid' : 'unpaid',
            });
          } else {
            rightItems.push({ index: rIdx + 1, label: '' });
          }
        }

        return {
          titleWord1: title1,
          titleWord2: title2,
          metadataLeft: metaLeft,
          metadataRight: metaRight,
          layoutMode: 'dual_column',
          theme: currentTheme,
          leftItems,
          rightItems,
          stats: [
            { label: 'Total Donors', value: `${records.length} Persons` },
            { label: 'Total Collected', value: formatMMK(totalCollected), color: '#166534' },
          ],
          footerNote: `Class Ledger • ${evName} Participation Record`,
        };
      } else {
        const tableRows: SummaryTableRow[] = records.map((rec, idx) => {
          const student = studentMap.get(rec.studentId);
          return {
            no: idx + 1,
            title: student?.name || 'Unknown',
            subtitle: student?.rollNumber,
            col1: rec.isPaid ? 'Paid' : 'Pending',
            col2: rec.createdAt ? formatDate(rec.createdAt) : '-',
            col3: formatMMK(rec.amount),
          };
        });

        return {
          titleWord1: title1,
          titleWord2: title2,
          metadataLeft: metaLeft,
          metadataRight: metaRight,
          layoutMode: 'summary_table',
          theme: currentTheme,
          leftItems: [],
          rightItems: [],
          tableHeaders: ['No.', 'Contributor Name', 'Status', 'Date', 'Amount'],
          tableRows,
          tableFooterRow: {
            title: 'TOTAL COLLECTED',
            col1: '',
            col2: '',
            col3: formatMMK(totalCollected),
          },
          stats: [
            { label: 'Total Contributors', value: `${records.length} Persons` },
            { label: 'Total Amount', value: formatMMK(totalCollected), color: '#166534' },
          ],
          footerNote: `Class Ledger • ${evName} Donor List`,
        };
      }
    }

    // 4. Complete Fines Ledger (Chronological)
    const title1 = customWord1.trim() || 'FINES';
    const title2 = customWord2.trim() || 'LEDGER';
    const metaLeft = customMetaLeft.trim() || 'Class Ledger Complete Fines Log';

    const recentFines = [...fines].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const tableRows: SummaryTableRow[] = recentFines.slice(0, 30).map((f, idx) => {
      const student = studentMap.get(f.studentId);
      const subject = subjectMap.get(f.subjectId) || 'General';
      return {
        no: idx + 1,
        title: `${student?.name || 'Unknown'} (${subject})`,
        col1: f.isPaid ? 'Paid' : 'Unpaid',
        col2: formatDate(f.date),
        col3: formatMMK(f.amount),
      };
    });

    return {
      titleWord1: title1,
      titleWord2: title2,
      metadataLeft: metaLeft,
      metadataRight: metaRight,
      layoutMode: 'summary_table',
      theme: currentTheme,
      leftItems: [],
      rightItems: [],
      tableHeaders: ['No.', 'Student & Subject', 'Status', 'Date', 'Amount'],
      tableRows,
      tableFooterRow: {
        title: 'TOTAL LOGGED',
        col1: '',
        col2: '',
        col3: formatMMK(finesSummary.totalAll),
      },
      stats: [
        { label: 'Paid Fines', value: formatMMK(finesSummary.totalPaid), color: '#166534' },
        { label: 'Unpaid Fines', value: formatMMK(finesSummary.totalUnpaid), color: '#991B1B' },
        { label: 'Overall', value: formatMMK(finesSummary.totalAll) },
      ],
      footerNote: 'Class Ledger • Class Fines Ledger Records',
    };
  }, [
    reportType,
    customWord1,
    customWord2,
    customMetaLeft,
    layoutMode,
    currentTheme,
    studentFineStats,
    subjectFineStats,
    finesSummary,
    currentEvent,
    eventRecords,
    studentMap,
    subjectMap,
    fines,
    studentFineFilter,
  ]);

  // Helper to get Base64 PNG from Svg ref on native mobile
  const getNativePngBase64 = (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!svgRef.current || typeof svgRef.current.toDataURL !== 'function') {
        resolve(null);
        return;
      }
      try {
        svgRef.current.toDataURL((data: string) => {
          if (data) {
            resolve(data.startsWith('data:') ? data : `data:image/png;base64,${data}`);
          } else {
            resolve(null);
          }
        });
      } catch (err) {
        console.error('Error invoking svg toDataURL:', err);
        resolve(null);
      }
    });
  };

  // Handle Download PNG (Mobile & Web)
  const handleDownloadPNG = async () => {
    setIsExporting(true);
    const filename = `ec_report_${reportType}_${Date.now()}.png`;

    try {
      // 1. Mobile (Android & iOS)
      if (Platform.OS !== 'web') {
        const base64Png = await getNativePngBase64();
        if (base64Png) {
          const FileSystem = require('expo-file-system/legacy');
          const fileUri = `${FileSystem.cacheDirectory}${filename}`;
          const cleanData = base64Png.replace(/^data:image\/\w+;base64,/, '');

          await FileSystem.writeAsStringAsync(fileUri, cleanData, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const Sharing = require('expo-sharing');
          const isSharingAvailable = await Sharing.isAvailableAsync();
          if (isSharingAvailable) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'image/png',
              dialogTitle: 'Save / Share Report Image',
            });
            onShowToast('Report Image ထုတ်ယူပြီးပါပြီ (PNG)');
          } else {
            onShowToast('PNG Image ကို Cache ထဲသို့ သိမ်းဆည်းပြီးပါပြီ');
          }
          return;
        }

        // Fallback for native if toDataURL failed: share SVG
        handleExportSVG();
        return;
      }

      // 2. Web / Desktop (Canvas 2D)
      const result = await renderAestheticReportToCanvas(reportModel);
      if (result) {
        const success = downloadAestheticReportPNG(result.dataUrl, filename);
        if (success) {
          onShowToast('Aesthetic Report Image ဒေါင်းလုဒ်လုပ်ပြီးပါပြီ (PNG)');
        } else {
          onShowToast('Image ကို ဒေါင်းလုဒ်မလုပ်နိုင်ပါ');
        }
      } else {
        handleExportSVG();
      }
    } catch (e) {
      console.error('Download PNG failed:', e);
      onShowToast('Image ထုတ်ယူရာတွင် အမှားဖြစ်ပေါ်ပါသည်');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Copy Image
  const handleCopyImage = async () => {
    setIsExporting(true);
    try {
      if (Platform.OS === 'web') {
        const result = await renderAestheticReportToCanvas(reportModel);
        if (result?.blob) {
          const success = await copyAestheticReportImage(result.blob);
          if (success) {
            onShowToast('Image ကို Clipboard သို့ ကူးယူပြီးပါပြီ! Viber/Telegram တွင် Paste လုပ်နိုင်ပါသည်');
            return;
          }
        }
      } else {
        // On mobile, trigger PNG save/share
        await handleDownloadPNG();
        return;
      }
      onShowToast('Image ကို Download လုပ်ပြီး အသုံးပြုပါ');
    } catch (e) {
      console.error('Copy image failed:', e);
      onShowToast('Image ကူးယူရာတွင် အမှားဖြစ်ပေါ်ပါသည်');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Share Image
  const handleShareImage = async () => {
    setIsExporting(true);
    const filename = `ec_report_${reportType}_${Date.now()}.png`;

    try {
      if (Platform.OS !== 'web') {
        const base64Png = await getNativePngBase64();
        if (base64Png) {
          const FileSystem = require('expo-file-system/legacy');
          const fileUri = `${FileSystem.cacheDirectory}${filename}`;
          const cleanData = base64Png.replace(/^data:image\/\w+;base64,/, '');

          await FileSystem.writeAsStringAsync(fileUri, cleanData, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const Sharing = require('expo-sharing');
          await Sharing.shareAsync(fileUri, {
            mimeType: 'image/png',
            dialogTitle: 'Share Aesthetic Report Image',
          });
          onShowToast('Report Image မျှဝေခြင်း ပြီးစီးပါပြီ');
          return;
        }
      } else {
        const result = await renderAestheticReportToCanvas(reportModel);
        if (result) {
          const shared = await shareAestheticReportImage(filename, result.dataUrl, result.blob);
          if (shared) {
            onShowToast('Report Image မျှဝေခြင်း ပြီးစီးပါပြီ');
            return;
          }
        }
      }
      onShowToast('Share မပြုလုပ်နိုင်ပါ (Download ခလုတ်ကို အသုံးပြုပါ)');
    } catch (e) {
      console.error('Share failed:', e);
      onShowToast('Image မျှဝေရာတွင် အမှားဖြစ်ပေါ်ပါသည်');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Export SVG (works on both Web & Native)
  const handleExportSVG = async () => {
    try {
      const svg = generateAestheticReportSVG(reportModel);
      const filename = `ec_report_${reportType}_${Date.now()}.svg`;

      if (Platform.OS === 'web') {
        downloadFileWeb(filename, svg, 'image/svg+xml;charset=utf-8;');
        onShowToast('Aesthetic Report Vector SVG ဖိုင် ဒေါင်းလုဒ်လုပ်ပြီးပါပြီ');
      } else {
        const FileSystem = require('expo-file-system/legacy');
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, svg);

        const Sharing = require('expo-sharing');
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/svg+xml',
          dialogTitle: 'Share Vector SVG Report',
        });
        onShowToast('SVG Vector ဖိုင် ထုတ်ယူပြီးပါပြီ');
      }
    } catch (e) {
      console.error('SVG export failed:', e);
      onShowToast('SVG ထုတ်ယူရာတွင် အမှားဖြစ်ပေါ်ပါသည်');
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-slate-100 dark:bg-zinc-950">
        {/* Top Header Bar */}
        <View
          style={{ paddingTop: Math.max(insets.top, 12), borderCurve: 'continuous' }}
          className="bg-white dark:bg-zinc-900 px-4 pb-3 border-b border-slate-200 dark:border-zinc-800 flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View
              style={{ backgroundColor: themeColor.surface }}
              className="h-8 w-8 rounded-full items-center justify-center mr-2.5 shrink-0"
            >
              <NativeIcon
                sfSymbol="photo.artframe"
                materialName="image"
                FallbackIcon={ImageIcon}
                size={16}
                color={themeColor.primary}
              />
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                {t.modals.aesthetic.title}
              </Text>
              <Text numberOfLines={1} className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {t.modals.aesthetic.subtitle}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center shrink-0"
          >
            <NativeIcon
              sfSymbol="xmark"
              materialName="close"
              FallbackIcon={X}
              size={16}
              color="#71717a"
            />
          </TouchableOpacity>
        </View>

        {/* Mobile Segmented Navigation Tabs */}
        {!isLargeScreen && (
          <View className="flex-row bg-white dark:bg-zinc-900 px-4 py-2 border-b border-slate-200 dark:border-zinc-800 items-center justify-between">
            <View className="flex-row p-1 bg-slate-100 dark:bg-zinc-800 rounded-full flex-1 mr-3">
              <TouchableOpacity
                onPress={() => setMobileTab('preview')}
                style={{ borderCurve: 'continuous' }}
                className={`flex-1 py-1.5 rounded-full items-center justify-center flex-row ${
                  mobileTab === 'preview' ? 'bg-white dark:bg-zinc-900 shadow-sm' : ''
                }`}
              >
                <NativeIcon
                  sfSymbol="eye.fill"
                  materialName="visibility"
                  FallbackIcon={Eye}
                  size={13}
                  color={mobileTab === 'preview' ? themeColor.primary : '#71717a'}
                />
                <Text
                  className={`ml-1 text-xs font-bold ${
                    mobileTab === 'preview'
                      ? 'text-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {t.modals.aesthetic.previewTab}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMobileTab('settings')}
                style={{ borderCurve: 'continuous' }}
                className={`flex-1 py-1.5 rounded-full items-center justify-center flex-row ${
                  mobileTab === 'settings' ? 'bg-white dark:bg-zinc-900 shadow-sm' : ''
                }`}
              >
                <NativeIcon
                  sfSymbol="slider.horizontal.3"
                  materialName="tune"
                  FallbackIcon={Sliders}
                  size={13}
                  color={mobileTab === 'settings' ? themeColor.primary : '#71717a'}
                />
                <Text
                  className={`ml-1 text-xs font-bold ${
                    mobileTab === 'settings'
                      ? 'text-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {t.modals.aesthetic.optionsTab}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Layout Mode Pill */}
            <TouchableOpacity
              onPress={() =>
                setLayoutMode(layoutMode === 'dual_column' ? 'summary_table' : 'dual_column')
              }
              style={{
                backgroundColor: themeColor.surface,
                borderColor: themeColor.border,
                borderCurve: 'continuous',
              }}
              className="px-2.5 py-1.5 rounded-full border"
            >
              <Text style={{ color: themeColor.text }} className="text-[10px] font-bold">
                {layoutMode === 'dual_column' ? '📄 ' + t.modals.aesthetic.layoutDual : '📊 ' + t.modals.aesthetic.layoutTable}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Active App Theme Indicator */}
        <View className="bg-white/90 dark:bg-zinc-900/90 px-4 py-2 border-b border-slate-200 dark:border-zinc-800 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: themeColor.primary }}
              className="w-3.5 h-3.5 rounded-full mr-2 shadow-xs"
            />
            <Text className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 font-mono">
              HEX: {themeColor.primary}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: themeColor.surface,
              borderColor: themeColor.border,
              borderCurve: 'continuous',
            }}
            className="px-2.5 py-0.5 rounded-full border"
          >
            <Text style={{ color: themeColor.text }} className="text-[10px] font-semibold">
              {language === 'en' ? 'Theme Synced' : 'Theme နှင့် တစ်ပြေးညီ'}
            </Text>
          </View>
        </View>

        {/* Main Content Area */}
        <View className="flex-1 flex-col md:flex-row">
          {/* Controls Panel (Desktop: Left Column | Mobile: Settings Tab) */}
          {(isLargeScreen || mobileTab === 'settings') && (
            <ScrollView
              className={`p-4 md:w-96 md:border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 ${
                isLargeScreen ? 'max-w-md' : 'flex-1'
              }`}
              showsVerticalScrollIndicator={false}
            >
              {/* 1. Report Type Selector */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  {language === 'en' ? '1. Report Type' : '၁။ အစီရင်ခံစာ အမျိုးအစား'}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { id: 'student_fines', label: `📋 ${t.modals.aesthetic.sourceStudentFines}` },
                    { id: 'subject_fines', label: `📊 ${t.modals.aesthetic.sourceSubjectFines}` },
                    { id: 'event_donors', label: `🎯 ${t.modals.aesthetic.sourceEventDonors}` },
                    { id: 'fines_ledger', label: `📑 ${t.modals.aesthetic.sourceFinesLedger}` },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setReportType(item.id as ReportSourceType)}
                      style={{ borderCurve: 'continuous' }}
                      className={`flex-1 min-w-[130px] px-3 py-2.5 rounded-xl border ${
                        reportType === item.id
                          ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white'
                          : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold text-center ${
                          reportType === item.id
                            ? 'text-white dark:text-zinc-900'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Student Fine Filter Selector if student_fines */}
              {reportType === 'student_fines' && (
                <View className="mb-4 p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200 dark:border-zinc-700">
                  <Text className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-2">
                    {language === 'en' ? 'Filter Students:' : 'ကျောင်းသား စစ်ထုတ်ရန်:'}
                  </Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: t.modals.aesthetic.filterAll },
                      { id: 'with_fines', label: t.modals.aesthetic.filterWithFines },
                      { id: 'unpaid', label: t.modals.aesthetic.filterUnpaid },
                      { id: 'paid', label: t.modals.aesthetic.filterPaid },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => setStudentFineFilter(item.id as any)}
                        style={{
                          backgroundColor:
                            studentFineFilter === item.id
                              ? themeColor.primary
                              : isDark
                              ? '#18181b'
                              : '#ffffff',
                          borderColor:
                            studentFineFilter === item.id
                              ? themeColor.primary
                              : isDark
                              ? '#3f3f46'
                              : '#e4e4e7',
                          borderCurve: 'continuous',
                        }}
                        className="px-2.5 py-1.5 rounded-lg border"
                      >
                        <Text
                          style={{
                            color:
                              studentFineFilter === item.id
                                ? themeColor.onPrimary
                                : isDark
                                ? '#d4d4d8'
                                : '#27272a',
                          }}
                          className="text-[11px] font-bold"
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Event Selector if event_donors */}
              {reportType === 'event_donors' && events.length > 0 && (
                <View className="mb-4 p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200 dark:border-zinc-700">
                  <Text className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-2">
                    {language === 'en' ? 'Selected Event:' : 'ရွေးချယ်ထားသော အခမ်းအနား:'}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {events.map((ev) => (
                      <TouchableOpacity
                        key={ev.id}
                        onPress={() => setSelectedEventId(ev.id)}
                        style={{
                          backgroundColor:
                            selectedEventId === ev.id
                              ? themeColor.primary
                              : isDark
                              ? '#18181b'
                              : '#ffffff',
                          borderColor:
                            selectedEventId === ev.id
                              ? themeColor.primary
                              : isDark
                              ? '#3f3f46'
                              : '#e4e4e7',
                          borderCurve: 'continuous',
                        }}
                        className="px-3 py-1.5 rounded-lg border"
                      >
                        <Text
                          style={{
                            color:
                              selectedEventId === ev.id
                                ? themeColor.onPrimary
                                : isDark
                                ? '#d4d4d8'
                                : '#27272a',
                          }}
                          className="text-xs font-bold"
                        >
                          {ev.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* 2. Layout Mode Switcher */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  {language === 'en' ? '2. Layout' : '၂။ ဇယားပုံစံ'}
                </Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setLayoutMode('dual_column')}
                    style={{
                      backgroundColor: layoutMode === 'dual_column' ? themeColor.surface : undefined,
                      borderColor: layoutMode === 'dual_column' ? themeColor.primary : (isDark ? '#3f3f46' : '#e4e4e7'),
                      borderCurve: 'continuous',
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl border items-center ${
                      layoutMode === 'dual_column'
                        ? ''
                        : 'bg-slate-50 dark:bg-zinc-800'
                    }`}
                  >
                    <Text
                      style={{
                        color: layoutMode === 'dual_column' ? themeColor.text : (isDark ? '#d4d4d8' : '#52525b'),
                      }}
                      className="text-xs font-bold"
                    >
                      📄 {t.modals.aesthetic.layoutDual}
                    </Text>
                    <Text className="text-[10px] text-zinc-400 mt-0.5">
                      {language === 'en' ? '2-column sheet' : 'ကော်လံ ၂ ခု ခွဲထားသော ပုံစံ'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setLayoutMode('summary_table')}
                    style={{
                      backgroundColor: layoutMode === 'summary_table' ? themeColor.surface : undefined,
                      borderColor: layoutMode === 'summary_table' ? themeColor.primary : (isDark ? '#3f3f46' : '#e4e4e7'),
                      borderCurve: 'continuous',
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl border items-center ${
                      layoutMode === 'summary_table'
                        ? ''
                        : 'bg-slate-50 dark:bg-zinc-800'
                    }`}
                  >
                    <Text
                      style={{
                        color: layoutMode === 'summary_table' ? themeColor.text : (isDark ? '#d4d4d8' : '#52525b'),
                      }}
                      className="text-xs font-bold"
                    >
                      📊 {t.modals.aesthetic.layoutTable}
                    </Text>
                    <Text className="text-[10px] text-zinc-400 mt-0.5">
                      {language === 'en' ? 'Structured table' : 'ဇယားကွက်ပုံစံ'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 3. Title Customizer (Optional) */}
              <View className="mb-5 pt-3 border-t border-slate-200 dark:border-zinc-800">
                <Text className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  {language === 'en' ? 'Custom Title (Optional)' : 'ခေါင်းစဉ် စိတ်ကြိုက်ပြင်ရန်'}
                </Text>
                <View className="flex-row gap-2 mb-2">
                  <TextInput
                    placeholder={reportModel.titleWord1}
                    placeholderTextColor="#9ca3af"
                    value={customWord1}
                    onChangeText={setCustomWord1}
                    style={{ borderCurve: 'continuous' }}
                    className="flex-1 rounded-xl bg-slate-100 dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-50"
                  />
                  <TextInput
                    placeholder={reportModel.titleWord2}
                    placeholderTextColor="#9ca3af"
                    value={customWord2}
                    onChangeText={setCustomWord2}
                    style={{ borderCurve: 'continuous' }}
                    className="flex-1 rounded-xl bg-slate-100 dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-50"
                  />
                </View>
                <TextInput
                  placeholder="Subtitle e.g. Class: Class Ledger (2025-2026)"
                  placeholderTextColor="#9ca3af"
                  value={customMetaLeft}
                  onChangeText={setCustomMetaLeft}
                  style={{ borderCurve: 'continuous' }}
                  className="w-full rounded-xl bg-slate-100 dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-50"
                />
              </View>

              {!isLargeScreen && (
                <TouchableOpacity
                  onPress={() => setMobileTab('preview')}
                  style={{
                    backgroundColor: themeColor.primary,
                    borderCurve: 'continuous',
                  }}
                  className="w-full py-3.5 rounded-full items-center justify-center shadow-sm mb-6"
                >
                  <Text style={{ color: themeColor.onPrimary }} className="text-xs font-bold">
                    {language === 'en' ? 'Back to Preview' : 'အစမ်းမြင်ကွင်းသို့ ပြန်သွားမည်'}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {/* Preview & Action Panel (Desktop: Right Column | Mobile: Preview Tab) */}
          {(isLargeScreen || mobileTab === 'preview') && (
            <View className="flex-1 flex-col bg-slate-200/70 dark:bg-zinc-900/60 p-3 md:p-4">
              {/* Preview Mode Switcher & Scale Info Bar */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Text className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mr-2">
                    {language === 'en' ? 'Live Preview' : 'အစမ်းမြင်ကွင်း'}
                  </Text>
                  <View className="flex-row p-0.5 bg-slate-300/80 dark:bg-zinc-800 rounded-lg">
                    <TouchableOpacity
                      onPress={() => setPreviewRenderer('svg')}
                      className={`px-2 py-0.5 rounded-md ${
                        previewRenderer === 'svg' ? 'bg-white dark:bg-zinc-900' : ''
                      }`}
                    >
                      <Text
                        style={{
                          color:
                            previewRenderer === 'svg'
                              ? themeColor.primary
                              : isDark
                              ? '#a1a1aa'
                              : '#71717a',
                        }}
                        className="text-[10px] font-bold"
                      >
                        Fit to Screen
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setPreviewRenderer('view')}
                      className={`px-2 py-0.5 rounded-md ${
                        previewRenderer === 'view' ? 'bg-white dark:bg-zinc-900' : ''
                      }`}
                    >
                      <Text
                        style={{
                          color:
                            previewRenderer === 'view'
                              ? themeColor.primary
                              : isDark
                              ? '#a1a1aa'
                              : '#71717a',
                        }}
                        className="text-[10px] font-bold"
                      >
                        Detail View
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <View
                    style={{ backgroundColor: currentTheme.frameColor, borderColor: themeColor.primary }}
                    className="w-3.5 h-3.5 rounded-full mr-1.5 border"
                  />
                  <Text className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                    {currentTheme.name}
                  </Text>
                </View>
              </View>

              {/* Scrollable Aesthetic Preview Card */}
              <ScrollView
                className="flex-1 rounded-2xl bg-white dark:bg-zinc-900 p-2 md:p-3 shadow-inner border border-slate-300 dark:border-zinc-800"
                contentContainerStyle={{
                  alignItems: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 2,
                }}
                showsVerticalScrollIndicator={false}
              >
                <View className="w-full max-w-2xl">
                  {previewRenderer === 'svg' ? (
                    /* Scale-to-Fit Native Vector SVG (Never Cropped or Collapsed on Mobile) */
                    <AestheticSvgReport ref={svgRef} model={reportModel} />
                  ) : (
                    /* Detailed Scrollable View Component */
                    <AestheticReportView model={reportModel} />
                  )}
                </View>
              </ScrollView>

              {/* Hidden offscreen Svg component for capturing PNG if previewRenderer is 'view' */}
              {previewRenderer === 'view' && (
                <View
                  style={{
                    position: 'absolute',
                    opacity: 0.01,
                    pointerEvents: 'none',
                    left: -9999,
                    width: 1200,
                  }}
                >
                  <AestheticSvgReport ref={svgRef} model={reportModel} />
                </View>
              )}

              {/* Export Action Buttons Toolbar */}
              <View className="pt-3 flex-row flex-wrap gap-2 items-center justify-between">
                {/* Copy Image Button */}
                <TouchableOpacity
                  onPress={handleCopyImage}
                  disabled={isExporting}
                  style={{ borderCurve: 'continuous' }}
                  className="flex-row items-center justify-center bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 px-3.5 py-3 rounded-full active:bg-slate-100"
                >
                  <NativeIcon
                    sfSymbol="doc.on.doc"
                    materialName="content-copy"
                    FallbackIcon={Copy}
                    size={14}
                    color="#4f46e5"
                  />
                  <Text className="ml-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {t.modals.aesthetic.copyImage}
                  </Text>
                </TouchableOpacity>

                {/* Share Image Button */}
                <TouchableOpacity
                  onPress={handleShareImage}
                  disabled={isExporting}
                  style={{ borderCurve: 'continuous' }}
                  className="flex-row items-center justify-center bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 px-3.5 py-3 rounded-full active:bg-slate-100"
                >
                  <NativeIcon
                    sfSymbol="square.and.arrow.up"
                    materialName="share"
                    FallbackIcon={Share2}
                    size={14}
                    color="#0284c7"
                  />
                  <Text className="ml-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                    {t.modals.aesthetic.shareImage}
                  </Text>
                </TouchableOpacity>

                {/* SVG Vector Button */}
                <TouchableOpacity
                  onPress={handleExportSVG}
                  disabled={isExporting}
                  style={{ borderCurve: 'continuous' }}
                  className="flex-row items-center justify-center bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 px-3 py-3 rounded-full active:bg-slate-100"
                >
                  <Text className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                    SVG
                  </Text>
                </TouchableOpacity>

                {/* Primary Action: Download High-Res PNG Button */}
                <TouchableOpacity
                  onPress={handleDownloadPNG}
                  disabled={isExporting}
                  style={{
                    backgroundColor: themeColor.primary,
                    borderCurve: 'continuous',
                  }}
                  className="flex-1 min-w-[150px] flex-row items-center justify-center px-4 py-3 rounded-full shadow-sm"
                >
                  {isExporting ? (
                    <ActivityIndicator size="small" color={themeColor.onPrimary} />
                  ) : (
                    <>
                      <NativeIcon
                        sfSymbol="arrow.down.circle.fill"
                        materialName="file-download"
                        FallbackIcon={Download}
                        size={16}
                        color={themeColor.onPrimary}
                      />
                      <Text
                        style={{ color: themeColor.onPrimary }}
                        className="ml-2 text-xs font-extrabold"
                      >
                        {t.modals.aesthetic.downloadPNG}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
