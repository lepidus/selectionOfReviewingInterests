describe('Accessing profile from other contexts works normally', function () {
	const secondJournalPath = 'secondjournal';

	it('Creates a second journal', function () {
		cy.login('admin', 'admin');
		cy.visit('/index.php/index/admin/contexts');
		cy.get('div[id=contextGridContainer]').find('a').contains('Create').click();

		cy.wait(1000); // Wait for the modal to open
		cy.get('input[name="name-en_US"]').type('Second Journal', {delay: 0});
		cy.get('input[name=acronym-en_US]').type('SJ', {delay: 0});
		cy.get('span').contains('Enable this journal').siblings('input').check();
		cy.get('input[name="supportedLocales"][value="en_US"]').check();
		cy.get('input[name="primaryLocale"][value="en_US"]').check();
		cy.get('input[name=urlPath]').clear().type(secondJournalPath, {delay: 0});
		cy.get('button').contains('Save').click();

		cy.contains('Settings Wizard', {timeout: 30000});
	});

	it('Reviewer accesses profile from the second journal without plugin interference', function () {
		cy.login('agallego', null, secondJournalPath);

		cy.visit('index.php/' + secondJournalPath + '/user/profile');
		cy.get('#profileTabs').should('be.visible');

		cy.get('.pkpNotification').should('not.exist');

		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();

		cy.get('.interests').should('be.visible');
		cy.get('.interests .tagit-choice').should('have.length.at.least', 1);

		cy.get('input[id^="reviewerGroup-"]').first().check();
		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();
	});

	it('Reviewer can navigate to submissions from the second journal', function () {
		cy.login('agallego', null, secondJournalPath);
		cy.get('.app__pageHeading').contains('Submissions').should('be.visible');

		cy.get('.pkpNotification').should('not.exist');
		cy.logout();
	});

	it('Reviewer adds a free-text interest from the second journal', function () {
		cy.login('agallego', null, secondJournalPath);
		cy.visit('index.php/' + secondJournalPath + '/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();

		cy.get('.interests .tagit-new input').type('Custom Research Topic', {delay: 0});
		cy.get('.interests .tagit-new input').type('{enter}');
		cy.get('.interests .tagit-choice').contains('Custom Research Topic').should('exist');

		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();
	});

	it('Free-text interests from other journals are displayed in journal with plugin', function () {
		cy.login('agallego', null, 'publicknowledge');
		cy.visit('index.php/publicknowledge/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();

		cy.get('.interests .tagit-choice').contains('Custom Research Topic').should('be.visible');
		cy.get('.interests .tagit-choice').contains('Estudos teóricos').should('be.visible');
	});

	it('Preserves legacy interests and isolates options and deletion by context', function () {
		cy.login('agallego', null, 'publicknowledge');
		cy.visit('index.php/publicknowledge/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();

		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();

		cy.visit('index.php/publicknowledge/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();

		cy.get('.interests .tagit-choice').contains('Custom Research Topic').should('be.visible');
		cy.get('.interests .tagit-choice').contains('Estudos teóricos').should('be.visible');

		cy.get('.interests .tagit-choice')
			.contains('Custom Research Topic')
			.parents('.tagit-choice')
			.find('.tagit-close')
			.click();
		cy.get('#rolesForm input[name="interests[]"]').then(($inputs) => {
			$inputs.filter(function () {
				return Cypress.$(this).val() === 'Custom Research Topic';
			}).remove();
		});
		cy.get('#rolesForm input[name="interests[]"]').should(($inputs) => {
			const values = $inputs.toArray().map((input) => Cypress.$(input).val());
			expect(values).not.to.include('Custom Research Topic');
		});
		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();

		cy.visit('index.php/publicknowledge/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();
		cy.get('.interests .tagit-label').contains('Custom Research Topic').should('not.exist');

		cy.get('#rolesForm').then(($form) => {
			Cypress.$('<input>', {
				type: 'hidden',
				name: 'interests[]',
				value: 'Custom Research Topic'
			}).appendTo($form);
		});
		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.contains('Select only the predefined reviewing interests.').should('be.visible');

		cy.visit('index.php/publicknowledge/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();
		cy.get('.interests .tagit-label').contains('Custom Research Topic').should('not.exist');

		const secondContextOption = 'Second journal exclusive interest';
		const publicContextOption = 'Inovações em técnicas e instrumentação para campo e laboratório (e.g., hidrológicas, geoquímicas, geofísicas e matemáticas)';
		const pluginRowId = 'component-grid-settings-plugins-settingsplugingrid-category-generic-row-selectionofreviewinginterestsplugin';

		function openPluginSettings(contextPath) {
			cy.visit('index.php/' + contextPath + '/management/settings/website');
			cy.get('#plugins-button').click();
			cy.get('tr#' + pluginRowId + ' a.show_extras').click();
			cy.get('a[id^=' + pluginRowId + '-settings-button]').click();
			cy.waitJQuery();
		}

		function assertUnauthorizedDeletion(username, password) {
			cy.get('@secondDeleteRequest').then((deleteRequest) => {
				cy.login(username, password, 'publicknowledge');
				cy.visit('index.php/publicknowledge/user/profile');
				cy.get('#profileTabs').find('li a').contains('Roles').click();
				cy.get('#rolesForm input[name="csrfToken"]').invoke('val').then((csrfToken) => {
					cy.request({
						method: 'POST',
						url: deleteRequest.url,
						form: true,
						body: {csrfToken: csrfToken},
						failOnStatusCode: false
					}).then((response) => {
						if (response.status === 200) {
							expect(response.body.status).to.eq(false);
						} else {
							expect(response.status).to.eq(403);
						}
					});
				});
			});
		}

		cy.login('admin', 'admin');
		cy.visit('index.php/' + secondJournalPath + '/management/settings/website');
		cy.get('#plugins-button').click();
		cy.get('input[id^=select-cell-selectionofreviewinginterests]').check();
		cy.get('tr#' + pluginRowId + ' a.show_extras').click();
		cy.get('a[id^=' + pluginRowId + '-settings-button]').click();
		cy.waitJQuery();
		cy.get('a[id^=component-plugins-generic-selectionofreviewinginterests-controllers-grid-interestoptionsgrid-addOption-button-]')
			.contains('Add option')
			.click();
		cy.get('input[id^=optionName-]').clear().type(secondContextOption, {delay: 0});
		cy.get('#interestOptionForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();
		cy.contains('tr.gridRow', secondContextOption).then(($row) => {
			cy.wrap($row).find('a.show_extras').click();
			cy.wrap($row).next('tr.row_controls')
				.find('a[id*="-deleteOption-button-"]')
				.then(($deleteLink) => {
				const handler = Cypress.$.pkp.classes.Handler.getHandler($deleteLink);
				const requestOptions = handler.linkActionRequest_.getOptions();
				const url = new URL(requestOptions.remoteAction, window.location.origin);
				cy.wrap({
					url: requestOptions.remoteAction,
					optionId: url.searchParams.get('optionId')
				}).as('secondDeleteRequest');
			});
		});

		cy.login('agallego', null, secondJournalPath);
		cy.visit('index.php/' + secondJournalPath + '/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();
		cy.get('#rolesForm').then(($form) => {
			Cypress.$('<input>', {
				type: 'hidden',
				name: 'interests[]',
				value: publicContextOption
			}).appendTo($form);
		});
		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.contains('Select only the predefined reviewing interests.').should('be.visible');

		cy.visit('index.php/' + secondJournalPath + '/user/profile');
		cy.get('#profileTabs').find('li a').contains('Roles').click();
		cy.waitJQuery();
		cy.get('.interests .tagit-new input').click().type('{downarrow}{enter}');
		cy.get('.interests .tagit-label').contains(secondContextOption).should('exist');
		cy.get('#rolesForm > .formButtons > button[id^=submitFormButton]').click();
		cy.waitJQuery();

		assertUnauthorizedDeletion('dbuskins', null);
		assertUnauthorizedDeletion('securitycommonuser', 'security-test-password');

		cy.get('@secondDeleteRequest').then((secondDeleteRequest) => {
			cy.login('dbarnes', null, 'publicknowledge');
			openPluginSettings('publicknowledge');
			cy.get('a[id*="-deleteOption-button-"]').first().then(($deleteLink) => {
				const handler = Cypress.$.pkp.classes.Handler.getHandler($deleteLink);
				const requestOptions = handler.linkActionRequest_.getOptions();
				const crossContextUrl = requestOptions.remoteAction.replace(
					/optionId=[^&]*/,
					'optionId=' + secondDeleteRequest.optionId
				);
				cy.request({
					method: 'POST',
					url: crossContextUrl,
					form: true,
					body: {csrfToken: requestOptions.csrfToken}
				}).its('body.status').should('eq', false);
			});
		});

		cy.login('admin', 'admin');
		openPluginSettings(secondJournalPath);
		cy.contains('tr.gridRow', secondContextOption).should('exist');
	});
});
