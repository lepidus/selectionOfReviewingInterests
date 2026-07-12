describe('Filtering reviews by interests', function () {
    it('Accessing the interests filter', function () {
        const reviewerUsername = 'sori_created_reviewer';
        const invalidInterestMessage = 'Select only the predefined reviewing interests.';

        cy.login('dbarnes', null, 'publicknowledge');
        cy.get('.listPanel__itemSubtitle:visible:contains("Finocchiaro: Arguments About Arguments")').first()
        .parent().parent().within(() => {
            cy.get('.pkpButton:contains("View")').click();
        });
        
        cy.get('#ui-id-3').click();
        cy.get('a[id^=component-grid-users-reviewer-reviewergrid-addReviewer-button-]').click();
        cy.get('[description=""] > .listPanel > .listPanel__header > .pkpHeader > .pkpHeader__actions > .pkpButton').click();
        cy.get('[style="padding: 0px 0.5rem 0.5rem 1rem;"] > :nth-child(1) > input').click();
		cy.contains('Adela Gallego');

        cy.contains('a', 'Create New Reviewer').click();
        cy.waitJQuery();
        cy.get('#createReviewerForm').should('be.visible');
        cy.get('#createReviewerForm input[name="givenName[en]"]').type('Sori Created');
        cy.get('#createReviewerForm input[name="familyName[en]"]').type('Reviewer');
        cy.get('#createReviewerForm input[name="username"]').type(reviewerUsername);
        cy.get('#createReviewerForm input[name="email"]').type(reviewerUsername + '@example.com');
        cy.get('#createReviewerForm').then(($form) => {
            const $select = $form.find('select[name="userGroupId"]');
            if ($select.length) {
                cy.wrap($select).select(1);
            } else {
                expect($form.find('input[name="userGroupId"]')).to.have.length(1);
            }
        });
        cy.get('#createReviewerForm input[name="skipEmail"]').check();
        cy.get('#createReviewerForm').then(($form) => {
            Cypress.$('<input>', {
                type: 'hidden',
                name: 'interests[]',
                value: 'Injected interest in reviewer creation'
            }).appendTo($form);
        });

        cy.intercept('POST', '**/createReviewer*').as('invalidReviewerCreation');
        cy.get('#createReviewerForm button[id^="submitFormButton"]').click();
        cy.wait('@invalidReviewerCreation').its('response.statusCode').should('eq', 200);
        cy.contains(invalidInterestMessage).should('be.visible');

        cy.get('#createReviewerForm [name^="interests"]').then(($interests) => $interests.remove());
        cy.intercept('POST', '**/createReviewer*').as('validReviewerCreation');
        cy.get('#createReviewerForm button[id^="submitFormButton"]').click();
        cy.wait('@validReviewerCreation').then(({response}) => {
            expect(response.statusCode).to.eq(200);
            expect(JSON.stringify(response.body)).not.to.contain('already in use');
            expect(JSON.stringify(response.body)).to.contain('dataChanged');
        });
    })
});
