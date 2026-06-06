// Client-side data mirrors server data
const CHARACTER_STATS = {
  villager: { name: '村民', hp: 2, atk: 1 },
  wolf:     { name: '狼人', hp: 3, atk: 1 },
  hunter:   { name: '猎人', hp: 3, atk: 1.5 },
  guardian:  { name: '守卫', hp: 2, atk: 1 },
  witch:    { name: '女巫', hp: 2, atk: 1 },
  // seer is a pure skill card, no field character
};

const SKILL_EFFECTS = {
  shield:      { name: '守护之盾', desc: '免疫一次伤害' },
  revive_ally: { name: '复活药水', desc: '复活一张已失去的角色牌' },
  reveal:      { name: '天眼', desc: '查看对方所有手牌，指定其下一张出的角色' },
};

const SKILL_DESC = {
  martyrdom:   { name: '殉职', desc: '死亡时对对方场上角色造成10点伤害' },
  revive_self: { name: '复活', desc: '死亡时满血复活一次' },
  poison:      { name: '毒药', desc: '直接击杀对方场上一个角色（无视守卫盾）' },
};

// Card category labels
const CATEGORY_LABELS = {
  character: '角色',
  dual: '双用',
  skill: '技能',
};
