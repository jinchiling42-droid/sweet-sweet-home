import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  appType: 'custom',
  server: { middlewareMode: true, watch: null, ws: false },
});
after(() => server.close());

const {
  advanceScene, chooseInScene, closeEvaluation, continueEvaluation, emptyProgress, enterScene,
  finishArchiveFile, finishEvaluationPage, fullStoryCompleted, isHiddenArchiveCompleted, isHiddenFolderUnlocked,
  openArchive, openEvaluation, patientStage, previousEvaluationPage, readPreferences, readProgress, returnFromArchive,
  saveSnapshot, submitReport, updateReportDraft, viewArchiveFile,
} = await server.ssrLoadModule('/src/game.ts');
const { archiveFiles, archiveIds, albumCode, requiredArchiveIds } = await server.ssrLoadModule('/src/archive-content.ts');
const { evaluationPages } = await server.ssrLoadModule('/src/evaluation-content.ts');
const { patientFiles, patientIds } = await server.ssrLoadModule('/src/patients.ts');
const { reportOptions } = await server.ssrLoadModule('/src/report-content.ts');
const { calls, finalStory, memories } = await server.ssrLoadModule('/src/story.ts');

const date = '2026-11-22T07:00:00.000Z';
const call = patient => ({ kind: 'call', patient });
const final = { kind: 'ending' };
const snapshot = progress => JSON.parse(JSON.stringify(saveSnapshot(progress)));

function readScene(progress, request) {
  let next = enterScene(progress, request);
  assert.notStrictEqual(next, progress);
  while (next.novel && !next.novel.done) {
    const advanced = advanceScene(next, next.novel);
    const step = advanced === next ? chooseInScene(next, next.novel, 0) : advanced;
    assert.notStrictEqual(step, next);
    next = step;
  }
  return next;
}

function consult(progress, id) {
  return patientFiles[id].memories.reduce((current, topic) =>
    readScene(current, { kind: 'memory', patient: id, id: topic }), progress);
}

function draftFor(id, style = 0) {
  const options = reportOptions[id];
  return {
    observation: options.observation[style].id,
    factor: options.factor[style].id,
    evidence: options.evidence.slice(style, style + 2).map(option => option.id),
    focus: options.focus[style].id,
  };
}

function report(progress, id, style = 0) {
  return submitReport(updateReportDraft(progress, id, draftFor(id, style)), id, date);
}

function finishPatient(progress, id, style = 0) {
  return readScene(report(consult(progress, id), id, style), call(id));
}

function finishPatients(style = 0) {
  return ['D', 'B', 'A', 'C'].reduce((current, id) => finishPatient(current, id, style), emptyProgress());
}

function readFiles(progress, ids) {
  return ids.reduce((next, id) => finishArchiveFile(viewArchiveFile(next, id), id), openArchive(progress));
}

function prepareEvaluation(progress) {
  return openEvaluation(returnFromArchive(readFiles(progress, [...requiredArchiveIds].reverse())));
}

function completeEvaluation(progress) {
  return evaluationPages.reduce((next, _, page) =>
    continueEvaluation(finishEvaluationPage(next, page)), progress);
}

test('individual report prerequisites, distinct stages, valid choices and immutable filing', () => {
  const start = emptyProgress();
  assert.deepEqual(Object.keys(start.patients), patientIds);
  assert.strictEqual(updateReportDraft(start, 'D', draftFor('D')), start);
  assert.strictEqual(submitReport(start, 'D', date), start);
  assert.strictEqual(enterScene(start, call('D')), start);
  const partlyRead = readScene(start, { kind: 'memory', patient: 'D', id: 'tape' });
  assert.equal(fullStoryCompleted('D', partlyRead.patients.D), false);

  const consulted = consult(partlyRead, 'D');
  assert.equal(patientStage('A', consulted.patients.A), 'consulting');
  assert.equal(patientStage('D', consulted.patients.D), 'reporting');
  const choices = draftFor('D', 2);
  const invalid = updateReportDraft(consulted, 'D', { ...choices, evidence: [choices.evidence[0], choices.evidence[0], 'unknown'] });
  assert.strictEqual(submitReport(invalid, 'D', date), invalid);
  const incomplete = updateReportDraft(consulted, 'D', { ...choices, focus: null });
  assert.strictEqual(submitReport(incomplete, 'D', date), incomplete);
  assert.strictEqual(enterScene(incomplete, call('D')), incomplete);
  const filed = submitReport(updateReportDraft(incomplete, 'D', { focus: choices.focus }), 'D', date);
  assert.deepEqual(filed.patients.D.report, { choices, submittedAt: date });
  assert.strictEqual(updateReportDraft(filed, 'D', draftFor('D')), filed);
  assert.strictEqual(submitReport(filed, 'D', date), filed);
  assert.equal(patientStage('D', filed.patients.D), 'submitted');
  assert.equal(patientStage('D', enterScene(filed, call('D')).patients.D), 'calling');
});

test('phone completion requires the final line and survives an interrupted or repeated call', () => {
  const filed = report(consult(emptyProgress(), 'B'), 'B');
  let reading = enterScene(filed, call('B'));
  for (let page = 0; page < calls.B.pages.length; page++) reading = advanceScene(reading, reading.novel);
  assert.equal(patientStage('B', reading.patients.B), 'calling');
  assert.strictEqual(advanceScene(reading, reading.novel), reading);
  const paused = { ...reading, novel: null };
  assert.equal(patientStage('B', readProgress(snapshot(paused)).patients.B), 'calling');
  const resumed = enterScene(readProgress(snapshot(paused)), call('B'));
  assert.equal(resumed.novel.page, reading.novel.page);
  const chosen = chooseInScene(resumed, resumed.novel, 1);
  assert.equal(chosen.patients.B.followUp.completed, false);
  const completed = advanceScene(chosen, chosen.novel);
  assert.equal(patientStage('B', completed.patients.B), 'completed');
  assert.deepEqual(readScene(completed, call('B')).patients.B.followUp, completed.patients.B.followUp);
});

test('three completed cases cannot unlock the archive, and the fourth can be any patient', () => {
  for (const last of patientIds) {
    const order = patientIds.filter(id => id !== last).reverse();
    const three = order.reduce((current, id) => finishPatient(current, id, 1), emptyProgress());
    assert.equal(isHiddenFolderUnlocked(three), false);
    assert.strictEqual(openArchive(three), three);
    assert.strictEqual(viewArchiveFile(three, 'album-note'), three);
    assert.strictEqual(openEvaluation(three), three);
    assert.strictEqual(enterScene(three, final), three);
    assert.equal(isHiddenFolderUnlocked(finishPatient(three, last)), true);
  }
});

test('the required archive subset gates the candle until returning to the desktop', () => {
  const cases = finishPatients();
  const open = openArchive(cases);
  assert.equal(isHiddenArchiveCompleted(open), false);
  assert.strictEqual(finishArchiveFile(open, 'journal'), open);
  const note = viewArchiveFile(open, 'album-note');
  assert.equal(albumCode, '041206');
  assert.ok(archiveFiles['album-note'].body[0][1].includes(albumCode));
  assert.ok(saveSnapshot(note).photoPasswordClueFound);
  const partial = readFiles(note, [requiredArchiveIds[1]]);
  assert.equal(returnFromArchive(partial).candleAppeared, false);
  const all = readFiles(partial, [...requiredArchiveIds].reverse());
  assert.equal(isHiddenArchiveCompleted(all), true);
  assert.equal(all.candleAppeared, false);
  assert.strictEqual(openEvaluation(all), all);
  assert.equal(all.archive.read.includes('tape'), false);
  assert.equal(all.archive.read.includes('print'), false);
  const loaded = readProgress(snapshot(all));
  assert.deepEqual(loaded.archive, all.archive);
  assert.equal(loaded.candleAppeared, false);
  const desktop = returnFromArchive(loaded);
  assert.equal(desktop.candleAppeared, true);
  assert.equal(desktop.archive.view, null);
  assert.equal(readProgress(snapshot(desktop)).candleAppeared, true);
  assert.ok(openEvaluation(desktop).evaluation.open);
});

test('diverse report choices reach the same ending after reading the evaluation, without visiting the album', () => {
  for (const style of [0, 1, 2]) {
    const initial = prepareEvaluation(finishPatients(style));
    assert.strictEqual(enterScene(initial, final), initial);
    assert.strictEqual(continueEvaluation(initial), initial);
    assert.strictEqual(finishEvaluationPage(initial, 1), initial);
    assert.equal(initial.archive.read.includes('album-note'), false);
    const nextPage = continueEvaluation(finishEvaluationPage(initial, 0));
    assert.equal(nextPage.evaluation.page, 1);
    assert.equal(previousEvaluationPage(nextPage).evaluation.page, 0);
    assert.deepEqual(readProgress(snapshot(nextPage)), nextPage);
    const closed = closeEvaluation(nextPage);
    assert.strictEqual(enterScene(closed, final), closed);
    assert.equal(openEvaluation(readProgress(snapshot(closed))).evaluation.page, 1);
    const entering = completeEvaluation(initial);
    assert.equal(entering.evaluation.open, false);
    assert.equal(entering.evaluation.completed, true);
    assert.equal(entering.novel.scene.kind, 'ending');
    const mid = advanceScene(entering, entering.novel);
    assert.deepEqual(readProgress(snapshot(mid)), mid);
    const end = readScene(mid, final);
    assert.equal(end.ending.completed, true);
    assert.equal(readProgress(snapshot(end)).novel.done, true);
  }
});

test('drafts, partial memories and the exact active phone choice round trip', () => {
  let state = enterScene(emptyProgress(), { kind: 'memory', patient: 'C', id: 'knife' });
  state = advanceScene(state, state.novel);
  state = consult({ ...state, novel: null }, 'D');
  state = updateReportDraft(state, 'D', { ...draftFor('D'), focus: null });
  state = finishPatient(state, 'B', 2);
  state = enterScene(report(consult(state, 'A'), 'A'), call('A'));
  for (let page = 0; page < calls.A.pages.length; page++) state = advanceScene(state, state.novel);
  state = chooseInScene(state, state.novel, 1);
  const saved = snapshot(state);
  assert.deepEqual(readProgress(saved), state);
  assert.equal(saved.patients.D.caseReportSubmitted, false);
  assert.equal(saved.patients.C.memories.knife.page, 1);
  assert.equal(saved.patients.B.followUpCompleted, true);
  assert.equal(saved.patients.A.followUpCompleted, false);
  assert.equal(saved.hiddenArchiveCompleted, false);
  assert.equal(saved.photoPasswordClueFound, false);
});

test('old save files retain consultation and follow-up progress without inheriting a report or ending', () => {
  const old = finishPatient(emptyProgress(), 'A');
  const v2 = {
    schemaVersion: 2, patients: { A: { memories: old.patients.A.memories,
      followUp: old.patients.A.followUp, prescription: { prescriptionCorrect: true } } },
    ending: { variant: 'truth', page: 3 }, novel: { scene: { kind: 'ending', variant: 'truth' }, page: 3 },
  };
  const migrated = readProgress(v2);
  assert.equal(migrated.patients.A.followUp.completed, true);
  assert.equal(migrated.patients.A.report, null);
  assert.equal(patientStage('A', migrated.patients.A), 'reporting');
  assert.equal(migrated.novel, null);
  assert.equal(migrated.ending, null);
  assert.equal(migrated.candleAppeared, false);
  assert.strictEqual(enterScene(migrated, call('A')), migrated);
  assert.equal(patientStage('A', report(readProgress(snapshot(migrated)), 'A').patients.A), 'completed');

  const v1 = {
    patients: [{ explored: patientFiles.A.memories }, { explored: ['hunger'] }],
    novel: { scene: { kind: 'memory', patient: 1, id: 'relation' }, page: 1, choice: null },
  };
  const earliest = readProgress(v1);
  assert.equal(earliest.patients.B.memories.hunger.completed, true);
  assert.equal(earliest.novel.scene.patient, 'B');
  assert.equal(earliest.novel.page, 1);
  assert.equal(readPreferences({ sound: true }).effectsVolume, 100);
  assert.equal(readProgress(null), null);
});

test('saved derived flags cannot skip missing prerequisites, and sample content is ready to replace', () => {
  const invalid = readProgress({
    ...snapshot(emptyProgress()),
    hiddenFolderUnlocked: true, hiddenArchiveCompleted: true, candleAppeared: true,
    archive: { view: 'index', read: archiveIds },
    evaluation: { open: true, completed: true, page: 1, readThrough: 1 },
    novel: { scene: final, page: 0 },
  });
  assert.deepEqual(invalid, emptyProgress());
  assert.ok(finalStory.pages.length >= 15 && finalStory.pages.length <= 20);
  assert.ok(requiredArchiveIds.length < archiveIds.length);
  for (const id of patientIds) {
    const options = reportOptions[id];
    for (const key of ['observation', 'factor', 'focus']) assert.equal(options[key].length, 3);
    assert.ok(options.evidence.length >= 2);
    assert.ok(options.evidence.every(option => patientFiles[id].memories.includes(option.memory) && memories[option.memory]));
  }
});
