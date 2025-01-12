// server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active lobbies and users
const lobbies = new Map();
const users = new Map();
const waitingPlayers = new Set();

io.on('connection', (socket) => {
  // Set username
  socket.on('setUsername', (username) => {
    users.set(socket.id, { username, inGame: false });
    socket.emit('usernameSet', username);
  });

  // Join matchmaking queue
  socket.on('joinQueue', () => {
    const user = users.get(socket.id);
    if (!user || user.inGame) return;
    
    waitingPlayers.add(socket.id);
    
    // Check if we can make a match
    if (waitingPlayers.size >= 2) {
      const players = Array.from(waitingPlayers).slice(0, 2);
      const lobbyId = `lobby-${Date.now()}`;
      
      // Create new lobby
      lobbies.set(lobbyId, {
        players,
        gameState: null
      });
      
      // Remove players from queue and mark as in game
      players.forEach(playerId => {
        waitingPlayers.delete(playerId);
        users.get(playerId).inGame = true;
        io.to(playerId).emit('gameStart', {
          lobbyId,
          players: players.map(id => users.get(id).username)
        });
      });
    }
  });

  // Create custom lobby
  socket.on('createLobby', () => {
    const user = users.get(socket.id);
    if (!user || user.inGame) return;
    
    const lobbyId = `custom-${Date.now()}`;
    lobbies.set(lobbyId, {
      players: [socket.id],
      gameState: null
    });
    
    socket.emit('lobbyCreated', lobbyId);
  });

  // Join custom lobby
  socket.on('joinLobby', (lobbyId) => {
    const lobby = lobbies.get(lobbyId);
    const user = users.get(socket.id);
    
    if (!lobby || !user || user.inGame || lobby.players.length >= 2) {
      socket.emit('joinError', 'Unable to join lobby');
      return;
    }

    lobby.players.push(socket.id);
    users.get(socket.id).inGame = true;

    // Start game if lobby is full
    if (lobby.players.length === 2) {
      lobby.players.forEach(playerId => {
        io.to(playerId).emit('gameStart', {
          lobbyId,
          players: lobby.players.map(id => users.get(id).username)
        });
      });
    }
  });

  // Handle game actions
  socket.on('gameAction', ({ lobbyId, action }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby || !lobby.players.includes(socket.id)) return;

    // Broadcast action to other player
    lobby.players
      .filter(id => id !== socket.id)
      .forEach(playerId => {
        io.to(playerId).emit('opponentAction', action);
      });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (!user) return;

    // Remove from waiting queue
    waitingPlayers.delete(socket.id);

    // Handle active game disconnection
    lobbies.forEach((lobby, lobbyId) => {
      if (lobby.players.includes(socket.id)) {
        lobby.players
          .filter(id => id !== socket.id)
          .forEach(playerId => {
            io.to(playerId).emit('opponentLeft');
            users.get(playerId).inGame = false;
          });
        lobbies.delete(lobbyId);
      }
    });

    users.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
