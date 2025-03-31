package umm3601.card;

import static com.mongodb.client.model.Filters.eq;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
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
import io.javalin.validation.ValidationException;

class CardControllerSpec {

  private CardController cardController;

  private ObjectId testCardId;

  private static MongoClient mongoClient;
  private static MongoDatabase db;

  private static JavalinJackson javalinJackson = new JavalinJackson();

  @Mock
  private Context ctx;

  @Captor
  private ArgumentCaptor<ArrayList<Card>> cardArrayListCaptor;

  @Captor
  private ArgumentCaptor<Card> cardCaptor;

  @Captor
  private ArgumentCaptor<Map<String, String>> mapCaptor;

  @BeforeAll
  static void setupAll() {
    String mongoAddr = System.getenv().getOrDefault("MONGO_ADDR", "localhost");

    mongoClient = MongoClients.create(
        MongoClientSettings.builder()
            .applyToClusterSettings(builder -> builder.hosts(List.of(new ServerAddress(mongoAddr))))
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
    MockitoAnnotations.openMocks(this);

    MongoCollection<Document> cardDocuments = db.getCollection("cards");
    cardDocuments.drop();
    List<Document> testCards = List.of(
        new Document().append("Title", "Card 1").append("Description", "Description 1"),
        new Document().append("Title", "Card 2").append("Description", "Description 2"));

    testCardId = new ObjectId();
    Document testCard = new Document()
        .append("_id", testCardId)
        .append("Title", "Test Card")
        .append("Description", "Test Description");

    cardDocuments.insertMany(testCards);
    cardDocuments.insertOne(testCard);

    cardController = new CardController(db);
  }

  @Test
  void addsRoutes() {
    Javalin mockServer = mock(Javalin.class);
    cardController.addRoutes(mockServer);
    verify(mockServer).get(any(), any());
    verify(mockServer).post(any(), any());
    verify(mockServer).delete(any(), any());
  }

  @Test
  void canGetAllCards() throws IOException {
    when(ctx.queryParamMap()).thenReturn(Collections.emptyMap());

    cardController.getCards(ctx);

    verify(ctx).json(cardArrayListCaptor.capture());
    verify(ctx).status(HttpStatus.OK);

    assertEquals(
        db.getCollection("cards").countDocuments(),
        cardArrayListCaptor.getValue().size());
  }

  @Test
  void getCardWithExistentId() throws IOException {
    String id = testCardId.toHexString();
    when(ctx.pathParam("id")).thenReturn(id);

    cardController.getCard(ctx);

    verify(ctx).json(cardCaptor.capture());
    verify(ctx).status(HttpStatus.OK);
    assertEquals("Test Card", cardCaptor.getValue().Title);
    assertEquals("Test Description", cardCaptor.getValue().Description);
  }

  @Test
  void getCardWithBadId() throws IOException {
    when(ctx.pathParam("id")).thenReturn("bad");

    Throwable exception = assertThrows(BadRequestResponse.class, () -> {
      cardController.getCard(ctx);
    });

    assertEquals("The requested card id wasn't a legal Mongo Object ID.", exception.getMessage());
  }

  @Test
  void getCardWithNonexistentId() throws IOException {
    String id = "588935f5c668650dc77df581";
    when(ctx.pathParam("id")).thenReturn(id);

    Throwable exception = assertThrows(NotFoundResponse.class, () -> {
      cardController.getCard(ctx);
    });

    assertEquals("The requested card was not found", exception.getMessage());
  }

  @Test
  void addCard() throws IOException {
    Card newCard = new Card();
    newCard.Title = "New Card";
    newCard.Description = "New Description";

    String newCardJson = javalinJackson.toJsonString(newCard, Card.class);

    when(ctx.bodyValidator(Card.class))
        .thenReturn(new BodyValidator<>(newCardJson, Card.class,
            () -> javalinJackson.fromJsonString(newCardJson, Card.class)));

    cardController.addNewCard(ctx);
    verify(ctx).json(mapCaptor.capture());
    verify(ctx).status(HttpStatus.CREATED);

    Document addedCard = db.getCollection("cards")
        .find(eq("_id", new ObjectId(mapCaptor.getValue().get("id")))).first();

    assertNotNull(addedCard);
    assertEquals(newCard.Title, addedCard.get("Title"));
    assertEquals(newCard.Description, addedCard.get("Description"));
  }

  @Test
  void deleteFoundCard() throws IOException {
    String id = testCardId.toHexString();
    when(ctx.pathParam("id")).thenReturn(id);

    assertEquals(1, db.getCollection("cards").countDocuments(eq("_id", new ObjectId(id))));

    cardController.deleteCard(ctx);

    verify(ctx).status(HttpStatus.NO_CONTENT);

    assertEquals(0, db.getCollection("cards").countDocuments(eq("_id", new ObjectId(id))));
  }

  @Test
  void tryToDeleteNotFoundCard() throws IOException {
    String id = "588935f5c668650dc77df581";
    when(ctx.pathParam("id")).thenReturn(id);

    cardController.deleteCard(ctx);

    verify(ctx).status(HttpStatus.NOT_FOUND);
  }
  @Test
void addCardWithoutTitleOrDescription() throws IOException {
  // JSON for a card with no title or description
  String invalidCardJson = """
      {
      }
      """;

  // Mock the body of the request to return the invalid JSON
  when(ctx.body()).thenReturn(invalidCardJson);
  when(ctx.bodyValidator(Card.class))
      .then(value -> new BodyValidator<>(invalidCardJson, Card.class,
          () -> javalinJackson.fromJsonString(invalidCardJson, Card.class)));

  // Expect a ValidationException to be thrown
  ValidationException exception = assertThrows(ValidationException.class, () -> {
    cardController.addNewCard(ctx);
  });

  // Verify the exception message contains the validation error details
  String exceptionMessage = exception.getErrors().get("REQUEST_BODY").get(0).toString();
  assertTrue(exceptionMessage.contains("Title cannot be empty"));
  assertTrue(exceptionMessage.contains("Description cannot be empty"));
}
}
