describe('Filtering reviews by interests', function () {
    it('Accessing the interests filter', function () {
        cy.login('dbarnes', null, 'publicknowledge');
        cy.contains('table tr', 'Transformative Impact of AI Tools on Modern Education: Opportunities, Challenges, and Future Directions')
		.contains('button', /^\s*View\s*$/)
		.scrollIntoView()
		.should('be.visible')
		.click({force: true});
        cy.get('[data-cy="reviewer-manager"] > :nth-child(1) > .border-x > .flex-shrink-0 > .flex > .pkpButton').click();
        cy.get('.pkpHeader__actions > .pkpButton').click();
        cy.get('[style="padding: 0px 0.5rem 0.5rem 1rem;"] > :nth-child(1) > input').click();
		cy.contains('Adela Gallego');
    })
});
