// client/src/socketService.js
import { io } from 'socket.io-client';
// In socketService.js
connect() {
  this.socket = io(window.location.origin);
  // ... rest of the code
}
class SocketService {
  constructor() {
    this.socket = null;
    this.username = null;
  }

  connect(wsUrl) {
    this.socket = io(wsUrl);
    
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }

  setUsername(username) {
    this.socket.emit('setUsername', username);
    this.username = username;
  }

  sendGameAction(lobbyId, action) {
    this.socket.emit('gameAction', { lobbyId, action });
  }

  onGameStart(callback) {
    this.socket.on('gameStart', callback);
  }

  onOpponentAction(callback) {
    this.socket.on('opponentAction', callback);
  }

  onOpponentLeft(callback) {
    this.socket.on('opponentLeft', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export const socketService = new SocketService();
