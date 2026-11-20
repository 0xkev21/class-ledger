import {
  Check,
  Copy,
  Download,
  Eye,
  Image as ImageIcon,
  Share2,
  Sliders,
  X,
} from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, useTreasury } from '../context/TreasuryContext';
import { fonts } from '../theme';
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
import { StatusPill } from './StatusPill';

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
  const { themeColor, palette } = useAppTheme();

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
            { label: 'Total Paid', value: formatMMK(totalPaid), color: '#14532d' },
            { label: 'Total Owed', value: formatMMK(totalUnpaid), color: '#78350f' },
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
            { label: 'Total Paid', value: formatMMK(totalPaid), color: '#14532d' },
            { label: 'Total Owed', value: formatMMK(totalUnpaid), color: '#78350f' },
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
            { label: 'Paid Fines', value: formatMMK(finesSummary.totalPaid), color: '#14532d' },
            { label: 'Unpaid Fines', value: formatMMK(finesSummary.totalUnpaid), color: '#78350f' },
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
            { label: 'Paid Fines', value: formatMMK(finesSummary.totalPaid), color: '#14532d' },
            { label: 'Unpaid Fines', value: formatMMK(finesSummary.totalUnpaid), color: '#78350f' },
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
            { label: 'Total Collected', value: formatMMK(totalCollected), color: '#14532d' },
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
            { label: 'Total Amount', value: formatMMK(totalCollected), color: '#14532d' },
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
        { label: 'Paid Fines', value: formatMMK(finesSummary.totalPaid), color: '#14532d' },
        { label: 'Unpaid Fines', value: formatMMK(finesSummary.totalUnpaid), color: '#78350f' },
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

  const webOutlineStyle =
    Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {};

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: palette.bg }]}>
        {/* Top Header Bar */}
        <View
          style={[
            styles.topBar,
            {
              paddingTop: Math.max(insets.top, 12),
              backgroundColor: palette.card,
              borderBottomColor: palette.line,
            },
          ]}
        >
          <View style={styles.topBarLeft}>
            <View
              style={[styles.iconBadge, { backgroundColor: themeColor.surface }]}
            >
              <NativeIcon
                sfSymbol="photo.artframe"
                materialName="image"
                FallbackIcon={ImageIcon}
                size={16}
                color={themeColor.primary}
              />
            </View>
            <View style={styles.flexMinZero}>
              <Text
                numberOfLines={1}
                style={[
                  styles.topTitle,
                  { color: palette.ink, fontFamily: fonts.semibold },
                ]}
              >
                {t.modals.aesthetic.title}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.topSub,
                  { color: palette.muted, fontFamily: fonts.regular },
                ]}
              >
                {t.modals.aesthetic.subtitle}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t.common.close}
            style={[
              styles.closeCircle,
              { backgroundColor: palette.surface },
            ]}
          >
            <NativeIcon
              sfSymbol="xmark"
              materialName="close"
              FallbackIcon={X}
              size={16}
              color={palette.subtle}
            />
          </TouchableOpacity>
        </View>

        {/* Mobile Segmented Navigation Tabs */}
        {!isLargeScreen ? (
          <View
            style={[
              styles.mobileTabBar,
              {
                backgroundColor: palette.card,
                borderBottomColor: palette.line,
              },
            ]}
          >
            <View
              style={[
                styles.mobileTabTrack,
                { backgroundColor: palette.surface },
              ]}
            >
              <Pressable
                onPress={() => setMobileTab('preview')}
                style={[
                  styles.mobileTabBtn,
                  mobileTab === 'preview'
                    ? { backgroundColor: palette.card }
                    : null,
                ]}
              >
                <NativeIcon
                  sfSymbol="eye.fill"
                  materialName="visibility"
                  FallbackIcon={Eye}
                  size={13}
                  color={
                    mobileTab === 'preview' ? themeColor.primary : palette.muted
                  }
                />
                <Text
                  style={[
                    styles.mobileTabText,
                    {
                      color:
                        mobileTab === 'preview' ? palette.ink : palette.muted,
                      fontFamily:
                        mobileTab === 'preview'
                          ? fonts.semibold
                          : fonts.medium,
                    },
                  ]}
                >
                  {t.modals.aesthetic.previewTab}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setMobileTab('settings')}
                style={[
                  styles.mobileTabBtn,
                  mobileTab === 'settings'
                    ? { backgroundColor: palette.card }
                    : null,
                ]}
              >
                <NativeIcon
                  sfSymbol="slider.horizontal.3"
                  materialName="tune"
                  FallbackIcon={Sliders}
                  size={13}
                  color={
                    mobileTab === 'settings'
                      ? themeColor.primary
                      : palette.muted
                  }
                />
                <Text
                  style={[
                    styles.mobileTabText,
                    {
                      color:
                        mobileTab === 'settings' ? palette.ink : palette.muted,
                      fontFamily:
                        mobileTab === 'settings'
                          ? fonts.semibold
                          : fonts.medium,
                    },
                  ]}
                >
                  {t.modals.aesthetic.optionsTab}
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() =>
                setLayoutMode(
                  layoutMode === 'dual_column'
                    ? 'summary_table'
                    : 'dual_column'
                )
              }
              style={[
                styles.layoutToggleChip,
                {
                  backgroundColor: themeColor.surface,
                  borderColor: themeColor.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.layoutToggleText,
                  { color: themeColor.text, fontFamily: fonts.medium },
                ]}
              >
                {layoutMode === 'dual_column'
                  ? t.modals.aesthetic.layoutDual
                  : t.modals.aesthetic.layoutTable}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Active App Theme Strip */}
        <View
          style={[
            styles.themeStrip,
            { backgroundColor: palette.bg, borderBottomColor: palette.line },
          ]}
        >
          <View style={styles.themeStripLeft}>
            <View
              style={[
                styles.themeDot,
                { backgroundColor: themeColor.primary },
              ]}
            />
            <Text
              style={[
                styles.themeHex,
                { color: palette.subtle, fontFamily: fonts.mono },
              ]}
            >
              HEX: {themeColor.primary}
            </Text>
          </View>
          <StatusPill
            variant="brand"
            label={language === 'en' ? 'Theme Synced' : 'Theme နှင့် တစ်ပြေးညီ'}
          />
        </View>

        {/* Main Content Area */}
        <View
          style={[
            styles.mainBody,
            { flexDirection: isLargeScreen ? 'row' : 'column' },
          ]}
        >
          {/* Controls Panel */}
          {isLargeScreen || mobileTab === 'settings' ? (
            <ScrollView
              style={[
                styles.controlsScroll,
                isLargeScreen
                  ? {
                      maxWidth: 390,
                      borderRightWidth: 1,
                      borderRightColor: palette.line,
                      backgroundColor: palette.card,
                    }
                  : { flex: 1, backgroundColor: palette.card },
              ]}
              contentContainerStyle={styles.controlsContent}
              showsVerticalScrollIndicator={false}
            >
              {/* 1. Report Type Selector */}
              <View style={styles.sectionBlock}>
                <Text
                  style={[
                    styles.sectionEyebrow,
                    { color: palette.muted, fontFamily: fonts.medium },
                  ]}
                >
                  {language === 'en'
                    ? '1. Report Type'
                    : '၁။ အစီရင်ခံစာ အမျိုးအစား'}
                </Text>
                <View style={styles.reportTypeGrid}>
                  {(
                    [
                      {
                        id: 'student_fines',
                        label: t.modals.aesthetic.sourceStudentFines,
                      },
                      {
                        id: 'subject_fines',
                        label: t.modals.aesthetic.sourceSubjectFines,
                      },
                      {
                        id: 'event_donors',
                        label: t.modals.aesthetic.sourceEventDonors,
                      },
                      {
                        id: 'fines_ledger',
                        label: t.modals.aesthetic.sourceFinesLedger,
                      },
                    ] as const
                  ).map((item) => {
                    const isSelected = reportType === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => setReportType(item.id)}
                        activeOpacity={0.8}
                        style={[
                          styles.reportTypeBtn,
                          {
                            backgroundColor: isSelected
                              ? palette.ink
                              : palette.surface,
                            borderColor: isSelected
                              ? palette.ink
                              : palette.line,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.reportTypeText,
                            {
                              color: isSelected ? palette.bg : palette.ink,
                              fontFamily: fonts.medium,
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Student Filter Selector */}
              {reportType === 'student_fines' ? (
                <View
                  style={[
                    styles.subFilterBox,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.subFilterLabel,
                      { color: palette.subtle, fontFamily: fonts.medium },
                    ]}
                  >
                    {language === 'en'
                      ? 'Filter Students:'
                      : 'ကျောင်းသား စစ်ထုတ်ရန်:'}
                  </Text>
                  <View style={styles.filterChipsWrap}>
                    {(
                      [
                        { id: 'all', label: t.modals.aesthetic.filterAll },
                        {
                          id: 'with_fines',
                          label: t.modals.aesthetic.filterWithFines,
                        },
                        {
                          id: 'unpaid',
                          label: t.modals.aesthetic.filterUnpaid,
                        },
                        { id: 'paid', label: t.modals.aesthetic.filterPaid },
                      ] as const
                    ).map((item) => {
                      const isSelected = studentFineFilter === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => setStudentFineFilter(item.id)}
                          activeOpacity={0.8}
                          style={[
                            styles.filterChip,
                            {
                              backgroundColor: isSelected
                                ? themeColor.primary
                                : palette.card,
                              borderColor: isSelected
                                ? themeColor.primary
                                : palette.line,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              {
                                color: isSelected
                                  ? themeColor.onPrimary
                                  : palette.ink,
                                fontFamily: fonts.medium,
                              },
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {/* Event Selector */}
              {reportType === 'event_donors' && events.length > 0 ? (
                <View
                  style={[
                    styles.subFilterBox,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.subFilterLabel,
                      { color: palette.subtle, fontFamily: fonts.medium },
                    ]}
                  >
                    {language === 'en'
                      ? 'Selected Event:'
                      : 'ရွေးချယ်ထားသော အခမ်းအနား:'}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.eventChipsScroll}
                  >
                    {events.map((ev) => {
                      const isSelected = selectedEventId === ev.id;
                      return (
                        <TouchableOpacity
                          key={ev.id}
                          onPress={() => setSelectedEventId(ev.id)}
                          activeOpacity={0.8}
                          style={[
                            styles.filterChip,
                            {
                              backgroundColor: isSelected
                                ? themeColor.primary
                                : palette.card,
                              borderColor: isSelected
                                ? themeColor.primary
                                : palette.line,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              {
                                color: isSelected
                                  ? themeColor.onPrimary
                                  : palette.ink,
                                fontFamily: fonts.medium,
                              },
                            ]}
                          >
                            {ev.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              {/* 2. Layout Mode Switcher */}
              <View style={styles.sectionBlock}>
                <Text
                  style={[
                    styles.sectionEyebrow,
                    { color: palette.muted, fontFamily: fonts.medium },
                  ]}
                >
                  {language === 'en' ? '2. Layout' : '၂။ ဇယားပုံစံ'}
                </Text>
                <View style={styles.layoutCardsRow}>
                  <TouchableOpacity
                    onPress={() => setLayoutMode('dual_column')}
                    activeOpacity={0.8}
                    style={[
                      styles.layoutModeCard,
                      {
                        backgroundColor:
                          layoutMode === 'dual_column'
                            ? themeColor.surface
                            : palette.surface,
                        borderColor:
                          layoutMode === 'dual_column'
                            ? themeColor.primary
                            : palette.line,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.layoutCardTitle,
                        {
                          color:
                            layoutMode === 'dual_column'
                              ? themeColor.text
                              : palette.ink,
                          fontFamily: fonts.semibold,
                        },
                      ]}
                    >
                      {t.modals.aesthetic.layoutDual}
                    </Text>
                    <Text
                      style={[
                        styles.layoutCardSub,
                        { color: palette.muted, fontFamily: fonts.regular },
                      ]}
                    >
                      {language === 'en'
                        ? '2-column sheet'
                        : 'ကော်လံ ၂ ခု ခွဲထားသော ပုံစံ'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setLayoutMode('summary_table')}
                    activeOpacity={0.8}
                    style={[
                      styles.layoutModeCard,
                      {
                        backgroundColor:
                          layoutMode === 'summary_table'
                            ? themeColor.surface
                            : palette.surface,
                        borderColor:
                          layoutMode === 'summary_table'
                            ? themeColor.primary
                            : palette.line,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.layoutCardTitle,
                        {
                          color:
                            layoutMode === 'summary_table'
                              ? themeColor.text
                              : palette.ink,
                          fontFamily: fonts.semibold,
                        },
                      ]}
                    >
                      {t.modals.aesthetic.layoutTable}
                    </Text>
                    <Text
                      style={[
                        styles.layoutCardSub,
                        { color: palette.muted, fontFamily: fonts.regular },
                      ]}
                    >
                      {language === 'en' ? 'Structured table' : 'ဇယားကွက်ပုံစံ'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 3. Custom Title */}
              <View
                style={[
                  styles.customTitleSection,
                  { borderTopColor: palette.line },
                ]}
              >
                <Text
                  style={[
                    styles.sectionEyebrow,
                    { color: palette.muted, fontFamily: fonts.medium },
                  ]}
                >
                  {language === 'en'
                    ? 'Custom Title (Optional)'
                    : 'ခေါင်းစဉ် စိတ်ကြိုက်ပြင်ရန်'}
                </Text>
                <View style={styles.customTitleRow}>
                  <TextInput
                    placeholder={reportModel.titleWord1}
                    placeholderTextColor={palette.muted}
                    value={customWord1}
                    onChangeText={setCustomWord1}
                    style={[
                      styles.customInputHalf,
                      {
                        backgroundColor: palette.bg,
                        borderColor: palette.line,
                        color: palette.ink,
                        fontFamily: fonts.medium,
                      },
                      webOutlineStyle,
                    ]}
                  />
                  <TextInput
                    placeholder={reportModel.titleWord2}
                    placeholderTextColor={palette.muted}
                    value={customWord2}
                    onChangeText={setCustomWord2}
                    style={[
                      styles.customInputHalf,
                      {
                        backgroundColor: palette.bg,
                        borderColor: palette.line,
                        color: palette.ink,
                        fontFamily: fonts.medium,
                      },
                      webOutlineStyle,
                    ]}
                  />
                </View>
                <TextInput
                  placeholder="Subtitle e.g. Class: Class Ledger (2025-2026)"
                  placeholderTextColor={palette.muted}
                  value={customMetaLeft}
                  onChangeText={setCustomMetaLeft}
                  style={[
                    styles.customInputFull,
                    {
                      backgroundColor: palette.bg,
                      borderColor: palette.line,
                      color: palette.ink,
                      fontFamily: fonts.regular,
                    },
                    webOutlineStyle,
                  ]}
                />
              </View>

              {!isLargeScreen ? (
                <TouchableOpacity
                  onPress={() => setMobileTab('preview')}
                  activeOpacity={0.85}
                  style={[
                    styles.backPreviewBtn,
                    {
                      backgroundColor: themeColor.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.backPreviewText,
                      {
                        color: themeColor.onPrimary,
                        fontFamily: fonts.semibold,
                      },
                    ]}
                  >
                    {language === 'en'
                      ? 'Back to Preview'
                      : 'အစမ်းမြင်ကွင်းသို့ ပြန်သွားမည်'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          ) : null}

          {/* Preview & Action Panel */}
          {isLargeScreen || mobileTab === 'preview' ? (
            <View
              style={[
                styles.previewPane,
                { backgroundColor: palette.surface },
              ]}
            >
              <View style={styles.previewToolbar}>
                <View style={styles.previewToolbarLeft}>
                  <Text
                    style={[
                      styles.previewEyebrow,
                      { color: palette.subtle, fontFamily: fonts.medium },
                    ]}
                  >
                    {language === 'en' ? 'Live Preview' : 'အစမ်းမြင်ကွင်း'}
                  </Text>
                  <View
                    style={[
                      styles.rendererSwitchTrack,
                      {
                        backgroundColor: palette.card,
                        borderColor: palette.line,
                      },
                    ]}
                  >
                    <Pressable
                      onPress={() => setPreviewRenderer('svg')}
                      style={[
                        styles.rendererSwitchBtn,
                        previewRenderer === 'svg'
                          ? { backgroundColor: palette.ink }
                          : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.rendererSwitchText,
                          {
                            color:
                              previewRenderer === 'svg'
                                ? palette.bg
                                : palette.muted,
                            fontFamily: fonts.medium,
                          },
                        ]}
                      >
                        Fit to Screen
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setPreviewRenderer('view')}
                      style={[
                        styles.rendererSwitchBtn,
                        previewRenderer === 'view'
                          ? { backgroundColor: palette.ink }
                          : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.rendererSwitchText,
                          {
                            color:
                              previewRenderer === 'view'
                                ? palette.bg
                                : palette.muted,
                            fontFamily: fonts.medium,
                          },
                        ]}
                      >
                        Detail View
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.themeNameWrap}>
                  <View
                    style={[
                      styles.themeSwatchMini,
                      {
                        backgroundColor: currentTheme.frameColor,
                        borderColor: themeColor.primary,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.themeNameText,
                      { color: palette.subtle, fontFamily: fonts.medium },
                    ]}
                  >
                    {currentTheme.name}
                  </Text>
                </View>
              </View>

              <ScrollView
                style={[
                  styles.previewCanvasCard,
                  {
                    backgroundColor: palette.card,
                    borderColor: palette.line,
                  },
                ]}
                contentContainerStyle={styles.previewCanvasContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.previewSheetWrap}>
                  {previewRenderer === 'svg' ? (
                    <AestheticSvgReport ref={svgRef} model={reportModel} />
                  ) : (
                    <AestheticReportView model={reportModel} />
                  )}
                </View>
              </ScrollView>

              {previewRenderer === 'view' ? (
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
              ) : null}

              {/* Bottom Export Toolbar */}
              <View style={styles.bottomActionsRow}>
                <TouchableOpacity
                  onPress={handleCopyImage}
                  disabled={isExporting}
                  activeOpacity={0.78}
                  style={[
                    styles.secondaryActionBtn,
                    {
                      backgroundColor: palette.card,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  <NativeIcon
                    sfSymbol="doc.on.doc"
                    materialName="content-copy"
                    FallbackIcon={Copy}
                    size={14}
                    color={themeColor.primary}
                  />
                  <Text
                    style={[
                      styles.secondaryActionText,
                      { color: palette.ink, fontFamily: fonts.medium },
                    ]}
                  >
                    {t.modals.aesthetic.copyImage}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShareImage}
                  disabled={isExporting}
                  activeOpacity={0.78}
                  style={[
                    styles.secondaryActionBtn,
                    {
                      backgroundColor: palette.card,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  <NativeIcon
                    sfSymbol="square.and.arrow.up"
                    materialName="share"
                    FallbackIcon={Share2}
                    size={14}
                    color={themeColor.primary}
                  />
                  <Text
                    style={[
                      styles.secondaryActionText,
                      { color: palette.ink, fontFamily: fonts.medium },
                    ]}
                  >
                    {t.modals.aesthetic.shareImage}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleExportSVG}
                  disabled={isExporting}
                  activeOpacity={0.78}
                  style={[
                    styles.svgBtn,
                    {
                      backgroundColor: palette.card,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.svgBtnText,
                      { color: palette.subtle, fontFamily: fonts.monoMedium },
                    ]}
                  >
                    SVG
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDownloadPNG}
                  disabled={isExporting}
                  activeOpacity={0.85}
                  style={[
                    styles.downloadPngBtn,
                    {
                      backgroundColor: themeColor.primary,
                    },
                  ]}
                >
                  {isExporting ? (
                    <ActivityIndicator
                      size="small"
                      color={themeColor.onPrimary}
                    />
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
                        style={[
                          styles.downloadPngText,
                          {
                            color: themeColor.onPrimary,
                            fontFamily: fonts.semibold,
                          },
                        ]}
                      >
                        {t.modals.aesthetic.downloadPNG}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flexMinZero: {
    flex: 1,
    minWidth: 0,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topTitle: {
    fontSize: 16,
    lineHeight: 21,
  },
  topSub: {
    fontSize: 11,
  },
  closeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  mobileTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  mobileTabTrack: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 9999,
    padding: 3,
  },
  mobileTabBtn: {
    flex: 1,
    borderRadius: 9999,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  mobileTabText: {
    fontSize: 12,
  },
  layoutToggleChip: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  layoutToggleText: {
    fontSize: 11,
  },
  themeStrip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  themeHex: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  mainBody: {
    flex: 1,
    minHeight: 0,
  },
  controlsScroll: {
    width: '100%',
  },
  controlsContent: {
    padding: 16,
    paddingBottom: 28,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionEyebrow: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  reportTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reportTypeBtn: {
    flex: 1,
    minWidth: 130,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  reportTypeText: {
    fontSize: 12,
    textAlign: 'center',
  },
  subFilterBox: {
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  subFilterLabel: {
    fontSize: 11,
    marginBottom: 8,
  },
  filterChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  eventChipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterChip: {
    borderRadius: 8,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  filterChipText: {
    fontSize: 11,
  },
  layoutCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  layoutModeCard: {
    flex: 1,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  layoutCardTitle: {
    fontSize: 12,
  },
  layoutCardSub: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  customTitleSection: {
    paddingTop: 14,
    borderTopWidth: 1,
    marginBottom: 18,
  },
  customTitleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  customInputHalf: {
    flex: 1,
    minWidth: 0,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
  },
  customInputFull: {
    width: '100%',
    minWidth: 0,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
  },
  backPreviewBtn: {
    width: '100%',
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  backPreviewText: {
    fontSize: 13,
  },
  previewPane: {
    flex: 1,
    padding: 16,
    minHeight: 0,
  },
  previewToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  previewToolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewEyebrow: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  rendererSwitchTrack: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  rendererSwitchBtn: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  rendererSwitchText: {
    fontSize: 11,
  },
  themeNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  themeSwatchMini: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  themeNameText: {
    fontSize: 11,
  },
  previewCanvasCard: {
    flex: 1,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 12,
  },
  previewCanvasContent: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  previewSheetWrap: {
    width: '100%',
    maxWidth: 680,
  },
  bottomActionsRow: {
    paddingTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  secondaryActionText: {
    fontSize: 12,
  },
  svgBtn: {
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  svgBtnText: {
    fontSize: 11,
  },
  downloadPngBtn: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  downloadPngText: {
    fontSize: 13,
  },
});
