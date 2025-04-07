package umm3601.lobby;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;

import org.bson.Document;
import org.bson.UuidRepresentation;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;
import org.mongojack.JacksonMongoCollection;

import com.mongodb.client.MongoDatabase;
import static com.mongodb.client.model.Filters.and;
import static com.mongodb.client.model.Filters.eq;
import static com.mongodb.client.model.Filters.regex;
import com.mongodb.client.model.Sorts;
import com.mongodb.client.result.DeleteResult;

import io.javalin.Javalin;
import io.javalin.http.BadRequestResponse;
import io.javalin.http.Context;
import io.javalin.http.HttpStatus;
import io.javalin.http.NotFoundResponse;
import umm3601.Controller;

/**
 * Controller that manages requests for info about lobbies.
 */
public class LobbyController implements Controller {

  private static final String API_LOBBIES = "/api/lobbies";
  private static final String API_LOBBY_BY_ID = "/api/lobbies/{id}";
  static final String NAME_KEY = "lobbyName";
  static final String ROUND_KEY = "round";
  static final String SORT_ORDER_KEY = "sortorder";
  static final String USERS_KEY = "users";

  private final JacksonMongoCollection<Lobby> lobbyCollection;

  /**
   * Construct a controller for lobbies.
   *
   * @param database the database containing lobby data
   */
  public LobbyController(MongoDatabase database) {
    lobbyCollection = JacksonMongoCollection.builder().build(
        database,
        "lobbies",
        Lobby.class,
        UuidRepresentation.STANDARD);
  }

  /**
   * Set the JSON body of the response to be the single lobby
   * specified by the `id` parameter in the request
   *
   * @param ctx a Javalin HTTP context
   */
  public void getLobby(Context ctx) {
    String id = ctx.pathParam("id");
    Lobby lobby;

    try {
      lobby = lobbyCollection.find(eq("_id", new ObjectId(id))).first();
    } catch (IllegalArgumentException e) {
      throw new BadRequestResponse("The requested lobby id wasn't a legal Mongo Object ID.");
    }
    if (lobby == null) {
      throw new NotFoundResponse("The requested lobby was not found");
    } else {
      ctx.json(lobby);
      ctx.status(HttpStatus.OK);
    }
  }

  /**
   * Set the JSON body of the response to be a list of all the lobbies returned from the database
   * that match any requested filters and ordering
   *
   * @param ctx a Javalin HTTP context
   */
  public void getLobbies(Context ctx) {
    Bson combinedFilter = constructFilter(ctx);
    Bson sortingOrder = constructSortingOrder(ctx);

    // All three of the find, sort, and into steps happen "in parallel" inside the
    // database system. So MongoDB is going to find the lobbies with the specified
    // properties, return those sorted in the specified manner, and put the
    // results into an initially empty ArrayList.
    ArrayList<Lobby> matchingLobbies = lobbyCollection
      .find(combinedFilter)
      .sort(sortingOrder)
      .into(new ArrayList<>());

    // Set the JSON body of the response to be the list of lobbies returned by the database.
    // According to the Javalin documentation (https://javalin.io/documentation#context),
    // this calls result(jsonString), and also sets content type to json
    ctx.json(matchingLobbies);
    // Explicitly set the context status to OK
    ctx.status(HttpStatus.OK);
  }

  /**
   * Construct a Bson filter document to use in the `find` method based on the
   * query parameters from the context.
   *
   * This checks for the presence of the `age`, `company`, and `role` query
   * parameters and constructs a filter document that will match lobbies with
   * the specified values for those fields.
   *
   * @param ctx a Javalin HTTP context, which contains the query parameters
   *    used to construct the filter
   * @return a Bson filter document that can be used in the `find` method
   *   to filter the database collection of lobbies
   */
  private Bson constructFilter(Context ctx) {
    List<Bson> filters = new ArrayList<>(); // start with an empty list of filters

    if (ctx.queryParamMap().containsKey(NAME_KEY)) {
      String targetContent = ctx.queryParam(NAME_KEY);
      Pattern pattern = Pattern.compile(targetContent, Pattern.CASE_INSENSITIVE);
      filters.add(regex("lobbyName", pattern));
    }
    if (ctx.queryParamMap().containsKey(ROUND_KEY)) {
      int targetContent = ctx.queryParamAsClass(ROUND_KEY, Integer.class)
      .check(it -> it == 0, "Lobby round must be at 0 when starting! You provided " + ctx.queryParam(ROUND_KEY))
      .get();
      filters.add(eq(ROUND_KEY, targetContent));
    }

    // Combine the list of filters into a single filtering document.
    Bson combinedFilter = filters.isEmpty() ? new Document() : and(filters);

    return combinedFilter;
  }

  public void getLobbyRound(Context ctx) {
    String id = ctx.pathParam("id");
    Lobby lobby = lobbyCollection.find(eq("_id", new ObjectId(id))).first();
    if (lobby == null) {
      throw new NotFoundResponse("Lobby not found");
    }

    ctx.json(Map.of("round", lobby.round));
    ctx.status(HttpStatus.OK);
  }

  public void incrementLobbyRound(Context ctx) {
    String id = ctx.pathParam("id");
    Lobby lobby = lobbyCollection.find(eq("_id", new ObjectId(id))).first();
    if (lobby == null) {
      throw new NotFoundResponse("Lobby not found");
    }

    // Increment the round number
    lobby.round++;
    lobbyCollection.replaceOne(eq("_id", new ObjectId(id)), lobby);

    ctx.json(Map.of("round", lobby.round));
    ctx.status(HttpStatus.OK);
  }
  /**
   * Construct a Bson sorting document to use in the `sort` method based on the
   * query parameters from the context.
   *
   * This checks for the presence of the `sortby` and `sortorder` query
   * parameters and constructs a sorting document that will sort lobbies by
   * the specified field in the specified order. If the `sortby` query
   * parameter is not present, it defaults to "name". If the `sortorder`
   * query parameter is not present, it defaults to "asc".
   *
   * @param ctx a Javalin HTTP context, which contains the query parameters
   *   used to construct the sorting order
   * @return a Bson sorting document that can be used in the `sort` method
   *  to sort the database collection of lobbies
   */
  private Bson constructSortingOrder(Context ctx) {
    // Sort the results. Use the `sortby` query param (default "name")
    // as the field to sort by, and the query param `sortorder` (default
    // "asc") to specify the sort order.
    String sortBy = Objects.requireNonNullElse(ctx.queryParam("sortby"), "lobbyName");
    String sortOrder = Objects.requireNonNullElse(ctx.queryParam("sortorder"), "asc");
    Bson sortingOrder = sortOrder.equals("desc") ?  Sorts.descending(sortBy) : Sorts.ascending(sortBy);
    return sortingOrder;
  }

  /**
   * Set the JSON body of the response to be a list of all the lobby names and IDs
   * returned from the database, grouped by company
   *
   * This "returns" a list of lobby names and IDs, grouped by company in the JSON
   * body of the response. The lobby names and IDs are stored in `LobbyIdName` objects,
   * and the company name, the number of lobbies in that company, and the list of lobby
   * names and IDs are stored in `LobbyByCompany` objects.
   *
   * @param ctx a Javalin HTTP context that provides the query parameters
   *   used to sort the results. We support either sorting by company name
   *   (in either `asc` or `desc` order) or by the number of lobbies in the
   *   company (`count`, also in either `asc` or `desc` order).
   */

  // public void addNewUser(Context ctx)
  // {
  //    /*
  //    * The follow chain of statements uses the Javalin validator system
  //    * to verify that instance of `Lobby` provided in this context is
  //    * a "legal" lobby. It checks the following things (in order):
  //    *    - The lobby has a value for the name (`lobby.name != null`)
  //    *    - The lobby name is not blank (`lobby.name.length > 0`)
  //    *    - The provided email is valid (matches EMAIL_REGEX)
  //    *    - The provided age is > 0
  //    *    - The provided age is < REASONABLE_AGE_LIMIT
  //    *    - The provided role is valid (one of "admin", "editor", or "viewer")
  //    *    - A non-blank company is provided
  //    * If any of these checks fail, the Javalin system will throw a
  //    * `BadRequestResponse` with an appropriate error message.
  //    */
  //   String body = ctx.body();
  //   User newUser = ctx.bodyValidator(User.class)
  //     .check(user -> user.name != null && user.name.length() > 0,
  //       "User must have a non-empty lobby name; body was " + body)
  //     .get();
  //   ctx.json(Map.of("id", newUser._id));
  //   String id = ctx.pathParam("lobbyID");


  //   //Makes a Hashmap that holds the new user id
  //   Map<String, Object> incomingMap = new HashMap<>();
  //   incomingMap.put("id", newUser._id);
  //   // convert to a Document
  //   Document newDocument = new Document();
  //   incomingMap.forEach((k, v) -> {
  //           newDocument.append(k, v);
  //   });
  //   //Adds the document to the desired lobby
  //   UpdateResult updateResult = lobbyCollection.updateOne(
  //   new Document("_id", id), Updates.push("users", newDocument));
  //   if (updateResult.getModifiedCount() != 1) {
  //     ctx.status(HttpStatus.NOT_FOUND);
  //     throw new NotFoundResponse(
  //       "Was unable to update Lobby "
  //         + id
  //         + "; perhaps illegal Lobby ID or an ID for an lobby not in the system?");
  //   }

  //   // 201 (`HttpStatus.CREATED`) is the HTTP code for when we successfully
  //   // create a new resource (a lobby in this case).
  //   // See, e.g., https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
  //   // for a description of the various response codes.
  //   ctx.status(HttpStatus.CREATED);
  // }

  /**
   * Add a new lobby using information from the context
   * (as long as the information gives "legal" values to Lobby fields)
   *
   * @param ctx a Javalin HTTP context that provides the lobby info
   *  in the JSON body of the request
   */
  public void addNewLobby(Context ctx) {
    /*
     * The follow chain of statements uses the Javalin validator system
     * to verify that instance of `Lobby` provided in this context is
     * a "legal" lobby. It checks the following things (in order):
     *    - The lobby has a value for the name (`lobby.name != null`)
     *    - The lobby name is not blank (`lobby.name.length > 0`)
     *    - The provided email is valid (matches EMAIL_REGEX)
     *    - The provided age is > 0
     *    - The provided age is < REASONABLE_AGE_LIMIT
     *    - The provided role is valid (one of "admin", "editor", or "viewer")
     *    - A non-blank company is provided
     * If any of these checks fail, the Javalin system will throw a
     * `BadRequestResponse` with an appropriate error message.
     */
    String body = ctx.body();
    Lobby newLobby = ctx.bodyValidator(Lobby.class)
      .check(lobby -> lobby.lobbyName != null && lobby.lobbyName.length() > 0,
        "Lobby must have a non-empty lobby name; body was " + body)
      .check(lobby -> lobby.round == 0, "Lobby round must be at 0 when starting! You provided: "
       + ctx.queryParam(ROUND_KEY))
      .get();

    // Add the new lobby to the database
    lobbyCollection.insertOne(newLobby);

    // Set the JSON response to be the `_id` of the newly created lobby.
    // This gives the client the opportunity to know the ID of the new lobby,
    // which it can then use to perform further operations (e.g., a GET request
    // to get and display the details of the new lobby).
    ctx.json(Map.of("id", newLobby._id));
    // 201 (`HttpStatus.CREATED`) is the HTTP code for when we successfully
    // create a new resource (a lobby in this case).
    // See, e.g., https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
    // for a description of the various response codes.
    ctx.status(HttpStatus.CREATED);
  }

  /**
   * Delete the lobby specified by the `id` parameter in the request.
   *
   * @param ctx a Javalin HTTP context
   */
  public void deleteLobby(Context ctx) {
    String id = ctx.pathParam("id");
    DeleteResult deleteResult = lobbyCollection.deleteOne(eq("_id", new ObjectId(id)));
    // We should have deleted 1 or 0 lobbies, depending on whether `id` is a valid lobby ID.
    if (deleteResult.getDeletedCount() != 1) {
      ctx.status(HttpStatus.NOT_FOUND);
      throw new NotFoundResponse(
        "Was unable to delete ID "
          + id
          + "; perhaps illegal ID or an ID for an item not in the system?");
    }
    ctx.status(HttpStatus.OK);
  }


  /**
   * Sets up routes for the `lobby` collection endpoints.
   * A LobbyController instance handles the lobby endpoints,
   * and the addRoutes method adds the routes to this controller.
   *
   * These endpoints are:
   *   - `GET /api/lobbies/:id`
   *       - Get the specified lobby
   *   - `GET /api/lobbies?age=NUMBER&company=STRING&name=STRING`
   *      - List lobbies, filtered using query parameters
   *      - `age`, `company`, and `name` are optional query parameters
   *   - `GET /api/lobbiesByCompany`
   *     - Get lobby names and IDs, possibly filtered, grouped by company
   *   - `DELETE /api/lobbies/:id`
   *      - Delete the specified lobby
   *   - `POST /api/lobbies`
   *      - Create a new lobby
   *      - The lobby info is in the JSON body of the HTTP request
   *
   * GROUPS SHOULD CREATE THEIR OWN CONTROLLERS THAT IMPLEMENT THE
   * `Controller` INTERFACE FOR WHATEVER DATA THEY'RE WORKING WITH.
   * You'll then implement the `addRoutes` method for that controller,
   * which will set up the routes for that data. The `Server#setupRoutes`
   * method will then call `addRoutes` for each controller, which will
   * add the routes for that controller's data.
   *
   * @param server The Javalin server instance
   */
  @Override
  public void addRoutes(Javalin server) {
    // Get the specified lobby
    server.get(API_LOBBY_BY_ID, this::getLobby);

    // Get the round number for the specified lobby
    server.get("/api/lobbies/{id}/round", this::getLobbyRound);

    // Increment the round number for the specified lobby
    server.post("/api/lobbies/{id}/round/increment", this::incrementLobbyRound);

    // List lobbies, filtered using query parameters
    server.get(API_LOBBIES, this::getLobbies);

    // Get the lobbies, possibly filtered, grouped by company

    // Add new lobby with the lobby info being in the JSON body
    // of the HTTP request
    server.post(API_LOBBIES, this::addNewLobby);


    // Delete the specified lobby
    server.delete(API_LOBBY_BY_ID, this::deleteLobby);
  }
}
