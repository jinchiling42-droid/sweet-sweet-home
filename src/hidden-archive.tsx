import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AudioLines, Check, FileImage, FileText, Film, Newspaper, Pin, ScanLine, StickyNote } from 'lucide-react';
import { archiveIds, archiveKindLabels, findArchiveFile, type ArchiveArt, type ArchiveId, type ArchiveKind } from './archive-content';
import { local, type ArchiveProgress, type Lang, type Text } from './game';
import { ReadEnd } from './read-end';

const icons = {
  news: Newspaper, text: FileText, video: Film, audio: AudioLines,
  photo: FileImage, scan: ScanLine, note: StickyNote,
} satisfies Record<ArchiveKind, typeof FileText>;

export function ArchiveStill({ art, lang }: { art: ArchiveArt; lang: Lang }) {
  const alt = local(art.caption, lang);
  return art.src ? <img className="archive-still" src={art.src} alt={alt}/>
    : <span className={`archive-still still-${art.motif}`} role="img" aria-label={alt}>
      <i/><b/><span/>
    </span>;
}

type Media = Extract<ReturnType<typeof findArchiveFile>, { duration: number }>;

function ArchiveMedia({ item, lang, active, seen, onFinish }: {
  item: Media;
  lang: Lang;
  active: boolean;
  seen: boolean;
  onFinish: () => void;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const atEnd = elapsed >= item.duration;
  const running = playing && active && !atEnd;
  const l = (text: Text) => local(text, lang);
  useEffect(() => {
    if (!running || item.src) return;
    const timer = window.setInterval(() => setElapsed(current => Math.min(current + 0.25, item.duration)), 250);
    return () => window.clearInterval(timer);
  }, [running, item.duration, item.src]);

  useEffect(() => {
    const media = wrapper.current?.querySelector<HTMLMediaElement>('video, audio');
    if (!active) {
      setPlaying(false);
      media?.pause();
    }
    return () => media?.pause();
  }, [active, item.src]);

  useEffect(() => { if (active && atEnd && !seen) onFinish(); }, [active, atEnd, seen, onFinish]);

  return <div className="archive-media" ref={wrapper}>
    {item.src ? (item.kind === 'video'
      ? <video controls playsInline src={item.src} poster={item.art?.src} onEnded={onFinish}/>
      : <audio controls src={item.src} onEnded={onFinish}/>)
      : <>
        <div className={`archive-media-display ${running ? 'is-playing' : ''}`}>
          {item.kind === 'video' && item.art ? <ArchiveStill art={item.art} lang={lang}/>
            : <div className="archive-wave" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>}
        </div>
        <div className="archive-transport">
          <button className="subtle" onClick={() => {
            if (atEnd) setElapsed(0);
            setPlaying(atEnd || !playing);
          }}>
            {l(atEnd ? ['다시 재생', '重新播放'] : running ? ['일시 정지', '暂停'] : ['재생', '播放'])}
          </button>
          <progress max={item.duration} value={elapsed} aria-label={l(['재생 위치', '播放位置'])}/>
          <span>{`00:${String(Math.floor(elapsed)).padStart(2, '0')}`}</span>
        </div>
      </>}
  </div>;
}

function ArchiveViewer({ id, lang, active, seen, onFinish }: {
  id: ArchiveId;
  lang: Lang;
  active: boolean;
  seen: boolean;
  onFinish: () => void;
}) {
  const item = findArchiveFile(id);
  const [enlarged, setEnlarged] = useState(false);
  const l = (text: Text) => local(text, lang);
  const isMedia = item.kind === 'audio' || item.kind === 'video';
  const document = item.kind === 'news' || item.kind === 'text' || item.kind === 'scan';
  return <article className={`archive-document archive-${item.kind}`} aria-labelledby={`archive-${id}-title`}>
    <header>
      <p className="path-label">{item.name} · <time dateTime={item.date.replace(/\./g, '-')}>{item.date}</time></p>
      <h2 id={`archive-${id}-title`}>{l(item.title)}</h2>
    </header>
    {isMedia && <ArchiveMedia item={item} {...{ lang, active, seen, onFinish }}/>}
    {item.kind === 'news' && item.art && <figure>
      <ArchiveStill art={item.art} lang={lang}/>
      <figcaption>{l(item.art.caption)}</figcaption>
    </figure>}
    {item.kind === 'photo' && item.art && <figure className={enlarged ? 'is-enlarged' : ''}>
      <button type="button" className="photo-zoom" aria-expanded={enlarged}
        aria-label={l(enlarged ? ['사진 축소', '缩小照片'] : ['사진 확대', '放大照片'])}
        onClick={() => { if (!enlarged) onFinish(); setEnlarged(!enlarged); }}>
        <ArchiveStill art={item.art} lang={lang}/>
      </button>
      <figcaption>{l(item.art.caption)}</figcaption>
    </figure>}
    <div className="archive-document-copy">{item.body.map((line, index) => <p key={index}>{l(line)}</p>)}</div>
    {document && <ReadEnd enabled={active && !seen} onReach={onFinish}/>}
    {isMedia && !seen && <button className="subtle" onClick={onFinish}>{l(['확인 완료', '查看完成'])}</button>}
    {seen && <p className="archive-read"><Check size={16} aria-hidden="true"/>{l(['확인함', '已查看'])}</p>}
  </article>;
}

export function HiddenArchive({ lang, locked, archive, active, onView, onFinish, onExit }: {
  lang: Lang;
  locked: boolean;
  archive: ArchiveProgress;
  active: boolean;
  onView: (id: ArchiveId | 'index') => void;
  onFinish: (id: ArchiveId) => void;
  onExit: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const id = archive.view === 'index' ? null : archive.view;
  const l = (text: Text) => local(text, lang);
  useLayoutEffect(() => {
    if (root.current?.parentElement) root.current.parentElement.scrollTop = 0;
  }, [id]);

  if (locked) return <div className="panel locked-folder"><h2>{l(['잠김', '已锁定'])}</h2></div>;

  return <div ref={root} className="panel hidden-archive">
    <div className="archive-toolbar">
      {id ? <button className="subtle" onClick={() => onView('index')}>{l(['목록으로', '返回档案列表'])}</button>
        : <h2>{l(['개인 자료', '私人档案'])}</h2>}
      <button className="subtle" onClick={onExit}>{l(['데스크톱으로', '返回桌面'])}</button>
    </div>
    {id ? <div key={id}><ArchiveViewer id={id} lang={lang} active={active} seen={archive.read.includes(id)}
      onFinish={() => onFinish(id)}/></div>
      : <ul className="archive-file-grid">{archiveIds.map(key => {
        const file = findArchiveFile(key);
        const Icon = icons[file.kind];
        const seen = archive.read.includes(key);
        return <li key={key}>
          <button className="file-row archive-file-row" onClick={() => onView(key)}>
            <Icon size={22} aria-hidden="true"/>
            <span><strong>{l(file.title)}</strong><small>{l(archiveKindLabels[file.kind])}</small></span>
            {file.required && <Pin size={14} className="archive-pin" aria-label={l(['색인 자료', '索引档案'])}/>}
            {seen && <Check size={16} className="archive-check" aria-label={l(['확인함', '已查看'])}/>}
          </button>
        </li>;
      })}</ul>}
  </div>;
}
