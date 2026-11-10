describe('Configure reviewing interests options', function () {
    function closeLatestModal() {
        cy.get('.pkpModalCloseButton:visible').last().click();
    }

    it('Create options', function () {
        cy.login('dbarnes', null, 'publicknowledge');
        cy.get('nav').contains('Settings').click();
        cy.get('nav').contains('Website').click({force: true});
        cy.get('button[id="plugins-button"]').click();

        const pluginRowId = 'component-grid-settings-plugins-settingsplugingrid-category-generic-row-selectionofreviewinginterestsplugin';

        cy.get('tr#' + pluginRowId + ' a.show_extras').click();
        cy.get('a[id^=' + pluginRowId + '-settings-button]').click();

        const options = [
            'Estudos teóricos e de campo em escalas que variam do local ao regional/global, abrangendo períodos de curta e longa duração, incluindo tempo geológico',
            'Inovações em técnicas e instrumentação para campo e laboratório (e.g., hidrológicas, geoquímicas, geofísicas e matemáticas)',
            'Gestão integrada dos recursos hídricos, com foco em usos conjuntivos e sustentabilidade',
            'Aplicações da hidrogeologia nas engenharias, geofísica, geotecnia e mineração',
            'Estado da arte e filosofia dos métodos científicos em hidrogeologia e áreas correlatas'
        ];

        options.forEach((optionText) => {
            cy.get('a[id^=component-plugins-generic-selectionofreviewinginterests-controllers-grid-interestoptionsgrid-addOption-button-]')
                .contains('Add option')
                .click();

            cy.wait(1000);

            cy.get('input[id^=optionName-]')
                .clear()
                .type(optionText, { delay: 0 });

            cy.get('#interestOptionForm > .formButtons > button[id^=submitFormButton]')
                .click();

            cy.waitJQuery();
            cy.contains(optionText).should('exist');
        });

        const deletionTestOption = 'Disposable option for deletion security tests';
        cy.get('a[id^=component-plugins-generic-selectionofreviewinginterests-controllers-grid-interestoptionsgrid-addOption-button-]')
            .contains('Add option')
            .click();
        cy.wait(1000);
        cy.get('input[id^=optionName-]').clear().type(deletionTestOption, {delay: 0});
        cy.get('#interestOptionForm > .formButtons > button[id^=submitFormButton]').click();
        cy.waitJQuery();

        cy.contains('tr.gridRow', deletionTestOption).find('a.show_extras').click();
        cy.contains('tr.gridRow', deletionTestOption)
            .next('tr.row_controls')
            .find('a[id*="-deleteOption-button-"]')
            .then(($deleteLink) => {
                const linkActionRequest = $deleteLink.data('pkp.handler').linkActionRequest_;
                cy.wrap($deleteLink).click();
                cy.then(() => {
                    const modalHandler = linkActionRequest.$modal_.data('pkp.handler');
                    cy.wrap({
                        remoteAction: modalHandler.remoteAction_,
                        csrfToken: modalHandler.postData_.csrfToken
                    }).as('deleteRequest');
                    closeLatestModal();
                });
            });

        cy.get('@deleteRequest').then(({remoteAction, csrfToken}) => {

            cy.request({
                    method: 'GET',
                    url: remoteAction,
                    failOnStatusCode: false
                }).its('body.status').should('eq', false);

            cy.request({
                    method: 'POST',
                    url: remoteAction,
                    body: {},
                    form: true,
                    failOnStatusCode: false
                }).its('body.status').should('eq', false);

            cy.request({
                    method: 'POST',
                    url: remoteAction,
                    body: {csrfToken: 'invalid-token'},
                    form: true,
                    failOnStatusCode: false
                }).its('body.status').should('eq', false);

            const invalidIdUrl = new URL(remoteAction);
            invalidIdUrl.searchParams.set('optionId', 'not-a-valid-option-id');
            cy.request({
                    method: 'POST',
                    url: invalidIdUrl.toString(),
                    body: {csrfToken},
                    form: true,
                    failOnStatusCode: false
                }).its('body.status').should('eq', false);

            cy.request({
                    method: 'POST',
                    url: remoteAction,
                    body: {csrfToken},
                    form: true
                }).its('body.status').should('eq', true);
        });

        cy.reload();
        cy.waitJQuery();
        cy.contains(deletionTestOption).should('not.exist');
    });
});
