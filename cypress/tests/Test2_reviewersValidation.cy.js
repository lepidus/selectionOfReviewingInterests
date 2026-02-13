describe('Reviewers must not use OJS without reviewing interests', function () {
    it('Reviewer without interests login', function () {
        cy.login('agallego', null, 'publicknowledge');
        cy.get('.pkpNotification').contains('You must select at least one reviewing interest in the "Roles" tab before you can access the system.').should('be.visible');

        cy.get('.app__returnHeaderLink').click();
        cy.get('.pkpNotification').contains('You must select at least one reviewing interest in the "Roles" tab before you can access the system.').should('be.visible');

        cy.get('#ui-id-5').click();
        cy.get('.interests').click();
        cy.get('li[class=ui-menu-item').contains("Estudos teóricos e de campo em escalas que variam do local ao regional/global, abrangendo períodos de curta e longa duração, incluindo tempo geológico").click();

        cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]')
                .click();
        
        cy.get('.app__returnHeaderLink').click();
        cy.get('.app__pageHeading').contains('Submissions').should('be.visible');
    });

    it('Users without reviewer role must use OJS with any problems', function () {
        cy.login('dbarnes', null, 'publicknowledge');
        cy.get('.app__pageHeading').contains('Submissions').should('be.visible');
    });
});