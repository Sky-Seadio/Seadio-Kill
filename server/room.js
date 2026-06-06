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
