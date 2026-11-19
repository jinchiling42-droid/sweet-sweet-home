import { FileText, FolderLock, Phone } from 'lucide-react';
import { local, memoryIds, type Lang, type Progress, type Text } from './game';
import { memories } from './story';
import { RetroIcon } from './visuals';

export const apps = ['records', 'notes', 'video', 'mine', 'calc', 'settings', 'hidden'] as const;
export type AppId = typeof apps[number];
export type WindowKey = AppId | 'case-0' | 'case-1' | 'memo' | 'letter';
export type SceneKey = { kind: 'memory'; patient: number; id: string } |
  { kind: 'call'; patient: number } | { kind: 'ending' };

export const titles: Record<WindowKey, Text> = {
  records: ['환자 기록', '患者档案'],
  notes: ['메모', '备忘录'],
  video: ['비디오', '视频'],
  mine: ['지뢰찾기', '扫雷'],
  calc: ['계산기', '计算器'],
  settings: ['설정', '设置'],
  hidden: ['숨겨진 폴더', '隐藏文件夹'],
  'case-0': ['환자 01', '患者 01'],
  'case-1': ['환자 02', '患者 02'],
  memo: ['개인 메모', '私人备忘'],
  letter: ['보내지 않은 편지', '没寄出的信'],
};

export function Records({ lang, progress, open }: {
  lang: Lang;
  progress: Progress;
  open: (key: WindowKey) => void;
}) {
  return <div className="archive">
    <aside className="archive-sidebar">
      <span>SWEET HD</span>
      {(['records', 'notes', 'hidden'] as const).map(key => <button className={key === 'records' ? 'current' : ''}
        key={key} onClick={() => open(key)}><RetroIcon kind={key}/>{local(titles[key], lang)}</button>)}
    </aside>
    <div className="archive-list panel">
      <p className="path-label">SWEET HD / {local(titles.records, lang)}</p>
      <h2>{local(titles.records, lang)}</h2>
      <p>{local(['상담 기록의 단어를 눌러 기억을 열어 보세요.', '点击咨询记录中的关键词，打开对应的回忆。'], lang)}</p>
      {(['case-0', 'case-1'] as const).map((key, index) => {
        const patient = progress.patients[index];
        const words = memoryIds[index].map(id => local(memories[id].title, lang)).join(' · ');
        return <button key={key} className="file-row" onClick={() => open(key)}>
          <RetroIcon kind="records"/>
          <span><strong>{local(titles[key], lang)}</strong><small>{words}</small></span>
          <span className="file-status">{patient.called ? local(['회상 완료', '已完成回访'], lang) : `${patient.explored.length}/3`}</span>
        </button>;
      })}
    </div>
  </div>;
}

const caseNotes: Text[][] = [
  [
    ['상담자는 식탁에서 자리를 비운 날의 이야기를 꺼냈다.', '来访者提起了那天离开餐桌的经过。'],
    ['“거울을 볼 때면 생각이 많아져요. 식탁이든 사진이든 전부 제 손으로 맞춰 놓아야 마음이 놓여요.”', '「照镜子的时候我总会想很多。无论是餐桌还是照片，我总要亲手把一切摆好才安心。」'],
  ],
  [
    ['상담자는 식사 중에 자주 떠오르는 목소리에 대해 이야기했다.', '来访者说起了一个常在吃饭时想起的声音。'],
    ['“배고프냐는 말을 들을 때면, 그 사람이 저한테 정말 묻고 싶은 건 뭔지 궁금해져요.”', '「有人问我饿不饿时，我就会想，那个人真正想问我的是什么。」'],
  ],
];

export function PatientRecord({ index, lang, progress, open, play }: {
  index: number;
  lang: Lang;
  progress: Progress;
  open: (key: WindowKey) => void;
  play: (scene: SceneKey) => void;
}) {
  const state = progress.patients[index];
  const ids = memoryIds[index];
  const remaining = ids.length - state.explored.length;
  return <div className="panel">
    <button className="subtle" onClick={() => open('records')}>{local(titles.records, lang)}</button>
    <p className="path-label">{local(['상담 기록', '咨询记录'], lang)} / 0{index + 1}</p>
    <h2>{local(index === 0 ? titles['case-0'] : titles['case-1'], lang)}</h2>
    <div className="paper-note">{caseNotes[index].map((note, line) => <p key={line}>{local(note, lang)}</p>)}</div>
    <div className="keyword-list">
      {ids.map(id => <button className={state.explored.includes(id) ? 'seen' : ''} key={id}
        onClick={() => play({ kind: 'memory', patient: index, id })}>
        <FileText size={15}/>{local(memories[id].title, lang)}{state.explored.includes(id) ? ' ✓' : ''}
      </button>)}
    </div>
    <div className="record-footer">
      <button className="primary" disabled={remaining > 0} onClick={() => play({ kind: 'call', patient: index })}>
        <Phone size={16}/>{local(state.called ? ['전화 다시 듣기', '重听电话'] : ['전화 회상', '电话回访'], lang)}
      </button>
      <span>{remaining ? local([`남은 기억 ${remaining}개`, `还有 ${remaining} 段回忆`], lang) : local(['전화에 연결할 수 있습니다.', '电话可以接通了。'], lang)}</span>
    </div>
  </div>;
}

export function Notes({ lang, open }: { lang: Lang; open: (key: WindowKey) => void }) {
  const notes: { title: Text; lines: Text[]; target: WindowKey }[] = [
    { title: ['오늘 할 일', '今天要做的事'], lines: [
      ['두 상담 기록의 단어를 다시 확인할 것. 기억을 끝까지 읽고 나면 전화를 걸 수 있다.', '再看一遍两份咨询记录里的关键词。每段回忆读完后，就可以打电话。'],
      ['‘11월 6일’이 적힌 쪽을 접어 두었다.', '写着「11 月 6 日」的那页，我折了个角。'],
    ], target: 'records' },
    { title: ['나에게 남긴 메모', '留给自己的备忘'], lines: [
      ['두 통의 전화를 마치면 숨겨 둔 폴더를 열어 볼 것.', '打完两通电话，再打开藏起来的文件夹。'],
      ['케이크 옆 의자는 아직 치우지 말 것.', '先别挪走蛋糕旁边的椅子。'],
    ], target: 'hidden' },
  ];
  return <div className="panel">
    <h2>{local(titles.notes, lang)}</h2>
    <div className="notes-grid">{notes.map(note => <article className="paper-note" key={note.target}>
      <h3>{local(note.title, lang)}</h3>
      {note.lines.map((line, index) => <p key={index}>{local(line, lang)}</p>)}
      <button className="subtle" onClick={() => open(note.target)}>{local(titles[note.target], lang)}</button>
    </article>)}</div>
  </div>;
}

export function Hidden({ lang, progress, open }: {
  lang: Lang;
  progress: Progress;
  open: (key: WindowKey) => void;
}) {
  const completed = progress.patients.filter(patient => patient.called).length;
  return <div className="panel hidden-panel">
    {completed === 2 ? <RetroIcon kind="records"/> : <FolderLock size={48} strokeWidth={1.3}/>}
    <h2>{local(titles.hidden, lang)}</h2>
    {completed === 2 ? <div className="file-list">
      {(['memo', 'letter'] as const).map(key => <button className="file-row" key={key} onClick={() => open(key)}>
        <FileText size={21}/><strong>{local(titles[key], lang)}</strong>
      </button>)}
    </div> : <>
      <p>{local(['두 환자의 기억과 전화 회상을 마치면 열립니다.', '读完两位患者的回忆并完成电话回访后，文件夹就会打开。'], lang)}</p>
      <progress value={completed} max="2" aria-label={local(['완료한 전화 회상', '完成的电话回访'], lang)}/>
      <p>{completed} / 2</p>
      <button className="subtle" onClick={() => open('records')}>{local(titles.records, lang)}</button>
    </>}
  </div>;
}

export function PersonalFile({ file, lang, progress, play }: {
  file: 'memo' | 'letter';
  lang: Lang;
  progress: Progress;
  play: (scene: SceneKey) => void;
}) {
  return <div className="panel">
    <p className="path-label">{local(titles.hidden, lang)} / 11.06</p>
    <h2>{local(titles[file], lang)}</h2>
    <div className="paper-note"><p>{local(file === 'memo' ?
      ['사진 속 의자, 반쯤 열린 창문, 촛불 하나. 두 파일에서 공통으로 찾은 것들이다. 두 파일을 만든 시각도 같았다.', '照片里的椅子、半开的窗、一根蜡烛。这是两份档案里都有的东西。两份档案甚至创建于同一刻。'] :
      ['11월 6일. 꺼낸 적 없는 편지. 봉투 안쪽에도 같은 날짜가 적혀 있다.', '11 月 6 日。一封从未寄出的信。信封里面也写着同样的日期。'], lang)}</p></div>
    {file === 'letter' && <button className="primary" onClick={() => play({ kind: 'ending' })}>
      {local(progress.ending ? ['다시 읽기', '重读结尾'] : ['편지 펼치기', '展开信纸'], lang)}
    </button>}
  </div>;
}
