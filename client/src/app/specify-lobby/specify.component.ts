import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LobbyService } from '../host/lobby.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { WebSocketService } from '../game-page/web-socket.service';


@Component({
  selector: 'app-join',
  imports:
    [
      FormsModule,
      ReactiveFormsModule,
      MatCardModule,
      MatFormFieldModule,
      MatInputModule,
      MatButtonModule
    ],
  templateUrl: './specify.component.html',
  styleUrl: './specify.component.scss'
})
export class SpecifyComponent {
  error = signal({help: 'Error loading game', httpResponse: 'Error loading game', message: 'Error'});
  joinLobbyForm = new FormGroup({
    // We allow alphanumeric input and limit the length for a lobby id.
    lobbyId: new FormControl('', Validators.compose([
      Validators.required,
      Validators.minLength(24),
      // length of the game id will be 24
      Validators.maxLength(24),
      Validators.pattern('^[A-Fa-f0-9]{24}$')
    ])),
  });

  readonly joinLobbyValidationMessages = {
    lobbyId: [
      {type: 'required', message: 'Game ID is required'},
      {type: 'minlength', message: 'Game ID must be at least 24 characters long'},
      {type: 'maxlength', message: 'Game ID cannot be more than 24 characters long'},
      {type: 'pattern', message: 'Game ID must be a 24 character hexadecimal string'},
      {type: 'serverError', message: 'Game ID not found -- try a different Game ID'},
      {type: 'badRequest', message: 'Bad request -- make sure the Game ID is a valid hexadecimal string'}
    ],
  };

  constructor(
    private route: ActivatedRoute,
    private webSocketService: WebSocketService,
    private lobbyService: LobbyService,
    private snackBar: MatSnackBar,
    private router: Router) {
  }

  lobbyID = signal(this.route.snapshot.params['id'] || null);

  formControlHasError(controlName: string): boolean {
    return this.joinLobbyForm.get(controlName).invalid &&
      (this.joinLobbyForm.get(controlName).dirty || this.joinLobbyForm.get(controlName).touched);
  }

  getErrorMessage(name: keyof typeof this.joinLobbyValidationMessages): string {
    for(const {type, message} of this.joinLobbyValidationMessages[name]) {
      if (this.joinLobbyForm.get(name).hasError(type)) {
        return message;
      }
    }
    return 'Unknown error';
  }

  submitForm() {
    this.lobbyService.addPlayer(this.joinLobbyForm.value.lobbyId,  this.route.snapshot.params['uid']).subscribe({
      next: (newId) => {
        this.snackBar.open(
          `Joined lobby with id: ${this.joinLobbyForm.value.lobbyId} + ${newId}`,
          null,
          { duration: 5000 }
        );
        this.onPlayerAdd();
        this.router.navigate(['/game/', this.joinLobbyForm.value.lobbyId, this.route.snapshot.params['uid']]);
      },
      error: err => {
        if (err.status === 400) {
          this.snackBar.open(
            `Tried to join an illegal lobby – Error Code: ${err.status}\nMessage: ${err.message}`,
            'OK',
            { duration: 1 }
          );
          this.joinLobbyForm.controls['lobbyId'].setErrors({ badRequest: err.message });
        } else if (err.status === 500) {
          this.snackBar.open(
            `The server failed to process your request to join a lobby. Is the server up? – Error Code: ${err.status}\nMessage: ${err.message}`,
            'OK',
            { duration: 1 }
          );
          this.joinLobbyForm.controls['lobbyId'].setErrors({ serverError: err.message });
        } else {
          this.snackBar.open(
            `An unexpected error occurred – Error Code: ${err.status}\nMessage: ${err.message}`,
            'OK',
            { duration: 1 }
          );
        }
      },
    });
  }

  onPlayerAdd() {
    const message = {
      type: 'ADD_PLAYER',
      lobbyId: this.joinLobbyForm.value.lobbyId,
      playerName: this.route.snapshot.params['uid'],
    };

    this.webSocketService.sendMessage(message);
  }
}
