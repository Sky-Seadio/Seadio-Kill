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
