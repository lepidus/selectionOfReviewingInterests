describe('Reviewers must not use OJS without reviewing interests', function () {
    it('Reviewer without interests login', function () {

        let notificationText = 'You must select at least one reviewing interest in the "Roles" tab before you can access the system.';
        let itemText = 'Estudos teóricos e de campo em escalas que variam do local ao regional/global, abrangendo períodos de curta e longa duração, incluindo tempo geológico';
        let invalidInterest = 'Interest injected outside the predefined list';
        let invalidInterestMessage = 'Select only the predefined reviewing interests.';

        cy.login('agallego', null, 'publicknowledge');
        cy.get('.pkpNotification').contains(notificationText).should('be.visible');

        cy.get('.app__returnHeaderLink').click();
        cy.get('.pkpNotification').contains(notificationText).should('be.visible');

        cy.get('#ui-id-5').click();
        cy.get('.interests').click();
        cy.get('li[class=ui-menu-item').contains(itemText).click();
        cy.get('.tagit-label').contains(itemText).click();

        cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]')
                .click();
        
        cy.get('.app__returnHeaderLink').click();
        cy.get('.app__pageHeading').contains('Submissions').should('be.visible');

        cy.visit('index.php/publicknowledge/user/profile');
        cy.get('#profileTabs').find('li a').contains('Roles').click();
        cy.waitJQuery();
        cy.get('#rolesForm').then(($form) => {
            Cypress.$('<input>', {
                type: 'hidden',
                name: 'interests[]',
                value: invalidInterest
            }).appendTo($form);
        });
        cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
        cy.contains(invalidInterestMessage).should('be.visible');

        cy.visit('index.php/publicknowledge/user/profile');
        cy.get('#profileTabs').find('li a').contains('Roles').click();
        cy.waitJQuery();
        cy.get('.interests .tagit-label').contains(invalidInterest).should('not.exist');
        cy.get('.interests .tagit-label').contains(itemText).should('exist');
    });

    it('Users without reviewer role must use OJS with any problems', function () {
        cy.login('dbarnes', null, 'publicknowledge');
        cy.get('.app__pageHeading').contains('Submissions').should('be.visible');
    });
});
