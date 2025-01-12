// client/src/App.js
import React, { useState, useEffect } from 'react';
import { UsernameSelect } from './components/UsernameSelect';
import { Lobby } from './components/Lobby';
import { StoneSheetsSheers } from './components/StoneSheetsSheers';
import { socketService } from './services/socketService';

export const App = () => {
  const [username, setUsername] = useState(null);
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    socketService.connect(process.env.REACT_APP_WS_URL);
    
    return () => {
      socketService.disconnect();
    };
  }, []);

  if (!username) {
    return <UsernameSelect onUsernamePicked={setUsername} />;
  }

  if (!gameData) {
    return <Lobby onGameStart={setGameData} />;
  }

  return <StoneSheetsSheers gameData={gameData} />;
};

export default App;
