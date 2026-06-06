// All 16 cards in the shared deck
const DECK = [
  // 村民 ×4
  { id: 'villager_1', type: 'villager', category: 'character', name: '村民', hp: 2, atk: 1, skill: null, skillCard: null },
  { id: 'villager_2', type: 'villager', category: 'character', name: '村民', hp: 2, atk: 1, skill: null, skillCard: null },
  { id: 'villager_3', type: 'villager', category: 'character', name: '村民', hp: 2, atk: 1, skill: null, skillCard: null },
  { id: 'villager_4', type: 'villager', category: 'character', name: '村民', hp: 2, atk: 1, skill: null, skillCard: null },

  // 狼人 ×4
  { id: 'wolf_1', type: 'wolf', category: 'character', name: '狼人', hp: 3, atk: 1, skill: null, skillCard: null },
  { id: 'wolf_2', type: 'wolf', category: 'character', name: '狼人', hp: 3, atk: 1, skill: null, skillCard: null },
  { id: 'wolf_3', type: 'wolf', category: 'character', name: '狼人', hp: 3, atk: 1, skill: null, skillCard: null },
  { id: 'wolf_4', type: 'wolf', category: 'character', name: '狼人', hp: 3, atk: 1, skill: null, skillCard: null },

  // 猎人 ×2
  { id: 'hunter_1', type: 'hunter', category: 'character', name: '猎人', hp: 3, atk: 1.5, skill: 'martyrdom', skillCard: null },
  { id: 'hunter_2', type: 'hunter', category: 'character', name: '猎人', hp: 3, atk: 1.5, skill: 'martyrdom', skillCard: null },

  // 守卫 ×2
  { id: 'guardian_1', type: 'guardian', category: 'dual', name: '守卫', hp: 2, atk: 1, skill: null, skillCard: 'shield' },
  { id: 'guardian_2', type: 'guardian', category: 'dual', name: '守卫', hp: 2, atk: 1, skill: null, skillCard: 'shield' },

  // 女巫 ×2
  { id: 'witch_1', type: 'witch', category: 'dual', name: '女巫', hp: 2, atk: 1, skill: 'revive_self', skillCard: 'revive_ally' },
  { id: 'witch_2', type: 'witch', category: 'dual', name: '女巫', hp: 2, atk: 1, skill: 'revive_self', skillCard: 'revive_ally' },

  // 预言家 ×2
  { id: 'seer_1', type: 'seer', category: 'dual', name: '预言家', hp: 2, atk: 1, skill: 'dodge', skillCard: 'reveal' },
  { id: 'seer_2', type: 'seer', category: 'dual', name: '预言家', hp: 2, atk: 1, skill: 'dodge', skillCard: 'reveal' },
];

// Character type lookup (for creating instances)
const CHARACTER_STATS = {
  villager: { name: '村民', hp: 2, atk: 1, skill: null },
  wolf:     { name: '狼人', hp: 3, atk: 1, skill: null },
  hunter:   { name: '猎人', hp: 3, atk: 1.5, skill: 'martyrdom' },
  guardian:  { name: '守卫', hp: 2, atk: 1, skill: null },
  witch:    { name: '女巫', hp: 2, atk: 1, skill: 'revive_self' },
  seer:     { name: '预言家', hp: 2, atk: 1, skill: 'dodge' },
};

// Skill card effect descriptions
const SKILL_EFFECTS = {
  shield:      { name: '守护之盾', desc: '免疫一次伤害' },
  revive_ally: { name: '复活药水', desc: '复活一张已失去的角色牌' },
  reveal:      { name: '天眼', desc: '查看对方所有手牌，指定其下一张出的角色' },
};

// Skill descriptions (passive)
const SKILL_DESC = {
  martyrdom:   { name: '殉职', desc: '死亡时对对方场上角色造成10点伤害' },
  revive_self: { name: '复活', desc: '死亡时满血复活一次' },
  dodge:       { name: '躲避', desc: '可躲避一次攻击（含毒药）' },
  poison:      { name: '毒药', desc: '直接击杀对方场上一个角色（无视守卫盾）' },
};

/**
 * Shuffle an array (Fisher-Yates)
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Deal 6 cards to each player from a shuffled 16-card deck
 */
function dealCards() {
  const shuffled = shuffle(DECK);
  return {
    player1: shuffled.slice(0, 6),
    player2: shuffled.slice(6, 12),
    remaining: shuffled.slice(12), // 4 cards unused
  };
}

module.exports = { DECK, CHARACTER_STATS, SKILL_EFFECTS, SKILL_DESC, shuffle, dealCards };
