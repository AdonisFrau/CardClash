import React, { useState } from 'react';

interface LobbyProps {
  roomCode: string | null;
  players: { name: string }[];
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onStartGame: () => void;
  isHost: boolean;
}

export const Lobby: React.FC<LobbyProps> = ({ roomCode, players, onCreateRoom, onJoinRoom, onStartGame, isHost }) => {
  const [joinCode, setJoinCode] = useState('');

  if (roomCode) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gaming-bg p-4" style={{ backgroundImage: 'radial-gradient(circle at center, #1a0505 0%, #050505 100%)' }}>
        <div className="glass-panel p-10 max-w-md w-full text-center border-t-4 border-t-gaming-red">
          <h2 className="text-gray-400 text-sm font-bold tracking-widest uppercase mb-1">Room Code</h2>
          <div className="text-5xl font-black text-white mb-8 tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{roomCode}</div>
          
          <div className="text-left bg-black/40 rounded-xl p-4 mb-8 border border-white/5">
            <h3 className="border-b border-white/10 pb-2 mb-4 text-gaming-red font-bold uppercase text-sm tracking-wider flex justify-between">
              <span>Players</span>
              <span className="text-gray-500">{players.length}/10</span>
            </h3>
            <ul className="space-y-2">
              {players.map((p, idx) => (
                <li key={idx} className="text-white font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gaming-red shadow-[0_0_5px_#ef4444]"></div>
                  {p.name}
                </li>
              ))}
            </ul>
          </div>
          
          {isHost ? (
            <button className="btn w-full" onClick={onStartGame}>Start Game</button>
          ) : (
            <div className="text-gaming-red animate-pulse font-bold tracking-widest uppercase text-sm">Waiting for host to start...</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gaming-bg p-4" style={{ backgroundImage: 'radial-gradient(circle at center, #1a0505 0%, #050505 100%)' }}>
      <div className="glass-panel p-10 max-w-md w-full text-center border-t-4 border-t-gaming-red">
        <h2 className="text-3xl font-black text-white uppercase tracking-wider mb-8 drop-shadow-md">Multiplayer</h2>
        
        <button className="btn w-full mb-8 bg-gaming-red/10" onClick={onCreateRoom}>
          Create New Room
        </button>
        
        <div className="flex items-center gap-4 mb-8">
          <hr className="flex-1 border-white/10" />
          <span className="text-gray-600 font-bold text-sm tracking-widest">OR</span>
          <hr className="flex-1 border-white/10" />
        </div>

        <div className="flex flex-col gap-4">
          <input 
            type="text" 
            className="input-field text-center text-2xl font-black tracking-widest uppercase" 
            placeholder="ENTER CODE" 
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={5}
            onKeyDown={(e) => { if (e.key === 'Enter') onJoinRoom(joinCode); }}
          />
          <button className="btn w-full border-white/20 text-white hover:bg-white hover:text-black hover:shadow-[0_0_15px_rgba(255,255,255,0.5)]" onClick={() => onJoinRoom(joinCode)}>Join Room</button>
        </div>
      </div>
    </div>
  );
};
