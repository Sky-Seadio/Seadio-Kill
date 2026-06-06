const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { Matchmaker, GameRoom } = require('./room');
const { DECK } = require('./data');
const logic = require('./logic');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const matchmaker = new Matchmaker();

app.use(express.static(path.join(__dirname, '../client')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', game: 'Seadio Kill' });
});

function getPlayerSocket(playerId) {
  return io.sockets.sockets.get(playerId);
}

function emitToRoom(room, event, data) {
  for (const pid of room.playerIds) {
    const s = getPlayerSocket(pid);
    if (s) s.emit(event, data);
  }
}

function emitToPlayer(playerId, event, data) {
  const s = getPlayerSocket(playerId);
  if (s) s.emit(event, data);
}

/**
 * Start a game between two players
 */
function startGame(room, player1, player2) {
  const s1 = getPlayerSocket(player1);
  const s2 = getPlayerSocket(player2);
  if (s1) s1.join(room.id);
  if (s2) s2.join(room.id);

  // Send game start
  for (const pid of room.playerIds) {
    emitToPlayer(pid, 'game_start', {
      roomId: room.id,
      yourHand: room.players[pid].hand.map(c => ({
        id: c.id, type: c.type, category: c.category,
        name: c.name, hp: c.hp, atk: c.atk,
        skill: c.skill, skillCard: c.skillCard,
      })),
      opponentHandCount: room.getOpponent(pid).hand.length,
      deck: DECK.map(c => ({ type: c.type, name: c.name, category: c.category })),
    });
  }

  room.round = 1;
  room.phase = 'deploy';
  emitToRoom(room, 'room_joined', { roomId: room.id });
  emitToRoom(room, 'round_start', { round: 1, phase: 'deploy' });
}

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // === MATCHMAKING ===
  socket.on('join_queue', () => {
    console.log(`${socket.id} joined queue`);
    const match = matchmaker.addPlayer(socket.id);

    if (match) {
      const { room, player1, player2 } = match;
      startGame(room, player1, player2);
    } else {
      socket.emit('queue_joined', { message: 'Waiting for opponent...' });
    }
  });

  // === CREATE ROOM ===
  socket.on('create_room', () => {
    console.log(`${socket.id} creating room`);
    const result = matchmaker.createRoom(socket.id);

    if (result) {
      socket.emit('room_created', { roomCode: result.roomCode });
    } else {
      socket.emit('error_msg', { message: '无法创建房间，你可能已在其他房间中' });
    }
  });

  // === JOIN ROOM ===
  socket.on('join_room', ({ roomCode }) => {
    console.log(`${socket.id} joining room ${roomCode}`);
    const match = matchmaker.joinRoom(socket.id, roomCode);

    if (match) {
      const { room, player1, player2 } = match;
      startGame(room, player1, player2);
    } else {
      socket.emit('error_msg', { message: '房间不存在或已满' });
    }
  });

  // === CANCEL ROOM ===
  socket.on('cancel_room', () => {
    const code = matchmaker.cancelRoom(socket.id);
    if (code) {
      socket.emit('room_cancelled', {});
    }
  });

  // === DEPLOY PHASE ===
  socket.on('deploy_card', ({ cardId }) => {
    const room = matchmaker.getRoom(socket.id);
    if (!room || room.phase !== 'deploy') {
      socket.emit('error_msg', { message: 'Cannot deploy now' });
      return;
    }

    const result = room.deployCard(socket.id, cardId);
    if (!result.success) {
      socket.emit('error_msg', { message: result.error });
      return;
    }

    // Notify player of successful deploy
    socket.emit('deploy_success', { cardId });

    // Check if both players have deployed (or skipped)
    const bothDeployed = room.playerIds.every(pid =>
      room.currentRound.deployments[pid] !== undefined
    );

    if (bothDeployed) {
      // Reveal phase
      room.phase = 'reveal';
      const reveals = room.reveal();

      for (const pid of room.playerIds) {
        emitToPlayer(pid, 'cards_revealed', {
          yourCard: reveals[pid],
          opponentCard: reveals[room.getOpponentId(pid)],
        });
      }

      // Move to RPS phase
      room.phase = 'rps';
      emitToRoom(room, 'rps_start', { message: '石头剪刀布！' });
    }
  });

  // === SKIP DEPLOY ===
  socket.on('skip_deploy', () => {
    const room = matchmaker.getRoom(socket.id);
    if (!room || room.phase !== 'deploy') {
      socket.emit('error_msg', { message: 'Cannot skip now' });
      return;
    }

    // Mark as deployed with null (skip)
    room.currentRound.deployments[socket.id] = null;
    socket.emit('deploy_success', { cardId: null });

    // Check if both players have deployed
    const bothDeployed = room.playerIds.every(pid =>
      room.currentRound.deployments[pid] !== undefined
    );

    if (bothDeployed) {
      // Reveal phase
      room.phase = 'reveal';
      const reveals = room.reveal();

      for (const pid of room.playerIds) {
        emitToPlayer(pid, 'cards_revealed', {
          yourCard: reveals[pid],
          opponentCard: reveals[room.getOpponentId(pid)],
        });
      }

      // Move to RPS phase
      room.phase = 'rps';
      emitToRoom(room, 'rps_start', { message: '石头剪刀布！' });
    }
  });

  // === RPS PHASE ===
  socket.on('rps_choice', ({ choice }) => {
    const room = matchmaker.getRoom(socket.id);
    if (!room || room.phase !== 'rps') {
      socket.emit('error_msg', { message: 'Cannot do RPS now' });
      return;
    }

    if (!['rock', 'scissors', 'paper'].includes(choice)) {
      socket.emit('error_msg', { message: 'Invalid choice' });
      return;
    }

    const result = room.makeRPSChoice(socket.id, choice);

    if (!result.ready) {
      // Notify opponent that this player is ready
      emitToPlayer(room.getOpponentId(socket.id), 'opponent_rps_ready', {});
      return;
    }

    if (result.result === 'draw') {
      emitToRoom(room, 'rps_result', { result: 'draw' });
      // RPS again
      emitToRoom(room, 'rps_start', { message: '平局！再来一次！' });
      return;
    }

    // We have a winner
    emitToRoom(room, 'rps_result', {
      result: 'win',
      winner: result.winner,
      loser: room.getOpponentId(result.winner),
    });

    room.phase = 'action';
    emitToPlayer(result.winner, 'your_turn', {
      actions: ['attack', 'skill', 'swap'],
      message: '你的回合！选择行动：攻击 / 出技能牌 / 换角色',
    });
    emitToPlayer(room.getOpponentId(result.winner), 'opponent_turn', {
      message: '对方回合中...',
    });
  });

  // === ACTION PHASE ===
  socket.on('action', ({ type, cardId, targetId }) => {
    const room = matchmaker.getRoom(socket.id);
    if (!room || room.phase !== 'action') {
      socket.emit('error_msg', { message: 'Cannot act now' });
      return;
    }

    const player = room.getPlayer(socket.id);
    const opponent = room.getOpponent(socket.id);

    if (type === 'attack') {
      if (!player.field || player.field.currentHp <= 0) {
        socket.emit('error_msg', { message: 'No character on field to attack with' });
        return;
      }
      if (!opponent.field || opponent.field.currentHp <= 0) {
        socket.emit('error_msg', { message: 'Opponent has no character on field' });
        return;
      }

      const attackResult = logic.processAttack(player.field, opponent.field, opponent);

      // Emit attack result
      emitToRoom(room, 'action_result', {
        type: 'attack',
        attacker: socket.id,
        result: attackResult,
      });

      // Handle deaths
      if (attackResult.dmgResult && attackResult.dmgResult.died) {
        handleCharacterDeath(room, room.getOpponentId(socket.id), opponent);
      }

      endRound(room);

    } else if (type === 'skill') {
      // Play a skill card from hand
      const card = player.hand.find(c => c.id === cardId);
      if (!card) {
        socket.emit('error_msg', { message: 'Card not in hand' });
        return;
      }

      let skillResult;

      if (card.skillCard === 'shield') {
        // Guardian shield - protect self
        skillResult = logic.processShieldCard(player);
        player.hand = player.hand.filter(c => c.id !== cardId);
        emitToRoom(room, 'action_result', { type: 'skill', playerId: socket.id, result: skillResult });

      } else if (card.skillCard === 'reveal') {
        // Seer reveal - see opponent's hand
        skillResult = logic.processRevealCard(opponent);
        player.hand = player.hand.filter(c => c.id !== cardId);
        emitToPlayer(socket.id, 'action_result', { type: 'skill', playerId: socket.id, result: skillResult });

      } else if (card.skillCard === 'revive_ally') {
        // Witch revive - need target selection
        skillResult = logic.processReviveAllyCard(player);
        if (!skillResult.success) {
          socket.emit('error_msg', { message: skillResult.message });
          return;
        }
        // Send lost cards list for selection
        socket.emit('select_revive_target', {
          lost: skillResult.lost,
          cardId: cardId, // the witch card being used
        });
        return; // Wait for target selection
      } else {
        socket.emit('error_msg', { message: 'This card cannot be used as a skill' });
        return;
      }

      endRound(room);

    } else if (type === 'swap') {
      // Swap field character
      const newCard = player.hand.find(c => c.id === cardId && (c.category === 'character' || c.category === 'dual'));
      if (!newCard) {
        socket.emit('error_msg', { message: 'Card not in hand or not a character' });
        return;
      }

      // Move old field character to lost pile (if exists)
      if (player.field) {
        player.lost.push({
          id: player.field.id,
          type: player.field.type,
          name: player.field.name,
          category: 'character',
          hp: player.field.maxHp,
          atk: player.field.atk,
          skill: player.field.skill,
          skillCard: null,
        });
      }

      player.hand = player.hand.filter(c => c.id !== cardId);
      player.field = logic.createFieldCharacter(newCard);

      // If new character is seer, activate dodge
      logic.processSeerDeploy(player.field, player);

      emitToRoom(room, 'action_result', {
        type: 'swap',
        playerId: socket.id,
        newCharacter: {
          type: player.field.type,
          name: player.field.name,
          hp: player.field.currentHp,
          maxHp: player.field.maxHp,
        },
      });

      endRound(room);
    }
  });

  // === WITCH POISON (special action) ===
  socket.on('witch_poison', () => {
    const room = matchmaker.getRoom(socket.id);
    if (!room || room.phase !== 'action') return;

    // Must be your turn
    if (room.currentRound.rpsWinner !== socket.id) {
      socket.emit('error_msg', { message: '不是你的回合' });
      return;
    }

    const player = room.getPlayer(socket.id);
    const opponent = room.getOpponent(socket.id);

    if (!player.field || player.field.type !== 'witch') {
      socket.emit('error_msg', { message: '需要女巫在场上才能使用毒药' });
      return;
    }

    if (!opponent.field || opponent.field.currentHp <= 0) {
      socket.emit('error_msg', { message: '对手没有场上角色' });
      return;
    }

    const poisonResult = logic.processWitchPoison(opponent.field, opponent);

    emitToRoom(room, 'action_result', {
      type: 'witch_poison',
      playerId: socket.id,
      result: poisonResult,
    });

    if (poisonResult.success) {
      handleCharacterDeath(room, room.getOpponentId(socket.id), opponent);
    }

    endRound(room);
  });

  // === REVIVE TARGET SELECTION ===
  socket.on('select_revive_target', ({ cardId, targetCardId }) => {
    const room = matchmaker.getRoom(socket.id);
    if (!room) return;

    const player = room.getPlayer(socket.id);

    // Remove the witch skill card from hand
    player.hand = player.hand.filter(c => c.id !== cardId);

    // Execute revive
    const result = logic.executeRevive(player, targetCardId);
    if (result.success) {
      emitToRoom(room, 'action_result', {
        type: 'skill',
        playerId: socket.id,
        result: { type: 'revive', message: result.message, card: { name: result.card.name, type: result.card.type } },
      });
    }

    endRound(room);
  });

  // === DISCONNECT ===
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    const result = matchmaker.removePlayer(socket.id);
    if (result && result.room) {
      emitToPlayer(result.room.getOpponentId(socket.id), 'game_over', {
        winner: result.room.getOpponentId(socket.id),
        reason: 'opponent_disconnected',
      });
    }
  });
});

/**
 * Handle a character dying — triggers death skills, moves to lost pile
 */
function handleCharacterDeath(room, playerId, playerState) {
  const deadChar = playerState.field;

  // Hunter martyrdom
  if (deadChar.skill === 'martyrdom') {
    const opponent = room.getOpponent(playerId);
    if (opponent.field && opponent.field.currentHp > 0) {
      // Check guardian shield
      if (opponent.shieldActive) {
        opponent.shieldActive = false;
        emitToRoom(room, 'death_skill', {
          playerId,
          skill: 'martyrdom',
          message: '猎人发动【殉职】，但被守卫之盾抵挡！',
        });
      } else {
        const martyrdomDmg = logic.applyDamage(opponent.field, 10);
        emitToRoom(room, 'death_skill', {
          playerId,
          skill: 'martyrdom',
          damage: 10,
          targetHp: opponent.field.currentHp,
          message: `猎人发动【殉职】！对 ${opponent.field.name} 造成 10 点伤害！`,
        });
        if (martyrdomDmg.died) {
          handleCharacterDeath(room, room.getOpponentId(playerId), opponent);
        }
      }
    }
  }

  // Witch self-revive
  if (deadChar.skill === 'revive_self' && !deadChar.reviveUsed) {
    deadChar.reviveUsed = true;
    deadChar.currentHp = deadChar.maxHp;
    emitToRoom(room, 'death_skill', {
      playerId,
      skill: 'revive_self',
      message: `女巫发动【复活】！满血复活！`,
      hp: deadChar.currentHp,
    });
    return; // Don't move to lost pile
  }

  // Move to lost pile
  playerState.lost.push({
    id: deadChar.id,
    type: deadChar.type,
    name: deadChar.name,
    category: 'character',
    hp: deadChar.maxHp,
    atk: deadChar.atk,
    skill: deadChar.skill,
    skillCard: null,
  });
  playerState.field = null;

  // Clear buffs
  playerState.dodgeActive = false;
  playerState.shieldActive = false;
}

/**
 * End current round, check game over, start next round
 */
function endRound(room) {
  // Check game over
  const gameOver = room.checkGameOver();
  if (gameOver.gameOver) {
    emitToRoom(room, 'game_over', {
      winner: gameOver.winner,
      loser: gameOver.loser,
      reason: 'all_characters_lost',
    });
    return;
  }

  // Reset round state
  room.currentRound = {
    deployments: {},
    rpsChoices: {},
    rpsWinner: null,
    action: null,
    actionResolved: false,
  };
  room.round++;
  room.phase = 'deploy';

  emitToRoom(room, 'round_start', { round: room.round, phase: 'deploy' });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Seadio Kill server running on http://localhost:${PORT}`);
});
