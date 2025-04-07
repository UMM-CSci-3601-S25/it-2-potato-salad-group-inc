

export class GamePage {
  private readonly url = '/game/1234567890ab1234567890ab';
  private readonly button = '.increment-round';
  private readonly round = '.round-value';


  navigateTo() {
    return cy.visit(this.url);
  }

  nextRoundButton() {
    return cy.get(this.button);
  }

  getRound() {
    return cy.get(this.round);
  }

}
