import { JoinLobbyPage } from "cypress/support/join-lobby.po";

describe('Join Lobby', () => {
  const page = new JoinLobbyPage();

  beforeEach(() => {
    page.navigateTo();
  });

  it('Should have the correct title', () => {
    page.getTitle().should('have.text', 'Join');
  });

  it('Join Lobby button should be enabled', () => {
    // ADD lobby button should be disabled until all the necessary fields
    // are filled. Once the last (`#emailField`) is filled, then the button should
    // become enabled.
    page.addLobbyButton().should('be.enabled');
    page.getClass('join-lobby').type('test');
    page.addLobbyButton().should('be.enabled');
  })
});
