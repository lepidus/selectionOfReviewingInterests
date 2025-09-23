describe('Setup Selection Of Reviewing Interests plugin', function () {
    it('Enable the plugin in the plugins list', function () {
        cy.login('dbarnes', null, 'publicknowledge');
        cy.contains('a', 'Website').click();
        cy.waitJQuery();
        cy.get('#plugins-button').click();
        cy.get('input[id^=select-cell-selectionofreviewinginterests]').check();
        cy.get('input[id^=select-cell-selectionofreviewinginterests]').should('be.checked');
    })
});