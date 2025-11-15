export enum Rarity {
  Legendary,
  Rare,
  Uncommon,
  Common,
  VeryCommon,
}

export interface Item {
  id: number;
  emoji: string;
  points: number;
  rarity: Rarity;
  rarityClass: string; // CSS class for styling
}

export type Grid = (Item | null)[][];

export interface Position {
  x: number;
  y: number;
}

export enum GameStatus {
  Playing,
  GameOver,
  StartMenu,
}