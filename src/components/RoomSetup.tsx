import React from 'react';

interface RoomSetupProps {
  allowedTypes: string[];
  setAllowedTypes: (types: string[]) => void;
  isStrictMode: boolean;
  setIsStrictMode: (strict: boolean) => void;
  onLaunch: () => void;
  onCancel: () => void;
}

export const RoomSetup: React.FC<RoomSetupProps> = ({ 
  allowedTypes, setAllowedTypes, isStrictMode, setIsStrictMode, onLaunch, onCancel 
}) => {
  const allTypes = ['Anime', 'Animals', 'Politicians', 'Countries', 'Celebrities', 'Cartoons', 'Other', 'Everything'];

  const handleToggleType = (type: string) => {
    if (allowedTypes.includes(type)) {
      if (allowedTypes.length > 1) {
        setAllowedTypes(allowedTypes.filter(t => t !== type));
      }
    } else {
      setAllowedTypes([...allowedTypes, type]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gaming-bg p-4" style={{ backgroundImage: 'radial-gradient(circle at center, #1a0505 0%, #050505 100%)' }}>
      <div className="glass-panel p-10 max-w-md w-full text-center border-t-4 border-t-gaming-red relative">
        <h2 className="text-3xl font-black text-white uppercase tracking-wider mb-8 drop-shadow-md">Room Setup</h2>
        
        <div className="w-full mb-6 text-left bg-black/40 p-4 rounded-xl border border-white/5">
           <h3 className="text-gaming-red text-sm font-bold tracking-widest uppercase mb-3 border-b border-white/10 pb-2">Deck Categories</h3>
           <div className="grid grid-cols-2 gap-3">
             {allTypes.map(type => (
               <label key={type} className="flex items-center gap-2 cursor-pointer group">
                 <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${allowedTypes.includes(type) ? 'bg-gaming-red border-gaming-red shadow-[0_0_8px_#ef4444]' : 'border-gray-600 bg-black'}`}>
                   {allowedTypes.includes(type) && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                 </div>
                 <span className={`text-xs font-semibold uppercase tracking-wider ${allowedTypes.includes(type) ? 'text-white' : 'text-gray-600 group-hover:text-gray-400'}`}>
                   {type}
                 </span>
                 <input 
                   type="checkbox" 
                   className="hidden" 
                   checked={allowedTypes.includes(type)} 
                   onChange={() => handleToggleType(type)} 
                 />
               </label>
             ))}
           </div>
        </div>

        <div className="w-full mb-8 text-left bg-black/40 p-4 rounded-xl border border-white/5 flex items-center justify-between">
           <div>
             <h3 className="text-gaming-red text-sm font-bold tracking-widest uppercase mb-1">Strict Mode</h3>
             <p className="text-[10px] text-gray-500 uppercase font-semibold">Cards must strictly match the stack's Type</p>
           </div>
           
           <button 
             className={`relative w-14 h-7 rounded-full transition-colors flex items-center px-1 ${isStrictMode ? 'bg-gaming-red shadow-[0_0_10px_#ef4444]' : 'bg-gray-800'}`}
             onClick={() => setIsStrictMode(!isStrictMode)}
           >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${isStrictMode ? 'translate-x-7' : 'translate-x-0'}`}></div>
           </button>
        </div>

        <div className="flex gap-4">
          <button className="btn flex-1 border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn flex-1" onClick={onLaunch}>
            Launch Room
          </button>
        </div>
      </div>
    </div>
  );
};
