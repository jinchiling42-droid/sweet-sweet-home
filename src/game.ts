import { archiveIds, requiredArchiveIds, type ArchiveId } from './archive-content';
import { evaluationPages } from './evaluation-content';
import { patientFiles, patientIds, type PatientId } from './patients';
import { reportOptions, type ReportChoices, type ReportDraft } from './report-content';
import { calls, finalStory, memories, storyForScene, type Story } from './story';

export type Lang = 'ko' | 'zh';
export type Text = readonly [ko: string, zh: string];
export type Preferences = { lang: Lang; musicVolume: number; effectsVolume: number };
type PatientScene = { kind: 'memory'; patient: PatientId; id: string } | { kind: 'call'; patient: PatientId };
export type SceneRequest = PatientScene | { kind: 'ending' };
export type SceneKey = SceneRequest;
export type NovelPosition = { scene: SceneKey; page: number; choice: number | null; done: boolean };
export type Reading = { page: number; choice: number | null; completed: boolean };
export type CaseReport = { choices: ReportChoices; submittedAt: string };
export type PatientProgress = {
  memories: Partial<Record<string, Reading>>;
  draft: ReportDraft;
  report: CaseReport | null;
  followUp: Reading;
  followUpStarted: boolean;
};
export type ArchiveProgress = { read: ArchiveId[]; view: 'index' | ArchiveId | null };
export type EvaluationProgress = { page: number; readThrough: number; open: boolean; completed: boolean };
export type Progress = {
  schemaVersion: 3;
  patients: Record<PatientId, PatientProgress>;
  archive: ArchiveProgress;
  candleAppeared: boolean;
  evaluation: EvaluationProgress | null;
  ending: Reading | null;
  novel: NovelPosition | null;
};
export type Save = Preferences & Progress;
export type PatientStage = 'consulting' | 'reporting' | 'submitted' | 'calling' | 'completed';

export const local = (value: Text, lang: Lang) => value[lang === 'ko' ? 0 : 1];

const initialReading = (): Reading => ({ page: 0, choice: null, completed: false });
const emptyDraft = (): ReportDraft => ({ observation: null, factor: null, evidence: [], focus: null });
const finalEvaluationPage = evaluationPages.length - 1;

function patientMap<T>(fn: (id: PatientId, index: number) => T) {
  return Object.fromEntries(patientIds.map((id, index) => [id, fn(id, index)])) as Record<PatientId, T>;
}

export function emptyProgress(): Progress {
  return {
    schemaVersion: 3,
    patients: patientMap(id => ({
      memories: Object.fromEntries(patientFiles[id].memories.map(key => [key, initialReading()])),
      draft: emptyDraft(), report: null, followUp: initialReading(), followUpStarted: false,
    })),
    archive: { read: [], view: null },
    candleAppeared: false,
    evaluation: null,
    ending: null,
    novel: null,
  };
}

export function fullStoryCompleted(id: PatientId, state: PatientProgress) {
  return patientFiles[id].memories.every(key => state.memories[key]?.completed === true);
}

export function patientStage(id: PatientId, state: PatientProgress): PatientStage {
  if (!fullStoryCompleted(id, state)) return 'consulting';
  if (!state.report) return 'reporting';
  if (state.followUp.completed) return 'completed';
  return state.followUpStarted ? 'calling' : 'submitted';
}

export function isHiddenFolderUnlocked(progress: Progress) {
  return patientIds.every(id => patientStage(id, progress.patients[id]) === 'completed');
}

export function isHiddenArchiveCompleted(progress: Progress) {
  return isHiddenFolderUnlocked(progress) && requiredArchiveIds.every(id => progress.archive.read.includes(id));
}

export function saveSnapshot(progress: Progress) {
  return {
    ...progress,
    hiddenFolderUnlocked: isHiddenFolderUnlocked(progress),
    hiddenArchiveCompleted: isHiddenArchiveCompleted(progress),
    photoPasswordClueFound: progress.archive.read.includes('album-note'),
    finalEndingCompleted: progress.ending?.completed === true,
    patients: patientMap(id => {
      const state = progress.patients[id];
      return {
        ...state,
        fullStoryCompleted: fullStoryCompleted(id, state),
        caseReportSubmitted: state.report !== null,
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

export function canSubmitReport(draft: ReportDraft) {
  return draft.observation !== null && draft.factor !== null && draft.evidence.length === 2 && draft.focus !== null;
}

function replacePatient(progress: Progress, id: PatientId, state: PatientProgress): Progress {
  return { ...progress, patients: { ...progress.patients, [id]: state } };
}

export function updateReportDraft(progress: Progress, id: PatientId, change: Partial<ReportDraft>): Progress {
  const state = progress.patients[id];
  if (patientStage(id, state) !== 'reporting') return progress;
  return replacePatient(progress, id, { ...state, draft: readDraft({ ...state.draft, ...change }, id) });
}

export function submitReport(progress: Progress, id: PatientId, submittedAt: string): Progress {
  const state = progress.patients[id];
  if (patientStage(id, state) !== 'reporting') return progress;
  const choices = completeChoices(state.draft);
  if (!choices) return progress;
  return replacePatient(progress, id, { ...state, draft: emptyDraft(), report: { choices, submittedAt } });
}

export function openArchive(progress: Progress): Progress {
  return isHiddenFolderUnlocked(progress) && progress.archive.view === null
    ? { ...progress, archive: { ...progress.archive, view: 'index' } } : progress;
}

export function viewArchiveFile(progress: Progress, id: ArchiveId | 'index'): Progress {
  if (progress.archive.view === null || !isHiddenFolderUnlocked(progress) || progress.archive.view === id) return progress;
  const viewed = { ...progress, archive: { ...progress.archive, view: id } };
  return id === 'album-note' ? finishArchiveFile(viewed, id) : viewed;
}

export function finishArchiveFile(progress: Progress, id: ArchiveId): Progress {
  if (progress.archive.view !== id || progress.archive.read.includes(id) || !isHiddenFolderUnlocked(progress)) return progress;
  return { ...progress, archive: { ...progress.archive, read: [...progress.archive.read, id] } };
}

export function returnFromArchive(progress: Progress): Progress {
  if (progress.archive.view === null) return progress;
  return {
    ...progress,
    archive: { ...progress.archive, view: null },
    candleAppeared: progress.candleAppeared || isHiddenArchiveCompleted(progress),
  };
}

export function openEvaluation(progress: Progress): Progress {
  if (!progress.candleAppeared || progress.archive.view !== null || progress.novel || !isHiddenArchiveCompleted(progress)) return progress;
  const evaluation = progress.evaluation ?? { page: 0, readThrough: -1, open: false, completed: false };
  return { ...progress, evaluation: { ...evaluation, open: true } };
}

export function closeEvaluation(progress: Progress): Progress {
  return progress.evaluation?.open
    ? { ...progress, evaluation: { ...progress.evaluation, open: false } } : progress;
}

export function finishEvaluationPage(progress: Progress, page: number): Progress {
  const current = progress.evaluation;
  if (!current?.open || current.page !== page || current.readThrough >= page) return progress;
  return { ...progress, evaluation: { ...current, readThrough: page } };
}

export function previousEvaluationPage(progress: Progress): Progress {
  const current = progress.evaluation;
  return current?.open && current.page > 0
    ? { ...progress, evaluation: { ...current, page: current.page - 1 } } : progress;
}

export function continueEvaluation(progress: Progress): Progress {
  const current = progress.evaluation;
  if (!current?.open || current.readThrough < current.page) return progress;
  if (current.page < finalEvaluationPage) {
    return { ...progress, evaluation: { ...current, page: current.page + 1 } };
  }
  return enterScene({ ...progress, evaluation: { ...current, open: false, completed: true } }, { kind: 'ending' });
}

function resolveScene(progress: Progress, request: SceneRequest): SceneKey | null {
  if (request.kind === 'ending') {
    return progress.candleAppeared && progress.evaluation?.completed && !progress.evaluation.open &&
      isHiddenArchiveCompleted(progress) ? request : null;
  }
  if (request.kind === 'memory') {
    return patientFiles[request.patient].memories.includes(request.id) ? request : null;
  }
  const stage = patientStage(request.patient, progress.patients[request.patient]);
  return stage === 'submitted' || stage === 'calling' || stage === 'completed' ? request : null;
}

function bookOf(progress: Progress, scene: SceneKey): Reading {
  if (scene.kind === 'ending') return progress.ending ?? initialReading();
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
  if (scene.kind === 'ending') return { ...next, ending: reading };
  const state = progress.patients[scene.patient];
  return replacePatient(next, scene.patient, scene.kind === 'call' ? {
    ...state, followUp: reading, followUpStarted: true,
  } : {
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

function readDraft(value: unknown, id: PatientId): ReportDraft {
  const source = asObject(value);
  const options = reportOptions[id];
  const observation = options.observation.find(option => option.id === source?.observation)?.id ?? null;
  const factor = options.factor.find(option => option.id === source?.factor)?.id ?? null;
  const focus = options.focus.find(option => option.id === source?.focus)?.id ?? null;
  const allowed = new Set(options.evidence.map(option => option.id));
  const input: unknown[] = Array.isArray(source?.evidence) ? source.evidence : [];
  const evidence = [...new Set(input.filter((key): key is string => typeof key === 'string' && allowed.has(key)))].slice(0, 2);
  return { observation, factor, evidence, focus };
}

function completeChoices(draft: ReportDraft): ReportChoices | null {
  if (!canSubmitReport(draft)) return null;
  return { observation: draft.observation, factor: draft.factor, evidence: [draft.evidence[0], draft.evidence[1]], focus: draft.focus };
}

function readReport(value: unknown, id: PatientId): CaseReport | null {
  const source = asObject(value);
  const submittedAt = source?.submittedAt;
  const choices = completeChoices(readDraft(source?.choices, id));
  if (!choices || typeof submittedAt !== 'string' || !Number.isFinite(Date.parse(submittedAt))) return null;
  return { choices, submittedAt };
}

function readIndex(value: unknown, min: number, max: number) {
  return typeof value === 'number' && Number.isInteger(value) ? Math.min(Math.max(min, value), max) : min;
}

function readReading(value: unknown, story: Story): Reading {
  const source = asObject(value);
  const page = readIndex(source?.page, 0, lastPage(story));
  const choice = typeof source?.choice === 'number' && Number.isInteger(source.choice) &&
    page === story.pages.length && !!story.choices?.[source.choice] ? source.choice : null;
  const completed = source?.completed === true && page === lastPage(story) &&
    (!story.choices?.length || choice !== null);
  return { page, choice, completed };
}

function readPatient(value: unknown, id: PatientId): PatientProgress {
  const source = asObject(value);
  const savedMemories = asObject(source?.memories);
  // V1 kept only memory IDs. V2 phone bookmarks carry over, while reports are composed in V3.
  const legacyExplored = Array.isArray(source?.explored) ? source.explored : [];
  const memoriesRead = Object.fromEntries(patientFiles[id].memories.map(key => [
    key, legacyExplored.includes(key) ? { ...initialReading(), page: lastPage(memories[key]), completed: true }
      : readReading(savedMemories?.[key], memories[key]),
  ]));
  const state: PatientProgress = {
    memories: memoriesRead, draft: emptyDraft(), report: null, followUp: initialReading(), followUpStarted: false,
  };
  if (!fullStoryCompleted(id, state)) return state;
  const report = readReport(source?.report, id);
  const followUp = readReading(source?.followUp, calls[id]);
  return {
    ...state,
    report,
    draft: report ? emptyDraft() : readDraft(source?.draft, id),
    followUp,
    followUpStarted: source?.followUpStarted === true || followUp.page > 0 || followUp.completed,
  };
}

function readSceneRequest(value: unknown, isCurrent: boolean): SceneRequest | null {
  const source = asObject(value);
  if (source?.kind === 'ending') return isCurrent ? { kind: 'ending' } : null;
  const id = typeof source?.patient === 'number' ? patientIds[source.patient]
    : patientIds.find(patient => patient === source?.patient);
  if (!id) return null;
  if (source?.kind === 'memory' && typeof source.id === 'string') return { kind: 'memory', patient: id, id: source.id };
  return source?.kind === 'call' ? { kind: 'call', patient: id } : null;
}

function readArchive(value: unknown): ArchiveProgress {
  const source = asObject(value);
  const items = Array.isArray(source?.read) ? source.read : [];
  const read = [...new Set(items.filter((id): id is ArchiveId => archiveIds.includes(id)))];
  const view = source?.view === 'index' ? 'index' : archiveIds.find(id => id === source?.view) ?? null;
  return { read, view };
}

function readEvaluation(value: unknown): EvaluationProgress | null {
  const source = asObject(value);
  if (!source) return null;
  const readThrough = readIndex(source.readThrough, -1, finalEvaluationPage);
  return {
    page: Math.min(readIndex(source.page, 0, finalEvaluationPage), readThrough + 1),
    readThrough,
    open: source.open === true,
    completed: readThrough === finalEvaluationPage && source.completed === true,
  };
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
  const isCurrent = source.schemaVersion === progress.schemaVersion;
  if (isCurrent && isHiddenFolderUnlocked(progress)) {
    progress.archive = readArchive(source.archive);
    progress.candleAppeared = source.candleAppeared === true && isHiddenArchiveCompleted(progress);
    if (progress.candleAppeared) {
      progress.evaluation = readEvaluation(source.evaluation);
      if (progress.evaluation?.completed && source.ending) progress.ending = readReading(source.ending, finalStory);
    }
  }

  const currentNovel = asObject(source.novel);
  const request = readSceneRequest(currentNovel?.scene, isCurrent);
  const scene = request && resolveScene(progress, request);
  if (!scene) return progress;
  const { page, choice } = readReading(currentNovel, storyForScene(scene));
  const done = scene.kind === 'ending' && progress.ending?.completed === true &&
    currentNovel?.done === true && page === lastPage(finalStory);
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
