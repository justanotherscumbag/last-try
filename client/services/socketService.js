// client/src/services/socketService.js
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.username = null;
  }

  connect(wsUrl) {
    this.socket = io(wsUrl);
    
    // Setup basic socket listeners
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }

  setUsername(username) {
    return new Promise((resolve, reject) => {
      this.socket.emit('setUsername', username);
      
      this.socket.once('usernameSet', (confirmedUsername) => {
        this.username = confirmedUsername;
        resolve(confirmedUsername);
      });
      
      setTimeout(() => reject('Username setup timeout'), 5000);
    });
  }

  joinMatchmaking() {
    this.socket.emit('joinQueue');
  }

  createLobby() {
    this.socket.emit('createLobby');
  }

  joinLobby(lobbyId) {
    this.socket.emit('joinLobby', lobbyId);
  }

  sendGameAction(lobbyId, action) {
    this.socket.emit('gameAction', { lobbyId, action });
  }

  // Event listeners setup
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
