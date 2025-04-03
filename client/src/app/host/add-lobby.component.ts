import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { LobbyService } from './lobby.service';

@Component({
  selector: 'app-add-lobby',
  templateUrl: './add-lobby.component.html',
  styleUrls: ['./add-lobby.component.scss'],
  imports: [FormsModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, MatButtonModule]
})

export class AddLobbyComponent {

  joinId = "";
  addLobbyForm = new FormGroup({
    // We allow alphanumeric input and limit the length for name.
    lobbyName: new FormControl('', Validators.compose([
      Validators.required,
      Validators.minLength(2),
      // In the real world you'd want to be very careful about having
      // an upper limit like this because people can sometimes have
      // very long names. This demonstrates that it's possible, though,
      // to have maximum length limits.
      Validators.maxLength(50),
      (fc) => {
        if (fc.value.toLowerCase() === 'abc123' || fc.value.toLowerCase() === '123abc') {
          return ({existingName: true});
        } else {
          return null;
        }
      },
    ])),
    round: new FormControl(0, Validators.compose([Validators.required])),
  });


  // We can only display one error at a time,
  // the order the messages are defined in is the order they will display in.
  readonly addLobbyValidationMessages = {
    lobbyName: [
      {type: 'required', message: 'Lobby Name is required'},
      {type: 'minlength', message: 'Name must be at least 2 characters long'},
      {type: 'maxlength', message: 'Name cannot be more than 50 characters long'},
      {type: 'existingName', message: 'Name has already been taken'}
    ],
    round: [
      {type: 'required', message: 'Round Count must exist'},
    ]
  };

  constructor(
    private lobbyService: LobbyService,
    private snackBar: MatSnackBar,
    private router: Router) {
  }

  formControlHasError(controlName: string): boolean {
    return this.addLobbyForm.get(controlName).invalid &&
      (this.addLobbyForm.get(controlName).dirty || this.addLobbyForm.get(controlName).touched);
  }

  getErrorMessage(name: keyof typeof this.addLobbyValidationMessages): string {
    for(const {type, message} of this.addLobbyValidationMessages[name]) {
      if (this.addLobbyForm.get(name).hasError(type)) {
        return message;
      }
    }
    return 'Unknown error';
  }

  submitForm() {
    this.lobbyService.addLobby(this.addLobbyForm.value).subscribe({
      next: (newId) => {
        console.log(newId);
        this.snackBar.open(
          `Added lobby ${this.addLobbyForm.value.round}`,
          null,
          { duration: 2000 }
        );
        this.router.navigate(['/game/', newId]);
      },
      error: err => {
        if (err.status === 400) {
          this.snackBar.open(
            `Tried to add an illegal new lobby – Error Code: ${err.status}\nMessage: ${err.message}`,
            'OK',
            { duration: 5000 }
          );
        } else if (err.status === 500) {
          this.snackBar.open(
            `The server failed to process your request to add a new lobby. Is the server up? – Error Code: ${err.status}\nMessage: ${err.message}`,
            'OK',
            { duration: 5000 }
          );
        } else {
          this.snackBar.open(
            `An unexpected error occurred – Error Code: ${err.status}\nMessage: ${err.message}`,
            'OK',
            { duration: 5000 }
          );
        }
      },
    });
  }

}
