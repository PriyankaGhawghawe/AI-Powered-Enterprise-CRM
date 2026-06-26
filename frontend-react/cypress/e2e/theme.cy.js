describe('Theme Toggling', () => {
  beforeEach(() => {
    cy.login();
  });

  it('toggles between dark and light mode', () => {
    // AppContext sets 'dark' by default initially
    // The class 'dark' is applied to a main div, not the body. Let's find it by checking if dark is in its classes.
    cy.get('button[title="Toggle Theme"]').should('exist');
    
    cy.get('html').then(($html) => {
      const isDark = $html.hasClass('dark');
      
      // Click the theme toggle button
      cy.get('button[title="Toggle Theme"]').click();
      
      // The class should have toggled
      if (isDark) {
        cy.get('html').should('not.have.class', 'dark');
      } else {
        cy.get('html').should('have.class', 'dark');
      }
    });
  });
});
