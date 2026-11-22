import { useState } from 'react';
import { Check, ClipboardCheck, FileText, Phone } from 'lucide-react';
import { canSubmitReport, local, patientStage, type CaseReport, type Lang, type PatientStage, type Progress, type Text } from './game';
import { patientFiles, patientIds, type PatientFile, type PatientId } from './patients';
import { reportOptions, reportTitle, type ReportDraft, type ReportOption } from './report-content';
import { memories } from './story';

export const stageLabel: Record<PatientStage, Text> = {
  consulting: ['상담 미완료', '咨询未完成'],
  reporting: ['보고서 작성 대기', '等待整理报告'],
  submitted: ['보고서 제출 완료', '报告已提交'],
  calling: ['전화 상담 진행 중', '电话回访进行中'],
  completed: ['사례 완료', '个案已完成'],
};

const moduleLabels: Record<keyof ReportDraft, Text> = {
  observation: ['주요 행동 관찰', '主要行为观察'],
  factor: ['가능한 영향 요인', '可能的影响因素'],
  evidence: ['주요 근거', '重要证据'],
  focus: ['후속 상담의 초점', '后续咨询重点'],
};
const archivedLabel: Text = ['기록 보관 완료', '记录已归档'];

function PatientDetails({ patient, lang, showRecord }: { patient: PatientFile; lang: Lang; showRecord: boolean }) {
  return <section className="report-details">
    <header>
      <span className="report-number">{patient.number}</span>
      <h2>{local(patient.name, lang)}</h2>
    </header>
    <dl>
      <div><dt>{local(['기본 정보', '基本资料'], lang)}</dt><dd>{local(patient.profile, lang)}</dd></div>
      <div><dt>{local(['주 호소', '主诉'], lang)}</dt><dd>{local(patient.concern, lang)}</dd></div>
      {showRecord && <div><dt>{local(['상담 기록 요약', '咨询记录摘要'], lang)}</dt><dd>{local(patient.summary, lang)}</dd></div>}
    </dl>
    {showRecord && <details className="report-transcript">
      <summary>{local(['상담 기록 원문', '咨询记录原文'], lang)}</summary>
      {patient.notes.map((note, index) => <p key={index}>{local(note, lang)}</p>)}
    </details>}
  </section>;
}

function SingleSelection({ id, options, value, lang, onChange }: {
  id: Exclude<keyof ReportDraft, 'evidence'>;
  options: readonly ReportOption[];
  value: string | null;
  lang: Lang;
  onChange: (id: string) => void;
}) {
  return <fieldset className="report-choices">
    <legend>{local(moduleLabels[id], lang)}</legend>
    {options.map(option => <label className="report-option" key={option.id}>
      <input type="radio" name={id} checked={value === option.id} onChange={() => onChange(option.id)}/>
      <span>{local(option.label, lang)}</span>
    </label>)}
  </fieldset>;
}

function ReportSheet({ id, lang, draft, report, stamping }: {
  id: PatientId;
  lang: Lang;
  draft: ReportDraft;
  report: CaseReport | null;
  stamping: boolean;
}) {
  const patient = patientFiles[id];
  const options = reportOptions[id];
  const choice = report?.choices ?? draft;
  const l = (text: Text) => local(text, lang);
  function labelFor(list: readonly ReportOption[], key: string | null) {
    const label = list.find(option => option.id === key)?.label;
    return label ? l(label) : '—';
  }
  return <article className="report-sheet" aria-label={l(['사례개념화 미리 보기', '个案报告预览'])}>
    <header className="report-sheet-heading">
      <h3>{l(reportTitle)}</h3><span lang="en">Case Report</span>
    </header>
    <dl className="report-sheet-meta">
      <div><dt>{l(['환자', '患者'])}</dt><dd>{l(patient.name)}</dd></div>
      <div><dt>{l(['번호', '编号'])}</dt><dd className="report-number">{patient.number}</dd></div>
      <div><dt>{l(['작성일', '日期'])}</dt><dd>{report
        ? <time dateTime={report.submittedAt}>{new Date(report.submittedAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'zh-CN')}</time> : '—'}</dd></div>
    </dl>
    <dl className="report-sheet-fields" aria-live="polite">
      <div><dt>{l(moduleLabels.observation)}</dt><dd>{labelFor(options.observation, choice.observation)}</dd></div>
      <div><dt>{l(moduleLabels.factor)}</dt><dd>{labelFor(options.factor, choice.factor)}</dd></div>
      <div><dt>{l(moduleLabels.evidence)}</dt><dd>{choice.evidence.length
        ? <ul className="report-excerpts">{choice.evidence.map(key => <li key={key}>{labelFor(options.evidence, key)}</li>)}</ul> : '—'}</dd></div>
      <div><dt>{l(moduleLabels.focus)}</dt><dd>{labelFor(options.focus, choice.focus)}</dd></div>
    </dl>
    <footer className="report-signature">
      <div>{l(['담당 의사 서명', '医生签名'])}
        <span>{report ? l(['상담실 담당의', '咨询室值班医生']) : '________________'}</span>
      </div>
      {report && <strong className={`report-stamp${stamping ? ' is-stamping' : ''}`} role={stamping ? 'status' : undefined}>
        {l(archivedLabel)}
      </strong>}
    </footer>
  </article>;
}

export function CaseReportApp({ lang, progress, onDraft, onSubmit, onCall }: {
  lang: Lang;
  progress: Progress;
  onDraft: (id: PatientId, change: Partial<ReportDraft>) => void;
  onSubmit: (id: PatientId) => void;
  onCall: (id: PatientId) => void;
}) {
  const [selected, select] = useState<PatientId | null>(null);
  const [stamp, setStamp] = useState<PatientId | null>(null);
  const l = (text: Text) => local(text, lang);

  if (!selected) return <div className="panel report-app">
    <h2>{l(['환자 선택', '选择患者'])}</h2>
    <div className="report-patient-list">
      {patientIds.map(id => {
        const patient = patientFiles[id];
        const stage = patientStage(id, progress.patients[id]);
        const Icon = stage === 'completed' ? ClipboardCheck : FileText;
        return <button className="file-row report-file-row" key={id} onClick={() => { setStamp(null); select(id); }}>
          <Icon size={22} aria-hidden="true"/>
          <span><strong>{l(patient.name)}</strong><small className="report-number">{patient.number}</small></span>
          <span className={`report-stage report-stage-${stage}`}>{l(stageLabel[stage])}</span>
        </button>;
      })}
    </div>
  </div>;

  const patient = patientFiles[selected];
  const { draft, report, followUp } = progress.patients[selected];
  const stage = patientStage(selected, progress.patients[selected]);
  const options = reportOptions[selected];
  const back = <button className="subtle" onClick={() => { setStamp(null); select(null); }}>
    {l(['환자 목록', '返回患者列表'])}
  </button>;

  if (stage === 'consulting') return <div className="panel report-app">
    {back}
    <PatientDetails patient={patient} lang={lang} showRecord={false}/>
    <p className="report-stage">{l(stageLabel.consulting)}</p>
    <button className="primary" disabled>{l(['보고서 작성', '整理报告'])}</button>
  </div>;

  const change = (fields: Partial<ReportDraft>) => onDraft(selected, fields);
  return <div className="panel report-app">
    <div className="report-toolbar">{back}<span className={`report-stage report-stage-${stage}`}>{l(stageLabel[stage])}</span></div>
    <form className="report-workbench" onSubmit={event => {
      event.preventDefault();
      if (report || !canSubmitReport(draft)) return;
      setStamp(selected);
      onSubmit(selected);
    }}>
      <div>
        <PatientDetails patient={patient} lang={lang} showRecord/>
        {!report && <>
          <SingleSelection id="observation" options={options.observation} value={draft.observation}
            lang={lang} onChange={observation => change({ observation })}/>
          <SingleSelection id="factor" options={options.factor} value={draft.factor}
            lang={lang} onChange={factor => change({ factor })}/>
          <fieldset className="report-choices report-evidence">
            <legend>{l(moduleLabels.evidence)} <small>{l(['2개 선택', '添加两条'])}</small></legend>
            {options.evidence.map(option => {
              const attached = draft.evidence.includes(option.id);
              return <button key={option.id} type="button" className="report-evidence-card" aria-pressed={attached}
                disabled={!attached && draft.evidence.length >= 2}
                onClick={() => change({ evidence: attached ? draft.evidence.filter(key => key !== option.id)
                  : [...draft.evidence, option.id] })}>
                <span><small>{l(memories[option.memory].title)}</small><span>{l(option.label)}</span></span>
                <span className="report-evidence-action">{attached ? <Check size={14} aria-hidden="true"/> : null}
                  {l(attached ? ['추가됨', '已添加'] : ['추가', '添加'])}</span>
              </button>;
            })}
          </fieldset>
          <SingleSelection id="focus" options={options.focus} value={draft.focus}
            lang={lang} onChange={focus => change({ focus })}/>
        </>}
      </div>
      <aside className="report-preview">
        <ReportSheet id={selected} lang={lang} draft={draft} report={report} stamping={stamp === selected}/>
        <div className="report-actions">
          {!report && <button className="primary" type="submit" disabled={!canSubmitReport(draft)}>
            {l(['보고서 제출', '提交报告'])}
          </button>}
          <button className={report ? 'primary' : 'subtle'} type="button" disabled={!report} onClick={() => onCall(selected)}>
            <Phone size={16} aria-hidden="true"/>
            {l(followUp.completed ? ['전화 다시 듣기', '重听回访']
              : stage === 'calling' ? ['전화 상담 계속', '继续回访'] : ['전화 상담', '电话回访'])}
          </button>
        </div>
      </aside>
    </form>
  </div>;
}
