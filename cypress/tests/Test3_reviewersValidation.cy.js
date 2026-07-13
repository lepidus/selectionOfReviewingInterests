import '../support/commands.js';

describe('Reviewers must not use OJS without reviewing interests', function () {
    function appendCanonicalizationCases($form, validInterest) {
        ['', '   ', validInterest, '  ' + validInterest + '  '].forEach((interest) => {
            $form.append(Cypress.$('<input>', {
                type: 'hidden',
                name: 'interests[]',
                value: interest
            }));
        });
    }

    function assertCanonicalInterest($form, validInterest) {
        const interests = $form.find('input[name="interests[]"]')
            .toArray()
            .map((input) => Cypress.$(input).val());

        expect(interests.filter((interest) => interest === validInterest)).to.have.length(1);
        expect(interests.filter((interest) => interest.trim() === '')).to.have.length(0);
    }

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

        cy.intercept('POST', '**/save-roles*').as('saveAllowedInterest');
        cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
        cy.wait('@saveAllowedInterest').its('response.body.status').should('eq', true);
        cy.waitJQuery();

        cy.visit('index.php/publicknowledge/en/user/profile');
        cy.openRolesTab();
        cy.get('.interests').should('contain.text', itemText);
        cy.get('#rolesForm').then(($form) => {
            appendCanonicalizationCases($form, itemText);
            cy.request({
                method: 'POST',
                url: $form.attr('action'),
                body: $form.serialize(),
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.status).to.eq(true);
            });
        });

        cy.visit('index.php/publicknowledge/en/user/profile');
        cy.openRolesTab();
        cy.get('#rolesForm').should(($form) => {
            assertCanonicalInterest($form, itemText);
        });
        cy.get('#rolesForm').then(($form) => {
            $form.append('<input type="hidden" name="interests[]" value="Injected interest">');
        });
        cy.intercept('POST', '**/save-roles*').as('rejectInjectedInterest');
        cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
        cy.wait('@rejectInjectedInterest').its('response.body.status').should('eq', false);
        cy.waitJQuery();

        cy.contains(
            'Select only reviewing interests configured for this journal. Previously saved interests may be preserved.'
        ).should('be.visible');

        cy.visit('index.php/publicknowledge/en/user/profile');
        cy.openRolesTab();
        cy.get('.interests').should('not.contain.text', 'Injected interest');
        cy.get('.interests').should('contain.text', itemText);
        cy.get('#rolesForm').should(($form) => {
            assertCanonicalInterest($form, itemText);
        });

        cy.visit('index.php/publicknowledge/en/dashboard/reviewAssignments');
        cy.url().should('include', '/dashboard');
    });

    it('Users without reviewer role are able to use OJS without any redirection', function () {
        cy.login('dbarnes', null, 'publicknowledge');
        cy.url().should('include', '/dashboard');
    });
});
