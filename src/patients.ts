import type { Text } from './game';

export const patientIds = ['A', 'B', 'C', 'D'] as const;
export type PatientId = typeof patientIds[number];

export type PrescriptionOption = { id: string; label: Text };
export type PrescriptionDraft = {
  problem: string | null;
  interventions: string[];
  advice: string | null;
};
export type PrescriptionChoices = {
  problem: string;
  interventions: [string, string];
  advice: string;
};
export type PatientFile = {
  name: Text;
  number: string;
  profile: Text;
  concern: Text;
  notes: Text[];
  summary: Text;
  memories: string[];
  followUpNote: Text;
  options: {
    problem: readonly PrescriptionOption[];
    interventions: readonly PrescriptionOption[];
    advice: readonly PrescriptionOption[];
  };
  answer: PrescriptionChoices;
};

const option = (id: string, ko: string, zh: string): PrescriptionOption => ({ id, label: [ko, zh] });

// Demo data. Option IDs are used by saves, so keep them stable when replacing the text.
export const patientFiles: Record<PatientId, PatientFile> = {
  A: {
    name: ['환자 A', '患者 A'],
    number: 'SH-01',
    profile: ['첫 상담. 사진과 식탁의 배치를 자세히 기억한다.', '初次来访。能清楚描述照片和餐桌的摆放。'],
    concern: ['정리한 물건이 조금만 어긋나도 다시 손을 대게 된다.', '摆好的东西只要错开一点，就会忍不住再去摆正。'],
    notes: [
      ['상담자는 식탁에서 자리를 비운 날의 이야기를 꺼냈다.', '来访者提起了那天离开餐桌的经过。'],
      ['“거울을 볼 때면 생각이 많아져요. 식탁이든 사진이든 전부 제 손으로 맞춰 놓아야 마음이 놓여요.”', '「照镜子的时候我总会想很多。无论是餐桌还是照片，我总要亲手把一切摆好才安心。」'],
    ],
    summary: ['접시를 맞추는 동안에는 표정이 편해졌다. 언제부터 그래야 마음이 놓였는지 묻자 빈 의자 이야기를 했다.', '来访者在摆正盘子时会松一口气。问起什么时候开始需要这样才能安心，对方提到了那把空椅子。'],
    memories: ['mirror', 'control', 'shame'],
    followUpNote: ['사진 속 빈 의자와 자리를 비우던 순간을 다시 이야기했다.', '来访者再次谈到照片里的空椅子，以及自己离开座位的那一刻。'],
    options: {
      problem: [
        option('routine', '일과의 변화에 적응하기 어려움', '难以适应日常作息的变化'),
        option('order', '정돈을 통해 불안을 가라앉히려 함', '借由整理和控制缓解不安'),
        option('silence', '대화 속 침묵을 불편해함', '对谈话中的沉默感到不适'),
      ],
      interventions: [
        option('before', '물건을 정리하기 직전의 장면을 함께 짚어 보기', '一起回顾动手整理前发生的事'),
        option('visitors', '손님이 오던 날의 일과를 그려 보기', '画下来客当天的日程'),
        option('photo', '같은 사진에 대해 두 가지 설명을 적어 보기', '给同一张照片写下两种描述'),
        option('objects', '방 안에서 익숙한 물건 목록 만들기', '列出房间里熟悉的物件'),
      ],
      advice: [
        option('place', '다음 만남에 이야기하고 싶은 장소를 하나 떠올려 보기', '想一个下次愿意谈起的地方'),
        option('feeling', '배치를 설명하기 전에 그때의 기분을 자기 말로 적어 보기', '描述摆放之前，先用自己的话记下当时的感受'),
        option('time', '다음에 이야기하기 편한 시간을 정해 보기', '想想什么时候方便继续聊'),
      ],
    },
    answer: { problem: 'order', interventions: ['before', 'photo'], advice: 'feeling' },
  },
  B: {
    name: ['환자 B', '患者 B'],
    number: 'SH-02',
    profile: ['첫 상담. 집에서 오가던 말과 목소리를 또렷하게 기억한다.', '初次来访。记得家里的人说过什么，也记得他们的语气。'],
    concern: ['혼자 식탁에 앉으면 누군가와 함께 있고 싶다는 말을 꺼내기 어렵다.', '独自坐到餐桌前时，很难开口说自己想有人陪。'],
    notes: [
      ['상담자는 식사 중에 자주 떠오르는 목소리에 대해 이야기했다.', '来访者说起了一个常在吃饭时想起的声音。'],
      ['“배고프냐는 말을 들을 때면, 그 사람이 저한테 정말 묻고 싶은 건 뭔지 궁금해져요.”', '「有人问我饿不饿时，我就会想，那个人真正想问我的是什么。」'],
    ],
    summary: ['케이크를 받았던 사실보다 상대가 먼저 일어난 장면에 오래 머물렀다. 당시 하고 싶었던 말은 기록에 남지 않았다.', '相比收到蛋糕这件事，来访者更在意对方先起身离开的那一幕。当时想说的话没有写进记录。'],
    memories: ['hunger', 'relation', 'memory'],
    followUpNote: ['케이크를 받았던 날에 곁에 남아 달라고 말하고 싶었다고 했다.', '来访者说，收到蛋糕那天，自己真正想说的是希望对方留下。'],
    options: {
      problem: [
        option('company', '함께 있고 싶다는 말을 음식에 빗대어 전함', '习惯借食物表达想有人陪伴'),
        option('noise', '주변 소리에 집중을 빼앗김', '容易被周围的声音打断思路'),
        option('date', '기억 속 사건의 순서를 정리하기 어려움', '难以理清回忆里事件的先后'),
      ],
      interventions: [
        option('sound', '주방에서 들리던 소리를 적어 보기', '记下当时厨房里有哪些声音'),
        option('questions', '그날 오간 두 질문을 나란히 적어 보기', '把那天的两个问题并排写下来'),
        option('invitation', '곁에 있어 달라는 말을 상담에서 연습하기', '在咨询里试着说出希望有人陪伴的话'),
        option('address', '그날 집에 오던 길을 그려 보기', '画下那天回家的路'),
      ],
      advice: [
        option('quote', '마음에 남은 말을 한 문장만 써 오기', '写下一句自己一直记得的话'),
        option('map', '상담에서 다시 보고 싶은 장소를 표시하기', '标记下次想谈到的一个地方'),
        option('ask', '부담 없는 사람에게 잠깐 함께 앉아 달라고 말해 보기', '试着请一位相处自在的人陪自己坐一会儿'),
      ],
    },
    answer: { problem: 'company', interventions: ['questions', 'invitation'], advice: 'ask' },
  },
  C: {
    name: ['환자 C', '患者 C'],
    number: 'SH-03',
    profile: ['첫 상담. 식탁에 있던 사람들의 말을 짧은 문장으로 받아 적었다.', '初次来访。把餐桌边的人说过的话记成了几条短句。'],
    concern: ['가까운 사람에게 싫다는 말을 하면 분위기를 망칠 것 같다.', '总觉得对亲近的人说「我不愿意」，就会破坏气氛。'],
    notes: [
      ['상담자는 케이크를 가져온 사람보다 칼을 건넨 사람의 말을 더 오래 기억했다.', '比起是谁带来蛋糕，来访者更记得递来蛋糕刀的人说了什么。'],
      ['“제가 고맙다고 먼저 말하면, 아무도 제 표정을 안 봐도 되잖아요.”', '「我先说谢谢，大家就都不用看我的表情了。」'],
    ],
    summary: ['고마운 마음과 그 자리에서 벗어나고 싶은 마음이 함께 있었다. 두 감정을 한 문장으로 말하기는 어려웠다.', '感激和想离开的念头同时出现。来访者很难在同一句话里说出这两种感受。'],
    memories: ['knife', 'thanks', 'door'],
    followUpNote: ['고맙다는 말과 잠시 쉬고 싶다는 말을 나란히 남겼다.', '来访者同时留下了两句话。谢谢，以及我想休息一会儿。'],
    options: {
      problem: [
        option('names', '사람들의 이름을 기억하는 데 어려움', '很难记得聚会中其他人的名字'),
        option('prepare', '예상하지 못한 일정 변화가 부담됨', '突如其来的安排让人不知所措'),
        option('limits', '고마운 마음과 자기 경계를 함께 표현하기 어려움', '很难同时表达感谢和自己的界限'),
      ],
      interventions: [
        option('two-lines', '감사와 거절을 각각 한 문장으로 적기', '把感谢和拒绝分别写成一句话'),
        option('short-reply', '잠시 자리를 비우겠다는 짧은 말을 연습하기', '练习用一句短话说明自己想离席一会儿'),
        option('order-events', '그날의 대화 순서 기록하기', '记录当天对话的顺序'),
        option('objects', '기억에 남은 물건의 이름 적어 보기', '给记得的物件列个清单'),
      ],
      advice: [
        option('own-time', '대답하기 전에 잠깐 생각할 시간이 필요하다고 말해 보기', '试着告诉对方，自己需要一点时间再回答'),
        option('chairs', '자리 배치를 간단히 그려 오기', '简单画出当天的座位安排'),
        option('first-word', '가장 먼저 기억나는 말을 하나 골라 오기', '挑一句自己最先想起来的话'),
      ],
    },
    answer: { problem: 'limits', interventions: ['two-lines', 'short-reply'], advice: 'own-time' },
  },
  D: {
    name: ['환자 D', '患者 D'],
    number: 'SH-04',
    profile: ['첫 상담. 같은 저녁에서 여러 번 빠져 있는 시간을 떠올린다.', '初次来访。多次提到同一个晚上，记忆里总缺几段时间。'],
    concern: ['기억에 빈 부분이 생기면 다른 사람이 말한 내용으로 곧바로 채우게 된다.', '回忆里有空缺时，会马上拿别人说过的话补进去。'],
    notes: [
      ['상담자는 테이프의 잡음과 창문 빗소리를 구분할 수 있다고 했다.', '来访者说，能分辨磁带的杂音和窗外的雨声。'],
      ['“희미한 건 괜찮은데, 모르는 채로 남겨 두는 건 좀 어려워요.”', '「记得模糊倒还好，留着一个自己不知道的地方，就有点难。」'],
    ],
    summary: ['직접 기억하는 부분과 전해 들은 부분을 표시하자 다른 사람의 말로 채운 문장이 보였다. 빈칸에는 날짜만 남겼다.', '标出亲自记得和听别人说的部分之后，来访者找出了几句借来的话。在空白处只写下了日期。'],
    memories: ['tape', 'jacket', 'blank'],
    followUpNote: ['직접 기억하는 소리를 남기고, 나머지 한 줄은 비워 두기로 했다.', '来访者记下了自己能确认的声音，决定暂时留空另一行。'],
    options: {
      problem: [
        option('recall', '세부 사항마다 이름을 붙이는 데 어려움', '难以给回忆中的细节命名'),
        option('gaps', '확실한 기억과 전해 들은 내용을 구분하기 어려움', '难以区分自己的记忆和听别人说的内容'),
        option('questions', '다음 상담에서 먼저 물을 주제를 고르기 어려움', '很难选定下次咨询时先谈哪个话题'),
      ],
      interventions: [
        option('sources', '직접 기억한 것과 들은 것을 두 칸에 나누어 적기', '分两栏记录亲自记得和听别人说的事'),
        option('catalog', '기억나는 물건의 색을 나열하기', '列出能记住的物件颜色'),
        option('blank', '확실하지 않은 장면에 빈칸 남기기', '在无法确认的片段留出空白'),
        option('date', '다음 상담 날짜를 달력에 표시하기', '在日历上标记下次咨询的日期'),
      ],
      advice: [
        option('keep', '확실한 장면 하나만 적고 나머지는 열어 두기', '只记下一段能确认的画面，其他先留空'),
        option('draw', '다음에 보여 주고 싶은 물건을 그려 보기', '画一个下次想给医生看的物件'),
        option('place', '대화하기 편했던 장소를 떠올려 보기', '回想一个适合谈话的地方'),
      ],
    },
    answer: { problem: 'gaps', interventions: ['sources', 'blank'], advice: 'keep' },
  },
};
