import { Component } from '@angular/core';
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
      MatButtonModule,
    ],
  templateUrl: './join.component.html',
  styleUrl: './join.component.scss'
})
export class JoinComponent {

  userForm = new FormGroup({
    // We allow alphanumeric input and limit the length for a lobby id.
    userName: new FormControl('', Validators.compose([
      Validators.required,
      Validators.minLength(2),
      // length of the player name must be 2-100 characters
      Validators.maxLength(100),
    ])),
  });

  readonly joinLobbyValidationMessages = {
    userName: [
      {type: 'required', message: 'Player name is required'},
      {type: 'minlength', message: 'Name must be at least 2 characters long'},
      {type: 'maxlength', message: 'Name cannot be more than 100 characters long'},
    ],
  };

  constructor(
    private webSocketService: WebSocketService,
    private lobbyService: LobbyService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute) {
  }

  formControlHasError(controlName: string): boolean {
    return this.userForm.get(controlName).invalid &&
      (this.userForm.get(controlName).dirty || this.userForm.get(controlName).touched);
  }

  getErrorMessage(name: keyof typeof this.joinLobbyValidationMessages): string {
    for(const {type, message} of this.joinLobbyValidationMessages[name]) {
      if (this.userForm.get(name).hasError(type)) {
        return message;
      }
    }
    return 'Unknown error';
  }

  submitForm() {

    console.log('Lobby ID:', this.userForm.value.userName);
    this.lobbyService.createUser(this.userForm.value).subscribe({
      next: (newId) => {
        this.snackBar.open(
          `Joined lobby with id: ${this.userForm.value.userName} + ${newId}`,
          null,
          { duration: 5000 }
        );
        this.router.navigate(['/specify/', newId]);
      },
      error: err => {
        if (err.status === 400) {
          this.snackBar.open(
            `Tried to join an illegal lobby – Error Code: ${err.status}\nMessage: ${err.message}`,
            'OK',
            { duration: 1 }
          );
          this.userForm.controls['userName'].setErrors({ badRequest: err.message });
        } else if (err.status === 500) {
          this.snackBar.open(
            `The server failed to process your request to join a lobby. Is the server up? – Error Code: ${err.status}\nMessage: ${err.message}`,
            'OK',
            { duration: 1 }
          );
          this.userForm.controls['userName'].setErrors({ serverError: err.message });
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
      userName: this.userForm.value.userName,
      lobbyId: this.route.snapshot.params['id'],
    };

    this.webSocketService.sendMessage(message);
  }
}
