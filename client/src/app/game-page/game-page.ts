import { Component, DestroyRef, signal, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
//import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LobbyService } from '../host/lobby.service';
import { MatListModule } from '@angular/material/list';
import { Lobby } from '../host/lobby';
import { WebSocketService } from './web-socket.service';
import { User } from '../host/user';

@Component({
  selector: 'app-game-page',
  templateUrl: 'game-page.html',
  styleUrls: ['./game-page.scss'],
  providers: [],
  imports: [MatCardModule, MatInputModule, MatFormFieldModule, MatSelectModule, FormsModule, MatCheckboxModule, MatListModule, MatFormFieldModule]
})
export class GameComponent implements OnInit {
  webSocketService = inject(WebSocketService);
  LobbyService = inject(LobbyService);
  tempResponse: string = 'bleh';
  round: number = 0;
  lobbyId: string = '';
  userId: string = '';
  nameData = signal<Lobby>(null);
  LobbySignal = signal<Lobby | null>(null);
  userNames = signal<Map<string, string>>(new Map());
  error = signal({help: 'Error loading game', httpResponse: 'Error loading game', message: 'Error'});
  game = signal<Lobby | null>(null);
  user = signal<User | null>(null);
  tempUser;
  constructor(
    private route: ActivatedRoute,
    private httpClient: HttpClient,
    private snackBar: MatSnackBar,
    private destroyRef: DestroyRef,
    private lobbyService: LobbyService,
    private router: Router,
  ) {
    console.log("auoduoawdguioawguiodg");
    this.LobbyService.getUserById(this.route.snapshot.params['uid']).subscribe(
      (response) => {
        console.log(response._id);
        this.user.set(response);
      });
    this.LobbyService.getLobbyById(this.route.snapshot.params['id']).subscribe(
      (response) => {
        console.log("auoduoawdguioawguiodg");
        console.log(response._id);
        this.game.set(response);
      });

    this.webSocketService.getMessage().subscribe((message: unknown) => {
      const msg = message as {
        type?: string;
        lobbyId?: string;
        userName?: string;
      };
      // This comment and much of how the websockets stuff works comes from
      // https://github.com/UMM-CSci-3601-F24/it-3-mary-shellys-cool-1918-howard-frankendogs-football-team/tree/main
      // "all of these are optional to allow heartbeat messages to pass through",
      // but I (KK) haven't done anything with heartbeat stuff yet... apparently it helps keep things connected

      if (this.game()) { // only update a game if this component has a game object already in view
        if (
        // The websocket message is about adding a player and refers to
        // the game this GameComponent is displaying
          msg.type === 'ADD_PLAYER' &&
          msg.lobbyId === this.lobbyId
        ) {
          console.log(msg.userName);
          console.log("client received broadcast for game: " + msg.userName+ " to add: " + msg.lobbyId);
          this.LobbyService.getUserById(msg.userName).subscribe(
            (response) => {
              console.log(response._id);
              this.user.set(response);
            });
          this.userNames().set(msg.userName, this.user().userName);
          console.log(this.userNames().get(msg.userName));
          this.game.update(currentLobby => ({...currentLobby, userIDs: [...currentLobby.userIDs, this.lobbyId] }));
          console.log("GameComponent: " + this.game + " added player: " + msg.userName);
          //
          // Google Generative AI with prompt/search: "angular 19 update a property of a signal where the
          // property is an array, without changing the object directly"
          // implementation that could cause it not to work as expected. Here are some areas to investigate and suggestions for debugging:
          // told me: The update method receives the current value of the signal.
          // A new object is then created, with the players array being replaced by a new array.
          // This new array is created by spreading the old array and adding a new element,
          // ensuring that the original array is not modified.
          //
          // Basically, the update says, "Hey, you have access to the old game as it was...
          // I want you to keep all the old stuff from that game, but update the players array
          // to be a new array that includes all the old players plus the new player",
          // which ensures *immutability*, which is crucial for Angular signals to detect changes.
          // (I previously was editing the old array more directly using 'push'.)
        }
      }
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap: ParamMap) => {
      this.lobbyId = paramMap.get('id') || '';
      this.userId = paramMap.get('uid') || '';
      this.fetchRound();
    });
    this.lobbyId = this.route.snapshot.params['id'] || '';
    this.userId = this.route.snapshot.params['uid'] || '';
    this.fetchRound();

    this.lobbyService.getLobbyById(this.lobbyId).subscribe((gameData) => {
      this.nameData.set(gameData);

      // Fetch user names for all user IDs in the lobby
      if (gameData.userIDs) {
        gameData.userIDs.forEach((userId: string) => {
          this.lobbyService.getUserById(userId).subscribe((user) => {
            const userMap = this.userNames();
            userMap.set(userId, user.userName);
            this.userNames.set(userMap); // Update the signal
          });
        });
      }
    });

  }

  fetchRound() {
    this.lobbyService.getLobbyRound(this.lobbyId).subscribe({
      next: (round) => this.round = round,
      error: (err) => console.error('Failed to fetch round:', err)
    });
  }

  incrementRound() {
    this.lobbyService.incrementLobbyRound(this.lobbyId).subscribe({
      next: (round) => this.round = round,
      error: (err) => console.error('Failed to increment round:', err)
    });
  }

  fetchUserName(id: string): string {
    if(id == 'Unknown User') {
      console.log(id);
    }
    return this.userNames().get(id) || 'Unknown User';
  }
}
