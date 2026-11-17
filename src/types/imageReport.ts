import { ActiveThemeColor, blendHexWithWhite } from '../theme/themeColors';

export type AestheticThemeId = string;

export interface AestheticTheme {
  id?: string;
  name: string;
  frameColor: string;
  numberBg: string;
  paperBg: string;
  borderColor: string;
  textColor: string;
  secondaryTextColor: string;
  accentColor: string;
  badgePaidBg: string;
  badgePaidText: string;
  badgeUnpaidBg: string;
  badgeUnpaidText: string;
}

/**
 * Dynamically creates the Aesthetic Table Theme directly matching the current active App Theme Color.
 * This guarantees the stationery border, number accents, and badges strictly follow the user's selected UI theme.
 */
export function createAestheticTheme(themeColor: ActiveThemeColor): AestheticTheme {
  const primary = themeColor.primary;
  return {
    id: themeColor.id,
    name: themeColor.primary,
    frameColor: blendHexWithWhite(primary, 0.22),
    numberBg: blendHexWithWhite(primary, 0.08),
    paperBg: '#FFFFFF',
    borderColor: '#18181B',
    textColor: '#18181B',
    secondaryTextColor: '#52525B',
    accentColor: primary,
    badgePaidBg: '#EAF6EE',
    badgePaidText: '#166534',
    badgeUnpaidBg: '#FCEBEA',
    badgeUnpaidText: '#991B1B',
  };
}

export type ReportSourceType =
  | 'student_fines'
  | 'subject_fines'
  | 'event_donors'
  | 'fines_ledger';

export type ReportLayoutMode = 'dual_column' | 'summary_table';

export interface DualColumnItem {
  index: number;
  label: string;
  subLabel?: string;
  value?: string;
  status?: 'paid' | 'unpaid' | 'neutral';
}

export interface SummaryTableRow {
  no: number;
  title: string;
  subtitle?: string;
  col1?: string;
  col2?: string;
  col3?: string;
  highlight?: boolean;
}

export interface AestheticReportModel {
  titleWord1: string;
  titleWord2: string;
  metadataLeft: string;
  metadataRight: string;
  layoutMode: ReportLayoutMode;
  theme: AestheticTheme;
  // Dual-column data (left items and right items)
  leftItems: DualColumnItem[];
  rightItems: DualColumnItem[];
  // Summary table data
  tableHeaders?: string[];
  tableRows?: SummaryTableRow[];
  tableFooterRow?: {
    title: string;
    col1?: string;
    col2?: string;
    col3?: string;
  };
  // Summary Stats Bar
  stats?: {
    label: string;
    value: string;
    color?: string;
  }[];
  footerNote?: string;
}
