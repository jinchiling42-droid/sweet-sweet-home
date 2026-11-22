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
  advanceScene, chooseInScene, emptyProgress, endingVariant, enterScene, fullStoryCompleted,
  isHiddenFolderUnlocked, issuePrescription, patientStage, readPreferences, readProgress, saveSnapshot,
  updatePrescriptionDraft,
} = await server.ssrLoadModule('/src/game.ts');
const { patientFiles, patientIds } = await server.ssrLoadModule('/src/patients.ts');
const { calls, endings, storyForScene } = await server.ssrLoadModule('/src/story.ts');

const date = '2026-11-22T07:00:00.000Z';
const call = patient => ({ kind: 'call', patient });
const final = { kind: 'ending' };
const snapshot = progress => JSON.parse(JSON.stringify(saveSnapshot(progress)));

function readSceneToEnd(progress, request) {
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
    readSceneToEnd(current, { kind: 'memory', patient: id, id: topic }), progress);
}

function prescribe(progress, id, correct = true) {
  const { answer, options } = patientFiles[id];
  const draft = {
    ...answer,
    interventions: [...answer.interventions].reverse(),
    problem: correct ? answer.problem : options.problem.find(option => option.id !== answer.problem).id,
  };
  return issuePrescription(updatePrescriptionDraft(progress, id, draft), id, date);
}

test('consultation, issue and phone completion cannot skip their prerequisites', () => {
  const start = emptyProgress();
  assert.deepEqual(Object.keys(start.patients), patientIds);
  assert.equal(patientStage('A', start.patients.A), 'consulting');
  assert.strictEqual(updatePrescriptionDraft(start, 'A', patientFiles.A.answer), start);
  assert.strictEqual(issuePrescription(start, 'A', date), start);
  const partial = readSceneToEnd(start, { kind: 'memory', patient: 'A', id: 'mirror' });
  assert.equal(fullStoryCompleted('A', partial.patients.A), false);
  const consulted = consult(partial, 'A');
  const halfDraft = updatePrescriptionDraft(consulted, 'A', { problem: 'order', interventions: ['before'], advice: 'feeling' });
  assert.equal(patientStage('A', halfDraft.patients.A), 'prescribing');
  assert.strictEqual(issuePrescription(halfDraft, 'A', date), halfDraft);
  assert.strictEqual(enterScene(halfDraft, call('A')), halfDraft);

  const issued = prescribe(halfDraft, 'A', false);
  assert.equal(issued.patients.A.prescription.prescriptionCorrect, false);
  assert.equal(patientStage('A', issued.patients.A), 'calling');
  assert.strictEqual(updatePrescriptionDraft(issued, 'A', patientFiles.A.answer), issued);
  assert.strictEqual(issuePrescription(issued, 'A', date), issued);
  let calling = enterScene(issued, call('A'));
  for (let page = 0; page < calls.A.pages.length; page++) calling = advanceScene(calling, calling.novel);
  assert.equal(patientStage('A', calling.patients.A), 'calling');
  assert.strictEqual(advanceScene(calling, calling.novel), calling);
  const chosen = chooseInScene(calling, calling.novel, 1);
  assert.equal(chosen.patients.A.followUp.completed, false);
  const completed = advanceScene(chosen, chosen.novel);
  assert.equal(patientStage('A', completed.patients.A), 'completed');
  const replay = readSceneToEnd(completed, call('A'));
  assert.deepEqual(replay.patients.A.followUp, completed.patients.A.followUp);
});

test('all-wrong and mixed prescriptions can unlock the folder and play the ordinary ending', () => {
  let state = emptyProgress();
  for (const id of patientIds.slice(0, 3)) state = readSceneToEnd(prescribe(consult(state, id), id, false), call(id));
  assert.equal(isHiddenFolderUnlocked(state), false);
  assert.strictEqual(enterScene(state, final), state);
  const lastConsult = consult(state, 'D');
  for (const correct of [false, true]) {
    const completed = readSceneToEnd(prescribe(lastConsult, 'D', correct), call('D'));
    assert.equal(isHiddenFolderUnlocked(completed), true);
    assert.equal(endingVariant(completed), 'ordinary');
    const ending = readSceneToEnd(completed, final);
    assert.equal(ending.ending.variant, 'ordinary');
    assert.equal(ending.ending.completed, true);
    assert.equal(storyForScene(ending.novel.scene).pages.length, 10);
    assert.equal(readProgress(snapshot(ending)).novel.done, true);
  }
});

test('four matching prescriptions in reverse intervention order reach the true ending', () => {
  const state = patientIds.reduce((current, id) =>
    readSceneToEnd(prescribe(consult(current, id), id), call(id)), emptyProgress());
  assert.equal(isHiddenFolderUnlocked(state), true);
  assert.equal(endingVariant(state), 'truth');
  assert.equal(enterScene(state, final).ending.completed, false);
  const ending = readSceneToEnd(state, final);
  assert.equal(ending.ending.completed, true);
  assert.equal(ending.ending.variant, 'truth');
  assert.equal(storyForScene(ending.novel.scene).pages.length, 16);

  const copy = snapshot(ending);
  const wrong = patientFiles.C.options.problem.find(option => option.id !== patientFiles.C.answer.problem);
  copy.patients.C.prescription.choices.problem = wrong.id;
  const loaded = readProgress(copy);
  assert.equal(loaded.patients.C.prescription.prescriptionCorrect, false);
  assert.equal(loaded.novel, null);
  assert.equal(endingVariant(loaded), 'ordinary');
});

test('snapshots preserve drafts, partial memories, issued choices and the exact line or choice', () => {
  let state = enterScene(emptyProgress(), { kind: 'memory', patient: 'C', id: 'knife' });
  state = advanceScene(state, state.novel);
  state = { ...state, novel: null };
  state = updatePrescriptionDraft(consult(state, 'A'), 'A', {
    problem: 'routine', interventions: ['photo'], advice: null,
  });
  state = readSceneToEnd(prescribe(consult(state, 'B'), 'B'), call('B'));
  state = enterScene(prescribe(state, 'A'), call('A'));
  for (let page = 0; page < calls.A.pages.length; page++) state = advanceScene(state, state.novel);
  state = chooseInScene(state, state.novel, 1);
  const saved = snapshot(state);
  const loaded = readProgress(saved);
  assert.deepEqual(loaded, state);
  assert.equal(loaded.patients.B.followUp.completed, true);
  assert.equal(loaded.patients.C.memories.knife.page, 1);
  assert.equal(loaded.patients.A.followUp.completed, false);
  assert.equal(loaded.novel.choice, 1);
  assert.equal(saved.hiddenFolderUnlocked, false);
  assert.equal(saved.patients.A.prescriptionIssued, true);
  assert.equal(saved.patients.B.followUpCompleted, true);
  assert.deepEqual(readProgress(snapshot(prescribe(consult(emptyProgress(), 'A'), 'A'))).patients.A.prescription.issuedAt, date);

  const draftOnly = updatePrescriptionDraft(consult(emptyProgress(), 'A'), 'A', {
    problem: 'routine', interventions: ['photo'], advice: null,
  });
  assert.deepEqual(readProgress(snapshot(draftOnly)).patients.A.draft, draftOnly.patients.A.draft);
});

test('old saves keep A/B memories and restore safe defaults for the new flow', () => {
  const legacy = {
    patients: [{ explored: patientFiles.A.memories, called: true }, { explored: ['hunger'], called: false }],
    ending: true,
    novel: { scene: { kind: 'memory', patient: 1, id: 'relation' }, page: 1, choice: null },
  };
  const migrated = readProgress(legacy);
  assert.equal(patientStage('A', migrated.patients.A), 'prescribing');
  assert.equal(migrated.patients.B.memories.hunger.completed, true);
  assert.equal(migrated.novel.scene.patient, 'B');
  assert.equal(migrated.novel.page, 1);
  assert.equal(migrated.patients.C.memories.knife.completed, false);
  assert.equal(migrated.patients.D.followUp.completed, false);
  assert.equal(migrated.ending, null);
  assert.equal(isHiddenFolderUnlocked(migrated), false);
  assert.equal(readProgress({ ...legacy, novel: { scene: { kind: 'call', patient: 0 }, page: 1 } }).novel, null);
  assert.equal(readPreferences({ sound: true }).effectsVolume, 100);
  assert.equal(readProgress(null), null);
});

test('demo scripts contain the requested lengths', () => {
  for (const id of patientIds) {
    const call = calls[id];
    const lines = call.pages.length + Number(!!call.choices?.length);
    assert.ok(lines >= 8 && lines <= 12);
  }
  assert.ok(endings.ordinary.pages.length >= 8 && endings.ordinary.pages.length <= 12);
  assert.ok(endings.truth.pages.length >= 12 && endings.truth.pages.length <= 20);
});
