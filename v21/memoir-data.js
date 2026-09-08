// 演示数据来源：prototype-v17.html 的 CHAPTERS、IV_CHAPTER_QUESTIONS、ivTurns，
// 以及书籍预览中的目录和《门口的老槐树》正文（约 4192、4863、4908、2755-2765 行）。

export const profile = {
  name: '兰秀英',
  nickname: '秀英',
  bookTitle: '我的时光印记'
};

export const chapters = [
  { id: 'family', title: '出生与家族', color: '#B96545', description: '名字、老家、亲人和家里的来处' },
  { id: 'childhood', title: '童年时光', color: '#C99B52', description: '小时候的玩伴、年节和难忘小事' },
  { id: 'school', title: '求学的日子', color: '#66866A', description: '老师、同学、课本和那时候的志气' },
  { id: 'service', title: '参军岁月', color: '#6D7788', description: '新兵连、高原和年轻时走过的路' },
  { id: 'marriage', title: '成家立业', color: '#866277', description: '伴侣、孩子和一家人的重要时刻' },
  { id: 'children', title: '儿女绕膝', color: '#4F7180', description: '儿女成长、团聚和想留给家人的话' }
];

export const questions = [
  {
    id: 'q-name', chapterId: 'family', prompt: '秀英，您的名字，是谁给取的呀？',
    sampleAnswer: '我这名字啊，是我爷爷给取的。听我娘说，我出生那年雨水特别多，村口那条小河涨了好几回，地里的麦子差点都泡坏了。爷爷说，孩子生在这样的年景里，就盼着以后日子能顺一点，所以给我取了秀英。'
  },
  {
    id: 'q-grandfather', chapterId: 'family', prompt: '那时候您爷爷，是做什么的呀？',
    sampleAnswer: '我爷爷是个教书先生，方圆几里的娃都跟他念过书。'
  },
  {
    id: 'q-new-coat', chapterId: 'childhood', prompt: '您还记得，过年那天穿的是什么衣裳吗？',
    sampleAnswer: '记得记得！一件枣红的新棉袄，我娘熬了好几夜缝的。'
  },
  {
    id: 'q-school', chapterId: 'childhood', prompt: '那您还记得，头一天上学，是什么样吗？',
    sampleAnswer: '背个布书包，我爹送我到村口，回头冲我摆手。'
  },
  {
    id: 'q-teacher', chapterId: 'school', prompt: '学生时代，哪位老师让您一直记到现在？',
    sampleAnswer: ''
  },
  {
    id: 'q-proud', chapterId: 'children', prompt: '这辈子，您最得意的一件事是啥？',
    sampleAnswer: '最得意啊，是我闺女考上了大学，村里头一个！'
  }
];

export const seedStories = [
  {
    id: 'story-old-locust', chapterId: 'family', title: '门口的老槐树',
    body: '我家在村头一间土坯房，门口有一棵很老很老的槐树。夏天傍晚，全村人都搬着小板凳到树下乘凉。槐树开花的时候，满村都是甜香。母亲会捋一把槐花，蒸成饭。',
    original: '我家在村头一间土坯房，门口有一棵很老很老的槐树。夏天傍晚，全村人都搬着小板凳到树下乘凉。',
    date: '2026-09-06', photo: ''
  },
  {
    id: 'story-cool-shade', chapterId: 'childhood', title: '树下乘凉',
    body: '夏天全村人都爱在树下乘凉，那是我一辈子最凉快的地方。',
    original: '夏天全村人都爱在树下乘凉，那是我一辈子最凉快的地方。',
    date: '2026-09-06', photo: ''
  }
];
