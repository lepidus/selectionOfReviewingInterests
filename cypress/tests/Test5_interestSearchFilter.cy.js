describe('Filtering reviews by interests', function () {
    it('Accessing the interests filter', function () {
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
    })
});
