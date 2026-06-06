const { CHARACTER_STATS } = require('./data');

/**
 * Create a character instance for the field
 */
function createFieldCharacter(card) {
  const stats = CHARACTER_STATS[card.type];
  return {
    id: card.id,
    type: card.type,
    name: stats.name,
    maxHp: stats.hp,
    currentHp: stats.hp,
    atk: stats.atk,
    skill: stats.skill,
    // Witch-specific
    reviveUsed: false,
  };
}

/**
 * Apply damage to a field character
 * Returns { died, overkill, actualDamage }
 */
function applyDamage(character, damage) {
  const actualDamage = Math.min(damage, character.currentHp);
  character.currentHp -= actualDamage;
  return {
    died: character.currentHp <= 0,
    overkill: damage - actualDamage,
    actualDamage,
  };
}

/**
 * Process a standard attack
 */
function processAttack(attackerField, defenderField, defenderState) {
  const result = {
    attacker: attackerField.type,
    defender: defenderField.type,
    damage: attackerField.atk,
    effects: [],
  };

  // Check if defender has seer dodge active
  if (defenderState.dodgeActive) {
    defenderState.dodgeActive = false;
    result.effects.push({ type: 'dodge', message: `${defenderField.name} 躲避了攻击！` });
    result.damage = 0;
    return result;
  }

  // Check if defender has guardian shield
  if (defenderState.shieldActive) {
    defenderState.shieldActive = false;
    result.effects.push({ type: 'shield', message: `守卫之盾抵挡了攻击！` });
    result.damage = 0;
    return result;
  }

  // Apply damage
  const dmgResult = applyDamage(defenderField, attackerField.atk);
  result.dmgResult = dmgResult;

  if (dmgResult.died) {
    result.effects.push({
      type: 'death',
      message: `${defenderField.name} 被击败了！`,
      character: defenderField.type,
    });
  }

  return result;
}

/**
 * Process hunter's martyrdom skill (on death)
 * Returns damage to apply to opponent's field character
 */
function processHunterDeath(hunterField, opponentField) {
  if (hunterField.skill !== 'martyrdom') return null;

  return {
    type: 'martyrdom',
    damage: 10,
    message: `猎人发动【殉职】！对 ${opponentField.name} 造成 10 点伤害！`,
  };
}

/**
 * Process witch's self-revive (on death)
 * Returns whether witch should revive
 */
function processWitchDeath(witchState) {
  if (witchState.skill !== 'revive_self') return false;
  if (witchState.reviveUsed) return false;

  witchState.reviveUsed = true;
  witchState.currentHp = witchState.maxHp;
  return true;
}

/**
 * Process witch poison (direct kill, ignores guardian shield, but seer dodge can avoid)
 */
function processWitchPoison(targetField, targetState) {
  // Check seer dodge
  if (targetState.dodgeActive) {
    targetState.dodgeActive = false;
    return {
      success: false,
      message: `预言家躲避了毒药！`,
    };
  }

  // Direct kill (ignores guardian shield)
  const previousHp = targetField.currentHp;
  targetField.currentHp = 0;

  return {
    success: true,
    message: `女巫使用毒药！${targetField.name} 被直接击杀！`,
    killedCharacter: targetField.type,
  };
}

/**
 * Process seer's passive dodge activation
 */
function processSeerDeploy(seerField, playerState) {
  if (seerField.skill === 'dodge') {
    playerState.dodgeActive = true;
  }
}

/**
 * Process guardian shield skill card usage
 */
function processShieldCard(playerState) {
  playerState.shieldActive = true;
  return {
    type: 'shield',
    message: '守护之盾已激活！可免疫下一次伤害。',
  };
}

/**
 * Process seer reveal skill card usage
 * Returns opponent's hand info and forces next deployment
 */
function processRevealCard(opponentState) {
  return {
    type: 'reveal',
    hand: opponentState.hand.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      category: c.category,
    })),
    message: '天眼发动！你看到了对方的所有手牌。',
  };
}

/**
 * Process witch revive ally skill card
 * Returns list of lost characters that can be revived
 */
function processReviveAllyCard(playerState) {
  if (playerState.lost.length === 0) {
    return { success: false, message: '没有可复活的角色牌。' };
  }

  return {
    success: true,
    lost: playerState.lost.map(c => ({ id: c.id, name: c.name, type: c.type })),
    message: '选择一张已失去的角色牌复活。',
  };
}

/**
 * Execute revive: move a lost card back to hand
 */
function executeRevive(playerState, cardId) {
  const idx = playerState.lost.findIndex(c => c.id === cardId);
  if (idx === -1) return { success: false, error: 'Card not in lost pile' };

  const card = playerState.lost.splice(idx, 1)[0];
  playerState.hand.push(card);

  return { success: true, card, message: `${card.name} 已复活并回到手牌！` };
}

module.exports = {
  createFieldCharacter,
  applyDamage,
  processAttack,
  processHunterDeath,
  processWitchDeath,
  processWitchPoison,
  processSeerDeploy,
  processShieldCard,
  processRevealCard,
  processReviveAllyCard,
  executeRevive,
};
