import { archiveIds, findArchiveFile, requiredArchiveIds } from './archive-content';
import { stageLabel } from './case-reports';
import { evaluationPages } from './evaluation-content';
import {
  advanceScene, canSubmitReport, chooseInScene, continueEvaluation, enterScene, finishArchiveFile,
  finishEvaluationPage, fullStoryCompleted, isHiddenFolderUnlocked, local, openArchive, openEvaluation,
  patientStage, returnFromArchive, submitReport, updateReportDraft, viewArchiveFile,
  type Lang, type Progress, type SceneRequest, type Text,
} from './game';
import { patientFiles, patientIds, type PatientId } from './patients';
import { reportOptions } from './report-content';
import { CakeArtwork } from './visuals';

function readThrough(progress: Progress, request: SceneRequest): Progress {
  let next = enterScene(progress, request);
  if (next === progress) return progress;
  while (next.novel && !next.novel.done) {
    const step = advanceScene(next, next.novel);
    const advanced = step === next ? chooseInScene(next, next.novel, 0) : step;
    if (advanced === next) break;
    next = advanced;
  }
  return next;
}

function finishStory(progress: Progress, id: PatientId) {
  return patientFiles[id].memories.reduce((next, key) =>
    next.patients[id].memories[key]?.completed ? next : readThrough(next, { kind: 'memory', patient: id, id: key }), progress);
}

function fileReport(progress: Progress, id: PatientId) {
  const next = finishStory(progress, id);
  if (next.patients[id].report) return next;
  const { observation, factor, evidence, focus } = reportOptions[id];
  const draft = next.patients[id].draft;
  const filled = canSubmitReport(draft) ? next : updateReportDraft(next, id, {
    observation: draft.observation ?? observation[0].id,
    factor: draft.factor ?? factor[0].id,
    evidence: [...new Set([...draft.evidence, ...evidence.slice(0, 2).map(option => option.id)])].slice(0, 2),
    focus: draft.focus ?? focus[0].id,
  });
  return submitReport(filled, id, new Date().toISOString());
}

function finishCall(progress: Progress, id: PatientId) {
  const next = fileReport(progress, id);
  return next.patients[id].followUp.completed ? next : readThrough(next, { kind: 'call', patient: id });
}

function finishPatients(progress: Progress) {
  return patientIds.reduce(finishCall, progress);
}

function finishRequiredArchive(progress: Progress) {
  const open = openArchive(finishPatients(progress));
  const read = requiredArchiveIds.reduce((next, id) => finishArchiveFile(viewArchiveFile(next, id), id), open);
  return viewArchiveFile(read, 'index');
}

function previewEvaluation(progress: Progress) {
  const ready = returnFromArchive(finishRequiredArchive(progress));
  return openEvaluation({ ...ready, evaluation: null, ending: null, novel: null });
}

function previewTruth(progress: Progress) {
  return evaluationPages.reduce((next, _, page) => continueEvaluation(finishEvaluationPage(next, page)), previewEvaluation(progress));
}

export default function DebugPanel({ lang, progress, onChange, onShowDesktop, onReset }: {
  lang: Lang;
  progress: Progress;
  onChange: (progress: Progress) => void;
  onShowDesktop: (progress: Progress) => void;
  onReset: (trigger: HTMLElement) => void;
}) {
  const l = (text: Text) => local(text, lang);
  const unlocked = isHiddenFolderUnlocked(progress);
  return <details className="dev-progress">
    <summary>{l(['개발 테스트', '开发调试'])}</summary>
    <div className="dev-patients">
      {patientIds.map(id => {
        const state = progress.patients[id];
        return <fieldset key={id}>
          <legend>{l(patientFiles[id].name)} · {l(stageLabel[patientStage(id, state)])}</legend>
          <div className="dev-progress-actions">
            <button onClick={() => onChange(finishStory(progress, id))} disabled={fullStoryCompleted(id, state)}>
              {l(['이야기 완료', '完成故事'])}
            </button>
            <button onClick={() => onChange(fileReport(progress, id))} disabled={!!state.report}>
              {l(['보고서 제출', '提交报告'])}
            </button>
            <button onClick={() => onChange(finishCall(progress, id))} disabled={!!state.report && state.followUp.completed}>
              {l(['전화 상담 완료', '完成回访'])}
            </button>
          </div>
        </fieldset>;
      })}
    </div>
    <div className="dev-progress-actions">
      <button onClick={() => onChange(finishPatients(progress))}>{l(['네 사례 완료', '完成全部四位患者'])}</button>
      <button onClick={() => onChange(openArchive(finishPatients(progress)))}>{l(['숨겨진 폴더 열기', '解锁隐藏文件夹'])}</button>
      <button onClick={() => onChange(finishRequiredArchive(progress))}>{l(['필수 자료 확인 완료', '完成必读档案'])}</button>
      <button onClick={() => onShowDesktop(returnFromArchive(finishRequiredArchive(progress)))}>
        {l(['촛불이 있는 데스크톱', '返回桌面测试蜡烛'])}
      </button>
    </div>
    <details className="dev-file-list">
      <summary>{l(['자료별 확인', '标记单份档案'])}</summary>
      {archiveIds.map(id => <button key={id} disabled={!unlocked || progress.archive.read.includes(id)}
        onClick={() => onChange(finishArchiveFile(viewArchiveFile(openArchive(progress), id), id))}>{l(findArchiveFile(id).title)}</button>)}
    </details>
    <div className="dev-cakes">
      <figure><CakeArtwork/><figcaption>{l(['촛불 없음', '无蜡烛预览'])}</figcaption></figure>
      <figure><CakeArtwork candle/><figcaption>{l(['촛불 있음', '有蜡烛预览'])}</figcaption></figure>
    </div>
    <div className="dev-progress-actions">
      <button onClick={() => onChange(previewEvaluation(progress))}>{l(['평가 보고서 열기', '直接测试主角评估报告'])}</button>
      <button onClick={() => onChange(previewTruth(progress))}>{l(['최종 이야기 열기', '直接测试最终真相剧情'])}</button>
      <button onClick={event => onReset(event.currentTarget)}>{l(['게임 전체 초기화', '重置所有游戏状态'])}</button>
    </div>
  </details>;
}
