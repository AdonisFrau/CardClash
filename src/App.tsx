import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { MainMenu } from './components/MainMenu';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { RoomSetup } from './components/RoomSetup';
import type { GameState } from './types';

// Auto-detect server URL:
// - In production (Netlify etc): use VITE_SERVER_URL env var
// - In local dev from PC browser: use localhost:3001
// - In local dev from phone on same network: Vite --host exposes the IP, use that
const SERVER_URL = 
  import.meta.env.VITE_SERVER_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : `http://${window.location.hostname}:3001`);

type AppState = 'menu' | 'setup' | 'lobby' | 'game' | 'gameover';

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
  const [allowedTypes, setAllowedTypes] = useState<string[]>([
    'Anime', 'Animals', 'Politicians', 'Countries', 'Celebrities', 'Cartoons', 'Other', 'Everything'
  ]);
  const [isStrictMode, setIsStrictMode] = useState(false);
  const [setupMode, setSetupMode] = useState<'solo' | 'multiplayer' | null>(null);

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
      setSetupMode('solo');
      setAppState('setup');
    } else {
      setAppState('lobby');
    }
  };

  const handleCreateRoom = () => {
    // When clicking Create New Room in Lobby, go to setup
    setSetupMode('multiplayer');
    setAppState('setup');
  };

  const handleLaunchRoom = () => {
    socket?.emit('createRoom', { playerName, allowedTypes, isStrictMode }, (res: any) => {
      if(res.success) {
         setRoomCode(res.roomCode);
         setIsHost(true);
         setAppState('lobby');
         if (setupMode === 'solo') {
           socket?.emit('addBot', { roomCode: res.roomCode });
           socket?.emit('addBot', { roomCode: res.roomCode });
           socket?.emit('addBot', { roomCode: res.roomCode });
         }
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

  if (appState === 'setup') {
    return <RoomSetup 
             allowedTypes={allowedTypes} 
             setAllowedTypes={setAllowedTypes}
             isStrictMode={isStrictMode}
             setIsStrictMode={setIsStrictMode}
             onLaunch={handleLaunchRoom}
             onCancel={() => setAppState(setupMode === 'solo' ? 'menu' : 'lobby')}
           />;
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
