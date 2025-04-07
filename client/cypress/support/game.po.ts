

export class GamePage {
  private readonly url = '/game/1234567890';
  private readonly title = '.game-page-title';
  private readonly button = '.increment-round';



  navigateTo() {
    return cy.visit(this.url);
  }

  getTitle() {
    return cy.get(this.title);
  }

  nextRoundButton() {
    return cy.get(this.button);
  }

}
