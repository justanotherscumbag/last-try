const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

// Serve static files from React app
app.use(express.static(path.join(__dirname, 'public')));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store game state
const lobbies = new Map();
const users = new Map();
const waitingPlayers = new Set();

// Socket.IO connection handling
io.on('connection', (socket) => {
  socket.on('setUsername', (username) => {
    users.set(socket.id, { username, inGame: false });
    socket.emit('usernameSet', username);
  });

  socket.on('joinQueue', () => {
    const user = users.get(socket.id);
    if (!user || user.inGame) return;
    
    waitingPlayers.add(socket.id);
    
    if (waitingPlayers.size >= 2) {
      const players = Array.from(waitingPlayers).slice(0, 2);
      const lobbyId = `lobby-${Date.now()}`;
      
      lobbies.set(lobbyId, {
        players,
        gameState: null
      });
      
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

  socket.on('gameAction', ({ lobbyId, action }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby || !lobby.players.includes(socket.id)) return;

    lobby.players
      .filter(id => id !== socket.id)
      .forEach(playerId => {
        io.to(playerId).emit('opponentAction', action);
      });
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (!user) return;

    waitingPlayers.delete(socket.id);

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

// Serve React app on all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
