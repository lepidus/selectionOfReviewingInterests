describe('Reviewers must not use OJS without reviewing interests', function () {
    it('Reviewer without interests login', function () {

        let notificationText = 'You must select at least one reviewing interest in the "Roles" tab before you can access the system.';
        let itemText = 'Estudos teóricos e de campo em escalas que variam do local ao regional/global, abrangendo períodos de curta e longa duração, incluindo tempo geológico';

        cy.login('agallego', null, 'publicknowledge');
        cy.get('.pkpNotification').contains(notificationText).should('be.visible');

        cy.visit('index.php/publicknowledge/en/dashboard/reviewAssignments');
        cy.get('.pkpNotification').contains(notificationText).should('be.visible');

        cy.get('a[name="roles"]').click();
        cy.waitJQuery();
        cy.get('.interests').click();
        cy.get('li.ui-menu-item').contains(itemText).click();
        cy.get('.tagit-label').contains(itemText).click();

        cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]')
                .click();
        cy.waitJQuery();

        cy.visit('index.php/publicknowledge/en/dashboard/reviewAssignments');
        cy.url().should('include', '/dashboard');
    });

    it('Users without reviewer role are able to use OJS without any redirection', function () {
        cy.login('dbarnes', null, 'publicknowledge');
        cy.url().should('include', '/dashboard');
    });
});
