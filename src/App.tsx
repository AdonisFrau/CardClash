import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { MainMenu } from './components/MainMenu';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import type { GameState } from './types';

// For local testing, default to localhost:3001
// In production, this should point to the production server URL
const SERVER_URL = 'http://localhost:3001';

type AppState = 'menu' | 'lobby' | 'game' | 'gameover';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [appState, setAppState] = useState<AppState>('menu');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<{id: string, name: string, isBot?: boolean}[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [failPopup, setFailPopup] = useState<any>(null);

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('roomUpdate', (room) => {
      setPlayers(room.players);
    });

    socket.on('gameStarted', () => {
      setAppState('game');
    });

    socket.on('gameState', (state: GameState) => {
      // Find my hand since server sends all hands right now (for simplicity)
      // In a real app, server should filter out other player's hands to prevent cheating
      setGameState(state);
    });

    socket.on('gameOver', ({ winner }) => {
      setWinner(winner);
      setAppState('gameover');
    });

    socket.on('bossModeActivated', (name) => {
      // Optional: play a sound or show a quick toast
      console.log(`${name} activated BOSS MODE!`);
    });

    socket.on('playFailed', (data) => {
      setFailPopup(data);
      setTimeout(() => {
        setFailPopup(null);
      }, 2000);
    });

  }, [socket]);

  const handleSelectMode = (mode: 'solo' | 'multiplayer', name: string) => {
    setPlayerName(name);
    if (mode === 'solo') {
      socket?.emit('createRoom', name, (res: any) => {
        if(res.success) {
           setRoomCode(res.roomCode);
           setIsHost(true);
           setAppState('lobby');
           socket?.emit('addBot', { roomCode: res.roomCode });
           socket?.emit('addBot', { roomCode: res.roomCode });
           socket?.emit('addBot', { roomCode: res.roomCode });
        }
      });
    } else {
      setAppState('lobby');
    }
  };

  const handleCreateRoom = () => {
    socket?.emit('createRoom', playerName, (res: any) => {
      if (res.success) {
        setRoomCode(res.roomCode);
        setIsHost(true);
      }
    });
  };

  const handleJoinRoom = (code: string) => {
    socket?.emit('joinRoom', { roomCode: code, playerName }, (res: any) => {
      if (res.success) {
        setRoomCode(res.roomCode);
        setPlayerName(res.name); // update name in case it got appended with numbers
        setIsHost(false);
      } else {
        alert(res.message);
      }
    });
  };

  const handleStartGame = () => {
    if (roomCode) {
      socket?.emit('startGame', roomCode);
    }
  };

  if (appState === 'menu') {
    return <MainMenu onSelectMode={handleSelectMode} />;
  }

  if (appState === 'lobby') {
    return (
      <Lobby 
        roomCode={roomCode} 
        players={players} 
        isHost={isHost}
        botDifficulty={gameState?.botDifficulty || 'middle'}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onStartGame={handleStartGame}
        onAddBot={() => socket?.emit('addBot', { roomCode })}
        onRemoveBot={(botId) => socket?.emit('removeBot', { roomCode, botId })}
        onSetDifficulty={(difficulty) => socket?.emit('setBotDifficulty', { roomCode, difficulty })}
      />
    );
  }

  if (appState === 'game' && gameState && socket) {
    return (
      <GameBoard
        gameState={gameState}
        playerId={socket.id || ''}
        failPopup={failPopup}
        onPlayCard={(index) => socket.emit('playCard', { roomCode, cardIndex: index })}
        onDrawCard={() => socket.emit('drawCard', { roomCode })}
        onTriggerBossMode={() => socket.emit('triggerBossMode', { roomCode })}
      />
    );
  }

  if (appState === 'gameover') {
    return (
      <div className="screen-container">
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <h1 style={{ color: 'var(--accent-cyan)', fontSize: '4rem', marginBottom: '20px' }}>GAME OVER</h1>
          <h2>WINNER: <span style={{ color: 'gold' }}>{winner}</span></h2>
          <button className="btn" style={{ marginTop: '40px' }} onClick={() => window.location.reload()}>
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
}

export default App;
