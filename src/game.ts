import { patientFiles, patientIds, type PatientId, type PrescriptionChoices, type PrescriptionDraft } from './patients';
import { calls, endings, memories, storyForScene, type Story } from './story';

export type Lang = 'ko' | 'zh';
export type Text = readonly [ko: string, zh: string];
export type Preferences = { lang: Lang; musicVolume: number; effectsVolume: number };
export type EndingVariant = 'ordinary' | 'truth';
type PatientScene = { kind: 'memory'; patient: PatientId; id: string } | { kind: 'call'; patient: PatientId };
export type SceneRequest = PatientScene | { kind: 'ending' };
export type SceneKey = PatientScene | { kind: 'ending'; variant: EndingVariant };
export type NovelPosition = { scene: SceneKey; page: number; choice: number | null; done: boolean };
export type Reading = { page: number; choice: number | null; completed: boolean };
export type IssuedPrescription = { choices: PrescriptionChoices; issuedAt: string; prescriptionCorrect: boolean };
export type PatientProgress = {
  memories: Partial<Record<string, Reading>>;
  draft: PrescriptionDraft;
  prescription: IssuedPrescription | null;
  followUp: Reading;
};
export type Progress = {
  schemaVersion: 2;
  patients: Record<PatientId, PatientProgress>;
  ending: (Reading & { variant: EndingVariant }) | null;
  novel: NovelPosition | null;
};
export type Save = Preferences & Progress;
export type PatientStage = 'consulting' | 'prescribing' | 'calling' | 'completed';

export const local = (value: Text, lang: Lang) => value[lang === 'ko' ? 0 : 1];

const initialReading = (): Reading => ({ page: 0, choice: null, completed: false });
const emptyDraft = (): PrescriptionDraft => ({ problem: null, interventions: [], advice: null });

function patientMap<T>(fn: (id: PatientId, index: number) => T) {
  return Object.fromEntries(patientIds.map((id, index) => [id, fn(id, index)])) as Record<PatientId, T>;
}

export function emptyProgress(): Progress {
  return {
    schemaVersion: 2,
    patients: patientMap(id => ({
      memories: Object.fromEntries(patientFiles[id].memories.map(key => [key, initialReading()])),
      draft: emptyDraft(), prescription: null, followUp: initialReading(),
    })),
    ending: null,
    novel: null,
  };
}

export function fullStoryCompleted(id: PatientId, state: PatientProgress) {
  return patientFiles[id].memories.every(key => state.memories[key]?.completed === true);
}

export function patientStage(id: PatientId, state: PatientProgress): PatientStage {
  if (!fullStoryCompleted(id, state)) return 'consulting';
  if (!state.prescription) return 'prescribing';
  return state.followUp.completed ? 'completed' : 'calling';
}

export function isHiddenFolderUnlocked(progress: Progress) {
  return patientIds.every(id => patientStage(id, progress.patients[id]) === 'completed');
}

export function endingVariant(progress: Progress): EndingVariant | null {
  if (!isHiddenFolderUnlocked(progress)) return null;
  return patientIds.every(id => progress.patients[id].prescription?.prescriptionCorrect === true)
    ? 'truth' : 'ordinary';
}

export function saveSnapshot(progress: Progress) {
  return {
    ...progress,
    hiddenFolderUnlocked: isHiddenFolderUnlocked(progress),
    patients: patientMap(id => {
      const state = progress.patients[id];
      return {
        ...state,
        fullStoryCompleted: fullStoryCompleted(id, state),
        prescriptionIssued: state.prescription !== null,
        followUpCompleted: state.followUp.completed,
      };
    }),
  };
}

export const storage = {
  read(key: string): unknown {
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

export function canIssuePrescription(draft: PrescriptionDraft) {
  return draft.problem !== null && draft.interventions.length === 2 && draft.advice !== null;
}

function classifyPrescription(id: PatientId, choices: PrescriptionChoices) {
  const answer = patientFiles[id].answer;
  return choices.problem === answer.problem && choices.advice === answer.advice &&
    answer.interventions.every(option => choices.interventions.includes(option));
}

function replacePatient(progress: Progress, id: PatientId, state: PatientProgress): Progress {
  return { ...progress, patients: { ...progress.patients, [id]: state } };
}

export function updatePrescriptionDraft(progress: Progress, id: PatientId, draft: PrescriptionDraft): Progress {
  const state = progress.patients[id];
  if (patientStage(id, state) !== 'prescribing') return progress;
  return replacePatient(progress, id, { ...state, draft: readDraft(draft, id) });
}

export function issuePrescription(progress: Progress, id: PatientId, issuedAt: string): Progress {
  const state = progress.patients[id];
  if (patientStage(id, state) !== 'prescribing') return progress;
  const choices = completeChoices(state.draft);
  if (!choices) return progress;
  return replacePatient(progress, id, {
    ...state,
    draft: emptyDraft(),
    prescription: { choices, issuedAt, prescriptionCorrect: classifyPrescription(id, choices) },
  });
}

function resolveScene(progress: Progress, request: SceneRequest): SceneKey | null {
  if (request.kind === 'ending') {
    const variant = endingVariant(progress);
    return variant ? { kind: 'ending', variant } : null;
  }
  if (request.kind === 'memory') {
    return patientFiles[request.patient].memories.includes(request.id) ? request : null;
  }
  const stage = patientStage(request.patient, progress.patients[request.patient]);
  return stage === 'calling' || stage === 'completed' ? request : null;
}

function bookOf(progress: Progress, scene: SceneKey): Reading {
  if (scene.kind === 'ending') return progress.ending?.variant === scene.variant ? progress.ending : initialReading();
  const state = progress.patients[scene.patient];
  return scene.kind === 'call' ? state.followUp : (state.memories[scene.id] ?? initialReading());
}

function trackReading(progress: Progress, position: NovelPosition, completed = false): Progress {
  const { scene, page, choice } = position;
  const previous = bookOf(progress, scene);
  const reading = previous.completed ? previous : { page, choice, completed };
  const next = {
    ...progress,
    novel: completed && scene.kind !== 'ending' ? null : { ...position, done: completed },
  };
  if (scene.kind === 'ending') return { ...next, ending: { ...reading, variant: scene.variant } };
  const state = progress.patients[scene.patient];
  return replacePatient(next, scene.patient, scene.kind === 'call' ? { ...state, followUp: reading } : {
    ...state, memories: { ...state.memories, [scene.id]: reading },
  });
}

export function enterScene(progress: Progress, request: SceneRequest): Progress {
  const scene = resolveScene(progress, request);
  if (!scene) return progress;
  const saved = bookOf(progress, scene);
  const { page, choice } = saved.completed ? initialReading() : saved;
  return trackReading(progress, { scene, page, choice, done: false });
}

function lastPage(story: Story) {
  return story.pages.length - 1 + Number(!!story.choices?.length);
}

export function advanceScene(progress: Progress, expected: NovelPosition): Progress {
  if (progress.novel !== expected || expected.done) return progress;
  const story = storyForScene(expected.scene);
  if (expected.page < lastPage(story)) return trackReading(progress, { ...expected, page: expected.page + 1 });
  if (story.choices?.length && expected.choice === null) return progress;
  return trackReading(progress, expected, true);
}

export function chooseInScene(progress: Progress, expected: NovelPosition, choice: number): Progress {
  if (progress.novel !== expected || expected.done || expected.choice !== null) return progress;
  const story = storyForScene(expected.scene);
  if (expected.page !== story.pages.length || !story.choices?.[choice]) return progress;
  return trackReading(progress, { ...expected, choice });
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function readDraft(value: unknown, id: PatientId): PrescriptionDraft {
  const source = asObject(value);
  const options = patientFiles[id].options;
  const problem = options.problem.find(option => option.id === source?.problem)?.id ?? null;
  const advice = options.advice.find(option => option.id === source?.advice)?.id ?? null;
  const allowed = new Set(options.interventions.map(option => option.id));
  const input: unknown[] = Array.isArray(source?.interventions) ? source.interventions : [];
  const interventions = [...new Set(input.filter((key): key is string => typeof key === 'string' && allowed.has(key)))].slice(0, 2);
  return { problem, interventions, advice };
}

function completeChoices(draft: PrescriptionDraft): PrescriptionChoices | null {
  if (!canIssuePrescription(draft)) return null;
  return { problem: draft.problem, interventions: [draft.interventions[0], draft.interventions[1]], advice: draft.advice };
}

function readIssued(value: unknown, id: PatientId): IssuedPrescription | null {
  const source = asObject(value);
  const issuedAt = source?.issuedAt;
  const choices = completeChoices(readDraft(source?.choices, id));
  if (!choices || typeof issuedAt !== 'string' || !Number.isFinite(Date.parse(issuedAt))) return null;
  return { choices, issuedAt, prescriptionCorrect: classifyPrescription(id, choices) };
}

function readReading(value: unknown, story: Story): Reading {
  const source = asObject(value);
  const page = typeof source?.page === 'number' && Number.isInteger(source.page)
    ? Math.min(Math.max(0, source.page), lastPage(story)) : 0;
  const choice = typeof source?.choice === 'number' && Number.isInteger(source.choice) &&
    page === story.pages.length && !!story.choices?.[source.choice] ? source.choice : null;
  const completed = source?.completed === true && page === lastPage(story) &&
    (!story.choices?.length || choice !== null);
  return { page, choice, completed };
}

function readPatient(value: unknown, id: PatientId): PatientProgress {
  const source = asObject(value);
  const savedMemories = asObject(source?.memories);
  // Older demos stored only a list of finished memory IDs and had no prescriptions.
  const legacyExplored = Array.isArray(source?.explored) ? source.explored : [];
  const memoriesRead = Object.fromEntries(patientFiles[id].memories.map(key => [
    key, legacyExplored.includes(key) ? { ...initialReading(), page: lastPage(memories[key]), completed: true }
      : readReading(savedMemories?.[key], memories[key]),
  ]));
  const state: PatientProgress = { memories: memoriesRead, draft: emptyDraft(), prescription: null, followUp: initialReading() };
  if (!fullStoryCompleted(id, state)) return state;
  const prescription = readIssued(source?.prescription, id);
  return {
    ...state,
    prescription,
    draft: prescription ? emptyDraft() : readDraft(source?.draft, id),
    followUp: prescription ? readReading(source?.followUp, calls[id]) : initialReading(),
  };
}

function readSceneRequest(value: unknown): SceneRequest | null {
  const source = asObject(value);
  if (source?.kind === 'ending') return { kind: 'ending' };
  const id = typeof source?.patient === 'number' ? patientIds[source.patient]
    : patientIds.find(patient => patient === source?.patient);
  if (!id) return null;
  if (source?.kind === 'memory' && typeof source.id === 'string') return { kind: 'memory', patient: id, id: source.id };
  return source?.kind === 'call' ? { kind: 'call', patient: id } : null;
}

export function readProgress(value: unknown): Progress | null {
  const source = asObject(value);
  const legacyPatients = Array.isArray(source?.patients) ? source.patients : null;
  const currentPatients = asObject(source?.patients);
  if (!legacyPatients && !currentPatients) return null;
  const progress: Progress = {
    ...emptyProgress(),
    patients: patientMap((id, index) => readPatient(legacyPatients ? legacyPatients[index] : currentPatients?.[id], id)),
  };
  const variant = endingVariant(progress);
  const ending = asObject(source?.ending);
  if (variant && ending?.variant === variant) {
    progress.ending = { ...readReading(ending, endings[variant]), variant };
  }

  const currentNovel = asObject(source?.novel);
  const request = readSceneRequest(currentNovel?.scene);
  const scene = request && resolveScene(progress, request);
  if (!scene || (scene.kind === 'ending' && asObject(currentNovel?.scene)?.variant !== scene.variant)) return progress;
  const { page, choice } = readReading(currentNovel, storyForScene(scene));
  const done = scene.kind === 'ending' && progress.ending?.completed === true &&
    currentNovel?.done === true && page === lastPage(endings[scene.variant]);
  return trackReading(progress, { scene, page, choice, done }, done);
}

function readVolume(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(100, Math.max(0, Math.round(value))) : fallback;
}

export function readPreferences(value: unknown): Preferences {
  const source = asObject(value);
  return {
    lang: source?.lang === 'zh' ? 'zh' : 'ko',
    musicVolume: readVolume(source?.musicVolume, 45),
    effectsVolume: readVolume(source?.effectsVolume, source?.sound === true ? 100 : 0),
  };
}

export function readSave(): Save | null {
  const value = storage.read('ssh-manual');
  const progress = readProgress(value);
  return progress ? { ...readPreferences(value), ...progress } : null;
}
