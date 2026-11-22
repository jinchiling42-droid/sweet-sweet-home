import type { Text } from './game';
import type { PatientId } from './patients';

export const reportTitle: Text = ['사례개념화', '个案报告'];

export type ReportOption = { id: string; label: Text };
export type EvidenceOption = ReportOption & { memory: string };
export type ReportDraft = {
  observation: string | null;
  factor: string | null;
  evidence: string[];
  focus: string | null;
};
export type ReportChoices = {
  observation: string;
  factor: string;
  evidence: [string, string];
  focus: string;
};
type ReportOptions = {
  observation: readonly ReportOption[];
  factor: readonly ReportOption[];
  evidence: readonly EvidenceOption[];
  focus: readonly ReportOption[];
};

const item = (id: string, ko: string, zh: string): ReportOption => ({ id, label: [ko, zh] });
const excerpt = (id: string, memory: string, ko: string, zh: string): EvidenceOption => ({
  ...item(id, ko, zh), memory,
});

// TODO: REPLACE STORY TEXT
// Keep option IDs stable when editing text. Evidence links to a memory ID in patients.ts.
export const reportOptions: Record<PatientId, ReportOptions> = {
  A: {
    observation: [
      item('plates', '자리에 앉기 전에 접시를 여러 번 맞춰 놓음', '坐下前多次把盘子摆回原位'),
      item('mirror', '불편한 방의 모습이 보이지 않도록 거울을 돌림', '转动镜子，让自己不必看见房间的一角'),
      item('leaving', '식사 도중 이유를 말하지 않고 자리를 비움', '用餐途中没有说明原因便离席'),
    ],
    factor: [
      item('unheard', '자기 말이 들리지 않는다고 느낀 순간의 불안', '觉得自己的话没被听见时产生的不安'),
      item('layout', '익숙한 식탁 배치가 주는 안도감', '熟悉的餐桌布局可能让来访者感到安心'),
      item('unknown', '정돈 습관이 시작된 시점에 대한 정보 부족', '暂时缺少这一整理习惯从何时开始的信息'),
    ],
    evidence: [
      excerpt('mirror-room', 'mirror', '거울을 반 바퀴 돌리자 방 한쪽이 보이지 않았다.', '把镜子转过半圈，房间的一角就看不见了。'),
      excerpt('straight-plate', 'control', '접시를 식탁 모서리와 나란히 놓고 나서야 앉았다.', '把盘子摆得和桌边平行之后，才坐下。'),
      excerpt('window-sound', 'control', '창문이 흔들릴 때마다 접시가 조금씩 어긋나는 것 같았다.', '窗户每响一下，盘子就好像又歪了一点。'),
      excerpt('empty-chair', 'shame', '돌아보니 자신이 앉았던 자리가 비어 있었다.', '回头看时，原先坐的那把椅子空着。'),
    ],
    focus: [
      item('before', '접시를 다시 놓기 직전의 상황 확인', '了解动手摆正盘子之前的情境'),
      item('chair', '빈 의자를 보았을 때 떠오른 기억 듣기', '了解看到空椅子时想起了什么'),
      item('elsewhere', '집 밖에서도 비슷한 일이 있었는지 확인', '了解类似情况是否也发生在家以外'),
    ],
  },
  B: {
    observation: [
      item('company', '함께 있고 싶다는 마음을 식사 이야기로 전함', '借吃饭这件事表达想有人陪伴'),
      item('voice', '질문을 들으면 말보다 상대의 목소리에 주목함', '被问到时，先在意对方说话的语气'),
      item('waiting', '상대가 먼저 일어난 뒤에도 식탁에 남아 있음', '对方先起身后，来访者仍留在餐桌前'),
    ],
    factor: [
      item('custom', '집에서 안부를 식사에 빗대어 묻던 방식', '家里的人可能习惯用吃饭来代替问候'),
      item('separation', '식사가 끝나면 혼자 남는다는 예상', '可能预期一顿饭结束后就会独处'),
      item('unknown', '다른 관계에서도 같은 일이 있는지 정보 부족', '暂时不知道这种情况是否也发生在其他关系里'),
    ],
    evidence: [
      excerpt('fridge', 'hunger', '부엌이 조용해지자 냉장고 소리가 남았다.', '厨房安静下来之后，只剩下冰箱的声音。'),
      excerpt('question', 'hunger', '“배고파?”라는 질문의 뜻을 오래 생각했다.', '一直在想「饿不饿」这句话到底在问什么。'),
      excerpt('seat', 'relation', '케이크를 건넨 사람이 먼저 의자에서 일어났다.', '递来蛋糕的人先从椅子上站了起来。'),
      excerpt('unfinished-line', 'memory', '하고 싶었던 말이 무엇이었는지 바로 떠오르지 않았다.', '一时想不起那天本来想说的是什么。'),
    ],
    focus: [
      item('meaning', '“배고파?”라는 말이 관계마다 어떻게 다르게 들리는지 듣기', '了解不同的人问「饿不饿」时听起来有什么不同'),
      item('leaving', '상대가 자리를 뜨는 순간 어떤 변화가 있었는지 확인', '梳理对方离席时发生了什么变化'),
      item('company', '지금 곁에 남아 주었으면 하는 사람이 있는지 묻기', '询问现在是否有希望对方留下来陪伴的人'),
    ],
  },
  C: {
    observation: [
      item('thanks', '불편함을 느낀 자리에서 먼저 고맙다고 말함', '感到不自在时，会先说谢谢'),
      item('hall', '자리를 비울 때 문을 끝까지 닫지 않음', '离席时把门半敞着'),
      item('quotes', '자기 감정보다 상대가 건넨 말을 먼저 기록함', '先记下别人说的话，再描述自己的感受'),
    ],
    factor: [
      item('gratitude', '감사와 거절이 함께 있을 수 없다는 생각', '可能认为感谢与拒绝无法同时表达'),
      item('attention', '표정이나 태도가 다른 사람에게 읽힐까 하는 걱정', '可能担心自己的神情会引起别人注意'),
      item('unknown', '다른 모임에서 어떻게 반응하는지는 확인되지 않음', '目前还不清楚在其他聚会里的反应'),
    ],
    evidence: [
      excerpt('cake-knife', 'knife', '케이크 칼을 건넨 사람의 말이 오래 남았다.', '最久没忘的是递来蛋糕刀的人说的话。'),
      excerpt('quick-thanks', 'thanks', '자기 표정을 보이기 전에 고맙다고 먼저 말했다.', '在别人看见自己的表情之前，先说了谢谢。'),
      excerpt('pause', 'thanks', '고마우면서도 잠깐 쉬고 싶었다고 했다.', '提到自己心怀感谢，同时也想休息一会儿。'),
      excerpt('open-door', 'door', '복도로 나올 때 문을 완전히 닫지 않았다.', '走到走廊上时，没有把门完全关上。'),
    ],
    focus: [
      item('boundary', '가까운 사람에게 거절을 말했던 경우를 듣기', '了解过去如何向亲近的人表达拒绝'),
      item('pauses', '감사와 쉬고 싶은 마음이 각각 언제 생겼는지 묻기', '分别了解感谢和想休息的念头何时出现'),
      item('room', '복도와 식탁에서 느꼈던 차이를 함께 돌아보기', '一起梳理站在走廊与坐在餐桌前时的感受'),
    ],
  },
  D: {
    observation: [
      item('rewind', '들리는 소리를 확인하기 위해 테이프를 되감음', '反复倒带以确认听见的声音'),
      item('sources', '기억이 흐린 부분에 들은 이야기를 써 넣음', '会用听来的叙述补上记忆不清的部分'),
      item('blank', '확실하지 않은 한 줄에 날짜만 남김', '有一行无法确认，最后只写了日期'),
    ],
    factor: [
      item('uncertainty', '무엇이 있었는지 모르는 상태를 오래 견디기 어려움', '面对不确定发生过什么的状态，可能很难安心'),
      item('repetition', '같은 이야기를 여러 차례 들은 경험', '反复听到同一个说法可能影响了回忆'),
      item('unknown', '기록이 없는 시간대의 상황은 확인되지 않음', '记录缺失的那段时间里发生了什么仍不清楚'),
    ],
    evidence: [
      excerpt('rain', 'tape', '테이프의 잡음과 창밖의 빗소리를 구분했다고 했다.', '来访者表示能分辨磁带的杂音和窗外的雨声。'),
      excerpt('jacket', 'jacket', '외투가 걸려 있던 곳과 주인에 대한 기억이 서로 다르다.', '外套挂在哪儿和外套是谁的，是把握不同的两件事。'),
      excerpt('borrowed', 'blank', '직접 본 것과 전해 들은 것을 나누자 다른 사람의 문장이 드러났다.', '分开亲眼所见和听来的事后，认出了几句借来的话。'),
      excerpt('date-only', 'blank', '비워 둔 칸에는 그날 날짜만 적었다.', '在留空的那一栏里只写了当天的日期。'),
    ],
    focus: [
      item('sounds', '기억하는 소리와 테이프에서 확인한 소리의 출처 구분', '区分记忆里的声音与后来从磁带听到的声音'),
      item('gap', '기억이 비어 있을 때 어떤 기분이 드는지 듣기', '了解记忆出现空白时的感受'),
      item('timeline', '그날 확실히 기억하는 장면의 앞뒤 순서를 정리', '整理那天能够确认的几段记忆的先后顺序'),
    ],
  },
};
