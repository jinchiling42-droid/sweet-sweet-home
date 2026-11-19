import { StrictMode, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { Clock3, FolderLock, Minus, Power, Square, X } from 'lucide-react';
import {
  apps, Hidden, Notes, PatientRecord, PersonalFile, Records, titles, type AppId, type SceneKey, type WindowKey,
} from './archive';
import { CalculatorApp, Minesweeper, VideoApp } from './desktop-apps';
import {
  emptyProgress, local, readPreferences, readProgress, readSave, storage, type Lang, type Text,
} from './game';
import { Novel } from './novel';
import { RetroIcon, Room } from './visuals';
import './style.css';
import './retro.css';
import './playtest.css';

type Frame = { key: WindowKey; x: number; y: number; order: number; minimized: boolean; expanded: boolean };
type Drag = { key: WindowKey; pointer: number; startX: number; startY: number; x: number; y: number };

function App() {
  const [phase, setPhase] = useState<'room' | 'boot' | 'desktop'>('room');
  const [prefs, setPrefs] = useState(() => readPreferences(storage.read('ssh-pref')));
  const [progress, setProgress] = useState(() => readProgress(storage.read('ssh-progress')) ?? emptyProgress());
  const [manual, setManual] = useState(readSave);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [scene, setScene] = useState<SceneKey | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [toast, setToast] = useState<Text | null>(null);
  const [now, setNow] = useState(() => new Date());
  const stack = useRef(0);
  const drag = useRef<Drag | null>(null);
  const pendingFocus = useRef<WindowKey | null>(null);
  const sceneReturn = useRef<HTMLElement | null>(null);
  const roomFocus = useRef(false);
  const room = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const sendReset = useRef<HTMLButtonElement>(null);
  const resetReturn = useRef<HTMLElement | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const { lang, sound } = prefs;
  const l = (text: Text) => local(text, lang);
  const title = (key: WindowKey) => l(titles[key]);
  const active = frames.filter(frame => !frame.minimized).sort((a, b) => b.order - a.order)[0]?.key;
  const locked = !progress.patients.every(patient => patient.called);

  useEffect(() => {
    document.documentElement.lang = lang === 'ko' ? 'ko' : 'zh-Hans';
    storage.write('ssh-pref', prefs);
  }, [prefs, lang]);
  useEffect(() => { storage.write('ssh-progress', progress); }, [progress]);
  useEffect(() => {
    const update = window.setInterval(() => setNow(new Date()), 10_000);
    return () => window.clearInterval(update);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3300);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (phase !== 'boot') return;
    const timer = window.setTimeout(() => setPhase('desktop'),
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240);
    return () => window.clearTimeout(timer);
  }, [phase]);
  useEffect(() => {
    if (phase === 'room' && roomFocus.current) {
      room.current?.querySelector('button')?.focus();
      roomFocus.current = false;
    } else if (phase === 'desktop') {
      stage.current?.querySelector<HTMLButtonElement>('.desktop-icon')?.focus();
    }
  }, [phase]);
  useEffect(() => {
    if (!pendingFocus.current) return;
    stage.current?.querySelector<HTMLElement>(`[data-title="${pendingFocus.current}"]`)?.focus();
    pendingFocus.current = null;
  }, [frames]);
  useEffect(() => {
    if (!scene && sceneReturn.current) {
      sceneReturn.current.focus();
      sceneReturn.current = null;
    }
  }, [scene]);
  useEffect(() => {
    if (resetOpen) sendReset.current?.focus();
    else if (resetReturn.current) {
      resetReturn.current.focus();
      resetReturn.current = null;
    }
  }, [resetOpen]);

  function chime(enabled = sound) {
    if (!enabled || !window.AudioContext) return;
    try {
      const context = audio.current ??= new AudioContext();
      if (context.state === 'suspended') void context.resume().catch(() => {});
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const time = context.currentTime;
      oscillator.frequency.setValueAtTime(560, time);
      gain.gain.setValueAtTime(0.045, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(time);
      oscillator.stop(time + 0.1);
    } catch {
      // Playback is optional and may be blocked by the browser.
    }
  }

  function open(key: WindowKey) {
    chime();
    pendingFocus.current = key;
    const order = ++stack.current;
    setFrames(current => {
      if (current.some(frame => frame.key === key)) {
        return current.map(frame => frame.key === key ? { ...frame, order, minimized: false } : frame);
      }
      const offset = current.length % 5 * 24;
      return [...current, { key, x: 26 + offset, y: 32 + offset, order, minimized: false, expanded: false }];
    });
  }

  function patch(key: WindowKey, change: Partial<Frame>) {
    setFrames(current => current.map(frame => frame.key === key ? { ...frame, ...change } : frame));
  }

  function close(key: WindowKey) {
    if (drag.current?.key === key) drag.current = null;
    setFrames(current => current.filter(frame => frame.key !== key));
    if (key === active) focusRemaining(key);
  }

  function focusRemaining(key: WindowKey) {
    const next = frames.filter(frame => frame.key !== key && !frame.minimized).sort((a, b) => b.order - a.order)[0];
    if (next) pendingFocus.current = next.key;
    else (stage.current?.querySelector<HTMLButtonElement>(`[data-app="${key}"]`) ??
      stage.current?.querySelector<HTMLButtonElement>('.desktop-icon'))?.focus();
  }

  function beginDrag(event: PointerEvent<HTMLElement>, frame: Frame) {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button') ||
      frame.expanded || window.matchMedia('(max-width: 680px)').matches) return;
    const bounds = event.currentTarget.parentElement!.getBoundingClientRect();
    const board = stage.current!.getBoundingClientRect();
    drag.current = { key: frame.key, pointer: event.pointerId, startX: event.clientX, startY: event.clientY,
      x: bounds.left - board.left, y: bounds.top - board.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLElement>) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) return;
    const board = stage.current!.getBoundingClientRect();
    const panel = event.currentTarget.parentElement!.getBoundingClientRect();
    patch(current.key, {
      x: Math.min(Math.max(0, board.width - panel.width - 8), Math.max(8, current.x + event.clientX - current.startX)),
      y: Math.min(Math.max(0, board.height - panel.height - 8), Math.max(8, current.y + event.clientY - current.startY)),
    });
  }

  function powerOff() {
    chime();
    setScene(null);
    setResetOpen(false);
    setToast(null);
    setFrames([]);
    drag.current = null;
    pendingFocus.current = null;
    sceneReturn.current = null;
    resetReturn.current = null;
    stack.current = 0;
    roomFocus.current = true;
    setPhase('room');
  }

  function play(next: SceneKey) {
    chime();
    sceneReturn.current = document.activeElement as HTMLElement | null;
    setScene(next);
  }

  function completeScene(completed: SceneKey) {
    setProgress(current => {
      if (completed.kind === 'ending') return { ...current, ending: true };
      return {
        ...current,
        patients: current.patients.map((patient, index) => {
          if (index !== completed.patient) return patient;
          return completed.kind === 'call' ? { ...patient, called: true } :
            { ...patient, explored: [...new Set([...patient.explored, completed.id])] };
        }),
      };
    });
    if (completed.kind === 'call' && progress.patients[1 - completed.patient].called) {
      setToast(['숨겨진 폴더가 열렸습니다.', '隐藏文件夹已解锁。']);
    }
  }

  function save() {
    const next = { ...prefs, ...progress };
    if (storage.write('ssh-manual', next)) {
      setManual(next);
      setToast(['진행을 저장했습니다.', '进度已保存。']);
    } else setToast(['이 브라우저에서 저장할 수 없습니다.', '当前浏览器无法保存进度。']);
  }

  function load() {
    if (!manual) return;
    setPrefs({ lang: manual.lang, sound: manual.sound });
    setProgress({ patients: manual.patients, ending: manual.ending });
    setFrames(current => current.filter(frame => frame.key !== 'memo' && frame.key !== 'letter'));
    setToast(['저장된 진행을 불러왔습니다.', '已读取存档。']);
  }

  function reset() {
    if (!storage.remove('ssh-manual')) {
      setResetOpen(false);
      setToast(['이 브라우저에서 저장을 지울 수 없습니다.', '当前浏览器无法删除存档。']);
      return;
    }
    setProgress(emptyProgress());
    setManual(null);
    setFrames(current => current.filter(frame => frame.key !== 'memo' && frame.key !== 'letter'));
    setResetOpen(false);
    setToast(['진행을 초기화했습니다.', '游戏进度已重置。']);
  }

  useEffect(() => {
    if (phase !== 'desktop') return;
    const keyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (resetOpen) setResetOpen(false);
      else if (scene) setScene(null);
      else if (active) close(active);
    };
    window.addEventListener('keydown', keyDown);
    return () => window.removeEventListener('keydown', keyDown);
  });

  function settings() {
    return <div className="panel preferences">
      <h2>{l(['시스템 설정', '系统设置'])}</h2>
      <section>
        <div><h3>{l(['언어', '语言'])}</h3></div>
        <div className="language-options">{(['ko', 'zh'] as const).map(option =>
          <button key={option} aria-pressed={option === lang} onClick={() => setPrefs(current => ({ ...current, lang: option }))}>
            {option === 'ko' ? '한국어' : '中文'}
          </button>)}</div>
      </section>
      <section>
        <div><h3>{l(['효과음', '音效'])}</h3></div>
        <button aria-pressed={sound} onClick={() => { setPrefs(current => ({ ...current, sound: !sound })); chime(!sound); }}>
          {l(sound ? ['켜짐', '开启'] : ['꺼짐', '关闭'])}
        </button>
      </section>
      <section>
        <div><h3>{l(['진행 저장', '游戏存档'])}</h3><p>{l(['이 브라우저에 수동 저장을 남깁니다.', '进度保存在当前浏览器。'])}</p></div>
        <div className="language-options">
          <button onClick={save}>{l(['저장', '保存进度'])}</button>
          <button onClick={load} disabled={!manual}>{l(['불러오기', '读取存档'])}</button>
        </div>
      </section>
      <section>
        <div><h3>{l(['진행 초기화', '重置进度'])}</h3></div>
        <button onClick={event => { resetReturn.current = event.currentTarget; setResetOpen(true); }}>
          {l(['초기화', '重置'])}
        </button>
      </section>
      <section className="power-controls">
        <div><h3>{l(['전원', '电源'])}</h3><p>{l(['진행을 유지하고 방으로 돌아갑니다.', '保留探索进度，返回初始房间。'])}</p></div>
        <button className="primary" onClick={powerOff}><Power size={16}/>{l(['전원 끄기', '关闭电源'])}</button>
      </section>
    </div>;
  }

  function contents(key: WindowKey) {
    switch (key) {
      case 'records': return <Records {...{ lang, progress, open }}/>;
      case 'case-0': case 'case-1':
        return <PatientRecord index={key === 'case-0' ? 0 : 1} {...{ lang, progress, open, play }}/>;
      case 'notes': return <Notes {...{ lang, open }}/>;
      case 'hidden': return <Hidden {...{ lang, progress, open }}/>;
      case 'memo': case 'letter': return <PersonalFile file={key} {...{ lang, progress, play }}/>;
      case 'video': return <VideoApp lang={lang}/>;
      case 'mine': return <Minesweeper lang={lang}/>;
      case 'calc': return <CalculatorApp lang={lang}/>;
      case 'settings': return settings();
    }
  }

  function icon(key: AppId) {
    return <span className="desktop-icon-art">
      <RetroIcon kind={key === 'hidden' && !locked ? 'records' : key}/>
      {key === 'hidden' && locked && <FolderLock className="lock-mark" size={14} aria-hidden="true"/>}
    </span>;
  }

  if (phase !== 'desktop') return <div ref={room}>
    <Room lang={lang} starting={phase === 'boot'} onStart={() => { chime(); setToast(null); setPhase('boot'); }}
      onCake={() => { chime(); setToast(['접시 밑에 날짜가 적혀 있다. 11월 6일.', '盘子底下写着一个日期。11 月 6 日。']); }}
      notice={toast ? l(toast) : ''}/>
  </div>;

  return <>
    <main className="sweet-desktop" inert={!!scene || resetOpen}>
      <header className="os-bar">
        <span className="os-name"><span className="os-mark">S</span> Sweet OS</span>
        <button onClick={() => open('records')}>{title('records')}</button>
        <button onClick={() => open('settings')}>{title('settings')}</button>
        <span className="os-clock"><Clock3 size={15}/>{now.toLocaleTimeString(lang === 'ko' ? 'ko-KR' : 'zh-CN',
          { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
      </header>
      <div className="desktop-wall" aria-hidden="true"><i/><b/><span/></div>
      <div className="desktop-area" ref={stage}>
        <div className="desktop-icons-grid">
          {apps.map(key => <button className="desktop-icon" data-app={key} key={key} onClick={() => open(key)}>
            {icon(key)}<span>{title(key)}</span>
          </button>)}
        </div>
        <div className="desktop-inscription"><strong>Sweet OS</strong><span>SWEET HD</span></div>
        {frames.map(frame => <section key={frame.key} hidden={frame.minimized}
          className={`app-window ${active === frame.key ? 'active' : ''} ${frame.expanded ? 'expanded' : ''}`}
          aria-labelledby={`title-${frame.key}`}
          style={{ '--window-x': `${frame.x}px`, '--window-y': `${frame.y}px`, zIndex: frame.order } as CSSProperties}
          onPointerDown={() => { if (active !== frame.key) patch(frame.key, { order: ++stack.current }); }}
          onFocus={() => { if (active !== frame.key) patch(frame.key, { order: ++stack.current }); }}>
          <div className="window-bar" onPointerDown={event => beginDrag(event, frame)} onPointerMove={moveDrag}
            onPointerUp={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
            <div className="window-tools">
              <button className="close-dot" onClick={() => close(frame.key)} aria-label={l(['창 닫기', '关闭窗口'])}><X size={12}/></button>
              <button className="min-dot" onClick={() => { patch(frame.key, { minimized: true }); focusRemaining(frame.key); }}
                aria-label={l(['최소화', '最小化'])}><Minus size={12}/></button>
              <button className="max-dot" onClick={() => patch(frame.key, { expanded: !frame.expanded })}
                aria-label={l(frame.expanded ? ['창 크기 복원', '恢复窗口大小'] : ['창 확대', '放大窗口'])}><Square size={9}/></button>
            </div>
            <h2 id={`title-${frame.key}`} data-title={frame.key} tabIndex={-1}>{title(frame.key)}</h2>
          </div>
          <div className="window-content">{contents(frame.key)}</div>
        </section>)}
      </div>
      <nav className="sweet-dock" aria-label={l(['응용 프로그램', '应用程序'])}>
        {apps.map(key => <button key={key} onClick={() => open(key)} title={title(key)} aria-label={title(key)}
          className={frames.some(frame => frame.key === key || (key === 'records' && frame.key.startsWith('case-'))) ? 'running' : ''}>
          {icon(key)}
        </button>)}
      </nav>
    </main>
    {scene && <Novel scene={scene} lang={lang} onBack={() => setScene(null)} onComplete={() => completeScene(scene)} chime={chime}/>}
    {resetOpen && <div className="reset-backdrop">
      <section role="alertdialog" aria-modal="true" aria-labelledby="reset-title" className="reset-dialog">
        <h2 id="reset-title">{l(['진행을 초기화할까요?', '重置游戏进度？'])}</h2>
        <p>{l(['탐색한 단서와 수동 저장이 지워집니다.', '已探索的线索和手动存档都会清除。'])}</p>
        <div><button ref={sendReset} onClick={() => setResetOpen(false)}>{l(['취소', '取消'])}</button>
          <button className="primary" onClick={reset}>{l(['초기화', '重置'])}</button></div>
      </section>
    </div>}
    {toast && !scene && <div className="system-toast" role="status">{l(toast)}</div>}
  </>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
