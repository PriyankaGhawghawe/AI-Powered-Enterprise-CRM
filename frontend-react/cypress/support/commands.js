// Cypress custom commands
Cypress.Commands.add('login', (username = 'admin', password = 'admin') => {
  cy.visit('/');
  
  cy.get('input[type="text"]').clear().type(username);
  cy.get('input[type="password"]').clear().type(password);
  
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});
