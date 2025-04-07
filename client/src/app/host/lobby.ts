export interface Lobby {
  _id: string;
  lobbyName: string;
  userIDs: string[];
  //Fixed
  round: number;
}
