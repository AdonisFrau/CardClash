import { useState } from 'react';

interface MainMenuProps {
  onSelectMode: (mode: 'solo' | 'multiplayer', playerName: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectMode }) => {
  const [name, setName] = useState('');

  const handleJoin = (mode: 'solo' | 'multiplayer') => {
    if (name.trim() === '') {
      alert("Please enter a name first.");
      return;
    }
    onSelectMode(mode, name);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gaming-bg p-4" style={{ backgroundImage: 'radial-gradient(circle at center, #1a0505 0%, #050505 100%)' }}>
      <div className="glass-panel p-12 max-w-md w-full text-center flex flex-col items-center border-t-4 border-t-gaming-red">
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">
          NewGen <span className="text-gaming-red">Royale</span>
        </h1>
        <p className="text-gray-400 mb-8 font-semibold tracking-wider text-sm uppercase">Enter the arena</p>
        
        <input 
          type="text" 
          className="input-field w-full mb-6 text-center text-xl font-bold tracking-widest placeholder-gray-600 focus:bg-black" 
          placeholder="USERNAME" 
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleJoin('multiplayer'); }}
        />

        <div className="flex flex-col w-full gap-4">
          <button className="btn" onClick={() => handleJoin('multiplayer')}>
            Multiplayer
          </button>
          <button className="btn border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white hover:border-gray-500 shadow-none hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]" onClick={() => handleJoin('solo')}>
            Local Sandbox
          </button>
        </div>
      </div>
    </div>
  );
};
