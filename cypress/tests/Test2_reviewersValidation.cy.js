import '../support/commands.js';

describe('Reviewers must not use OJS without reviewing interests', function () {
    it('Reviewer without interests login', function () {

        let notificationText = 'You must select at least one reviewing interest in the "Roles" tab before you can access the system.';
        let itemText = 'Estudos teóricos e de campo em escalas que variam do local ao regional/global, abrangendo períodos de curta e longa duração, incluindo tempo geológico';

        cy.login('agallego', null, 'publicknowledge');
        cy.visit('index.php/publicknowledge/en/user/profile');
        cy.openRolesTab();
        cy.removeReviewingInterests();
        cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]')
                .click();
        cy.waitJQuery();
        cy.logout();

        cy.login('agallego', null, 'publicknowledge');
        cy.get('.pkpNotification').contains(notificationText).should('be.visible');

        cy.visit('index.php/publicknowledge/en/dashboard/reviewAssignments');
        cy.get('.pkpNotification').contains(notificationText).should('be.visible');

        cy.openRolesTab();
        cy.selectReviewingInterest(itemText);

        cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
        cy.waitJQuery();

        cy.visit('index.php/publicknowledge/en/dashboard/reviewAssignments');
        cy.url().should('include', '/dashboard');
    });

    it('Users without reviewer role are able to use OJS without any redirection', function () {
        cy.login('dbarnes', null, 'publicknowledge');
        cy.url().should('include', '/dashboard');
    });
});
