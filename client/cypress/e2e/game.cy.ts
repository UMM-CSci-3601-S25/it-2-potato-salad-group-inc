import { GamePage } from "cypress/support/game.po";

describe('Increment Round', () => {
  const page = new GamePage();

  beforeEach(() => {
    page.navigateTo();
  });

  it('Should increment round count when clicking the button', () => {
    page.getRound().should('contain', 'Round: 0');
    page.nextRoundButton().click();
    page.getRound().should('contain', 'Round: 1');
    page.nextRoundButton().click();
    page.getRound().should('contain', 'Round: 2');
  })
})
