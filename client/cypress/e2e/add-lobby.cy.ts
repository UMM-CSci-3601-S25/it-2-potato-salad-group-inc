import { AddLobbyPage } from 'cypress/support/add-lobby.po';
import { Lobby } from 'src/app/host/lobby';

describe('Create Lobby', () => {
  const page = new AddLobbyPage();

  beforeEach(() => {
    page.navigateTo();
  });

  it('Should have the correct title', () => {
    page.getTitle().should('have.text', 'Create Lobby');
  });

  it('Should enable and disable the create lobby button', () => {
    // ADD lobby button should be disabled until all the necessary fields
    // are filled. Once the last (`#emailField`) is filled, then the button should
    // become enabled.
    page.addLobbyButton().should('be.disabled');
    page.getFormField('lobbyName').type('test');
    page.addLobbyButton().should('be.enabled');
  });

  it('Should show error messages for invalid inputs', () => {
    // Before doing anything there shouldn't be an error
    cy.get('[data-test=lobbyNameError]').should('not.exist');
    // Just clicking the name field without entering anything should cause an error message
    page.getFormField('lobbyName').click().blur();
    cy.get('[data-test=lobbyNameError]').should('exist').and('be.visible');
    // Some more tests for various invalid name inputs
    page.getFormField('lobbyName').type('J').blur();
    cy.get('[data-test=lobbyNameError]').should('exist').and('be.visible');
    page
      .getFormField('lobbyName')
      .clear()
      .type('This is a very long name that goes beyond the 50 character limit')
      .blur();
    cy.get('[data-test=lobbyNameError]').should('exist').and('be.visible');
    // Entering a valid name should remove the error.
    page.getFormField('lobbyName').clear().type('John Smith').blur();
    cy.get('[data-test=nameError]').should('not.exist');
  });

  describe('Adding a new lobby', () => {
    beforeEach(() => {
      cy.task('seed:database');
    });

    it('Should go to the right page, and have the right info', () => {
      const lobby: Lobby = {
        _id: null,
        userIDs: null,
        lobbyName: 'Test Lobby',
        round: null
      };

      // The `page.addlobby(lobby)` call ends with clicking the "Add lobby"
      // button on the interface. That then leads to the client sending an
      // HTTP request to the server, which has to process that request
      // (including making calls to add the lobby to the database and wait
      // for those to respond) before we get a response and can update the GUI.
      // By calling `cy.intercept()` we're saying we want Cypress to "notice"
      // when we go to `/api/lobbys`. The `AddlobbyComponent.submitForm()` method
      // routes to `/api/lobbys/{MongoDB-ID}` if the REST request to add the lobby
      // succeeds, and that routing will get "noticed" by the Cypress because
      // of the `cy.intercept()` call.
      //
      // The `.as('addlobby')` call basically gives that event a name (`addlobby`)
      // which we can use in things like `cy.wait()` to say which event or events
      // we want to wait for.
      //
      // The `cy.wait('@addlobby')` tells Cypress to wait until we have successfully
      // routed to `/api/lobbys` before we continue with the following checks. This
      // hopefully ensures that the server (and database) have completed all their
      // work, and that we should have a properly formed page on the client end
      // to check.
      cy.intercept('/api/lobbies').as('addLobby');
      page.addLobby(lobby);
      cy.wait('@addLobby');

      // New URL should end in the 24 hex character Mongo ID of the newly added lobby.
      // We'll wait up to five full minutes for this these `should()` assertions to succeed.
      // Hopefully that long timeout will help ensure that our Cypress tests pass in
      // GitHub Actions, where we're often running on slow VMs.

      // We should see the confirmation message at the bottom of the screen
      page.getSnackBar().should('contain', `Added lobby ${lobby.lobbyName}`);
    });

  });

});
