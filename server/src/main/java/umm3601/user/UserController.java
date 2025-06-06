package umm3601.user;

import static com.mongodb.client.model.Filters.eq;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.bson.Document;
import org.bson.UuidRepresentation;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;
import org.mongojack.JacksonMongoCollection;

import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Sorts;
import com.mongodb.client.result.DeleteResult;

import io.javalin.Javalin;
import io.javalin.http.BadRequestResponse;
import io.javalin.http.Context;
import io.javalin.http.HttpStatus;
import io.javalin.http.NotFoundResponse;
import umm3601.Controller;

/**
 * Controller that manages requests for info about users.
 */
public class UserController implements Controller {

  private static final String API_USERS = "/api/users";
  private static final String API_USER_BY_ID = "/api/users/{id}";
  // private static final String NAME_KEY = "userName";
  static final String CARDIDS_KEY = "cardIDs";
  static final int ROLE_KEY = 0;


  private final JacksonMongoCollection<User> userCollection;

  /**
   * Construct a controller for users.
   *
   * @param database the database containing user data
   */
  public UserController(MongoDatabase database) {
    userCollection = JacksonMongoCollection.builder().build(
        database,
        "users",
        User.class,
        UuidRepresentation.STANDARD);
  }

  /**
   * Set the JSON body of the response to be the single user
   * specified by the `id` parameter in the request
   *
   * @param ctx a Javalin HTTP context
   */
  public void getUser(Context ctx) {
    String id = ctx.pathParam("id");
    User user;

    try {
      user = userCollection.find(eq("_id", new ObjectId(id))).first();
    } catch (IllegalArgumentException e) {
      throw new BadRequestResponse("The requested user id wasn't a legal Mongo Object ID.");
    }
    if (user == null) {
      throw new NotFoundResponse("The requested user was not found");
    } else {
      ctx.json(user);
      ctx.status(HttpStatus.OK);
    }
  }

  /**
   * Set the JSON body of the response to be a list of all the users returned from the database
   * that match any requested filters and ordering
   *
   * @param ctx a Javalin HTTP context
   */
  public void getUsers(Context ctx) {
    Bson combinedFilter = constructFilter(ctx);
    Bson sortingOrder = constructSortingOrder(ctx);

    // All three of the find, sort, and into steps happen "in parallel" inside the
    // database system. So MongoDB is going to find the users with the specified
    // properties, return those sorted in the specified manner, and put the
    // results into an initially empty ArrayList.
    ArrayList<User> matchingUsers = userCollection
      .find(combinedFilter)
      .sort(sortingOrder)
      .into(new ArrayList<>());

    // Set the JSON body of the response to be the list of users returned by the database.
    // According to the Javalin documentation (https://javalin.io/documentation#context),
    // this calls result(jsonString), and also sets content type to json
    ctx.json(matchingUsers);

    // Explicitly set the context status to OK
    ctx.status(HttpStatus.OK);
  }

  /**
   * Construct a Bson filter document to use in the `find` method based on the
   * query parameters from the context.
   *
   * This checks for the presence of the `age`, `company`, and `role` query
   * parameters and constructs a filter document that will match users with
   * the specified values for those fields.
   *
   * @param ctx a Javalin HTTP context, which contains the query parameters
   *    used to construct the filter
   * @return a Bson filter document that can be used in the `find` method
   *   to filter the database collection of users
   */
  private Bson constructFilter(Context ctx) {
    List<Bson> filters = new ArrayList<>(); // start with an empty list of filters



  //   // Combine the list of filters into a single filtering document.
    Bson combinedFilter = new Document();

    return combinedFilter;
  }

  /**
   * Construct a Bson sorting document to use in the `sort` method based on the
   * query parameters from the context.
   *
   * This checks for the presence of the `sortby` and `sortorder` query
   * parameters and constructs a sorting document that will sort users by
   * the specified field in the specified order. If the `sortby` query
   * parameter is not present, it defaults to "name". If the `sortorder`
   * query parameter is not present, it defaults to "asc".
   *
   * @param ctx a Javalin HTTP context, which contains the query parameters
   *   used to construct the sorting order
   * @return a Bson sorting document that can be used in the `sort` method
   *  to sort the database collection of users
   */
  private Bson constructSortingOrder(Context ctx) {
    // Sort the results. Use the `sortby` query param (default "name")
    // as the field to sort by, and the query param `sortorder` (default
    // "asc") to specify the sort order.
    String sortBy = Objects.requireNonNullElse(ctx.queryParam("sortby"), "userName");
    String sortOrder = Objects.requireNonNullElse(ctx.queryParam("sortorder"), "asc");
    Bson sortingOrder = Sorts.ascending(sortBy);
    return sortingOrder;
  }

  /**
   * Set the JSON body of the response to be a list of all the user names and IDs
   * returned from the database, grouped by company
   *
   * This "returns" a list of user names and IDs, grouped by company in the JSON
   * body of the response. The user names and IDs are stored in `UserIdName` objects,
   * and the company name, the number of users in that company, and the list of user
   * names and IDs are stored in `UserByCompany` objects.
   *
   * @param ctx a Javalin HTTP context that provides the query parameters
   *   used to sort the results. We support either sorting by company name
   *   (in either `asc` or `desc` order) or by the number of users in the
   *   company (`count`, also in either `asc` or `desc` order).
   */

    // The `UserByCompany` class is a simple class that has fields for the company
    // name, the number of users in that company, and a list of user names and IDs
    // (using the `UserIdName` class to store the user names and IDs).
    // We're going to use the aggregation pipeline to group users by company, and
    // then count the number of users in each company. We'll also collect the user
    // names and IDs for each user in each company. We'll then convert the results
    // of the aggregation pipeline to `UserByCompany` objects.

  //   ArrayList<UserByCompany> matchingUsers = userCollection
  //     // The following aggregation pipeline groups users by company, and
  //     // then counts the number of users in each company. It also collects
  //     // the user names and IDs for each user in each company.
  //     .aggregate(
  //       List.of(
  //         // Project the fields we want to use in the next step, i.e., the _id, name, and company fields
  //         new Document("$project", new Document("_id", 1).append("name", 1).append("company", 1)),
  //         // Group the users by company, and count the number of users in each company
  //         new Document("$group", new Document("_id", "$company")
  //           // Count the number of users in each company
  //           .append("count", new Document("$sum", 1))
  //           // Collect the user names and IDs for each user in each company
  //           .append("users", new Document("$push", new Document("_id", "$_id").append("name", "$name")))),
  //         // Sort the results. Use the `sortby` query param (default "company")
  //         // as the field to sort by, and the query param `sortorder` (default
  //         // "asc") to specify the sort order.
  //         new Document("$sort", sortingOrder)
  //       ),
  //       // Convert the results of the aggregation pipeline to UserGroupResult objects
  //       // (i.e., a list of UserGroupResult objects). It is necessary to have a Java type
  //       // to convert the results to, and the JacksonMongoCollection will do this for us.
  //       UserByCompany.class
  //     )
  //     .into(new ArrayList<>());

  //   ctx.json(matchingUsers);
  //   ctx.status(HttpStatus.OK);


  /**
   * Add a new user using information from the context
   * (as long as the information gives "legal" values to User fields)
   *
   * @param ctx a Javalin HTTP context that provides the user info
   *  in the JSON body of the request
   */
  public void addNewUser(Context ctx) {
    /*
     * The follow chain of statements uses the Javalin validator system
     * to verify that instance of `User` provided in this context is
     * a "legal" user. It checks the following things (in order):
     *    - The user has a value for the name (`usr.name != null`)
     *    - The user name is not blank (`usr.name.length > 0`)
     *    - The provided email is valid (matches EMAIL_REGEX)
     *    - The provided age is > 0
     *    - The provided age is < REASONABLE_AGE_LIMIT
     *    - The provided role is valid (one of "admin", "editor", or "viewer")
     *    - A non-blank company is provided
     * If any of these checks fail, the Javalin system will throw a
     * `BadRequestResponse` with an appropriate error message.
     */
    String body = ctx.body();
    User newUser = ctx.bodyValidator(User.class)
      .check(usr -> usr.userName != null && usr.userName.length() > 0,
        "User must have a non-empty user name; body was " + body)
      .get();


    // // Add the new user to the database
    userCollection.insertOne(newUser);

    // // Set the JSON response to be the `_id` of the newly created user.
    // // This gives the client the opportunity to know the ID of the new user,
    // // which it can then use to perform further operations (e.g., a GET request
    // // to get and display the details of the new user).
    ctx.json(Map.of("id", newUser._id));
    // // 201 (`HttpStatus.CREATED`) is the HTTP code for when we successfully
    // // create a new resource (a user in this case).
    // // See, e.g., https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
    // // for a description of the various response codes.
    ctx.status(HttpStatus.CREATED);
  }

  /**
   * Delete the user specified by the `id` parameter in the request.
   *
   * @param ctx a Javalin HTTP context
   */
  public void deleteUser(Context ctx) {
    String id = ctx.pathParam("id");
    DeleteResult deleteResult = userCollection.deleteOne(eq("_id", new ObjectId(id)));
    // We should have deleted 1 or 0 users, depending on whether `id` is a valid user ID.
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
   * Sets up routes for the `user` collection endpoints.
   * A UserController instance handles the user endpoints,
   * and the addRoutes method adds the routes to this controller.
   *
   * These endpoints are:
   *   - `GET /api/users/:id`
   *       - Get the specified user
   *   - `GET /api/users?age=NUMBER&company=STRING&name=STRING`
   *      - List users, filtered using query parameters
   *      - `age`, `company`, and `name` are optional query parameters
   *   - `GET /api/usersByCompany`
   *     - Get user names and IDs, possibly filtered, grouped by company
   *   - `DELETE /api/users/:id`
   *      - Delete the specified user
   *   - `POST /api/users`
   *      - Create a new user
   *      - The user info is in the JSON body of the HTTP request
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
    // Get the specified user
    server.get(API_USER_BY_ID, this::getUser);

    // List users, filtered using query parameters
    server.get(API_USERS, this::getUsers);

    // Add new user with the user info being in the JSON body
    // of the HTTP request
    server.post(API_USERS, this::addNewUser);

    // Delete the specified user
    server.delete(API_USER_BY_ID, this::deleteUser);
  }
}
