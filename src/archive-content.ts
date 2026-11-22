import type { Text } from './game';

export const albumCode = '041206';

export type ArchiveKind = 'news' | 'text' | 'video' | 'audio' | 'photo' | 'scan' | 'note';
export type ArchiveArt = {
  motif: 'window' | 'chair' | 'table';
  caption: Text;
  src?: string;
};
type ArchiveDocument = {
  title: Text;
  name: string;
  date: string;
  body: readonly Text[];
  required: boolean;
  art?: ArchiveArt;
};
type ArchiveFile = ArchiveDocument & (
  { kind: 'video' | 'audio'; duration: number; src?: string } |
  { kind: 'news' | 'text' | 'photo' | 'scan' | 'note' }
);

export const archiveKindLabels: Record<ArchiveKind, Text> = {
  news: ['신문 스크랩', '新闻剪报'],
  text: ['문서', '文档'],
  video: ['영상', '影像'],
  audio: ['음성', '音频'],
  photo: ['사진', '照片'],
  scan: ['스캔 문서', '扫描件'],
  note: ['개인 메모', '私人便签'],
};

// TODO: REPLACE IMAGE — add an imported image URL as src for any of these stills.
export const albumPhotos: readonly ArchiveArt[] = [
  { motif: 'window', caption: ['11.06 · 비가 그친 뒤의 창문', '11.06 · 雨停后的窗'] },
  { motif: 'chair', caption: ['11.06 · 창가를 향한 빈 의자', '11.06 · 朝向窗边的空椅'] },
  { motif: 'table', caption: ['11.06 · 식탁 끝에 놓인 접시', '11.06 · 桌沿那只盘子'] },
];

// TODO: REPLACE STORY TEXT — required flags determine when the archive is complete.
export const archiveFiles = {
  clipping: {
    kind: 'news', title: ['11월 7일 자 지역신문', '11 月 7 日地方剪报'],
    name: 'district-evening.news', date: '2024.11.07', required: true,
    art: albumPhotos[0],
    body: [
      ['오래된 주택가, 정전 뒤 첫 아침', '旧住宅区停电后的第一个早晨'],
      ['어젯밤 비가 그친 직후, 오래된 주택가 세 블록에서 전기가 끊겼다. 식당의 간판이 먼저 꺼졌고 몇 분 뒤 윗집의 창도 모두 어두워졌다. 전기는 같은 날 밤 늦게 돌아왔다.', '昨夜雨停后不久，旧住宅区相邻的三个街区停了电。餐馆招牌最先熄灭，几分钟后，楼上的窗也全暗了。电力在当天深夜恢复。'],
      ['길 건너 가게 주인은 불이 꺼지기 전에 창가에 둔 식탁을 보았다고 말했다. 창문이 반쯤 열린 채였고, 케이크 상자로 보이는 흰 상자 하나가 창틀보다 조금 위로 보였다.', '马路对面的店主说，熄灯前见过摆在窗边的餐桌。窗户半开着，有个像是蛋糕盒的白盒子，比窗框高出一点。'],
      ['사진은 정전이 끝난 뒤 촬영됐다. 기록에는 사람 수나 방 안에서 오간 말이 남아 있지 않다. 인쇄본 여백에 누군가 “시간을 다시 확인할 것”이라고 적어 두었다.', '配图摄于供电恢复之后。剪报没有记下房里有多少人，也没有记下他们说过的话。纸版边缘有人写了「再核对一次时间」。'],
    ],
  },
  journal: {
    kind: 'text', title: ['11월 6일의 일기', '11 月 6 日的日记'],
    name: 'journal-1106.txt', date: '2024.11.06', required: true,
    body: [
      ['오후 일곱 시. 접시 하나를 꺼냈다. 수저를 한 벌 더 꺼내려다 서랍을 닫았다. 창문이 조금 열려 있어서, 식탁 위로 얇은 종이들이 계속 밀려왔다.', '晚上七点。我拿出一只盘子。原本想再拿一副餐具，抽屉拉开一半，又推了回去。窗户开着一条缝，薄纸一张张被吹到桌子这头。'],
      ['케이크는 가운데에 놓았다. 사진을 찍을 때는 의자가 자꾸 화면에 들어왔다. 의자를 치울까 하다가 카메라만 조금 옆으로 돌렸다. 인화한 사진에는 탁자 모서리와 창틀만 남았다.', '蛋糕放在正中间。拍照时椅子总是入镜。我想把椅子挪开，最后只调了一下相机。洗出来的照片里，只剩桌角和窗框。'],
      ['탁자에 앉았을 때 누군가 고맙다는 말을 했던 것 같다. 그 말을 쓰고 나니 누구에게 들었는지가 생각나지 않았다. 내 글씨가 아닌 것처럼 느껴져서, 방금 적은 줄을 손으로 가리고 다시 읽어 봤다.', '坐到桌边时，好像有人说了谢谢。写完才发现，我记不清是从谁那里听到的。字迹看着有点陌生，我用手盖住刚写下的那行，又读了一遍。'],
      ['아홉 시. 창가의 전등이 한꺼번에 꺼졌다. 냉장고 소리도 끊겼다가 뒤늦게 돌아왔다. 어두울 때 들은 소리와 조금 뒤에 테이프에서 들은 소리가 같은지는 모르겠다.', '九点。窗边的灯一下全灭了。冰箱的声音也断了一会儿，很久才回来。我分不清摸黑听到的声音，和后来从磁带里听到的是不是同一个。'],
      ['방에 누가 있었는지 묻는 칸을 또 비워 두었다. 날짜는 전부 같은데, 답을 적으려고 할 때마다 여러 문장이 한꺼번에 떠오른다. 그중 어떤 문장은 내가 써 놓고도 처음 보는 것 같았다.', '我又把「房里还有谁」那一栏留了空。日期每次都是一样的，可只要试着写答案，几个不同的句子就会一起冒出来。其中有几句明明是我写的，却像第一次看见。'],
      ['잠들기 전에 창문을 반쯤 닫고 의자를 그대로 두었다. 내일의 내가 이 방에 들어오면, 테이블이 어디에 있었는지만은 기억해 냈으면 좋겠다.', '睡前我把窗户关了一半，椅子留在原处。希望明天的我再走进这个房间，至少还能记得餐桌摆在哪里。'],
    ],
  },
  footage: {
    kind: 'video', title: ['창가 고정 카메라', '窗边固定机位'],
    name: 'window-camera.mov', date: '2024.11.06', required: true, duration: 8,
    art: albumPhotos[0],
    // TODO: REPLACE VIDEO — set src to the finished clip URL or imported asset.
    body: [
      ['카메라는 창틀과 식탁 끝만 비춘다. 마지막 몇 초 동안 화면이 어두워지고, 창의 반사에 움직이는 의자가 보인다.', '镜头只拍到窗框和桌沿。最后几秒画面变暗，窗户倒影里有把椅子在移动。'],
    ],
  },
  tape: {
    kind: 'audio', title: ['응답기의 남은 메시지', '答录机的残留留言'],
    name: 'line-04.wav', date: '2024.11.06', required: false, duration: 10,
    // TODO: REPLACE AUDIO — set src to the finished recording.
    body: [
      ['재생 가능한 구간에는 통화 연결음과 종이가 접히는 소리가 남아 있다. 말소리는 끝부분이 잘렸다.', '可播放的片段里有接通音和一声折纸。说话声的末尾断掉了。'],
    ],
  },
  print: {
    kind: 'photo', title: ['유리창에 비친 의자', '玻璃映出的椅子'],
    name: 'contact-print-04.jpg', date: '2024.11.06', required: false,
    art: albumPhotos[1],
    body: [
      ['창문을 향하도록 돌려 놓은 의자. 인화지 뒷면에는 번호만 적혀 있다.', '椅子转过去朝着窗户。相纸背面只写了编号。'],
    ],
  },
  intake: {
    kind: 'scan', title: ['초기 면담 사본', '初次面谈扫描件'],
    name: 'intake-copy.pdf', date: '2024.11.08', required: true,
    body: [
      ['면담 자료 사본 · 첫 페이지 누락', '面谈资料副本 · 首张缺页'],
      ['면담이 시작된 시각은 확인할 수 없다. 당사자는 저녁 여덟 시부터 다음 날 새벽까지의 일을 시간순으로 적으려 했지만, 같은 식탁을 서로 다른 방향에서 본 장면들을 먼저 기록했다.', '面谈开始的时间无法核对。当事人试着按顺序记录晚上八点到次日凌晨发生的事，最先写下的却是从不同方向看见的同一张餐桌。'],
      ['첨부 목록에는 사진 네 장과 테이프 한 개가 있다. 근거 자료의 날짜는 모두 같으나 파일 이름의 필체에는 차이가 거의 없다. 주소가 적힌 줄은 복사 과정에서 잘려 나갔다.', '附件清单写着四张照片和一盒磁带。资料日期相同，文件名的笔迹也几乎没有区别。地址那一行在复印时被切掉了。'],
      ['후속 면담에서 식탁의 위치와 현관문을 열고 닫는 소리를 각각 확인하기로 했다. 당사자가 고른 것은 소리부터 듣는 방법이었다.', '后续面谈约定分别核对餐桌的位置和开关门的声音。当事人选择先从声音开始。'],
      ['하단의 서명란은 남아 있다. 서명 아래에는 다른 잉크로 “다음 쪽은 별도 보관”이라고 적혀 있다.', '底部签名栏还在。签名下面用另一种墨水写着「下一页另行保管」。'],
    ],
  },
  'album-note': {
    kind: 'note', title: ['사진첩에 붙인 쪽지', '贴在相册上的便签'],
    name: 'sticky-note.txt', date: '2024.11.06', required: false,
    body: [[`사진첩 비밀번호: ${albumCode}`, `相册密码：${albumCode}`]],
  },
  letter: {
    kind: 'text', title: ['보내지 않은 편지', '没寄出的信'],
    name: 'unsent-letter.txt', date: '2024.11.06', required: false,
    body: [
      ['11월 6일. 꺼낸 적 없는 편지. 봉투 안쪽에도 같은 날짜가 적혀 있다.', '11 月 6 日。一封从未寄出的信。信封里面也写着同样的日期。'],
      ['사진 속 의자, 반쯤 열린 창문, 촛불 하나. 네 파일에서 공통으로 찾은 것들이다. 파일을 만든 시각도 모두 같았다.', '照片里的椅子、半开的窗、一根蜡烛。这是四份档案里都有的东西。它们甚至创建于同一刻。'],
      ['받는 사람의 이름은 봉투를 닫기 전에 쓰려고 했다. 지금도 그 칸은 비어 있다.', '我原本想在封口前写上收信人的名字。那一栏现在还是空的。'],
    ],
  },
} satisfies Record<string, ArchiveFile>;

export type ArchiveId = keyof typeof archiveFiles;
export const archiveIds = Object.keys(archiveFiles) as ArchiveId[];
export const findArchiveFile = (id: ArchiveId): ArchiveFile => archiveFiles[id];
export const requiredArchiveIds = archiveIds.filter(id => archiveFiles[id].required);
