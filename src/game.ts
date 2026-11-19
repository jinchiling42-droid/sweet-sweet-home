export type Lang = 'ko' | 'zh';
export type Text = readonly [ko: string, zh: string];
export type Patient = { explored: string[]; called: boolean };
export type Progress = { patients: Patient[]; ending: boolean };
export type Preferences = { lang: Lang; sound: boolean };
export type Save = Preferences & Progress;

export const local = (value: Text, lang: Lang) => value[lang === 'ko' ? 0 : 1];

export const memoryIds = [
  ['mirror', 'control', 'shame'],
  ['hunger', 'relation', 'memory'],
];

export const emptyProgress = (): Progress => ({
  patients: memoryIds.map(() => ({ explored: [], called: false })),
  ending: false,
});

export const storage = {
  read(key: string) {
    try {
      return JSON.parse(localStorage.getItem(key) ?? 'null');
    } catch {
      return null;
    }
  },
  write(key: string, value: Save | Progress | Preferences) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};

export function readProgress(value: unknown): Progress | null {
  if (!value || typeof value !== 'object' || !('patients' in value) || !Array.isArray(value.patients)) {
    return null;
  }
  const oldPatients = value.patients;
  const patients = memoryIds.map((ids, index) => {
    const old = oldPatients[index];
    const explored = ids.filter(id => Array.isArray(old?.explored) && old.explored.includes(id));
    return { explored, called: old?.called === true && explored.length === ids.length };
  });
  return {
    patients,
    ending: 'ending' in value && value.ending === true && patients.every(patient => patient.called),
  };
}

export function readPreferences(value: Partial<Preferences> | null): Preferences {
  return { lang: value?.lang === 'zh' ? 'zh' : 'ko', sound: value?.sound === true };
}

export function readSave(): Save | null {
  const value = storage.read('ssh-manual');
  const progress = readProgress(value);
  return progress ? { ...readPreferences(value), ...progress } : null;
}
