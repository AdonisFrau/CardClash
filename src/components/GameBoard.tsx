import { useState, useEffect } from 'react';
import type { GameState } from '../types';
import { Card } from './Card';
import { AnimatePresence, motion } from 'framer-motion';

interface GameBoardProps {
  gameState: GameState;
  playerId: string;
  failPopup: any;
  onPlayCard: (index: number) => void;
  onDrawCard: () => void;
  onTriggerBossMode: () => void;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  gameState, 
  playerId, 
  failPopup,
  onPlayCard, 
  onDrawCard,
  onTriggerBossMode 
}) => {
  const me = gameState.players.find(p => p.id === playerId);
  const isMyTurn = gameState.players[gameState.turnIndex]?.id === playerId;
  const [showBossBtn, setShowBossBtn] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (me && me.hand && me.hand.length === 1 && !me.isBossMode) {
      setShowBossBtn(true);
      const timer = setTimeout(() => {
        setShowBossBtn(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowBossBtn(false);
    }
  }, [me?.hand?.length, me?.isBossMode]);

  // Reset selected card when it's no longer your turn
  useEffect(() => {
    if (!isMyTurn) setSelectedCardIndex(null);
  }, [isMyTurn]);

  const handleCardClick = (index: number) => {
    if (!isMyTurn) return;
    if (isMobile) {
      // Mobile: tap to select, tap again to deselect, or use Play button
      setSelectedCardIndex(prev => (prev === index ? null : index));
    } else {
      // Desktop: click instantly plays
      onPlayCard(index);
    }
  };

  const handlePlaySelected = () => {
    if (selectedCardIndex !== null) {
      onPlayCard(selectedCardIndex);
      setSelectedCardIndex(null);
    }
  };

  if (!me) return <div className="text-white text-2xl flex h-screen items-center justify-center">Loading Arena...</div>;

  return (
    <div className="flex flex-col h-screen p-2 md:p-4 gap-2 md:gap-6 bg-gaming-bg" style={{ backgroundImage: 'radial-gradient(circle at center, #1a0505 0%, #050505 100%)' }}>
      
      {/* HEADER: Player List & Turn Cursor — horizontally scrollable on mobile */}
      <header className="flex-shrink-0">
        <div className="overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-2 md:gap-4 bg-gaming-panel/50 p-2 md:p-4 rounded-2xl backdrop-blur border border-white/5 shadow-md w-max min-w-full md:w-auto md:min-w-0 md:flex-wrap md:justify-center">
            {gameState.players.map((p, index) => {
              const isThisPlayersTurn = index === gameState.turnIndex;
              return (
                <motion.div 
                  key={p.id}
                  animate={isThisPlayersTurn ? { scale: 1.05, borderColor: '#ef4444', boxShadow: '0 0 15px rgba(239,68,68,0.5)' } : { scale: 1, borderColor: 'rgba(255,255,255,0.1)', boxShadow: 'none' }}
                  className={`px-3 md:px-6 py-1.5 md:py-2 rounded-xl border-2 flex items-center gap-2 md:gap-3 transition-colors flex-shrink-0 ${isThisPlayersTurn ? 'bg-gaming-red/10 text-white' : 'bg-black/50 text-gray-400'}`}
                >
                  <div className="font-bold tracking-wide text-xs md:text-base whitespace-nowrap">{p.name} {p.id === playerId && '(You)'}</div>
                  <div className="bg-black/50 px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs font-mono whitespace-nowrap">{p.cardCount} 🃏</div>
                  {p.isBossMode && <div className="text-gaming-red text-xs font-black animate-pulse">BOSS</div>}
                </motion.div>
              );
            })}
          </div>
        </div>
      </header>

      {/* FAIL POP-UP */}
      <AnimatePresence>
        {failPopup && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, x: '-50%', y: '-50%' }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="fail-popup flex flex-col items-center justify-center"
          >
            <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter mb-3 md:mb-4 shadow-black drop-shadow-lg">Play Failed!</h1>
            <p className="text-base md:text-xl text-gray-200 mb-4 md:mb-6 px-2">Your <strong className="text-white">{failPopup.playedCardName}</strong> could not beat <strong className="text-white">{failPopup.topCardName}</strong>.</p>
            <div className="flex gap-6 md:gap-8 items-center">
               <div className="text-center">
                 <div className="text-gray-400 text-xs uppercase">Your Power</div>
                 <div className="text-3xl md:text-4xl font-mono font-bold text-gray-500">{failPopup.playedCardPower}</div>
               </div>
               <div className="text-2xl md:text-3xl font-black text-white px-4">VS</div>
               <div className="text-center">
                 <div className="text-gaming-red text-xs uppercase">Stack Power</div>
                 <div className="text-4xl md:text-5xl font-mono font-black text-gaming-red drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">{failPopup.topCardPower}</div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MIDDLE: Stack & Draw Area */}
      <div className="flex-1 flex items-center justify-center gap-8 md:gap-16 relative min-h-0">
        {/* Draw Deck / Direction */}
        <div className="flex flex-col items-center gap-2 md:gap-4">
           <div className="text-gray-500 font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] text-xs md:text-sm">
             Direction {gameState.direction === 1 ? '➡' : '⬅'}
           </div>
           
           <button 
             className="w-20 h-32 md:w-32 md:h-48 rounded-xl border-4 border-dashed border-gaming-red/50 bg-gaming-red/10 flex flex-col items-center justify-center text-gaming-red hover:bg-gaming-red hover:text-white transition-all cursor-pointer font-black text-lg md:text-2xl uppercase shadow-[0_0_20px_rgba(239,68,68,0.2)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gaming-red/10 disabled:hover:text-gaming-red"
             disabled={!isMyTurn}
             onClick={onDrawCard}
           >
             {gameState.drawPenalty > 0 ? `+${gameState.drawPenalty}` : `DRAW`}
           </button>
        </div>

        {/* Current Stack Card */}
        <div className="relative">
           <div className="absolute -top-8 md:-top-10 w-full text-center text-gaming-red font-black tracking-widest uppercase text-xs md:text-sm animate-pulse">Stack</div>
           {gameState.topCard && (
             <AnimatePresence mode="popLayout">
               <motion.div
                 key={gameState.topCard.name + Math.random()}
                 initial={{ scale: 1.2, opacity: 0, rotate: (Math.random() - 0.5) * 20 }}
                 animate={{ scale: 1, opacity: 1, rotate: (Math.random() - 0.5) * 10 }}
                 transition={{ type: "spring", bounce: 0.4 }}
               >
                 <Card card={gameState.topCard} />
               </motion.div>
             </AnimatePresence>
           )}
        </div>
      </div>

      {/* BOTTOM: Player Hand */}
      <div className="relative w-full flex-shrink-0 pb-4 md:pb-8">
        <div className="text-center mb-2 md:mb-6 h-8">
          <AnimatePresence mode="wait">
            {isMyTurn ? (
              <motion.h2 key="turn" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="text-gaming-red font-black text-lg md:text-2xl uppercase tracking-widest drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
                YOUR TURN
              </motion.h2>
            ) : (
              <motion.h2 key="wait" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="text-gray-500 font-bold text-sm md:text-lg uppercase tracking-widest">
                Waiting...
              </motion.h2>
            )}
          </AnimatePresence>
          {me.isBossMode && <h3 className="text-red-500 animate-pulse mt-1 font-black text-sm">BOSS MODE ACTIVE</h3>}
        </div>

        {isMobile ? (
          /* ── MOBILE HAND: horizontal scroll row ── */
          <div className="relative">
            <div className="overflow-x-auto hide-scrollbar pb-2">
              <div className="flex items-end gap-2 w-max px-4">
                <AnimatePresence>
                  {me.hand?.map((card, index) => (
                    <motion.div
                      key={`${card.name}-${index}`}
                      layout
                      initial={{ opacity: 0, y: 60 }}
                      animate={{ 
                        opacity: 1, 
                        y: selectedCardIndex === index ? -24 : 0,
                        scale: selectedCardIndex === index ? 1.08 : 1,
                        boxShadow: selectedCardIndex === index ? '0 0 20px rgba(239,68,68,0.8)' : 'none'
                      }}
                      exit={{ opacity: 0, scale: 0.5, y: -100 }}
                      transition={{ type: 'spring', bounce: 0.3 }}
                      className="flex-shrink-0 rounded-xl overflow-hidden"
                      style={{ outline: selectedCardIndex === index ? '2px solid #ef4444' : 'none' }}
                      onClick={() => handleCardClick(index)}
                    >
                      <Card card={card} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile: Confirm Play Button */}
            <AnimatePresence>
              {selectedCardIndex !== null && isMyTurn && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-10 py-4 bg-gaming-red text-white font-black text-lg uppercase rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.8)] border-2 border-white/30 tracking-widest"
                  onClick={handlePlaySelected}
                >
                  ▶ PLAY CARD
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* ── DESKTOP HAND: classic fan-out layout ── */
          <div className="flex justify-center items-end gap-[-2rem] relative z-10" style={{ perspective: '1000px' }}>
            <AnimatePresence>
              {me.hand?.map((card, index) => {
                const middle = (me.hand!.length - 1) / 2;
                const offset = index - middle;
                const rotate = offset * 3;
                const yOffset = Math.abs(offset) * 5;

                return (
                  <motion.div 
                    key={`${card.name}-${index}`}
                    layout
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: yOffset, rotate: rotate, zIndex: index }}
                    exit={{ opacity: 0, scale: 0.5, y: -200 }}
                    whileHover={isMyTurn ? { y: -40, scale: 1.15, rotate: 0, zIndex: 100 } : {}}
                    className="-ml-8 first:ml-0"
                    style={{ transformOrigin: 'bottom center' }}
                  >
                    <Card 
                      card={card} 
                      onClick={() => handleCardClick(index)}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {showBossBtn && (
          <button 
             className="boss-mode-btn px-8 py-4 rounded-xl"
             onClick={() => {
               onTriggerBossMode();
               setShowBossBtn(false);
             }}
          >
             ACTIVATE FINAL BOSS MODE!
          </button>
        )}
      </div>
    </div>
  );
};
