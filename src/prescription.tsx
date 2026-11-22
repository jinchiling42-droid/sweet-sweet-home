import { useState, type ReactNode } from 'react';
import { FileCheck2, FileText, Phone } from 'lucide-react';
import { canIssuePrescription, local, patientStage, type IssuedPrescription, type Lang, type PatientStage, type Progress, type Text } from './game';
import { patientFiles, patientIds, type PatientFile, type PatientId, type PrescriptionDraft, type PrescriptionOption } from './patients';

import { titles } from './archive';

const stageLabel: Record<PatientStage, Text> = {
  consulting: ['상담 미완료', '尚未完成咨询'],
  prescribing: ['처방전 작성 대기', '等待制作处方'],
  calling: ['발급 완료 · 전화 상담 대기', '处方已制作 / 等待电话回访'],
  completed: ['완료', '已完成'],
};

const problemLabel: Text = ['주요 문제 판단', '主要问题判断'];
const interventionsLabel: Text = ['개입 방법', '干预方式'];
const adviceLabel: Text = ['상담 제안', '咨询建议'];

function PatientDetails({ patient, lang, showRecord }: { patient: PatientFile; lang: Lang; showRecord: boolean }) {
  return <section className="rx-details">
    <header>
      <span className="rx-number">{patient.number}</span>
      <h2>{local(patient.name, lang)}</h2>
    </header>
    <dl>
      <div><dt>{local(['기본 정보', '基本资料'], lang)}</dt><dd>{local(patient.profile, lang)}</dd></div>
      <div><dt>{local(['주 호소', '主诉'], lang)}</dt><dd>{local(patient.concern, lang)}</dd></div>
      {showRecord && <div><dt>{local(['상담 기록 요약', '咨询记录摘要'], lang)}</dt><dd>{local(patient.summary, lang)}</dd></div>}
    </dl>
  </section>;
}

function SingleSelection({ id, title, options, value, lang, onChange }: {
  id: string;
  title: Text;
  options: readonly PrescriptionOption[];
  value: string | null;
  lang: Lang;
  onChange: (id: string) => void;
}) {
  return <fieldset className="rx-choices">
    <legend>{local(title, lang)}</legend>
    {options.map(option => <label className="rx-option" key={option.id}>
      <input type="radio" name={id} checked={value === option.id} onChange={() => onChange(option.id)}/>
      <span>{local(option.label, lang)}</span>
    </label>)}
  </fieldset>;
}

function PrescriptionSheet({ patient, lang, draft, issued, stamping }: {
  patient: PatientFile;
  lang: Lang;
  draft: PrescriptionDraft;
  issued: IssuedPrescription | null;
  stamping: boolean;
}) {
  const choice = issued?.choices ?? draft;
  function labelFor(options: readonly PrescriptionOption[], id: string) {
    const label = options.find(option => option.id === id)?.label;
    return label ? local(label, lang) : '—';
  }
  return <article className="rx-sheet" aria-label={local(['처방전 미리 보기', '处方单预览'], lang)}>
    <header className="rx-sheet-heading">
      <h3>{local(titles.prescription, lang)}</h3>
      <span lang="en">Prescription</span>
    </header>
    <dl className="rx-sheet-meta">
      <div><dt>{local(['환자', '患者'], lang)}</dt><dd>{local(patient.name, lang)}</dd></div>
      <div><dt>{local(['번호', '编号'], lang)}</dt><dd className="rx-number">{patient.number}</dd></div>
      <div><dt>{local(['발급일', '日期'], lang)}</dt><dd>{issued
        ? <time dateTime={issued.issuedAt}>{new Date(issued.issuedAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'zh-CN')}</time> : '—'}</dd></div>
    </dl>
    <dl className="rx-sheet-fields" aria-live="polite">
      <div><dt>{local(problemLabel, lang)}</dt><dd>{labelFor(patient.options.problem, choice.problem)}</dd></div>
      <div><dt>{local(interventionsLabel, lang)}</dt><dd>{choice.interventions.length
        ? <ul>{choice.interventions.map(id => <li key={id}>{labelFor(patient.options.interventions, id)}</li>)}</ul> : '—'}</dd></div>
      <div><dt>{local(adviceLabel, lang)}</dt><dd>{labelFor(patient.options.advice, choice.advice)}</dd></div>
    </dl>
    <footer className="rx-signature">
      <div>{local(['담당 의사 서명', '医生签名'], lang)}
        <span>{issued ? local(['상담실 담당의', '咨询室值班医生'], lang) : '________________'}</span>
      </div>
      {issued && <strong className={`rx-stamp${stamping ? ' is-stamping' : ''}`} role={stamping ? 'status' : undefined}>
        {local(['발급 완료', '已开具'], lang)}
      </strong>}
    </footer>
  </article>;
}

export function PrescriptionApp({ lang, progress, onDraft, onIssue, onCall }: {
  lang: Lang;
  progress: Progress;
  onDraft: (id: PatientId, draft: PrescriptionDraft) => void;
  onIssue: (id: PatientId) => void;
  onCall: (id: PatientId) => void;
}) {
  const [selected, select] = useState<PatientId | null>(null);
  const [stamp, setStamp] = useState<PatientId | null>(null);
  const l = (text: Text) => local(text, lang);

  if (!selected) {
    return <div className="panel rx-app">
      <h2>{l(['환자 선택', '选择患者'])}</h2>
      <div className="rx-patient-list">
        {patientIds.map(id => {
          const patient = patientFiles[id];
          const stage = patientStage(id, progress.patients[id]);
          const Icon = stage === 'completed' ? FileCheck2 : FileText;
          return <button className="file-row rx-file-row" key={id} onClick={() => { setStamp(null); select(id); }}>
            <Icon size={22} aria-hidden="true"/>
            <span><strong>{l(patient.name)}</strong><small className="rx-number">{patient.number}</small></span>
            <span className={`rx-stage rx-stage-${stage}`}>{l(stageLabel[stage])}</span>
          </button>;
        })}
      </div>
    </div>;
  }

  const data = patientFiles[selected];
  const state = progress.patients[selected];
  const stage = patientStage(selected, state);
  const back = <button className="subtle" onClick={() => { setStamp(null); select(null); }}>
    {l(['환자 목록', '返回患者列表'])}
  </button>;

  if (stage === 'consulting') return <div className="panel rx-app">
    {back}
    <PatientDetails patient={data} lang={lang} showRecord={false}/>
    <p className="rx-stage rx-stage-consulting">{l(stageLabel.consulting)}</p>
    <button className="primary" disabled>{l(['처방전 작성', '制作处方'])}</button>
  </div>;

  const { draft, prescription } = state;
  const setDraft = (change: Partial<PrescriptionDraft>) => onDraft(selected, { ...draft, ...change });
  function toggleIntervention(id: string) {
    const selectedIds = draft.interventions;
    if (selectedIds.includes(id)) setDraft({ interventions: selectedIds.filter(value => value !== id) });
    else if (selectedIds.length < 2) setDraft({ interventions: [...selectedIds, id] });
  }

  let fields: ReactNode;
  if (!prescription) fields = <>
    <SingleSelection id="rx-problem" title={problemLabel} options={data.options.problem} value={draft.problem}
      lang={lang} onChange={problem => setDraft({ problem })}/>
    <fieldset className="rx-choices">
      <legend>{l(interventionsLabel)} <small>{l(['2개 선택', '选两项'])}</small></legend>
      {data.options.interventions.map(option => {
        const checked = draft.interventions.includes(option.id);
        return <label className="rx-option" key={option.id}>
          <input type="checkbox" checked={checked} disabled={!checked && draft.interventions.length === 2}
            onChange={() => toggleIntervention(option.id)}/>
          <span>{l(option.label)}</span>
        </label>;
      })}
    </fieldset>
    <SingleSelection id="rx-advice" title={adviceLabel} options={data.options.advice} value={draft.advice}
      lang={lang} onChange={advice => setDraft({ advice })}/>
  </>;

  return <div className="panel rx-app">
    <div className="rx-toolbar">{back}<span className={`rx-stage rx-stage-${stage}`}>{l(stageLabel[stage])}</span></div>
    <form className="rx-workbench" onSubmit={event => {
      event.preventDefault();
      if (prescription || !canIssuePrescription(draft)) return;
      setStamp(selected);
      onIssue(selected);
    }}>
      <div className="rx-inputs">
        <PatientDetails patient={data} lang={lang} showRecord/>
        {fields}
      </div>
      <aside className="rx-preview">
        <PrescriptionSheet patient={data} lang={lang} draft={draft} issued={prescription} stamping={stamp === selected}/>
        <div className="rx-actions">
          {!prescription && <button className="primary" type="submit" disabled={!canIssuePrescription(draft)}>
            {l(['처방전 발급', '开具处方'])}
          </button>}
          <button className={prescription ? 'primary' : 'subtle'} type="button" disabled={!prescription}
            onClick={() => onCall(selected)}>
            <Phone size={16} aria-hidden="true"/>
            {l(state.followUp.completed ? ['전화 다시 듣기', '重听回访'] : ['전화 상담', '电话回访'])}
          </button>
        </div>
      </aside>
    </form>
  </div>;
}
