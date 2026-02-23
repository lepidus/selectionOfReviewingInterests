describe('Configure reviewing interests options', function () {
    it('Create options', function () {
        cy.login('dbarnes', null, 'publicknowledge');
        cy.get('nav').contains('Settings').click();
        cy.get('nav').contains('Website').click({force: true});
        cy.get('button[id="plugins-button"]').click();

        const pluginRowId = 'component-grid-settings-plugins-settingsplugingrid-category-generic-row-selectionofreviewinginterestsplugin';

        cy.get('tr#' + pluginRowId + ' a.show_extras', {timeout: 20000}).click();
        cy.get('a[id^=' + pluginRowId + '-settings-button]').click();

        const options = [
            'Estudos teóricos e de campo em escalas que variam do local ao regional/global, abrangendo períodos de curta e longa duração, incluindo tempo geológico',
            'Inovações em técnicas e instrumentação para campo e laboratório (e.g., hidrológicas, geoquímicas, geofísicas e matemáticas)',
            'Gestão integrada dos recursos hídricos, com foco em usos conjuntivos e sustentabilidade',
            'Aplicações da hidrogeologia nas engenharias, geofísica, geotecnia e mineração',
            'Estado da arte e filosofia dos métodos científicos em hidrogeologia e áreas correlatas'
        ];

        options.forEach((optionText) => {
            cy.get('a[id^=component-plugins-generic-selectionofreviewinginterests-controllers-grid-selectionofreviewinginterestsgrid-addOption-button-]')
                .contains('Add option')
                .click();

            cy.waitJQuery();

            cy.get('input[id^=optionName-]')
                .clear()
                .type(optionText, { delay: 0 });

            cy.get('#interestOptionForm > .formButtons > button[id^=submitFormButton]')
                .click();

            cy.waitJQuery();
            cy.contains(optionText).should('exist');
        });
    });
});
