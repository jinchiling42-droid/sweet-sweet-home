import { useEffect, useRef, useState } from 'react';
import type { SceneKey } from './archive';
import { local, type Lang } from './game';
import { calls, ending, memories } from './story';

export function Novel({ scene, lang, onBack, onComplete, chime }: {
  scene: SceneKey;
  lang: Lang;
  onBack: () => void;
  onComplete: () => void;
  chime: () => void;
}) {
  const story = scene.kind === 'memory' ? memories[scene.id] : scene.kind === 'call' ? calls[scene.patient] : ending;
  const [page, setPage] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const response = choice === null ? null : story.choices?.[choice];
  const line = story.pages[Math.min(page, story.pages.length - 1)];
  const choosing = page >= story.pages.length && !response;
  const finalLine = response || (!story.choices && page === story.pages.length - 1);

  useEffect(() => heading.current?.focus(), []);
  useEffect(() => {
    if (page > 0 || choice !== null || done) controls.current?.querySelector('button')?.focus();
  }, [page, choice, done]);

  function advance() {
    chime();
    if (finalLine) {
      onComplete();
      if (scene.kind === 'ending') setDone(true);
      else onBack();
    } else {
      setPage(value => value + 1);
    }
  }

  const motif = scene.kind === 'memory' ? scene.id : scene.kind;

  return <main className="novel" aria-labelledby="novel-title">
    <header className="novel-header">
      <button className="subtle" onClick={onBack}>{local(['데스크톱으로', '返回桌面'], lang)}</button>
      <h1 id="novel-title" ref={heading} tabIndex={-1}>{local(story.title, lang)}</h1>
      <span>{Math.min(page + 1, story.pages.length + Number(!!story.choices))} / {story.pages.length + Number(!!story.choices)}</span>
    </header>
    <div className={`memory-art motif-${motif}`} aria-hidden="true">
      <div className="memory-window"/>
      <div className="memory-table"/>
      <div className="memory-object"><i/><b/></div>
    </div>
    <div className="novel-dialogue">
      <div aria-live="polite">
        <span className="speaker">{done ? 'Sweet Sweet Home' : response ? local(['수화기 너머', '电话那头'], lang) : local(line.speaker, lang)}</span>
        <p>{done ? local(['프롤로그 끝', '序章完'], lang) : local(response?.line ?? line.line, lang)}</p>
      </div>
      <div className="novel-controls" ref={controls}>
        {done ? <button className="primary" onClick={onBack}>{local(['데스크톱으로', '返回桌面'], lang)}</button>
          : choosing ? story.choices!.map((item, index) => <button key={index} onClick={() => { chime(); setChoice(index); }}>{local(item.speaker, lang)}</button>)
          : <button className="primary" onClick={advance}>{local(finalLine ? (
            scene.kind === 'memory' ? ['기억 기록하기', '记录回忆'] :
              scene.kind === 'call' ? ['통화 마치기', '结束通话'] : ['편지 접기', '折起信纸']
          ) : ['계속', '继续'], lang)}</button>}
      </div>
    </div>
  </main>;
}
