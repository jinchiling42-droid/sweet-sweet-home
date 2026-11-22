import { useEffect, useRef } from 'react';
import { Phone, Settings2 } from 'lucide-react';
import { local, type Lang, type NovelPosition } from './game';
import { patientFiles } from './patients';
import { storyForScene } from './story';

export function Novel({ position, lang, onSettings, onAdvance, onChoice, chime }: {
  position: NovelPosition;
  lang: Lang;
  onSettings: () => void;
  onAdvance: () => void;
  onChoice: (index: number) => void;
  chime: () => void;
}) {
  const { scene, page, choice, done } = position;
  const story = storyForScene(scene);
  const heading = useRef<HTMLHeadingElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const settings = useRef<HTMLButtonElement>(null);
  const response = choice === null ? null : story.choices?.[choice];
  const line = story.pages[Math.min(page, story.pages.length - 1)];
  const choosing = page >= story.pages.length && !response;
  const finalLine = !!response || (!story.choices?.length && page === story.pages.length - 1);
  const motif = story.motif ?? (scene.kind === 'memory' ? scene.id : scene.kind);

  useEffect(() => heading.current?.focus(), [scene]);
  useEffect(() => {
    if (done) settings.current?.focus();
    else if (page > 0 || choice !== null) controls.current?.querySelector('button')?.focus();
  }, [page, choice, done]);

  return <main className="novel" aria-labelledby="novel-title">
    <header className="novel-header">
      <button ref={settings} aria-haspopup="dialog" onClick={onSettings}><Settings2 size={17}/>
        {local(['시스템 설정', '系统设置'], lang)}
      </button>
      <h1 className="novel-title" id="novel-title" ref={heading} tabIndex={-1}>{local(story.title, lang)}</h1>
    </header>
    <div className={`memory-art motif-${motif}`}>
      <div className="memory-window" aria-hidden="true"/>
      <div className="memory-table" aria-hidden="true"/>
      <div className="memory-object" aria-hidden="true"><i/><b/></div>
      {scene.kind === 'call' && <div className="call-hud">
        <Phone size={19} aria-hidden="true"/>
        <div><strong>{local(patientFiles[scene.patient].name, lang)}</strong>
          <span>{local(['통화 중', '通话中'], lang)}</span>
        </div>
      </div>}
    </div>
    <div className="novel-dialogue">
      <div aria-live="polite">
        <span className="speaker">{done ? 'Sweet Sweet Home' : response ? local(['수화기 너머', '电话那头'], lang) : local(line.speaker, lang)}</span>
        <p>{done ? local(['끝', '完'], lang) : local(response?.line ?? line.line, lang)}</p>
      </div>
      {!done && <div className="novel-controls" ref={controls}>
        {choosing ? story.choices!.map((item, index) => <button key={index}
          onClick={() => { chime(); onChoice(index); }}>{local(item.speaker, lang)}</button>)
          : <button className="primary" onClick={() => { chime(); onAdvance(); }}>{local(finalLine ? (
            scene.kind === 'memory' ? ['기억 기록하기', '记录回忆'] :
              scene.kind === 'call' ? ['통화 마치기', '结束通话'] : ['편지 접기', '折起信纸']
          ) : ['계속', '继续'], lang)}</button>}
      </div>}
    </div>
  </main>;
}
