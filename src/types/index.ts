export interface AppSettings {
  ecKbzpayName: string;
  ecKbzpayPhone: string;
}

export interface Student {
  id: string;
  name: string;
  phone?: string;
  rollNumber?: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  createdAt: string;
}

export type EventType = 'donation' | 'fixed_fee';

export interface Event {
  id: string;
  name: string;
  type: EventType;
  fixedAmount?: number;
  dueDate?: string;
  extraNote?: string;
  createdAt: string;
}

export interface EventRecord {
  id: string;
  eventId: string;
  studentId: string;
  amount: number;
  isPaid: boolean;
  createdAt: string;
}

export interface Fine {
  id: string;
  subjectId: string;
  studentId: string;
  reason: string;
  date: string;
  amount: number;
  isPaid: boolean;
  createdAt: string;
}

export interface AppDatabaseState {
  settings: AppSettings;
  students: Student[];
  subjects: Subject[];
  events: Event[];
  eventRecords: EventRecord[];
  fines: Fine[];
  version: number;
}

export interface FinesSummary {
  totalPaid: number;
  totalUnpaid: number;
  totalAll: number;
}

export interface SubjectFineStat {
  subject: Subject;
  totalPaid: number;
  totalUnpaid: number;
  totalAll: number;
  count: number;
}

export interface StudentFineStat {
  student: Student;
  totalPaid: number;
  totalUnpaid: number;
  totalAll: number;
  unpaidCount: number;
}

export interface EventStat {
  event: Event;
  totalCollected: number;
  expectedTotal?: number;
  totalDonors: number;
  totalPaidCount: number;
  totalUnpaidCount: number;
}
