describe('Enable Selection Of Reviewing Interests plugin', function () {
    it('Enable the plugin in the plugins list', function () {
        cy.login('dbarnes', null, 'publicknowledge');
        cy.get('nav').contains('Settings').click();
        cy.get('nav').contains('Website').click({force: true});
        cy.get('button[id="plugins-button"]').click();
        cy.get('input[id^=select-cell-selectionofreviewinginterests]', {timeout: 20000}).check();
        cy.get('input[id^=select-cell-selectionofreviewinginterests]').should('be.checked');
    })
    it('View reviewing interests options configuration', function () {
        cy.login('dbarnes', null, 'publicknowledge');
        cy.get('nav').contains('Settings').click();
        cy.get('nav').contains('Website').click({force: true});
        cy.get('button[id="plugins-button"]').click();

        const pluginRowId = 'component-grid-settings-plugins-settingsplugingrid-category-generic-row-selectionofreviewinginterestsplugin';

        cy.get('tr#' + pluginRowId + ' a.show_extras', {timeout: 20000}).click();
        cy.get('a[id^=' + pluginRowId + '-settings-button]').click();
        cy.get('[data-cy="sidemodal-header"]').contains('Selection Field in Reviewing Interests Area');
        cy.waitJQuery();
        cy.get('a[id^=component-plugins-generic-selectionofreviewinginterests-controllers-grid-selectionofreviewinginterestsgrid-addOption-button-]').contains('Add option').click();
        cy.get('input[id^=optionName-]').should('be.visible');
    });
});
