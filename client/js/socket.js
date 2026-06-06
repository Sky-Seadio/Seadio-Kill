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

  witchPoison(targetId) {
    this.emit('witch_poison', { targetId });
  }

  selectReviveTarget(cardId, targetCardId) {
    this.emit('select_revive_target', { cardId, targetCardId });
  }
}

const socketManager = new SocketManager();
