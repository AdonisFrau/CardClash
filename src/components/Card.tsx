import React from 'react';
import type { GameCardType } from '../types';
import { Ban, RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface CardProps {
  card: GameCardType;
  onClick?: () => void;
  style?: React.CSSProperties;
  layoutId?: string;
  isOpponent?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  "Anime": "#3b82f6", // blue
  "Animals": "#ef4444", // red
  "Politicians": "#22c55e", // green
  "Countries": "#eab308", // yellow
  "Celebrities": "#8b4513", // brown
  "Cartoons": "#a855f7", // purple
  "Other": "#ec4899", // pink
  "Everything": "#1e3a8a" // navy
};

export const Card: React.FC<CardProps> = ({ card, onClick, style, layoutId, isOpponent }) => {
  const bgColor = TYPE_COLORS[card.type] || "#333";

  // For opponents, we just show the back of the card
  if (isOpponent) {
    return (
      <motion.div 
        layoutId={layoutId}
        className="w-20 h-32 rounded-xl border border-gaming-red/40 bg-black shadow-[0_0_10px_rgba(239,68,68,0.2)] flex items-center justify-center relative overflow-hidden flex-shrink-0"
        style={style}
      >
         <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at center, #ef4444 0%, transparent 70%)' }}></div>
         <div className="text-gaming-red font-black text-xl rotate-45 opacity-50">NGR</div>
      </motion.div>
    );
  }

  const renderSpecialIcon = () => {
    switch (card.name) {
      case "Block": return <Ban className="text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]" size={40} />;
      case "Loopback": return <RotateCw className="text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]" size={40} />;
      case "+2": return <div className="text-white text-4xl font-black drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">+2</div>;
      case "+4": return <div className="text-white text-4xl font-black drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">+4</div>;
      default: return null;
    }
  };

  return (
    <motion.div 
      layoutId={layoutId}
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      whileHover={onClick ? { y: -20, scale: 1.1, zIndex: 50, boxShadow: `0 15px 35px ${bgColor}80` } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      className={`relative w-32 h-48 rounded-xl overflow-hidden flex-shrink-0 flex flex-col justify-end bg-cover bg-center select-none shadow-lg ${card.isSpecial ? 'items-center justify-center' : 'cursor-pointer'}`}
      style={{ backgroundColor: bgColor, ...style }}
      onClick={onClick}
    >
      <div className="absolute inset-0 opacity-40 z-10" style={{ backgroundColor: bgColor }}></div>
      
      {!card.isSpecial && card.img && (
        <img 
           src={card.img} 
           alt={card.name} 
           onError={(e) => { e.currentTarget.src = '/img/Placeholder.png'; }}
           className="absolute inset-0 w-full h-full object-cover opacity-60 z-20 mix-blend-overlay" 
           draggable={false} 
        />
      )}
      
      {card.isSpecial ? (
         <div className="z-30 flex flex-col items-center justify-center w-full h-full">
           {renderSpecialIcon()}
           <div className="absolute bottom-3 text-white text-[10px] font-bold z-40 drop-shadow-md uppercase tracking-widest">
             {card.type}
           </div>
         </div>
      ) : (
        <div className="relative z-30 p-2 w-full text-center bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-8">
          <div className="text-white font-extrabold text-xs drop-shadow-md leading-tight mb-1">{card.name}</div>
          <div className="text-gray-300 text-[9px] uppercase tracking-widest">{card.type}</div>
        </div>
      )}
      
      {/* Sleek inner border instead of white stroke */}
      <div className="absolute inset-0 border border-white/20 rounded-xl z-50 pointer-events-none"></div>
    </motion.div>
  );
};
