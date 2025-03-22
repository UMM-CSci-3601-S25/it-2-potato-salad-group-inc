import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Router} from '@angular/router';
import { LobbyService } from '../host/lobby.service';
import { Lobby } from '../host/lobby';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-join-component',
  templateUrl: 'join.component.html',
  styleUrls: ['./join.component.scss'],
  imports: [MatCardModule, NgFor, NgIf]
})


export class JoinComponent implements OnInit {
  lobbies: Lobby[] = [];

  constructor(private router: Router, private lobbyService: LobbyService) {}

  ngOnInit(): void {
    this.lobbyService.getLobbies().subscribe(lobbies => {
      this.lobbies = lobbies;
    });
  }
}
