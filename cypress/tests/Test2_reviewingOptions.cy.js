describe('Configure reviewing interests options', function () {
    function closeLatestModal() {
        cy.get('.pkpModalCloseButton:visible').last().click();
    }

    it('Create options', function () {
        cy.login('dbarnes', null, 'publicknowledge');
        cy.contains('a', 'Website').click();
        cy.waitJQuery();
        cy.get('#plugins-button').click();

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

        function addOption(optionText) {
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
        }

        options.forEach((optionText) => {
            addOption(optionText);
        });

        const temporaryOption = 'Temporary option used to test secure deletion';
        addOption(temporaryOption);

        cy.contains('tr.gridRow', temporaryOption).then(($row) => {
            cy.wrap($row).find('a.show_extras').click();
            cy.wrap($row).next('tr.row_controls')
                .find('a[id*="-deleteOption-button-"]')
                .then(($deleteLink) => {
                const linkActionRequest = $deleteLink.data('pkp.handler').linkActionRequest_;
                cy.wrap($deleteLink).click();
                cy.then(() => {
                    const modalHandler = linkActionRequest.$modal_.data('pkp.handler');
                    cy.wrap({
                        url: modalHandler.remoteAction_,
                        csrfToken: modalHandler.postData_.csrfToken
                    }).as('deleteRequest');
                    closeLatestModal();
                });
            });
        });

        cy.get('@deleteRequest').then((deleteRequest) => {
            cy.request({
                method: 'GET',
                url: deleteRequest.url,
                failOnStatusCode: false
            }).its('body.status').should('eq', false);

            cy.request({
                method: 'POST',
                url: deleteRequest.url,
                form: true,
                body: {}
            }).its('body.status').should('eq', false);

            cy.request({
                method: 'POST',
                url: deleteRequest.url,
                form: true,
                body: {csrfToken: 'invalid-token'}
            }).its('body.status').should('eq', false);

            cy.request({
                method: 'POST',
                url: deleteRequest.url.replace(/optionId=[^&]*/, 'optionId%5B%5D=0'),
                form: true,
                body: {csrfToken: deleteRequest.csrfToken}
            }).its('body.status').should('eq', false);

            cy.contains('tr.gridRow', temporaryOption).should('exist');

            cy.login('agallego', null, 'publicknowledge');
            cy.visit('index.php/publicknowledge/user/profile');
            cy.get('#profileTabs').find('li a').contains('Roles').click();
            cy.get('#rolesForm input[name="csrfToken"]').invoke('val').then((reviewerCsrfToken) => {
                cy.request({
                    method: 'POST',
                    url: deleteRequest.url,
                    form: true,
                    body: {csrfToken: reviewerCsrfToken},
                    failOnStatusCode: false
                }).its('status').should('be.oneOf', [200, 403]);
            });

            cy.login('dbarnes', null, 'publicknowledge');
            cy.visit('index.php/publicknowledge/submissions');
            cy.contains('a', 'Website').click();
            cy.waitJQuery();
            cy.get('#plugins-button').click();
            cy.get('tr#' + pluginRowId + ' a.show_extras').click();
            cy.get('a[id^=' + pluginRowId + '-settings-button]').click();
            cy.waitJQuery();

            cy.contains('tr.gridRow', temporaryOption).then(($row) => {
                cy.wrap($row).find('a.show_extras').click();
                cy.wrap($row).next('tr.row_controls')
                    .find('a[id*="-deleteOption-button-"]')
                    .then(($deleteLink) => {
                    const linkActionRequest = $deleteLink.data('pkp.handler').linkActionRequest_;
                    cy.wrap($deleteLink).click();
                    cy.then(() => {
                        const modalHandler = linkActionRequest.$modal_.data('pkp.handler');
                        cy.request({
                            method: 'POST',
                            url: modalHandler.remoteAction_,
                            form: true,
                            body: {csrfToken: modalHandler.postData_.csrfToken}
                        }).its('body.status').should('eq', true);
                        closeLatestModal();
                    });
                });
            });

            cy.visit('index.php/publicknowledge/submissions');
            cy.contains('a', 'Website').click();
            cy.waitJQuery();
            cy.get('#plugins-button').click();
            cy.get('tr#' + pluginRowId + ' a.show_extras').click();
            cy.get('a[id^=' + pluginRowId + '-settings-button]').click();
            cy.waitJQuery();
            cy.contains('tr.gridRow', temporaryOption).should('not.exist');
            cy.contains('tr.gridRow', options[0]).should('exist');
        });
    });
});
