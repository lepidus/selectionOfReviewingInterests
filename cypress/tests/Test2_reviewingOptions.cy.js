describe('Configure reviewing interests options', function () {
    function openPluginSettings() {
        cy.visit('/index.php/publicknowledge/en/management/settings/website#plugins');
        cy.get('button[id="plugins-button"]').click();

        const pluginRowId = 'component-grid-settings-plugins-settingsplugingrid-category-generic-row-selectionofreviewinginterestsplugin';
        cy.get('tr#' + pluginRowId + ' a.show_extras').click();
        cy.get('a[id^=' + pluginRowId + '-settings-button]').click();
        cy.waitJQuery();
    }

    it('Create options', function () {
        cy.login('dbarnes', null, 'publicknowledge');
        openPluginSettings();

        const options = [
            'Estudos teóricos e de campo em escalas que variam do local ao regional/global, abrangendo períodos de curta e longa duração, incluindo tempo geológico',
            'Inovações em técnicas e instrumentação para campo e laboratório (e.g., hidrológicas, geoquímicas, geofísicas e matemáticas)',
            'Gestão integrada dos recursos hídricos, com foco em usos conjuntivos e sustentabilidade',
            'Aplicações da hidrogeologia nas engenharias, geofísica, geotecnia e mineração',
            'Estado da arte e filosofia dos métodos científicos em hidrogeologia e áreas correlatas',
            'Temporary option for deletion security tests'
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

        const temporaryOption = options[options.length - 1];
        let deleteUrl;
        let csrfToken;

        cy.contains('tr', temporaryOption).then(($row) => {
            const rowId = $row.attr('id');
            cy.wrap($row).find('a.show_extras').click({force: true});
            cy.get('#' + rowId + '-control-row').contains('a', 'Delete').then(($button) => {
                const request = $button.data('pkp.handler').linkActionRequest_;
                deleteUrl = request.remoteAction_;
                csrfToken = request.postData_.csrfToken;
            });
        });

        cy.then(() => cy.request({
            method: 'GET',
            url: deleteUrl,
            qs: {csrfToken},
            failOnStatusCode: false,
        })).its('body.status').should('eq', false);

        cy.then(() => cy.request({
            method: 'POST',
            url: deleteUrl,
            body: {},
            form: true,
            failOnStatusCode: false,
        })).its('body.status').should('eq', false);

        cy.then(() => cy.request({
            method: 'POST',
            url: deleteUrl,
            body: {csrfToken: 'invalid-token'},
            form: true,
            failOnStatusCode: false,
        })).its('body.status').should('eq', false);

        cy.then(() => {
            const invalidIdUrl = new URL(deleteUrl);
            invalidIdUrl.searchParams.delete('optionId');
            invalidIdUrl.searchParams.append('optionId[]', 'invalid');
            return cy.request({
                method: 'POST',
                url: invalidIdUrl.toString(),
                body: {csrfToken},
                form: true,
                failOnStatusCode: false,
            });
        }).its('body.status').should('eq', false);

        cy.then(() => {
            const malformedIdUrl = new URL(deleteUrl);
            malformedIdUrl.searchParams.set('optionId', 'not-an-option-id');
            return cy.request({
                method: 'POST',
                url: malformedIdUrl.toString(),
                body: {csrfToken},
                form: true,
                failOnStatusCode: false,
            });
        }).its('body.status').should('eq', false);

        cy.contains(temporaryOption).should('exist');
        cy.logout();

        ['ccorino', 'agallego', 'cmontgomerie'].forEach((username) => {
            cy.login(username, null, 'publicknowledge');
            cy.visit('/index.php/publicknowledge/en/user/profile');
            cy.get('input[name="csrfToken"]').first().invoke('val').then((roleCsrfToken) => {
                cy.request({
                    method: 'POST',
                    url: deleteUrl,
                    body: {csrfToken: roleCsrfToken},
                    form: true,
                    failOnStatusCode: false,
                }).then((response) => {
                    expect(response.status).to.be.oneOf([200, 401, 403]);
                    if (response.status === 200 && response.body && typeof response.body === 'object') {
                        expect(response.body.status).to.eq(false);
                    }
                });
            });
            cy.logout();
        });

        cy.login('dbarnes', null, 'publicknowledge');
        openPluginSettings();
        cy.contains(temporaryOption).should('exist');

        cy.then(() => {
            const button = Cypress.$('tr:contains("' + temporaryOption + '")')
                .next('tr.row_controls')
                .find('a:contains("Delete")');
            const request = button.data('pkp.handler').linkActionRequest_;
            return cy.request({
                method: 'POST',
                url: request.remoteAction_,
                body: {csrfToken: request.postData_.csrfToken},
                form: true,
            });
        }).its('body.status').should('eq', true);

        openPluginSettings();
        cy.contains(temporaryOption).should('not.exist');
    });
});
