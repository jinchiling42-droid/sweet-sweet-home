import { useState } from 'react';
import { Images, LockKeyhole, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { local, type Lang, type Preferences, type Text } from './game';

const albumCode = '041206';

export function Album({ lang }: { lang: Lang }) {
  const [code, setCode] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [incorrect, setIncorrect] = useState(false);

  if (unlocked) return <div className="panel album-panel">
    <div className="album-empty">
      <Images size={44} strokeWidth={1.3} aria-hidden="true"/>
      <p>{local(['사진 없음', '暂无照片'], lang)}</p>
    </div>
  </div>;

  return <div className="panel album-panel">
    <form className="album-form" autoComplete="off" onSubmit={event => {
      event.preventDefault();
      if (code === albumCode) {
        setUnlocked(true);
        setCode('');
      } else setIncorrect(true);
    }}>
      <LockKeyhole size={44} strokeWidth={1.3} aria-hidden="true"/>
      <label htmlFor="album-code">{local(['비밀번호', '密码'], lang)}</label>
      <input id="album-code" type="password" inputMode="numeric" maxLength={albumCode.length}
        value={code} aria-invalid={incorrect} aria-describedby={incorrect ? 'album-error' : undefined}
        onChange={event => {
          setCode(event.currentTarget.value.replace(/[^0-9]/g, ''));
          setIncorrect(false);
        }}/>
      <button className="primary" disabled={code.length !== albumCode.length}>
        {local(['잠금 해제', '解锁'], lang)}
      </button>
      {incorrect && <p id="album-error" role="alert">{local(['비밀번호가 틀렸습니다.', '密码错误。'], lang)}</p>}
    </form>
  </div>;
}

export function VideoApp({ lang }: { lang: Lang }) {
  const [idx, setIdx] = useState(0),
    [playing, setPlaying] = useState(false);
  const vids =
    lang === 'ko'
      ? ['비 오는 창가', '책상 위의 오후', '느린 파도']
      : ['雨中的窗边', '午后桌面', '缓慢的海浪'];
  return (
    <div className="videoapp">
      <div className={`player film-${idx} ${playing ? 'is-playing' : ''}`}>
        <div className="playmark">{playing ? 'Ⅱ' : <Play />}</div>
        <span>{vids[idx]}</span>
        <button onClick={() => setPlaying(!playing)}>
          {playing
            ? lang === 'ko'
              ? '일시 정지'
              : '暂停'
            : lang === 'ko'
              ? '재생'
              : '播放'}
        </button>
        <div className="timeline">
          <i style={{ width: playing ? '42%' : '12%' }} />
        </div>
      </div>
      <h3>{lang === 'ko' ? '최근 항목' : '最近项目'}</h3>
      {vids.map((v, i) => (
        <button
          className="video-row"
          key={v}
          onClick={() => {
            setIdx(i);
            setPlaying(true);
          }}
        >
          <span>▶</span>
          {v}
          <small>
            {lang === 'ko' ? '영상 스케치' : '影像草稿'} ·{' '}
            {['02:14', '04:08', '01:36'][i]}
          </small>
        </button>
      ))}
    </div>
  );
}
export function Minesweeper({ lang }: { lang: Lang }) {
  const N = 8,
    M = 10;
  const [seed, setSeed] = useState(0),
    [flags, setFlags] = useState<number[]>([]),
    [opened, setOpened] = useState<number[]>([]),
    [over, setOver] = useState(false);
  const bombs = new Set(
    Array.from({ length: M }, (_, i) => (i * 13 + seed * 7 + 9) % 64)
  );
  const count = (k: number) => {
    let r = Math.floor(k / N),
      c = k % N,
      n = 0;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++)
        if (
          bombs.has((r + dr) * N + c + dc) &&
          r + dr >= 0 &&
          r + dr < N &&
          c + dc >= 0 &&
          c + dc < N
        )
          n++;
    return n;
  };
  function restart() {
    setSeed(seed + 1);
    setFlags([]);
    setOpened([]);
    setOver(false);
  }
  return (
    <div className="mines">
      <div className="minehead">
        <span>⚑ {flags.length}</span>
        <b>
          {over
            ? lang === 'ko'
              ? '종료'
              : '结束'
            : lang === 'ko'
              ? '지뢰찾기'
              : '扫雷'}
        </b>
        <button
          aria-label={lang === 'ko' ? '다시 시작' : '重新开始'}
          onClick={restart}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="grid">
        {Array.from({ length: 64 }, (_, k) => {
          const hit = opened.includes(k),
            flag = flags.includes(k);
          return (
            <button
              key={k}
              className={hit ? 'open-cell' : ''}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!hit)
                  setFlags(
                    flags.includes(k)
                      ? flags.filter((x) => x !== k)
                      : [...flags, k]
                  );
              }}
              onClick={() => {
                if (over || flag || hit) return;
                if (bombs.has(k)) {
                  setOpened([...opened, k]);
                  setOver(true);
                } else {
                  setOpened([...opened, k]);
                  if (opened.length + 1 >= 64 - M) setOver(true);
                }
              }}
            >
              {flag ? '⚑' : hit ? (bombs.has(k) ? '✹' : count(k) || '') : ''}
            </button>
          );
        })}
      </div>
      <p>
        {lang === 'ko'
          ? '좌클릭으로 열기 · 우클릭으로 깃발 표시'
          : '单击翻开 · 右键插旗'}
      </p>
      <button className="primary" onClick={restart}>
        {lang === 'ko' ? '다시 시작' : '重新开始'}
      </button>
    </div>
  );
}
export function CalculatorApp({ lang }: { lang: Lang }) {
  const [display, setDisplay] = useState('0'),
    [stored, setStored] = useState<number | null>(null),
    [op, setOp] = useState(''),
    [fresh, setFresh] = useState(true);
  function press(k: string) {
    if (k === '±' || k === '%') {
      const value = Number(display);
      if (Number.isFinite(value))
        setDisplay(String(k === '±' ? -value : value / 100));
      return;
    }
    if (/[0-9.]/.test(k)) {
      if (!fresh && k === '.' && display.includes('.')) return;
      setDisplay(
        fresh
          ? k === '.'
            ? '0.'
            : k
          : display === '0' && k !== '.'
            ? k
            : display + k
      );
      setFresh(false);
      return;
    }
    if (k === 'C') {
      setDisplay('0');
      setStored(null);
      setOp('');
      setFresh(true);
      return;
    }
    if (k === '=') {
      if (stored === null || !op) return;
      const a = stored,
        b = Number(display),
        v =
          op === '+'
            ? a + b
            : op === '−'
              ? a - b
              : op === '×'
                ? a * b
                : op === '÷'
                  ? b === 0
                    ? NaN
                    : a / b
                  : b;
      setDisplay(
        Number.isFinite(v)
          ? String(Number(v.toFixed(8)))
          : lang === 'ko'
            ? '오류'
            : '错误'
      );
      setStored(null);
      setOp('');
      setFresh(true);
      return;
    }
    setStored(Number(display));
    setOp(k);
    setFresh(true);
  }
  return (
    <div className="calculator">
      <div className="calc-display">{display}</div>
      <div className="calc-keys">
        {[
          'C',
          '±',
          '%',
          '÷',
          '7',
          '8',
          '9',
          '×',
          '4',
          '5',
          '6',
          '−',
          '1',
          '2',
          '3',
          '+',
          '0',
          '.',
          '=',
        ].map((k) => (
          <button
            className={['÷', '×', '−', '+', '='].includes(k) ? 'operator' : ''}
            key={k}
            onClick={() => press(k)}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}


const ipodVolumes = [
  { key: 'musicVolume', label: ['음악 음량', '音乐音量'] as Text },
  { key: 'effectsVolume', label: ['효과음 음량', '音效音量'] as Text },
] as const;

export function IPod({ prefs, playing, onToggle, onVolume, onTest }: {
  prefs: Preferences;
  playing: boolean;
  onToggle: () => void;
  onVolume: (key: typeof ipodVolumes[number]['key'], value: number) => void;
  onTest: () => void;
}) {
  const { lang } = prefs;
  return <div className="panel ipod-panel">
    <div className="ipod-screen">
      <div><h3>{local(['임시 배경음악', '临时背景音乐'], lang)}</h3><p>Sweet Sweet Home</p></div>
      <button className="primary" onClick={onToggle}>
        {playing ? <Pause size={16}/> : <Play size={16}/>}
        {local(playing ? ['일시 정지', '暂停音乐'] : ['재생', '播放音乐'], lang)}
      </button>
    </div>
    {ipodVolumes.map(({ key, label }) => <label className="ipod-volume" key={key}>
      <span>{local(label, lang)}</span>
      <span className="ipod-volume-value" aria-hidden="true">{prefs[key]}%</span>
      <input type="range" min={0} max={100} value={prefs[key]} aria-label={local(label, lang)}
        onChange={event => onVolume(key, event.currentTarget.valueAsNumber)}/>
    </label>)}
    <button className="subtle" onClick={onTest} disabled={prefs.effectsVolume === 0}>
      <Volume2 size={16}/>{local(['효과음 미리 듣기', '试听音效'], lang)}
    </button>
  </div>;
}
