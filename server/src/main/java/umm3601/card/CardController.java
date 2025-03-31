package umm3601.card;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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
import com.mongodb.client.result.DeleteResult;

import io.javalin.Javalin;
import io.javalin.http.BadRequestResponse;
import io.javalin.http.Context;
import io.javalin.http.HttpStatus;
import io.javalin.http.NotFoundResponse;
import umm3601.Controller;

public class CardController implements Controller{
  private static final String API_CARDS = "/api/cards";
  private static final String API_CARDS_ID = "/api/cards/:id";
  private static final String DESCRIPTION_KEY = "Description";
  private static final String TITLE_KEY = "Title";

  private final JacksonMongoCollection<Card> cardCollection;

  public CardController(MongoDatabase database) {
    cardCollection = JacksonMongoCollection.builder().build(
        database,
        "cards",
        Card.class,
        UuidRepresentation.STANDARD);
  }

  public void getCard(Context ctx) {
    String id = ctx.pathParam("id");
    Card card;

    try {
      card = cardCollection.find(eq("_id", new ObjectId(id))).first();
    } catch(IllegalArgumentException e) {
      throw new BadRequestResponse("The requested card id wasn't a legal Mongo Object ID.");
    }
    if (card == null) {
      throw new NotFoundResponse("The requested card was not found");
    } else {
      ctx.json(card);
    }
    ctx.status(HttpStatus.OK);
  }

  public void getCards(Context ctx) {
    List<Bson> filters = new ArrayList<>();

    Bson filter = new Document() ;

    ctx.json(cardCollection.find(filter).into(new ArrayList<>()));
    ctx.status(HttpStatus.OK);
  }

  public void addNewCard(Context ctx) {
    Card newCard = ctx.bodyValidator(Card.class)
      .check(card -> card.Title != null && card.Title.length() > 0, "Title cannot be empty")
      .check(card -> card.Description != null && card.Description.length() > 0, "Description cannot be empty")
      .get();

    cardCollection.insertOne(newCard);
    ctx.json(Map.of("id", newCard._id));
    ctx.status(HttpStatus.CREATED);
  }

  public void deleteCard(Context ctx) {
    String id = ctx.pathParam("id");
    DeleteResult result = cardCollection.deleteOne(eq("_id", new ObjectId(id)));
    if (result.getDeletedCount() == 1) {
      ctx.status(HttpStatus.NO_CONTENT);
    } else {
      ctx.status(HttpStatus.NOT_FOUND);
    }
  }

  @Override
  public void addRoutes(Javalin server) {
    // server.get(API_CARDS, this::getCards);
    server.get(API_CARDS_ID, this::getCard);
    server.post(API_CARDS, this::addNewCard);
    server.delete(API_CARDS_ID, this::deleteCard);
  }
}
