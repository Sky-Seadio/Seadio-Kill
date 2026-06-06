/**
 * Main entry point — wires socket events to UI and game state
 */
(function () {
  // Connect socket
  socketManager.connect();

  // === LOBBY ===
  ui.elements.joinBtn.addEventListener('click', () => {
    socketManager.joinQueue();
    ui.showQueueStatus(true);
  });

  // Create room
  ui.elements.createRoomBtn.addEventListener('click', () => {
    socketManager.createRoom();
  });

  // Show join room input
  ui.elements.showJoinBtn.addEventListener('click', () => {
    ui.showJoinRoomInput();
  });

  // Join room
  ui.elements.joinRoomBtn.addEventListener('click', () => {
    const code = ui.elements.roomInput.value.trim();
    if (code.length === 6) {
      socketManager.joinRoom(code);
    } else {
      ui.addLog('请输入6位房间号');
    }
  });

  // Cancel room
  ui.elements.cancelRoomBtn.addEventListener('click', () => {
    socketManager.cancelRoom();
    ui.hideRoomInfo();
  });

  // Cancel join
  ui.elements.cancelJoinBtn.addEventListener('click', () => {
    ui.hideRoomInfo();
  });

  socketManager.on('queue_joined', () => {
    ui.showQueueStatus(true);
  });

  // Room created
  socketManager.on('room_created', (data) => {
    ui.showRoomCode(data.roomCode);
  });

  // Room cancelled
  socketManager.on('room_cancelled', () => {
    ui.hideRoomInfo();
  });

  // Room joined (game starting)
  socketManager.on('room_joined', () => {
    ui.hideRoomInfo();
  });

  // Close deck modal
  ui.elements.closeDeckBtn.addEventListener('click', () => {
    ui.hideDeckModal();
  });

  // === GAME START ===
  socketManager.on('game_start', (data) => {
    gameState.setGameStart(data);
    ui.showScreen('game');
    ui.clearLog();
    ui.addLog('游戏开始！从牌库中各抽 6 张牌。', true);
    ui.renderHand(gameState.myHand, onHandCardClick);
    ui.renderMyField(null);
    ui.renderOpponentField(null);
    ui.updateOpponentHandCount(data.opponentHandCount);
    ui.hideAllSections();

    // Show deck composition
    if (data.deck) {
      ui.showDeckModal(data.deck);
    }
  });

  // === ROUND START ===
  socketManager.on('round_start', (data) => {
    gameState.round = data.round;
    gameState.phase = 'deploy';
    gameState.revealedCard = null;
    ui.hideAllSections();
    ui.clearCardSelection();
    ui.addLog(`--- 第 ${data.round} 回合 ---`, true);
    ui.addLog('请选择一张牌暗置到场上。');
    ui.renderOpponentField(null); // Reset opponent field display
    ui.renderHand(gameState.myHand, onHandCardClick);
  });

  // === DEPLOY ===
  function onHandCardClick(card) {
    if (gameState.phase !== 'deploy') return;

    // If player has no field character, must deploy a character/dual card
    if (!gameState.myField) {
      if (card.category !== 'character' && card.category !== 'dual') {
        ui.addLog('你还没有场上角色，请先部署一张角色牌。');
        return;
      }
    }

    ui.selectCard(card.id);
    gameState.revealedCard = card;
    socketManager.deployCard(card.id);
  }

  socketManager.on('deploy_success', (data) => {
    const card = gameState.revealedCard;
    if (!card) return;

    if (!gameState.myField && (card.category === 'character' || card.category === 'dual')) {
      gameState.addCardToField(card);
      ui.renderMyField(gameState.myField);
    }
    gameState.removeFromHand(card.id);
    ui.renderHand(gameState.myHand, onHandCardClick);
    ui.addLog(`你暗置了一张牌。`);
    ui.clearCardSelection();
  });

  // === REVEAL ===
  socketManager.on('cards_revealed', (data) => {
    gameState.phase = 'reveal';

    // Show opponent's deployed card
    if (data.opponentCard) {
      ui.addLog(`对手暗置了：${data.opponentCard.name}`);

      // If opponent deployed a character, update their field
      if (data.opponentCard.category === 'character' || data.opponentCard.category === 'dual') {
        const stats = CHARACTER_STATS[data.opponentCard.type];
        gameState.opponentField = {
          ...data.opponentCard,
          maxHp: stats.hp,
          currentHp: stats.hp,
          atk: stats.atk,
        };
        ui.renderOpponentField(gameState.opponentField);
      }
    }
  });

  // === RPS ===
  socketManager.on('rps_start', (data) => {
    gameState.phase = 'rps';
    ui.hideAllSections();
    ui.showRPS(true);
    ui.addLog(data.message || '石头剪刀布！');
  });

  // RPS button clicks
  document.querySelectorAll('.rps-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (gameState.phase !== 'rps') return;
      const choice = btn.dataset.choice;
      socketManager.rpsChoice(choice);
      ui.highlightRPS(choice);
      ui.addLog(`你选择了 ${choice === 'rock' ? '✊石头' : choice === 'scissors' ? '✌️剪刀' : '🖐️布'}`);
    });
  });

  socketManager.on('opponent_rps_ready', () => {
    ui.addLog('对手已选择，等待揭晓...');
  });

  socketManager.on('rps_result', (data) => {
    if (data.result === 'draw') {
      ui.addLog('平局！重新来过！');
      ui.clearRPSHighlight();
      return;
    }

    const isWinner = data.winner === socketManager.socket.id;
    ui.addLog(isWinner ? '🎉 你赢了石头剪刀布！' : '😤 对手赢了石头剪刀布...', !isWinner);
    ui.clearRPSHighlight();
  });

  // === ACTION PHASE ===
  socketManager.on('your_turn', (data) => {
    gameState.phase = 'action';
    gameState.isMyTurn = true;
    ui.hideAllSections();

    // Determine available actions
    const actions = [];
    if (gameState.myField && gameState.myField.currentHp > 0) {
      actions.push('attack');
      // Witch poison
      if (gameState.myField.type === 'witch') {
        actions.push('poison');
      }
    }
    if (gameState.hasSkillCards()) {
      actions.push('skill');
    }
    if (gameState.getCharacterCards().length > 0) {
      actions.push('swap');
    }

    ui.showActions(true, actions);
    ui.addLog(data.message || '你的回合！选择行动。', true);
  });

  socketManager.on('opponent_turn', (data) => {
    gameState.isMyTurn = false;
    ui.hideAllSections();
    ui.addLog(data.message || '对方回合中...');
  });

  // Action button clicks
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (gameState.phase !== 'action' || !gameState.isMyTurn) return;

      const action = btn.dataset.action;

      if (action === 'attack') {
        socketManager.performAction('attack');
        ui.addLog('你发动了攻击！');
        ui.showActions(false);

      } else if (action === 'skill') {
        // Show skill cards for selection
        const skillCards = gameState.myHand.filter(c => c.skillCard);
        if (skillCards.length === 0) {
          ui.addLog('没有可用的技能牌。');
          return;
        }
        // Render hand showing only skill cards as selectable
        ui.addLog('选择一张技能牌使用：');
        renderSkillCardSelection(skillCards);

      } else if (action === 'swap') {
        // Show character cards for swap selection
        const charCards = gameState.getCharacterCards();
        if (charCards.length === 0) {
          ui.addLog('没有可替换的角色牌。');
          return;
        }
        ui.addLog('选择一张角色牌替换场上角色：');
        renderSwapCardSelection(charCards);

      } else if (action === 'poison') {
        // Witch poison - send directly (target is opponent's field character)
        socketManager.witchPoison();
        ui.addLog('你使用了毒药！');
        ui.showActions(false);
      }
    });
  });

  function renderSkillCardSelection(cards) {
    ui.elements.handCards.innerHTML = '';
    cards.forEach(card => {
      const el = document.createElement('div');
      el.className = `hand-card ${card.category} selected`;
      el.innerHTML = `
        <span class="card-name">${card.name}</span>
        <div class="card-skill">技能：${SKILL_EFFECTS[card.skillCard]?.name || card.skillCard}</div>
      `;
      el.addEventListener('click', () => {
        socketManager.performAction('skill', card.id);
        ui.addLog(`你使用了 ${card.name} 的技能！`);
        ui.showActions(false);
        ui.renderHand(gameState.myHand, onHandCardClick);
      });
      ui.elements.handCards.appendChild(el);
    });
  }

  function renderSwapCardSelection(cards) {
    ui.elements.handCards.innerHTML = '';
    cards.forEach(card => {
      const el = document.createElement('div');
      el.className = `hand-card ${card.category} selected`;
      const stats = CHARACTER_STATS[card.type];
      el.innerHTML = `
        <span class="card-name">${card.name}</span>
        <div class="card-stats">
          <span class="hp">♥${stats.hp}</span>
          <span class="atk">⚔${stats.atk}</span>
        </div>
      `;
      el.addEventListener('click', () => {
        socketManager.performAction('swap', card.id);
        ui.addLog(`你将场上角色替换为 ${card.name}。`);
        ui.showActions(false);
        ui.renderHand(gameState.myHand, onHandCardClick);
      });
      ui.elements.handCards.appendChild(el);
    });
  }

  // === ACTION RESULTS ===
  socketManager.on('action_result', (data) => {
    if (data.type === 'attack') {
      const result = data.result;
      const isAttacker = data.attacker === socketManager.socket.id;

      ui.addLog(`${CHARACTER_STATS[result.attacker]?.name || result.attacker} 攻击了 ${CHARACTER_STATS[result.defender]?.name || result.defender}！`);

      if (result.damage > 0) {
        ui.addLog(`造成 ${result.damage} 点伤害！`);
      }

      result.effects.forEach(effect => {
        ui.addLog(effect.message, effect.type === 'death');
      });

      // Update field displays
      updateFieldDisplays();

    } else if (data.type === 'skill') {
      ui.addLog(data.result.message || '技能发动！', true);

      if (data.result.type === 'shield') {
        // Guardian shield activated
      } else if (data.result.type === 'reveal') {
        // Seer reveal - show opponent's hand
        ui.addLog(`对方手牌：${data.result.hand.map(c => c.name).join('、')}`, true);
      } else if (data.result.type === 'revive') {
        ui.addLog(`${data.result.card.name} 已复活！`);
      }
    } else if (data.type === 'swap') {
      const isMe = data.playerId === socketManager.socket.id;
      ui.addLog(`${isMe ? '你' : '对手'} 换上了 ${data.newCharacter.name}！`);

      if (isMe) {
        const stats = CHARACTER_STATS[data.newCharacter.type];
        gameState.myField = {
          type: data.newCharacter.type,
          name: data.newCharacter.name,
          maxHp: data.newCharacter.maxHp || stats.hp,
          currentHp: data.newCharacter.hp || stats.hp,
          atk: data.newCharacter.atk || stats.atk,
        };
        ui.renderMyField(gameState.myField);
      }
    } else if (data.type === 'witch_poison') {
      ui.addLog(data.result.message || '毒药发动！', true);
      updateFieldDisplays();
    }

    // Restore hand display after action
    setTimeout(() => {
      ui.renderHand(gameState.myHand, onHandCardClick);
    }, 500);
  });

  // === DEATH SKILLS ===
  socketManager.on('death_skill', (data) => {
    ui.addLog(data.message, true);
    updateFieldDisplays();
  });

  // === REVIVE TARGET SELECTION ===
  socketManager.on('select_revive_target', (data) => {
    ui.showReviveTarget(data.lost, (target) => {
      socketManager.selectReviveTarget(data.cardId, target.id);
      ui.hideReviveTarget();
    });
  });

  // === GAME OVER ===
  socketManager.on('game_over', (data) => {
    const isWin = data.winner === socketManager.socket.id;
    gameState.phase = 'gameover';
    ui.showGameOver(isWin, data.reason);
  });

  // === ERRORS ===
  socketManager.on('error_msg', (data) => {
    ui.addLog(`⚠️ ${data.message}`);
  });

  // === HELPERS ===
  function updateFieldDisplays() {
    // This is a simplified version — in a full implementation,
    // the server would send updated state after each action
    if (gameState.myField) {
      ui.renderMyField(gameState.myField);
    }
  }

  // === PLAY AGAIN ===
  ui.elements.playAgainBtn.addEventListener('click', () => {
    gameState.reset();
    ui.showScreen('lobby');
    ui.showQueueStatus(false);
    ui.clearLog();
  });
})();
