import { StartScreenPage } from '../support/start-screen.po'

const page = new StartScreenPage();

describe('Start Screen', () => {

  before(() => {
    cy.task('seed:database');
  });

  beforeEach(() => {
    page.navigateTo();
  });

  it('Should have the correct title', () => {
    page.getTitle().should('have.text', 'Card Game Simulator');
  });

  // There are 10 users in the database, two of which work
  // for OHMNET, so there are 9 different companies.
  it('Should have Host Button', () => {
    page.getHostButton().should('be.enabled');
  });

  it('Should have Join Button', () => {
    page.getJoinButton().should('be.enabled');
  });

  it('Should allow join button to redirect to the host page', () => {
    page.getHostButton().should('be.enabled');
    page.getHostButton().click();
    cy.url().should(url => expect(url.endsWith('/host')).to.be.true);

    // On the page we were sent to, We should see the right title
    cy.get('.host-title').should('have.text', 'Host');
  });
  it('Should allow host button to redirect to the join page', () => {
    page.navigateTo();

    page.getJoinButton().should('be.enabled');

    page.getJoinButton().click();
    cy.url().should(url => expect(url.endsWith('/join')).to.be.true);

    // On the page we were sent to, We should see the right title
    cy.get('.join-title').should('have.text', 'Join');
  });

});
