describe('Filtering reviews by interests', function () {
    function getLatestCreateReviewerForm() {
        return cy.get('.pkp_modal.is_visible #createReviewerForm').last();
    }

    function interceptReviewerCreation(alias, reviewerUsername) {
        cy.intercept('POST', '**', (request) => {
            const body = typeof request.body === 'string'
                ? request.body
                : JSON.stringify(request.body || {});
            if (body.includes('username=' + reviewerUsername)) {
                request.alias = alias;
            }
        });
    }

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
        getLatestCreateReviewerForm().should('exist').scrollIntoView();
        getLatestCreateReviewerForm().find('input[name="givenName[en]"]').first().scrollIntoView().type('Sori Created', {force: true});
        getLatestCreateReviewerForm().find('input[name="familyName[en]"]').first().scrollIntoView().type('Reviewer', {force: true});
        getLatestCreateReviewerForm().find('input[name="username"]').first().scrollIntoView().type(reviewerUsername, {force: true});
        getLatestCreateReviewerForm().find('input[name="email"]').first().scrollIntoView().type(reviewerUsername + '@example.com', {force: true});
        getLatestCreateReviewerForm().then(($form) => {
            const $select = $form.find('select[name="userGroupId"]');
            if ($select.length) {
                cy.wrap($select).scrollIntoView().select(1, {force: true});
            } else {
                expect($form.find('input[name="userGroupId"]')).to.have.length(1);
            }
        });
        getLatestCreateReviewerForm().find('input[name="skipEmail"]').first().scrollIntoView().check({force: true});
        getLatestCreateReviewerForm().then(($form) => {
            Cypress.$('<input>', {
                type: 'hidden',
                name: 'interests[]',
                value: 'Injected interest in reviewer creation'
            }).appendTo($form);
        });

        interceptReviewerCreation('invalidReviewerCreation', reviewerUsername);
        getLatestCreateReviewerForm().find('button[id^="submitFormButton"]').first().scrollIntoView().click({force: true});
        cy.wait('@invalidReviewerCreation').then(({response}) => {
            expect(response.statusCode).to.eq(200);
            expect(JSON.stringify(response.body)).to.contain(invalidInterestMessage);
        });
        getLatestCreateReviewerForm().contains(invalidInterestMessage).first().should('exist').scrollIntoView();

        getLatestCreateReviewerForm().then(($form) => $form.find('[name^="interests"]').remove());
        interceptReviewerCreation('validReviewerCreation', reviewerUsername);
        getLatestCreateReviewerForm().find('button[id^="submitFormButton"]').first().scrollIntoView().click({force: true});
        cy.wait('@validReviewerCreation').then(({response}) => {
            expect(response.statusCode).to.eq(200);
            expect(JSON.stringify(response.body)).not.to.contain('already in use');
            expect(JSON.stringify(response.body)).to.contain('dataChanged');
        });
    })
});
