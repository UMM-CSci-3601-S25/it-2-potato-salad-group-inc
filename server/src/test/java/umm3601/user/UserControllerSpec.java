package umm3601.user;

import static com.mongodb.client.model.Filters.eq;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
// import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
// import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
// import java.util.HashMap;
import java.util.List;
import java.util.Map;
// import java.util.stream.Collectors;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
// import org.mockito.ArgumentMatcher;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import com.mongodb.MongoClientSettings;
import com.mongodb.ServerAddress;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;

import io.javalin.Javalin;
import io.javalin.http.BadRequestResponse;
import io.javalin.http.Context;
import io.javalin.http.HttpStatus;
import io.javalin.http.NotFoundResponse;
import io.javalin.json.JavalinJackson;
import io.javalin.validation.BodyValidator;
// import io.javalin.validation.Validation;
// import io.javalin.validation.ValidationError;
import io.javalin.validation.ValidationException;
// import io.javalin.validation.Validator;

/**
 * Tests the logic of the UserController
 *
 * @throws IOException
 */
// The tests here include a ton of "magic numbers" (numeric constants).
// It wasn't clear to me that giving all of them names would actually
// help things. The fact that it wasn't obvious what to call some
// of them says a lot. Maybe what this ultimately means is that
// these tests can/should be restructured so the constants (there are
// also a lot of "magic strings" that Checkstyle doesn't actually
// flag as a problem) make more sense.
@SuppressWarnings({ "MagicNumber" })
class UserControllerSpec {

  // An instance of the controller we're testing that is prepared in
  // `setupEach()`, and then exercised in the various tests below.
  private UserController userController;

  // A Mongo object ID that is initialized in `setupEach()` and used
  // in a few of the tests. It isn't used all that often, though,
  // which suggests that maybe we should extract the tests that
  // care about it into their own spec file?
  private ObjectId samsId;

  // The client and database that will be used
  // for all the tests in this spec file.
  private static MongoClient mongoClient;
  private static MongoDatabase db;

  // Used to translate between JSON and POJOs.
  private static JavalinJackson javalinJackson = new JavalinJackson();

  @Mock
  private Context ctx;

  @Captor
  private ArgumentCaptor<ArrayList<User>> userArrayListCaptor;

  @Captor
  private ArgumentCaptor<User> userCaptor;

  @Captor
  private ArgumentCaptor<Map<String, String>> mapCaptor;

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
    MongoCollection<Document> userDocuments = db.getCollection("users");
    userDocuments.drop();
    List<Document> testUsers = List.of(
        new Document().append("userName", "Chris"),
        new Document().append("userName", "Pat"),
        new Document().append("userName", "Jamie"));

    samsId = new ObjectId();
    Document sam = new Document()
        .append("_id", samsId)
        .append("userName", "Sam");

    userDocuments.insertMany(testUsers);
    userDocuments.insertOne(sam);

    userController = new UserController(db);
  }

  @Test
  void addsRoutes() {
    Javalin mockServer = mock(Javalin.class);
    userController.addRoutes(mockServer);
    verify(mockServer, Mockito.atLeast(2)).get(any(), any());
    verify(mockServer, Mockito.atLeastOnce()).post(any(), any());
    verify(mockServer, Mockito.atLeastOnce()).delete(any(), any());
  }

  @Test
  void canGetAllUsers() throws IOException {
    // When something asks the (mocked) context for the queryParamMap,
    // it will return an empty map (since there are no query params in
    // this case where we want all users).
    when(ctx.queryParamMap()).thenReturn(Collections.emptyMap());

    // Now, go ahead and ask the userController to getUsers
    // (which will, indeed, ask the context for its queryParamMap)
    userController.getUsers(ctx);

    // We are going to capture an argument to a function, and the type of
    // that argument will be of type ArrayList<User> (we said so earlier
    // using a Mockito annotation like this):
    // @Captor
    // private ArgumentCaptor<ArrayList<User>> userArrayListCaptor;
    // We only want to declare that captor once and let the annotation
    // help us accomplish reassignment of the value for the captor
    // We reset the values of our annotated declarations using the command
    // `MockitoAnnotations.openMocks(this);` in our @BeforeEach

    // Specifically, we want to pay attention to the ArrayList<User> that
    // is passed as input when ctx.json is called --- what is the argument
    // that was passed? We capture it and can refer to it later.
    verify(ctx).json(userArrayListCaptor.capture());
    verify(ctx).status(HttpStatus.OK);

    // Check that the database collection holds the same number of documents
    // as the size of the captured List<User>
    assertEquals(
        db.getCollection("users").countDocuments(),
        userArrayListCaptor.getValue().size());
  }

  /**
   * Confirm that if we process a request for users with age 37,
   * that all returned users have that age, and we get the correct
   * number of users.
   *
   * The structure of this test is:
   *
   *    - We create a `Map` for the request's `queryParams`, that
   *      contains a single entry, mapping the `AGE_KEY` to the
   *      target value ("37"). This "tells" our `UserController`
   *      that we want all the `User`s that have age 37.
   *    - We create a validator that confirms that the code
   *      we're testing calls `ctx.queryParamsAsClass("age", Integer.class)`,
   *      i.e., it asks for the value in the query param map
   *      associated with the key `"age"`, interpreted as an Integer.
   *      That call needs to return a value of type `Validator<Integer>`
   *      that will succeed and return the (integer) value `37` associated
   *      with the (`String`) parameter value `"37"`.
   *    - We then call `userController.getUsers(ctx)` to run the code
   *      being tested with the constructed context `ctx`.
   *    - We also use the `userListArrayCaptor` (defined above)
   *      to capture the `ArrayList<User>` that the code under test
   *      passes to `ctx.json(…)`. We can then confirm that the
   *      correct list of users (i.e., all the users with age 37)
   *      is passed in to be returned in the context.
   *    - Now we can use a variety of assertions to confirm that
   *      the code under test did the "right" thing:
   *       - Confirm that the list of users has length 2
   *       - Confirm that each user in the list has age 37
   *       - Confirm that their names are "Jamie" and "Pat"
   *
   * @throws IOException
   */


  /**
   * Confirm that if we process a request for users with age 37,
   * that all returned users have that age, and we get the correct
   * number of users.
   *
   * Instead of using the Captor like in many other tests, in this test
   * we use an ArgumentMatcher just to show how that can be used, illustrating
   * another way to test the same thing.
   *
   * An `ArgumentMatcher` has a method `matches` that returns `true`
   * if the argument passed to `ctx.json(…)` (a `List<User>` in this case)
   * has the desired properties.
   *
   * This is probably overkill here, but it does illustrate a different
   * approach to writing tests.
   *
   * @throws JsonMappingException
   * @throws JsonProcessingException
   */


  @Test
  void getUserWithExistentId() throws IOException {
    String id = samsId.toHexString();
    when(ctx.pathParam("id")).thenReturn(id);

    userController.getUser(ctx);

    verify(ctx).json(userCaptor.capture());
    verify(ctx).status(HttpStatus.OK);
    assertEquals("Sam", userCaptor.getValue().userName);
    assertEquals(samsId.toHexString(), userCaptor.getValue()._id);
  }

  @Test
  void getUserWithBadId() throws IOException {
    when(ctx.pathParam("id")).thenReturn("bad");

    Throwable exception = assertThrows(BadRequestResponse.class, () -> {
      userController.getUser(ctx);
    });

    assertEquals("The requested user id wasn't a legal Mongo Object ID.", exception.getMessage());
  }

  @Test
  void getUserWithNonexistentId() throws IOException {
    String id = "588935f5c668650dc77df581";
    when(ctx.pathParam("id")).thenReturn(id);

    Throwable exception = assertThrows(NotFoundResponse.class, () -> {
      userController.getUser(ctx);
    });

    assertEquals("The requested user was not found", exception.getMessage());
  }
  @Test
  void canCreateAndAccessUserIdName() {
    UserIdName userIdName = new UserIdName();

    userIdName._id = "12345";
    userIdName.name = "minister";

    assertEquals("12345", userIdName._id);
    assertEquals("minister", userIdName.name);
  }

  @Test
  void addUser() throws IOException {
    // Create a new user to add
    User newUser = new User();
    newUser.userName = "Test User";

    String newUserJson = javalinJackson.toJsonString(newUser, User.class);

    // A `BodyValidator` needs
    //   - The string (`newUserJson`) being validated
    //   - The class (`User.class) it's trying to generate from that string
    //   - A function (`() -> User`) which "shows" the validator how to convert
    //     the JSON string to a `User` object. We'll again use `javalinJackson`,
    //     but in the other direction.
    when(ctx.bodyValidator(User.class))
      .thenReturn(new BodyValidator<User>(newUserJson, User.class,
                    () -> javalinJackson.fromJsonString(newUserJson, User.class)));

    userController.addNewUser(ctx);
    verify(ctx).json(mapCaptor.capture());

    // Our status should be 201, i.e., our new user was successfully created.
    verify(ctx).status(HttpStatus.CREATED);

    // Verify that the user was added to the database with the correct ID
    Document addedUser = db.getCollection("users")
        .find(eq("_id", new ObjectId(mapCaptor.getValue().get("id")))).first();

    // Successfully adding the user should return the newly generated, non-empty
    // MongoDB ID for that user.
    assertNotEquals("", addedUser.get("_id"));
    // The new user in the database (`addedUser`) should have the same
    // field values as the user we asked it to add (`newUser`).
    assertEquals(newUser.userName, addedUser.get("userName"));
  }

  @Test
  void addUserWithoutName() throws IOException {
    String newUserJson = """
        {

        }
        """;

    when(ctx.body()).thenReturn(newUserJson);
    when(ctx.bodyValidator(User.class))
        .then(value -> new BodyValidator<User>(newUserJson, User.class,
                        () -> javalinJackson.fromJsonString(newUserJson, User.class)));

    // This should now throw a `ValidationException` because
    // the JSON for our new user has no name.
    ValidationException exception = assertThrows(ValidationException.class, () -> {
      userController.addNewUser(ctx);
    });
    // This `ValidationException` was caused by a custom check, so we just get the message from the first
    // error (which is a `"REQUEST_BODY"` error) and convert that to a string with `toString()`. This gives
    // a `String` that has all the details of the exception, which we can make sure contains information
    // that would help a developer sort out validation errors.
    String exceptionMessage = exception.getErrors().get("REQUEST_BODY").get(0).toString();

    // The message should be the message from our code under test, which should also include some text
    // indicating that there was a missing user name.
    assertTrue(exceptionMessage.contains("non-empty user name"));
  }

  @Test
  void addEmptyNameUser() throws IOException {
    String newUserJson = """
        {
          "userName": ""
        }
        """;

    when(ctx.body()).thenReturn(newUserJson);
    when(ctx.bodyValidator(User.class))
        .then(value -> new BodyValidator<User>(newUserJson, User.class,
                        () -> javalinJackson.fromJsonString(newUserJson, User.class)));

    // This should now throw a `ValidationException` because
    // the JSON for our new user has an invalid email address.
    ValidationException exception = assertThrows(ValidationException.class, () -> {
      userController.addNewUser(ctx);
    });
    // This `ValidationException` was caused by a custom check, so we just get the message from the first
    // error (which is a `"REQUEST_BODY"` error) and convert that to a string with `toString()`. This gives
    // a `String` that has all the details of the exception, which we can make sure contains information
    // that would help a developer sort out validation errors.
    String exceptionMessage = exception.getErrors().get("REQUEST_BODY").get(0).toString();

    // The message should be the message from our code under test, which should also include some text
    // indicating that there was an empty string for the user name.
    assertTrue(exceptionMessage.contains("non-empty user name"));
  }

  @Test
  void deleteFoundUser() throws IOException {
    String testID = samsId.toHexString();
    when(ctx.pathParam("id")).thenReturn(testID);

    // User exists before deletion
    assertEquals(1, db.getCollection("users").countDocuments(eq("_id", new ObjectId(testID))));

    userController.deleteUser(ctx);

    verify(ctx).status(HttpStatus.OK);

    // User is no longer in the database
    assertEquals(0, db.getCollection("users").countDocuments(eq("_id", new ObjectId(testID))));
  }

  @Test
  void tryToDeleteNotFoundUser() throws IOException {
    String testID = samsId.toHexString();
    when(ctx.pathParam("id")).thenReturn(testID);

    userController.deleteUser(ctx);
    // User is no longer in the database
    assertEquals(0, db.getCollection("users").countDocuments(eq("_id", new ObjectId(testID))));

    assertThrows(NotFoundResponse.class, () -> {
      userController.deleteUser(ctx);
    });

    verify(ctx).status(HttpStatus.NOT_FOUND);

    // User is still not in the database
    assertEquals(0, db.getCollection("users").countDocuments(eq("_id", new ObjectId(testID))));
  }
}
