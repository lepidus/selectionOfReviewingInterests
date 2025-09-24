describe('Enable Selection Of Reviewing Interests plugin', function () {
    it('Enable the plugin in the plugins list', function () {
        cy.login('dbarnes', null, 'publicknowledge');
        cy.contains('a', 'Website').click();
        cy.waitJQuery();
        cy.get('#plugins-button').click();
        cy.get('input[id^=select-cell-selectionofreviewinginterests]').check();
        cy.get('input[id^=select-cell-selectionofreviewinginterests]').should('be.checked');
    })
    it('View reviewing interests options configuration', function () {
        cy.login('dbarnes', null, 'publicknowledge');
        cy.contains('a', 'Website').click();
        cy.waitJQuery();
        cy.get('#plugins-button').click();

        const pluginRowId = 'component-grid-settings-plugins-settingsplugingrid-category-generic-row-selectionofreviewinginterestsplugin';

        cy.get('tr#' + pluginRowId + ' a.show_extras').click();
        cy.get('a[id^=' + pluginRowId + '-settings-button]').click();
        cy.get('.pkp_modal_panel > :nth-child(1)').contains('Selection Field in Reviewing Interests Area');
        cy.waitJQuery();
        cy.get('a[id^=component-plugins-generic-selectionofreviewinginterests-controllers-grid-selectionofreviewinginterestsgrid-addOption-button-]').contains('Add option').click();
        cy.get('input[id^=optionName-]').should('be.visible');
    });
});