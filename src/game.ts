import { storyForScene } from './story';

export type Lang = 'ko' | 'zh';
export type Text = readonly [ko: string, zh: string];
export type Patient = { explored: string[]; called: boolean };
export type Progress = { patients: Patient[]; ending: boolean };
export type Preferences = { lang: Lang; musicVolume: number; effectsVolume: number };
export type SceneKey = { kind: 'memory'; patient: number; id: string } |
  { kind: 'call'; patient: number } | { kind: 'ending' };
export type NovelPosition = { scene: SceneKey; page: number; choice: number | null; done: boolean };
export type Save = Preferences & Progress & { novel: NovelPosition | null };

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

function readVolume(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(100, Math.max(0, Math.round(value))) : fallback;
}

export function readPreferences(value: (Partial<Preferences> & { sound?: boolean }) | null): Preferences {
  return {
    lang: value?.lang === 'zh' ? 'zh' : 'ko',
    musicVolume: readVolume(value?.musicVolume, 45),
    effectsVolume: readVolume(value?.effectsVolume, value?.sound === true ? 100 : 0),
  };
}

function readScene(value: unknown, progress: Progress): SceneKey | null {
  if (!value || typeof value !== 'object' || !('kind' in value)) return null;
  if (value.kind === 'ending') {
    return progress.patients.every(patient => patient.called) ? { kind: 'ending' } : null;
  }
  if (!('patient' in value) || (value.patient !== 0 && value.patient !== 1)) return null;
  const patient = value.patient;
  if (value.kind === 'call' && progress.patients[patient].explored.length === memoryIds[patient].length) {
    return { kind: 'call', patient };
  }
  if (value.kind === 'memory' && 'id' in value && typeof value.id === 'string' && memoryIds[patient].includes(value.id)) {
    return { kind: 'memory', patient, id: value.id };
  }
  return null;
}

function readNovel(value: Partial<NovelPosition> | null, progress: Progress): NovelPosition | null {
  const scene = readScene(value?.scene, progress);
  if (!scene) return null;
  const { pages, choices } = storyForScene(scene);
  const last = pages.length - 1 + Number(!!choices);
  const page = Number.isInteger(value?.page) ? Math.min(Math.max(0, value.page), last) : 0;
  const choice = page === pages.length && choices && Number.isInteger(value?.choice) &&
    value.choice >= 0 && value.choice < choices.length ? value.choice : null;
  return { scene, page, choice, done: scene.kind === 'ending' && progress.ending && page === last && value?.done === true };
}

export function readSave(): Save | null {
  const value = storage.read('ssh-manual');
  const progress = readProgress(value);
  return progress ? { ...readPreferences(value), ...progress, novel: readNovel(value.novel, progress) } : null;
}
