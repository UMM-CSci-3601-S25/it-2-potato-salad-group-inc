import { HttpClient, HttpParams, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { Lobby } from './lobby';
import { LobbyService } from './lobby.service';

describe('LobbyService', () => {
  // A small collection of test lobbies
  const testLobbies: Lobby[] = [
    {
      _id: 'lobbyID_1',
      lobbyName: 'CardsAgainstCows',
      userIDs: ['hi', 'goddbye'],
    },
    {
      _id: 'lobbyID_2',
      lobbyName: 'CardsAgainstCows',
      userIDs: ['hdbnfhi', 'goddbye'],
    },
    {
      _id: 'lobbyID_3',
      lobbyName: 'CardsAgainstFrogs',
      userIDs: ['hi', 'goddbye'],
    }
  ];
  let lobbyService: LobbyService;
  // These are used to mock the HTTP requests so that we (a) don't have to
  // have the server running and (b) we can check exactly which HTTP
  // requests were made to ensure that we're making the correct requests.
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    // Set up the mock handling of the HTTP requests
    TestBed.configureTestingModule({
      imports: [],
      providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    });
    // Construct an instance of the service with the mock
    // HTTP client.
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    lobbyService = new LobbyService(httpClient);
  });

  afterEach(() => {
    // After every test, assert that there are no more pending requests.
    httpTestingController.verify();
  });

  describe('When getLobbies() is called with no parameters', () => {
    /* We really don't care what `getLobbies()` returns. Since all the
    * filtering (when there is any) is happening on the server,
    * `getLobbies()` is really just a "pass through" that returns whatever it receives,
    * without any "post processing" or manipulation. The test in this
    * `describe` confirms that the HTTP request is properly formed
    * and sent out in the world, but we don't _really_ care about
    * what `getLobbies()` returns as long as it's what the HTTP
    * request returns.
    *
    * So in this test, we'll keep it simple and have
    * the (mocked) HTTP request return the entire list `testLobbies`
    * even though in "real life" we would expect the server to
    * return return a filtered subset of the lobbies. Furthermore, we
    * won't actually check what got returned (there won't be an `expect`
    * about the returned value). Since we don't use the returned value in this test,
    * It might also be fine to not bother making the mock return it.
    */
    it('calls `api/lobbies`', waitForAsync(() => {
      // Mock the `httpClient.get()` method, so that instead of making an HTTP request,
      // it just returns our test data.
      const mockedMethod = spyOn(httpClient, 'get').and.returnValue(of(testLobbies));

      // Call `lobbyService.getLobbies()` and confirm that the correct call has
      // been made with the correct arguments.
      //
      // We have to `subscribe()` to the `Observable` returned by `getLobbies()`.
      // The `lobbies` argument in the function is the array of Lobbies returned by
      // the call to `getLobbies()`.
      lobbyService.getLobbies().subscribe(() => {
        // The mocked method (`httpClient.get()`) should have been called
        // exactly one time.
        expect(mockedMethod)
          .withContext('one call')
          .toHaveBeenCalledTimes(1);
        // The mocked method should have been called with two arguments:
        //   * the appropriate URL ('/api/lobbies' defined in the `LobbyService`)
        //   * An options object containing an empty `HttpParams`
        expect(mockedMethod)
          .withContext('talks to the correct endpoint')
          .toHaveBeenCalledWith(lobbyService.lobbyUrl, { params: new HttpParams() });
      });
    }));
  });

  describe('When getLobbies() is called with parameters, it correctly forms the HTTP request (Javalin/Server filtering)', () => {
    /*
    * As in the test of `getLobbies()` that takes in no filters in the params,
    * we really don't care what `getLobbies()` returns in the cases
    * where the filtering is happening on the server. Since all the
    * filtering is happening on the server, `getLobbies()` is really
    * just a "pass through" that returns whatever it receives, without
    * any "post processing" or manipulation. So the tests in this
    * `describe` block all confirm that the HTTP request is properly formed
    * and sent out in the world, but don't _really_ care about
    * what `getLobbies()` returns as long as it's what the HTTP
    * request returns.
    *
    * So in each of these tests, we'll keep it simple and have
    * the (mocked) HTTP request return the entire list `testLobbies`
    * even though in "real life" we would expect the server to
    * return return a filtered subset of the lobbies. Furthermore, we
    * won't actually check what got returned (there won't be an `expect`
    * about the returned value).
    */

    it('correctly calls api/lobbies with filter parameter \'admin\'', () => {
      const mockedMethod = spyOn(httpClient, 'get').and.returnValue(of(testLobbies));

      lobbyService.getLobbies({ lobbyName: 'CardsAgainstCows' }).subscribe(() => {
        expect(mockedMethod)
          .withContext('one call')
          .toHaveBeenCalledTimes(1);
        // The mocked method should have been called with two arguments:
        //   * the appropriate URL ('/api/lobbies' defined in the `LobbyService`)
        //   * An options object containing an `HttpParams` with the `role`:`admin`
        //     key-value pair.
        expect(mockedMethod)
          .withContext('talks to the correct endpoint')
          .toHaveBeenCalledWith(lobbyService.lobbyUrl, { params: new HttpParams().set('lobbyName', 'CardsAgainstCows') });
      });
    });

    describe('When getLobbyById() is given an ID', () => {
    /* We really don't care what `getLobbyById()` returns. Since all the
    * interesting work is happening on the server, `getLobbyById()`
    * is really just a "pass through" that returns whatever it receives,
    * without any "post processing" or manipulation. The test in this
    * `describe` confirms that the HTTP request is properly formed
    * and sent out in the world, but we don't _really_ care about
    * what `getLobbyById()` returns as long as it's what the HTTP
    * request returns.
    *
    * So in this test, we'll keep it simple and have
    * the (mocked) HTTP request return the `targetLobby`
    * Furthermore, we won't actually check what got returned (there won't be an `expect`
    * about the returned value). Since we don't use the returned value in this test,
    * It might also be fine to not bother making the mock return it.
    */
      it('calls api/lobbies/id with the correct ID', waitForAsync(() => {
        // We're just picking a Lobby "at random" from our little
        // set of Lobbies up at the top.
        const targetLobby: Lobby = testLobbies[1];
        const targetId: string = targetLobby._id;

        // Mock the `httpClient.get()` method so that instead of making an HTTP request
        // it just returns one lobby from our test data
        const mockedMethod = spyOn(httpClient, 'get').and.returnValue(of(targetLobby));

        // Call `lobbyService.getLobby()` and confirm that the correct call has
        // been made with the correct arguments.
        //
        // We have to `subscribe()` to the `Observable` returned by `getLobbyById()`.
        // The `lobby` argument in the function below is the thing of type Lobby returned by
        // the call to `getLobbyById()`.
        lobbyService.getLobbyById(targetId).subscribe(() => {
          // The `Lobby` returned by `getLobbyById()` should be targetLobby, but
          // we don't bother with an `expect` here since we don't care what was returned.
          expect(mockedMethod)
            .withContext('one call')
            .toHaveBeenCalledTimes(1);
          expect(mockedMethod)
            .withContext('talks to the correct endpoint')
            .toHaveBeenCalledWith(`${lobbyService.lobbyUrl}/${targetId}`);
        });
      }));
    });

    describe('Filtering on the client using `filterLobbies()` (Angular/Client filtering)', () => {
    /*
     * Since `filterLobbies` actually filters "locally" (in
     * Angular instead of on the server), we do want to
     * confirm that everything it returns has the desired
     * properties. Since this doesn't make a call to the server,
     * though, we don't have to use the mock HttpClient and
     * all those complications.
     */
      it('filters by name', () => {
        const lobbyName = 'i';
        const filteredLobbies = lobbyService.filterLobbies(testLobbies, { lobbyName: lobbyName });
        // There should be two lobbies with an 'i' in their
        // name: Chris and Jamie.
        expect(filteredLobbies.length).toBe(3);
        // Every returned lobby's name should contain an 'i'.
        filteredLobbies.forEach(lobby => {
          expect(lobby.lobbyName.indexOf(lobbyName)).toBeGreaterThanOrEqual(0);
        });
      });
    });


    describe('Adding a lobby using `addLobby()`', () => {
      it('talks to the right endpoint and is called once', waitForAsync(() => {
        const lobby_id = 'pat_id';
        const expected_http_response = { id: lobby_id } ;

        // Mock the `httpClient.addLobby()` method, so that instead of making an HTTP request,
        // it just returns our expected HTTP response.
        const mockedMethod = spyOn(httpClient, 'post')
          .and
          .returnValue(of(expected_http_response));

        lobbyService.addLobby(testLobbies[1]).subscribe((new_lobby_id) => {
          expect(new_lobby_id).toBe(lobby_id);
          expect(mockedMethod)
            .withContext('one call')
            .toHaveBeenCalledTimes(1);
          expect(mockedMethod)
            .withContext('talks to the correct endpoint')
            .toHaveBeenCalledWith(lobbyService.lobbyUrl, testLobbies[1]);
        });
      }));
    });
  })
});
