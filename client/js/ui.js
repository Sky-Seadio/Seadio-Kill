/**
 * UI renderer — updates DOM based on game state
 */
class UIRenderer {
  constructor() {
    // Cache DOM elements
    this.screens = {
      lobby: document.getElementById('screen-lobby'),
      game: document.getElementById('screen-game'),
      gameover: document.getElementById('screen-gameover'),
    };

    this.elements = {
      joinBtn: document.getElementById('btn-join-queue'),
      queueStatus: document.getElementById('queue-status'),
      handCards: document.getElementById('hand-cards'),
      playerFieldCard: document.getElementById('player-field-card'),
      opponentFieldCard: document.getElementById('opponent-field-card'),
      playerFieldStats: document.getElementById('player-field-stats'),
      opponentHandCount: document.getElementById('opponent-hand-count'),
      battleLog: document.getElementById('battle-log'),
      rpsSection: document.getElementById('rps-section'),
      actionSection: document.getElementById('action-section'),
      reviveSection: document.getElementById('revive-section'),
      reviveTargets: document.getElementById('revive-targets'),
      gameoverTitle: document.getElementById('gameover-title'),
      gameoverReason: document.getElementById('gameover-reason'),
      playAgainBtn: document.getElementById('btn-play-again'),
    };
  }

  // === SCREEN MANAGEMENT ===
  showScreen(name) {
    Object.values(this.screens).forEach(s => {
      s.classList.remove('active');
      s.classList.add('hidden');
    });
    if (this.screens[name]) {
      this.screens[name].classList.remove('hidden');
      this.screens[name].classList.add('active');
    }
  }

  // === LOBBY ===
  showQueueStatus(show) {
    this.elements.queueStatus.classList.toggle('hidden', !show);
    this.elements.joinBtn.classList.toggle('hidden', show);
  }

  // === HAND CARDS ===
  renderHand(cards, onCardClick) {
    this.elements.handCards.innerHTML = '';

    cards.forEach(card => {
      const el = document.createElement('div');
      el.className = `hand-card ${card.category}`;
      el.dataset.cardId = card.id;

      const stats = CHARACTER_STATS[card.type];
      const isDual = card.category === 'dual';

      el.innerHTML = `
        <span class="card-type-badge">${isDual ? '双用' : card.category === 'character' ? '角色' : '技能'}</span>
        <span class="card-name">${card.name}</span>
        <div class="card-stats">
          <span class="hp">♥${stats.hp}</span>
          <span class="atk">⚔${stats.atk}</span>
        </div>
        ${card.skill ? `<div class="card-skill">【${SKILL_DESC[card.skill]?.name || card.skill}】</div>` : ''}
        ${card.skillCard ? `<div class="card-skill">技能：${SKILL_EFFECTS[card.skillCard]?.name || card.skillCard}</div>` : ''}
      `;

      el.addEventListener('click', () => onCardClick(card));
      this.elements.handCards.appendChild(el);
    });
  }

  selectCard(cardId) {
    document.querySelectorAll('.hand-card').forEach(el => {
      el.classList.toggle('selected', el.dataset.cardId === cardId);
    });
  }

  clearCardSelection() {
    document.querySelectorAll('.hand-card').forEach(el => {
      el.classList.remove('selected');
    });
  }

  // === FIELD CARDS ===
  renderFieldCard(elementId, character, faceDown = false) {
    const el = this.elements[elementId];
    if (!character) {
      el.className = 'field-card empty';
      el.innerHTML = '<span class="card-placeholder">?</span>';
      return;
    }

    if (faceDown) {
      el.className = 'field-card face-down';
      el.innerHTML = '';
    } else {
      el.className = 'field-card face-up';
      el.innerHTML = `
        <span class="card-name">${character.name}</span>
        <span class="card-hp">♥ ${character.currentHp}/${character.maxHp}</span>
        <span class="card-atk">⚔ ${character.atk}</span>
        ${character.skill ? `<span class="card-skill" style="font-size:0.65rem;color:#a78bfa;">${SKILL_DESC[character.skill]?.name || ''}</span>` : ''}
      `;
    }
  }

  renderMyField(character) {
    this.renderFieldCard('player-field-card', character);
    // Also update stats below
    if (character) {
      this.elements.playerFieldStats.innerHTML = `
        <span style="color:#e94560">♥${character.currentHp}/${character.maxHp}</span>
        <span style="color:#f5a623">⚔${character.atk}</span>
      `;
    } else {
      this.elements.playerFieldStats.innerHTML = '';
    }
  }

  renderOpponentField(character, faceDown = false) {
    this.renderFieldCard('opponent-field-card', character, faceDown);
  }

  updateOpponentHandCount(count) {
    this.elements.opponentHandCount.textContent = count;
  }

  // === BATTLE LOG ===
  addLog(message, important = false) {
    const entry = document.createElement('p');
    entry.className = `log-entry${important ? ' important' : ''}`;
    entry.textContent = message;
    this.elements.battleLog.appendChild(entry);
    this.elements.battleLog.scrollTop = this.elements.battleLog.scrollHeight;
  }

  clearLog() {
    this.elements.battleLog.innerHTML = '';
  }

  // === RPS ===
  showRPS(show) {
    this.elements.rpsSection.classList.toggle('hidden', !show);
  }

  highlightRPS(choice) {
    document.querySelectorAll('.rps-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.choice === choice);
    });
  }

  clearRPSHighlight() {
    document.querySelectorAll('.rps-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
  }

  // === ACTIONS ===
  showActions(show, availableActions = []) {
    this.elements.actionSection.classList.toggle('hidden', !show);
    if (show) {
      document.querySelectorAll('.action-btn').forEach(btn => {
        const action = btn.dataset.action;
        btn.disabled = !availableActions.includes(action);
        btn.style.opacity = availableActions.includes(action) ? '1' : '0.4';
      });
    }
  }

  // === TARGET SELECTION ===
  showReviveTarget(targets, onSelect) {
    this.elements.reviveSection.classList.remove('hidden');
    this.elements.reviveTargets.innerHTML = '';
    targets.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'target-btn';
      btn.textContent = t.name;
      btn.addEventListener('click', () => onSelect(t));
      this.elements.reviveTargets.appendChild(btn);
    });
  }

  hideReviveTarget() {
    this.elements.reviveSection.classList.add('hidden');
  }

  // === GAME OVER ===
  showGameOver(isWin, reason) {
    this.showScreen('gameover');
    this.elements.gameoverTitle.textContent = isWin ? '🎉 你赢了！' : '💀 你输了';
    this.elements.gameoverTitle.className = `gameover-title ${isWin ? 'win' : 'lose'}`;

    const reasonTexts = {
      all_characters_lost: '对方所有角色牌已被消耗',
      opponent_disconnected: '对手断开连接',
    };
    this.elements.gameoverReason.textContent = reasonTexts[reason] || reason;
  }

  // === HIDE ALL INTERACTIVE SECTIONS ===
  hideAllSections() {
    this.showRPS(false);
    this.showActions(false);
    this.hideReviveTarget();
  }
}

const ui = new UIRenderer();
