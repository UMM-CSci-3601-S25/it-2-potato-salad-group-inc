import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Lobby } from './lobby';

/**
 * Service that provides the interface for getting information
 * about `Lobbies` from the server.
 */
@Injectable({
  providedIn: 'root'
})
export class LobbyService {
  // The URL for the lobbies part of the server API.
  readonly lobbyUrl: string = `${environment.apiUrl}lobbies`;

  private readonly lobbyNameKey = 'lobbyName';
  private readonly userIDsKey = 'userIDs';

  // The private `HttpClient` is *injected* into the service
  // by the Angular framework. This allows the system to create
  // only one `HttpClient` and share that across all services
  // that need it, and it allows us to inject a mock version
  // of `HttpClient` in the unit tests so they don't have to
  // make "real" HTTP calls to a server that might not exist or
  // might not be currently running.
  constructor(private httpClient: HttpClient) {
  }

  /**
   * Get all the lobbies from the server, filtered by the information
   * in the `filters` map.
   *
   * It would be more consistent with `LobbyListComponent` if this
   * only supported filtering on age and role, and left company to
   * just be in `filterLobbies()` below. We've included it here, though,
   * to provide some additional examples.
   *
   * @param filters a map that allows us to specify a target role, age,
   *  or company to filter by, or any combination of those
   * @returns an `Observable` of an array of `Lobbies`. Wrapping the array
   *  in an `Observable` means that other bits of of code can `subscribe` to
   *  the result (the `Observable`) and get the results that come back
   *  from the server after a possibly substantial delay (because we're
   *  contacting a remote server over the Internet).
   */
  getLobbies(filters?: { lobbyName?: string}): Observable<Lobby[]> {
    // `HttpParams` is essentially just a map used to hold key-value
    // pairs that are then encoded as "?key1=value1&key2=value2&…" in
    // the URL when we make the call to `.get()` below.
    let httpParams: HttpParams = new HttpParams();
    if (filters) {
      if (filters.lobbyName) {
        httpParams = httpParams.set(this.lobbyNameKey, filters.lobbyName);
      }
    }
    // Send the HTTP GET request with the given URL and parameters.
    // That will return the desired `Observable<Lobby[]>`.
    return this.httpClient.get<Lobby[]>(this.lobbyUrl, {
      params: httpParams,
    });
  }

  /**
   * Get the `Lobby` with the specified ID.
   *
   * @param id the ID of the desired lobby
   * @returns an `Observable` containing the resulting lobby.
   */
  getLobbyById(id: string): Observable<Lobby> {
    // The input to get could also be written as (this.lobbyUrl + '/' + id)
    return this.httpClient.get<Lobby>(`${this.lobbyUrl}/${id}`);
  }

  getLobbyRound( lobbyId: string): Observable<number> {
    return this.httpClient.get<Lobby>(`${this.lobbyUrl}/${lobbyId}`).pipe(
      map((lobby: Lobby) => lobby.round)
    );
  }

  incrementLobbyRound(lobbyId: string): Observable<number> {
    return this.httpClient.post<{ round: number }>(`${this.lobbyUrl}/${lobbyId}/round/increment`, {}).pipe(
      map(response => response.round)
    );
  }

  getUserScore(lobbyId: string, username: string): Observable<number> {
    return this.httpClient.get<{ score: number }>(`${this.lobbyUrl}/${lobbyId}/users/${username}/score`).pipe(
      map(response => response.score)
    );
  }

  incrementUserScore(lobbyId: string, username: string): Observable<number> {
    return this.httpClient.post<{ score: number }>(`${this.lobbyUrl}/${lobbyId}/users/${username}/score/increment`, {}).pipe(
      map(response => response.score)
    );
  }

  /**
   * A service method that filters an array of `Lobby` using
   * the specified filters.
   *
   * Note that the filters here support partial matches. Since the
   * matching is done locally we can afford to repeatedly look for
   * partial matches instead of waiting until we have a full string
   * to match against.
   *
   * @param lobbies the array of `Lobbies` that we're filtering
   * @param filters the map of key-value pairs used for the filtering
   * @returns an array of `Lobbies` matching the given filters
   */
  filterLobbies(lobbies: Lobby[], filters: { lobbyName?: string}): Lobby[] { // skipcq: JS-0105
    let filteredLobbies = lobbies;

    // Filter by lobbyName
    if (filters.lobbyName) {
      filters.lobbyName = filters.lobbyName.toLowerCase();
      filteredLobbies = filteredLobbies.filter(lobby => lobby.lobbyName.toLowerCase().indexOf(filters.lobbyName) !== -1);
    }

    return filteredLobbies;
  }

  addLobby(newLobby: Partial<Lobby>): Observable<string> {
    // Send post request to add a new lobby with the lobby data as the body.
    // `res.id` should be the MongoDB ID of the newly added `Lobby`.
    return this.httpClient.post<{id: string}>(this.lobbyUrl, newLobby).pipe(map(response => response.id));
  }
}
