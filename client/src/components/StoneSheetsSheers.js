import React, { useState, useEffect } from 'react';
import { Sword, Scissors, Book, Circle, Mountain, Square, SmilePlus } from 'lucide-react';
import { socketService } from '../../socketService';

const CARD_TYPES = {
  STONE: 'stone',
  SHEETS: 'sheets',
  SHEERS: 'sheers',
  BOULDER: 'boulder',
  CLOTH: 'cloth',
  SWORD: 'sword',
  JOKER: 'joker'
};

const generateInitialCards = () => {
  const cards = [];
  for (let i = 0; i < 15; i++) {
    const rand = Math.random();
    let cardType;
    if (rand < 0.25) cardType = CARD_TYPES.STONE;
    else if (rand < 0.5) cardType = CARD_TYPES.SHEETS;
    else if (rand < 0.75) cardType = CARD_TYPES.SHEERS;
    else if (rand < 0.9) {
      const upgradeRand = Math.random();
      if (upgradeRand < 0.33) cardType = CARD_TYPES.BOULDER;
      else if (upgradeRand < 0.66) cardType = CARD_TYPES.CLOTH;
      else cardType = CARD_TYPES.SWORD;
    }
    else cardType = CARD_TYPES.JOKER;
    
    cards.push({
      id: `card-${i}`,
      type: cardType
    });
  }
  return cards;
};

export const StoneSheetsSheers = ({ gameData }) => {
  const [gameState, setGameState] = useState({
    myCards: generateInitialCards(),
    mySelectedCard: null,
    opponentSelectedCard: null,
    drawsLeft: 3,
    opponentDrawsLeft: 3,
    round: 1,
    lastWinner: null,
    gameOver: false,
    opponentUsername: gameData.players.find(name => name !== socketService.username)
  });

  useEffect(() => {
    // Listen for opponent actions
    socketService.onOpponentAction((action) => {
      switch (action.type) {
        case 'cardSelected':
          setGameState(prev => ({
            ...prev,
            opponentSelectedCard: action.card
          }));
          break;
        case 'drawCards':
          setGameState(prev => ({
            ...prev,
            opponentDrawsLeft: prev.opponentDrawsLeft - 1
          }));
          break;
        default:
          break;
      }
    });

    socketService.onOpponentLeft(() => {
      alert('Opponent has left the game');
      window.location.reload();
    });

    return () => {
      // Cleanup socket listeners
    };
  }, []);

  const getCardIcon = (cardType) => {
    switch(cardType) {
      case CARD_TYPES.STONE: return <Circle className="w-16 h-16" />;
      case CARD_TYPES.SHEETS: return <Book className="w-16 h-16" />;
      case CARD_TYPES.SHEERS: return <Scissors className="w-16 h-16" />;
      case CARD_TYPES.BOULDER: return <Mountain className="w-16 h-16" />;
      case CARD_TYPES.CLOTH: return <Square className="w-16 h-16" />;
      case CARD_TYPES.SWORD: return <Sword className="w-16 h-16" />;
      case CARD_TYPES.JOKER: return <SmilePlus className="w-16 h-16" />;
      default: return null;
    }
  };

  const getCardCounts = (cards) => {
    return cards.reduce((acc, card) => {
      acc[card.type] = (acc[card.type] || 0) + 1;
      return acc;
    }, {});
  };

  const handleCardSelect = (cardType) => {
    const card = gameState.myCards.find(c => c.type === cardType);
    if (!card) return;

    setGameState(prev => ({
      ...prev,
      mySelectedCard: card
    }));

    socketService.sendGameAction(gameData.lobbyId, {
      type: 'cardSelected',
      card
    });
  };

  const determineWinner = (card1, card2) => {
    if (card1.type === card2.type) return 'tie';
    
    if (card1.type === CARD_TYPES.JOKER) {
      return ['BOULDER', 'CLOTH', 'SWORD'].includes(card2.type.toUpperCase()) ? 'opponent' : 'player';
    }
    if (card2.type === CARD_TYPES.JOKER) {
      return ['BOULDER', 'CLOTH', 'SWORD'].includes(card1.type.toUpperCase()) ? 'player' : 'opponent';
    }

    const isCard1Upgrade = [CARD_TYPES.BOULDER, CARD_TYPES.CLOTH, CARD_TYPES.SWORD].includes(card1.type);
    const isCard2Upgrade = [CARD_TYPES.BOULDER, CARD_TYPES.CLOTH, CARD_TYPES.SWORD].includes(card2.type);

    if (isCard1Upgrade && !isCard2Upgrade) return 'player';
    if (!isCard1Upgrade && isCard2Upgrade) return 'opponent';

    const winningCombos = {
      [CARD_TYPES.STONE]: [CARD_TYPES.SHEERS],
      [CARD_TYPES.SHEERS]: [CARD_TYPES.SHEETS],
      [CARD_TYPES.SHEETS]: [CARD_TYPES.STONE]
    };

    return winningCombos[card1.type]?.includes(card2.type) ? 'player' : 'opponent';
  };

  const handleDrawCards = () => {
    if (gameState.drawsLeft > 0 && gameState.round % 3 === 0) {
      const newCards = generateInitialCards().slice(0, 3);
      setGameState(prev => ({
        ...prev,
        myCards: [...prev.myCards, ...newCards],
        drawsLeft: prev.drawsLeft - 1
      }));

      socketService.sendGameAction(gameData.lobbyId, {
        type: 'drawCards'
      });
    }
  };

  const playRound = () => {
    if (!gameState.mySelectedCard || !gameState.opponentSelectedCard) return;

    const winner = determineWinner(gameState.mySelectedCard, gameState.opponentSelectedCard);
    
    setGameState(prev => {
      const newState = {
        ...prev,
        round: prev.round + 1,
        lastWinner: winner,
        myCards: prev.myCards.filter(card => card.id !== prev.mySelectedCard.id),
        mySelectedCard: null,
        opponentSelectedCard: null
      };

      newState.gameOver = newState.myCards.length === 0;
      return newState;
    });
  };

  const cardCounts = getCardCounts(gameState.myCards);

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-sky-300" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-green-600 transform -skew-y-6 translate-y-24" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-green-500 transform skew-y-6" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-green-400" />
      </div>

      {/* Game content */}
      <div className="relative z-10 max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="bg-white/90 px-6 py-3 rounded-lg shadow-lg">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 
                         bg-clip-text text-transparent">
              Stone · Sheets · Sheers
            </h1>
          </div>
        </div>

        {/* Opponent info */}
        <div className="bg-white/90 rounded-xl p-4 shadow-lg mb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {gameState.opponentUsername}
            </h2>
            <div className="text-gray-600">
              Cards: {gameState.opponentSelectedCard ? 'Card Selected' : 'Selecting...'} | 
              Draws: {gameState.opponentDrawsLeft}
            </div>
          </div>
        </div>

        {/* Game status */}
        <div className="bg-white/90 rounded-xl p-6 mb-8 text-center shadow-xl">
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Round {gameState.round}</h3>
          {gameState.lastWinner && (
            <p className="text-3xl font-bold text-gray-900">
              {gameState.lastWinner === 'tie' ? "It's a tie!" : 
               `${gameState.lastWinner === 'player' ? socketService.username : gameState.opponentUsername} wins the round!`}
            </p>
          )}
        </div>

        {/* Player's cards */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Your Cards</h2>
            <div className="text-white">
              Cards: {gameState.myCards.length} | 
              Draws: {gameState.drawsLeft}
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            {Object.entries(cardCounts).map(([cardType, count]) => {
              const isUpgradeCard = [CARD_TYPES.BOULDER, CARD_TYPES.CLOTH, CARD_TYPES.SWORD].includes(cardType);
              const isJoker = cardType === CARD_TYPES.JOKER;
              
              return (
                <button
                  key={cardType}
                  onClick={() => handleCardSelect(cardType)}
                  disabled={gameState.gameOver}
                  className={`p-4 border rounded-lg relative aspect-square flex flex-col items-center
                    transition-all duration-200 transform
                    ${gameState.mySelectedCard?.type === cardType ? 'ring-4 ring-yellow-400 scale-105' : ''}
                    ${gameState.gameOver ? 'opacity-50' : 'hover:scale-110 hover:-translate-y-1 hover:shadow-xl'}
                    ${isUpgradeCard ? 'bg-gradient-to-br from-blue-100 to-blue-50' : 
                      isJoker ? 'bg-gradient-to-br from-purple-100 to-purple-50' : 'bg-white'}
                  `}
                >
                  <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-gray-800 
                                flex items-center justify-center text-white font-bold">
                    {count}
                  </div>
                  
                  {/* Center icon */}
                  <div className="flex-grow flex items-center justify-center">
                    <div className={`${isUpgradeCard ? 'text-blue-600' : 
                                     isJoker ? 'text-purple-600' : 'text-gray-800'}`}>
                      {getCardIcon(cardType)}
                    </div>
                  </div>
                  
                  {/* Bottom name */}
                  <div className={`text-lg font-bold mt-2
                    ${isUpgradeCard ? 'text-blue-700' : 
                      isJoker ? 'text-purple-700' : 'text-gray-800'}`}>
                    {cardType.charAt(0).toUpperCase() + cardType.slice(1)}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={handleDrawCards}
              disabled={
                gameState.drawsLeft === 0 || 
                gameState.round % 3 !== 0 ||
                gameState.gameOver
              }
              className="px-6 py-3 bg-white/90 text-gray-800 rounded-lg hover:bg-white 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors 
                       shadow-lg font-semibold"
            >
              Draw Cards ({gameState.drawsLeft} left)
            </button>

            <button
              onClick={playRound}
              disabled={
                !gameState.mySelectedCard || 
                !gameState.opponentSelectedCard || 
                gameState.gameOver
              }
              className="px-8 py-3 bg-white/90 text-gray-800 rounded-lg hover:bg-white
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                       shadow-lg font-semibold"
            >
              Play Round
            </button>
          </div>
        </div>

        {gameState.gameOver && (
          <div className="mt-8 bg-white/90 rounded-xl p-8 text-center shadow-2xl">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Game Over!</h2>
            <p className="text-2xl text-gray-800">
              {gameState.myCards.length === 0 ? gameState.opponentUsername : socketService.username} wins!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
