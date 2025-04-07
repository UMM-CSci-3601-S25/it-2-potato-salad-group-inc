import { Component, DestroyRef, signal, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
//import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
  lobbyId: string = ''; // Replace with actual lobby ID
  error = signal({help: 'Error loading game', httpResponse: 'Error loading game', message: 'Error'});
  game = toSignal(
    this.route.paramMap.pipe(
      // Map the paramMap into the id
      map((paramMap: ParamMap) => paramMap.get('id')),
      switchMap((id: string) => this.lobbyService.getLobbyById(id)),
      catchError((_err) => {
        this.error.set({
          help: 'There was a problem loading the game – try again.',
          httpResponse: _err.message,
          message: _err.error?.title,
        });
        return of();
      })
    ));


  submission = "";
  username = "Steady Roosevelt";

  constructor(
    private route: ActivatedRoute,
    private httpClient: HttpClient,
    private snackBar: MatSnackBar,
    private destroyRef: DestroyRef,
    private lobbyService: LobbyService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap: ParamMap) => {
      this.lobbyId = paramMap.get('id') || '';
      this.fetchRound();
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
}
