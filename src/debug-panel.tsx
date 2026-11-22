import {
  advanceScene, chooseInScene, emptyProgress, enterScene, issuePrescription, local,
  updatePrescriptionDraft, type EndingVariant, type Lang, type Progress, type SceneRequest, type Text,
} from './game';
import { patientFiles, patientIds } from './patients';

function readThrough(progress: Progress, request: SceneRequest): Progress {
  let next = enterScene(progress, request);
  while (next.novel && !next.novel.done) {
    const step = advanceScene(next, next.novel);
    const advanced = step === next ? chooseInScene(next, next.novel, 0) : step;
    if (advanced === next) break;
    next = advanced;
  }
  return next;
}

function finishConsultations(progress: Progress) {
  return patientIds.reduce((current, id) => patientFiles[id].memories.reduce((next, key) =>
    readThrough(next, { kind: 'memory', patient: id, id: key }), current), progress);
}

function seedEnding(variant: EndingVariant): Progress {
  const issuedAt = new Date().toISOString();
  return patientIds.reduce((current, id) => {
    const { answer, options } = patientFiles[id];
    const draft = variant === 'truth' ? answer : {
      ...answer,
      problem: options.problem.find(option => option.id !== answer.problem)!.id,
    };
    const prescribed = issuePrescription(updatePrescriptionDraft(current, id, draft), id, issuedAt);
    return readThrough(prescribed, { kind: 'call', patient: id });
  }, finishConsultations(emptyProgress()));
}

export default function DebugPanel({ lang, progress, onChange, onReset }: {
  lang: Lang;
  progress: Progress;
  onChange: (progress: Progress) => void;
  onReset: (trigger: HTMLElement) => void;
}) {
  const l = (text: Text) => local(text, lang);
  return <details className="dev-progress">
    <summary>{l(['개발 테스트', '开发调试'])}</summary>
    <div className="dev-progress-actions">
      <button onClick={() => onChange(finishConsultations(progress))}>
        {l(['네 환자 상담 완료 처리', '标记四位患者咨询完成'])}
      </button>
      <button onClick={() => onChange(seedEnding('ordinary'))}>
        {l(['일반 결말 테스트 상태', '载入普通结局测试状态'])}
      </button>
      <button onClick={() => onChange(seedEnding('truth'))}>
        {l(['숨겨진 결말 테스트 상태', '载入真结局测试状态'])}
      </button>
      <button onClick={event => onReset(event.currentTarget)}>{l(['게임 진행 초기화', '重置游戏状态'])}</button>
    </div>
    <dl>{patientIds.map(id => {
      const result = progress.patients[id].prescription?.prescriptionCorrect;
      return <div key={id}><dt>{l(patientFiles[id].name)}</dt>
        <dd>{result === undefined ? l(['미발급', '未开具']) : l(result ? ['일치', '匹配'] : ['불일치', '不匹配'])}</dd>
      </div>;
    })}</dl>
  </details>;
}
