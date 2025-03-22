export interface Game {
  _id: string;
  prompt?: string;
  players?: string[];
  responses?: string[];
  judge?: number;
  scores?: number[];
  discardLast?: boolean;
  winnerBecomesJudge?: boolean;
}


