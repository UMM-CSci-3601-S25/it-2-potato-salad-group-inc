package umm3601.lobby;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.AfterAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.Mockito;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.MockitoAnnotations;

import com.mongodb.MongoClientSettings;
import com.mongodb.ServerAddress;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import static com.mongodb.client.model.Filters.eq;

import io.javalin.Javalin;
import io.javalin.http.BadRequestResponse;
import io.javalin.http.Context;
import io.javalin.http.HttpStatus;
import io.javalin.http.NotFoundResponse;
import io.javalin.json.JavalinJackson;
import io.javalin.validation.BodyValidator;
import io.javalin.validation.ValidationException;
public class LobbyControllerSpec {
// An instance of the controller we're testing that is prepared in
  // `setupEach()`, and then exercised in the various tests below.
  private LobbyController lobbyController;

  // A Mongo object ID that is initialized in `setupEach()` and used
  // in a few of the tests. It isn't used all that often, though,
  // which suggests that maybe we should extract the tests that
  // care about it into their own spec file?
  private ObjectId appleId;

  // The client and database that will be used
  // for all the tests in this spec file.
  private static MongoClient mongoClient;
  private static MongoDatabase db;

  // Used to translate between JSON and POJOs.
  private static JavalinJackson javalinJackson = new JavalinJackson();

  @Mock
  private Context ctx;

  @Captor
  private ArgumentCaptor<ArrayList<Lobby>> lobbyArrayListCaptor;

  @Captor
  private ArgumentCaptor<Lobby> lobbyCaptor;

  @Captor
  private ArgumentCaptor<Map<String, String>> mapCaptor;

  @Captor
  private ArgumentCaptor<Integer> roundCaptor;

  /**
   * Sets up (the connection to the) DB once; that connection and DB will
   * then be (re)used for all the tests, and closed in the `teardown()`
   * method. It's somewhat expensive to establish a connection to the
   * database, and there are usually limits to how many connections
   * a database will support at once. Limiting ourselves to a single
   * connection that will be shared across all the tests in this spec
   * file helps both speed things up and reduce the load on the DB
   * engine.
   */
  @BeforeAll
  static void setupAll() {
    String mongoAddr = System.getenv().getOrDefault("MONGO_ADDR", "localhost");

    mongoClient = MongoClients.create(
        MongoClientSettings.builder()
            .applyToClusterSettings(builder -> builder.hosts(Arrays.asList(new ServerAddress(mongoAddr))))
            .build());
    db = mongoClient.getDatabase("test");
  }

  @AfterAll
  static void teardown() {
    db.drop();
    mongoClient.close();
  }

  @BeforeEach
  void setupEach() throws IOException {
    // Reset our mock context and argument captor (declared with Mockito
    // annotations @Mock and @Captor)
    MockitoAnnotations.openMocks(this);

    // Setup database
    MongoCollection<Document> lobbyDocuments = db.getCollection("lobbies");
    lobbyDocuments.drop();
    List<Document> testLobbies = new ArrayList<>();
    testLobbies.add(
      new Document()
      .append("lobbyName", "Channel Orange")
      .append("lobbyIDs", null)
      .append("round", 0));

    testLobbies.add(
      new Document()
      .append("lobbyName", "You Will Never Know Why")
      .append("lobbyIDs", null)
      .append("round", 0));

    testLobbies.add(
      new Document()
      .append("lobbyName", "Imaginal Disk")
      .append("lobbyIDs", null)
      .append("round", 0));


    appleId = new ObjectId();
    Document apple = new Document()
        .append("_id", appleId)
        .append("lobbyName", "Shine On You Crazy Diamond")
        .append("lobbyIDs", null)
        .append("round", 1);

    lobbyDocuments.insertMany(testLobbies);
    lobbyDocuments.insertOne(apple);

    lobbyController = new LobbyController(db);
  }

  @Test
  void addsRoutes() {
    Javalin mockServer = mock(Javalin.class);
    lobbyController.addRoutes(mockServer);
    verify(mockServer, Mockito.atLeast(2)).get(any(), any());
    verify(mockServer, Mockito.atLeastOnce()).post(any(), any());
    verify(mockServer, Mockito.atLeastOnce()).delete(any(), any());

  }

  @Test
  void canGetAllLobbies() throws IOException {
    // When something asks the (mocked) context for the queryParamMap,
    // it will return an empty map (since there are no query params in
    // this case where we want all lobbies).
    when(ctx.queryParamMap()).thenReturn(Collections.emptyMap());

    // Now, go ahead and ask the lobbyController to getLobbies
    // (which will, indeed, ask the context for its queryParamMap)
    lobbyController.getLobbies(ctx);

    // We are going to capture an argument to a function, and the type of
    // that argument will be of type ArrayList<Lobby> (we said so earlier
    // using a Mockito annotation like this):
    // @Captor
    // private ArgumentCaptor<ArrayList<Lobby>> lobbyArrayListCaptor;
    // We only want to declare that captor once and let the annotation
    // help us accomplish reassignment of the value for the captor
    // We reset the values of our annotated declarations using the command
    // `MockitoAnnotations.openMocks(this);` in our @BeforeEach

    // Specifically, we want to pay attention to the ArrayList<Lobby> that
    // is passed as input when ctx.json is called --- what is the argument
    // that was passed? We capture it and can refer to it later.
    verify(ctx).json(lobbyArrayListCaptor.capture());
    verify(ctx).status(HttpStatus.OK);

    // Check that the database collection holds the same number of documents
    // as the size of the captured List<Lobby>
    assertEquals(
        db.getCollection("lobbies").countDocuments(),
        lobbyArrayListCaptor.getValue().size());
  }

  @Test
  void getLobbyWithExistentId() throws IOException {
    String id = appleId.toHexString();
    when(ctx.pathParam("id")).thenReturn(id);

    lobbyController.getLobby(ctx);

    verify(ctx).json(lobbyCaptor.capture());
    verify(ctx).status(HttpStatus.OK);
    assertEquals("Shine On You Crazy Diamond", lobbyCaptor.getValue().lobbyName);
    assertEquals(appleId.toHexString(), lobbyCaptor.getValue()._id);
  }

  @Test
  void getLobbyWithBadId() throws IOException {
    when(ctx.pathParam("id")).thenReturn("bad");

    Throwable exception = assertThrows(BadRequestResponse.class, () -> {
      lobbyController.getLobby(ctx);
    });

    assertEquals("The requested lobby id wasn't a legal Mongo Object ID.", exception.getMessage());
  }

  @Test
  void getLobbyWithNonexistentId() throws IOException {
    String id = "588935f5c668650dc77df581";
    when(ctx.pathParam("id")).thenReturn(id);

    Throwable exception = assertThrows(NotFoundResponse.class, () -> {
      lobbyController.getLobby(ctx);
    });

    assertEquals("The requested lobby was not found", exception.getMessage());
  }

  @Test
  void addLobby() throws IOException {
    // Create a new lobby to add
    Lobby newLobby = new Lobby();
    newLobby.userIDs = new String[] {"Potato", "Apple"};
    newLobby.lobbyName = "Test Lobby";

    // Use `javalinJackson` to convert the `Lobby` object to a JSON string representing that lobby.
    // This would be equivalent to:
    //   String testNewLobby = """
    //       {
    //         "name": "Test Lobby",
    //         "age": 25,
    //         "company": "testers",
    //         "email": "test@example.com",
    //         "role": "viewer"
    //       }
    //       """;
    // but using `javalinJackson` to generate the JSON avoids repeating all the field values,
    // which is then less error prone.
    String newLobbyJson = javalinJackson.toJsonString(newLobby, Lobby.class);


    // A `BodyValidator` needs
    //   - The string (`newLobbyJson`) being validated
    //   - The class (`Lobby.class) it's trying to generate from that string
    //   - A function (`() -> Lobby`) which "shows" the validator how to convert
    //     the JSON string to a `Lobby` object. We'll again use `javalinJackson`,
    //     but in the other direction.
    when(ctx.bodyValidator(Lobby.class))
      .thenReturn(new BodyValidator<Lobby>(newLobbyJson, Lobby.class,
                    () -> javalinJackson.fromJsonString(newLobbyJson, Lobby.class)));

    lobbyController.addNewLobby(ctx);
    verify(ctx).json(mapCaptor.capture());

    // Our status should be 201, i.e., our new lobby was successfully created.
    verify(ctx).status(HttpStatus.CREATED);

    // Verify that the lobby was added to the database with the correct ID
    Document addedLobby = db.getCollection("lobbies")
        .find(eq("_id", new ObjectId(mapCaptor.getValue().get("id")))).first();

    // Successfully adding the lobby should return the newly generated, non-empty
    // MongoDB ID for that lobby.
    assertNotEquals("", addedLobby.get("_id"));
    // The new lobby in the database (`addedLobby`) should have the same
    // field values as the lobby we asked it to add (`newLobby`).
    String compareUserIDs = "";
    for (int i = 0; i < newLobby.userIDs.length; i++) {
      if (i == 0) {
          compareUserIDs += newLobby.userIDs[i];

      } else {
        compareUserIDs += ", " + newLobby.userIDs[i];
      }
    }
    compareUserIDs = "[" + compareUserIDs + "]";
    assertEquals(compareUserIDs, addedLobby.get("userIDs").toString());

  }

  @Test
  void addLobbyWithoutName() throws IOException {
    String newLobbyJson = """
        {
          "userIDs": null
        }
        """;

    when(ctx.body()).thenReturn(newLobbyJson);
    when(ctx.bodyValidator(Lobby.class))
        .then(value -> new BodyValidator<Lobby>(newLobbyJson, Lobby.class,
                        () -> javalinJackson.fromJsonString(newLobbyJson, Lobby.class)));

    // This should now throw a `ValidationException` because
    // the JSON for our new user has no name.
    ValidationException exception = assertThrows(ValidationException.class, () -> {
      lobbyController.addNewLobby(ctx);
    });
    // This `ValidationException` was caused by a custom check, so we just get the message from the first
    // error (which is a `"REQUEST_BODY"` error) and convert that to a string with `toString()`. This gives
    // a `String` that has all the details of the exception, which we can make sure contains information
    // that would help a developer sort out validation errors.
    String exceptionMessage = exception.getErrors().get("REQUEST_BODY").get(0).toString();

    // The message should be the message from our code under test, which should also include some text
    // indicating that there was a missing user name.
    assertTrue(exceptionMessage.contains("non-empty lobby name"));
  }

  @Test
  void addEmptyNameLobby() throws IOException {
    String newLobbyJson = """
        {
          "lobbyName": "",
          "userIDs": null
        }
        """;

    when(ctx.body()).thenReturn(newLobbyJson);
    when(ctx.bodyValidator(Lobby.class))
        .then(value -> new BodyValidator<Lobby>(newLobbyJson, Lobby.class,
                        () -> javalinJackson.fromJsonString(newLobbyJson, Lobby.class)));

    // This should now throw a `ValidationException` because
    // the JSON for our new user has no name.
    ValidationException exception = assertThrows(ValidationException.class, () -> {
      lobbyController.addNewLobby(ctx);
    });
    // This `ValidationException` was caused by a custom check, so we just get the message from the first
    // error (which is a `"REQUEST_BODY"` error) and convert that to a string with `toString()`. This gives
    // a `String` that has all the details of the exception, which we can make sure contains information
    // that would help a developer sort out validation errors.
    String exceptionMessage = exception.getErrors().get("REQUEST_BODY").get(0).toString();

    // The message should be the message from our code under test, which should also include some text
    // indicating that there was a missing user name.
    assertTrue(exceptionMessage.contains("non-empty lobby name"));
  }

  @Test
  void deleteFoundUser() throws IOException {
    String testID = appleId.toHexString();
    when(ctx.pathParam("id")).thenReturn(testID);

    // User exists before deletion
    assertEquals(1, db.getCollection("lobbies").countDocuments(eq("_id", new ObjectId(testID))));

    lobbyController.deleteLobby(ctx);

    verify(ctx).status(HttpStatus.OK);

    // User is no longer in the database
    assertEquals(0, db.getCollection("lobbies").countDocuments(eq("_id", new ObjectId(testID))));
  }

  @Test
  void tryToDeleteNotFoundUser() throws IOException {
    String testID = appleId.toHexString();
    when(ctx.pathParam("id")).thenReturn(testID);

    lobbyController.deleteLobby(ctx);
    // User is no longer in the database
    assertEquals(0, db.getCollection("users").countDocuments(eq("_id", new ObjectId(testID))));

    assertThrows(NotFoundResponse.class, () -> {
      lobbyController.deleteLobby(ctx);
    });

    verify(ctx).status(HttpStatus.NOT_FOUND);

    // User is still not in the database
    assertEquals(0, db.getCollection("users").countDocuments(eq("_id", new ObjectId(testID))));
  }

  @Test
  void tryToGetRound() throws IOException
  {
    String testID = appleId.toHexString();
    when(ctx.pathParam("id")).thenReturn(testID);
    lobbyController.getLobbyRound(ctx);
    verify(ctx).json(mapCaptor.capture());
    verify(ctx).status(HttpStatus.OK);
    assertEquals("{round=1}", mapCaptor.getAllValues().get(0).toString());
  }

  @Test
  void tryToGetRoundWithNonExistantID() throws IOException
  {
    String id = "588935f5c668650dc77df581";
    when(ctx.pathParam("id")).thenReturn(id);

    Throwable exception = assertThrows(NotFoundResponse.class, () -> {
      lobbyController.getLobbyRound(ctx);
    });

    assertEquals("Lobby not found", exception.getMessage());
  }

  @Test
  void incrementLobbyRoundWithExistingID() throws IOException
  {
    String testID = appleId.toHexString();
    when(ctx.pathParam("id")).thenReturn(testID);
    lobbyController.incrementLobbyRound(ctx);
    verify(ctx).json(mapCaptor.capture());
    verify(ctx).status(HttpStatus.OK);
    assertEquals("{round=2}", mapCaptor.getAllValues().get(0).toString());
  }

  @Test
  void incrementLobbyRoundWithNonExistantID() throws IOException
  {
    String id = "588935f5c668650dc77df581";
    when(ctx.pathParam("id")).thenReturn(id);

    Throwable exception = assertThrows(NotFoundResponse.class, () -> {
      lobbyController.incrementLobbyRound(ctx);
    });

    assertEquals("Lobby not found", exception.getMessage());
  }
}
