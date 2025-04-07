import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AppComponent } from 'src/app/app.component';
import { Lobby } from 'src/app/host/lobby';
import { LobbyService } from 'src/app/host/lobby.service';

/**
 * A "mock" version of the `LobbyService` that can be used to test components
 * without having to create an actual service. It needs to be `Injectable` since
 * that's how services are typically provided to components.
 */
@Injectable({
  providedIn: AppComponent
})
export class MockLobbyService extends LobbyService {
  static testLobbies: Lobby[] = [
    {
      _id: '1',
      userIDs: ["Bruh"],
      lobbyName: 'Cards Against Humanity',
      round: 0,
    },
    {
      _id: '2',
      userIDs: ["Bruh"],
      lobbyName: 'Apples to Apples',
      round: 1,
    }
  ];

  constructor() {
    super(null);
  }

  // skipcq: JS-0105
  // It's OK that the `_filters` argument isn't used here, so we'll disable
  // this warning for just his function.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getLobbies(filters?: { lobbyName?: string}): Observable<Lobby[]> {
    // Our goal here isn't to test (and thus rewrite) the service, so we'll
    // keep it simple and just return the test users regardless of what
    // filters are passed in.
    //
    // The `of()` function converts a regular object or value into an
    // `Observable` of that object or value.
    return of(MockLobbyService.testLobbies);
  }

  // skipcq: JS-0105
  getLobbyById(id: string): Observable<Lobby> {
    // If the specified ID is for one of the first two test users,
    // return that user, otherwise return `null` so
    // we can test illegal user requests.
    // If you need more, just add those in too.
    if (id === MockLobbyService.testLobbies[0]._id) {
      return of(MockLobbyService.testLobbies[0]);
    } else if (id === MockLobbyService.testLobbies[1]._id) {
      return of(MockLobbyService.testLobbies[1]);
    } else {
      return of(null);
    }
  }

  getLobbyRound( lobbyId: string): Observable<number> {
    if (lobbyId === MockLobbyService.testLobbies[0]._id) {
      return of(MockLobbyService.testLobbies[0].round);
    } else if (lobbyId === MockLobbyService.testLobbies[1]._id) {
      return of(MockLobbyService.testLobbies[1].round);
    } else {
      return of(null);
    }
  }

  incrementLobbyRound(lobbyId: string): Observable<number> {
    if (lobbyId === MockLobbyService.testLobbies[0]._id) {
      MockLobbyService.testLobbies[0].round++;
      return of(MockLobbyService.testLobbies[0].round);
    } else if (lobbyId === MockLobbyService.testLobbies[1]._id) {
      MockLobbyService.testLobbies[1].round++;
      return of(MockLobbyService.testLobbies[1].round);
    } else {
      return of(null);
    }
  }
}
