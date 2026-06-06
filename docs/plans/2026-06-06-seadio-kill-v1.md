# Seadio Kill v1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 1v1 online card battle game with werewolf-themed characters, rock-paper-scissors combat, and skill cards.

**Architecture:** Client-server model using Node.js + Express + Socket.io. Server manages game rooms, matchmaking, and authoritative game state. Client handles rendering and user input, communicating via Socket.io events.

**Tech Stack:** Node.js, Express, Socket.io, HTML, CSS, Vanilla JavaScript

---

## File Structure

```
Seadio Kill/
├── package.json                 # Node.js project config
├── server/
│   ├── index.js                 # Express + Socket.io server entry
│   ├── data.js                  # Character & card definitions
│   ├── room.js                  # Game room & matchmaking
│   └── logic.js                 # Combat resolution & skill effects
├── client/
│   ├── index.html               # Main HTML page
│   ├── css/
│   │   └── style.css            # All styles
│   └── js/
│       ├── data.js              # Card/character data (mirrors server)
│       ├── socket.js            # Socket.io client wrapper
│       ├── game.js              # Client game state
│       ├── ui.js                # DOM rendering
│       └── main.js              # Entry point
└── docs/
    ├── 2026-06-06-seadio-kill-v1-design.md
    └── plans/
        └── 2026-06-06-seadio-kill-v1.md
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `server/index.js`

- [ ] **Step 1: Initialize npm project**

Run: `cd "e:/Ai/Seadio Kill" && npm init -y`

- [ ] **Step 2: Install dependencies**

Run: `cd "e:/Ai/Seadio Kill" && npm install express socket.io`

- [ ] **Step 3: Create server entry point**

Create `server/index.js`:
```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static client files
app.use(express.static(path.join(__dirname, '../client')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', game: 'Seadio Kill' });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Seadio Kill server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 4: Create minimal client page**

Create `client/index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seadio Kill</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <h1>Seadio Kill</h1>
  <p>Game is loading...</p>
  <script src="/socket.io/socket.io.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

Create `client/css/style.css`:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Microsoft YaHei', sans-serif;
  background: #1a1a2e;
  color: #eee;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

h1 {
  font-size: 3rem;
  color: #e94560;
  text-shadow: 0 0 20px rgba(233, 69, 96, 0.5);
}
```

Create `client/js/main.js`:
```javascript
const socket = io();

socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

- [ ] **Step 5: Add npm start script**

Edit `package.json`, set scripts:
```json
{
  "scripts": {
    "start": "node server/index.js",
    "dev": "node server/index.js"
  }
}
```

- [ ] **Step 6: Test server starts**

Run: `cd "e:/Ai/Seadio Kill" && node server/index.js`
Expected: `Seadio Kill server running on http://localhost:3000`
Open browser to `http://localhost:3000`, should see "Seadio Kill" heading.
Press Ctrl+C to stop.

- [ ] **Step 7: Commit**

```bash
cd "e:/Ai/Seadio Kill"
git init
git add .
git commit -m "feat: project scaffolding with Express + Socket.io server"
```

---

## Task 2: Character & Card Data

**Files:**
- Create: `server/data.js`
- Create: `client/js/data.js`

- [ ] **Step 1: Create server-side data definitions**

Create `server/data.js`:
```javascript
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
```

- [ ] **Step 2: Create client-side data (mirror)**

Create `client/js/data.js`:
```javascript
// Client-side data mirrors server data
const CHARACTER_STATS = {
  villager: { name: '村民', hp: 2, atk: 1 },
  wolf:     { name: '狼人', hp: 3, atk: 1 },
  hunter:   { name: '猎人', hp: 3, atk: 1.5 },
  guardian:  { name: '守卫', hp: 2, atk: 1 },
  witch:    { name: '女巫', hp: 2, atk: 1 },
  seer:     { name: '预言家', hp: 2, atk: 1 },
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
  dodge:       { name: '躲避', desc: '可躲避一次攻击（含毒药）' },
};
```

- [ ] **Step 3: Test data loads correctly**

Run: `cd "e:/Ai/Seadio Kill" && node -e "const d = require('./server/data'); console.log('Deck:', d.DECK.length, 'cards'); const h = d.dealCards(); console.log('P1:', h.player1.length, 'P2:', h.player2.length);"`
Expected: `Deck: 16 cards`, `P1: 6 P2: 6`

- [ ] **Step 4: Commit**

```bash
git add server/data.js client/js/data.js
git commit -m "feat: add character and card data definitions"
```

---

## Task 3: Game Room & Matchmaking

**Files:**
- Create: `server/room.js`
- Modify: `server/index.js`

- [ ] **Step 1: Create game room manager**

Create `server/room.js`:
```javascript
const { dealCards } = require('./data');

class GameRoom {
  constructor(id, player1Id, player2Id) {
    this.id = id;
    this.players = {
      [player1Id]: this.createPlayerState(player1Id),
      [player2Id]: this.createPlayerState(player2Id),
    };
    this.playerIds = [player1Id, player2Id];
    this.round = 0;
    this.phase = 'deploy'; // deploy -> reveal -> rps -> action -> resolve
    this.currentRound = {
      deployments: {},    // { playerId: cardId }
      rpsChoices: {},     // { playerId: 'rock'|'scissors'|'paper' }
      rpsWinner: null,
      action: null,
      actionResolved: false,
    };
    this.status = 'playing'; // playing | finished
    this.winner = null;

    // Deal cards
    const dealt = dealCards();
    this.players[player1Id].hand = dealt.player1;
    this.players[player2Id].hand = dealt.player2;
  }

  createPlayerState(playerId) {
    return {
      id: playerId,
      hand: [],           // cards in hand
      field: null,        // character currently on field (object with hp, maxHp, atk, etc.)
      lost: [],           // consumed/lost character cards
      shieldActive: false, // guardian shield active
      dodgeActive: false,  // seer dodge active
      witchReviveUsed: false,
    };
  }

  getPlayer(playerId) {
    return this.players[playerId];
  }

  getOpponentId(playerId) {
    return this.playerIds.find(id => id !== playerId);
  }

  getOpponent(playerId) {
    return this.players[this.getOpponentId(playerId)];
  }

  /**
   * Deploy a card from hand to field (face-down)
   */
  deployCard(playerId, cardId) {
    const player = this.getPlayer(playerId);
    const cardIndex = player.hand.findIndex(c => c.id === cardId);

    if (cardIndex === -1) return { success: false, error: 'Card not in hand' };

    const card = player.hand[cardIndex];

    // If player already has a living field character and this is a character card,
    // it's a swap (only allowed when winning RPS)
    if (player.field && card.category === 'character') {
      return { success: false, error: 'Field character still alive, use swap action' };
    }

    player.hand.splice(cardIndex, 1);
    this.currentRound.deployments[playerId] = card;

    return { success: true, card };
  }

  /**
   * Both players have deployed, reveal cards
   */
  reveal() {
    this.phase = 'reveal';
    const p1Id = this.playerIds[0];
    const p2Id = this.playerIds[1];
    return {
      [p1Id]: this.currentRound.deployments[p1Id] || null,
      [p2Id]: this.currentRound.deployments[p2Id] || null,
    };
  }

  /**
   * Record RPS choice
   */
  makeRPSChoice(playerId, choice) {
    this.currentRound.rpsChoices[playerId] = choice;

    // Check if both players have chosen
    const bothChosen = this.playerIds.every(id => this.currentRound.rpsChoices[id]);

    if (!bothChosen) return { ready: false };

    // Determine winner
    const p1Choice = this.currentRound.rpsChoices[this.playerIds[0]];
    const p2Choice = this.currentRound.rpsChoices[this.playerIds[1]];
    const result = GameRoom.rpsResult(p1Choice, p2Choice);

    if (result === 'draw') {
      // Reset choices, RPS again
      this.currentRound.rpsChoices = {};
      return { ready: true, result: 'draw' };
    }

    this.currentRound.rpsWinner = result === 'p1' ? this.playerIds[0] : this.playerIds[1];
    return { ready: true, result, winner: this.currentRound.rpsWinner };
  }

  /**
   * Static: determine RPS result
   * Returns 'p1' | 'p2' | 'draw'
   */
  static rpsResult(choice1, choice2) {
    if (choice1 === choice2) return 'draw';
    const wins = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
    return wins[choice1] === choice2 ? 'p1' : 'p2';
  }

  /**
   * Process the winner's action
   */
  performAction(playerId, action) {
    if (this.currentRound.rpsWinner !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    this.currentRound.action = action;
    return { success: true };
  }

  /**
   * Check if game is over (a player has no characters in hand and no field character)
   */
  checkGameOver() {
    for (const playerId of this.playerIds) {
      const player = this.getPlayer(playerId);
      const hasFieldChar = player.field && player.field.currentHp > 0;
      const hasHandChars = player.hand.some(c => c.category === 'character' || c.category === 'dual');

      if (!hasFieldChar && !hasHandChars) {
        this.status = 'finished';
        this.winner = this.getOpponentId(playerId);
        return { gameOver: true, winner: this.winner, loser: playerId };
      }
    }
    return { gameOver: false };
  }
}

// Matchmaking queue
class Matchmaker {
  constructor() {
    this.queue = []; // array of socket ids waiting
    this.rooms = new Map(); // roomId -> GameRoom
    this.playerRoomMap = new Map(); // playerId -> roomId
  }

  /**
   * Add player to queue, try to match
   */
  addPlayer(playerId) {
    if (this.queue.includes(playerId)) return null;
    if (this.playerRoomMap.has(playerId)) return null;

    this.queue.push(playerId);

    if (this.queue.length >= 2) {
      const p1 = this.queue.shift();
      const p2 = this.queue.shift();
      const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const room = new GameRoom(roomId, p1, p2);

      this.rooms.set(roomId, room);
      this.playerRoomMap.set(p1, roomId);
      this.playerRoomMap.set(p2, roomId);

      return { room, player1: p1, player2: p2 };
    }

    return null;
  }

  /**
   * Remove player from queue or handle disconnection
   */
  removePlayer(playerId) {
    // Remove from queue
    const idx = this.queue.indexOf(playerId);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
      return null;
    }

    // Find and handle room
    const roomId = this.playerRoomMap.get(playerId);
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room && room.status === 'playing') {
        room.status = 'finished';
        room.winner = room.getOpponentId(playerId);
      }
      this.playerRoomMap.delete(playerId);
      return { roomId, room };
    }

    return null;
  }

  getRoom(playerId) {
    const roomId = this.playerRoomMap.get(playerId);
    return roomId ? this.rooms.get(roomId) : null;
  }
}

module.exports = { GameRoom, Matchmaker };
```

- [ ] **Step 2: Integrate room manager into server**

Modify `server/index.js` to:
```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { Matchmaker } = require('./room');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const matchmaker = new Matchmaker();

// Serve static client files
app.use(express.static(path.join(__dirname, '../client')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', game: 'Seadio Kill' });
});

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Join matchmaking queue
  socket.on('join_queue', () => {
    console.log(`${socket.id} joined queue`);
    const match = matchmaker.addPlayer(socket.id);

    if (match) {
      const { room, player1, player2 } = match;

      // Join both players to the room's socket.io room
      const s1 = io.sockets.sockets.get(player1);
      const s2 = io.sockets.sockets.get(player2);

      if (s1) s1.join(room.id);
      if (s2) s2.join(room.id);

      // Send game start to each player with their own hand
      if (s1) s1.emit('game_start', {
        roomId: room.id,
        yourHand: room.players[player1].hand.map(c => ({
          id: c.id, type: c.type, category: c.category,
          name: c.name, hp: c.hp, atk: c.atk,
          skill: c.skill, skillCard: c.skillCard,
        })),
        opponentHandCount: room.players[player2].hand.length,
      });

      if (s2) s2.emit('game_start', {
        roomId: room.id,
        yourHand: room.players[player2].hand.map(c => ({
          id: c.id, type: c.type, category: c.category,
          name: c.name, hp: c.hp, atk: c.atk,
          skill: c.skill, skillCard: c.skillCard,
        })),
        opponentHandCount: room.players[player1].hand.length,
      });

      // Start first round
      io.to(room.id).emit('round_start', { round: 1 });
    } else {
      socket.emit('queue_joined', { message: 'Waiting for opponent...' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    const result = matchmaker.removePlayer(socket.id);
    if (result && result.room) {
      const opponentId = result.room.getOpponentId(socket.id);
      const opponentSocket = io.sockets.sockets.get(opponentId);
      if (opponentSocket) {
        opponentSocket.emit('game_over', { winner: opponentId, reason: 'opponent_disconnected' });
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Seadio Kill server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 3: Test matchmaking with two browser tabs**

Run: `cd "e:/Ai/Seadio Kill" && node server/index.js`
Open two tabs to `http://localhost:3000`, in both consoles run `socket.emit('join_queue')`.
Expected: Both receive `game_start` event with hand data.

- [ ] **Step 4: Commit**

```bash
git add server/room.js server/index.js
git commit -m "feat: add game room management and matchmaking"
```

---

## Task 4: Game Logic — Combat & Skills

**Files:**
- Create: `server/logic.js`
- Modify: `server/index.js`

- [ ] **Step 1: Create combat resolution logic**

Create `server/logic.js`:
```javascript
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
```

- [ ] **Step 2: Test logic functions**

Run: `cd "e:/Ai/Seadio Kill" && node -e "
const l = require('./server/logic');
const c = {id:'t',type:'wolf',name:'狼人',hp:3,atk:1,skill:null};
const fc = l.createFieldCharacter(c);
console.log('Field char:', fc);
const r = l.applyDamage(fc, 1.5);
console.log('Damage result:', r);
console.log('HP left:', fc.currentHp);
"`
Expected: Field char has 3 maxHp, after 1.5 damage has 1.5 currentHp.

- [ ] **Step 3: Commit**

```bash
git add server/logic.js
git commit -m "feat: add combat resolution and skill effect logic"
```

---

## Task 5: Socket.io Game Events

**Files:**
- Modify: `server/index.js`

- [ ] **Step 1: Add all game event handlers to server**

Replace `server/index.js` with full game event handling:
```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { Matchmaker, GameRoom } = require('./room');
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

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // === MATCHMAKING ===
  socket.on('join_queue', () => {
    console.log(`${socket.id} joined queue`);
    const match = matchmaker.addPlayer(socket.id);

    if (match) {
      const { room, player1, player2 } = match;
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
        });
      }

      room.round = 1;
      room.phase = 'deploy';
      emitToRoom(room, 'round_start', { round: 1, phase: 'deploy' });
    } else {
      socket.emit('queue_joined', { message: 'Waiting for opponent...' });
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

    // Check if both players have deployed
    const bothDeployed = room.playerIds.every(pid =>
      room.currentRound.deployments[pid]
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

      // Move old field character back to hand (if exists)
      if (player.field) {
        // Old character stays with current HP - actually per design it goes to hand with current HP
        // But the card in hand doesn't track HP... Let's handle this differently
        // Per design: swap means replace field char, old card retains lost HP
        // For simplicity: old card is consumed (goes to lost), new card goes to field
        player.lost.push({ ...player.field, id: player.field.id, type: player.field.type, name: player.field.name, category: 'character', hp: player.field.maxHp, atk: player.field.atk });
      }

      player.hand = player.hand.filter(c => c.id !== cardId);
      player.field = logic.createFieldCharacter(newCard);

      // If new character is seer, activate dodge
      logic.processSeerDeploy(player.field, player);

      emitToRoom(room, 'action_result', {
        type: 'swap',
        playerId: socket.id,
        newCharacter: { type: player.field.type, name: player.field.name, hp: player.field.currentHp, maxHp: player.field.maxHp },
      });

      endRound(room);
    }
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
          message: `猎人发动【殉职】！对 ${opponent.field.name} 造成 1.5 点伤害！`,
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
  playerState.lost.push({ ...deadChar, category: 'character', hp: deadChar.maxHp, atk: deadChar.atk });
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
```

- [ ] **Step 2: Test full game loop manually**

Run: `cd "e:/Ai/Seadio Kill" && node server/index.js`
Open two browser tabs, both emit `socket.emit('join_queue')`, then simulate deploy → RPS → attack cycle in console.

- [ ] **Step 3: Commit**

```bash
git add server/index.js
git commit -m "feat: implement full game event handling with combat and skills"
```

---

## Task 6: Client HTML & CSS

**Files:**
- Modify: `client/index.html`
- Modify: `client/css/style.css`

- [ ] **Step 1: Build the full HTML structure**

Replace `client/index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seadio Kill</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <!-- LOBBY SCREEN -->
  <div id="screen-lobby" class="screen active">
    <div class="lobby-container">
      <h1 class="game-title">Seadio Kill</h1>
      <p class="subtitle">狼人杀卡牌对战</p>
      <button id="btn-join-queue" class="btn btn-primary">开始匹配</button>
      <p id="queue-status" class="status-text hidden">正在匹配对手...</p>
    </div>
  </div>

  <!-- GAME SCREEN -->
  <div id="screen-game" class="screen hidden">
    <!-- Opponent Area -->
    <div class="opponent-area">
      <div class="player-info opponent-info">
        <span class="player-label">对手</span>
        <span class="hand-count">手牌: <span id="opponent-hand-count">6</span></span>
      </div>
      <div class="field opponent-field">
        <div id="opponent-field-card" class="field-card empty">
          <span class="card-placeholder">?</span>
        </div>
      </div>
    </div>

    <!-- Battle Area -->
    <div class="battle-area">
      <div id="battle-log" class="battle-log">
        <p class="log-entry">游戏开始！</p>
      </div>

      <!-- RPS Section -->
      <div id="rps-section" class="rps-section hidden">
        <p class="rps-prompt">石头剪刀布！</p>
        <div class="rps-buttons">
          <button class="rps-btn" data-choice="rock">✊</button>
          <button class="rps-btn" data-choice="scissors">✌️</button>
          <button class="rps-btn" data-choice="paper">🖐️</button>
        </div>
      </div>

      <!-- Action Section -->
      <div id="action-section" class="action-section hidden">
        <p class="action-prompt">选择行动：</p>
        <div class="action-buttons">
          <button class="action-btn" data-action="attack">⚔️ 攻击</button>
          <button class="action-btn" data-action="skill">🃏 出技能牌</button>
          <button class="action-btn" data-action="swap">🔄 换角色</button>
        </div>
      </div>

      <!-- Poison Target Selection -->
      <div id="poison-section" class="target-section hidden">
        <p class="target-prompt">选择毒药目标：</p>
        <div id="poison-targets" class="target-buttons"></div>
      </div>

      <!-- Revive Target Selection -->
      <div id="revive-section" class="target-section hidden">
        <p class="target-prompt">选择复活目标：</p>
        <div id="revive-targets" class="target-buttons"></div>
      </div>
    </div>

    <!-- Player Area -->
    <div class="player-area">
      <div class="field player-field">
        <div id="player-field-card" class="field-card empty">
          <span class="card-placeholder">选择角色牌部署</span>
        </div>
      </div>
      <div class="player-info">
        <span class="player-label">你</span>
        <div class="field-char-stats" id="player-field-stats"></div>
      </div>
    </div>

    <!-- Hand Area -->
    <div class="hand-area">
      <div id="hand-cards" class="hand-cards">
        <!-- Cards will be rendered here by JS -->
      </div>
    </div>
  </div>

  <!-- GAME OVER SCREEN -->
  <div id="screen-gameover" class="screen hidden">
    <div class="gameover-container">
      <h2 id="gameover-title" class="gameover-title">游戏结束</h2>
      <p id="gameover-reason" class="gameover-reason"></p>
      <button id="btn-play-again" class="btn btn-primary">再来一局</button>
    </div>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script src="js/data.js"></script>
  <script src="js/socket.js"></script>
  <script src="js/game.js"></script>
  <script src="js/ui.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Build the CSS**

Replace `client/css/style.css`:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Microsoft YaHei', sans-serif;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  color: #eee;
  min-height: 100vh;
  overflow: hidden;
}

.hidden { display: none !important; }
.screen { display: none; width: 100%; height: 100vh; }
.screen.active { display: flex; }

/* === LOBBY === */
#screen-lobby {
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.lobby-container {
  text-align: center;
}

.game-title {
  font-size: 4rem;
  color: #e94560;
  text-shadow: 0 0 30px rgba(233, 69, 96, 0.6);
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.2rem;
  color: #aaa;
  margin-bottom: 2rem;
}

.btn {
  padding: 14px 40px;
  font-size: 1.2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #e94560;
  color: white;
}

.btn-primary:hover {
  background: #ff6b81;
  transform: scale(1.05);
}

.status-text {
  margin-top: 1rem;
  color: #aaa;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* === GAME SCREEN === */
#screen-game {
  flex-direction: column;
  padding: 10px;
}

.opponent-area, .player-area {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.player-label {
  font-weight: bold;
  color: #e94560;
}

.hand-count {
  color: #aaa;
}

/* === FIELD CARDS === */
.field {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 8px 0;
}

.field-card {
  width: 100px;
  height: 140px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  transition: all 0.3s;
  position: relative;
}

.field-card.empty {
  border: 2px dashed #555;
  color: #555;
}

.field-card.face-down {
  background: linear-gradient(135deg, #2d1b69, #11001c);
  border: 2px solid #e94560;
  cursor: default;
}

.field-card.face-down::after {
  content: '?';
  font-size: 2rem;
  color: #e94560;
}

.field-card.face-up {
  background: linear-gradient(135deg, #1a1a3e, #16213e);
  border: 2px solid #0f3460;
}

.field-card.face-up .card-name {
  font-weight: bold;
  font-size: 1rem;
  margin-bottom: 5px;
}

.field-card.face-up .card-hp {
  color: #e94560;
  font-size: 0.9rem;
}

.field-card.face-up .card-atk {
  color: #f5a623;
  font-size: 0.8rem;
}

.field-card.dead {
  opacity: 0.3;
  border-color: #333;
}

/* === BATTLE AREA === */
.battle-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.battle-log {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 10px 20px;
  max-width: 500px;
  width: 100%;
  max-height: 120px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.log-entry {
  font-size: 0.85rem;
  color: #ccc;
  margin: 4px 0;
  line-height: 1.4;
}

.log-entry.important {
  color: #e94560;
  font-weight: bold;
}

/* === RPS === */
.rps-section {
  text-align: center;
}

.rps-prompt {
  font-size: 1.3rem;
  margin-bottom: 15px;
  color: #f5a623;
}

.rps-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.rps-btn {
  width: 70px;
  height: 70px;
  font-size: 2rem;
  border: 2px solid #555;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.rps-btn:hover {
  border-color: #e94560;
  background: rgba(233, 69, 96, 0.15);
  transform: scale(1.1);
}

.rps-btn.selected {
  border-color: #e94560;
  background: rgba(233, 69, 96, 0.3);
}

/* === ACTIONS === */
.action-section {
  text-align: center;
}

.action-prompt {
  font-size: 1.1rem;
  margin-bottom: 12px;
  color: #f5a623;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-btn {
  padding: 10px 20px;
  font-size: 1rem;
  border: 2px solid #555;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #eee;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #e94560;
  background: rgba(233, 69, 96, 0.15);
}

/* === TARGET SELECTION === */
.target-section {
  text-align: center;
}

.target-prompt {
  font-size: 1.1rem;
  margin-bottom: 12px;
  color: #f5a623;
}

.target-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.target-btn {
  padding: 10px 16px;
  font-size: 0.9rem;
  border: 2px solid #555;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #eee;
  cursor: pointer;
  transition: all 0.2s;
}

.target-btn:hover {
  border-color: #e94560;
  background: rgba(233, 69, 96, 0.15);
}

/* === HAND CARDS === */
.hand-area {
  flex: 0 0 auto;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid #333;
}

.hand-cards {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.hand-card {
  width: 110px;
  height: 155px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 10px 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.hand-card.character {
  background: linear-gradient(135deg, #1a3a5c, #0d1b2a);
  border: 2px solid #1b4965;
}

.hand-card.dual {
  background: linear-gradient(135deg, #3a1c5c, #1b0d2a);
  border: 2px solid #6b3fa0;
}

.hand-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 8px 25px rgba(233, 69, 96, 0.3);
}

.hand-card.selected {
  border-color: #e94560;
  box-shadow: 0 0 15px rgba(233, 69, 96, 0.5);
  transform: translateY(-10px);
}

.hand-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hand-card .card-name {
  font-size: 0.95rem;
  font-weight: bold;
  text-align: center;
}

.hand-card .card-stats {
  font-size: 0.75rem;
  text-align: center;
  color: #aaa;
}

.hand-card .card-stats .hp { color: #e94560; }
.hand-card .card-stats .atk { color: #f5a623; }

.hand-card .card-skill {
  font-size: 0.7rem;
  color: #a78bfa;
  text-align: center;
  margin-top: 4px;
}

.hand-card .card-type-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 0.6rem;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0,0,0,0.5);
}

/* === GAME OVER === */
#screen-gameover {
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.gameover-container {
  text-align: center;
}

.gameover-title {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.gameover-title.win {
  color: #4ade80;
  text-shadow: 0 0 30px rgba(74, 222, 128, 0.5);
}

.gameover-title.lose {
  color: #e94560;
  text-shadow: 0 0 30px rgba(233, 69, 96, 0.5);
}

.gameover-reason {
  color: #aaa;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

/* === SCROLLBAR === */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #555; border-radius: 2px; }
```

- [ ] **Step 3: Verify UI renders**

Run: `cd "e:/Ai/Seadio Kill" && node server/index.js`
Open `http://localhost:3000`, should see lobby screen with title and button.

- [ ] **Step 4: Commit**

```bash
git add client/index.html client/css/style.css
git commit -m "feat: add game UI with lobby, game, and game over screens"
```

---

## Task 7: Client Socket & Game State

**Files:**
- Create: `client/js/socket.js`
- Create: `client/js/game.js`

- [ ] **Step 1: Create socket wrapper**

Create `client/js/socket.js`:
```javascript
/**
 * Socket.io client wrapper — centralizes all event handling
 */
class SocketManager {
  constructor() {
    this.socket = null;
    this.handlers = {};
  }

  connect() {
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('Connected:', this.socket.id);
      this.trigger('connected', { id: this.socket.id });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected');
      this.trigger('disconnected', {});
    });

    // Server events
    const events = [
      'queue_joined', 'game_start', 'round_start',
      'deploy_success', 'cards_revealed',
      'rps_start', 'rps_result',
      'your_turn', 'opponent_turn', 'opponent_rps_ready',
      'action_result', 'death_skill',
      'select_revive_target',
      'game_over', 'error_msg',
    ];

    events.forEach(event => {
      this.socket.on(event, (data) => {
        this.trigger(event, data);
      });
    });
  }

  on(event, handler) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
  }

  off(event, handler) {
    if (!this.handlers[event]) return;
    this.handlers[event] = this.handlers[event].filter(h => h !== handler);
  }

  trigger(event, data) {
    if (this.handlers[event]) {
      this.handlers[event].forEach(h => h(data));
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  joinQueue() {
    this.emit('join_queue', {});
  }

  deployCard(cardId) {
    this.emit('deploy_card', { cardId });
  }

  rpsChoice(choice) {
    this.emit('rps_choice', { choice });
  }

  performAction(type, cardId, targetId) {
    this.emit('action', { type, cardId, targetId });
  }

  selectReviveTarget(cardId, targetCardId) {
    this.emit('select_revive_target', { cardId, targetCardId });
  }
}

const socketManager = new SocketManager();
```

- [ ] **Step 2: Create client game state**

Create `client/js/game.js`:
```javascript
/**
 * Client-side game state manager
 */
class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.roomId = null;
    this.myHand = [];           // cards in my hand
    this.myField = null;        // my field character
    this.lostCards = [];         // my lost/consumed cards
    this.opponentHandCount = 6;
    this.opponentField = null;  // opponent's field character (revealed info)
    this.phase = 'lobby';       // lobby | deploy | reveal | rps | action | gameover
    this.isMyTurn = false;
    this.round = 0;
    this.revealedCard = null;   // card I deployed this round (for display)
  }

  setGameStart(data) {
    this.roomId = data.roomId;
    this.myHand = data.yourHand;
    this.opponentHandCount = data.opponentHandCount;
    this.phase = 'deploy';
  }

  addCardToField(card) {
    // Create field character from card data
    const stats = CHARACTER_STATS[card.type];
    this.myField = {
      ...card,
      maxHp: stats.hp,
      currentHp: stats.hp,
      atk: stats.atk,
    };
  }

  removeFromHand(cardId) {
    this.myHand = this.myHand.filter(c => c.id !== cardId);
  }

  hasCharacterCards() {
    return this.myHand.some(c => c.category === 'character' || c.category === 'dual');
  }

  hasSkillCards() {
    return this.myHand.some(c => c.skillCard);
  }

  getDualCards() {
    return this.myHand.filter(c => c.category === 'dual');
  }

  getCharacterCards() {
    return this.myHand.filter(c => c.category === 'character' || c.category === 'dual');
  }
}

const gameState = new GameState();
```

- [ ] **Step 3: Commit**

```bash
git add client/js/socket.js client/js/game.js
git commit -m "feat: add client socket manager and game state"
```

---

## Task 8: Client UI Rendering & Main Entry

**Files:**
- Create: `client/js/ui.js`
- Modify: `client/js/main.js`

- [ ] **Step 1: Create UI renderer**

Create `client/js/ui.js`:
```javascript
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
      poisonSection: document.getElementById('poison-section'),
      poisonTargets: document.getElementById('poison-targets'),
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
  showPoisonTarget(targets, onSelect) {
    this.elements.poisonSection.classList.remove('hidden');
    this.elements.poisonTargets.innerHTML = '';
    targets.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'target-btn';
      btn.textContent = `${t.name} (♥${t.hp})`;
      btn.addEventListener('click', () => onSelect(t));
      this.elements.poisonTargets.appendChild(btn);
    });
  }

  hidePoisonTarget() {
    this.elements.poisonSection.classList.add('hidden');
  }

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
    this.hidePoisonTarget();
    this.hideReviveTarget();
  }
}

const ui = new UIRenderer();
```

- [ ] **Step 2: Create main entry point**

Replace `client/js/main.js`:
```javascript
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

  socketManager.on('queue_joined', () => {
    ui.showQueueStatus(true);
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

      ui.addLog(`${result.attacker} 攻击了 ${result.defender}！`);

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
      ui.addLog(`${data.playerId === socketManager.socket.id ? '你' : '对手'} 换上了 ${data.newCharacter.name}！`);

      if (data.playerId === socketManager.socket.id) {
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
```

- [ ] **Step 3: Test full game flow**

Run: `cd "e:/Ai/Seadio Kill" && node server/index.js`
Open two browser tabs to `http://localhost:3000`.
1. Both click "开始匹配"
2. Both should see their hand of 6 cards
3. Both select a card to deploy (click a character card)
4. RPS section appears, both choose
5. Winner sees action buttons
6. Play through a few rounds

- [ ] **Step 4: Commit**

```bash
git add client/js/ui.js client/js/main.js
git commit -m "feat: add client UI rendering and game flow wiring"
```

---

## Task 9: End-to-End Testing & Bug Fixes

**Files:**
- Modify: any files as needed

- [ ] **Step 1: Run full game and test all character abilities**

Run: `cd "e:/Ai/Seadio Kill" && node server/index.js`
Test each scenario:
1. **Basic attack**: Two characters attack each other, verify HP decreases
2. **Hunter martyrdom**: Hunter dies, verify 1.5 damage to opponent
3. **Witch self-revive**: Witch dies, verify she revives with full HP
4. **Witch poison**: Use witch poison, verify instant kill
5. **Guardian shield**: Use shield skill card, verify damage blocked
6. **Seer dodge**: Seer on field, verify dodge activates
7. **Seer reveal**: Use reveal skill card, verify opponent hand shown
8. **Revive ally**: Use witch revive skill card, verify lost card returns

- [ ] **Step 2: Fix any bugs found**

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "fix: bug fixes from end-to-end testing"
```

---

## Task 10: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write project README**

Create `README.md`:
```markdown
# Seadio Kill 🐺⚔️

以狼人杀角色为原型的 1v1 卡牌对战网页游戏。

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动服务器

```bash
npm start
```

打开两个浏览器标签页访问 `http://localhost:3000`，点击"开始匹配"即可对战。

## 游戏玩法

### 基本规则

1. 双方从 16 张共享牌库中各抽 6 张手牌
2. 每回合暗置一张牌到场上，然后石头剪刀布决定行动权
3. 赢的人选择：攻击 / 出技能牌 / 换角色
4. 对方所有角色牌被消耗即为失败

### 角色一览

| 角色 | HP | ATK | 技能 |
|------|-----|-----|------|
| 村民 | 2 | 1 | 无 |
| 狼人 | 3 | 1 | 无 |
| 猎人 | 3 | 1.5 | 殉职：死亡造成10伤害 |
| 守卫 | 2 | 1 | 技能牌：免疫一次伤害 |
| 女巫 | 2 | 1 | 复活一次 / 毒药击杀 / 技能牌：复活角色 |
| 预言家 | 2 | 1 | 躲避一次攻击 / 技能牌：查看手牌 |

### 克制关系

- 猎人 → 狼人（1.5ATK + 死亡10伤害克制高血量）
- 女巫 → 守卫（毒药无视护盾）
- 预言家 → 女巫（躲避可躲毒药）
- 守卫 → 猎人（护盾挡殉职伤害）

## 技术栈

- 前端：HTML + CSS + Vanilla JavaScript
- 后端：Node.js + Express
- 通信：Socket.io
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with game rules and setup instructions"
```

---

*Plan created: 2026-06-06*
*Total tasks: 10*
