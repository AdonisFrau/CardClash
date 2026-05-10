export interface GameCardType {
  name: string;
  img?: string;
  powerlevel: number;
  type: string;
  isSpecial: boolean;
}

export interface Player {
  id: string;
  name: string;
  cardCount: number;
  isBossMode: boolean;
  isBot?: boolean;
  hand?: GameCardType[]; // only for self
}

export interface GameState {
  players: Player[];
  topCard: GameCardType | null;
  turnIndex: number;
  direction: number;
  drawPenalty: number;
  botDifficulty?: 'soft' | 'middle' | 'hard';
}
