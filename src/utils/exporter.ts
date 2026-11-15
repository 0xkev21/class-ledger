import * as Clipboard from 'expo-clipboard';
import { Platform } from 'react-native';
import { AppDatabaseState, AppSettings, Event, Fine, Student, Subject, SubjectFineStat } from '../types';
import { formatDate, formatMMK, getTodayFormatted } from './formatters';

/**
 * Copies string to system clipboard.
 */
export async function copyReportToClipboard(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Generates Burmese Initial Announcement for an Event.
 */
export function generateInitialEventAnnouncement(
  event: Event,
  settings: AppSettings
): string {
  const phone = settings.ecKbzpayPhone || '(EC Phone မထည့်ရသေးပါ)';
  const name = settings.ecKbzpayName || '(EC Name မထည့်ရသေးပါ)';
  const extraNoteLine = event.extraNote ? `\n${event.extraNote.trim()}\n` : '';

  if (event.type === 'donation') {
    return `${event.name}မှာပါဝင်ကုသိုလ်ယူချင်တဲ့ သူငယ်ချင်းများ အောက်က KBZPay အကောင့်ကနေတစ်ဆင့် စေတနာရှိသလောက်ပါဝင်လှူဒါန်းနိုင်ပါတယ်ဗျ\n` +
      `KBZPay: ${phone}\n` +
      `Name: ${name}\n` +
      `📌 အလှူငွေလွှဲတဲ့အခါ စာရင်းမှတ်တမ်း ပြုစုရလွယ်ကူအောင် Notes မှာ Name / Nickname လေးတွေ ရေးပြီး လွှဲပေးကြပါဖို့ မေတ္တာရပ်ခံပါတယ်ခင်ဗျာ\n` +
      extraNoteLine +
      `အားလုံးကို ကျေးဇူးတင်ပါတယ်ခင်ဗျာ။`;
  } else {
    const feeStr = event.fixedAmount ? formatMMK(event.fixedAmount) : '';
    const dueStr = event.dueDate ? `📅 နောက်ဆုံးရက် (Due Date): ${event.dueDate}\n` : '';

    return `${event.name}အတွက် တစ်ဦးလျှင် ${feeStr} နှုန်းဖြင့် အောက်ပါ KBZPay အကောင့်သို့ ပေးသွင်းနိုင်ပါပြီခင်ဗျာ\n` +
      `KBZPay: ${phone}\n` +
      `Name: ${name}\n` +
      dueStr +
      `📌 ငွေလွှဲတဲ့အခါ စာရင်းမှတ်တမ်း ပြုစုရလွယ်ကူအောင် Notes မှာ Name / Roll No လေးတွေ ရေးပြီး လွှဲပေးကြပါဖို့ မေတ္တာရပ်ခံပါတယ်ခင်ဗျာ\n` +
      extraNoteLine +
      `အားလုံးကို ကျေးဇူးတင်ပါတယ်ခင်ဗျာ။`;
  }
}

/**
 * Generates Burmese Due-Date / Closing Announcement for an Event.
 */
export function generateClosingEventAnnouncement(
  event: Event,
  totalCollected: number
): string {
  const formattedTotal = formatMMK(totalCollected);

  if (event.type === 'donation') {
    return `${event.name}အတွက် အလှူငွေစုစုပေါင်း ${formattedTotal} ရရှိထားပါတယ်ခင်ဗျာ\n` +
      `ထပ်မံထည့်ဝင်လှူဒါန်းချင်သူများရှိသေးပါက မနက်ဖြန်မတိုင်ခင်လေး လွှဲထားပေးကြပါအုံးနော်\n` +
      `မရှိတော့ရင် စာရင်းပိတ်ပြီး ကျောင်းကိုလွှဲလိုက်တော့မယ်ဗျ`;
  } else {
    return `${event.name}အတွက် ကောက်ခံရရှိငွေ စုစုပေါင်း ${formattedTotal} ရရှိထားပြီး ဖြစ်ပါတယ်ခင်ဗျာ\n` +
      `ပေးသွင်းရန် ကျန်ရှိနေသေးသူများ မနက်ဖြန်မတိုင်ခင်လေး လွှဲထားပေးကြပါအုံးနော်\n` +
      `မရှိတော့ရင် စာရင်းပိတ်ပါတော့မယ်ဗျ`;
  }
}

/**
 * Generates 1-Click End-of-Year Fine Summary for Class Discussion.
 */
export function generateEndOfYearFineSummary({
  totalPaid,
  totalUnpaid,
  totalAll,
  subjectStats,
}: {
  totalPaid: number;
  totalUnpaid: number;
  totalAll: number;
  subjectStats: SubjectFineStat[];
}): string {
  const today = getTodayFormatted();

  let text = `📢 【 အတန်း ဒဏ်ကြေး စုစုပေါင်း အစီရင်ခံစာ (End-of-Year Fine Summary) 】\n`;
  text += `📅 ရက်စွဲ: ${today}\n`;
  text += `----------------------------------------\n`;
  text += `💰 ကောက်ခံရရှိပြီး (Paid): ${formatMMK(totalPaid)}\n`;
  text += `⚠️ ကောက်ခံရန်ကျန် (Unpaid): ${formatMMK(totalUnpaid)}\n`;
  text += `🎯 စုစုပေါင်း ဒဏ်ကြေး: ${formatMMK(totalAll)}\n`;
  text += `----------------------------------------\n\n`;

  text += `📚 【 ဘာသာရပ်အလိုက် ကောက်ခံရရှိငွေ 】\n`;
  if (subjectStats.length === 0) {
    text += `ဘာသာရပ်ဆိုင်ရာ ဒဏ်ကြေးမှတ်တမ်း မရှိသေးပါ။\n`;
  } else {
    subjectStats.forEach((stat, index) => {
      text += `${index + 1}. ${stat.subject.name}: ${formatMMK(stat.totalPaid)} (ကျန်: ${formatMMK(stat.totalUnpaid)})\n`;
    });
  }

  text += `\n----------------------------------------\n`;
  text += `🎉 စုစုပေါင်း ကောက်ခံရရှိထားသော ဒဏ်ကြေးငွေ ${formatMMK(totalPaid)} ကို အတန်းသားများ အားလုံး စုပေါင်းပြီး မည်သို့ အသုံးပြုမည်ကို အတူတကွ တိုင်ပင် ဆုံးဖြတ်ပေးကြပါရန် လေးစားစွာ အသိပေး အပ်ပါသည်ခင်ဗျာ။\n`;

  return text;
}

/**
 * Generates CSV string for fine records.
 */
export function generateFinesCSV(
  fines: Fine[],
  students: Student[],
  subjects: Subject[]
): string {
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  const headers = [
    'Fine ID',
    'Student Name',
    'Roll Number',
    'Phone',
    'Subject',
    'Reason',
    'Date',
    'Amount (MMK)',
    'Status',
  ];

  const rows = fines.map((f) => {
    const s = studentMap.get(f.studentId);
    return [
      `"${f.id}"`,
      `"${s?.name || 'Unknown'}"`,
      `"${s?.rollNumber || ''}"`,
      `"${s?.phone || ''}"`,
      `"${subjectMap.get(f.subjectId) || ''}"`,
      `"${f.reason.replace(/"/g, '""')}"`,
      `"${f.date}"`,
      f.amount,
      f.isPaid ? '"Paid"' : '"Unpaid"',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Downloads a string as a file on web.
 */
export function downloadFileWeb(
  filename: string,
  content: string,
  mimeType = 'text/csv;charset=utf-8;'
): boolean {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }
  return false;
}
