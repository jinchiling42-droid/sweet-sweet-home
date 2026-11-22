import { FileText, Phone } from 'lucide-react';
import { local, type Lang, type Progress, type SceneRequest, type Text } from './game';
import { patientFiles, patientIds, type PatientId } from './patients';
import { calls, memories } from './story';
import { RetroIcon } from './visuals';

export const apps = ['records', 'notes', 'album', 'video', 'mine', 'calc', 'ipod', 'settings', 'hidden', 'prescription'] as const;
export type AppId = typeof apps[number];
export const caseWindow = (id: PatientId) => `case-${id}` as const;
type CaseWindow = ReturnType<typeof caseWindow>;
export type WindowKey = AppId | CaseWindow | 'memo' | 'letter';

const caseTitles = Object.fromEntries(patientIds.map(id => [caseWindow(id), patientFiles[id].name])) as Record<CaseWindow, Text>;

export const titles: Record<WindowKey, Text> = {
  records: ['업무 기록', '工作记录'],
  notes: ['메모', '备忘录'],
  album: ['사진첩', '相册'],
  video: ['비디오', '视频'],
  mine: ['지뢰찾기', '扫雷'],
  calc: ['계산기', '计算器'],
  ipod: ['iPod', 'iPod'],
  settings: ['설정', '设置'],
  hidden: ['숨겨진 폴더', '隐藏文件夹'],
  prescription: ['처방전', '处方单'],
  ...caseTitles,
  memo: ['개인 메모', '私人备忘'],
  letter: ['보내지 않은 편지', '没寄出的信'],
};

export function Records({ lang, open }: {
  lang: Lang;
  open: (key: WindowKey) => void;
}) {
  return <div className="panel">
    {patientIds.map(id => <button key={id} className="file-row" onClick={() => open(caseWindow(id))}>
      <RetroIcon kind="records"/>
      <strong>{local(patientFiles[id].name, lang)}</strong>
    </button>)}
  </div>;
}

export function PatientRecord({ id, lang, progress, open, play }: {
  id: PatientId;
  lang: Lang;
  progress: Progress;
  open: (key: WindowKey) => void;
  play: (scene: SceneRequest) => void;
}) {
  const data = patientFiles[id];
  const state = progress.patients[id];
  const reply = state.followUp.choice === null ? null : calls[id].choices?.[state.followUp.choice];
  return <div className="panel">
    <button className="subtle" onClick={() => open('records')}>{local(titles.records, lang)}</button>
    <p className="path-label">{local(['상담 기록', '咨询记录'], lang)} / {data.number}</p>
    <h2>{local(data.name, lang)}</h2>
    <div className="paper-note">{data.notes.map((note, line) => <p key={line}>{local(note, lang)}</p>)}</div>
    <div className="keyword-list">
      {data.memories.map(key => {
        const completed = state.memories[key]?.completed;
        return <button className={completed ? 'seen' : ''} key={key}
          onClick={() => play({ kind: 'memory', patient: id, id: key })}>
          <FileText size={15} aria-hidden="true"/>{local(memories[key].title, lang)}{completed ? ' ✓' : ''}
        </button>;
      })}
    </div>
    {state.followUp.completed && <div className="paper-note follow-up-record">
      <h3>{local(['전화 상담 기록', '电话回访记录'], lang)}</h3>
      <p>{local(data.followUpNote, lang)}</p>
      {reply && <p>{local(reply.line, lang)}</p>}
      <button className="subtle" onClick={() => play({ kind: 'call', patient: id })}>
        <Phone size={16} aria-hidden="true"/>{local(['전화 다시 듣기', '重听回访'], lang)}
      </button>
    </div>}
  </div>;
}

export function Notes({ lang, open }: { lang: Lang; open: (key: WindowKey) => void }) {
  const notes: { title: Text; lines: Text[]; target: WindowKey }[] = [
    { title: ['오늘 할 일', '今天要做的事'], lines: [
      ['업무 기록을 다시 읽어 볼 것. 전화가 끝나면 기록을 처방전과 함께 보관한다.', '再过一遍工作记录。电话结束后，把回访记录和处方一起归档。'],
      ['‘11월 6일’이 적힌 쪽을 접어 두었다.', '写着「11 月 6 日」的那页，我折了个角。'],
    ], target: 'records' },
    { title: ['나에게 남긴 메모', '留给自己的备忘'], lines: [
      ['숨겨 둔 폴더 안에 편지를 넣어 뒀다.', '信放进了藏起来的文件夹。'],
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

export function Hidden({ lang, locked, open }: {
  lang: Lang;
  locked: boolean;
  open: (key: WindowKey) => void;
}) {
  if (locked) return <div className="panel locked-folder">
    <h2>{local(['잠김', '已锁定'], lang)}</h2>
  </div>;

  return <div className="panel hidden-panel">
    <RetroIcon kind="records"/>
    <h2>{local(titles.hidden, lang)}</h2>
    <div className="file-list">
      {(['memo', 'letter'] as const).map(key => <button className="file-row" key={key} onClick={() => open(key)}>
        <FileText size={21}/><strong>{local(titles[key], lang)}</strong>
      </button>)}
    </div>
  </div>;
}

export function PersonalFile({ file, lang, progress, play }: {
  file: 'memo' | 'letter';
  lang: Lang;
  progress: Progress;
  play: (scene: SceneRequest) => void;
}) {
  return <div className="panel">
    <p className="path-label">{local(titles.hidden, lang)} / 11.06</p>
    <h2>{local(titles[file], lang)}</h2>
    <div className="paper-note"><p>{local(file === 'memo' ?
      ['사진 속 의자, 반쯤 열린 창문, 촛불 하나. 네 파일에서 공통으로 찾은 것들이다. 파일을 만든 시각도 모두 같았다.', '照片里的椅子、半开的窗、一根蜡烛。这是四份档案里都有的东西。它们甚至创建于同一刻。'] :
      ['11월 6일. 꺼낸 적 없는 편지. 봉투 안쪽에도 같은 날짜가 적혀 있다.', '11 月 6 日。一封从未寄出的信。信封里面也写着同样的日期。'], lang)}</p></div>
    {file === 'letter' && <button className="primary" onClick={() => play({ kind: 'ending' })}>
      {local(progress.ending?.completed ? ['다시 읽기', '重读结尾'] : ['편지 펼치기', '展开信纸'], lang)}
    </button>}
  </div>;
}
