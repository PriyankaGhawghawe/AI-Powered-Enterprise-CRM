describe('Login Flow', () => {
  it('passes the login screen successfully', () => {
    cy.visit('/');
    cy.contains('BusinessOS');
    
    // Check that we're on the login page
    cy.url().should('include', '/login');
    
    // Click the mock login button
    cy.get('button[type="submit"]').click();
    
    // Verify it navigates to the dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Executive Reports');
  });
});
