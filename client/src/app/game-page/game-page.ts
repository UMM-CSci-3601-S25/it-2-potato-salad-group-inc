import { Component, DestroyRef, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
//import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Game } from '../game';
import { catchError, map, switchMap } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LobbyService } from '../host/lobby.service';

@Component({
  selector: 'app-game-page',
  templateUrl: 'game-page.html',
  styleUrls: ['./game-page.scss'],
  providers: [],
  imports: [MatCardModule, MatInputModule, MatFormFieldModule, MatSelectModule, FormsModule, MatCheckboxModule]
})
export class GameComponent implements OnInit {
  round: number = 0;
  score: number = 0;
  lobbyId: string = ''; // Replace with actual lobby ID
  game = toSignal(
    this.route.paramMap.pipe(
      // Map the paramMap into the id
      map((paramMap: ParamMap) => paramMap.get('id')),
      switchMap((id: string) => this.httpClient.get<Game>(`/api/game/${id}`)),
      catchError((_err) => {
        this.error.set({
          help: 'There was a problem loading the game – try again.',
          httpResponse: _err.message,
          message: _err.error?.title,
        });
        return of();
      })

    ));
  error = signal({help: '', httpResponse: '', message: ''});
  submit() {
    this.httpClient.put<Game>('/api/game/submit', {prompt: this.submission});
  }

  submission = "";
  username = "Steady Roosevelt";

  constructor(
    private route: ActivatedRoute,
    private httpClient: HttpClient,
    private snackBar: MatSnackBar,
    private destroyRef: DestroyRef,
    private lobbyService: LobbyService
  ) {}

  ngOnInit() {
    this.lobbyId = this.route.snapshot.params['id'] || '';
    this.fetchRound();
    this.fetchScore();
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

  fetchScore() {
    // Fetch the score from the server (implement this in your service)
    this.lobbyService.getUserScore(this.lobbyId, this.username).subscribe({
      next: (score) => this.score = score,
      error: (err) => console.error('Failed to fetch score:', err)
    });
  }

  incrementScore() {
    // Increment the score on the server (implement this in your service)
    this.lobbyService.incrementUserScore(this.lobbyId, this.username).subscribe({
      next: (score) => this.score = score,
      error: (err) => console.error('Failed to increment score:', err)
    });
  }
}
