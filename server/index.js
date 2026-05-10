import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

// Game State Storage
// rooms[roomCode] = { players, deck, discardPile, turnIndex, direction, roundCounter, ... }
const rooms = {};

// Load Characters from public/Characters.json
const charactersPath = path.join(__dirname, '../public/Characters.json');
let rawDeck = [];

try {
  const data = fs.readFileSync(charactersPath, 'utf-8');
  rawDeck = JSON.parse(data);
  console.log(`Loaded ${rawDeck.length} characters.`);
} catch (e) {
  console.error("Error loading characters.json", e);
}

const CARD_TYPES = [
  "Anime", "Animals", "Politicians", "Countries", 
  "Celebrities", "Cartoons", "Other", "Everything"
];

const SPECIAL_CARDS = ["Block", "Loopback", "+2", "+4"];

// Helper to generate a full deck
function generateDeck(allowedTypes = CARD_TYPES) {
  if (!allowedTypes || allowedTypes.length === 0) allowedTypes = CARD_TYPES;

  let deck = [...rawDeck]
    .filter(card => allowedTypes.includes(card.type))
    .map(card => ({ ...card, isSpecial: false }));
  
  // Add special cards only for allowed types
  allowedTypes.forEach(type => {
    SPECIAL_CARDS.forEach(specialName => {
      // Add 2 copies of each
      deck.push({ name: specialName, type, isSpecial: true, powerlevel: -1 });
      deck.push({ name: specialName, type, isSpecial: true, powerlevel: -1 });
    });
  });

  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', ({ playerName, allowedTypes, isStrictMode }, callback) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      players: [{ id: socket.id, name: playerName, hand: [], isBossMode: false, isBot: false }],
      deck: generateDeck(allowedTypes),
      discardPile: [],
      turnIndex: 0,
      direction: 1,
      started: false,
      drawPenalty: 0,
      roundCounter: 0,
      playsThisRound: 0,
      botDifficulty: 'middle',
      strictMode: isStrictMode || false
    };
    socket.join(roomCode);
    callback({ success: true, roomCode });
    io.to(roomCode).emit('roomUpdate', rooms[roomCode]);
  });

  socket.on('joinRoom', ({ roomCode, playerName }, callback) => {
    const room = rooms[roomCode];
    if (!room) {
      return callback({ success: false, message: 'Room not found' });
    }
    if (room.started) {
      return callback({ success: false, message: 'Game already started' });
    }

    // Ensure unique name
    let finalName = playerName;
    while (room.players.some(p => p.name === finalName)) {
      finalName = `${playerName}${Math.floor(1000 + Math.random() * 9000)}`;
    }

    room.players.push({ id: socket.id, name: finalName, hand: [], isBossMode: false, isBot: false });
    socket.join(roomCode);
    callback({ success: true, roomCode, name: finalName });
    io.to(roomCode).emit('roomUpdate', room);
  });

  socket.on('setBotDifficulty', ({ roomCode, difficulty }) => {
    const room = rooms[roomCode];
    if (room && room.players[0].id === socket.id) { // Host check
       room.botDifficulty = difficulty;
       io.to(roomCode).emit('roomUpdate', room);
    }
  });

  socket.on('addBot', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (room && room.players.length < 9 && room.players[0].id === socket.id && !room.started) {
       const botNames = ['John', 'Shadow', 'Slayer', 'Pro', 'Noob', 'Gamer', 'Bot', 'Destroyer', 'Ghost'];
       const botAdjs = ['Graveyard', 'Fire', 'Ice', 'Neon', 'Void', 'Steel', 'Iron', 'Plasma', 'Cyber'];
       const finalName = `${botNames[Math.floor(Math.random()*botNames.length)]}+${botAdjs[Math.floor(Math.random()*botAdjs.length)]}+${Math.floor(100+Math.random()*899)}`;
       
       room.players.push({
         id: `bot-${Math.random().toString(36).substr(2, 9)}`,
         name: finalName,
         hand: [],
         isBossMode: false,
         isBot: true
       });
       io.to(roomCode).emit('roomUpdate', room);
    }
  });

  socket.on('removeBot', ({ roomCode, botId }) => {
    const room = rooms[roomCode];
    if (room && room.players[0].id === socket.id && !room.started) {
       room.players = room.players.filter(p => p.id !== botId);
       io.to(roomCode).emit('roomUpdate', room);
    }
  });

  socket.on('startGame', (roomCode) => {
    const room = rooms[roomCode];
    if (!room) return;
    
    if (room.players.length < 2) {
       socket.emit('gameError', 'Need at least 2 players (or bots) to start.');
       return;
    }
    
    room.started = true;
    
    // Deal 7 cards to each player
    room.players.forEach(player => {
      player.hand = room.deck.splice(0, 7);
    });

    // Start stack with one regular card (not special)
    let firstCardIndex = room.deck.findIndex(c => !c.isSpecial);
    if(firstCardIndex === -1) firstCardIndex = 0;
    
    const firstCard = room.deck.splice(firstCardIndex, 1)[0];
    room.discardPile.push(firstCard);

    io.to(roomCode).emit('gameState', getPublicGameState(room));
    io.to(roomCode).emit('gameStarted');
    
    // If bot is first player
    if (room.players[0].isBot) {
        setTimeout(() => handleBotTurn(room, room.players[0], io, roomCode), 2000);
    }
  });

  socket.on('playCard', ({ roomCode, cardIndex }) => {
    const room = rooms[roomCode];
    if (!room) return;
    
    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex !== room.turnIndex) return; // Not their turn

    const player = room.players[playerIndex];
    const playedCard = player.hand[cardIndex];
    const topCard = room.discardPile[room.discardPile.length - 1];

    let valid = false;

    if (playedCard.isSpecial) {
       // Special cards: type must match topCard.type or topCard must be same special card
       if (playedCard.type === topCard.type || (topCard.isSpecial && topCard.name === playedCard.name)) {
           valid = true;
       }
    } else {
       // Normal card must have higher powerlevel OR top card is special
       if (topCard.isSpecial) {
           if (playedCard.type === topCard.type) valid = true;
       } else {
           if (playedCard.powerlevel > topCard.powerlevel) valid = true;
       }
    }

    // Strict Mode override check: MUST match type
    if (room.strictMode && valid) {
       if (playedCard.type !== topCard.type) {
           valid = false;
       }
    }

    if (valid) {
      player.hand.splice(cardIndex, 1);
      room.discardPile.push(playedCard);

      // Handle special card effects
      if (playedCard.isSpecial) {
        if (playedCard.name === "Block") {
          nextTurn(room, 2, io, roomCode); // Skip next player
        } else if (playedCard.name === "Loopback") {
          room.direction *= -1;
          if (room.players.length === 2) {
            nextTurn(room, 0, io, roomCode); // Acts as a block in 2 player
          } else {
            nextTurn(room, 1, io, roomCode);
          }
        } else if (playedCard.name === "+2") {
          room.drawPenalty += 2;
          nextTurn(room, 1, io, roomCode);
        } else if (playedCard.name === "+4") {
          room.drawPenalty += 4;
          nextTurn(room, 1, io, roomCode);
        }
      } else {
        nextTurn(room, 1, io, roomCode);
      }

      // Check win condition
      if (player.hand.length === 0) {
         if (player.isBossMode) {
             io.to(roomCode).emit('gameOver', { winner: player.name });
             return;
         } else {
             // Played last card without Boss Mode? Penalty!
             drawCards(room, player, 2);
         }
      } else if (player.hand.length === 1) {
         // UI should handle boss mode trigger, server just waits
      }
      
    } else {
      // Play fails, card stays on stack, draw +2
      drawCards(room, player, 2);
      
      io.to(roomCode).emit('playFailed', {
        playerName: player.name,
        playedCardName: playedCard.name,
        playedCardPower: playedCard.powerlevel,
        topCardName: topCard.name,
        topCardPower: topCard.powerlevel
      });

      nextTurn(room, 1, io, roomCode);
    }

    io.to(roomCode).emit('gameState', getPublicGameState(room));
  });

  socket.on('drawCard', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex !== room.turnIndex) return;

    const player = room.players[playerIndex];

    if (room.drawPenalty > 0) {
      drawCards(room, player, room.drawPenalty);
      room.drawPenalty = 0;
    } else {
      drawCards(room, player, 3); // Normal draw penalty if no card can beat
    }
    
    nextTurn(room, 1, io, roomCode);
    io.to(roomCode).emit('gameState', getPublicGameState(room));
  });

  socket.on('triggerBossMode', ({ roomCode }) => {
     const room = rooms[roomCode];
     if (!room) return;
     const player = room.players.find(p => p.id === socket.id);
     if (player && player.hand.length === 1) {
         player.isBossMode = true;
         io.to(roomCode).emit('bossModeActivated', player.name);
         io.to(roomCode).emit('gameState', getPublicGameState(room));
     }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Handle player leaving room (omitted for brevity, can implement if needed)
  });
});

function drawCards(room, player, amount) {
  for (let i = 0; i < amount; i++) {
    if (room.deck.length === 0) {
       // Reshuffle discard pile into deck, keeping top card
       const topCard = room.discardPile.pop();
       room.deck = room.discardPile.sort(() => Math.random() - 0.5);
       room.discardPile = [topCard];
    }
    if (player.hand.length < 100 && room.deck.length > 0) {
      player.hand.push(room.deck.pop());
    }
  }
}

function nextTurn(room, steps, io, roomCode) {
  room.playsThisRound += 1;
  room.turnIndex = (room.turnIndex + (room.direction * steps)) % room.players.length;
  if (room.turnIndex < 0) room.turnIndex += room.players.length;

  if (room.playsThisRound >= room.players.length) {
     room.playsThisRound = 0;
     // Round reset! New random card on stack.
     if(room.deck.length > 0) {
        room.discardPile.push(room.deck.pop());
     }
  }

  // Handle bot turn
  const activePlayer = room.players[room.turnIndex];
  if (activePlayer.isBot && io && roomCode) {
     // Delay 1 to 9 seconds
     const delay = Math.floor(Math.random() * 8000) + 1000;
     setTimeout(() => {
        handleBotTurn(room, activePlayer, io, roomCode);
     }, delay);
  }
}

function handleBotTurn(room, botPlayer, io, roomCode) {
    if (!room.started) return;
    const playerIndex = room.players.findIndex(p => p.id === botPlayer.id);
    if (playerIndex !== room.turnIndex) return; // Wait, somehow turn skipped?

    const topCard = room.discardPile[room.discardPile.length - 1];

    // Find valid cards
    let validCards = botPlayer.hand.map((card, index) => {
        let isValid = false;
        if (card.isSpecial) {
           if (card.type === topCard.type || (topCard.isSpecial && topCard.name === card.name)) isValid = true;
        } else {
           if (topCard.isSpecial) {
               if (card.type === topCard.type) isValid = true;
           } else {
               if (card.powerlevel > topCard.powerlevel) isValid = true;
           }
        }
        return { card, index, isValid };
    }).filter(c => c.isValid);

    if (validCards.length > 0) {
        // Safest option: sort by powerlevel asc (for normal cards)
        validCards.sort((a, b) => {
            if (a.card.isSpecial) return 1; // save specials for later
            if (b.card.isSpecial) return -1;
            return a.card.powerlevel - b.card.powerlevel;
        });

        let chosenIndex = validCards[0].index;
        const difficulty = room.botDifficulty || 'middle';
        
        // Mistake logic
        let mistakeChance = 0;
        if (difficulty === 'soft') mistakeChance = 0.4;
        else if (difficulty === 'middle') mistakeChance = 0.2;
        
        if (Math.random() < mistakeChance) {
            // Mistake: pick a random valid card instead of the safest
            chosenIndex = validCards[Math.floor(Math.random() * validCards.length)].index;
        }

        // Play the card
        const playedCard = botPlayer.hand[chosenIndex];
        botPlayer.hand.splice(chosenIndex, 1);
        room.discardPile.push(playedCard);

        if (playedCard.isSpecial) {
          if (playedCard.name === "Block") nextTurn(room, 2, io, roomCode);
          else if (playedCard.name === "Loopback") {
            room.direction *= -1;
            if (room.players.length === 2) nextTurn(room, 0, io, roomCode);
            else nextTurn(room, 1, io, roomCode);
          } else if (playedCard.name === "+2") {
            room.drawPenalty += 2;
            nextTurn(room, 1, io, roomCode);
          } else if (playedCard.name === "+4") {
            room.drawPenalty += 4;
            nextTurn(room, 1, io, roomCode);
          }
        } else {
          nextTurn(room, 1, io, roomCode);
        }

        // Bot Boss Mode trigger
        if (botPlayer.hand.length === 1 && !botPlayer.isBossMode) {
            botPlayer.isBossMode = true;
            io.to(roomCode).emit('bossModeActivated', botPlayer.name);
        }

        if (botPlayer.hand.length === 0) {
            if (botPlayer.isBossMode) io.to(roomCode).emit('gameOver', { winner: botPlayer.name });
            else drawCards(room, botPlayer, 2);
        }

    } else {
        // No valid cards, MUST draw
        if (room.drawPenalty > 0) {
          drawCards(room, botPlayer, room.drawPenalty);
          room.drawPenalty = 0;
        } else {
          drawCards(room, botPlayer, 3);
        }
        nextTurn(room, 1, io, roomCode);
    }

    io.to(roomCode).emit('gameState', getPublicGameState(room));
}

function getPublicGameState(room) {
  return {
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      cardCount: p.hand.length,
      isBossMode: p.isBossMode,
      isBot: p.isBot,
      hand: p.hand 
    })),
    topCard: room.discardPile[room.discardPile.length - 1],
    turnIndex: room.turnIndex,
    direction: room.direction,
    drawPenalty: room.drawPenalty,
    botDifficulty: room.botDifficulty || 'middle',
    strictMode: room.strictMode || false
  };
}

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO Server running on port ${PORT}`);
});
