import { useLayoutEffect, useRef } from 'react';
import { Settings2 } from 'lucide-react';
import { evaluationMeta, evaluationPages, evaluationSignature, evaluationTitle } from './evaluation-content';
import { local, type EvaluationProgress, type Lang, type Text } from './game';
import { ReadEnd } from './read-end';

export function Evaluation({ lang, state, onRead, onNext, onPrevious, onSettings }: {
  lang: Lang;
  state: EvaluationProgress;
  onRead: (page: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSettings: () => void;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const l = (text: Text) => local(text, lang);
  const { page, readThrough } = state;
  const last = page === evaluationPages.length - 1;
  useLayoutEffect(() => {
    if (scroll.current) scroll.current.scrollTop = 0;
    heading.current?.focus();
  }, [page]);

  return <main className="evaluation-screen" aria-labelledby="evaluation-title">
    <header className="novel-header">
      <button onClick={onSettings} aria-haspopup="dialog">
        <Settings2 size={17} aria-hidden="true"/>{l(['시스템 설정', '系统设置'])}
      </button>
    </header>
    <div className="evaluation-scroll" ref={scroll} tabIndex={0}>
      <article className="report-sheet evaluation-paper">
        <header className="report-sheet-heading">
          <h1 id="evaluation-title" ref={heading} tabIndex={-1}>{l(evaluationTitle)}</h1>
          <span lang="en">Psychiatric Evaluation Report</span>
        </header>
        {page === 0 && <dl className="report-sheet-meta">
          {evaluationMeta.map(field => <div key={field.label[0]}><dt>{l(field.label)}</dt><dd>{l(field.value)}</dd></div>)}
        </dl>}
        <dl className="report-sheet-fields">
          {evaluationPages[page].map(field => <div key={field.label[0]}><dt>{l(field.label)}</dt><dd>{l(field.value)}</dd></div>)}
        </dl>
        {last && <footer className="report-signature">
          <div>{l(['담당 의사 서명', '医生签名'])}<span>{l(evaluationSignature)}</span></div>
          <strong className="report-stamp">{l(['기록실 사본', '记录室存档'])}</strong>
        </footer>}
        <div key={page}><ReadEnd enabled={readThrough < page} onReach={() => onRead(page)}/></div>
        <div className="evaluation-actions">
          <span className="report-number">{page + 1} / {evaluationPages.length}</span>
          {page > 0 && <button className="subtle" onClick={onPrevious}>{l(['이전 쪽', '上一页'])}</button>}
          {readThrough >= page && <button className="primary" onClick={onNext}>
            {l(last ? ['계속', '继续'] : ['다음 쪽', '下一页'])}
          </button>}
        </div>
      </article>
    </div>
  </main>;
}
