package umm3601.card;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;

import org.bson.conversions.Bson;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mongojack.JacksonMongoCollection;

import com.mongodb.client.result.DeleteResult;

import io.javalin.http.BadRequestResponse;
import io.javalin.http.Context;
import io.javalin.http.NotFoundResponse;
public class CardControllerSpec {


  private CardController cardController;
  private JacksonMongoCollection<Card> mockCardCollection;
  private Context mockContext;

   @SuppressWarnings("unchecked")
  @BeforeEach
  public void setup() {
    mockCardCollection = mock(JacksonMongoCollection.class);
    mockContext = mock(Context.class);
    cardController = new CardController(mockCardCollection);
  }

  @Test
  public void testGetCardValidId() {
    ObjectId id = new ObjectId();
    Card card = new Card();
    card._id = id;
    when(mockContext.pathParam("id")).thenReturn(id.toHexString());
    when(mockCardCollection.find(eq("_id", id))).thenReturn(List.of(card));

    cardController.getCard(mockContext);

    verify(mockContext).json(card);
  }

  @Test
  public void testGetCardInvalidId() {
    when(mockContext.pathParam("id")).thenReturn("invalid-id");

    assertThrows(BadRequestResponse.class, () -> {
      cardController.getCard(mockContext);
    });
  }

  @Test
  public void testGetCardNotFound() {
    ObjectId id = new ObjectId();
    when(mockContext.pathParam("id")).thenReturn(id.toHexString());
    when(mockCardCollection.find(eq("_id", id))).thenReturn(new ArrayList<>());

    assertThrows(NotFoundResponse.class, () -> {
      cardController.getCard(mockContext);
    });
  }

  @Test
  public void testGetCardsNoFilters() {
    List<Card> cards = List.of(new Card(), new Card());
    when(mockCardCollection.find(Filters.empty())).thenReturn(cards);

    cardController.getCards(mockContext);

    verify(mockContext).json(cards);
  }

  @Test
  public void testAddNewCardValid() {
    Card newCard = new Card();
    newCard.Title = "Test Title";
    newCard.Description = "Test Description";
    when(mockContext.bodyValidator(Card.class)).thenReturn(new CardValidator(newCard));

    cardController.addNewCard(mockContext);

    ArgumentCaptor<Card> cardCaptor = ArgumentCaptor.forClass(Card.class);
    verify(mockCardCollection).insertOne(cardCaptor.capture());
    assertEquals("Test Title", cardCaptor.getValue().Title);
    assertEquals("Test Description", cardCaptor.getValue().Description);
    verify(mockContext).status(201);
  }

  @Test
  public void testDeleteCardExisting() {
    ObjectId id = new ObjectId();
    when(mockContext.pathParam("id")).thenReturn(id.toHexString());
    when(mockCardCollection.deleteOne(eq("_id", id))).thenReturn(DeleteResult.acknowledged(1));

    cardController.deleteCard(mockContext);

    verify(mockContext).status(204);
  }

  @Test
  public void testDeleteCardNotFound() {
    ObjectId id = new ObjectId();
    when(mockContext.pathParam("id")).thenReturn(id.toHexString());
    when(mockCardCollection.deleteOne(eq("_id", id))).thenReturn(DeleteResult.acknowledged(0));

    cardController.deleteCard(mockContext);

    verify(mockContext).status(404);
  }
}
