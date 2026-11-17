import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppDatabaseState, AppSettings } from '../types';

const STORAGE_KEY = '@ec_treasury_app_db_v2';
const LEGACY_STORAGE_KEY = '@ec_treasury_app_db_v1';

export const INITIAL_SETTINGS: AppSettings = {
  ecKbzpayName: '',
  ecKbzpayPhone: '',
  themeColorId: 'indigo',
  language: 'my',
};

export const INITIAL_STATE: AppDatabaseState = {
  settings: INITIAL_SETTINGS,
  students: [],
  subjects: [],
  events: [],
  eventRecords: [],
  fines: [],
  version: 2,
};

export async function loadDatabase(): Promise<AppDatabaseState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check legacy storage key to clean it up
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY).catch(() => {});
      await saveDatabase(INITIAL_STATE);
      return INITIAL_STATE;
    }

    const parsed = JSON.parse(raw);
    // Ensure all required fields exist and are arrays
    const sanitized: AppDatabaseState = {
      settings: {
        ecKbzpayName: parsed.settings?.ecKbzpayName || '',
        ecKbzpayPhone: parsed.settings?.ecKbzpayPhone || '',
        themeColorId: parsed.settings?.themeColorId === 'custom' ? 'indigo' : (parsed.settings?.themeColorId || 'indigo'),
        language: parsed.settings?.language === 'en' ? 'en' : 'my',
      },
      students: Array.isArray(parsed.students) ? parsed.students : [],
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      eventRecords: Array.isArray(parsed.eventRecords) ? parsed.eventRecords : [],
      fines: Array.isArray(parsed.fines) ? parsed.fines : [],
      version: 2,
    };

    return sanitized;
  } catch (error) {
    console.error('Failed to load database from AsyncStorage:', error);
    return INITIAL_STATE;
  }
}

export async function saveDatabase(data: AppDatabaseState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save database to AsyncStorage:', error);
    throw error;
  }
}

export async function resetDatabaseToDefaults(): Promise<AppDatabaseState> {
  await saveDatabase(INITIAL_STATE);
  return INITIAL_STATE;
}
