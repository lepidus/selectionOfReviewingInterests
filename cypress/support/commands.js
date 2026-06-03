Cypress.Commands.add('openRolesTab', () => {
    cy.get('a[name="roles"]').click();
    cy.waitJQuery();
});

Cypress.Commands.add('removeReviewingInterests', () => {
    cy.get('body').then(($body) => {
        if (!$body.find('.interests .tagit-choice .tagit-close').length) {
            return;
        }

        cy.get('.interests .tagit-choice .tagit-close').first().click();
        cy.removeReviewingInterests();
    });
});

Cypress.Commands.add('selectReviewingInterest', (itemText) => {
    cy.get('.interests .tagit-new input')
        .should('be.visible')
        .click()
        .clear();

    cy.get('.interests').then(($interests) => {
        $interests.tagit('createTag', itemText);
    });
    cy.get('.interests .tagit-label').contains(itemText).should('be.visible');
});
