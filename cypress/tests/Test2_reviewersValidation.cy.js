describe('Reviewers must not use OJS without reviewing interests', function () {
    it('Reviewer without interests login', function () {
        cy.login('agallego', null, 'publicknowledge');
        cy.get('.pkpNotification').contains('You must select at least one reviewing interest in the "Roles" tab before you can access the system.').should('be.visible');

        cy.visit('index.php/publicknowledge/en/dashboard/reviewAssignments');
        cy.get('.pkpNotification').contains('You must select at least one reviewing interest in the "Roles" tab before you can access the system.').should('be.visible');

        cy.get('a[name="roles"]').click();
        cy.waitJQuery();
        cy.get('.interests').click();
        cy.get('li.ui-menu-item').contains("Estudos teóricos e de campo em escalas que variam do local ao regional/global, abrangendo períodos de curta e longa duração, incluindo tempo geológico").click();

        cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]')
                .click();
        cy.waitJQuery();

        cy.visit('index.php/publicknowledge/en/dashboard/reviewAssignments');
        cy.url().should('include', '/dashboard');
    });

    it('Users without reviewer role must use OJS with any problems', function () {
        cy.login('dbarnes', null, 'publicknowledge');
        cy.url().should('include', '/dashboard');
    });
});
