import { useEffect, useRef } from 'react';
import { Settings2 } from 'lucide-react';
import { local, type Lang, type NovelPosition } from './game';
import { storyForScene } from './story';

export function Novel({ position, lang, onSettings, onPosition, onComplete, chime }: {
  position: NovelPosition;
  lang: Lang;
  onSettings: () => void;
  onPosition: (position: NovelPosition) => void;
  onComplete: () => void;
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
  const finalLine = !!response || (!story.choices && page === story.pages.length - 1);

  useEffect(() => heading.current?.focus(), [scene]);
  useEffect(() => {
    if (done) settings.current?.focus();
    else if (page > 0 || choice !== null) controls.current?.querySelector('button')?.focus();
  }, [page, choice, done]);

  function advance() {
    chime();
    if (finalLine) onComplete();
    else onPosition({ ...position, page: page + 1 });
  }

  const motif = scene.kind === 'memory' ? scene.id : scene.kind;
  const settingsLabel = local(['시스템 설정', '系统设置'], lang);

  return <main className="novel" aria-labelledby="novel-title">
    <header className="novel-header">
      <button ref={settings} aria-haspopup="dialog" onClick={onSettings}><Settings2 size={17}/>{settingsLabel}</button>
      <h1 className="novel-title" id="novel-title" ref={heading} tabIndex={-1}>{local(story.title, lang)}</h1>
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
      {!done && <div className="novel-controls" ref={controls}>
        {choosing ? story.choices!.map((item, index) => <button key={index}
          onClick={() => { chime(); onPosition({ ...position, choice: index }); }}>{local(item.speaker, lang)}</button>)
          : <button className="primary" onClick={advance}>{local(finalLine ? (
            scene.kind === 'memory' ? ['기억 기록하기', '记录回忆'] :
              scene.kind === 'call' ? ['통화 마치기', '结束通话'] : ['편지 접기', '折起信纸']
          ) : ['계속', '继续'], lang)}</button>}
      </div>}
    </div>
  </main>;
}
