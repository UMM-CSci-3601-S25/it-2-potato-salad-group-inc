import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Game } from '../game';



@Component({
  selector: 'app-landing-page',
  templateUrl: 'landing-page.html',
  styleUrls: ['./landing-page.scss'],
  providers: [],
  imports: [MatCardModule, RouterLink, MatInputModule, MatFormFieldModule, MatSelectModule]
})
export class HomeComponent {
  constructor(private httpClient: HttpClient) {
    const randomNumber: number = Math.random();
    console.info(randomNumber);
    this.defaultUsername = "Willy";
  }

  defaultUsername = "Willy";

  createGame() {
    console.info("createGame() called");
    // const gameCode = "1";//this.httpClient.get<number>('/api/games/number');
    const newGame: Partial<Game> = { };
    this.httpClient.post<{id: string}>('/api/game/new', newGame);
  }
}
