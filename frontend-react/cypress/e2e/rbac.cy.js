describe('Role-Based Access Control', () => {
  it('shows all tabs for Owner', () => {
    cy.login('admin', 'admin');

    // Should see all restricted tabs
    cy.contains('button', 'Database Edit').should('exist');
    cy.contains('button', 'Audit Logs').should('exist');
    cy.contains('button', 'Market Intel').should('exist');
    cy.contains('button', 'Compliance').should('exist');
    cy.contains('button', 'Users').should('exist');
  });

  it('hides specific tabs for Employee', () => {
    cy.login('employee', 'employee');

    // Should only see general tabs
    cy.contains('button', 'Executive Reports').should('exist');
    cy.contains('button', 'Historical').should('exist');

    // Should NOT see restricted tabs
    cy.contains('button', 'Database Edit').should('not.exist');
    cy.contains('button', 'Audit Logs').should('not.exist');
    cy.contains('button', 'Market Intel').should('not.exist');
    cy.contains('button', 'Compliance').should('not.exist');
    cy.contains('button', 'Users').should('not.exist');
  });
});
